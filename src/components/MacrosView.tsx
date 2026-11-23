import {useState} from 'react';
import {Play, Plus, Trash2} from 'lucide-react';
import type {EcpKey, MacroStep, RokuDevice, RokuMacro} from '../shared/rokuTypes.ts';

interface MacrosViewProps {
  device: RokuDevice;
  macros: RokuMacro[];
  runningMacroId: string | null;
  onRunMacro: (macro: RokuMacro) => void;
  onAddMacro: (macro: RokuMacro) => void;
  onDeleteMacro: (id: string) => void;
  onKeyPress: (key: EcpKey) => void;
}

export function MacrosView({
  device,
  macros,
  runningMacroId,
  onRunMacro,
  onAddMacro,
  onDeleteMacro,
  onKeyPress,
}: MacrosViewProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [actionKey, setActionKey] = useState<EcpKey>('InputHDMI1');
  const [launchAppId, setLaunchAppId] = useState(device.apps[0]?.id || '12');
  const [includePowerOn, setIncludePowerOn] = useState(true);
  const [stepMode, setStepMode] = useState<'input' | 'launch'>('input');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const steps: MacroStep[] = [];
    if (includePowerOn) {
      steps.push({id: `${Date.now()}-1`, type: 'key', value: 'PowerOn', label: 'Power On TV'});
      steps.push({id: `${Date.now()}-2`, type: 'delay', value: '600', label: 'Wait 600ms'});
    }

    if (stepMode === 'input') {
      steps.push({
        id: `${Date.now()}-3`,
        type: 'key',
        value: actionKey,
        label: `Send ${actionKey}`,
      });
    } else {
      const appName = device.apps.find((a) => a.id === launchAppId)?.name || launchAppId;
      steps.push({
        id: `${Date.now()}-3`,
        type: 'launch',
        value: launchAppId,
        label: `Launch ${appName}`,
      });
    }

    onAddMacro({
      id: `macro-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom Windows multi-step Roku automation.',
      steps,
    });
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-50">
            Inputs & Macro Routines · {device.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Chain power, HDMI input switches, and app launches into one-click desktop routines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {device.inputs.slice(0, 4).map((inp) => (
            <button
              key={inp.key}
              type="button"
              onClick={() => onKeyPress(inp.key)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[#182030] hover:bg-[#222D44] border border-white/[0.08] text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              {inp.customLabel || inp.defaultLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          {macros.map((macro) => {
            const isRunning = runningMacroId === macro.id;
            return (
              <div
                key={macro.id}
                className="bg-[#121824] border border-white/[0.08] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <h2 className="text-base font-display font-semibold text-slate-100">{macro.name}</h2>
                  <p className="text-sm text-slate-400">{macro.description}</p>
                  <p className="text-xs font-mono text-slate-400">
                    {macro.steps.map((s) => s.label).join('  ->  ')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRunMacro(macro)}
                    disabled={Boolean(runningMacroId)}
                    className="h-10 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isRunning ? 'Running...' : 'Run Routine'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMacro(macro.id)}
                    aria-label={`Delete ${macro.name}`}
                    className="h-10 w-10 rounded-lg bg-[#182030] hover:bg-rose-950/60 border border-white/[0.08] hover:border-rose-500/40 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleCreate}
          className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 space-y-4"
        >
          <h2 className="text-base font-display font-semibold text-slate-100">Create Macro</h2>

          <div className="space-y-1.5">
            <label htmlFor="macro-name" className="block text-xs font-medium text-slate-300">
              Routine Name
            </label>
            <input
              id="macro-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Evening YouTube"
              required
              className="w-full h-10 px-3 text-sm bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="macro-desc" className="block text-xs font-medium text-slate-300">
              Description
            </label>
            <input
              id="macro-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional summary"
              className="w-full h-10 px-3 text-sm bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={includePowerOn}
              onChange={(e) => setIncludePowerOn(e.target.checked)}
              className="w-4 h-4 rounded accent-violet-600"
            />
            <span>Wake TV (PowerOn) first</span>
          </label>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-slate-300">Target Action</span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0B0F17] border border-white/[0.08] rounded-lg">
              <button
                type="button"
                onClick={() => setStepMode('input')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  stepMode === 'input' ? 'bg-[#1D2638] text-slate-100' : 'text-slate-400'
                }`}
              >
                HDMI / Key
              </button>
              <button
                type="button"
                onClick={() => setStepMode('launch')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  stepMode === 'launch' ? 'bg-[#1D2638] text-slate-100' : 'text-slate-400'
                }`}
              >
                Launch Channel
              </button>
            </div>
          </div>

          {stepMode === 'input' ? (
            <div className="space-y-1.5">
              <label htmlFor="macro-key" className="block text-xs font-medium text-slate-300">
                ECP Command
              </label>
              <select
                id="macro-key"
                value={actionKey}
                onChange={(e) => setActionKey(e.target.value as EcpKey)}
                className="w-full h-10 px-3 text-sm bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="InputHDMI1">Switch to HDMI 1</option>
                <option value="InputHDMI2">Switch to HDMI 2</option>
                <option value="InputHDMI3">Switch to HDMI 3</option>
                <option value="InputHDMI4">Switch to HDMI 4</option>
                <option value="InputTuner">Switch to Live TV</option>
                <option value="Home">Go Home</option>
                <option value="VolumeMute">Toggle Mute</option>
                <option value="PowerOff">Power Off</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="macro-app" className="block text-xs font-medium text-slate-300">
                Channel to Launch
              </label>
              <select
                id="macro-app"
                value={launchAppId}
                onChange={(e) => setLaunchAppId(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
              >
                {device.apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-10 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Save Routine</span>
          </button>
        </form>
      </div>
    </div>
  );
}
