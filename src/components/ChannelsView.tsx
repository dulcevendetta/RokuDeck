import {useMemo, useState} from 'react';
import {Pin, PinOff, Play, Search} from 'lucide-react';
import type {RokuApp, RokuDevice} from '../shared/rokuTypes.ts';

interface ChannelsViewProps {
  device: RokuDevice;
  onLaunchApp: (app: RokuApp) => void;
  onTogglePin: (appId: string) => void;
}

function AppBadge({device, app}: {device: RokuDevice; app: RokuApp}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (device.mode === 'live' && !imgFailed) {
    const iconUrl = `/api/roku/icon?host=${encodeURIComponent(device.host)}&port=${device.port}&appId=${encodeURIComponent(app.id)}`;
    return (
      <img
        src={iconUrl}
        alt={`${app.name} channel icon`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="w-11 h-11 rounded-lg object-cover border border-white/[0.1] bg-[#0B0F17] shrink-0"
      />
    );
  }

  return (
    <span
      className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-display font-bold text-white border border-white/[0.1] shrink-0"
      style={{backgroundColor: app.accentHex || '#334155'}}
    >
      {app.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function ChannelsView({device, onLaunchApp, onTogglePin}: ChannelsViewProps) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pinned' | 'appl' | 'tvin'>('all');

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return device.apps.filter((app) => {
      if (filterType === 'pinned' && !device.pinnedAppIds.includes(app.id)) return false;
      if (filterType === 'appl' && app.type !== 'appl') return false;
      if (filterType === 'tvin' && app.type !== 'tvin') return false;
      if (q && !app.name.toLowerCase().includes(q) && !app.id.includes(q)) return false;
      return true;
    });
  }, [device.apps, device.pinnedAppIds, filterType, query]);

  return (
    <div className="space-y-6">
      <div className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-50">
            Installed Channels · {device.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Launch any app on your TV or pin favorites to the main remote screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter channels..."
              aria-label="Filter installed Roku channels"
              className="h-10 pl-9 pr-3 w-56 text-sm bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-white/[0.08] rounded-lg">
            {(
              [
                {id: 'all', label: 'All'},
                {id: 'pinned', label: 'Pinned'},
                {id: 'appl', label: 'Streaming'},
                {id: 'tvin', label: 'Inputs'},
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filterType === tab.id
                    ? 'bg-[#1D2638] text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="bg-[#121824] border border-white/[0.08] rounded-xl p-12 text-center space-y-2">
          <p className="text-base font-medium text-slate-200">No channels match your filter</p>
          <p className="text-sm text-slate-400">
            Clear your search query or switch back to All channels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredApps.map((app) => {
            const isPinned = device.pinnedAppIds.includes(app.id);
            const isActive = device.activeAppId === app.id;
            return (
              <div
                key={app.id}
                className={`p-4 rounded-xl border transition-colors duration-150 flex flex-col justify-between gap-4 ${
                  isActive
                    ? 'bg-[#171F2F] border-violet-500/45'
                    : 'bg-[#121824] border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <AppBadge device={device} app={app} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-100 truncate">{app.name}</h3>
                      <p className="text-xs font-mono tabular-nums text-slate-400 truncate">
                        {app.type === 'tvin' ? 'TV Input' : `v${app.version}`} · ID {app.id}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTogglePin(app.id)}
                    title={isPinned ? 'Unpin from Remote' : 'Pin to Remote'}
                    aria-label={isPinned ? `Unpin ${app.name}` : `Pin ${app.name}`}
                    className={`p-2 rounded-lg border transition-colors shrink-0 ${
                      isPinned
                        ? 'border-violet-500/40 bg-violet-600/15 text-violet-300'
                        : 'border-white/[0.08] bg-[#182030] text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onLaunchApp(app)}
                  className="w-full h-9 rounded-lg bg-[#1A2334] hover:bg-violet-600 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 border border-white/[0.08] hover:border-violet-500 transition-colors duration-150"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Relaunch Channel' : 'Launch on TV'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
