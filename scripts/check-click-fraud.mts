/**
 * The one check behind the click-fraud verdict:
 * `node scripts/check-click-fraud.mts`.
 *
 * WHAT IT IS GUARDING. The output of judgeIp() gets pasted into a live Google
 * Ads campaign as an IP exclusion. The failure mode that costs real money is
 * not a bot that scores clean — that is one click. It is a CUSTOMER whose
 * address lands in the exclusion list, because that address is then
 * unreachable for as long as the list stands and nobody will ever notice.
 *
 * So most of what follows asserts RESTRAINT: a foreign IP on its own, an even
 * click rhythm on its own, three silent landings, twenty landings from one
 * office, every headless tell at once — all of it stays below the exclusion
 * line. The handful of conviction cases exist so that restraint cannot be
 * achieved by simply never convicting anything.
 */
import assert from 'node:assert/strict';
import {
  judgeIp,
  judgeAll,
  FRAUD_POINTS,
  SUSPECT_POINTS,
  type AdVisit,
  type ClientSignals,
} from '../src/lib/clickFraud.ts';

/* A plain, unremarkable paid landing: a real browser that reported in. */
const visit = (over: Partial<AdVisit> = {}): AdVisit => ({
  id: crypto.randomUUID(),
  created_at: new Date('2026-10-01T12:00:00Z').toISOString(),
  ip: '1.2.3.4',
  country: 'NL',
  user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  path: '/autosleutel-bijmaken',
  gclid: 'Cj0KCQiA_test',
  wbraid: null,
  gbraid: null,
  msclkid: null,
  campaign_id: '24286719575',
  keyword: 'autosleutel bijmaken',
  js_ran: true,
  interacted: true,
  webdriver: false,
  client_signals: null,
  ...over,
});

/** `count` landings, `gapSeconds` apart, all sharing one address. */
const series = (count: number, gapSeconds: number, over: Partial<AdVisit> = {}): AdVisit[] =>
  Array.from({ length: count }, (_, i) =>
    visit({
      ...over,
      created_at: new Date(Date.parse('2026-10-01T12:00:00Z') + i * gapSeconds * 1000).toISOString(),
    })
  );

const judge = (visits: AdVisit[]) => {
  const result = judgeIp(visits);
  assert.ok(result, 'judgeIp returned null for a non-empty list');
  return result;
};

/* The tiers have to stay ordered, or every assertion below is meaningless. */
assert.ok(SUSPECT_POINTS < FRAUD_POINTS, 'verdacht must sit below fraude');
assert.ok(SUSPECT_POINTS > 0, 'a clean address must be able to score zero');

/* ── nothing to see here ─────────────────────────────────────────────── */

// One customer, one click, read the page, tapped the phone number.
{
  const j = judge([visit()]);
  assert.equal(j.tier, 'ok');
  assert.equal(j.points, 0);
  assert.equal(j.silent, 0);
}

// Two silent landings. A tunnel, an adblocker, a closed tab. Not evidence.
{
  const j = judge(series(2, 3600, { js_ran: false, interacted: false }));
  assert.equal(j.tier, 'ok', 'two silent landings must not raise suspicion');
  assert.equal(j.silent, 2);
}

/* ── restraint: a single strong-feeling signal must never convict ─────── */

// RESTRAINT: a foreign address, on its own. Dutch people use VPNs and go on
// holiday, and one point can never reach the exclusion line.
{
  const j = judge([visit({ country: 'PL' })]);
  assert.equal(j.points, 1);
  assert.equal(j.tier, 'ok', 'a foreign IP alone must not even be suspicious');
}

// RESTRAINT: a machine-like rhythm, on its own. Someone comparing five of our
// city pages in one sitting looks exactly like this.
{
  const j = judge(series(5, 60, {}));
  assert.ok(j.points < SUSPECT_POINTS, `even cadence alone scored ${j.points}`);
  assert.equal(j.tier, 'ok');
}

// RESTRAINT: every headless tell at once, from a browser that did report in.
// All four are client-supplied and therefore forgeable, so together they are
// capped below the exclusion line on purpose.
{
  const signals: ClientSignals = {
    cores: 1,
    width: 800,
    height: 600,
    timezone: 'UTC',
    languages: '',
  };
  const j = judge([visit({ client_signals: signals })]);
  assert.ok(j.points <= 2, `forgeable signals scored ${j.points}, expected at most 2`);
  assert.equal(j.tier, 'ok', 'self-reported signals alone must never convict');
}

// RESTRAINT: twenty landings from one address, every one a real browser that
// clicked something. A shared office NAT, a school, a big household — it is
// worth looking at, and it is not worth excluding.
{
  const j = judge(series(20, 86_400, {}));
  assert.equal(j.tier, 'verdacht', 'high volume of real browsers is suspicious, not fraud');
  assert.ok(j.points < FRAUD_POINTS, `volume alone scored ${j.points}`);
}

