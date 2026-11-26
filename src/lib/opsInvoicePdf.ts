import { degrees, PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';

/**
 * A draft invoice as a PDF, laid out like /admin/facturen/[id].
 *
 * Every page says CONCEPT. These go to the owner on WhatsApp and a forwarded
 * draft must never pass for a real invoice, least of all while the company
 * details on it are still unconfirmed.
 */

export interface PdfInvoice {
  invoice_number: string;
  issue_date: string;
  /** Stored per invoice since 0144; without it the final PDF shows issue date + 14 days. */
  due_date?: string | null;
  biller_name: string;
  biller_street?: string | null;
  biller_postcode?: string | null;
  biller_city?: string | null;
  biller_email: string | null;
  biller_phone: string | null;
  biller_kvk: string | null;
  biller_btw: string | null;
  biller_iban: string | null;
  client_name: string;
  client_street: string | null;
  client_postcode: string | null;
  client_city: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_btw: string | null;
  notes: string | null;
  subtotal: number | string;
  vat_total: number | string;
  total: number | string;
}

export interface PdfLine {
  description: string;
  quantity: number | string;
  unit_price: number | string;
  vat_rate: number | string;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long', timeZone: 'UTC' });

const PAGE = { width: 595, height: 842, margin: 50 };
const INK = rgb(0.1, 0.1, 0.12);
const DIM = rgb(0.42, 0.42, 0.46);
const RED = rgb(0.75, 0.1, 0.1);

/** The built-in fonts only know Western characters. Turkish letters lose their marks. */
function printable(value: string) {
  return [...value.replace(/\s+/g, ' ')]
    .map((char) => {
      if (/[\x20-\x7E\xA0-\xFF€–—]/.test(char)) return char;
      if (char === 'ı') return 'i';
      const base = char.normalize('NFKD').replace(/\p{M}/gu, '');
      return /[\x20-\x7E]/.test(base) ? base : '?';
    })
    .join('');
}

function wrap(value: string, font: PDFFont, size: number, width: number) {
  const out: string[] = [];
  let line = '';
  for (const word of printable(value).split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > width) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}

export interface PdfOptions {
  /** true (default): every page stamped CONCEPT, as the WhatsApp drafts need. false: the final factuur the customer receives. */
  draft?: boolean;
  /** PNG bytes of the logo for the final version; omitted = the company name in text. */
  logoPng?: Uint8Array | null;
}

export async function buildInvoicePdf(invoice: PdfInvoice, lines: PdfLine[], options: PdfOptions = {}): Promise<Uint8Array> {
  const draft = options.draft ?? true;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${draft ? 'Concept factuur' : 'Factuur'} ${invoice.invoice_number}`);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const right = PAGE.width - PAGE.margin;
  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;

  const stamp = () => {
    if (!draft) return;
    page.drawText('CONCEPT', {
      x: 120, y: 280, size: 90, font: bold, color: RED, opacity: 0.1, rotate: degrees(45),
    });
    const warning = 'CONCEPT - NIET VERSTUREN';
    page.drawText(warning, {
      x: (PAGE.width - bold.widthOfTextAtSize(warning, 10)) / 2, y: 24, size: 10, font: bold, color: RED,
    });
  };
  const newPageIfNeeded = (needed: number) => {
    if (y - needed > 70) return;
    page = pdf.addPage([PAGE.width, PAGE.height]);
    stamp();
    y = PAGE.height - PAGE.margin;
  };
  const put = (value: string, x: number, size = 10, font = regular, color = INK) =>
    page.drawText(printable(value), { x, y, size, font, color });
  const putRight = (value: string, x: number, size = 10, font = regular, color = INK) => {
    const clean = printable(value);
    page.drawText(clean, { x: x - font.widthOfTextAtSize(clean, size), y, size, font, color });
  };

  stamp();

  const dueDate = new Date(invoice.due_date ? `${invoice.due_date}T00:00:00Z` : Date.parse(invoice.issue_date) + 14 * 86_400_000);
  if (options.logoPng && !draft) {
    const logo = await pdf.embedPng(options.logoPng);
    const w = 150, h = (logo.height / logo.width) * w;
    page.drawImage(logo, { x: PAGE.margin, y: y - h + 10, width: w, height: h });
  } else {
    put(invoice.biller_name, PAGE.margin, 13, bold);
  }
  putRight(`Factuur ${invoice.invoice_number}`, right, 16, bold);
  y -= 20;
  putRight(`Factuurdatum: ${DATE.format(new Date(invoice.issue_date))}`, right, 10, regular, DIM);
  if (!draft) { y -= 14; putRight(`Vervaldatum: ${DATE.format(dueDate)}`, right, 10, regular, DIM); }
  y -= 34;

  const billerPlace = [invoice.biller_postcode, invoice.biller_city].filter(Boolean).join(' ');
  const left = [
    ...(!draft && options.logoPng ? [invoice.biller_name] : []),
    invoice.biller_street ?? null,
    billerPlace || null,
    invoice.biller_email,
    invoice.biller_phone,
    invoice.biller_kvk && `KvK: ${invoice.biller_kvk}`,
    invoice.biller_btw ? `Btw-id: ${invoice.biller_btw}` : (draft ? 'BTW: nog invullen' : null),
    invoice.biller_iban ? `IBAN: ${invoice.biller_iban}` : (draft ? 'IBAN: nog invullen' : null),
  ].filter((v): v is string => Boolean(v));
  const place = [invoice.client_postcode, invoice.client_city].filter(Boolean).join(' ');
  const client = [
    invoice.client_street,
    place,
    invoice.client_email,
    invoice.client_phone,
    invoice.client_btw && `Btw-id: ${invoice.client_btw}`,
  ].filter((v): v is string => Boolean(v));

  const top = y;
  for (const row of left) {
    put(row, PAGE.margin, 10, regular, row.endsWith('nog invullen') ? RED : INK);
    y -= 14;
  }
  const afterLeft = y;
  y = top;
  putRight(invoice.client_name, right, 11, bold);
  y -= 15;
  for (const row of client) {
    putRight(row, right);
    y -= 14;
  }
  y = Math.min(y, afterLeft) - 24;

  const col = { quantity: 330, price: 400, vat: 450, total: right };
  const header = () => {
    put('Beschrijving', PAGE.margin, 9, bold);
    putRight('Aantal', col.quantity, 9, bold);
    putRight('Prijs', col.price, 9, bold);
    putRight('Btw', col.vat, 9, bold);
    putRight('Totaal', col.total, 9, bold);
    y -= 6;
    page.drawLine({ start: { x: PAGE.margin, y }, end: { x: right, y }, thickness: 0.7, color: DIM });
    y -= 16;
  };
  header();

  for (const line of lines) {
    const rows = wrap(line.description, regular, 10, 240);
    newPageIfNeeded(rows.length * 13 + 8);
    const quantity = Number(line.quantity);
    const unit = Number(line.unit_price);
    putRight(String(quantity), col.quantity);
    putRight(MONEY.format(unit), col.price);
    putRight(`${Number(line.vat_rate)}%`, col.vat);
    putRight(MONEY.format(quantity * unit), col.total);
    for (const row of rows) {
      put(row, PAGE.margin);
      y -= 13;
    }
    y -= 6;
  }

  newPageIfNeeded(110);
  y -= 8;
  const total = (label: string, value: number | string, final = false) => {
    const font = final ? bold : regular;
    putRight(label, 430, final ? 11 : 10, font);
    putRight(MONEY.format(Number(value)), right, final ? 11 : 10, font);
    y -= final ? 22 : 16;
  };
  total('Subtotaal', invoice.subtotal);
  total('Totaal btw', invoice.vat_total);
  total('Totaal verschuldigd (EUR)', invoice.total, true);

  if (invoice.notes) {
    for (const row of wrap(invoice.notes, regular, 9, right - PAGE.margin)) {
      newPageIfNeeded(14);
      put(row, PAGE.margin, 9, regular, DIM);
      y -= 12;
    }
  }

  if (!draft) {
    newPageIfNeeded(40);
    y -= 10;
    const pay = `Gelieve te betalen voor ${DATE.format(dueDate)}${invoice.biller_iban ? ` op IBAN ${invoice.biller_iban}` : ''} t.n.v. ${invoice.biller_name}, o.v.v. ${invoice.invoice_number}.`;
    for (const row of wrap(pay, regular, 10, right - PAGE.margin)) { put(row, PAGE.margin, 10, regular, INK); y -= 13; }
  }

  return pdf.save();
}
