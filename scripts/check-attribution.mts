/**
 * Checks behind the click-id matcher: `node scripts/check-attribution.mts`.
 * Plain node, fixtures, no network, no real numbers or click ids.
 *
 * What it guards: a recovered click id goes to Google and steers the bidding.
 * A wrong match (two clicks, a click after the job, a number that only looks
 * alike) costs money; a phone number leaking into the file costs privacy.
 */
import assert from 'node:assert/strict';
import {
  attributionStats,
  clickOf,
  phoneKey,
  recoverClicks,
  resolveAll,
  resolveJobClick,
  weekStartAmsterdam,
  type AttrClick,
  type AttrJob,
  type AttrLead,
  type AttrPool,
} from '../src/lib/adAttribution.ts';
import { buildAdsFeed, type FeedJobRow } from '../src/lib/adsConversionsFeed.ts';
import { recordChatPhones } from '../src/lib/attributionData.ts';

let n = 0;
const check = (name: string, fn: () => void) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`FAIL: ${name}`);
    throw e;
  }
};

const G1 = 'Cj0KCQiA_fixture-gclid1';
const G2 = 'Cj0KCQiA_fixture-gclid2';
const G3 = 'Cj0KCQiA_fixture-gclid3';
const G4 = 'Cj0KCQiA_fixture-gclid4';
const GB = '0AAAAAD_fixture_gbraid1';
const WB = '0AAAAAD_fixture_wbraid1';
const PHONE = '+31 6 1234 5678';

const job = (over: Partial<AttrJob> = {}): AttrJob => ({
  id: 'job-1',
  status: 'afgerond',
  completed_at: '2026-11-05T10:00:00Z',
  lead_id: null,
  customer_phone: '0612345678',
  gclid: null,
  wbraid: null,
  gbraid: null,
  ...over,
});
const lead = (over: Partial<AttrLead> = {}): AttrLead => ({
  id: 'lead-1',
  phone: '06-12345678',
  phone_e164: '+31612345678',
  created_at: '2026-11-01T08:00:00Z',
  gclid: G1,
  wbraid: null,
  gbraid: null,
  ...over,
});
const click = (over: Partial<AttrClick> = {}): AttrClick => ({
  id: 'click-1',
  ref: null,
  created_at: '2026-11-02T08:00:00Z',
  claimed_by_job_id: null,
  gclid: G1,
  wbraid: null,
  gbraid: null,
  ...over,
});
const pool = (over: Partial<AttrPool> = {}): AttrPool => ({ leads: [], clicks: [], chats: [], ...over });
const recovered = (j: AttrJob, p: AttrPool) => {
  const r = resolveJobClick(j, p);
  assert.equal(r.status, 'recovered');
  return r.status === 'recovered' ? r.click : (null as never);
};

/* phone keys */
check('06 local format', () => assert.equal(phoneKey('0612345678'), '612345678'));
check('+31 with spaces', () => assert.equal(phoneKey('+31 6 1234 5678'), '612345678'));
check('0031 prefix', () => assert.equal(phoneKey('0031612345678'), '612345678'));
check('31 without plus', () => assert.equal(phoneKey('31612345678'), '612345678'));
check('dashes and brackets', () => assert.equal(phoneKey('(+31)-6-12345678'), '612345678'));
check('+31 (0) 6 form', () => assert.equal(phoneKey('+31 (0)6 12345678'), '612345678'));
check('too short is no key', () => assert.equal(phoneKey('12345678'), null));
check('empty and null are no key', () => {
  assert.equal(phoneKey(''), null);
  assert.equal(phoneKey(null), null);
  assert.equal(phoneKey(undefined), null);
});
check('different number, different key', () => assert.notEqual(phoneKey('0612345679'), phoneKey('0612345678')));

/* direct */
check('own click id is direct and untouched', () => {
  const r = resolveJobClick(job({ gclid: G2 }), pool({ leads: [lead({ id: 'x', phone: '0612345678' })] }));
  assert.deepEqual(r, { status: 'direct', kind: 'gclid' });
});
check('own gbraid is direct', () => assert.equal(resolveJobClick(job({ gbraid: GB }), pool()).status, 'direct'));
check('junk click id is not a click id', () => assert.equal(clickOf({ gclid: 'x y!' }), null));
check('click kind order gclid, gbraid, wbraid', () => assert.equal(clickOf({ wbraid: WB, gbraid: GB, gclid: G1 })?.kind, 'gclid'));

