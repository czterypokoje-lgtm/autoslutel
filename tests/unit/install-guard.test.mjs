// The Supabase install guard (src/lib/supabase/installGuard.ts). Pure: the
// database marker is read through a fake fetch, nothing leaves this process.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INSTALL_MARKER, LIVE_PROJECT, installMarkerProblem, parseAllowList, supabaseProjectProblem, supabaseProjectRef,
} from '../../src/lib/supabase/installGuard.ts';

const KFC_REF = 'lzdwxkhlscsitstxdgar';
const KFC_URL = `https://${KFC_REF}.supabase.co`;
const AS24_URL = `https://${LIVE_PROJECT}.supabase.co`;
const TEST_URL = 'https://ysrebelulbmnbzyvnsic.supabase.co';

test('project ref is read from the Supabase URL', () => {
  assert.equal(supabaseProjectRef(KFC_URL), KFC_REF);
  assert.equal(supabaseProjectRef(`${AS24_URL}/rest/v1/`), 'utctfircycpjmpjqmtmm');
  assert.equal(supabaseProjectRef('http://127.0.0.1:54321'), null);
  assert.equal(supabaseProjectRef('not a url'), null);
});

test('runs only on the Autosleutel24 live project, never on KeyForCars', () => {
  assert.equal(LIVE_PROJECT, 'utctfircycpjmpjqmtmm');
  assert.equal(supabaseProjectProblem({ urls: [AS24_URL], allowed: [] }), null);
  // The 21 Nov 2026 incident: an Autosleutel24 setup on the KeyForCars database.
  assert.match(supabaseProjectProblem({ urls: [KFC_URL], allowed: [] }), /live database van KeyForCars/);
});

test('every configured URL is checked, empty ones are skipped', () => {
  assert.equal(supabaseProjectProblem({ urls: ['', undefined, null], allowed: [] }), null);
  assert.match(supabaseProjectProblem({ urls: [AS24_URL, KFC_URL], allowed: [] }), /KeyForCars/);
  assert.match(supabaseProjectProblem({ urls: ['::nope'], allowed: [] }), /ongeldig/);
});

test('test projects need the allow-list; KeyForCars never passes it', () => {
  assert.match(supabaseProjectProblem({ urls: [TEST_URL], allowed: [] }), /CRM_SUPABASE_TEST_PROJECTS/);
  const allowed = parseAllowList(' ysrebelulbmnbzyvnsic, 127.0.0.1 ');
  assert.deepEqual(allowed, ['ysrebelulbmnbzyvnsic', '127.0.0.1']);
  assert.equal(supabaseProjectProblem({ urls: [TEST_URL], allowed }), null);
  assert.equal(supabaseProjectProblem({ urls: ['http://127.0.0.1:54321'], allowed }), null);
  assert.match(
    supabaseProjectProblem({ urls: [KFC_URL], allowed: [KFC_REF] }),
    /live database van KeyForCars/,
  );
});

const reply = (status, body) => async () => new Response(JSON.stringify(body), { status });
const marker = (fetchImpl, required = false) =>
  installMarkerProblem({ url: AS24_URL, anonKey: 'anon', required, fetchImpl });

test('database marker must say autosleutel24 when present', async () => {
  assert.equal(INSTALL_MARKER, 'autosleutel24');
  assert.equal(await marker(reply(200, 'autosleutel24')), null);
  assert.match(await marker(reply(200, 'keyforcars')), /gemarkeerd als "keyforcars"/);
});

test('missing marker passes unless required; unreachable database never blocks', async () => {
  assert.equal(await marker(reply(200, null)), null);
  assert.equal(await marker(reply(404, { code: 'PGRST202' })), null);
  assert.match(await marker(reply(200, null), true), /CRM_REQUIRE_INSTALL_MARKER/);
  assert.match(await marker(reply(404, { code: 'PGRST202' }), true), /CRM_REQUIRE_INSTALL_MARKER/);
  assert.equal(await marker(reply(500, {}), true), null);
  assert.equal(await marker(async () => { throw new Error('offline'); }, true), null);
});

test('marker request goes to the RPC with the anon key', async () => {
  let seen;
  await installMarkerProblem({
    url: `${AS24_URL}/`, anonKey: 'anon-key', required: false,
    fetchImpl: async (url, init) => { seen = { url, init }; return new Response('null'); },
  });
  assert.equal(seen.url, `${AS24_URL}/rest/v1/rpc/crm_install_profile`);
  assert.equal(seen.init.headers.apikey, 'anon-key');
});
