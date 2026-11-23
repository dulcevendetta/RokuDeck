import type {WorkspaceTab} from '../shared/rokuTypes.ts';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenAddModal: () => void;
}

const NAV_ITEMS: Array<{id: WorkspaceTab; label: string}> = [
  {id: 'remote', label: 'Remote'},
  {id: 'channels', label: 'Channels'},
  {id: 'macros', label: 'Inputs & Macros'},
  {id: 'windows', label: 'Windows App'},
];

export function TopBar({activeTab, onSelectTab, onOpenAddModal}: TopBarProps) {
  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#0E131D] px-6 flex items-center justify-between gap-8 shrink-0">
      <button
        type="button"
        onClick={() => onSelectTab('remote')}
        className="text-lg font-display font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
      >
        RokuDeck
      </button>

      <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Primary workspace navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative py-4 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                isActive ? 'text-slate-50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-violet-500 rounded-t" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 active:scale-[0.98] rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Add Roku TV
        </button>
      </div>
    </header>
  );
}