/* rule 1: lead link */
check('lead_link certain', () => {
  const c = recovered(job({ lead_id: 'lead-1' }), pool({ leads: [lead()] }));
  assert.equal(c.rule, 'lead_link');
  assert.equal(c.confidence, 'certain');
  assert.equal(c.id, G1);
  assert.equal(c.kind, 'gclid');
  assert.equal(c.clickedAt, '2026-11-01T08:00:00.000Z');
});
check('lead_link gbraid keeps its kind', () => {
  const c = recovered(job({ lead_id: 'lead-1' }), pool({ leads: [lead({ gclid: null, gbraid: GB })] }));
  assert.deepEqual([c.kind, c.id], ['gbraid', GB]);
});
check('lead without click id gives nothing', () =>
  assert.equal(resolveJobClick(job({ lead_id: 'lead-1' }), pool({ leads: [lead({ gclid: null })] })).status, 'none'));

/* rule 2: claimed click */
check('claimed_click certain', () => {
  const c = recovered(job(), pool({ clicks: [click({ claimed_by_job_id: 'job-1' })] }));
  assert.equal(c.rule, 'claimed_click');
  assert.equal(c.confidence, 'certain');
});
check('click claimed by another job is ignored', () =>
  assert.equal(resolveJobClick(job(), pool({ clicks: [click({ claimed_by_job_id: 'job-9' })] })).status, 'none'));
check('unclaimed click alone never matches by time', () =>
  assert.equal(resolveJobClick(job({ customer_phone: null }), pool({ clicks: [click()] })).status, 'none'));

/* rule 3: chat ref */
check('chat_ref certain, number in other format', () => {
  const c = recovered(job(), pool({ clicks: [click({ ref: 'K7F2' })], chats: [{ ref: 'K7F2', phone: '31612345678' }] }));
  assert.equal(c.rule, 'chat_ref');
  assert.equal(c.confidence, 'certain');
});
check('chat_ref code is case-insensitive', () =>
  assert.equal(recovered(job(), pool({ clicks: [click({ ref: 'k7f2' })], chats: [{ ref: 'K7F2', phone: PHONE }] })).rule, 'chat_ref'));
check('chat_ref other number does nothing', () =>
  assert.equal(
    resolveJobClick(job(), pool({ clicks: [click({ ref: 'K7F2' })], chats: [{ ref: 'K7F2', phone: '0687654321' }] })).status,
    'none'
  ));
check('chat_ref unknown code does nothing', () =>
  assert.equal(resolveJobClick(job(), pool({ clicks: [click({ ref: 'AAAA' })], chats: [{ ref: 'K7F2', phone: PHONE }] })).status, 'none'));
check('chat_ref click taken by another job is skipped', () =>
  assert.equal(
    resolveJobClick(job(), pool({ clicks: [click({ ref: 'K7F2', claimed_by_job_id: 'job-9' })], chats: [{ ref: 'K7F2', phone: PHONE }] })).status,
    'none'
  ));
check('chat_ref without a click id does nothing', () =>
  assert.equal(
    resolveJobClick(job(), pool({ clicks: [click({ ref: 'K7F2', gclid: null })], chats: [{ ref: 'K7F2', phone: PHONE }] })).status,
    'none'
  ));

/* rule 4: same phone on a lead */
check('phone_lead is likely', () => {
  const c = recovered(job(), pool({ leads: [lead()] }));
  assert.equal(c.rule, 'phone_lead');
  assert.equal(c.confidence, 'likely');
});
check('phone_lead matches via phone_e164 only', () =>
  assert.equal(recovered(job(), pool({ leads: [lead({ phone: null })] })).rule, 'phone_lead'));
check('phone_lead job has no phone', () =>
  assert.equal(resolveJobClick(job({ customer_phone: null }), pool({ leads: [lead()] })).status, 'none'));
check('phone_lead different number', () =>
  assert.equal(resolveJobClick(job(), pool({ leads: [lead({ phone: '0687654321', phone_e164: '+31687654321' })] })).status, 'none'));

/* ties */
check('two phone leads with two click ids: ambiguous', () => {
  const r = resolveJobClick(job(), pool({ leads: [lead(), lead({ id: 'lead-2', gclid: G2 })] }));
  assert.equal(r.status, 'ambiguous');
});
check('two phone leads with the same click id: recovered', () =>
  assert.equal(recovered(job(), pool({ leads: [lead(), lead({ id: 'lead-2' })] })).id, G1));
