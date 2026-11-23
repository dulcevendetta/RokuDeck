import {useState} from 'react';
import {Check, Edit3, Monitor, Play, Tv, Volume2} from 'lucide-react';
import type {CommandResult, EcpKey, RokuApp, RokuDevice, RokuInputConfig} from '../shared/rokuTypes.ts';

interface TvTelemetryPanelProps {
  device: RokuDevice;
  onKeyPress: (key: EcpKey) => void;
  onLaunchApp: (app: RokuApp) => void;
  onUpdateInputLabel: (key: RokuInputConfig['key'], customLabel: string) => void;
  onOpenChannelsTab: () => void;
  lastCommand: CommandResult | null;
}

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
}

export function TvTelemetryPanel({
  device,
  onKeyPress,
  onLaunchApp,
  onUpdateInputLabel,
  onOpenChannelsTab,
  lastCommand,
}: TvTelemetryPanelProps) {
  const [editingInputs, setEditingInputs] = useState(false);

  const pinnedApps = device.pinnedAppIds
    .map((id) => device.apps.find((a) => a.id === id))
    .filter((a): a is RokuApp => Boolean(a));

  const progressPct =
    device.media.durationMs > 0
      ? Math.min(100, Math.round((device.media.positionMs / device.media.durationMs) * 100))
      : 0;

  return (
    <div className="flex-1 min-w-0 space-y-6">
      {/* Active TV Summary Surface */}
      <section className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-display font-bold text-slate-50 tracking-tight truncate">
              {device.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-mono tabular-nums text-slate-300">
                {device.host}:{device.port}
              </span>
              <span aria-hidden="true">·</span>
              <span>{device.modelName}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Roku OS {device.softwareVersion}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{device.networkType}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="text-right">
              <p className="text-slate-400">Display State</p>
              <p className={`font-semibold ${device.powerMode === 'PowerOn' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {device.powerMode === 'PowerOn' ? 'Power On' : 'Standby'}
              </p>
            </div>
            <div className="h-7 w-px bg-white/[0.08]" aria-hidden="true" />
            <div className="text-right">
              <p className="text-slate-400">Control Mode</p>
              <p className="font-semibold text-slate-200">
                {device.mode === 'simulator' ? 'Simulator' : 'Live ECP'}
              </p>
            </div>
          </div>
        </div>

        {/* Now Playing / Active App Bar */}
        <div className="pt-4 border-t border-white/[0.07] grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">Active Channel or Input</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1A2233] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Tv className="w-5 h-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {device.activeAppName || 'Home Screen'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {device.media.state !== 'none'
                    ? `${device.media.state === 'play' ? 'Playing' : 'Paused'}${
                        device.media.subtitle ? ` · ${device.media.subtitle}` : ''
                      }`
                    : 'Ready for input'}
                </p>
              </div>
            </div>

            {device.media.state !== 'none' && device.media.durationMs > 0 && (
              <div className="pt-1 space-y-1.5">
                <div className="h-1.5 w-full bg-[#0B0F17] rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full bg-violet-500 transition-all duration-300"
                    style={{width: `${progressPct}%`}}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                  <span>{formatDuration(device.media.positionMs)}</span>
                  <span>{formatDuration(device.media.durationMs)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Audio Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Output</span>
              </span>
              <span className="font-mono tabular-nums text-slate-200 font-medium">
                {device.muted ? 'Muted' : `${device.volume}%`}
              </span>
            </div>

            <div className="h-2 w-full bg-[#0B0F17] rounded-full overflow-hidden border border-white/[0.05]">
              <div
                className={`h-full transition-all duration-150 ${
                  device.muted ? 'bg-amber-500/70' : 'bg-sky-400'
                }`}
                style={{width: `${device.muted ? 0 : device.volume}%`}}
              />
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onKeyPress('VolumeDown')}
                className="px-3 py-1.5 text-xs font-medium bg-[#182030] hover:bg-[#212C42] border border-white/[0.08] rounded-md text-slate-200 transition-colors"
              >
                Vol -
              </button>
              <button
                type="button"
                onClick={() => onKeyPress('VolumeMute')}
                className="px-3 py-1.5 text-xs font-medium bg-[#182030] hover:bg-[#212C42] border border-white/[0.08] rounded-md text-slate-200 transition-colors"
              >
                {device.muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={() => onKeyPress('VolumeUp')}
                className="px-3 py-1.5 text-xs font-medium bg-[#182030] hover:bg-[#212C42] border border-white/[0.08] rounded-md text-slate-200 transition-colors"
              >
                Vol +
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HDMI & Tuner Inputs */}
      <section className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-semibold text-slate-100">TV Inputs</h2>
            <p className="text-xs text-slate-400">Switch HDMI ports or Live TV tuner in one click.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingInputs((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-[#182030] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {editingInputs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{editingInputs ? 'Done Editing' : 'Rename Inputs'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {device.inputs.map((inp) => {
            const isActiveInput = device.activeInput === inp.key;
            if (editingInputs) {
              return (
                <div
                  key={inp.key}
                  className="p-3 rounded-lg bg-[#0E131D] border border-white/[0.1] space-y-1.5"
                >
                  <label className="block text-[11px] font-mono text-slate-400">{inp.defaultLabel}</label>
                  <input
                    type="text"
                    value={inp.customLabel}
                    onChange={(e) => onUpdateInputLabel(inp.key, e.target.value)}
                    maxLength={24}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#161E2E] border border-white/[0.1] rounded text-slate-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              );
            }

            return (
              <button
                key={inp.key}
                type="button"
                onClick={() => onKeyPress(inp.key)}
                className={`p-3.5 rounded-lg border text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  isActiveInput
                    ? 'bg-violet-600/15 border-violet-500/45 text-slate-50'
                    : 'bg-[#161D2C] hover:bg-[#1C2538] border-white/[0.07] text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Monitor className={`w-4 h-4 ${isActiveInput ? 'text-violet-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-mono text-slate-400">{inp.defaultLabel}</span>
                </div>
                <p className="mt-2 text-sm font-medium truncate">{inp.customLabel || inp.defaultLabel}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Pinned Quick-Launch Channels */}
      <section className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-semibold text-slate-100">Pinned Channels</h2>
            <p className="text-xs text-slate-400">Launch streaming apps directly via Roku ECP.</p>
          </div>
          <button
            type="button"
            onClick={onOpenChannelsTab}
            className="text-xs font-medium text-violet-400 hover:text-violet-300 hover:underline whitespace-nowrap shrink-0"
          >
            Browse all {device.apps.length} channels
          </button>
        </div>

        {pinnedApps.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">
            No pinned channels yet. Open the Channels tab to pin your favorites.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pinnedApps.map((app) => {
              const isRunning = device.activeAppId === app.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => onLaunchApp(app)}
                  className={`p-3 rounded-lg border text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    isRunning
                      ? 'bg-violet-600/15 border-violet-500/45 text-slate-50'
                      : 'bg-[#161D2C] hover:bg-[#1C2538] border-white/[0.07] text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{backgroundColor: app.accentHex || '#334155'}}
                    >
                      {app.name.slice(0, 2).toUpperCase()}
                    </span>
                    <Play className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="mt-2.5 text-sm font-medium truncate">{app.name}</p>
                  <p className="text-[11px] font-mono tabular-nums text-slate-400 truncate">
                    {isRunning ? 'Active now' : `ID ${app.id}`}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {lastCommand && (
          <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="font-mono">
              Last command: <span className="text-slate-200">{lastCommand.endpoint}</span>
            </span>
            <span className={lastCommand.ok ? 'text-emerald-400' : 'text-rose-400'}>
              {lastCommand.statusText} · {lastCommand.timestamp}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
