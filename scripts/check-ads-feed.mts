/**
 * Checks behind the daily Google Ads conversion file:
 * `node scripts/check-ads-feed.mts`. Plain node, fixtures, no network.
 *
 * What it guards: this file is fetched by Google every day and teaches Smart
 * Bidding which ads bring paying jobs. A wrong time (1970, UTC, ISO "T"), a
 * conversion before its click, a gbraid in the wrong column or a phone number
 * in the file each cost money or privacy without anyone noticing.
 */
import assert from 'node:assert/strict';
import {
  buildAdsFeed,
  checkAdsFeedAuth,
  csvField,
  formatAmsterdam,
  formatValue,
  FEED_FIRST_LINE,
  FEED_HEADER,
  type FeedJobRow,
} from '../src/lib/adsConversionsFeed.ts';

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

const NOW = new Date('2026-11-11T12:00:00Z');
const GCLID = 'Cj0KCQiA_test-gclid1';
const GBRAID = '0AAAAAD_gbraid_test1';
const WBRAID = '0AAAAAD_wbraid_test1';

const job = (over: Partial<FeedJobRow> = {}): FeedJobRow => ({
  id: 'job-1',
  status: 'afgerond',
  gross_margin: 149.5,
  final_price: 300,
  completed_at: '2026-11-05T10:00:00Z',
  gclid: null,
  wbraid: null,
  gbraid: null,
  click_captured_at: null,
  leads: { gclid: GCLID, wbraid: null, gbraid: null, created_at: '2026-11-01T08:00:00Z' },
  ...over,
});
const lines = (csv: string) => csv.split('\n');

/* Header and shape */
const one = buildAdsFeed([job()], NOW);
check('first line is the timezone parameter', () => assert.equal(lines(one.csv)[0], 'Parameters:TimeZone=Europe/Amsterdam'));
check('first line constant', () => assert.equal(FEED_FIRST_LINE, 'Parameters:TimeZone=Europe/Amsterdam'));
check('header has three click columns', () =>
  assert.equal(lines(one.csv)[1], 'Google Click ID,GBRAID,WBRAID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency'));
check('header constant matches', () => assert.equal(lines(one.csv)[1], FEED_HEADER));
check('ends with single newline', () => assert.ok(one.csv.endsWith('\n') && !one.csv.endsWith('\n\n')));
check('row is exact', () => assert.equal(lines(one.csv)[2], `${GCLID},,,Job Completed,2026-11-05 11:00:00,149.50,EUR`));
check('no rows still has header', () => assert.equal(buildAdsFeed([], NOW).csv, `${FEED_FIRST_LINE}\n${FEED_HEADER}\n`));
check('counts one row', () => assert.deepEqual(one.counts, { rows: 1, skipped_no_click_id: 0, skipped_too_old: 0, skipped_bad_time: 0, skipped_no_value: 0, skipped_duplicate_click: 0, recovered_certain: 0, recovered_likely: 0 }));

/* Amsterdam time */
check('summer is UTC+2', () => assert.equal(formatAmsterdam('2026-07-01T10:00:00Z'), '2026-07-01 12:00:00'));
check('winter is UTC+1', () => assert.equal(formatAmsterdam('2026-01-15T10:00:00Z'), '2026-01-15 11:00:00'));
check('midnight is 00 not 24', () => assert.equal(formatAmsterdam('2026-01-14T23:00:00Z'), '2026-01-15 00:00:00'));
check('day rolls over in Amsterdam', () => assert.equal(formatAmsterdam('2026-07-01T22:30:00Z'), '2026-07-02 00:30:00'));
check('no ISO T or offset in output', () => assert.doesNotMatch(lines(one.csv)[2], /\d{4}-\d{2}-\d{2}T|[+]\d{2}:\d{2}|Z,/));
check('null time is null, not 1970', () => assert.equal(formatAmsterdam(null), null));
check('epoch zero is null', () => assert.equal(formatAmsterdam('1970-01-01T00:00:00Z'), null));
check('garbage time is null', () => assert.equal(formatAmsterdam('not a date'), null));
check('missing completed_at skipped as bad time', () => {
  const r = buildAdsFeed([job({ completed_at: null })], NOW);
  assert.equal(r.counts.skipped_bad_time, 1);
  assert.doesNotMatch(r.csv, /1970/);
});
check('future completion skipped as bad time', () =>
  assert.equal(buildAdsFeed([job({ completed_at: '2026-11-12T00:00:00Z' })], NOW).counts.skipped_bad_time, 1));