check('certain beats likely when ids differ', () => {
  const c = recovered(job({ lead_id: 'lead-1' }), pool({ leads: [lead(), lead({ id: 'lead-2', gclid: G2 })] }));
  assert.equal(c.id, G1);
  assert.equal(c.rule, 'lead_link');
});
check('two certain rules, two different ids: ambiguous', () => {
  const r = resolveJobClick(
    job({ lead_id: 'lead-1' }),
    pool({ leads: [lead()], clicks: [click({ claimed_by_job_id: 'job-1', gclid: G2 })] })
  );
  assert.equal(r.status, 'ambiguous');
});
check('two certain rules, same id: strongest rule reported', () => {
  const c = recovered(job({ lead_id: 'lead-1' }), pool({ leads: [lead()], clicks: [click({ claimed_by_job_id: 'job-1' })] }));
  assert.equal(c.rule, 'lead_link');
});
check('two chat refs to two clicks: ambiguous', () => {
  const r = resolveJobClick(
    job(),
    pool({
      clicks: [click({ ref: 'K7F2' }), click({ id: 'click-2', ref: 'M3N4', gclid: G2 })],
      chats: [{ ref: 'K7F2', phone: PHONE }, { ref: 'M3N4', phone: PHONE }],
    })
  );
  assert.equal(r.status, 'ambiguous');
});

/* the 90-day window */
check('click exactly 90 days before the job counts', () =>
  assert.equal(recovered(job({ lead_id: 'lead-1', completed_at: '2026-11-05T10:00:00Z' }), pool({ leads: [lead({ created_at: '2026-08-07T10:00:00Z' })] })).rule, 'lead_link'));
check('click one second older than 90 days is ignored', () =>
  assert.equal(resolveJobClick(job({ lead_id: 'lead-1' }), pool({ leads: [lead({ created_at: '2026-08-07T09:59:59Z' })] })).status, 'none'));
check('click later than the job is ignored', () =>
  assert.equal(resolveJobClick(job({ lead_id: 'lead-1' }), pool({ leads: [lead({ created_at: '2026-11-05T10:00:01Z' })] })).status, 'none'));
check('click at the very moment of the job counts', () =>
  assert.equal(resolveJobClick(job({ lead_id: 'lead-1' }), pool({ leads: [lead({ created_at: '2026-11-05T10:00:00Z' })] })).status, 'recovered'));
check('window applies to claimed clicks too', () =>
  assert.equal(resolveJobClick(job(), pool({ clicks: [click({ claimed_by_job_id: 'job-1', created_at: '2026-06-01T00:00:00Z' })] })).status, 'none'));
check('window applies to phone leads; a second in-window lead wins alone', () => {
  const c = recovered(job(), pool({ leads: [lead({ created_at: '2026-01-01T00:00:00Z', gclid: G2 }), lead({ id: 'lead-2' })] }));
  assert.equal(c.id, G1);
});
check('job without completion time gets nothing', () =>
  assert.equal(resolveJobClick(job({ completed_at: null, lead_id: 'lead-1' }), pool({ leads: [lead()] })).status, 'none'));

/* recoverClicks */
/* Job b is a different customer (own number, own lead): only the number links it to its click. */
const twoCustomers = () => ({
  jobs: [job({ id: 'a', lead_id: 'lead-1' }), job({ id: 'b', customer_phone: '0698765432' })],
  p: pool({ leads: [lead(), lead({ id: 'lead-b', phone: '0698765432', phone_e164: null, gclid: G2 })] }),
});
check('only certain by default', () => {
  const { jobs, p } = twoCustomers();
  assert.deepEqual([...recoverClicks(jobs, p).keys()], ['a']);
});
check('likely behind the flag', () => {
  const { jobs, p } = twoCustomers();
  assert.deepEqual([...recoverClicks(jobs, p, { includeLikely: true }).keys()].sort(), ['a', 'b']);
});
check('unfinished jobs are skipped', () =>
  assert.equal(recoverClicks([job({ status: 'gepland', lead_id: 'lead-1' })], pool({ leads: [lead()] })).size, 0));

