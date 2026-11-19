/**
 * Checks behind the shared agent knowledge table:
 * `node scripts/check-agent-knowledge.mts`. Plain node, fixtures, no network.
 *
 * What it guards: every AI agent states what this table says. A phone number
 * left in a stored example is a privacy leak, and an unconfirmed row served as
 * a fact is an agent promising something the owner never approved.
 */
import assert from 'node:assert/strict';
import {
  SAY_WHEN_UNKNOWN,
  TOPICS,
  applyGaps,
  decide,
  forAgent,
  isTopic,
  redactExample,
  slugKey,
  type KnowledgeRow,
} from '../src/lib/agentKnowledge.ts';

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

const NOW = new Date('2026-11-12T09:30:00Z');
const row = (over: Partial<KnowledgeRow> = {}): KnowledgeRow => ({
  key: 'prices.spare',
  topic: 'prices',
  question: 'What does a spare key cost?',
  answer: null,
  rule: null,
  status: 'unknown',
  asked_count: 0,
  last_asked_at: null,
  example: null,
  source: null,
  approved_at: null,
  ...over,
});

/* Topics */
check('16 topics', () => assert.equal(TOPICS.length, 16));
check('isTopic accepts prices', () => assert.equal(isTopic('prices'), true));
check('isTopic rejects unknown', () => assert.equal(isTopic('weather'), false));
check('isTopic rejects non-string', () => assert.equal(isTopic(42), false));
check('isTopic rejects null', () => assert.equal(isTopic(null), false));

/* Redaction */
check('redacts NL mobile with spaces', () => assert.ok(!/11 75/.test(redactExample('call me 06 11 75 12 31 please'))));
check('redacts NL mobile with dashes', () => assert.ok(!/1234/.test(redactExample('06-1234 5678 is my number'))));
check('redacts +31 number', () => assert.ok(!/\d{4}/.test(redactExample('reach me on +31 6 1234 5678'))));
check('redacts 0031 number', () => assert.ok(!/\d{4}/.test(redactExample('0031612345678'))));
check('redacts e-mail', () => assert.ok(!redactExample('mail jan.de-vries@example.nl now').includes('@')));
check('redacts dashed plate', () => assert.ok(!redactExample('my car is AB-123-C').includes('123')));
check('redacts plate 99-XX-99', () => assert.ok(!redactExample('plate 12-AB-34 here').includes('12-AB')));
check('redacts plate XX-99-XX', () => assert.ok(!redactExample('plate GH-45-JK here').includes('GH-45')));
check('redacts plate without dashes (uppercase)', () => assert.ok(!redactExample('kenteken 12AB34 klopt').includes('12AB34')));
check('redacts lowercase dashed plate', () => assert.ok(!redactExample('ab-12-cd it is').includes('ab-12')));
check('redacts long digit run', () => assert.ok(!redactExample('order 1234567 not here').includes('1234567')));
check('redacts 6 digits', () => assert.ok(!redactExample('code 123456').includes('123456')));
check('keeps 5 digits', () => assert.ok(redactExample('postcode 12345').includes('12345')));
check('keeps normal text', () => assert.equal(redactExample('How much for a spare key?'), 'How much for a spare key?'));
check('keeps a model year', () => assert.ok(redactExample('Golf from 2019 please').includes('2019')));
check('keeps words between numbers', () => assert.ok(redactExample('between 20 de 19 things').includes('de')));
check('collapses whitespace', () => assert.equal(redactExample('  a \n\n b  '), 'a b'));
check('trims to 200', () => assert.equal(redactExample('x'.repeat(5000)).length, 200));
check('exactly 200 stays', () => assert.equal(redactExample('y'.repeat(200)).length, 200));
check('non-string gives empty', () => assert.equal(redactExample({ a: 1 }), ''));
check('undefined gives empty', () => assert.equal(redactExample(undefined), ''));

/* Slugging */
check('slug basic', () => assert.equal(slugKey('prices', 'What does a spare key cost?'), 'prices.what_does_a_spare_key_cost'));
check('slug strips accents and symbols', () => assert.equal(slugKey('hours', 'Zondag open?!'), 'hours.zondag_open'));
check('slug empty question', () => assert.equal(slugKey('prices', '???'), 'prices.item'));
check('slug unknown topic becomes other', () => assert.ok(slugKey('nope', 'hi').startsWith('other.')));
check('slug length capped', () => assert.ok(slugKey('prices', 'a '.repeat(500)).length <= 'prices.'.length + 48));
check('slug wrong type', () => assert.equal(slugKey('prices', 5 as unknown as string), 'prices.item'));

