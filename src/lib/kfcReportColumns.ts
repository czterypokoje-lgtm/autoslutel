/*
 * Shared by the server loaders (src/lib/kfcInventoryReports.ts), the report and
 * article-list screens and the export route: what a column is, how a value is
 * shown, how a sheet is written. One definition, so the screen, the CSV and the
 * Excel file can never disagree on a number.
 *
 * Amounts arrive in integer cents (type 'money') and are shown in euros.
 * Columns marked `money` are removed on the server for users who may not see
 * prices (warehouse, picker) — see stripMoney() in kfcInventoryReports.ts.
 */

export type ColumnType = 'text' | 'code' | 'int' | 'money' | 'pct' | 'date' | 'datetime' | 'list' | 'days' | 'badge';

export interface ReportColumn {
  key: string;
  nl: string;
  en: string;
  type: ColumnType;
  /** A price, cost, value or margin: hidden from roles without seesPrices. */
  money?: boolean;
  /** Off by default in the column picker. */
  optional?: boolean;
}

export type Cell = string | number | boolean | null | string[];
export type ReportRow = Record<string, Cell>;

export interface ReportSummary { nl: string; en: string; value: number | string | null; type: ColumnType; money?: boolean; tone?: 'ok' | 'warn' | 'stop' }
export interface ReportNote { nl: string; en: string }

export interface ReportData {
  columns: ReportColumn[];
  rows: ReportRow[];
  summary: ReportSummary[];
  notes: ReportNote[];
  /** Server-paged reports (ledger) only. */
  total?: number;
  page?: number;
  pageSize?: number;
}

/* ── report catalogue (client-safe metadata) ─────────────────────────── */

export type ReportId = 'balance' | 'valuation' | 'ledger' | 'ageing' | 'movers' | 'abc' | 'reorder' | 'counts' | 'sales' | 'profit' | 'top';
export type FilterKey = 'from' | 'to' | 'date' | 'q' | 'category' | 'warehouse' | 'channel' | 'group' | 'reason' | 'basis' | 'speed' | 'lead';

export interface ReportMeta {
  id: ReportId;
  nl: string;
  en: string;
  descNl: string;
  descEn: string;
  section: 'voorraad' | 'verkoop';
  /** Only office roles (owner, kantoor) may open it. */
  money: boolean;
  filters: FilterKey[];
  groups?: { id: string; nl: string; en: string }[];
}