/* the feed */
const feedJob = (over: Partial<FeedJobRow> = {}): FeedJobRow => ({
  id: 'job-1',
  status: 'afgerond',
  gross_margin: 100,
  completed_at: '2026-11-05T10:00:00Z',
  gclid: null,
  wbraid: null,
  gbraid: null,
  click_captured_at: null,
  leads: null,
  customer_phone: '0612345678',
  ...over,
});
const NOW = new Date('2026-11-11T12:00:00Z');
check('feed: recovered job becomes a row in the right column', () => {
  const m = recoverClicks([job({ lead_id: 'lead-1' })], pool({ leads: [lead({ gclid: null, wbraid: WB })] }));
  const r = buildAdsFeed([feedJob({ lead_id: 'lead-1' })], NOW, m);
  assert.equal(r.counts.rows, 1);
  assert.equal(r.counts.recovered_certain, 1);
  assert.match(r.csv, new RegExp(`\\n,,${WB},Job Completed,2026-11-05 11:00:00,100.00,EUR\\n`));
});
check('feed: without recoveries nothing changes', () => {
  const r = buildAdsFeed([feedJob()], NOW);
  assert.equal(r.counts.rows, 0);
  assert.equal(r.counts.skipped_no_click_id, 1);
});
check('feed: own click id beats a recovery', () => {
  const m = new Map([['job-1', { kind: 'gclid' as const, id: G2, rule: 'claimed_click' as const, confidence: 'certain' as const, clickedAt: '2026-11-02T08:00:00Z' }]]);
  const r = buildAdsFeed([feedJob({ gclid: G1 })], NOW, m);
  assert.ok(r.csv.includes(G1));
  assert.ok(!r.csv.includes(G2));
  assert.equal(r.counts.recovered_certain, 0);
});
check('feed: recovered click after the completion is dropped as bad time', () => {
  const m = new Map([['job-1', { kind: 'gclid' as const, id: G2, rule: 'claimed_click' as const, confidence: 'certain' as const, clickedAt: '2026-11-06T08:00:00Z' }]]);
  assert.equal(buildAdsFeed([feedJob()], NOW, m).counts.skipped_bad_time, 1);
});
check('feed: likely recovery is counted as likely', () => {
  const m = recoverClicks([job()], pool({ leads: [lead()] }), { includeLikely: true });
  assert.equal(buildAdsFeed([feedJob()], NOW, m).counts.recovered_likely, 1);
});

/* privacy */
check('recovery carries no phone digits', () => {
  const c = recovered(job(), pool({ leads: [lead()] }));
  assert.ok(!/612345678|0612345678|31612345678/.test(JSON.stringify(c)));
  assert.deepEqual(Object.keys(c).sort(), ['clickedAt', 'confidence', 'id', 'kind', 'rule']);
});
check('ambiguous answer carries only status and rule', () => {
  const r = resolveJobClick(job(), pool({ leads: [lead(), lead({ id: 'lead-2', gclid: G2 })] }));
  assert.deepEqual(Object.keys(r).sort(), ['rule', 'status']);
});
check('feed csv has no phone, name or email', () => {
  const m = recoverClicks([job()], pool({ leads: [lead()] }), { includeLikely: true });
  const r = buildAdsFeed([feedJob({ customer_name: 'Jan Jansen', customer_email: 'jan@example.test' })], NOW, m);
  assert.ok(!/612345678|Jansen|@/.test(r.csv));
});
check('stats output holds counts and week labels only', () => {
  const s = attributionStats([job({ lead_id: 'lead-1' })], pool({ leads: [lead()] }));
  assert.ok(!/612345678|Cj0KCQ/.test(JSON.stringify(s)));
});

/* stats and weeks */
check('week starts on Monday, Amsterdam time', () => {
  assert.equal(weekStartAmsterdam('2026-11-05T10:00:00Z'), '2026-11-02');
  assert.equal(weekStartAmsterdam('2026-11-08T23:30:00Z'), '2026-11-09');
  assert.equal(weekStartAmsterdam('nonsense'), null);
});
check('stats split jobs by outcome', () => {
  const jobs = [
    job({ id: 'direct', gclid: G2 }),
    job({ id: 'viaLead', lead_id: 'lead-1', customer_phone: null }),
    job({ id: 'viaClaim', customer_phone: null }),
    job({ id: 'viaPhone', customer_phone: '0699999999' }),
    job({ id: 'none', customer_phone: '0600000000' }),
    job({ id: 'open', status: 'gepland' }),
  ];
  /* Every customer has a click of their own: one click, one job. */
  const p = pool({
    leads: [lead({ id: 'lead-1', phone: null, phone_e164: null }), lead({ id: 'lead-9', phone: '0699999999', phone_e164: null, gclid: G4 })],
    clicks: [click({ claimed_by_job_id: 'viaClaim', gclid: G3 })],
  });
  const s = attributionStats(jobs, p);
  assert.equal(s.total.finished, 5);
  assert.equal(s.total.direct, 1);
  assert.equal(s.total.recovered.lead_link, 1);
  assert.equal(s.total.recovered.claimed_click, 1);
  assert.equal(s.total.recovered.phone_lead, 1);
  assert.equal(s.total.recovered.chat_ref, 0);
  assert.equal(s.total.without, 1);
  assert.equal(s.weeks.length, 1);
  assert.equal(s.weeks[0].week, '2026-11-02');
});
check('stats count ambiguous separately', () => {
  const s = attributionStats([job()], pool({ leads: [lead(), lead({ id: 'lead-2', gclid: G2 })] }));
  assert.equal(s.total.ambiguous, 1);
  assert.equal(s.total.without, 0);
});

