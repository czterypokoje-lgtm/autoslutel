/**
 * The one check behind the Telegram receipt flow: `node scripts/check-expense-caption.mts`.
 *
 * Every case here is a caption a monteur has a real reason to type. The ones
 * that matter most are the last two: a number that is not money must not be
 * read as money, because an expense filed at €20.260.927 is worse than one
 * filed with no amount at all.
 */
import assert from 'node:assert/strict';
import { parseExpenseCaption, readAmount } from '../src/lib/expenseCaption.ts';

const at = (caption: string) => parseExpenseCaption(caption);

// Amount and category out of one caption, in either order.
assert.equal(at('35,20 benzine').amount, 35.2);
assert.equal(at('35,20 benzine').category, 'fuel');
assert.equal(at('benzin almak 40').amount, 40);
assert.equal(at('benzin almak 40').category, 'fuel');
assert.equal(at('€12.50 parkeren Amsterdam').amount, 12.5);
assert.equal(at('€12.50 parkeren Amsterdam').category, 'parking');
assert.equal(at('yakit 55 euro').amount, 55);

// Description is what is left over, and never empty.
assert.equal(at('35,20 shell a10').description, 'shell a10');
assert.equal(at('').description, 'Overig');
assert.equal(at('').category, 'other');
assert.equal(at('').amount, null);
assert.equal(at('bon').amount, null);

// A faktura from a supplier is an expense too, on the supplier category.
assert.equal(at('faktura A-Key 245,00').category, 'supplier');
assert.equal(at('faktura A-Key 245,00').amount, 245);

// Paid privately unless the caption says the company card paid.
assert.equal(at('35 benzine').isReimbursable, true);
assert.equal(at('35 benzine zakelijk').isReimbursable, false);

// A currency marker wins over a bare number sitting elsewhere in the text.
assert.equal(readAmount('factuur 2026 bedrag €45'), 45);

// Not money: too big to be a receipt, so nothing is claimed.
assert.equal(readAmount('factuur 20260927'), null);
assert.equal(readAmount('0'), null);

console.log('expenseCaption: all checks passed');
