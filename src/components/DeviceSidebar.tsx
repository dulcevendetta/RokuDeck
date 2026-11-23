import {Power, RefreshCw, Search, Trash2, Tv} from 'lucide-react';
import type {RokuDevice} from '../shared/rokuTypes.ts';

interface DeviceSidebarProps {
  devices: RokuDevice[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  onScanNetwork: () => void;
  isScanning: boolean;
  scanMessage: string | null;
  onRefreshDevice: (device: RokuDevice) => void;
  onRemoveDevice: (id: string) => void;
  onQuickPower: (device: RokuDevice) => void;
}

export function DeviceSidebar({
  devices,
  selectedDeviceId,
  onSelectDevice,
  onScanNetwork,
  isScanning,
  scanMessage,
  onRefreshDevice,
  onRemoveDevice,
  onQuickPower,
}: DeviceSidebarProps) {
  return (
    <aside className="w-full lg:w-[272px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0D121B] flex flex-col">
      <div className="p-4 border-b border-white/[0.07] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-display font-semibold text-slate-100">Roku TVs</h2>
          <span className="text-xs text-slate-400 tabular-nums">{devices.length} saved</span>
        </div>

        <button
          type="button"
          onClick={onScanNetwork}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-100 bg-[#171F2E] hover:bg-[#1E293B] disabled:opacity-60 border border-white/[0.08] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <Search className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Network...' : 'Scan Local Network'}</span>
        </button>

        {scanMessage && (
          <p className="text-xs leading-relaxed text-slate-400">{scanMessage}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {devices.map((device) => {
          const isSelected = device.id === selectedDeviceId;
          const isPowerOn = device.powerMode === 'PowerOn';
          return (
            <div
              key={device.id}
              className={`group rounded-lg border transition-colors duration-150 ${
                isSelected
                  ? 'bg-[#171F2F] border-violet-500/40'
                  : 'bg-transparent border-transparent hover:bg-[#131A26] hover:border-white/[0.06]'
              }`}
            >
              <div className="flex items-start gap-2.5 p-3">
                <button
                  type="button"
                  onClick={() => onSelectDevice(device.id)}
                  className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Tv className={`w-4 h-4 shrink-0 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium text-slate-100 truncate">{device.name}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 truncate">
                    <span className="font-mono tabular-nums">{device.host}</span>
                    <span aria-hidden="true">·</span>
                    <span>{device.mode === 'simulator' ? 'Simulator' : 'Live LAN'}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    <span className={isPowerOn ? 'text-emerald-400' : 'text-amber-400'}>
                      {isPowerOn ? 'Power On' : 'Standby'}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-slate-400 truncate">{device.activeAppName || 'Home Screen'}</span>
                  </div>
                </button>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onQuickPower(device)}
                    title={isPowerOn ? 'Turn TV Off' : 'Turn TV On'}
                    aria-label={isPowerOn ? `Turn ${device.name} Off` : `Turn ${device.name} On`}
                    className={`p-1.5 rounded-md border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      isPowerOn
                        ? 'text-slate-300 border-white/[0.08] hover:text-rose-300 hover:border-rose-500/40 bg-[#121824]'
                        : 'text-amber-300 border-amber-500/30 hover:text-emerald-300 hover:border-emerald-500/40 bg-[#121824]'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => onRefreshDevice(device)}
                      title="Sync TV State"
                      aria-label={`Sync ${device.name} state`}
                      className="p-1.5 rounded-md border border-white/[0.08] text-slate-400 hover:text-slate-100 bg-[#121824] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {devices.length > 1 && isSelected && (
                    <button
                      type="button"
                      onClick={() => onRemoveDevice(device.id)}
                      title="Remove TV"
                      aria-label={`Remove ${device.name}`}
                      className="p-1.5 rounded-md border border-white/[0.08] text-slate-400 hover:text-rose-400 hover:border-rose-500/40 bg-[#121824] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/[0.07] text-xs text-slate-400 space-y-1">
        <p className="font-medium text-slate-300">Roku ECP Port 8060</p>
        <p className="leading-relaxed">
          Physical TVs on your Wi-Fi respond when RokuDeck runs locally on your Windows PC.
        </p>
      </div>
    </aside>
  );
}
