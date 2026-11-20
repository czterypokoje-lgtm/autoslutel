import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { demoEnvironment } from './start.mjs';

const dir = mkdtempSync(join(tmpdir(), 'kfc-demo-'));
try {
  const ref = 'abcdefghijklmnopqrst';
  const env = {
    DEMO_SUPABASE_PROJECT_REF: ref, NEXT_PUBLIC_SUPABASE_URL: 'https://' + ref + '.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test', SUPABASE_SERVICE_ROLE_KEY: 'test',
    DEMO_PORT: '3317', ELEVENLABS_API_KEY: 'should-not-pass', RESEND_API_KEY: 'should-not-pass',
    WOO_KEYFORCARS_SECRET: 'should-not-pass', SENDCLOUD_SECRET_KEY: 'should-not-pass', OPENAI_API_KEY: 'should-not-pass',
  };
  const { childEnv, port } = demoEnvironment(env, dir);
  assert.equal(port, '3317');
  assert.equal(childEnv.KFC_DEMO_MODE, '1');
  for (const key of Object.keys(env).filter((key) => env[key] === 'should-not-pass')) assert.equal(childEnv[key], undefined);
  assert.throws(() => demoEnvironment({ ...env, DEMO_SUPABASE_PROJECT_REF: 'anotherproject' }, dir));
  assert.throws(() => demoEnvironment({ ...env, SUPABASE_SERVICE_ROLE_KEY: '' }, dir));
  assert.throws(() => demoEnvironment({ ...env, DEMO_PORT: '70000' }, dir));
  writeFileSync(join(dir, '.env.local'), 'KEY=value');
  assert.throws(() => demoEnvironment(env, dir));
  console.log('Demo isolation checks passed.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
