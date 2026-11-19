// node --experimental-strip-types scripts/test-ops-ad-matches.mjs
import assert from 'node:assert/strict';
import { matchChats, summarizeMatches } from '../src/lib/opsAdMatches.ts';
import { buildAdReportPdf } from '../src/lib/opsAdReportPdf.ts';

const click = (over) => ({ ref: 'K7F2', gclid: 'g', wbraid: null, gbraid: null, claimed_by_job_id: null, ...over });
const job = (over) => ({ id: 'j1', status: 'afgerond', customer_phone: '06 12345678', final_price: '150', ...over });
const chat = { ref: 'K7F2', phone: '+31612345678', at: '2026-11-06T10:00:00Z' };
const one = (clicks, jobs) => matchChats([chat], clicks, jobs)[0];

// Exact code plus one job on that number: ready, with its value.
let m = one([click()], [job()]);
assert.equal(m.status, 'koppelbaar');
assert.equal(m.value, 150);
assert.equal(m.phoneEnd, '5678');

// Never guess between two jobs.
m = one([click()], [job(), job({ id: 'j2' })]);
assert.equal(m.status, 'meerdere_jobs');
assert.equal(m.jobId, null);

assert.equal(one([click()], []).status, 'wacht_op_job');
assert.equal(one([], [job()]).status, 'onbekende_code');
assert.equal(one([click({ gclid: null })], [job()]).status, 'geen_klikid');

// A claimed click stays claimed, and shows the job it was claimed by.
m = one([click({ claimed_by_job_id: 'j9' })], [job({ id: 'j9', customer_phone: null })]);
assert.equal(m.status, 'al_gekoppeld');
assert.equal(m.jobId, 'j9');

// A price not set yet stays empty, not zero.
assert.equal(one([click()], [job({ final_price: null })]).value, null);

const all = matchChats([chat, { ...chat, ref: 'AAAA' }], [click()], [job()]);
assert.deepEqual([summarizeMatches(all).total, summarizeMatches(all).counts.onbekende_code], [2, 1]);

// The full number never reaches the report.
assert.ok(!JSON.stringify(all).includes('612345678'));
const pdf = await buildAdReportPdf(Array.from({ length: 80 }, () => all[0]), summarizeMatches(all).counts, '2026-11-06');
assert.equal(Buffer.from(pdf.slice(0, 4)).toString(), '%PDF');

console.log('ops ad matches: all passed');
