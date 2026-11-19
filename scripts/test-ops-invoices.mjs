// node --experimental-strip-types scripts/test-ops-invoices.mjs
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { readDraft } from '../src/lib/opsInvoiceDraft.ts';
import { buildInvoicePdf } from '../src/lib/opsInvoicePdf.ts';
import { summarizeInvoices } from '../src/lib/opsInvoices.ts';

const invoice = (over) => ({
  invoice_number: 'I-00001', issue_date: '2026-11-01', client_name: 'Garage Jansen',
  total: '121.00', status: 'verzonden', ...over,
});
const run = (rows) => summarizeInvoices(rows, '2026-11-06');

// Inside the 14-day term: open, not overdue.
let result = run([invoice()]);
assert.equal(result.counts.open, 1);
assert.equal(result.counts.overdue, 0);
assert.equal(result.openAmount, 121);

// The last day of the term is not late, the day after is.
assert.equal(run([invoice({ issue_date: '2026-10-23' })]).counts.overdue, 0);
result = run([invoice({ issue_date: '2026-10-22' })]);
assert.equal(result.counts.overdue, 1);
assert.equal(result.overdue[0].daysOverdue, 1);

// A concept or a paid invoice is never overdue or part of what is owed.
result = run([
  invoice({ status: 'concept', issue_date: '2026-01-01' }),
  invoice({ status: 'betaald', issue_date: '2026-01-01' }),
]);
assert.equal(result.counts.overdue, 0);
assert.equal(result.openAmount, 0);
assert.equal(result.counts.concept, 1);
assert.equal(result.counts.paid, 1);

// Amounts add up without float noise, and the latest overdue comes first by age.
result = run([
  invoice({ total: '0.10', issue_date: '2026-10-01' }),
  invoice({ total: '0.20', issue_date: '2026-09-01' }),
]);
assert.equal(result.overdueAmount, 0.3);
assert.equal(result.overdue[0].total, 0.2);

// Lists stay short, totals still count everything.
result = run(Array.from({ length: 15 }, () => invoice({ issue_date: '2026-10-01' })));
assert.equal(result.overdue.length, 10);
assert.equal(result.latest.length, 10);
assert.equal(result.counts.overdue, 15);

// Nothing leaves that the assistant does not need.
assert.deepEqual(Object.keys(run([invoice()]).latest[0]).sort(),
  ['client', 'date', 'daysOverdue', 'number', 'status', 'total']);

// Drafts ---------------------------------------------------------------------
const body = (over) => ({
  client_name: 'Garage Jansen',
  prices_include_vat: false,
  lines: [{ description: 'Reservesleutel', price: 100 }],
  ...over,
});

// Excluding btw: 100 + 21.
let draft = readDraft(body()).draft;
assert.deepEqual([draft.subtotal, draft.vatTotal, draft.total], [100, 21, 121]);

// Including btw: the owner's 150 stays 150.
draft = readDraft(body({ prices_include_vat: true, lines: [{ description: 'Sleutel', price: 150 }] })).draft;
assert.equal(draft.total, 150);
assert.equal(draft.lines[0].unitPrice, 123.97);

// A total sent along is ignored.
assert.equal(readDraft(body({ total: 1, subtotal: 1 })).draft.total, 121);

// Never guessed: no btw choice, no name, no price, an odd rate.
assert.match(readDraft(body({ prices_include_vat: undefined })).error, /btw/);
assert.ok(readDraft(body({ client_name: ' ' })).error);
assert.ok(readDraft(body({ lines: [] })).error);
assert.ok(readDraft(body({ lines: [{ description: 'x', price: 0 }] })).error);
assert.ok(readDraft(body({ lines: [{ description: 'x', price: 10, vat_rate: 19 }] })).error);

// PDF ------------------------------------------------------------------------
const sample = {
  invoice_number: 'I-00042', issue_date: '2026-11-06', biller_name: 'Autosleutel24',
  biller_email: 'info@example.nl', biller_phone: '020 000 0000', biller_kvk: '00000000',
  biller_btw: null, biller_iban: null, client_name: 'Şükrü Yılmaz Garage',
  client_street: 'Teststraat 1', client_postcode: '1012 AB', client_city: 'Amsterdam',
  client_email: null, client_phone: null, client_btw: null,
  notes: 'Graag betalen binnen 14 dagen.', subtotal: 100, vat_total: 21, total: 121,
};
const pdfLines = [{ description: 'Reservesleutel '.repeat(12), quantity: 1, unit_price: 100, vat_rate: 21 }];
const pdf = await buildInvoicePdf(sample, pdfLines);
assert.equal(Buffer.from(pdf.slice(0, 4)).toString(), '%PDF');
if (process.env.PDF_OUT) writeFileSync(process.env.PDF_OUT, pdf);

// A long invoice flows onto a second page instead of off the sheet.
const long = await buildInvoicePdf(sample, Array.from({ length: 20 }, () => pdfLines[0]));
assert.ok((await PDFDocument.load(long)).getPageCount() > 1);

console.log('ops invoices: all passed');
