import dgram from 'node:dgram';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type {Request, Response} from 'express';
import {ALLOWED_ECP_KEYS, type RokuApp} from './src/shared/rokuTypes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const ALLOWED_KEY_SET = new Set<string>(ALLOWED_ECP_KEYS);

interface ValidatedTarget {
  host: string;
  port: number;
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  // Block unspecified 0.0.0.0/8, loopback 127.0.0.0/8, link-local/cloud metadata 169.254.0.0/16, multicast/reserved >= 224
  if (a === 0 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a >= 224) return true;
  // Block carrier-grade NAT 100.64.0.0/10 (includes Alibaba metadata 100.100.100.200)
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function validateRokuTarget(rawHost: unknown, rawPort: unknown): ValidatedTarget | null {
  if (typeof rawHost !== 'string') return null;
  const host = rawHost.trim();
  if (!host || host.length > 253) return null;

  const lower = host.toLowerCase();
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.includes('metadata') ||
    lower.includes('internal')
  ) {
    return null;
  }

  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const localHostnameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.local$/;

  if (ipv4Regex.test(host)) {
    if (isBlockedIpv4(host)) return null;
  } else if (!localHostnameRegex.test(host)) {
    return null;
  }

  const parsedPort = rawPort === undefined || rawPort === null || rawPort === '' ? 8060 : Number(rawPort);
  if (!Number.isInteger(parsedPort) || parsedPort < 8060 || parsedPort > 8090) {
    return null;
  }

  return {host, port: parsedPort};
}

