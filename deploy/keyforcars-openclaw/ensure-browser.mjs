import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const target = 'https://business.hanpanel.com.tr/admin/login';
const binary = resolve('node_modules/.bin/openclaw');
const args = ['browser', '--browser-profile', 'keyforcars'];
const json = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
  if (!response.ok) throw new Error('Local browser or gateway unavailable');
  return response.json();
};
const run = (...command) => execFileSync(process.execPath, [binary, ...args, ...command], { stdio: 'inherit', timeout: 25000 });

const gateway = await json('http://127.0.0.1:18789/healthz');
if (gateway.status !== 'live') throw new Error('OpenClaw gateway is not ready');
let tabs = await json('http://127.0.0.1:18800/json/list').catch(() => null);
if (!Array.isArray(tabs)) {
  run('start');
  tabs = await json('http://127.0.0.1:18800/json/list');
}
if (!tabs.some((tab) => tab.type === 'page' && tab.url.startsWith('https://business.hanpanel.com.tr/admin/'))) {
  run('open', target);
}
