import {useState} from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Delete,
  FastForward,
  Home,
  Keyboard,
  LocateFixed,
  Pause,
  Play,
  Power,
  Rewind,
  RotateCcw,
  Search,
  Send,
  Star,
  Subtitles,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {EcpKey, RokuDevice} from '../shared/rokuTypes.ts';

interface RemotePadProps {
  device: RokuDevice;
  onKeyPress: (key: EcpKey) => void;
  onSendText: (text: string, submit: boolean) => void;
  keyboardCapture: boolean;
  onToggleKeyboardCapture: () => void;
  isBusy: boolean;
}

export function RemotePad({
  device,
  onKeyPress,
  onSendText,
  keyboardCapture,
  onToggleKeyboardCapture,
  isBusy,
}: RemotePadProps) {
  const [textBuffer, setTextBuffer] = useState('');
  const isPowerOn = device.powerMode === 'PowerOn';
  const isPlaying = device.media.state === 'play';

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textBuffer.trim()) return;
    onSendText(textBuffer, true);
    setTextBuffer('');
  };

  const btnBase =
    'flex items-center justify-center rounded-lg border border-white/[0.08] bg-[#182030] hover:bg-[#212C42] active:scale-[0.96] text-slate-100 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 select-none';

  return (
    <section
      aria-label="Roku Remote Control"
      className="bg-[#121824] border border-white/[0.08] rounded-xl p-5 flex flex-col gap-5 w-full max-w-[360px] mx-auto lg:mx-0 shrink-0"
    >
      {/* Top Power & Utility Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onKeyPress('Power')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            isPowerOn
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200 hover:bg-rose-900/70'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/70'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isPowerOn ? 'Power Off' : 'Power On'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onKeyPress('ClosedCaption')}
            title="Toggle Closed Captions"
            aria-label="Closed Captions"
            className={`${btnBase} w-10 h-9`}
          >
            <Subtitles className="w-4 h-4 text-slate-300" />
          </button>
          <button
            type="button"
            onClick={() => onKeyPress('FindRemote')}
            title="Ping Physical Roku Remote"
            aria-label="Find Physical Remote"
            className={`${btnBase} w-10 h-9`}
          >
            <LocateFixed className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Back & Home */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onKeyPress('Back')}
          className={`${btnBase} h-11 gap-2 text-sm font-medium`}
        >
          <ArrowLeft className="w-4 h-4 text-slate-300" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('Home')}
          className={`${btnBase} h-11 gap-2 text-sm font-medium`}
        >
          <Home className="w-4 h-4 text-slate-300" />
          <span>Home</span>
        </button>
      </div>

      {/* Precision D-Pad */}
      <div className="py-2 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-2.5 w-[228px]">
          <div />
          <button
            type="button"
            onClick={() => onKeyPress('Up')}
            aria-label="Up"
            className={`${btnBase} h-14`}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <div />

          <button
            type="button"
            onClick={() => onKeyPress('Left')}
            aria-label="Left"
            className={`${btnBase} h-14`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => onKeyPress('Select')}
            aria-label="OK Select"
            className="h-14 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-[0.95] text-white font-display font-semibold text-sm tracking-wide border border-violet-400/40 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => onKeyPress('Right')}
            aria-label="Right"
            className={`${btnBase} h-14`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div />
          <button
            type="button"
            onClick={() => onKeyPress('Down')}
            aria-label="Down"
            className={`${btnBase} h-14`}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div />
        </div>
      </div>

      {/* Utility Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => onKeyPress('InstantReplay')}
          title="Instant Replay"
          className={`${btnBase} h-10 gap-1.5 text-xs font-medium`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
          <span>Replay</span>
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('Search')}
          title="Open Roku Search"
          className={`${btnBase} h-10 gap-1.5 text-xs font-medium`}
        >
          <Search className="w-3.5 h-3.5 text-slate-300" />
          <span>Search</span>
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('Info')}
          title="Options / Star"
          className={`${btnBase} h-10 gap-1.5 text-xs font-medium`}
        >
          <Star className="w-3.5 h-3.5 text-slate-300" />
          <span>Options</span>
        </button>
      </div>

      {/* Media Playback */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => onKeyPress('Rev')}
          aria-label="Rewind"
          className={`${btnBase} h-11`}
        >
          <Rewind className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('Play')}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className={`${btnBase} h-11 gap-1.5 text-xs font-semibold`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('Fwd')}
          aria-label="Fast Forward"
          className={`${btnBase} h-11`}
        >
          <FastForward className="w-4 h-4" />
        </button>
      </div>

      {/* Volume & Channel Rocker */}
      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => onKeyPress('VolumeDown')}
          aria-label="Volume Down"
          className={`${btnBase} h-11 gap-1 text-xs font-medium`}
        >
          <Volume1 className="w-4 h-4 text-slate-300" />
          <span>-</span>
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('VolumeMute')}
          aria-label="Mute"
          className={`${btnBase} h-11 ${device.muted ? 'border-amber-500/50 text-amber-300' : ''}`}
        >
          <VolumeX className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('VolumeUp')}
          aria-label="Volume Up"
          className={`${btnBase} h-11 gap-1 text-xs font-medium`}
        >
          <Volume2 className="w-4 h-4 text-slate-300" />
          <span>+</span>
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('ChannelDown')}
          aria-label="Channel Down"
          className={`${btnBase} h-11 text-xs font-medium text-slate-300`}
        >
          CH -
        </button>
        <button
          type="button"
          onClick={() => onKeyPress('ChannelUp')}
          aria-label="Channel Up"
          className={`${btnBase} h-11 text-xs font-medium text-slate-300`}
        >
          CH +
        </button>
      </div>

      {/* Windows Keyboard Text Entry to Roku TV */}
      <div className="pt-3 border-t border-white/[0.07] space-y-2.5">
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={textBuffer}
            onChange={(e) => setTextBuffer(e.target.value)}
            placeholder="Type text to TV search bar..."
            aria-label="Send text to Roku TV"
            className="flex-1 min-w-0 h-10 px-3 text-sm bg-[#0B0F17] border border-white/[0.1] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={() => onKeyPress('Backspace')}
            title="Send Backspace"
            aria-label="Backspace on TV"
            className={`${btnBase} w-10 h-10 shrink-0`}
          >
            <Delete className="w-4 h-4 text-slate-300" />
          </button>
          <button
            type="submit"
            disabled={isBusy || !textBuffer.trim()}
            title="Send text & Enter"
            aria-label="Send text to TV"
            className="h-10 px-3.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

        <button
          type="button"
          onClick={onToggleKeyboardCapture}
          className={`w-full h-9 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            keyboardCapture
              ? 'bg-violet-600/15 border-violet-500/40 text-violet-200'
              : 'bg-[#0B0F17] border-white/[0.08] text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Windows Keyboard Shortcuts</span>
          </span>
          <span>{keyboardCapture ? 'Enabled' : 'Disabled'}</span>
        </button>
      </div>
    </section>
  );
}
