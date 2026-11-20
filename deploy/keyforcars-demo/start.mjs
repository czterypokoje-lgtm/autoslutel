import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

export function demoEnvironment(env, cwd) {
  for (const suffix of ['', '.local', '.production', '.production.local', '.development', '.development.local']) {
    if (existsSync(cwd + '/.env' + suffix)) throw new Error('Move application .env files outside the demo checkout.');
  }
  const ref = env.DEMO_SUPABASE_PROJECT_REF;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!/^[a-z0-9]{20}$/.test(ref ?? '') || url !== 'https://' + ref + '.supabase.co') {
    throw new Error('The dedicated demo Supabase project reference must match its URL.');
  }
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Demo Supabase credentials are missing.');
  const port = env.DEMO_PORT || '3017';
  if (!/^\d{4,5}$/.test(port) || Number(port) > 65535) throw new Error('Invalid demo port.');
  const allowed = ['PATH', 'Path', 'SystemRoot', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  return {
    childEnv: { ...Object.fromEntries(allowed.filter((key) => env[key] !== undefined).map((key) => [key, env[key]])),
      CRM_INSTALL: 'keyforcars', KFC_DEMO_MODE: '1', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
    port,
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const command = process.argv[2];
  if (command !== 'build' && command !== 'start') throw new Error('Use build or start.');
  const { childEnv, port } = demoEnvironment(process.env, process.cwd());
  const args = command === 'build'
    ? ['node_modules/next/dist/bin/next', 'build', '--webpack']
    : ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', port];
  if (command === 'build') {
    const catalog = spawn(process.execPath, ['scripts/build-catalog.mjs'], { stdio: 'inherit', env: childEnv });
    catalog.once('exit', (code) => {
      if (code === 0) run(args);
      else process.exitCode = code ?? 1;
    });
  } else {
    run(args);
  }
  function run(argv) {
    const child = spawn(process.execPath, argv, {
      stdio: 'inherit', env: command === 'build' ? { ...childEnv, NODE_OPTIONS: '--max-old-space-size=2048' } : childEnv,
    });
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
    child.once('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGTERM' ? 0 : 1); });
  }
}