/* forAgent */
const table = [
  row({ key: 'p1', question: 'Is the price incl. VAT?', answer: 'Yes, includes VAT.', status: 'confirmed' }),
  row({ key: 'p2', question: 'Do you give discount?', status: 'unknown' }),
  row({ key: 'p3', question: 'Cheaper than the dealer?', status: 'proposed' }),
  row({ key: 'p4', question: 'Old fact', answer: 'obsolete', status: 'retired' }),
  row({ key: 'a1', topic: 'arrival', question: 'How fast?', rule: 'never promise a time', status: 'confirmed' }),
  row({ key: 'a2', topic: 'arrival', question: 'Arrival in Utrecht?', status: 'unknown' }),
];
const view = forAgent(table, { topic: 'prices' });
check('facts are only confirmed', () => assert.deepEqual(view.facts.map((f) => f.question), ['Is the price incl. VAT?']));
check('unknown and proposed are listed', () => assert.equal(view.unknown.length, 2));
check('retired is nowhere', () => assert.ok(!JSON.stringify(view).includes('obsolete')));
check('fact shape', () => assert.deepEqual(Object.keys(view.facts[0]).sort(), ['answer', 'question', 'rule', 'topic']));
check('fixed Dutch sentence', () => assert.equal(view.say_when_unknown, 'Dat weet ik niet zeker. Een collega neemt contact met u op.'));
check('constant matches', () => assert.equal(SAY_WHEN_UNKNOWN, view.say_when_unknown));
check('topic filter excludes other topics', () => assert.ok(view.facts.every((f) => f.topic === 'prices')));
check('no topic returns all topics', () => assert.equal(forAgent(table).facts.length, 2));
check('q filters case-insensitively', () => assert.equal(forAgent(table, { q: 'HOW FAST' }).facts.length, 1));
check('q matches the answer', () => assert.equal(forAgent(table, { topic: 'prices', q: 'vat' }).facts.length, 1));
check('q with no hit falls back to the topic', () => assert.equal(forAgent(table, { topic: 'arrival', q: 'zzzz' }).facts.length, 1));
check('empty q is ignored', () => assert.equal(forAgent(table, { q: '   ' }).facts.length, 2));
check('hostile q does not throw', () => assert.doesNotThrow(() => forAgent(table, { q: 'x'.repeat(100000) })));
check('non-array rows give empty', () => assert.deepEqual(forAgent(null as unknown as KnowledgeRow[]).facts, []));
check('non-string q is ignored', () => assert.equal(forAgent(table, { q: 7 as unknown as string }).facts.length, 2));

/* applyGaps */
const open = [row({ key: 'prices.a', asked_count: 2 }), row({ key: 'prices.b', status: 'proposed', asked_count: 0 })];
const bump = applyGaps(open, [{ topic: 'prices', asked: 3 }], NOW);
check('bumps every open row of the topic', () => assert.equal(bump.updates.length, 2));
check('bump adds to the count', () => assert.equal(bump.updates[0].asked_count, 5));
check('bump stamps last_asked_at', () => assert.equal(bump.updates[0].last_asked_at, NOW.toISOString()));
check('bump creates nothing', () => assert.equal(bump.upserts.length, 0));
const made = applyGaps([], [{ topic: 'arrival', asked: 4, example: 'call 0611751231 now' }], NOW);
check('creates gap row when no open row', () => assert.equal(made.upserts[0].key, 'gap.arrival'));
check('gap row is proposed', () => assert.equal(made.upserts[0].status, 'proposed'));
check('gap question text', () =>
  assert.equal(made.upserts[0].question, 'Customers ask about arrival and the agent had no answer'));
