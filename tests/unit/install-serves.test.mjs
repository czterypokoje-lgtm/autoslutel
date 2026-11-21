// Which paths each install answers (src/config/install.ts servesPath, the rule
// src/proxy.ts enforces with a 404). Pure: no database, no Next.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { servesPath } from '../../src/config/install.ts';

const KFC = { install: 'keyforcars', workshop: true };
const KFC_NO_WORKSHOP = { install: 'keyforcars', workshop: false };
const AS24 = { install: 'autosleutel24', workshop: true };

// [path, served on KeyForCars]
const TABLE = [
  // The shop's own CRM
  ['/', true],
  ['/admin', true],
  ['/admin/login', true],
  ['/admin/overzicht', true],
  ['/admin/orders', true],
  ['/admin/klanten', true],
  ['/admin/voorraad', true],
  ['/admin/voorraad/montage', true],
  ['/admin/bestellingen/picken', true],
  ['/admin/inkoop', true],
  ['/admin/verzending/nieuw', true],
  ['/admin/gesprekken', true],
  ['/admin/bot-conversations', true],
  ['/admin/agent-centrum', true],
  ['/admin/facturen', true],
  ['/admin/financien', true],
  ['/admin/rapporten', true],
  ['/admin/instellingen', true],
  ['/admin/agenda', true],
  ['/api/admin/kfc-orders', true],
  ['/api/admin/kfc-klanten', true],
  ['/api/admin/stock', true],
  ['/api/admin/inkoop', true],
  ['/api/admin/inbox', true],
  ['/api/admin/crm-users', true],
  ['/api/admin/workshop/appointments', true],
  ['/api/woo/orders', true],
  ['/api/cron/kfc-reconcile', true],
  ['/api/agent/workshop', true],
  ['/api/webhooks/resend', true],
  ['/vendor/zxing_reader.wasm', true],

  // Technician network, already hidden before
  ['/admin/monteurs', false],
  ['/admin/monteurtarieven', false],
  ['/admin/mijn-agenda', false],
  ['/admin/vandaag', false],
  ['/admin/orders/123', false],
  // Shop: leads yes (enquiries), no jobs or dispatch office
  ['/admin/leads', true],
  ['/admin/leads/lijst', true],
  ['/admin/leads/opvolging', true],
  ['/admin/jobs', false],
  ['/admin/live', false],
  ['/admin/kantoor', false],
  // No WhatsApp ads, no click fraud
  ['/admin/whatsapp-advertenties', false],
  ['/admin/whatsapp-analyse', false],
  ['/admin/klikfraude', false],
  ['/admin/attributie', false],

  // The bug: a hidden screen's API must be hidden too
  ['/api/admin/monteurtarieven', false],
  ['/api/admin/netwerk', false],
  ['/api/admin/start', false],
  ['/api/admin/orders/123', false],
  ['/api/admin/leads/abc/notes', true],
  ['/api/admin/leads/by-phone', true],
  ['/api/admin/jobs', false],
  ['/api/admin/jobs/abc/call-clicks', false],
  ['/api/admin/technicians', false],
  ['/api/admin/technicians/abc/set-password', false],
  ['/api/admin/invite-technician', false],
  ['/api/admin/jobroom/approval-token', false],
  ['/api/admin/offers', false],
  ['/api/admin/whatsapp-quotes', false],
  ['/api/admin/ad-campaigns', false],
  ['/api/admin/ad-reviews', false],
  ['/api/admin/profiel/foto', false],
  ['/api/admin/products/bulk', false],

  // Outside the CRM
  ['/api/webhooks/whatsapp', false],
  ['/api/leads', false],
  ['/api/agent/book', false],
  ['/api/elevenlabs/webhook', false],
  ['/api/agenda/token123', false],
  ['/diensten/autosleutel-bijmaken', false],
  ['/api/cron/daily', false],
];

test('KeyForCars serves its shop screens and 404s the rest', () => {
  for (const [path, served] of TABLE) {
    assert.equal(servesPath(path, KFC), served, `keyforcars ${path}`);
  }
});

test('Autosleutel24 serves every path', () => {
  for (const [path] of TABLE) {
    assert.equal(servesPath(path, AS24), true, `autosleutel24 ${path}`);
  }
  assert.equal(servesPath('/api/admin/workshop/settings', { install: 'autosleutel24', workshop: false }), true);
});

test('Prefix matching does not over-reach', () => {
  // '/admin/jobs' must not hide a screen that only starts with the same letters.
  assert.equal(servesPath('/admin/jobsx', KFC), true);
  assert.equal(servesPath('/admin/orders', KFC), true);
  assert.equal(servesPath('/api/admin/orders', KFC), true);
});

test('KFC_WORKSHOP=0 closes the workshop calendar and agent, nothing else', () => {
  for (const path of ['/admin/agenda', '/api/admin/workshop/appointments', '/api/agent/workshop', '/api/agent/workshop/slots']) {
    assert.equal(servesPath(path, KFC), true, `workshop on: ${path}`);
    assert.equal(servesPath(path, KFC_NO_WORKSHOP), false, `workshop off: ${path}`);
  }
  for (const [path, served] of TABLE.filter(([p]) => !/agenda$|workshop/.test(p))) {
    assert.equal(servesPath(path, KFC_NO_WORKSHOP), served, `workshop off: ${path}`);
  }
});
