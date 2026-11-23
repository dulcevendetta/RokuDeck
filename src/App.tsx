import {useCallback, useEffect, useMemo, useState} from 'react';
import {AddDeviceModal} from './components/AddDeviceModal.tsx';
import {ChannelsView} from './components/ChannelsView.tsx';
import {DeviceSidebar} from './components/DeviceSidebar.tsx';
import {MacrosView} from './components/MacrosView.tsx';
import {RemotePad} from './components/RemotePad.tsx';
import {TopBar} from './components/TopBar.tsx';
import {TvTelemetryPanel} from './components/TvTelemetryPanel.tsx';
import {WindowsAppView} from './components/WindowsAppView.tsx';
import {DEFAULT_INPUTS, INITIAL_MACROS, INITIAL_SIMULATOR_DEVICES} from './data/simulatorPresets.ts';
import type {
  CommandResult,
  EcpKey,
  RokuApp,
  RokuDevice,
  RokuInputConfig,
  RokuMacro,
  WorkspaceTab,
} from './shared/rokuTypes.ts';

const STORAGE_KEYS = {
  devices: 'rokudeck.devices.v1',
  selectedId: 'rokudeck.selectedDeviceId.v1',
  macros: 'rokudeck.macros.v1',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [devices, setDevices] = useState<RokuDevice[]>(() => {
    const saved = loadStored<RokuDevice[]>(STORAGE_KEYS.devices, INITIAL_SIMULATOR_DEVICES);
    return Array.isArray(saved) && saved.length > 0 ? saved : INITIAL_SIMULATOR_DEVICES;
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() =>
    loadStored<string>(STORAGE_KEYS.selectedId, INITIAL_SIMULATOR_DEVICES[0].id)
  );
  const [macros, setMacros] = useState<RokuMacro[]>(() =>
    loadStored<RokuMacro[]>(STORAGE_KEYS.macros, INITIAL_MACROS)
  );

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('remote');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [keyboardCapture, setKeyboardCapture] = useState(true);
  const [runningMacroId, setRunningMacroId] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<CommandResult | null>(null);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId) || devices[0],
    [devices, selectedDeviceId]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.devices, JSON.stringify(devices));
    } catch {
      // Ignore storage quota errors
    }
  }, [devices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.selectedId, JSON.stringify(selectedDevice.id));
    } catch {
      // Ignore storage quota errors
    }
  }, [selectedDevice.id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.macros, JSON.stringify(macros));
    } catch {
      // Ignore storage quota errors
    }
  }, [macros]);

  // Advance simulated playback timeline smoothly when playing in Simulator mode
  useEffect(() => {
    const timer = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.mode !== 'simulator' || d.powerMode !== 'PowerOn' || d.media.state !== 'play') {
            return d;
          }
          const nextPos = d.media.positionMs + 1000;
          return {
            ...d,
            media: {
              ...d.media,
              positionMs:
                d.media.durationMs > 0 && nextPos >= d.media.durationMs ? 0 : nextPos,
            },
          };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const recordCommand = useCallback(
    (deviceName: string, endpoint: string, ok: boolean, statusText: string) => {
      setLastCommand({
        id: `${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
        deviceName,
        endpoint,
        ok,
        statusText,
      });
    },
    []
  );

  const applySimulatorKey = useCallback((deviceId: string, key: EcpKey) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id !== deviceId) return dev;
        const next = {...dev, lastSyncedAt: new Date().toISOString()};

        if (key === 'Power') {
          next.powerMode = dev.powerMode === 'PowerOn' ? 'DisplayOff' : 'PowerOn';
          if (next.powerMode === 'DisplayOff' && next.media.state === 'play') {
            next.media = {...next.media, state: 'pause'};
          }
        } else if (key === 'PowerOn') {
          next.powerMode = 'PowerOn';
        } else if (key === 'PowerOff') {
          next.powerMode = 'DisplayOff';
          if (next.media.state === 'play') {
            next.media = {...next.media, state: 'pause'};
          }
        } else if (key === 'VolumeUp') {
          next.muted = false;
          next.volume = Math.min(100, dev.volume + 2);
        } else if (key === 'VolumeDown') {
          next.muted = false;
          next.volume = Math.max(0, dev.volume - 2);
        } else if (key === 'VolumeMute') {
          next.muted = !dev.muted;
        } else if (key === 'Home') {
          next.powerMode = 'PowerOn';
          next.activeAppId = '';
          next.activeAppName = 'Home Screen';
          next.activeInput = 'Streaming';
          next.media = {state: 'none', positionMs: 0, durationMs: 0};
        } else if (key === 'Play') {
          if (dev.media.state === 'play') {
            next.media = {...dev.media, state: 'pause'};
          } else if (dev.media.state === 'pause' || dev.media.state === 'stop') {
            next.media = {...dev.media, state: 'play'};
          }
        } else if (key === 'Fwd' && dev.media.state !== 'none') {
          next.media = {
            ...dev.media,
            positionMs: Math.min(dev.media.durationMs || 3600000, dev.media.positionMs + 30000),
          };
        } else if (key === 'Rev' && dev.media.state !== 'none') {
          next.media = {
            ...dev.media,
            positionMs: Math.max(0, dev.media.positionMs - 30000),
          };
        } else if (key.startsWith('Input')) {
          const inp = dev.inputs.find((i) => i.key === key);
          const label = inp ? `${inp.defaultLabel} · ${inp.customLabel}` : key.replace('Input', '');
          next.powerMode = 'PowerOn';
          next.activeInput = key;
          next.activeAppId = '';
          next.activeAppName = label;
          next.media = {state: 'none', positionMs: 0, durationMs: 0};
        }
        return next;
      })
    );
  }, []);

  const sendKeyPress = useCallback(
    async (key: EcpKey, targetDevice: RokuDevice = selectedDevice) => {
      if (targetDevice.mode === 'simulator') {
        applySimulatorKey(targetDevice.id, key);
        recordCommand(targetDevice.name, `POST /keypress/${key}`, true, 'Simulator OK');
        return;
      }

      setIsBusy(true);
      try {
        const res = await fetch('/api/roku/keypress', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({host: targetDevice.host, port: targetDevice.port, key}),
        });
        const data = await res.json();
        if (res.ok) {
          applySimulatorKey(targetDevice.id, key);
          recordCommand(targetDevice.name, `POST /keypress/${key}`, true, '200 OK');
        } else {
          recordCommand(
            targetDevice.name,
            `POST /keypress/${key}`,
            false,
            data.error || `HTTP ${res.status}`
          );
        }
      } catch {
        recordCommand(targetDevice.name, `POST /keypress/${key}`, false, 'Network Error');
      } finally {
        setIsBusy(false);
      }
    },
    [applySimulatorKey, recordCommand, selectedDevice]
  );

  const sendText = useCallback(
    async (text: string, submit: boolean) => {
      if (selectedDevice.mode === 'simulator') {
        recordCommand(
          selectedDevice.name,
          `POST /keypress/Lit_ (${text.length} chars)`,
          true,
          'Simulator OK'
        );
        return;
      }

      setIsBusy(true);
      try {
        const res = await fetch('/api/roku/input-text', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            host: selectedDevice.host,
            port: selectedDevice.port,
            text,
            submit,
          }),
        });
        const data = await res.json();
        recordCommand(
          selectedDevice.name,
          `POST /keypress/Lit_ (${text.length} chars)`,
          res.ok,
          res.ok ? '200 OK' : data.error || 'Error'
        );
      } catch {
        recordCommand(selectedDevice.name, 'POST /keypress/Lit_', false, 'Network Error');
      } finally {
        setIsBusy(false);
      }
    },
    [recordCommand, selectedDevice]
  );

  const launchApp = useCallback(
    async (app: RokuApp, targetDevice: RokuDevice = selectedDevice) => {
      const updateLocal = () => {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === targetDevice.id
              ? {
                  ...d,
                  powerMode: 'PowerOn',
                  activeAppId: app.id,
                  activeAppName: app.name,
                  activeInput: app.type === 'tvin' ? app.name : 'Streaming',
                  media:
                    app.type === 'appl'
                      ? {
                          state: 'play',
                          title: `Now Streaming on ${app.name}`,
                          subtitle: '4K HDR · Stereo PCM',
                          positionMs: 12000,
                          durationMs: 2880000,
                          appName: app.name,
                        }
                      : {state: 'none', positionMs: 0, durationMs: 0},
                  lastSyncedAt: new Date().toISOString(),
                }
              : d
          )
        );
      };

      if (targetDevice.mode === 'simulator') {
        updateLocal();
        recordCommand(targetDevice.name, `POST /launch/${app.id} (${app.name})`, true, 'Simulator OK');
        return;
      }

      setIsBusy(true);
      try {
        const res = await fetch('/api/roku/launch', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            host: targetDevice.host,
            port: targetDevice.port,
            appId: app.id,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          updateLocal();
          recordCommand(targetDevice.name, `POST /launch/${app.id} (${app.name})`, true, '200 OK');
        } else {
          recordCommand(targetDevice.name, `POST /launch/${app.id}`, false, data.error || 'Error');
        }
      } catch {
        recordCommand(targetDevice.name, `POST /launch/${app.id}`, false, 'Network Error');
      } finally {
        setIsBusy(false);
      }
    },
    [recordCommand, selectedDevice]
  );

  const handleScanNetwork = useCallback(async (): Promise<RokuDevice[]> => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch('/api/roku/discover', {method: 'POST'});
      const data = await res.json();
      const found: RokuDevice[] = (data.devices || []).map((dev: RokuDevice) => ({
        ...dev,
        inputs: DEFAULT_INPUTS.map((inp) => ({...inp})),
      }));

      if (found.length > 0) {
        setDevices((prev) => {
          const existingHosts = new Set(prev.map((d) => `${d.host}:${d.port}`));
          const additions = found.filter((d) => !existingHosts.has(`${d.host}:${d.port}`));
          return [...additions, ...prev];
        });
        setSelectedDeviceId(found[0].id);
      }
      setScanMessage(data.note || `Scan finished: ${found.length} device(s) found.`);
      return found;
    } catch {
      setScanMessage('Network discovery could not run.');
      return [];
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleRefreshDevice = useCallback(
    async (device: RokuDevice) => {
      if (device.mode === 'simulator') {
        recordCommand(device.name, 'GET /query/device-info', true, 'Simulator Synced');
        return;
      }
      try {
        const res = await fetch('/api/roku/connect', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({host: device.host, port: device.port}),
        });
        const data = await res.json();
        if (res.ok && data.device) {
          setDevices((prev) =>
            prev.map((d) =>
              d.id === device.id
                ? {
                    ...data.device,
                    id: d.id,
                    name: d.name,
                    inputs: d.inputs,
                    pinnedAppIds: d.pinnedAppIds.length > 0 ? d.pinnedAppIds : data.device.pinnedAppIds,
                  }
                : d
            )
          );
          recordCommand(device.name, 'GET /query/device-info', true, 'Synced');
        } else {
          recordCommand(device.name, 'GET /query/device-info', false, data.error || 'Unreachable');
        }
      } catch {
        recordCommand(device.name, 'GET /query/device-info', false, 'Network Error');
      }
    },
    [recordCommand]
  );

  const handleAddDevice = useCallback((newDev: RokuDevice) => {
    setDevices((prev) => {
      const filtered = prev.filter((d) => d.id !== newDev.id);
      return [newDev, ...filtered];
    });
    setSelectedDeviceId(newDev.id);
  }, []);

  const handleRemoveDevice = useCallback(
    (id: string) => {
      setDevices((prev) => {
        if (prev.length <= 1) return prev;
        const remaining = prev.filter((d) => d.id !== id);
        if (selectedDeviceId === id && remaining[0]) {
          setSelectedDeviceId(remaining[0].id);
        }
        return remaining;
      });
    },
    [selectedDeviceId]
  );

  const handleTogglePin = useCallback(
    (appId: string) => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id !== selectedDevice.id) return d;
          const exists = d.pinnedAppIds.includes(appId);
          return {
            ...d,
            pinnedAppIds: exists
              ? d.pinnedAppIds.filter((id) => id !== appId)
              : [...d.pinnedAppIds, appId],
          };
        })
      );
    },
    [selectedDevice.id]
  );

  const handleUpdateInputLabel = useCallback(
    (key: RokuInputConfig['key'], customLabel: string) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === selectedDevice.id
            ? {
                ...d,
                inputs: d.inputs.map((inp) => (inp.key === key ? {...inp, customLabel} : inp)),
              }
            : d
        )
      );
    },
    [selectedDevice.id]
  );

  const handleRunMacro = useCallback(
    async (macro: RokuMacro) => {
      setRunningMacroId(macro.id);
      try {
        for (const step of macro.steps) {
          if (step.type === 'delay') {
            const ms = Math.min(3000, Math.max(100, Number(step.value) || 400));
            await new Promise((r) => setTimeout(r, ms));
          } else if (step.type === 'key') {
            await sendKeyPress(step.value as EcpKey);
          } else if (step.type === 'launch') {
            const app = selectedDevice.apps.find((a) => a.id === step.value) || {
              id: step.value,
              name: step.label.replace('Launch ', ''),
              type: 'appl' as const,
              version: '1.0',
            };
            await launchApp(app);
          }
        }
      } finally {
        setRunningMacroId(null);
      }
    },
    [launchApp, selectedDevice.apps, sendKeyPress]
  );

  // Global Windows Keyboard Shortcut Listener when Remote tab is active
  useEffect(() => {
    if (!keyboardCapture || activeTab !== 'remote' || isAddModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      let mapped: EcpKey | null = null;
      if (e.key === 'ArrowUp') mapped = 'Up';
      else if (e.key === 'ArrowDown') mapped = 'Down';
      else if (e.key === 'ArrowLeft') mapped = 'Left';
      else if (e.key === 'ArrowRight') mapped = 'Right';
      else if (e.key === 'Enter') mapped = 'Select';
      else if (e.key === 'Escape' || e.key === 'Backspace') mapped = 'Back';
      else if (e.key === ' ') mapped = 'Play';
      else if (e.key === 'h' || e.key === 'H') mapped = 'Home';
      else if (e.key === 'm' || e.key === 'M') mapped = 'VolumeMute';
      else if (e.key === '+' || e.key === '=') mapped = 'VolumeUp';
      else if (e.key === '-' || e.key === '_') mapped = 'VolumeDown';

      if (mapped) {
        e.preventDefault();
        void sendKeyPress(mapped);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isAddModalOpen, keyboardCapture, sendKeyPress]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <DeviceSidebar
          devices={devices}
          selectedDeviceId={selectedDevice.id}
          onSelectDevice={setSelectedDeviceId}
          onScanNetwork={handleScanNetwork}
          isScanning={isScanning}
          scanMessage={scanMessage}
          onRefreshDevice={handleRefreshDevice}
          onRemoveDevice={handleRemoveDevice}
          onQuickPower={(dev) => void sendKeyPress('Power', dev)}
        />

        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1160px] mx-auto">
            {activeTab === 'remote' && (
              <div className="flex flex-col xl:flex-row items-start gap-6">
                <RemotePad
                  device={selectedDevice}
                  onKeyPress={(key) => void sendKeyPress(key)}
                  onSendText={(text, submit) => void sendText(text, submit)}
                  keyboardCapture={keyboardCapture}
                  onToggleKeyboardCapture={() => setKeyboardCapture((v) => !v)}
                  isBusy={isBusy}
                />
                <TvTelemetryPanel
                  device={selectedDevice}
                  onKeyPress={(key) => void sendKeyPress(key)}
                  onLaunchApp={(app) => void launchApp(app)}
                  onUpdateInputLabel={handleUpdateInputLabel}
                  onOpenChannelsTab={() => setActiveTab('channels')}
                  lastCommand={lastCommand}
                />
              </div>
            )}

            {activeTab === 'channels' && (
              <ChannelsView
                device={selectedDevice}
                onLaunchApp={(app) => void launchApp(app)}
                onTogglePin={handleTogglePin}
              />
            )}

            {activeTab === 'macros' && (
              <MacrosView
                device={selectedDevice}
                macros={macros}
                runningMacroId={runningMacroId}
                onRunMacro={(macro) => void handleRunMacro(macro)}
                onAddMacro={(macro) => setMacros((prev) => [macro, ...prev])}
                onDeleteMacro={(id) => setMacros((prev) => prev.filter((m) => m.id !== id))}
                onKeyPress={(key) => void sendKeyPress(key)}
              />
            )}

            {activeTab === 'windows' && <WindowsAppView device={selectedDevice} />}
          </div>
        </main>
      </div>

      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDevice={handleAddDevice}
        onScanNetwork={handleScanNetwork}
      />
    </div>
  );
}