// RESTRAINT: three silent landings is exactly the suspicion line — a person
// should see it, and nobody should be excluded for it.
{
  const j = judge(series(3, 7200, { js_ran: false, interacted: false }));
  assert.equal(j.points, SUSPECT_POINTS);
  assert.equal(j.tier, 'verdacht');
  assert.ok(j.points < FRAUD_POINTS, 'three silent landings must not reach exclusion');
}

// RESTRAINT: one landing where the browser admitted automation. This could be
// our own developer testing a tracking template with Playwright, and
// excluding the office's own address is the expensive mistake.
{
  const j = judge([visit({ webdriver: true })]);
  assert.equal(j.tier, 'verdacht');
  assert.ok(j.points < FRAUD_POINTS, `a single webdriver landing scored ${j.points}`);
}

/* ── conviction: restraint must not mean never convicting ────────────── */

// THE CASE THIS FILE EXISTS FOR. Nine landings where no JavaScript ever ran is
// not a bad connection nine times. An earlier calibration scored this only
// `verdacht`, which meant the one pattern worth excluding never reached the
// list and the whole screen was decoration.
{
  const j = judge(series(9, 3600, { js_ran: false, interacted: false }));
  assert.equal(j.tier, 'fraude', 'nine silent paid landings must reach the exclusion list');
  assert.ok(j.points >= FRAUD_POINTS);
}

// Two landings that both announced automation. One is a maybe; twice is a
// habit, and navigator.webdriver is the browser's own admission.
{
  const j = judge(series(2, 3600, { webdriver: true }));
  assert.equal(j.tier, 'fraude', 'repeated self-declared automation must convict');
}

// Weak signals stacking into a strong one: six silent landings, from outside
// the service area, nobody ever touching anything. No single line convicts.
{
  const j = judge(series(6, 1800, { js_ran: false, interacted: false, country: 'IN' }));
  assert.equal(j.tier, 'fraude');
}

/* ── every conviction must be explainable ────────────────────────────── */

// An exclusion gets justified to Google support and to the owner. A verdict
// with no stated reason cannot be defended, so it must not be possible.
for (const visits of [
  series(9, 3600, { js_ran: false, interacted: false }),
  series(2, 3600, { webdriver: true }),
  series(6, 1800, { js_ran: false, interacted: false, country: 'IN' }),
]) {
  const j = judge(visits);
  assert.ok(j.reasons.length > 0, 'a conviction with no reasons is indefensible');
  for (const reason of j.reasons) assert.ok(reason.trim().length > 3);
}

/* ── the evidence a credit claim needs ───────────────────────────────── */

// Google support asks for the click id by name. Losing it to deduplication
// would make the claim unfilable, so it is collected per address.
{
  const j = judge([
    visit({ gclid: 'click-a' }),
    visit({ gclid: 'click-b' }),
    visit({ gclid: 'click-a' }),
    visit({ gclid: null, msclkid: 'bing-a' }),
  ]);
  assert.deepEqual([...j.clickIds].sort(), ['bing-a', 'click-a', 'click-b']);
  assert.deepEqual(j.campaigns, ['24286719575']);
  assert.equal(j.visits, 4);
}

// First and last seen bracket the period a claim covers, regardless of the
// order the rows came back in.
{
  const visits = series(4, 3600, {});
  const j = judge([...visits].reverse());
  assert.equal(j.firstSeen, visits[0]!.created_at);
  assert.equal(j.lastSeen, visits[3]!.created_at);
}

/* ── grouping ────────────────────────────────────────────────────────── */

// judgeAll splits by address and puts the worst first, because that is the
// order a person reads the table in.
{
  const all = judgeAll([
    ...series(9, 3600, { js_ran: false, interacted: false, ip: '9.9.9.9' }),
    ...series(1, 0, { ip: '5.5.5.5' }),
  ]);
  assert.equal(all.length, 2);
  assert.equal(all[0]!.ip, '9.9.9.9');
  assert.equal(all[0]!.tier, 'fraude');
  assert.equal(all[1]!.ip, '5.5.5.5');
  assert.equal(all[1]!.tier, 'ok');
}

// A row with no address cannot be judged and must not become a group — least
// of all an exclusion entry of its own.
{
  assert.deepEqual(judgeAll([visit({ ip: null })]), []);
  assert.equal(judgeIp([]), null);
}

// One address is one verdict, however many landings it produced.
{
  const all = judgeAll(series(5, 600, { ip: '7.7.7.7' }));
  assert.equal(all.length, 1);
  assert.equal(all[0]!.visits, 5);
}

console.log('check-click-fraud: ok');