/* ------------------------------------------------------------------ */
/* Precision: one click, one job. Where two clicks or two jobs could   */
/* fit, nothing is sent.                                               */
/* ------------------------------------------------------------------ */

/* chat code with the number stored on the click (migration 0088) */
const coded = (over: Partial<AttrClick> = {}) => click({ ref: 'K7F2', chat_phone_key: '612345678', ...over });
check('stored number: code from the job number is certain', () => {
  const c = recovered(job({ customer_phone: '+31 6 1234 5678' }), pool({ clicks: [coded()] }));
  assert.equal(c.rule, 'chat_ref');
  assert.equal(c.confidence, 'certain');
});
check('stored number: another number does nothing', () =>
  assert.equal(resolveJobClick(job(), pool({ clicks: [coded({ chat_phone_key: '687654321' })] })).status, 'none'));
check('stored number: flagged as shared never matches', () =>
  assert.equal(resolveJobClick(job(), pool({ clicks: [coded({ chat_phone_conflict: true })] })).status, 'none'));
check('stored number: no number stored, no chat list, no match', () =>
  assert.equal(resolveJobClick(job(), pool({ clicks: [coded({ chat_phone_key: null })] })).status, 'none'));
check('stored number: a garbage key is no key', () =>
  assert.equal(resolveJobClick(job(), pool({ clicks: [coded({ chat_phone_key: '1234' })] })).status, 'none'));
check('stored number plus a chat list with the same number: still one number', () =>
  assert.equal(recovered(job(), pool({ clicks: [coded()], chats: [{ ref: 'K7F2', phone: '+31612345678' }] })).rule, 'chat_ref'));
check('forwarded link: the chat list names a second number, so nobody matches', () => {
  const p = pool({ clicks: [coded()], chats: [{ ref: 'K7F2', phone: '0687654321' }] });
  assert.equal(resolveJobClick(job(), p).status, 'none');
  assert.equal(resolveJobClick(job({ customer_phone: '0687654321' }), p).status, 'none');
});
check('stored number: a click taken by another job is skipped', () =>
  assert.equal(resolveJobClick(job(), pool({ clicks: [coded({ claimed_by_job_id: 'job-9' })] })).status, 'none'));

/* hard links beat soft ones; soft ones disagreeing means a tie */
check('code says one click, a phone lead another: tie, nothing is sent', () => {
  const r = resolveJobClick(job(), pool({ clicks: [coded()], leads: [lead({ gclid: G2 })] }));
  assert.equal(r.status, 'ambiguous');
});
check('code and phone lead agree: the code rule is reported', () =>
  assert.equal(recovered(job(), pool({ clicks: [coded()], leads: [lead()] })).rule, 'chat_ref'));
check('a claimed click beats a different phone lead', () => {
  const c = recovered(job(), pool({ clicks: [click({ claimed_by_job_id: 'job-1', gclid: G1 })], leads: [lead({ gclid: G2 })] }));
  assert.equal(c.rule, 'claimed_click');
  assert.equal(c.id, G1);
});
check("the job's own lead beats a different code", () => {
  const c = recovered(job({ lead_id: 'lead-1' }), pool({ leads: [lead()], clicks: [coded({ gclid: G2 })] }));
  assert.equal(c.rule, 'lead_link');
  assert.equal(c.id, G1);
});
check('a tie never reaches the file, even with likely switched on', () => {
  const p = pool({ leads: [lead(), lead({ id: 'lead-2', gclid: G2 })] });
  const m = recoverClicks([job()], p, { includeLikely: true });
  assert.equal(m.size, 0);
  const r = buildAdsFeed([feedJob()], NOW, m);
  assert.equal(r.counts.rows, 0);
  assert.equal(r.counts.skipped_no_click_id, 1);
});

