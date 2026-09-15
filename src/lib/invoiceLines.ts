/**
 * Reading a supplier invoice into stock lines.
 *
 * Two halves, deliberately separate:
 *
 *   parseInvoiceText  turns the text of an invoice into candidate lines. Pure,
 *                     testable, and works on any PDF that has a text layer —
 *                     which A-Key's invoices do.
 *   matchArticle      asks our own catalogue what a line refers to.
 *
 * Neither writes anything. Everything they produce is a *proposal* that a
 * person confirms on screen, because an OCR misread that silently adds stock
 * ends with a technician driving to a job for a part that is not in the van —
 * which is the exact failure this whole feature exists to prevent.
 */

import { getProducts } from './catalog';

export interface InvoiceLine {
  description: string;
  articleCode: string | null;
  quantity: number;
  unitPrice: number | null;
  /** Our catalogue's guess, and how sure it is. */
  matchedSlug: string | null;
  matchedTitle: string | null;
  confidence: 'artikelnummer' | 'omschrijving' | 'geen';
}

/* ── the catalogue, indexed once ─────────────────────────────────────── */

let byCode: Map<string, { slug: string; title: string }> | null = null;

function codeIndex() {
  if (byCode) return byCode;
  byCode = new Map();
  for (const product of getProducts('all')) {
    if (!product.articleCode) continue;
    byCode.set(normaliseCode(product.articleCode), {
      slug: product.slug,
      title: product.titleNl,
    });
  }
  return byCode;
}

/** "TOYR 110-K" and "toyr110k" are the same article number. */
const normaliseCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * What our catalogue thinks this line is.
 *
 * The article number is the only signal trusted outright — it is printed on the
 * invoice by the supplier and it is unique. A description match is offered as a
 * suggestion and marked as one, because "sleutelbehuizing Toyota 3 knoppen"
 * describes about forty of our articles.
 */
export function matchArticle(description: string, code: string | null) {
  if (code) {
    const hit = codeIndex().get(normaliseCode(code));
    if (hit) return { ...hit, confidence: 'artikelnummer' as const };
  }

  /* An article number written inside the description, which most suppliers do. */
  for (const token of description.match(/\b[A-Z]{2,6}[0-9]{2,5}[A-Z0-9+]{0,4}\b/gi) ?? []) {
    const hit = codeIndex().get(normaliseCode(token));
    if (hit) return { ...hit, confidence: 'artikelnummer' as const };
  }

  return { slug: null, title: null, confidence: 'geen' as const };
}

/* ── reading the paper ───────────────────────────────────────────────── */

/** 1.234,56 · 1,234.56 · 47.95 — European and English, both in use. */
function money(text: string): number | null {
  const cleaned = text.trim().replace(/[€\s]/g, '');
  if (!cleaned) return null;
  // If both separators appear, the last one is the decimal point.
  const normalised =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '')
      : cleaned.replace(',', '.');
  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}

/** Lines that are a total, a header or a footer, not something we bought. */
const NOT_A_LINE =
  /^(totaal|total|subtotaal|subtotal|btw|vat|tax|te betalen|factuur|invoice|datum|date|klantnummer|debiteur|iban|bank|pagina|page|verzend|shipping|korting|discount|bedrag|omschrijving|artikel|aantal|prijs|nr\.?|nummer)\b/i;

/**
 * Candidate lines from the text of an invoice.
 *
 * Suppliers lay these out differently, so rather than one rigid pattern this
 * looks for the shape every invoice line shares: a quantity, some words, and a
 * price. Anything it is unsure about still comes through — the screen shows
 * every candidate and a person unticks the rubbish, which is far quicker than
 * hunting for the line the parser dropped.
 */
export function parseInvoiceText(text: string): InvoiceLine[] {
  const out: InvoiceLine[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (line.length < 6 || line.length > 200) continue;
    if (NOT_A_LINE.test(line)) continue;

    /*
     * The two layouts that cover almost everything:
     *   3  TOYR110K  Funkschlüssel Toyota      47,95   143,85
     *   TOYR110K  Funkschlüssel Toyota   3 x   47,95
     */
    const leading = line.match(/^(\d{1,3})\s*(?:x|st|stk|stuks)?\s+(.{4,}?)\s+([\d.,]+)(?:\s+[\d.,]+)?$/i);
    const trailing = line.match(/^(.{4,}?)\s+(\d{1,3})\s*(?:x|st|stk|stuks)\s+([\d.,]+)(?:\s+[\d.,]+)?$/i);

    let quantity: number | null = null;
    let description = '';
    let unitPrice: number | null = null;

    if (leading) {
      quantity = Number(leading[1]);
      description = leading[2].trim();
      unitPrice = money(leading[3]);
    } else if (trailing) {
      description = trailing[1].trim();
      quantity = Number(trailing[2]);
      unitPrice = money(trailing[3]);
    } else {
      continue;
    }

    if (!quantity || quantity < 1 || quantity > 999) continue;
    if (!description || !/[a-z]{3}/i.test(description)) continue;

    const code = description.match(/\b[A-Z]{2,6}[0-9]{2,5}[A-Z0-9+]{0,4}\b/)?.[0] ?? null;
    const match = matchArticle(description, code);

    out.push({
      description,
      articleCode: code,
      quantity,
      unitPrice,
      matchedSlug: match.slug,
      matchedTitle: match.title,
      confidence: match.confidence,
    });
  }

  return out;
}

/** Supplier and invoice number, where the paper states them plainly. */
export function readInvoiceHeader(text: string) {
  /*
   * `\s*` here used to include the newline, so a standalone "FACTUUR" title
   * — the header almost every real invoice has, one line above
   * "Factuurnummer: F-2026-04512" — let the match bleed onto that next line
   * and capture the word "Factuurnummer" itself as the number. `[ \t]*`
   * keeps the match on one line, the way a label and its value actually sit.
   */
  const number =
    text.match(/factuur(?:nummer)?[ \t]*[:.]?[ \t]*([A-Z0-9][A-Z0-9\-/]{3,20})/i)?.[1] ??
    text.match(/invoice[ \t]*(?:no|number|#)?[ \t]*[:.]?[ \t]*([A-Z0-9][A-Z0-9\-/]{3,20})/i)?.[1] ??
    null;

  const date =
    text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/)?.slice(1) ?? null;

  const supplier =
    /a-?key/i.test(text) ? 'A-Key'
    : /silca/i.test(text) ? 'Silca'
    : /keyline/i.test(text) ? 'Keyline'
    : /xhorse/i.test(text) ? 'Xhorse'
    : null;

  return {
    invoiceNumber: number,
    invoiceDate: date ? `${date[2]}-${date[1].padStart(2, '0')}-${date[0].padStart(2, '0')}` : null,
    supplier,
  };
}
