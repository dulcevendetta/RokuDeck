export const ALLOWED_ECP_KEYS = [
  'Home',
  'Rev',
  'Fwd',
  'Play',
  'Select',
  'Left',
  'Right',
  'Down',
  'Up',
  'Back',
  'InstantReplay',
  'Info',
  'Backspace',
  'Search',
  'Enter',
  'VolumeDown',
  'VolumeMute',
  'VolumeUp',
  'PowerOff',
  'PowerOn',
  'Power',
  'ChannelUp',
  'ChannelDown',
  'InputTuner',
  'InputHDMI1',
  'InputHDMI2',
  'InputHDMI3',
  'InputHDMI4',
  'InputAV1',
  'FindRemote',
  'ClosedCaption',
] as const;

export type EcpKey = (typeof ALLOWED_ECP_KEYS)[number];

export interface RokuApp {
  id: string;
  name: string;
  type: 'appl' | 'tvin' | 'menu';
  version: string;
  category?: string;
  accentHex?: string;
}

export interface RokuMediaState {
  state: 'play' | 'pause' | 'stop' | 'buffer' | 'none';
  title?: string;
  subtitle?: string;
  positionMs: number;
  durationMs: number;
  appName?: string;
}

export interface RokuInputConfig {
  key: 'InputHDMI1' | 'InputHDMI2' | 'InputHDMI3' | 'InputHDMI4' | 'InputAV1' | 'InputTuner';
  defaultLabel: string;
  customLabel: string;
}

export interface RokuDevice {
  id: string;
  name: string;
  host: string;
  port: number;
  modelName: string;
  modelNumber: string;
  softwareVersion: string;
  serialNumber: string;
  isTv: boolean;
  powerMode: 'PowerOn' | 'DisplayOff' | 'Headless';
  networkType: 'wifi' | 'ethernet';
  volume: number;
  muted: boolean;
  activeAppId: string;
  activeAppName: string;
  activeInput: string;
  mode: 'live' | 'simulator';
  online: boolean;
  lastSyncedAt: string;
  apps: RokuApp[];
  pinnedAppIds: string[];
  media: RokuMediaState;
  inputs: RokuInputConfig[];
}

export interface MacroStep {
  id: string;
  type: 'key' | 'launch' | 'delay';
  value: string;
  label: string;
}

export interface RokuMacro {
  id: string;
  name: string;
  description: string;
  steps: MacroStep[];
}

export interface CommandResult {
  id: string;
  timestamp: string;
  deviceName: string;
  endpoint: string;
  ok: boolean;
  statusText: string;
}

export type WorkspaceTab = 'remote' | 'channels' | 'macros' | 'windows';
