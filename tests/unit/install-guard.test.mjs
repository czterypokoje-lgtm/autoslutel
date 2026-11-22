// The Supabase install guard (src/lib/supabase/installGuard.ts). Pure: the
// database marker is read through a fake fetch, nothing leaves this process.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_PROJECTS, installMarkerProblem, parseAllowList, supabaseProjectProblem, supabaseProjectRef,
} from '../../src/lib/supabase/installGuard.ts';

const KFC_URL = `https://${LIVE_PROJECTS.keyforcars}.supabase.co`;
const AS24_URL = `https://${LIVE_PROJECTS.autosleutel24}.supabase.co`;
const TEST_URL = 'https://ysrebelulbmnbzyvnsic.supabase.co';

test('project ref is read from the Supabase URL', () => {
  assert.equal(supabaseProjectRef(KFC_URL), 'lzdwxkhlscsitstxdgar');
  assert.equal(supabaseProjectRef(`${AS24_URL}/rest/v1/`), 'utctfircycpjmpjqmtmm');
  assert.equal(supabaseProjectRef('http://127.0.0.1:54321'), null);
  assert.equal(supabaseProjectRef('not a url'), null);
});

test('each install runs only on its own live project', () => {
  assert.equal(supabaseProjectProblem({ install: 'keyforcars', urls: [KFC_URL], allowed: [] }), null);
  assert.equal(supabaseProjectProblem({ install: 'autosleutel24', urls: [AS24_URL], allowed: [] }), null);
  // Today's incident: an Autosleutel24 setup (CRM_INSTALL unset) on the KeyForCars database.
  assert.match(supabaseProjectProblem({ install: 'autosleutel24', urls: [KFC_URL], allowed: [] }), /live database van keyforcars/);
  assert.match(supabaseProjectProblem({ install: 'keyforcars', urls: [AS24_URL], allowed: [] }), /live database van autosleutel24/);
});

test('every configured URL is checked, empty ones are skipped', () => {
  assert.equal(supabaseProjectProblem({ install: 'keyforcars', urls: ['', undefined, null], allowed: [] }), null);
  assert.match(supabaseProjectProblem({ install: 'keyforcars', urls: [KFC_URL, AS24_URL], allowed: [] }), /autosleutel24/);
  assert.match(supabaseProjectProblem({ install: 'keyforcars', urls: ['::nope'], allowed: [] }), /ongeldig/);
});

test('test projects need the allow-list; the other live project never passes it', () => {
  assert.match(supabaseProjectProblem({ install: 'autosleutel24', urls: [TEST_URL], allowed: [] }), /CRM_SUPABASE_TEST_PROJECTS/);
  const allowed = parseAllowList(' ysrebelulbmnbzyvnsic, 127.0.0.1 ');
  assert.deepEqual(allowed, ['ysrebelulbmnbzyvnsic', '127.0.0.1']);
  assert.equal(supabaseProjectProblem({ install: 'autosleutel24', urls: [TEST_URL], allowed }), null);
  assert.equal(supabaseProjectProblem({ install: 'keyforcars', urls: ['http://127.0.0.1:54321'], allowed }), null);
  assert.match(
    supabaseProjectProblem({ install: 'autosleutel24', urls: [KFC_URL], allowed: [LIVE_PROJECTS.keyforcars] }),
    /live database van keyforcars/,
  );
});

const reply = (status, body) => async () => new Response(JSON.stringify(body), { status });
const marker = (install, fetchImpl, required = false) =>
  installMarkerProblem({ install, url: KFC_URL, anonKey: 'anon', required, fetchImpl });

test('database marker must name this install when present', async () => {
  assert.equal(await marker('keyforcars', reply(200, 'keyforcars')), null);
  assert.match(await marker('autosleutel24', reply(200, 'keyforcars')), /gemarkeerd als "keyforcars"/);
});

test('missing marker passes unless required; unreachable database never blocks', async () => {
  assert.equal(await marker('keyforcars', reply(200, null)), null);
  assert.equal(await marker('keyforcars', reply(404, { code: 'PGRST202' })), null);
  assert.match(await marker('keyforcars', reply(200, null), true), /CRM_REQUIRE_INSTALL_MARKER/);
  assert.match(await marker('keyforcars', reply(404, { code: 'PGRST202' }), true), /CRM_REQUIRE_INSTALL_MARKER/);
  assert.equal(await marker('keyforcars', reply(500, {}), true), null);
  assert.equal(await marker('keyforcars', async () => { throw new Error('offline'); }, true), null);
});

test('marker request goes to the RPC with the anon key', async () => {
  let seen;
  await installMarkerProblem({
    install: 'keyforcars', url: `${KFC_URL}/`, anonKey: 'anon-key', required: false,
    fetchImpl: async (url, init) => { seen = { url, init }; return new Response('null'); },
  });
  assert.equal(seen.url, `${KFC_URL}/rest/v1/rpc/crm_install_profile`);
  assert.equal(seen.init.headers.apikey, 'anon-key');
});