export const REPORTS: ReportMeta[] = [
  { id: 'balance', section: 'voorraad', money: false, nl: 'Voorraadstand per locatie', en: 'Stock balance by location',
    descNl: 'Aantal en waarde (inkoopprijs) per artikel, magazijn, stelling en bak.', descEn: 'Quantity and value (purchase price) per item, warehouse, shelf and bin.',
    filters: ['q', 'category', 'warehouse', 'group'],
    groups: [{ id: 'detail', nl: 'Per artikel en locatie', en: 'Per item and location' }, { id: 'article', nl: 'Per artikel', en: 'Per item' },
      { id: 'warehouse', nl: 'Per magazijn', en: 'Per warehouse' }, { id: 'category', nl: 'Per categorie', en: 'Per category' }] },
  { id: 'valuation', section: 'voorraad', money: true, nl: 'Voorraadwaarde op datum', en: 'Stock valuation on date',
    descNl: 'De voorraad zoals die op een gekozen dag was, gewaardeerd tegen de laatste inkoopprijs van dat moment.', descEn: 'Stock as it was on a chosen day, valued at the last purchase price of that moment.',
    filters: ['date', 'category', 'warehouse', 'group'],
    groups: [{ id: 'article', nl: 'Per artikel', en: 'Per item' }, { id: 'detail', nl: 'Per artikel en locatie', en: 'Per item and location' },
      { id: 'warehouse', nl: 'Per magazijn', en: 'Per warehouse' }, { id: 'category', nl: 'Per categorie', en: 'Per category' }] },
  { id: 'ledger', section: 'voorraad', money: false, nl: 'Voorraadgrootboek', en: 'Stock ledger',
    descNl: 'Elke boeking met het lopende saldo van het artikel erna.', descEn: 'Every movement with the item’s running balance after it.',
    filters: ['from', 'to', 'q', 'reason', 'warehouse'] },
  { id: 'ageing', section: 'voorraad', money: false, nl: 'Ouderdom voorraad', en: 'Stock ageing',
    descNl: 'Hoe lang de huidige voorraad al ligt (FIFO), in leeftijdsklassen.', descEn: 'How long the current stock has been on hand (FIFO), in age buckets.',
    filters: ['q', 'category'] },
  { id: 'movers', section: 'voorraad', money: false, nl: 'Snel- en traaglopers', en: 'Fast and slow movers',
    descNl: 'Verkochte aantallen, dagen voorraad en artikelen die niet meer verkopen.', descEn: 'Units sold, days of cover and items that no longer sell.',
    filters: ['from', 'to', 'q', 'category', 'speed'] },
  { id: 'abc', section: 'voorraad', money: true, nl: 'ABC-analyse', en: 'ABC analysis',
    descNl: 'A = de artikelen die samen 80% maken, B = de volgende 15%, C = de rest, D = voorraad zonder verkoop.', descEn: 'A = items making 80% together, B = the next 15%, C = the rest, D = stock without sales.',
    filters: ['from', 'to', 'category', 'basis'] },
  { id: 'reorder', section: 'voorraad', money: false, nl: 'Kritieke voorraad en bestelvoorstel', en: 'Critical stock and reorder',
    descNl: 'Wat op, laag of negatief is, en hoeveel je moet bestellen voor levertijd plus 30 dagen.', descEn: 'What is out, low or negative, and how much to order for lead time plus 30 days.',
    filters: ['q', 'category', 'lead'] },
  { id: 'counts', section: 'voorraad', money: false, nl: 'Telverschillen', en: 'Count differences',
    descNl: 'Elke telling die de voorraad veranderde: was, geteld, verschil en waarde.', descEn: 'Every count that changed stock: before, counted, difference and value.',
    filters: ['from', 'to', 'q'] },
  { id: 'sales', section: 'verkoop', money: true, nl: 'Verkoop', en: 'Sales',
    descNl: 'Verkochte aantallen en omzet per artikel, categorie, dag, maand of kanaal.', descEn: 'Units and revenue per item, category, day, month or channel.',
    filters: ['from', 'to', 'q', 'category', 'channel', 'group'],
    groups: [{ id: 'article', nl: 'Per artikel', en: 'Per item' }, { id: 'category', nl: 'Per categorie', en: 'Per category' },
      { id: 'day', nl: 'Per dag', en: 'Per day' }, { id: 'month', nl: 'Per maand', en: 'Per month' },
      { id: 'channel', nl: 'Per kanaal', en: 'Per channel' }, { id: 'shop', nl: 'Per webshop', en: 'Per web shop' }] },
  { id: 'profit', section: 'verkoop', money: true, nl: 'Brutowinst', en: 'Gross profit',
    descNl: 'Omzet min kostprijs per artikel of categorie, met marge.', descEn: 'Revenue minus cost per item or category, with margin.',
    filters: ['from', 'to', 'q', 'category', 'channel', 'group'],
    groups: [{ id: 'article', nl: 'Per artikel', en: 'Per item' }, { id: 'category', nl: 'Per categorie', en: 'Per category' },
      { id: 'month', nl: 'Per maand', en: 'Per month' }, { id: 'channel', nl: 'Per kanaal', en: 'Per channel' }] },
  { id: 'top', section: 'verkoop', money: true, nl: 'Topverkopers', en: 'Top sellers',
    descNl: 'De 50 best verkochte artikelen op aantal, omzet of winst.', descEn: 'The 50 best-selling items by units, revenue or profit.',
    filters: ['from', 'to', 'category', 'channel', 'basis'] },
];

export const reportMeta = (id: string) => REPORTS.find((report) => report.id === id);

export const CHANNELS = [
  { id: 'webshop', nl: 'Webshop', en: 'Web shop' }, { id: 'kassa', nl: 'Kassa', en: 'Till' },
  { id: 'factuur', nl: 'Factuur', en: 'Invoice' }, { id: 'overig', nl: 'Handmatig', en: 'Manual' },
];

