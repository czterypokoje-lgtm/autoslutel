// node --experimental-strip-types scripts/check-lead-quotes.mts — validation
// behind POST /api/ops/quotes: docs/lead-quotes.md §3.1-3.2.
import assert from 'node:assert/strict';
import { normalizeQuoteInput, priceBand } from '../src/lib/leadQuotes.ts';

const base = {
  phone: '0611751231',
  at: '2026-11-20T10:00:00.000Z',
  channel: 'whatsapp',
  make: 'Volkswagen',
  model: 'Golf',
  year: 2018,
  scenario: 'bijmaken',
  price: 95,
  quote: 'Dat wordt dan 95 euro voor de nieuwe sleutel.',
  ref: 'chat-123',
  confidence: 0.9,
};

// A valid row is accepted, the phone normalised, the price and quote kept.
const valid = normalizeQuoteInput(base);
assert.equal(valid.ok, true);
if (valid.ok) {
  assert.equal(valid.row.phone, '+31611751231');
  assert.equal(valid.row.price, 95);
  assert.equal(valid.row.evidenceQuote, 'Dat wordt dan 95 euro voor de nieuwe sleutel.');
}

// A quote that never states the amount has no evidence — the row is rejected
// rather than stored as an unverifiable number.
const noAmount = normalizeQuoteInput({ ...base, quote: 'Ik bel u straks terug met een prijs.' });
assert.equal(noAmount.ok, false);
if (!noAmount.ok) assert.equal(noAmount.reason, 'no_evidence');

// A scenario outside the job_scenario enum is rejected, never guessed at.
const badScenario = normalizeQuoteInput({ ...base, scenario: 'onzin' });
assert.equal(badScenario.ok, false);
if (!badScenario.ok) assert.equal(badScenario.reason, 'invalid_scenario');

// Dutch decimal comma: "95,00" is the same amount as 95.
const commaPrice = normalizeQuoteInput({ ...base, price: '95,00' });
assert.equal(commaPrice.ok, true);
if (commaPrice.ok) assert.equal(commaPrice.row.price, 95);

// A long chat excerpt is clipped to 160 chars, the amount still inside it.
const longQuote = 'Dat wordt dan 95 euro voor de nieuwe sleutel. ' + 'A'.repeat(200);
const clipped = normalizeQuoteInput({ ...base, quote: longQuote });
assert.equal(clipped.ok, true);
if (clipped.ok) {
  assert.ok(clipped.row.evidenceQuote.length <= 160);
  assert.ok(clipped.row.evidenceQuote.startsWith('Dat wordt dan 95 euro'));
}

// A phone number inside the quote itself is redacted, not stored verbatim.
const withPhone = normalizeQuoteInput({
  ...base,
  quote: 'Bel me op 0612345678, het wordt 95 euro voor de sleutel.',
});
assert.equal(withPhone.ok, true);
if (withPhone.ok) {
  assert.ok(!withPhone.row.evidenceQuote.includes('0612345678'));
  assert.ok(withPhone.row.evidenceQuote.includes('[phone]'));
}

// Price bands, §3.3: "boven welk bedrag verliezen we" — half-open intervals.
assert.equal(priceBand(100), '0-150');
assert.equal(priceBand(150), '150-250');
assert.equal(priceBand(249.99), '150-250');
assert.equal(priceBand(250), '250-400');
assert.equal(priceBand(400), '400+');
assert.equal(priceBand(1000), '400+');

console.log('Lead quote checks passed.');