/* 90 day window: cutoff is 2026-08-13T12:00:00Z */
const lead = (created_at: string) => ({ gclid: GCLID, created_at });
check('exactly 90 days is kept', () =>
  assert.equal(buildAdsFeed([job({ completed_at: '2026-08-13T12:00:00Z', leads: lead('2026-08-13T12:00:00Z') })], NOW).counts.rows, 1));
check('one second over 90 days is dropped', () =>
  assert.equal(buildAdsFeed([job({ completed_at: '2026-08-13T11:59:59Z', leads: lead('2026-08-13T11:00:00Z') })], NOW).counts.skipped_too_old, 1));
check('89 days is kept', () =>
  assert.equal(buildAdsFeed([job({ completed_at: '2026-08-14T12:00:00Z', leads: lead('2026-08-14T11:00:00Z') })], NOW).counts.rows, 1));
check('old click with fresh completion is dropped', () =>
  assert.equal(buildAdsFeed([job({ leads: lead('2026-05-01T08:00:00Z') })], NOW).counts.skipped_too_old, 1));
check('very old job is dropped', () =>
  assert.equal(buildAdsFeed([job({ completed_at: '2025-01-01T10:00:00Z', leads: lead('2025-01-01T08:00:00Z') })], NOW).counts.skipped_too_old, 1));

/* Click id precedence and columns */
check('gclid wins over gbraid and wbraid', () => {
  const r = buildAdsFeed([job({ leads: { gclid: GCLID, gbraid: GBRAID, wbraid: WBRAID, created_at: '2026-11-01T08:00:00Z' } })], NOW);
  assert.equal(lines(r.csv)[2].split(',').slice(0, 3).join(','), `${GCLID},,`);
});
check('gbraid only goes in the GBRAID column', () => {
  const r = buildAdsFeed([job({ leads: { gbraid: GBRAID, created_at: '2026-11-01T08:00:00Z' } })], NOW);
  assert.equal(lines(r.csv)[2].split(',').slice(0, 3).join(','), `,${GBRAID},`);
});
check('wbraid only goes in the WBRAID column', () => {
  const r = buildAdsFeed([job({ leads: { wbraid: WBRAID, created_at: '2026-11-01T08:00:00Z' } })], NOW);
  assert.equal(lines(r.csv)[2].split(',').slice(0, 3).join(','), `,,${WBRAID}`);
});
check('gbraid beats wbraid', () => {
  const r = buildAdsFeed([job({ leads: { gbraid: GBRAID, wbraid: WBRAID, created_at: '2026-11-01T08:00:00Z' } })], NOW);
  assert.equal(lines(r.csv)[2].split(',').slice(0, 3).join(','), `,${GBRAID},`);
});
check('phone job uses its own click id and click_captured_at', () => {
  const r = buildAdsFeed([job({ leads: null, gclid: GCLID, click_captured_at: '2026-11-02T08:00:00Z' })], NOW);
  assert.equal(r.counts.rows, 1);
});
check('only one click id per row', () => {
  const r = buildAdsFeed([job({ leads: { gclid: GCLID, gbraid: GBRAID, created_at: '2026-11-01T08:00:00Z' } })], NOW);
  assert.equal(lines(r.csv)[2].split(',').filter((c) => /^[A-Za-z0-9_-]{8,}$/.test(c) && c !== 'EUR').length, 1);
});
check('job without click id is skipped and counted', () => {
  const r = buildAdsFeed([job({ leads: { gclid: null, created_at: '2026-11-01T08:00:00Z' } })], NOW);
  assert.equal(r.counts.skipped_no_click_id, 1);
  assert.equal(r.counts.rows, 0);
});
check('junk click id is not a click id', () =>
  assert.equal(buildAdsFeed([job({ leads: { gclid: 'a,b\n=cmd()', created_at: '2026-11-01T08:00:00Z' } })], NOW).counts.skipped_no_click_id, 1));
check('unfinished job ignored entirely', () => {
  const r = buildAdsFeed([job({ status: 'gepland' })], NOW);
  assert.deepEqual(r.counts, { rows: 0, skipped_no_click_id: 0, skipped_too_old: 0, skipped_bad_time: 0, skipped_no_value: 0, skipped_duplicate_click: 0, recovered_certain: 0, recovered_likely: 0 });
});

/* Click before conversion */
check('conversion before the lead was created is skipped', () =>
  assert.equal(buildAdsFeed([job({ completed_at: '2026-10-30T10:00:00Z' })], NOW).counts.skipped_bad_time, 1));
check('conversion at the same second as the lead is kept', () =>
  assert.equal(buildAdsFeed([job({ completed_at: '2026-11-01T08:00:00Z' })], NOW).counts.rows, 1));

