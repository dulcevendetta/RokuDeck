import {useState} from 'react';
import {Loader2, Plus, Search, X} from 'lucide-react';
import type {RokuDevice} from '../shared/rokuTypes.ts';
import {DEFAULT_INPUTS, SIMULATOR_APPS} from '../data/simulatorPresets.ts';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (device: RokuDevice) => void;
  onScanNetwork: () => Promise<RokuDevice[]>;
}

export function AddDeviceModal({isOpen, onClose, onAddDevice, onScanNetwork}: AddDeviceModalProps) {
  const [host, setHost] = useState('192.168.1.50');
  const [port, setPort] = useState('8060');
  const [customName, setCustomName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<RokuDevice[]>([]);

  if (!isOpen) return null;

  const handleConnectLive = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsConnecting(true);

    try {
      const res = await fetch('/api/roku/connect', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({host: host.trim(), port: Number(port) || 8060}),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not reach Roku TV on this network.');
        return;
      }

      const liveDevice: RokuDevice = {
        ...data.device,
        name: customName.trim() || data.device.name,
        inputs: DEFAULT_INPUTS.map((inp) => ({...inp})),
      };
      onAddDevice(liveDevice);
      onClose();
    } catch {
      setErrorMessage('Network error contacting RokuDeck local ECP proxy.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAddSimulator = () => {
    const cleanHost = host.trim() || '192.168.1.50';
    const simDevice: RokuDevice = {
      id: `sim-${Date.now()}`,
      name: customName.trim() || `Roku TV (${cleanHost})`,
      host: cleanHost,
      port: Number(port) || 8060,
      modelName: 'TCL 55S555',
      modelNumber: 'C148X',
      softwareVersion: '13.1.4',
      serialNumber: `SIM-${Math.floor(100000 + Math.random() * 900000)}`,
      isTv: true,
      powerMode: 'PowerOn',
      networkType: 'wifi',
      volume: 22,
      muted: false,
      activeAppId: '',
      activeAppName: 'Home Screen',
      activeInput: 'Streaming',
      mode: 'simulator',
      online: true,
      lastSyncedAt: new Date().toISOString(),
      apps: SIMULATOR_APPS,
      pinnedAppIds: ['12', '837', '13', '13535'],
      media: {state: 'none', positionMs: 0, durationMs: 0},
      inputs: DEFAULT_INPUTS.map((inp) => ({...inp})),
    };
    onAddDevice(simDevice);
    onClose();
  };

  const handleScan = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const found = await onScanNetwork();
      setDiscovered(found);
      if (found.length === 0) {
        setErrorMessage(
          'No Roku TVs answered SSDP discovery from this server. Use Simulator TV to preview, or run RokuDeck locally on Windows.'
        );
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-tv-title"
    >
      <div className="w-full max-w-lg bg-[#121824] border border-white/[0.1] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="add-tv-title" className="text-lg font-display font-bold text-slate-50">
              Add Roku TV
            </h2>
            <p className="text-xs text-slate-400">
              Connect via local IP address (port 8060) or scan your Wi-Fi via SSDP.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-[#0B0F17] border border-white/[0.08]">
          <div className="text-xs text-slate-300">
            <p className="font-medium text-slate-100">Auto-Discover via SSDP</p>
            <p className="text-slate-400">Finds Roku TVs on the same subnet as this host.</p>
          </div>
          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="px-3.5 py-2 rounded-lg bg-[#182030] hover:bg-[#222D44] border border-white/[0.08] text-xs font-semibold text-slate-100 flex items-center gap-2 shrink-0"
          >
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{isScanning ? 'Scanning...' : 'Scan LAN'}</span>
          </button>
        </div>

        {discovered.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-300">Discovered TVs</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {discovered.map((tv) => (
                <button
                  key={tv.id}
                  type="button"
                  onClick={() => {
                    onAddDevice({...tv, inputs: DEFAULT_INPUTS.map((i) => ({...i}))});
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-lg bg-[#171F2F] hover:bg-[#1E293D] border border-white/[0.08] flex items-center justify-between text-left"
                >
                  <span className="text-sm font-medium text-slate-100">{tv.name}</span>
                  <span className="text-xs font-mono text-slate-400">{tv.host}:{tv.port}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleConnectLive} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label htmlFor="roku-ip" className="block text-xs font-medium text-slate-300">
                Roku TV IP Address
              </label>
              <input
                id="roku-ip"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.42"
                required
                className="w-full h-10 px-3 text-sm font-mono bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="roku-port" className="block text-xs font-medium text-slate-300">
                ECP Port
              </label>
              <input
                id="roku-port"
                type="number"
                min={8060}
                max={8090}
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="roku-name" className="block text-xs font-medium text-slate-300">
              Display Name (Optional)
            </label>
            <input
              id="roku-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Den 65-inch Roku TV"
              className="w-full h-10 px-3 text-sm bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {errorMessage && (
            <p className="text-xs leading-relaxed text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg p-3">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleAddSimulator}
              className="px-4 py-2 rounded-lg bg-[#182030] hover:bg-[#222D44] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
            >
              Add Virtual TV (Simulator)
            </button>
            <button
              type="submit"
              disabled={isConnecting}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-2 transition-colors"
            >
              {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isConnecting ? 'Connecting...' : 'Connect Live TV'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
