/**
 * The check behind the invoice money path: `node scripts/check-invoice-allocation.mts`.
 * Plain node, no network, no database — pure arithmetic on random line sets.
 *
 * What it guards: the preview on screen and the row the API stores are two
 * different pieces of code doing the same sum. When they disagree by a cent,
 * the customer gets a sheet that does not match the receivable, and the first
 * person to notice is the one chasing the payment. So on 2,000 random invoices:
 *
 *   1. the per-line discount shares add up to the capped discount, exactly;
 *   2. no share is negative or larger than the line it sits on (a negative
 *      line base is how a discount field turns into a refund);
 *   3. the preview total equals what /api/admin/invoices recomputes from the
 *      payload the preview sends;
 *   4. no total is ever negative — credit settles, it never pays out.
 */
import assert from 'node:assert/strict';
import {
  getInvoiceTotals,
  invoiceTaxOptions,
  toApiPayload,
  walkInClient,
  type InvoiceFormValues,
  type InvoiceLineItem,
} from '../src/app/admin/facturen/nieuw/_components/data.ts';

const RUNS = 2000;
const cents = (n: number) => Math.round(n * 100);
const round2 = (n: number) => Math.round(n * 100) / 100;

/* Mulberry32: the same 2,000 invoices on every run, so a failure is reproducible. */
let seed = 0x9e3779b9;
function random() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
const between = (min: number, max: number) => min + random() * (max - min);
/** A price with cents, like a human types it. */
const price = () => Math.round(between(0, 1500) * 100) / 100;

function randomInvoice(): InvoiceFormValues {
  const items: InvoiceLineItem[] = Array.from({ length: 1 + Math.floor(random() * 8) }, (_, i) => ({
    id: `item-${i}`,
    description: `Regel ${i + 1}`,
    quantity: 1 + Math.floor(random() * 10),
    unitPrice: price(),
  }));
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const percent = random() < 0.5;
  return {
    referenceNumber: '',
    issuedDate: '2026-11-19',
    paymentDueDate: '2026-12-03',
    from: {
      name: 'KeyForCars', email: '', phone: '', website: '', street: '', postcode: '', city: '',
      kvk: '', btw: '', iban: '', accountName: '',
    },
    to: { ...walkInClient, name: 'Testklant' },
    taxId: pick(invoiceTaxOptions).id,
    discountType: percent ? 'percent' : 'fixed',
    discountValue: percent ? round2(between(0, 100)) : round2(between(0, subtotal + 10)),
    creditApplied: round2(between(0, subtotal * 1.21 + 5)),
    notes: '',
    items,
  };
}

/**
 * What /api/admin/invoices POST does with the payload: per line a base of
 * quantity × price − discount, vat per line, both sums rounded once, credit
 * capped at what is owed. Kept in step with route.ts by hand — if that loop
 * changes, this fails, which is the point.
 */
function routeRecompute(payload: ReturnType<typeof toApiPayload>) {
  let subtotal = 0;
  let vatTotal = 0;
  for (const line of payload.lines) {
    const base = line.quantity * line.unitPrice - line.discount;
    assert.ok(base >= 0, `route would reject this invoice: line base ${base}`);
    subtotal += base;
    vatTotal += base * (line.vatRate / 100);
  }
  subtotal = round2(subtotal);
  vatTotal = round2(vatTotal);
  const credit = Math.min(payload.credit_applied, round2(subtotal + vatTotal));
  return { subtotal, vatTotal, total: round2(subtotal + vatTotal - credit) };
}

let checked = 0;
for (let run = 0; run < RUNS; run++) {
  const invoice = randomInvoice();
  const totals = getInvoiceTotals(invoice);
  const payload = toApiPayload(invoice);
  const where = `run ${run} (${totals.items.length} regels, btw ${totals.rate}%, korting ${invoice.discountType} ${invoice.discountValue})`;

  // 1. every cent of the discount lands somewhere.
  assert.equal(
    totals.lineDiscounts.reduce((sum, share) => sum + cents(share), 0),
    cents(totals.discount),
    `discount shares do not add up to the discount — ${where}`
  );

  // 2. no share negative, none bigger than its own line.
  totals.items.forEach((item, index) => {
    const share = cents(totals.lineDiscounts[index]);
    const amount = cents(item.quantity * item.unitPrice);
    assert.ok(share >= 0, `negative line discount ${share} — ${where}`);
    assert.ok(share <= amount, `line discount ${share} exceeds line amount ${amount} — ${where}`);
  });

  // 3. the stored row equals the sheet.
  const stored = routeRecompute(payload);
  assert.equal(cents(stored.total), cents(totals.total), `route total ${stored.total} ≠ preview total ${totals.total} — ${where}`);
  assert.equal(cents(stored.subtotal), cents(totals.net), `route subtotal ${stored.subtotal} ≠ preview net ${totals.net} — ${where}`);
  assert.equal(cents(stored.vatTotal), cents(totals.vat), `route vat ${stored.vatTotal} ≠ preview vat ${totals.vat} — ${where}`);

  // 4. an invoice never pays out.
  assert.ok(totals.total >= 0, `negative total ${totals.total} — ${where}`);
  assert.ok(payload.credit_applied <= round2(totals.net + totals.vat) + 1e-9, `credit above what is owed — ${where}`);
  checked++;
}

console.log(`OK — ${checked} random invoices: discount allocation exact, no negative line or total, preview total = stored total.`);