/* Value */
check('149.5 becomes 149.50', () => assert.equal(formatValue(149.5), '149.50'));
check('string value with comma', () => assert.equal(formatValue('99,9'), '99.90'));
check('rounds to cents', () => assert.equal(formatValue(10.005 + 0.0001), '10.01'));
check('no thousands separator', () => assert.equal(formatValue(1234.5), '1234.50'));
check('zero value is skipped', () => assert.equal(buildAdsFeed([job({ gross_margin: 0 })], NOW).counts.skipped_no_value, 1));
check('null value is skipped', () => assert.equal(buildAdsFeed([job({ gross_margin: null })], NOW).counts.skipped_no_value, 1));
check('negative margin is skipped', () => assert.equal(buildAdsFeed([job({ gross_margin: -20 })], NOW).counts.skipped_no_value, 1));

/* One row per job, sorted, stable */
check('same job twice gives one row', () => assert.equal(buildAdsFeed([job(), job()], NOW).counts.rows, 1));
check('rows sorted by time', () => {
  const r = buildAdsFeed(
    [job({ id: 'b', completed_at: '2026-11-08T10:00:00Z' }), job({ id: 'a', completed_at: '2026-11-03T10:00:00Z' })],
    NOW
  );
  const t = lines(r.csv).slice(2, 4).map((l) => l.split(',')[4]);
  assert.deepEqual(t, ['2026-11-03 11:00:00', '2026-11-08 11:00:00']);
});
check('input order does not change output', () => {
  const a = job({ id: 'a', completed_at: '2026-11-03T10:00:00Z' });
  const b = job({ id: 'b', completed_at: '2026-11-03T10:00:00Z' });
  assert.equal(buildAdsFeed([a, b], NOW).csv, buildAdsFeed([b, a], NOW).csv);
});
check('same input twice is byte-identical', () => assert.equal(buildAdsFeed([job()], NOW).csv, buildAdsFeed([job()], NOW).csv));
check('output of a repeat day is the same row', () =>
  assert.equal(lines(buildAdsFeed([job()], NOW).csv)[2], lines(buildAdsFeed([job()], new Date('2026-11-12T12:00:00Z')).csv)[2]));

/* CSV escaping */
check('plain field untouched', () => assert.equal(csvField('abc'), 'abc'));
check('comma is quoted', () => assert.equal(csvField('a,b'), '"a,b"'));
check('quote is doubled', () => assert.equal(csvField('a"b'), '"a""b"'));
check('newline is quoted', () => assert.equal(csvField('a\nb'), '"a\nb"'));

/* No personal data */
check('no personal data in the file', () => {
  const pii = {
    customer_phone: '+31612345678',
    customer_name: 'Jan Jansen',
    email: 'jan@example.nl',
    address: 'Dorpsstraat 1',
    license_plate: 'AB-123-C',
  };
  const r = buildAdsFeed(
    [job({ ...pii, leads: { gclid: GCLID, created_at: '2026-11-01T08:00:00Z', ...pii, phone: '0612345678', name: 'Jan Jansen' } })],
    NOW
  );
  assert.equal(r.counts.rows, 1);
  for (const s of ['Jan', '0612345678', '+31612345678', '@', 'Dorpsstraat', 'AB-123-C']) {
    assert.ok(!r.csv.includes(s), `leaked ${s}`);
  }
});

/* Auth */
const PW = 'x'.repeat(12) + 'Y'.repeat(12);
const basic = (u: string, p: string) => 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
check('right user and password', () => assert.equal(checkAdsFeedAuth(basic('google-ads', PW), PW), true));
check('wrong password', () => assert.equal(checkAdsFeedAuth(basic('google-ads', PW + 'x'), PW), false));
check('wrong username', () => assert.equal(checkAdsFeedAuth(basic('admin', PW), PW), false));
check('missing header', () => assert.equal(checkAdsFeedAuth(null, PW), false));
check('bearer is not basic', () => assert.equal(checkAdsFeedAuth(`Bearer ${PW}`, PW), false));
check('short password env switches the feed off', () => {
  const short = 'short-password-23-chars';
  assert.equal(short.length, 23);
  assert.equal(checkAdsFeedAuth(basic('google-ads', short), short), false);
});
check('missing password env switches the feed off', () => assert.equal(checkAdsFeedAuth(basic('google-ads', ''), undefined), false));
check('empty password env switches the feed off', () => assert.equal(checkAdsFeedAuth(basic('google-ads', ''), ''), false));
check('no colon in credentials', () => assert.equal(checkAdsFeedAuth('Basic ' + Buffer.from('google-ads').toString('base64'), PW), false));
check('password containing a colon works', () => {
  const p = 'ab:' + 'z'.repeat(24);
  assert.equal(checkAdsFeedAuth(basic('google-ads', p), p), true);
});

console.log(`ads feed: ${n} checks passed`);
