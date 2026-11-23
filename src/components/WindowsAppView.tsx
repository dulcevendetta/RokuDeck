import {useMemo, useState} from 'react';
import {Check, Copy, Download, Keyboard, Monitor, Wifi} from 'lucide-react';
import type {RokuDevice} from '../shared/rokuTypes.ts';
import {
  generateDesktopAppLauncherBat,
  generateSingleFileWindowsBat,
  generateWindowsWpfScript,
} from '../utils/windowsAppGenerator.ts';

interface WindowsAppViewProps {
  device: RokuDevice;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const KEYBOARD_SHORTCUTS = [
  {keys: 'Arrow Keys', action: 'Navigate D-Pad (Up / Down / Left / Right)'},
  {keys: 'Enter', action: 'OK / Select'},
  {keys: 'Esc or Backspace', action: 'Back'},
  {keys: 'H', action: 'Home Screen'},
  {keys: 'Space', action: 'Play / Pause'},
  {keys: '+ / -', action: 'Volume Up / Volume Down'},
  {keys: 'M', action: 'Mute / Unmute'},
];

export function WindowsAppView({device}: WindowsAppViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const singleFileBat = useMemo(
    () => generateSingleFileWindowsBat(device.host, device.port),
    [device.host, device.port]
  );
  const ps1Source = useMemo(
    () => generateWindowsWpfScript(device.host, device.port),
    [device.host, device.port]
  );
  const desktopWebBat = useMemo(() => generateDesktopAppLauncherBat(), []);

  const handleCopyPs1 = async () => {
    try {
      await navigator.clipboard.writeText(ps1Source);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 space-y-2">
        <h1 className="text-xl font-display font-bold text-slate-50">
          Windows 10 / 11 Desktop Execution
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Browsers hosted on the cloud cannot reach private home Wi-Fi IP addresses like{' '}
          <span className="font-mono text-slate-200">{device.host}</span>. Run RokuDeck directly on
          your Windows PC using the single-file standalone Windows app below—it launches right from
          your Downloads folder with no Node.js or extra project files required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Option 1: Single-File Zero-Install Native Windows WPF GUI */}
        <section className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-violet-400">
              <Monitor className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Recommended · Standalone 1-File App
              </span>
            </div>
            <h2 className="text-lg font-display font-semibold text-slate-100">
              RokuDeck-Windows.bat (Runs Directly from Downloads)
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              A single self-contained Windows 10/11 WPF desktop GUI file. Just download and
              double-click <span className="font-mono text-slate-200">RokuDeck-Windows.bat</span>—no
              Node.js, npm, or <span className="font-mono text-slate-200">package.json</span> needed.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
              <li>1. Built-in SSDP local Wi-Fi auto-discovery for all Roku TVs</li>
              <li>2. Pre-configured with your active TV IP ({device.host}:{device.port})</li>
              <li>3. Includes D-Pad, Volume, HDMI 1-3, Live TV, Text Input & Channel Launchers</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadTextFile('RokuDeck-Windows.bat', singleFileBat)}
              className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download RokuDeck-Windows.bat</span>
            </button>
            <button
              type="button"
              onClick={() => downloadTextFile('RokuDeck-Windows.ps1', ps1Source)}
              className="px-4 py-2.5 rounded-lg bg-[#182030] hover:bg-[#222D44] border border-white/[0.08] text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download .ps1 Only</span>
            </button>
          </div>
        </section>

        {/* Option 2: Full Web App in Native Edge App Window */}
        <section className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sky-400">
              <Wifi className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                For Local Source Repo · Requires Node.js
              </span>
            </div>
            <h2 className="text-lg font-display font-semibold text-slate-100">
              Run Full Web Suite from Source Folder
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              If you have the RokuDeck source repository folder (containing{' '}
              <span className="font-mono text-slate-200">package.json</span> and{' '}
              <span className="font-mono text-slate-200">server.ts</span>) on your PC, place this
              launcher inside that project folder to boot the local server and open an Edge app window.
            </p>
            <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-white/[0.07] font-mono text-xs text-slate-300 space-y-1">
              <p>npm install</p>
              <p>npm run build &amp;&amp; npm start</p>
              <p className="text-slate-400">msedge --app=http://localhost:3000</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadTextFile('Start-RokuDeck-Desktop.bat', desktopWebBat)}
              className="px-4 py-2.5 rounded-lg bg-[#182030] hover:bg-[#222D44] border border-white/[0.08] text-slate-100 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Start-RokuDeck-Desktop.bat</span>
            </button>
          </div>
        </section>
      </div>

      {/* Roku TV Network Setting + Windows Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-100">
            <Keyboard className="w-4 h-4 text-violet-400" />
            <h2 className="text-base font-display font-semibold">Windows Keyboard Bindings</h2>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {KEYBOARD_SHORTCUTS.map((item) => (
              <div key={item.keys} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#0B0F17] border border-white/[0.08] text-slate-200 whitespace-nowrap">
                  {item.keys}
                </span>
                <span className="text-slate-300 text-right">{item.action}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#121824] border border-white/[0.08] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-display font-semibold text-slate-100">
              Roku TV Setup & Script Preview
            </h2>
            <button
              type="button"
              onClick={handleCopyPs1}
              className="px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#222D44] border border-white/[0.08] text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy PowerShell'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            On your Roku TV, verify: <span className="text-slate-200">Settings &gt; System &gt; Advanced system settings &gt; Control by mobile apps &gt; Network access: Enabled</span>.
          </p>

          <pre className="h-44 overflow-auto p-3.5 rounded-lg bg-[#0B0F17] border border-white/[0.07] text-[11px] font-mono text-slate-300 leading-relaxed">
            {ps1Source.slice(0, 1400)}...
          </pre>
        </section>
      </div>
    </div>
  );
}