check('gap example is redacted', () => assert.ok(!(made.upserts[0].example ?? '').includes('0611751231')));
check('gap keeps asked count', () => assert.equal(made.upserts[0].asked_count, 4));
const dupe = applyGaps([], [{ topic: 'arrival', asked: 1 }, { topic: 'arrival', asked: 2 }], NOW);
check('two gaps same topic make one row', () => assert.equal(dupe.upserts.length, 1));
check('merged gap sums asked', () => assert.equal(dupe.upserts[0].asked_count, 3));
const again = applyGaps([row({ key: 'gap.arrival', topic: 'arrival', status: 'proposed', asked_count: 4 })], [{ topic: 'arrival', asked: 1 }], NOW);
check('existing gap row is bumped, not duplicated', () => assert.deepEqual([again.updates.length, again.upserts.length], [1, 0]));
check('confirmed rows are never bumped', () =>
  assert.equal(applyGaps([row({ status: 'confirmed', answer: 'x' })], [{ topic: 'prices' }], NOW).updates.length, 0));
check('retired gap is not revived', () =>
  assert.equal(applyGaps([row({ key: 'gap.prices', status: 'retired' })], [{ topic: 'prices' }], NOW).upserts.length, 0));
check('unknown topic ignored', () => assert.equal(applyGaps([], [{ topic: 'weather', asked: 1 }], NOW).upserts.length, 0));
check('asked defaults to 1', () => assert.equal(applyGaps([], [{ topic: 'hours' }], NOW).upserts[0].asked_count, 1));
check('negative or float asked becomes 1', () =>
  assert.equal(applyGaps([], [{ topic: 'hours', asked: -5 }, { topic: 'discount', asked: 1.5 }], NOW).upserts[1].asked_count, 1));
check('string asked becomes 1', () => assert.equal(applyGaps([], [{ topic: 'hours', asked: '9' }], NOW).upserts[0].asked_count, 1));
check('garbage gaps do not throw', () =>
  assert.doesNotThrow(() => applyGaps([], [null, 5, 'x', {}] as never, NOW)));
check('non-array gaps give nothing', () => assert.equal(applyGaps([], 'x' as never, NOW).upserts.length, 0));

/* decide */
const base = row({ key: 'k', status: 'unknown' });
check('confirm without answer or rule is refused', () => assert.equal(typeof decide(base, { decision: 'confirm' }, NOW), 'string'));
check('confirm with blank answer is refused', () => assert.equal(typeof decide(base, { decision: 'confirm', answer: '   ' }, NOW), 'string'));
const ok = decide(base, { decision: 'confirm', answer: ' Yes, 24/7. ' }, NOW) as KnowledgeRow;
check('confirm sets status', () => assert.equal(ok.status, 'confirmed'));
check('confirm trims the answer', () => assert.equal(ok.answer, 'Yes, 24/7.'));
check('confirm sets approved_at', () => assert.equal(ok.approved_at, NOW.toISOString()));
check('confirm sets source with date', () => assert.equal(ok.source, 'owner 2026-11-12'));
check('confirm with a rule only works', () =>
  assert.equal((decide(base, { decision: 'confirm', rule: 'never promise a time' }, NOW) as KnowledgeRow).status, 'confirmed'));
check('confirm keeps an existing answer', () =>
  assert.equal((decide(row({ answer: 'old' }), { decision: 'confirm' }, NOW) as KnowledgeRow).answer, 'old'));
check('confirm overrides an existing answer', () =>
  assert.equal((decide(row({ answer: 'old' }), { decision: 'confirm', answer: 'new' }, NOW) as KnowledgeRow).answer, 'new'));
const gone = decide(row({ status: 'confirmed', answer: 'x' }), { decision: 'retire' }, NOW) as KnowledgeRow;
check('retire sets status', () => assert.equal(gone.status, 'retired'));
check('retire dates the source', () => assert.equal(gone.source, 'owner 2026-11-12'));
check('retire needs no answer', () => assert.equal(typeof decide(base, { decision: 'retire' }, NOW), 'object'));
check('unknown decision refused', () => assert.equal(typeof decide(base, { decision: 'approve' }, NOW), 'string'));
check('missing decision refused', () => assert.equal(typeof decide(base, {}, NOW), 'string'));
check('answer of wrong type refused', () => assert.equal(typeof decide(base, { decision: 'confirm', answer: 5 }, NOW), 'string'));
check('very long answer refused', () => assert.equal(typeof decide(base, { decision: 'confirm', answer: 'a'.repeat(5000) }, NOW), 'string'));
check('null input refused', () => assert.equal(typeof decide(base, null as never, NOW), 'string'));
check('decide does not mutate the row', () => assert.equal(base.status, 'unknown'));

console.log(`OK: ${n} checks passed`);