export const MOVE_REASONS = [
  { id: 'received', nl: 'Ontvangst', en: 'Receipt' }, { id: 'sale', nl: 'Verkoop', en: 'Sale' }, { id: 'return', nl: 'Retour', en: 'Return' },
  { id: 'count', nl: 'Telling', en: 'Count' }, { id: 'transfer', nl: 'Verplaatsing', en: 'Transfer' }, { id: 'issue', nl: 'Uitgifte', en: 'Issue' },
  { id: 'correction', nl: 'Correctie', en: 'Correction' }, { id: 'assembly', nl: 'Montage', en: 'Assembly' },
];
export const reasonLabel = (reason: string, english = false) => {
  const found = MOVE_REASONS.find((r) => r.id === reason);
  return found ? (english ? found.en : found.nl) : reason;
};

export const STOCK_STATES = [
  { id: 'op_voorraad', nl: 'Op voorraad', en: 'In stock' }, { id: 'laag', nl: 'Laag', en: 'Low' },
  { id: 'nul', nl: 'Nul', en: 'Zero' }, { id: 'negatief', nl: 'Negatief', en: 'Negative' },
];
export const ARTICLE_STATUSES = [
  { id: 'held', nl: 'Op voorraad houden', en: 'Stocked' }, { id: 'on_demand', nl: 'Op bestelling', en: 'On demand' },
  { id: 'discontinued', nl: 'Uitlopend', en: 'Discontinued' },
];
export const labelOf = (list: { id: string; nl: string; en: string }[], id: string, english = false) => {
  const found = list.find((item) => item.id === id);
  return found ? (english ? found.en : found.nl) : id;
};

/* ── formatting ──────────────────────────────────────────────────────── */

const nlNumber = new Intl.NumberFormat('nl-NL');
const nlMoney = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const enNumber = new Intl.NumberFormat('en-GB');
const enMoney = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });
const day = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Amsterdam' });
const stamp = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });

export const euro = (cents: number | null | undefined, english = false) =>
  cents === null || cents === undefined ? '—' : (english ? enMoney : nlMoney).format(cents / 100);
export const count = (value: number | null | undefined, english = false) =>
  value === null || value === undefined ? '—' : (english ? enNumber : nlNumber).format(value);

export function formatCell(value: Cell | undefined, type: ColumnType, english = false): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'boolean') return value ? (english ? 'yes' : 'ja') : (english ? 'no' : 'nee');
  switch (type) {
    case 'money': return euro(Number(value), english);
    case 'int': return count(Number(value), english);
    case 'pct': return `${(english ? enNumber : nlNumber).format(Number(value))}%`;
    case 'days': return `${count(Number(value), english)} d`;
    case 'date': return /^\d{4}-\d{2}(-\d{2})?$/.test(String(value)) ? String(value) : day.format(new Date(String(value)));
    case 'datetime': return stamp.format(new Date(String(value)));
    default: return String(value);
  }
}

/** The value as a spreadsheet cell: numbers stay numbers, money in euros. */
export function sheetValue(value: Cell | undefined, type: ColumnType): string | number | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'ja' : 'nee';
  switch (type) {
    case 'money': return Math.round(Number(value)) / 100;
    case 'int': case 'pct': case 'days': return Number(value);
    case 'date': return /^\d{4}-\d{2}(-\d{2})?$/.test(String(value)) ? String(value) : new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date(String(value)));
    case 'datetime': return stamp.format(new Date(String(value)));
    default: return String(value);
  }
}

/** Semicolon CSV with comma decimals and a BOM: opens straight in Dutch Excel. */
export function toCsv(columns: ReportColumn[], rows: ReportRow[], english = false): string {
  const quote = (text: string) => /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  const lines = [columns.map((c) => quote(english ? c.en : c.nl)).join(';')];
  for (const row of rows) {
    lines.push(columns.map((c) => {
      const value = sheetValue(row[c.key], c.type);
      if (value === null) return '';
      if (typeof value === 'number') return english ? String(value) : String(value).replace('.', ',');
      // A leading = + - @ would run as a formula in Excel.
      return quote(/^[=+\-@]/.test(value) ? `'${value}` : value);
    }).join(';'));
  }
  return '﻿' + lines.join('\r\n');
}

/** ISO date (YYYY-MM-DD) or null. */
export function isoDate(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value ? value : null;
}

export const amsterdamToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