/* a customer who clicked twice */
check('clicked twice, two codes from one number: tie', () => {
  const p = pool({ clicks: [coded(), coded({ id: 'click-2', ref: 'M3N4', gclid: G2 })] });
  assert.equal(resolveJobClick(job(), p).status, 'ambiguous');
});
check('clicked twice, same ad click id both times: one click', () => {
  const p = pool({ clicks: [coded({ created_at: '2026-11-03T08:00:00Z' }), coded({ id: 'click-2', ref: 'M3N4', created_at: '2026-11-02T08:00:00Z' })] });
  const c = recovered(job(), p);
  assert.equal(c.id, G1);
  assert.equal(c.clickedAt, '2026-11-02T08:00:00.000Z');
});
check('clicked twice, the second click went to another job: the first is left', () => {
  const p = pool({ clicks: [coded(), coded({ id: 'click-2', ref: 'M3N4', gclid: G2, claimed_by_job_id: 'job-9' })] });
  assert.equal(recovered(job(), p).id, G1);
});
check('clicked twice, the second click came after the job: the first is left', () => {
  const p = pool({ clicks: [coded(), coded({ id: 'click-2', ref: 'M3N4', gclid: G2, created_at: '2026-11-06T08:00:00Z' })] });
  assert.equal(recovered(job(), p).id, G1);
});

/* re-used phone numbers and one click for two jobs */
const sameNumber = [job({ id: 'job-1' }), job({ id: 'job-2', completed_at: '2026-11-08T10:00:00Z' })];
check('same number on two finished jobs, one coded click: nobody gets it', () => {
  const p = pool({ clicks: [coded()] });
  assert.equal(recoverClicks(sameNumber, p).size, 0);
  const all = resolveAll(sameNumber, p);
  assert.deepEqual([...all.values()].map((r) => r.status), ['shared', 'shared']);
});
check('same number on two finished jobs, one phone lead: nobody gets it', () =>
  assert.equal(recoverClicks(sameNumber, pool({ leads: [lead()] }), { includeLikely: true }).size, 0));
check('same number, but only one job is finished: that job keeps the click', () => {
  const jobs = [job({ id: 'job-1' }), job({ id: 'job-2', status: 'gepland' })];
  assert.deepEqual([...recoverClicks(jobs, pool({ clicks: [coded()] })).keys()], ['job-1']);
});
check('a repeat customer does not reuse the click of an earlier job with its own lead', () => {
  const jobs = [job({ id: 'job-1', lead_id: 'lead-1' }), job({ id: 'job-2', completed_at: '2026-11-08T10:00:00Z' })];
  const m = recoverClicks(jobs, pool({ leads: [lead()] }), { includeLikely: true });
  assert.deepEqual([...m.keys()], ['job-1']);
});
check('a click that a direct job already carries is not handed out again', () => {
  const jobs = [job({ id: 'job-1', gclid: G1 }), job({ id: 'job-2', customer_phone: '0612345678' })];
  assert.equal(recoverClicks(jobs, pool({ clicks: [coded()] })).size, 0);
});
check('a click carried by an unfinished job is not handed out either', () => {
  const p = pool({ clicks: [coded()], otherJobs: [{ id: 'job-7', gclid: G1 }] });
  assert.equal(recoverClicks([job()], p).size, 0);
  assert.equal(resolveAll([job()], p).get('job-1')?.status, 'shared');
});
check("a click on another job's lead counts as carried", () => {
  const p = pool({ clicks: [coded()], leads: [lead({ id: 'lead-7' })], otherJobs: [{ id: 'job-7', lead_id: 'lead-7' }] });
  assert.equal(recoverClicks([job()], p).size, 0);
});
check('the job itself in otherJobs does not block itself', () => {
  const p = pool({ clicks: [coded()], otherJobs: [{ id: 'job-1', gclid: null, lead_id: null }] });
  assert.equal(recoverClicks([job()], p).size, 1);
});
check('other jobs with other clicks do not block', () => {
  const p = pool({ clicks: [coded()], otherJobs: [{ id: 'job-7', gclid: G2 }] });
  assert.equal(recoverClicks([job()], p).size, 1);
});
check('lead_link is not withdrawn for a second job on the same lead (feed behaviour unchanged)', () => {
  const jobs = [job({ id: 'job-1', lead_id: 'lead-1' }), job({ id: 'job-2', lead_id: 'lead-1' })];
  assert.deepEqual([...recoverClicks(jobs, pool({ leads: [lead()] })).keys()].sort(), ['job-1', 'job-2']);
});
check('a job listed twice is one job', () => {
  const s = attributionStats([job({ lead_id: 'lead-1' }), job({ lead_id: 'lead-1' })], pool({ leads: [lead()] }));
  assert.equal(s.total.finished, 1);
  assert.equal(resolveAll([job(), job()], pool()).size, 1);
});
check('stats count shared apart from ambiguous and none', () => {
  const s = attributionStats(sameNumber, pool({ clicks: [coded()] }));
  assert.equal(s.total.shared, 2);
  assert.equal(s.total.ambiguous, 0);
  assert.equal(s.total.without, 0);
  assert.equal(s.total.finished, 2);
});