function extractXmlTag(xml: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<${escaped}>([\\s\\S]*?)</${escaped}>`, 'i'));
  return match ? decodeXmlEntities(match[1].trim()) : '';
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseAppsXml(xml: string): RokuApp[] {
  const apps: RokuApp[] = [];
  const regex = /<app\s+([^>]*)>([\s\S]*?)<\/app>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const attrs = match[1];
    const name = decodeXmlEntities(match[2].trim());
    const idMatch = attrs.match(/id="([^"]+)"/i);
    const typeMatch = attrs.match(/type="([^"]+)"/i);
    const versionMatch = attrs.match(/version="([^"]+)"/i);
    if (idMatch && name) {
      const rawType = typeMatch?.[1] ?? 'appl';
      const normalizedType: RokuApp['type'] =
        rawType === 'tvin' ? 'tvin' : rawType === 'menu' ? 'menu' : 'appl';
      apps.push({
        id: idMatch[1],
        name,
        type: normalizedType,
        version: versionMatch?.[1] ?? '1.0',
      });
    }
  }
  return apps;
}

function parseActiveAppXml(xml: string): {id: string; name: string} {
  const match = xml.match(/<app(?:\s+([^>]*))?>([\s\S]*?)<\/app>/i);
  if (!match) {
    return {id: '', name: 'Home Screen'};
  }
  const attrs = match[1] ?? '';
  const idMatch = attrs.match(/id="([^"]+)"/i);
  return {
    id: idMatch?.[1] ?? '',
    name: decodeXmlEntities(match[2].trim()) || 'Home Screen',
  };
}

function parseMediaPlayerXml(xml: string): {
  state: 'play' | 'pause' | 'stop' | 'buffer' | 'none';
  positionMs: number;
  durationMs: number;
  appName: string;
} {
  const stateMatch = xml.match(/<player[^>]*state="([^"]+)"/i);
  const rawState = (stateMatch?.[1] ?? 'none').toLowerCase();
  const state =
    rawState === 'play' || rawState === 'pause' || rawState === 'stop' || rawState === 'buffer'
      ? rawState
      : 'none';
  const posText = extractXmlTag(xml, 'position');
  const durText = extractXmlTag(xml, 'duration');
  const pluginMatch = xml.match(/<plugin[^>]*name="([^"]+)"/i);

  const parseMs = (val: string): number => {
    const num = parseInt(val.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(num) ? num : 0;
  };

  return {
    state,
    positionMs: parseMs(posText),
    durationMs: parseMs(durText),
    appName: pluginMatch?.[1] ? decodeXmlEntities(pluginMatch[1]) : '',
  };
}

async function fetchRokuText(target: ValidatedTarget, endpointPath: string, method: 'GET' | 'POST' = 'GET'): Promise<string> {
  const url = `http://${target.host}:${target.port}${endpointPath}`;
  const response = await fetch(url, {
    method,
    redirect: 'error',
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) {
    throw new Error(`Roku responded with HTTP ${response.status}`);
  }
  return response.text();
}

async function fetchDeviceSummary(target: ValidatedTarget) {
  const deviceInfoXml = await fetchRokuText(target, '/query/device-info', 'GET');
  if (!deviceInfoXml.includes('<device-info')) {
    throw new Error('Target did not return a valid Roku ECP device-info XML response');
  }

  const [appsXml, activeAppXml, mediaXml] = await Promise.all([
    fetchRokuText(target, '/query/apps', 'GET').catch(() => ''),
    fetchRokuText(target, '/query/active-app', 'GET').catch(() => ''),
    fetchRokuText(target, '/query/media-player', 'GET').catch(() => ''),
  ]);

  const friendlyName =
    extractXmlTag(deviceInfoXml, 'user-device-name') ||
    extractXmlTag(deviceInfoXml, 'friendly-device-name') ||
    extractXmlTag(deviceInfoXml, 'model-name') ||
    `Roku TV (${target.host})`;
  const modelName = extractXmlTag(deviceInfoXml, 'model-name') || 'Roku TV';
  const modelNumber = extractXmlTag(deviceInfoXml, 'model-number') || 'Unknown';
  const softwareVersion = extractXmlTag(deviceInfoXml, 'software-version') || '12.5';
  const serialNumber = extractXmlTag(deviceInfoXml, 'serial-number') || `ROKU-${target.host}`;
  const isTv = extractXmlTag(deviceInfoXml, 'is-tv').toLowerCase() === 'true';
  const rawPower = extractXmlTag(deviceInfoXml, 'power-mode');
  const powerMode: 'PowerOn' | 'DisplayOff' | 'Headless' =
    rawPower === 'DisplayOff' ? 'DisplayOff' : rawPower === 'Headless' ? 'Headless' : 'PowerOn';
  const networkType: 'wifi' | 'ethernet' =
    extractXmlTag(deviceInfoXml, 'network-type').toLowerCase() === 'ethernet' ? 'ethernet' : 'wifi';

  const apps = appsXml ? parseAppsXml(appsXml) : [];
  const activeApp = activeAppXml ? parseActiveAppXml(activeAppXml) : {id: '', name: 'Home Screen'};
  const media = mediaXml
    ? parseMediaPlayerXml(mediaXml)
    : {state: 'none' as const, positionMs: 0, durationMs: 0, appName: ''};

  return {
    id: serialNumber || `${target.host}:${target.port}`,
    name: friendlyName,
    host: target.host,
    port: target.port,
    modelName,
    modelNumber,
    softwareVersion,
    serialNumber,
    isTv,
    powerMode,
    networkType,
    volume: 24,
    muted: false,
    activeAppId: activeApp.id,
    activeAppName: activeApp.name,
    activeInput: activeApp.id.startsWith('tvinput.') ? activeApp.name : 'Streaming',
    mode: 'live' as const,
    online: true,
    lastSyncedAt: new Date().toISOString(),
    apps,
    pinnedAppIds: apps.slice(0, 8).map((a) => a.id),
    media,
  };
}

function runSsdpDiscovery(timeoutMs = 2000): Promise<ValidatedTarget[]> {
  return new Promise((resolve) => {
    const found = new Map<string, ValidatedTarget>();
    const socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
    let closed = false;

    const finish = () => {
      if (closed) return;
      closed = true;
      try {
        socket.close();
      } catch {
        // Ignore close errors
      }
      resolve(Array.from(found.values()));
    };

    const timer = setTimeout(finish, timeoutMs);

    socket.on('error', () => {
      clearTimeout(timer);
      finish();
    });

    socket.on('message', (msg) => {
      const text = msg.toString('utf8');
      const locationMatch = text.match(/LOCATION:\s*http:\/\/([^:\r\n/]+):(\d+)/i);
      if (locationMatch) {
        const candidate = validateRokuTarget(locationMatch[1], Number(locationMatch[2]));
        if (candidate) {
          found.set(`${candidate.host}:${candidate.port}`, candidate);
        }
      }
    });

    socket.bind(() => {
      try {
        socket.setBroadcast(true);
        const searchPayload = Buffer.from(
          'M-SEARCH * HTTP/1.1\r\n' +
            'HOST: 239.255.255.250:1900\r\n' +
            'MAN: "ssdp:discover"\r\n' +
            'ST: roku:ecp\r\n' +
            'MX: 2\r\n\r\n'
        );
        socket.send(searchPayload, 0, searchPayload.length, 1900, '239.255.255.250');
      } catch {
        clearTimeout(timer);
        finish();
      }
    });
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '64kb'}));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ok: true, service: 'rokudeck-ecp-proxy'});
  });

  app.post('/api/roku/discover', async (_req: Request, res: Response) => {
    try {
      const targets = await runSsdpDiscovery(2000);
      const devices = (
        await Promise.all(
          targets.map(async (target) => {
            try {
              return await fetchDeviceSummary(target);
            } catch {
              return null;
            }
          })
        )
      ).filter((d): d is NonNullable<typeof d> => d !== null);

      res.json({
        devices,
        scannedCount: targets.length,
        note:
          devices.length === 0
            ? 'No Roku TVs responded to local SSDP multicast from this server environment. To control physical TVs on your home Wi-Fi, run RokuDeck locally on your Windows PC or enter your Roku TV IP directly when running locally.'
            : `Discovered ${devices.length} Roku device(s) on the local network.`,
      });
    } catch (error) {
      res.status(500).json({
        devices: [],
        error: error instanceof Error ? error.message : 'Discovery failed',
      });
    }
  });

  app.post('/api/roku/connect', async (req: Request, res: Response) => {
    const target = validateRokuTarget(req.body?.host, req.body?.port);
    if (!target) {
      res.status(400).json({
        error: 'Enter a valid local IPv4 address (e.g. 192.168.1.42) or .local hostname and port (8060-8090).',
      });
      return;
    }

    try {
      const device = await fetchDeviceSummary(target);
      res.json({device});
    } catch (error) {
      res.status(502).json({
        error:
          error instanceof Error
            ? `Could not reach Roku TV at ${target.host}:${target.port} (${error.message}). Ensure "Control by mobile apps" is enabled on the TV and RokuDeck is running on the same local network.`
            : 'Failed to connect to Roku TV',
      });
    }
  });

  app.post('/api/roku/keypress', async (req: Request, res: Response) => {
    const target = validateRokuTarget(req.body?.host, req.body?.port);
    const key = typeof req.body?.key === 'string' ? req.body.key.trim() : '';

    if (!target) {
      res.status(400).json({error: 'Invalid Roku host or port'});
      return;
    }

    let endpoint = '';
    if (ALLOWED_KEY_SET.has(key)) {
      endpoint = `/keypress/${key}`;
    } else if (key.startsWith('Lit_') && key.length >= 5) {
      const chars = [...key.slice(4)];
      const char = chars[0];
      if (!char) {
        res.status(400).json({error: 'Invalid literal character'});
        return;
      }
      endpoint = `/keypress/Lit_${encodeURIComponent(char)}`;
    } else {
      res.status(400).json({error: 'Unsupported Roku ECP key'});
      return;
    }

    try {
      await fetchRokuText(target, endpoint, 'POST');
      res.json({ok: true, endpoint});
    } catch (error) {
      res.status(502).json({
        ok: false,
        endpoint,
        error: error instanceof Error ? error.message : 'Failed to send ECP command',
      });
    }
  });

  app.post('/api/roku/input-text', async (req: Request, res: Response) => {
    const target = validateRokuTarget(req.body?.host, req.body?.port);
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const submit = Boolean(req.body?.submit);

    if (!target) {
      res.status(400).json({error: 'Invalid Roku host or port'});
      return;
    }
    if (!text || text.length > 120) {
      res.status(400).json({error: 'Text must be between 1 and 120 characters'});
      return;
    }

    try {
      const chars = [...text];
      for (const ch of chars) {
        await fetchRokuText(target, `/keypress/Lit_${encodeURIComponent(ch)}`, 'POST');
      }
      if (submit) {
        await fetchRokuText(target, '/keypress/Enter', 'POST');
      }
      res.json({ok: true, length: chars.length});
    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to send text to Roku TV',
      });
    }
  });

  app.post('/api/roku/launch', async (req: Request, res: Response) => {
    const target = validateRokuTarget(req.body?.host, req.body?.port);
    const appId = typeof req.body?.appId === 'string' ? req.body.appId.trim() : '';

    if (!target) {
      res.status(400).json({error: 'Invalid Roku host or port'});
      return;
    }
    if (!/^[a-zA-Z0-9._-]{1,48}$/.test(appId)) {
      res.status(400).json({error: 'Invalid Roku channel ID'});
      return;
    }

    try {
      const endpoint = `/launch/${encodeURIComponent(appId)}`;
      await fetchRokuText(target, endpoint, 'POST');
      res.json({ok: true, endpoint});
    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to launch channel',
      });
    }
  });

  app.get('/api/roku/icon', async (req: Request, res: Response) => {
    const target = validateRokuTarget(req.query.host, req.query.port);
    const appId = typeof req.query.appId === 'string' ? req.query.appId.trim() : '';

    if (!target || !/^[a-zA-Z0-9._-]{1,48}$/.test(appId)) {
      res.status(400).end();
      return;
    }

    try {
      const response = await fetch(`http://${target.host}:${target.port}/query/icon/${encodeURIComponent(appId)}`, {
        redirect: 'error',
        signal: AbortSignal.timeout(2000),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.startsWith('image/')) {
        res.status(404).end();
        return;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch {
      res.status(404).end();
    }
  });

  if (IS_PROD) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    if (fs.existsSync(path.resolve(__dirname, 'dist')) && IS_PROD) {
      console.log(`RokuDeck Windows Controller running (production) on http://0.0.0.0:${PORT}`);
    } else {
      console.log(`RokuDeck Windows Controller running on http://0.0.0.0:${PORT}`);
    }
  });
}

startServer();
