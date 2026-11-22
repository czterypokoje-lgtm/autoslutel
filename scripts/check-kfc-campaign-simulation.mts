import assert from 'node:assert/strict';
import { campaignAudience, campaignFingerprint, simulateCampaign } from '../src/lib/kfcCampaignSimulation.ts';

const now = new Date('2026-11-20T12:00:00Z');
const consent = { channel: 'email', scope: 'marketing', source: 'demo form', at: '2026-11-01T12:00:00Z' };
const draft = { id: '1', subject: 'News', body: 'Demo announcement', sender: 'demo@example.com' };
const people = [{ address: 'alex@example.com', consent }, { address: ' ALEX@example.com ', consent }, { address: 'sam@example.com' }];
const audience = campaignAudience(people, now);
assert.equal(audience.length, 2);
assert.equal(audience[1].reason, 'no_documented_consent');
const approvedAudience = audience.filter((row) => row.reason === null).map((row) => row.address);
const approval = { approvedAudience, fingerprint: campaignFingerprint(draft, approvedAudience) };
assert.equal(simulateCampaign(draft, approval, people, new Set(), now).outcomes[0].status, 'simulated');
const afterOptOut = [...people, { address: 'alex@example.com', consent: { ...consent, withdrawnAt: now.toISOString() } }];
assert.equal(simulateCampaign(draft, approval, afterOptOut, new Set(), now).outcomes[0].status, 'opted_out_or_suppressed');
assert.equal(simulateCampaign(draft, approval, people, new Set(['alex@example.com']), now).outcomes[0].status, 'already_sent');
assert.equal(simulateCampaign({ ...draft, subject: 'changed' }, approval, people, new Set(), now).reason, 'approval_required');
console.log('Campaign simulation checks passed.');