/* the feed: Google's upload window and click ids already in the file */
const rec = (id: string, clickedAt: string, rule: 'claimed_click' | 'chat_ref' = 'claimed_click') =>
  new Map([['job-1', { kind: 'gclid' as const, id, rule, confidence: 'certain' as const, clickedAt }]]);
check('feed: recovered job completed more than 90 days ago is too old', () => {
  const r = buildAdsFeed([feedJob({ completed_at: '2026-08-12T12:00:00Z' })], NOW, rec(G1, '2026-08-01T08:00:00Z'));
  assert.equal(r.counts.skipped_too_old, 1);
  assert.equal(r.counts.rows, 0);
});
check('feed: recovered click older than 90 days from today is too old, though inside the job window', () => {
  const r = buildAdsFeed([feedJob({ completed_at: '2026-08-14T12:00:00Z' })], NOW, rec(G1, '2026-08-10T08:00:00Z'));
  assert.equal(r.counts.skipped_too_old, 1);
});
check('feed: recovered click exactly at the 90-day edge still goes', () => {
  const r = buildAdsFeed([feedJob({ completed_at: '2026-08-14T12:00:00Z' })], NOW, rec(G1, '2026-08-13T12:00:00Z'));
  assert.equal(r.counts.rows, 1);
});
check('feed: the same input a day later gives the same row', () => {
  const m = rec(G1, '2026-11-02T08:00:00Z');
  const a = buildAdsFeed([feedJob()], NOW, m).csv;
  const b = buildAdsFeed([feedJob()], new Date('2026-11-12T12:00:00Z'), m).csv;
  assert.equal(a.split('\n')[2], b.split('\n')[2]);
});
check('feed: a recovered click id a direct row already carries is not sent a second time', () => {
  const m = new Map([['job-2', { kind: 'gclid' as const, id: G1, rule: 'chat_ref' as const, confidence: 'certain' as const, clickedAt: '2026-11-02T08:00:00Z' }]]);
  const r = buildAdsFeed([feedJob({ gclid: G1, click_captured_at: '2026-11-02T08:00:00Z' }), feedJob({ id: 'job-2' })], NOW, m);
  assert.equal(r.counts.rows, 1);
  assert.equal(r.counts.skipped_duplicate_click, 1);
  assert.equal(r.csv.split(G1).length - 1, 1);
});
check('feed: a click id on a direct row via its lead counts as carried too', () => {
  const m = new Map([['job-2', { kind: 'gclid' as const, id: G1, rule: 'chat_ref' as const, confidence: 'certain' as const, clickedAt: '2026-11-02T08:00:00Z' }]]);
  const direct = feedJob({ leads: { gclid: G1, created_at: '2026-11-01T08:00:00Z' } });
  const r = buildAdsFeed([direct, feedJob({ id: 'job-2' })], NOW, m);
  assert.equal(r.counts.skipped_duplicate_click, 1);
  assert.equal(r.counts.rows, 1);
});
check('feed: two recovered rows with the same click id: neither is sent', () => {
  const entry = { kind: 'gclid' as const, id: G1, rule: 'chat_ref' as const, confidence: 'certain' as const, clickedAt: '2026-11-02T08:00:00Z' };
  const r = buildAdsFeed([feedJob(), feedJob({ id: 'job-2' })], NOW, new Map([['job-1', entry], ['job-2', entry]]));
  assert.equal(r.counts.rows, 0);
  assert.equal(r.counts.skipped_duplicate_click, 2);
});
check('feed: end to end, one coded click and two jobs with that number: no row at all', () => {
  const jobs = [job({ id: 'job-1' }), job({ id: 'job-2', completed_at: '2026-11-08T10:00:00Z' })];
  const m = recoverClicks(jobs, pool({ clicks: [coded()] }));
  const r = buildAdsFeed([feedJob({ id: 'job-1' }), feedJob({ id: 'job-2', completed_at: '2026-11-08T10:00:00Z' })], NOW, m);
  assert.equal(r.counts.rows, 0);
  assert.equal(r.counts.recovered_certain, 0);
});
check('feed: end to end, one coded click and one job: one row, no number in the file', () => {
  const m = recoverClicks([job()], pool({ clicks: [coded()] }));
  const r = buildAdsFeed([feedJob()], NOW, m);
  assert.equal(r.counts.rows, 1);
  assert.equal(r.counts.recovered_certain, 1);
  assert.ok(!/612345678/.test(r.csv));
});
check('recovery of a coded click carries no number either', () => {
  const c = recovered(job(), pool({ clicks: [coded()] }));
  assert.deepEqual(Object.keys(c).sort(), ['clickedAt', 'confidence', 'id', 'kind', 'rule']);
  assert.ok(!/612345678/.test(JSON.stringify(c)));
});

/* writing the number behind a code (the ad-reviews route) */
interface DbRow {
  id: string;
  ref: string;
  chat_phone_key: string | null;
  chat_phone_conflict: boolean;
}
interface Builder {
  update(patch: Partial<DbRow>): Builder;
  select(columns?: string): Builder;
  eq(column: keyof DbRow, value: unknown): Builder;
  is(column: keyof DbRow, value: unknown): Builder;
  maybeSingle(): Promise<{ data: Partial<DbRow> | null; error: null }>;
  then<T>(done: (value: { data: Partial<DbRow>[] | null; error: null }) => T): Promise<T>;
}
const fakeDb = (rows: DbRow[]) => {
  const from = (): Builder => {
    let patch: Partial<DbRow> | null = null;
    let selecting = false;
    const filters: ((r: DbRow) => boolean)[] = [];
    const run = () => {
      const hit = rows.filter((r) => filters.every((f) => f(r)));
      if (patch) for (const r of hit) Object.assign(r, patch);
      return hit.map((r) => ({ id: r.id, chat_phone_key: r.chat_phone_key }));
    };
    const b: Builder = {
      update: (p) => ((patch = p), b),
      select: () => ((selecting = true), b),
      eq: (col, v) => (filters.push((r) => r[col] === v), b),
      is: (col, v) => (filters.push((r) => r[col] === v), b),
      maybeSingle: () => Promise.resolve({ data: run()[0] ?? null, error: null }),
      then: (done) => Promise.resolve({ data: selecting || !patch ? run() : (run(), null), error: null as null }).then(done),
    };
    return b;
  };
  return { from } as never;
};
const dbRow = (ref: string, key: string | null = null): DbRow => ({ id: `c-${ref}`, ref, chat_phone_key: key, chat_phone_conflict: false });
const writeChats = async (rows: DbRow[], pairs: { ref: string; phone: string }[]) => ({
  result: await recordChatPhones(fakeDb(rows), pairs),
  rows,
});
let pending = 0;
const later = (name: string, fn: () => Promise<void>) => {
  pending++;
  fn().then(
    () => {
      n++;
      if (--pending === 0) done();
    },
    (e) => {
      console.error(`FAIL: ${name}`);
      console.error(e);
      process.exit(1);
    }
  );
};
function done() {
  console.log(`attribution: ${n} checks passed`);
}

later('chat number: first number is written as last nine digits', async () => {
  const { result, rows } = await writeChats([dbRow('K7F2')], [{ ref: 'K7F2', phone: '+31 6 1234 5678' }]);
  assert.equal(result.set, 1);
  assert.equal(rows[0].chat_phone_key, '612345678');
  assert.equal(rows[0].chat_phone_conflict, false);
});
later('chat number: the same number again changes nothing', async () => {
  const { result, rows } = await writeChats([dbRow('K7F2', '612345678')], [{ ref: 'K7F2', phone: '0612345678' }]);
  assert.deepEqual([result.set, result.same, result.conflict], [0, 1, 0]);
  assert.equal(rows[0].chat_phone_conflict, false);
});
later('chat number: a different number never overwrites, it flags the click', async () => {
  const { result, rows } = await writeChats([dbRow('K7F2', '612345678')], [{ ref: 'K7F2', phone: '0687654321' }]);
  assert.equal(result.conflict, 1);
  assert.equal(rows[0].chat_phone_key, '612345678');
  assert.equal(rows[0].chat_phone_conflict, true);
});
later('chat number: two numbers for one code in the same batch flag the click', async () => {
  const { result, rows } = await writeChats(
    [dbRow('K7F2')],
    [{ ref: 'K7F2', phone: '0612345678' }, { ref: 'K7F2', phone: '0687654321' }]
  );
  assert.equal(result.conflict, 1);
  assert.equal(rows[0].chat_phone_conflict, true);
  assert.equal(rows[0].chat_phone_key, null);
});
later('chat number: an unknown code and a too short number write nothing', async () => {
  const { result, rows } = await writeChats([dbRow('K7F2')], [{ ref: 'ZZZZ', phone: '0612345678' }, { ref: 'K7F2', phone: '12345' }]);
  assert.equal(result.set, 0);
  assert.equal(result.skipped, 2);
  assert.equal(rows[0].chat_phone_key, null);
});
later('chat number: the result carries counts, never a number', async () => {
  const { result } = await writeChats([dbRow('K7F2')], [{ ref: 'K7F2', phone: '0612345678' }]);
  assert.ok(!/612345678/.test(JSON.stringify(result)));
});
