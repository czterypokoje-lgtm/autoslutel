import 'server-only';
import { createHash } from 'node:crypto';
import * as XLSX from 'xlsx';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { IS_KEYFORCARS } from '@/config/install';
import { ARTICLE_CODE } from '@/lib/stockCatalog';
import type { CrmUser } from '@/lib/crmSession';

/*
 * KeyForCars product master data (migration 0134): the category tree, the bulk
 * article editor, CSV/XLSX import and export, and the data-quality checks.
 *
 * Every function here is server-only and assumes the caller already checked
 * the user is office (owner/kantoor): purchase prices travel through it.
 * Writes go through RPCs that lock rows and compare "before" values, so a
 * stale grid or a file built yesterday cannot silently overwrite today's
 * prices.
 */

const db = () => createSupabaseAdminClient();
const PAGE = 1000;

export class MasterError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

/** Supabase returns at most 1000 rows per request; read a whole table in pages. */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new MasterError(`Lezen mislukt: ${error.message}`, 500);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

function mapError(error: { message: string; code?: string }): MasterError {
  const m = error.message;
  if (m.includes('KFC_CATEGORY_CYCLE')) return new MasterError('Een categorie kan niet onder zichzelf of een eigen subcategorie staan.', 409);
  if (m.includes('KFC_MERGE_INTO_CHILD')) return new MasterError('Samenvoegen in een eigen subcategorie kan niet.', 409);
  if (m.includes('KFC_MERGE_SELF')) return new MasterError('Kies een andere categorie om mee samen te voegen.');
  if (m.includes('KFC_NO_CATEGORY')) return new MasterError('Categorie niet gevonden.', 404);
  const duplicate = /KFC_DUPLICATE_BARCODE:(\S+)/.exec(m);
  if (duplicate) return new MasterError(`Barcode ${duplicate[1]} hoort al bij een ander artikel.`, 409);
  const conflict = /KFC_CONFLICT:([^\s"]+)/.exec(m);
  if (conflict) return new MasterError(`Intussen door iemand anders gewijzigd: ${conflict[1].split(',').slice(0, 10).join(', ')}. Laad opnieuw en probeer het nog eens.`, 409);
  if (error.code === '23505' || m.includes('kfc_categories_sibling_name')) return new MasterError('Er bestaat al een categorie met die naam op dit niveau.', 409);
  if (error.code === '23503') return new MasterError('Deze categorie heeft nog artikelen of subcategorieën. Verplaats of voeg die eerst samen.', 409);
  if (error.code === '23514') return new MasterError('Een waarde valt buiten het toegestane bereik.', 400);
  return new MasterError(`Opslaan mislukt: ${m}`, 500);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type Category = {
  id: string; parent_id: string | null; name: string; sort: number; vat_rate: number; default_margin_pct: number | null;
  path: string; depth: number; direct: number; total: number;
};

type CategoryRow = { id: string; parent_id: string | null; name: string; sort: number; vat_rate: number | string; default_margin_pct: number | string | null };
type PathRow = { id: string; parent_id: string | null; path: string; depth: number; sort_path: number[]; name_path: string[] };
const PATH_COLUMNS = 'id, parent_id, path, depth, sort_path, name_path';

/** The tree in display order (depth-first, by sort then name) with article counts. */
export async function loadCategories(): Promise<Category[]> {
  const [cats, paths, links] = await Promise.all([
    fetchAll<CategoryRow>((f, t) => db().from('kfc_categories').select('id, parent_id, name, sort, vat_rate, default_margin_pct').order('id').range(f, t)),
    fetchAll<PathRow>((f, t) => db().from('kfc_category_paths').select(PATH_COLUMNS).order('id').range(f, t)),
    fetchAll<{ category_id: string | null }>((f, t) => db().from('kfc_articles').select('category_id').not('category_id', 'is', null).order('code').range(f, t)),
  ]);
  const direct = new Map<string, number>();
  for (const { category_id } of links) if (category_id) direct.set(category_id, (direct.get(category_id) ?? 0) + 1);
  const byId = new Map(cats.map((c) => [c.id, c]));
  const total = new Map<string, number>();
  for (const c of cats) {
    const n = direct.get(c.id) ?? 0;
    for (let at: CategoryRow | undefined = c, guard = 0; at && guard < 20; at = at.parent_id ? byId.get(at.parent_id) : undefined, guard++) {
      total.set(at.id, (total.get(at.id) ?? 0) + n);
    }
  }
  const pathOf = new Map(paths.map((p) => [p.id, p]));
  const key = (p: PathRow | undefined) => p ? p.sort_path.map((s, i) => `${String(s + 1e6).padStart(8, '0')}:${p.name_path[i]}`).join('/') : '';
  return cats
    .map((c) => ({ c, p: pathOf.get(c.id) }))
    .sort((a, b) => key(a.p).localeCompare(key(b.p)))
    .map(({ c, p }) => ({
      id: c.id, parent_id: c.parent_id, name: c.name, sort: c.sort,
      vat_rate: Number(c.vat_rate), default_margin_pct: c.default_margin_pct === null ? null : Number(c.default_margin_pct),
      path: p?.path ?? c.name, depth: p?.depth ?? 0, direct: direct.get(c.id) ?? 0, total: total.get(c.id) ?? 0,
    }));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cleanName = (value: unknown) => {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!name || name.length > 80) throw new MasterError('Geef een naam van 1 tot 80 tekens.');
  if (/[>›]/.test(name)) throw new MasterError('Een categorienaam mag geen > bevatten.');
  return name;
};
const optionalId = (value: unknown) => {
  if (value === null || value === '' || value === undefined) return null;
  if (typeof value !== 'string' || !UUID.test(value)) throw new MasterError('Ongeldige categorie.');
  return value;
};
const requiredId = (value: unknown) => {
  const id = optionalId(value);
  if (!id) throw new MasterError('Ongeldige categorie.');
  return id;
};

export async function createCategory(input: { name: unknown; parent_id: unknown }) {
  const name = cleanName(input.name);
  const parent = optionalId(input.parent_id);
  const { error } = await db().from('kfc_categories').insert({ name, parent_id: parent });
  if (error) throw mapError(error);
}

export async function updateCategory(input: { id: unknown; name?: unknown; vat_rate?: unknown; default_margin_pct?: unknown; sort?: unknown }) {
  const id = requiredId(input.id);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = cleanName(input.name);
  if (input.vat_rate !== undefined) {
    const vat = Number(String(input.vat_rate).replace(',', '.'));
    if (input.vat_rate === '' || !Number.isFinite(vat) || vat < 0 || vat > 100) throw new MasterError('Btw moet tussen 0 en 100 procent liggen.');
    patch.vat_rate = Math.round(vat * 100) / 100;
  }
  if (input.default_margin_pct !== undefined) {
    if (input.default_margin_pct === null || input.default_margin_pct === '') patch.default_margin_pct = null;
    else {
      const margin = Number(String(input.default_margin_pct).replace(',', '.'));
      if (!Number.isFinite(margin) || margin <= -100 || margin >= 10000) throw new MasterError('Ongeldige marge.');
      patch.default_margin_pct = Math.round(margin * 100) / 100;
    }
  }
  if (input.sort !== undefined) {
    const sort = Number(input.sort);
    if (!Number.isInteger(sort) || Math.abs(sort) > 1e6) throw new MasterError('Ongeldige volgorde.');
    patch.sort = sort;
  }
  const { error } = await db().from('kfc_categories').update(patch).eq('id', id);
  if (error) throw mapError(error);
}

export async function moveCategory(input: { id: unknown; parent_id: unknown }) {
  const id = requiredId(input.id);
  const parent = optionalId(input.parent_id);
  if (parent === id) throw new MasterError('Een categorie kan niet onder zichzelf staan.');
  const { error } = await db().from('kfc_categories').update({ parent_id: parent, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw mapError(error);
}

export async function mergeCategory(input: { from: unknown; into: unknown }): Promise<number> {
  const { data, error } = await db().rpc('kfc_merge_categories', { p_from: requiredId(input.from), p_into: requiredId(input.into) });
  if (error) throw mapError(error);
  return Number(data ?? 0);
}

export async function deleteCategory(input: { id: unknown }) {
  const { error } = await db().from('kfc_categories').delete().eq('id', requiredId(input.id));
  if (error) throw mapError(error);
}

// ---------------------------------------------------------------------------
// Articles: the grid, bulk save and data quality
// ---------------------------------------------------------------------------

export const STATUSES = ['held', 'on_demand', 'discontinued'] as const;
export type ArticleStatus = (typeof STATUSES)[number];

export type MasterArticle = {
  code: string; name: string; sku: string; ean: string[]; category_id: string | null; status: ArticleStatus;
  sale_price_cents: number | null; purchase_price_cents: number | null; min_stock: number | null; supplier_ref: string | null;
  tracking: string; condition: string; physical: number;
  no_barcode: boolean; no_category: boolean; no_price: boolean; no_purchase_price: boolean; duplicate_barcode: boolean; negative_stock: boolean;
};

export const ISSUES = ['no_barcode', 'duplicate_barcode', 'invalid_barcode', 'no_category', 'no_price', 'no_purchase_price', 'negative_stock'] as const;
export type Issue = (typeof ISSUES)[number];

export async function loadArticles(): Promise<MasterArticle[]> {
  return fetchAll<MasterArticle>((f, t) => db().from('kfc_article_quality')
    .select('code, name, sku, ean, category_id, status, sale_price_cents, purchase_price_cents, min_stock, supplier_ref, tracking, condition, physical, no_barcode, no_category, no_price, no_purchase_price, duplicate_barcode, negative_stock')
    .order('code').range(f, t));
}

/** GTIN-8/12/13/14 check digit. Non-numeric codes (a shop's own label code) are not judged. */
export function gtinStatus(code: string): 'valid' | 'invalid' | 'other' {
  if (!/^\d+$/.test(code)) return 'other';
  if (![8, 12, 13, 14].includes(code.length)) return code.length >= 7 && code.length <= 14 ? 'invalid' : 'other';
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check ? 'valid' : 'invalid';
}

export function hasIssue(article: MasterArticle, issue: Issue): boolean {
  if (issue === 'invalid_barcode') return article.ean.some((code) => gtinStatus(code) === 'invalid');
  return article[issue];
}

export async function loadDuplicateBarcodes(): Promise<{ barcode: string; codes: string[]; articles: number }[]> {
  return fetchAll((f, t) => db().from('kfc_barcode_duplicates').select('barcode, codes, articles').order('articles', { ascending: false }).order('barcode').range(f, t));
}

const FIELDS = ['name', 'sku', 'ean', 'category_id', 'status', 'sale_price_cents', 'purchase_price_cents', 'min_stock', 'supplier_ref'] as const;
type Field = (typeof FIELDS)[number];
export type ArticleChange = { code: string; before: Partial<Record<Field, unknown>>; after: Partial<Record<Field, unknown>> };

const isCents = (v: unknown) => v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 2147483647);
const BARCODE = /^[0-9A-Za-z.\-]{1,40}$/;
function validValue(field: Field, value: unknown): boolean {
  switch (field) {
    case 'name': return typeof value === 'string' && value.trim().length > 0 && value.length <= 300;
    case 'sku': return typeof value === 'string' && value.length <= 120;
    case 'supplier_ref': return value === null || (typeof value === 'string' && value.length <= 120);
    case 'ean': return Array.isArray(value) && value.length <= 20 && value.every((e) => typeof e === 'string' && BARCODE.test(e.trim()));
    case 'category_id': return value === null || (typeof value === 'string' && UUID.test(value));
    case 'status': return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
    case 'sale_price_cents': case 'purchase_price_cents': return isCents(value);
    case 'min_stock': return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1e6);
  }
}

/** Bulk editor save: all rows or none. */
export async function saveArticleChanges(changes: unknown, user: CrmUser): Promise<number> {
  if (!Array.isArray(changes) || changes.length === 0) throw new MasterError('Geen wijzigingen.');
  if (changes.length > 5000) throw new MasterError('Te veel wijzigingen in één keer (max 5000).');
  const clean: ArticleChange[] = changes.map((raw) => {
    const change = raw as ArticleChange;
    if (!change || typeof change.code !== 'string' || !change.after || !change.before) throw new MasterError('Ongeldige wijziging.');
    for (const part of [change.before, change.after]) {
      for (const [field, value] of Object.entries(part)) {
        if (!(FIELDS as readonly string[]).includes(field)) throw new MasterError(`Onbekend veld ${field}.`);
        if (part === change.after && !validValue(field as Field, value)) throw new MasterError(`Ongeldige waarde voor ${field} bij ${change.code}.`);
      }
    }
    const after = { ...change.after };
    if (Array.isArray(after.ean)) after.ean = [...new Set((after.ean as string[]).map((e) => e.trim()).filter(Boolean))];
    if (typeof after.name === 'string') after.name = after.name.trim();
    return { code: change.code, before: change.before, after };
  });
  const { data, error } = await db().rpc('kfc_bulk_update_articles', { p_changes: clean, p_user: user.id });
  if (error) throw mapError(error);
  return Number((data as { updated?: number } | null)?.updated ?? 0);
}

// ---------------------------------------------------------------------------
// Import: parse → plan (dry run) → apply
// ---------------------------------------------------------------------------

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_ROWS = 20000;

const norm = (header: string) => header.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
type Column = 'code' | 'sku' | 'ean' | 'name' | 'category' | 'status' | 'sale' | 'purchase' | 'min_stock' | 'supplier_ref'
  | 'brand' | 'key_type' | 'frequency' | 'chip' | 'buttons' | 'blade' | 'fitments';
const HEADERS: Record<Column, string[]> = {
  code: ['code', 'artikelcode', 'articlecode', 'interncode'],
  sku: ['sku', 'artikelnummer', 'artikelnr', 'itemcode', 'productcode'],
  ean: ['ean', 'eans', 'barcode', 'barcodes', 'gtin', 'streepjescode', 'gtinupceanorisbn', 'ean13'],
  name: ['naam', 'name', 'omschrijving', 'productnaam', 'titel', 'title', 'artikelnaam'],
  category: ['categorie', 'category', 'categories', 'categorieen', 'artikelgroep', 'itemgroup', 'groep'],
  status: ['status', 'voorraadstatus'],
  sale: ['verkoopprijs', 'prijs', 'price', 'saleprice', 'regularprice'],
  purchase: ['inkoopprijs', 'purchaseprice', 'kostprijs', 'cost', 'costprice'],
  min_stock: ['minvoorraad', 'minimumvoorraad', 'minstock', 'bestelniveau', 'reorderlevel', 'minimum'],
  supplier_ref: ['leveranciersref', 'leveranciersreferentie', 'supplierref', 'leveranciercode', 'leveranciersartikelnummer'],
  brand: ['merk', 'brand', 'automerk', 'voertuigmerk'],
  key_type: ['sleuteltype', 'keytype', 'soort'],
  frequency: ['frequentie', 'frequency', 'mhz'],
  chip: ['chip', 'transponder', 'transponderchip'],
  buttons: ['knoppen', 'buttons', 'aantalknoppen'],
  blade: ['baard', 'blade', 'sleutelbaard', 'baardprofiel', 'bladeprofile'],
  fitments: ['voertuigen', 'vehicles', 'fitments', 'compatibiliteit', 'geschiktvoor', 'pastop'],
};
const HEADER_INDEX = new Map(Object.entries(HEADERS).flatMap(([column, names]) => names.map((n) => [n, column as Column] as const)));

/** Delimiter from the header line; quotes and doubled quotes as in RFC 4180. */
function parseCsv(text: string): string[][] {
  const end = text.indexOf('\n');
  const firstLine = end === -1 ? text : text.slice(0, end);
  const delimiter = [';', ',', '\t'].map((d) => [d, firstLine.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function readSheet(bytes: Buffer, fileName: string): string[][] {
  if (/\.(csv|txt)$/i.test(fileName)) {
    return parseCsv(new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, ''));
  }
  if (!/\.xlsx$/i.test(fileName)) throw new MasterError('Kies een .csv- of .xlsx-bestand.');
  let book: XLSX.WorkBook;
  try {
    book = XLSX.read(bytes, { type: 'buffer', cellFormula: false, cellHTML: false, sheetRows: MAX_IMPORT_ROWS + 2 });
  } catch {
    throw new MasterError('Het bestand kon niet gelezen worden.');
  }
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) throw new MasterError('Het bestand heeft geen werkblad.');
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '', blankrows: false });
  return rows.map((r) => r.map((c) => (c === null || c === undefined ? '' : String(c))));
}

/** "€ 1.234,56", "12,5", "12.50", 12.5 → cents. Empty → undefined (keep). */
export function parseMoney(raw: string): number | undefined | 'bad' {
  let s = raw.replace(/[€\s]/g, '').replace(/^eur/i, '');
  if (!s) return undefined;
  const comma = s.lastIndexOf(','), dot = s.lastIndexOf('.');
  if (comma > -1 && dot > -1) s = comma > dot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (comma > -1) s = s.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return 'bad';
  const cents = Math.round(Number(s) * 100);
  return cents <= 2147483647 ? cents : 'bad';
}

const STATUS_WORDS: Record<string, ArticleStatus> = {
  held: 'held', voorraad: 'held', opvoorraad: 'held', voorraadartikel: 'held', instock: 'held',
  ondemand: 'on_demand', opbestelling: 'on_demand', bestellen: 'on_demand', opaanvraag: 'on_demand', backorder: 'on_demand',
  discontinued: 'discontinued', uitlopend: 'discontinued', vervallen: 'discontinued', nietmeerleverbaar: 'discontinued', archief: 'discontinued',
};
const KEY_TYPES: [RegExp, string][] = [
  [/smart|keyless|proximity/i, 'smart'], [/klap|flip/i, 'flip'], [/afstand|remote/i, 'remote'], [/transponder/i, 'transponder'],
  [/nood|emergency/i, 'emergency'], [/behuizing|housing|shell|case/i, 'housing'], [/baard|blade/i, 'blade'], [/kaart|card/i, 'card'],
  [/chip/i, 'chip'], [/print|pcb/i, 'pcb'], [/batterij|battery/i, 'battery'], [/gereedschap|tool|machine/i, 'tool'], [/^(overig|other)$/i, 'other'],
];
const KEY_TYPE_VALUES = ['remote', 'smart', 'flip', 'transponder', 'blade', 'emergency', 'housing', 'card', 'chip', 'pcb', 'battery', 'tool', 'other'];

export type Fitment = { make: string; model: string; year_from: number | null; year_to: number | null };

/** "Volkswagen|Golf|2010|2015; Audi|A3|2012|" or "Volkswagen Golf 2010-2015" (whole text before the years = make). */
export function parseFitments(raw: string): Fitment[] {
  const year = (s: string | undefined) => { const n = Number((s ?? '').trim()); return s && Number.isInteger(n) && n >= 1950 && n <= 2100 ? n : null; };
  return raw.split(/[;\n]+/).map((part) => part.trim()).filter(Boolean).flatMap((part): Fitment[] => {
    if (part.includes('|')) {
      const [make, model = '', from, to] = part.split('|').map((s) => s.trim());
      return make ? [{ make: make.slice(0, 60), model: model.slice(0, 80), year_from: year(from), year_to: year(to) }] : [];
    }
    const range = /\s*\(?(\d{4})\s*[-–]\s*(\d{4})?\)?\s*$/.exec(part);
    const name = range ? part.slice(0, range.index).trim() : part;
    return name ? [{ make: name.slice(0, 60), model: '', year_from: year(range?.[1]), year_to: year(range?.[2]) }] : [];
  }).map((f) => (f.year_from && f.year_to && f.year_to < f.year_from ? { ...f, year_to: null } : f)).slice(0, 200);
}

export type MatchBy = 'sku' | 'ean';
export type PlanChange = { field: string; from: string; to: string };
export type PlanRow = {
  line: number; action: 'create' | 'update' | 'unchanged' | 'skip'; code: string | null; name: string;
  changes: PlanChange[]; reason?: string; warnings: string[];
};
export type ImportPlan = {
  checksum: string; fileName: string; matchBy: MatchBy; columns: string[]; ignored: string[];
  counts: Record<PlanRow['action'], number>; newCategories: string[]; rows: PlanRow[];
  alreadyApplied: { run: number; at: string | null } | null;
};
type Specs = Partial<{ brand: string; key_type: string; frequency: string; chip: string; buttons: number; blade: string }>;
type RpcRow = {
  action: 'create' | 'update'; code?: string; before?: Record<string, unknown>; after: Record<string, unknown>;
  category_path?: string; specs?: Specs; fitments?: Fitment[];
};
type ExistingArticle = {
  code: string; name: string; sku: string; ean: string[]; category_id: string | null; status: string; sale_price_cents: number | null;
  purchase_price_cents: number | null; min_stock: number | null; supplier_ref: string | null; tracking: string;
};

const show = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (field.endsWith('_cents') && typeof value === 'number') return (value / 100).toFixed(2).replace('.', ',');
  if (Array.isArray(value)) return value.join(', ') || '—';
  return String(value);
};

export const FIELD_LABELS: Record<string, string> = {
  name: 'Naam', sku: 'SKU', ean: 'Barcodes', category_id: 'Categorie', status: 'Status', sale_price_cents: 'Verkoopprijs',
  purchase_price_cents: 'Inkoopprijs', min_stock: 'Min. voorraad', supplier_ref: 'Leveranciersref.', brand: 'Merk',
  key_type: 'Sleuteltype', frequency: 'Frequentie', chip: 'Chip', buttons: 'Knoppen', blade: 'Baard', fitments: 'Voertuigen',
};

const importPrefix = () => (IS_KEYFORCARS ? 'KFC-1-' : 'AS24-1-');

async function buildPlan(bytes: Buffer, fileName: string, matchBy: MatchBy): Promise<{ plan: ImportPlan; rpc: RpcRow[] }> {
  if (bytes.length > MAX_IMPORT_BYTES) throw new MasterError('Het bestand is groter dan 5 MB.');
  const table = readSheet(bytes, fileName);
  if (table.length < 2) throw new MasterError('Het bestand heeft geen regels onder de kopregel.');
  if (table.length - 1 > MAX_IMPORT_ROWS) throw new MasterError(`Maximaal ${MAX_IMPORT_ROWS} regels per bestand.`);
  const columnAt = new Map<Column, number>();
  const ignored: string[] = [];
  table[0].forEach((h, i) => {
    const column = HEADER_INDEX.get(norm(h));
    if (column && !columnAt.has(column)) columnAt.set(column, i); else if (h.trim()) ignored.push(h.trim());
  });
  if (matchBy === 'sku' && !columnAt.has('sku') && !columnAt.has('code')) throw new MasterError('Herkennen op SKU kan niet: het bestand heeft geen kolom SKU of code.');
  if (matchBy === 'ean' && !columnAt.has('ean') && !columnAt.has('code')) throw new MasterError('Herkennen op EAN kan niet: het bestand heeft geen kolom EAN of code.');
  const hasSpecs = (['brand', 'key_type', 'frequency', 'chip', 'buttons', 'blade'] as Column[]).some((c) => columnAt.has(c));

  const [articles, paths, specRows, fitRows] = await Promise.all([
    fetchAll<ExistingArticle>((f, t) => db().from('kfc_articles')
      .select('code, name, sku, ean, category_id, status, sale_price_cents, purchase_price_cents, min_stock, supplier_ref, tracking').order('code').range(f, t)),
    fetchAll<PathRow>((f, t) => db().from('kfc_category_paths').select(PATH_COLUMNS).order('id').range(f, t)),
    hasSpecs
      ? fetchAll<Specs & { article_code: string }>((f, t) => db().from('kfc_article_specs').select('article_code, brand, key_type, frequency, chip, buttons, blade').order('article_code').range(f, t))
      : Promise.resolve([]),
    columnAt.has('fitments')
      ? fetchAll<Fitment & { article_code: string }>((f, t) => db().from('kfc_article_fitments').select('article_code, make, model, year_from, year_to').order('id').range(f, t))
      : Promise.resolve([]),
  ]);
  const byCode = new Map(articles.map((a) => [a.code, a]));
  const bySku = new Map<string, string[]>();
  const byEan = new Map<string, string[]>();
  for (const a of articles) {
    const sku = a.sku.trim().toUpperCase();
    if (sku) bySku.set(sku, [...(bySku.get(sku) ?? []), a.code]);
    if (a.tracking !== 'quantity') continue;
    for (const e of a.ean) byEan.set(e.trim(), [...(byEan.get(e.trim()) ?? []), a.code]);
  }
  const categoryByPath = new Map(paths.map((p) => [p.name_path.join('>'), p.id]));
  const pathById = new Map(paths.map((p) => [p.id, p.path]));
  const specsBy = new Map(specRows.map((s) => [s.article_code, s]));
  const fitKey = (f: Fitment) => `${f.make.toLowerCase()}|${f.model.toLowerCase()}|${f.year_from ?? 0}|${f.year_to ?? 0}`;
  const fitsBy = new Map<string, Set<string>>();
  for (const f of fitRows) fitsBy.set(f.article_code, (fitsBy.get(f.article_code) ?? new Set<string>()).add(fitKey(f)));

  const rows: PlanRow[] = [];
  const rpc: RpcRow[] = [];
  const seenCodes = new Set<string>();
  const seenNewSkus = new Set<string>();
  const claimedBarcodes = new Map<string, string>(); // barcode → article (or "nieuw:<line>") that adds it in this file
  const newCategories = new Set<string>();

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    // A leading ' was added by our own export to keep Excel from running text as a formula.
    const cell = (c: Column) => (columnAt.has(c) ? String(cells[columnAt.get(c)!] ?? '').trim().replace(/^'(?=[=+\-@])/, '') : '');
    const line = i + 1;
    const warnings: string[] = [];
    const skip = (reason: string) => { rows.push({ line, action: 'skip', code: null, name: cell('name'), changes: [], reason, warnings }); };

    // --- cells → values; an empty cell leaves the field as it is
    const after: Record<string, unknown> = {};
    const name = cell('name').replace(/\s+/g, ' ');
    if (name) after.name = name.slice(0, 300);
    const sku = cell('sku');
    if (sku) after.sku = sku.slice(0, 120);
    const eans = [...new Set(cell('ean').split(/[;,|\s]+/).map((e) => e.replace(/^'/, '').trim()).filter(Boolean))];
    if (eans.some((e) => !BARCODE.test(e))) { skip('Ongeldige barcode.'); continue; }
    if (eans.length > 20) { skip('Meer dan 20 barcodes op één regel.'); continue; }
    for (const e of eans) if (gtinStatus(e) === 'invalid') warnings.push(`Barcode ${e} heeft een ongeldig controlecijfer.`);
    if (cell('status')) {
      const status = STATUS_WORDS[norm(cell('status'))];
      if (!status) { skip(`Onbekende status "${cell('status')}" (gebruik voorraad, op bestelling of uitlopend).`); continue; }
      after.status = status;
    }
    let bad = '';
    for (const [column, field] of [['sale', 'sale_price_cents'], ['purchase', 'purchase_price_cents']] as const) {
      const cents = parseMoney(cell(column));
      if (cents === 'bad') bad = `Ongeldig bedrag "${cell(column)}".`;
      else if (cents !== undefined) after[field] = cents;
    }
    if (cell('min_stock')) {
      const n = Number(cell('min_stock').replace(',', '.'));
      if (!Number.isInteger(n) || n < 0 || n > 1e6) bad = `Ongeldige minimumvoorraad "${cell('min_stock')}".`;
      else after.min_stock = n;
    }
    if (bad) { skip(bad); continue; }
    if (cell('supplier_ref')) after.supplier_ref = cell('supplier_ref').slice(0, 120);

    let categoryPath = '';
    let categoryId: string | undefined;
    if (cell('category')) {
      // WooCommerce exports "A > B, C > D" (a comma inside a name as "\,"): the first category is the article's home.
      const first = cell('category').split(/(?<!\\),/)[0].replace(/\\,/g, ',');
      const parts = first.split(/\s*[>›]\s*/).map((p) => p.trim().slice(0, 80)).filter(Boolean);
      categoryId = categoryByPath.get(parts.map((p) => p.toLowerCase()).join('>'));
      if (!categoryId && parts.length) { categoryPath = parts.join(' > '); newCategories.add(categoryPath); }
    }
    const specs: Specs = {};
    if (cell('brand')) specs.brand = cell('brand').slice(0, 60);
    if (cell('frequency')) specs.frequency = cell('frequency').slice(0, 40);
    if (cell('chip')) specs.chip = cell('chip').slice(0, 60);
    if (cell('blade')) specs.blade = cell('blade').slice(0, 40);
    if (cell('buttons')) {
      const n = Number(cell('buttons'));
      if (Number.isInteger(n) && n >= 0 && n <= 12) specs.buttons = n; else warnings.push(`Aantal knoppen "${cell('buttons')}" genegeerd.`);
    }
    if (cell('key_type')) {
      const raw = cell('key_type');
      const type = KEY_TYPE_VALUES.includes(raw.toLowerCase()) ? raw.toLowerCase() : KEY_TYPES.find(([re]) => re.test(raw))?.[1];
      if (type) specs.key_type = type; else warnings.push(`Sleuteltype "${raw}" niet herkend; genegeerd.`);
    }
    const fitments = cell('fitments') ? parseFitments(cell('fitments')) : [];

    // --- which article is this?
    const code = cell('code').toUpperCase();
    let matches: string[];
    if (code) {
      if (!ARTICLE_CODE.test(code)) { skip(`Code ${code} past niet bij deze installatie.`); continue; }
      matches = byCode.has(code) ? [code] : [];
    } else if (matchBy === 'sku') {
      if (!sku) { skip('Geen SKU op deze regel.'); continue; }
      matches = bySku.get(sku.toUpperCase()) ?? [];
    } else {
      if (!eans.length) { skip('Geen EAN op deze regel.'); continue; }
      matches = [...new Set(eans.flatMap((e) => byEan.get(e) ?? []))];
    }
    if (matches.length > 1) { skip(`Meerdere artikelen passen: ${matches.slice(0, 5).join(', ')}.`); continue; }
    const target = matches[0] ? byCode.get(matches[0])! : null;
    const ownKey = target?.code ?? (code || `nieuw:${line}`);
    if (target && seenCodes.has(target.code)) { skip(`Artikel ${target.code} staat al eerder in dit bestand.`); continue; }
    if (!target && sku && seenNewSkus.has(sku.toUpperCase())) { skip(`SKU ${sku} staat al eerder in dit bestand als nieuw artikel.`); continue; }
    if (!target && code && seenCodes.has(code)) { skip(`Code ${code} staat al eerder in dit bestand.`); continue; }

    // --- barcodes: never take one from another article
    const newBarcodes = eans.filter((e) => !target?.ean.includes(e));
    const checkBarcodes = !target || target.tracking === 'quantity';
    const taken = checkBarcodes ? newBarcodes.map((e) => {
      const owner = (byEan.get(e) ?? []).find((c) => c !== target?.code);
      if (owner) return `${e} hoort bij ${owner}`;
      const claim = claimedBarcodes.get(e);
      return claim && claim !== ownKey ? `${e} staat in dit bestand ook bij ${claim}` : '';
    }).filter(Boolean) : [];
    if (taken.length) { skip(`Barcode ${taken.join('; ')}.`); continue; }

    if (!target) {
      if (!name) { skip('Nieuw artikel zonder naam.'); continue; }
      if (sku) seenNewSkus.add(sku.toUpperCase());
      if (code) seenCodes.add(code);
      for (const e of eans) claimedBarcodes.set(e, ownKey);
      const create: Record<string, unknown> = { ...after, ean: eans };
      if (categoryId) create.category_id = categoryId;
      const changes: PlanChange[] = Object.entries(create)
        .filter(([, v]) => !(Array.isArray(v) && !v.length))
        .map(([field, v]) => ({ field, from: '—', to: field === 'category_id' ? pathById.get(String(v)) ?? '' : show(field, v) }));
      if (categoryPath) changes.push({ field: 'category_id', from: '—', to: `${categoryPath} (nieuw)` });
      for (const [field, v] of Object.entries(specs)) changes.push({ field, from: '—', to: show(field, v) });
      if (fitments.length) changes.push({ field: 'fitments', from: '—', to: `${fitments.length} voertuig(en)` });
      rows.push({ line, action: 'create', code: code || null, name, changes, warnings });
      rpc.push({ action: 'create', code: code || undefined, after: create, category_path: categoryPath || undefined, specs, fitments });
      continue;
    }

    seenCodes.add(target.code);
    for (const e of eans) claimedBarcodes.set(e, target.code);
    const current = target as unknown as Record<string, unknown>;
    const diff: Record<string, unknown> = {};
    const before: Record<string, unknown> = {};
    const changes: PlanChange[] = [];
    for (const [field, value] of Object.entries(after)) {
      if ((current[field] ?? null) !== value) {
        diff[field] = value; before[field] = current[field] ?? null;
        changes.push({ field, from: show(field, current[field]), to: show(field, value) });
      }
    }
    if (newBarcodes.length) {
      diff.ean = [...target.ean, ...newBarcodes]; before.ean = target.ean;
      changes.push({ field: 'ean', from: show('ean', target.ean), to: show('ean', diff.ean) });
    }
    const fromPath = target.category_id ? pathById.get(target.category_id) ?? '' : '—';
    if (categoryId && categoryId !== target.category_id) {
      diff.category_id = categoryId; before.category_id = target.category_id;
      changes.push({ field: 'category_id', from: fromPath, to: pathById.get(categoryId) ?? '' });
    }
    if (categoryPath) {
      before.category_id = target.category_id;
      changes.push({ field: 'category_id', from: fromPath, to: `${categoryPath} (nieuw)` });
    }
    const oldSpecs = (specsBy.get(target.code) ?? {}) as Record<string, unknown>;
    const specDiff: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(specs)) {
      if ((oldSpecs[field] ?? null) !== value) { specDiff[field] = value; changes.push({ field, from: show(field, oldSpecs[field]), to: show(field, value) }); }
    }
    const known = fitsBy.get(target.code) ?? new Set<string>();
    const newFits = fitments.filter((f) => !known.has(fitKey(f)));
    if (newFits.length) changes.push({ field: 'fitments', from: `${known.size}`, to: `+${newFits.length} voertuig(en)` });

    if (!changes.length) { rows.push({ line, action: 'unchanged', code: target.code, name: target.name, changes, warnings }); continue; }
    rows.push({ line, action: 'update', code: target.code, name: target.name, changes, warnings });
    rpc.push({ action: 'update', code: target.code, before, after: diff, category_path: categoryPath || undefined, specs: specDiff as Specs, fitments: newFits });
  }

  // New articles with a code from the file go first, so a generated code (max + 1) can never take theirs.
  rpc.sort((a, b) => Number(!(a.action === 'create' && a.code)) - Number(!(b.action === 'create' && b.code)));

  const checksum = createHash('sha256').update(bytes).update(`|${matchBy}|${importPrefix()}`).digest('hex');
  const { data: run } = await db().from('kfc_import_runs').select('id, finished_at')
    .eq('kind', 'article_import').eq('checksum', checksum).is('error', null).maybeSingle();
  const counts = { create: 0, update: 0, unchanged: 0, skip: 0 };
  for (const r of rows) counts[r.action]++;
  return {
    plan: {
      checksum, fileName, matchBy, columns: [...columnAt.keys()], ignored, counts, newCategories: [...newCategories].sort(), rows,
      alreadyApplied: run ? { run: run.id as number, at: run.finished_at as string | null } : null,
    },
    rpc,
  };
}

/** Dry run: what the file would do. Writes nothing. */
export async function planImport(bytes: Buffer, fileName: string, matchBy: MatchBy): Promise<ImportPlan> {
  return (await buildPlan(bytes, fileName, matchBy)).plan;
}

export type ImportResult = {
  replay: boolean; run: number; summary: { created: number; updated: number; unchanged: number } | null; finishedAt: string | null; skipped: number;
};

/**
 * Apply: the plan is rebuilt from the same bytes on the server (never taken
 * from the browser) and written in one transaction. The checksum makes a
 * second apply of the same file a no-op that returns the first run.
 */
export async function applyImport(bytes: Buffer, fileName: string, matchBy: MatchBy, expected: string, user: CrmUser): Promise<ImportResult> {
  const { plan, rpc } = await buildPlan(bytes, fileName, matchBy);
  if (plan.checksum !== expected) throw new MasterError('Dit is niet hetzelfde bestand als in de proefrun. Doe eerst opnieuw een proefrun.', 409);
  const { data, error } = await db().rpc('kfc_apply_article_import', {
    p_checksum: plan.checksum, p_file: fileName.slice(0, 200), p_prefix: importPrefix(), p_rows: rpc, p_user: user.id,
  });
  if (error) {
    await db().from('kfc_import_runs').insert({
      shop: 'artikelen', kind: 'article_import', checksum: plan.checksum, file_name: fileName.slice(0, 200),
      created_by: user.id, finished_at: new Date().toISOString(), error: error.message.slice(0, 500),
    });
    throw mapError(error);
  }
  const result = data as { replay: boolean; run: number; summary: ImportResult['summary']; finished_at: string | null };
  return { replay: result.replay, run: result.run, summary: result.summary, finishedAt: result.finished_at, skipped: plan.counts.skip };
}

export type ImportRun = { id: number; file_name: string | null; started_at: string; finished_at: string | null; summary: Record<string, number> | null; error: string | null };

export async function recentImports(): Promise<ImportRun[]> {
  const { data } = await db().from('kfc_import_runs').select('id, file_name, started_at, finished_at, summary, error')
    .eq('kind', 'article_import').order('started_at', { ascending: false }).limit(10);
  return (data ?? []) as ImportRun[];
}

// ---------------------------------------------------------------------------
// Export: the same columns the import reads, so a file round-trips.
// ---------------------------------------------------------------------------

export const EXPORT_HEADERS = ['code', 'sku', 'ean', 'naam', 'categorie', 'status', 'verkoopprijs', 'inkoopprijs', 'min_voorraad', 'voorraad',
  'leveranciersref', 'merk', 'sleuteltype', 'frequentie', 'chip', 'knoppen', 'baard', 'voertuigen'] as const;
const STATUS_OUT: Record<string, string> = { held: 'voorraad', on_demand: 'op bestelling', discontinued: 'uitlopend' };

export async function exportArticles(filter: { category?: string | null; status?: string | null }) {
  const [articles, paths, specs, fits] = await Promise.all([
    loadArticles(),
    fetchAll<PathRow>((f, t) => db().from('kfc_category_paths').select(PATH_COLUMNS).order('id').range(f, t)),
    fetchAll<Specs & { article_code: string }>((f, t) => db().from('kfc_article_specs').select('article_code, brand, key_type, frequency, chip, buttons, blade').order('article_code').range(f, t)),
    fetchAll<Fitment & { article_code: string }>((f, t) => db().from('kfc_article_fitments').select('article_code, make, model, year_from, year_to').order('id').range(f, t)),
  ]);
  const pathById = new Map(paths.map((p) => [p.id, p]));
  const specsBy = new Map(specs.map((s) => [s.article_code, s]));
  const fitsBy = new Map<string, Fitment[]>();
  for (const f of fits) fitsBy.set(f.article_code, [...(fitsBy.get(f.article_code) ?? []), f]);
  const under = (id: string | null) => {
    if (!filter.category) return true;
    for (let at = id, guard = 0; at && guard < 20; at = pathById.get(at)?.parent_id ?? null, guard++) if (at === filter.category) return true;
    return false;
  };
  return articles
    .filter((a) => under(a.category_id) && (!filter.status || a.status === filter.status))
    .map((a) => {
      const s = specsBy.get(a.code);
      return {
        code: a.code, sku: a.sku, ean: a.ean.join(';'), naam: a.name,
        categorie: a.category_id ? (pathById.get(a.category_id)?.path ?? '').replace(/,/g, '\\,').replace(/ › /g, ' > ') : '',
        status: STATUS_OUT[a.status] ?? a.status,
        verkoopprijs: a.sale_price_cents === null ? null : a.sale_price_cents / 100,
        inkoopprijs: a.purchase_price_cents === null ? null : a.purchase_price_cents / 100,
        min_voorraad: a.min_stock, voorraad: a.physical, leveranciersref: a.supplier_ref ?? '',
        merk: s?.brand ?? '', sleuteltype: s?.key_type ?? '', frequentie: s?.frequency ?? '', chip: s?.chip ?? '',
        knoppen: s?.buttons ?? null, baard: s?.blade ?? '',
        voertuigen: (fitsBy.get(a.code) ?? []).map((f) => [f.make, f.model, f.year_from ?? '', f.year_to ?? ''].join('|')).join('; '),
      };
    });
}

export type ExportRow = Awaited<ReturnType<typeof exportArticles>>[number];

/** Dutch Excel: semicolon-separated, decimal comma, BOM so Excel reads UTF-8. Formula-looking text is defused. */
export function toCsv(rows: ExportRow[]): string {
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v);
    if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [EXPORT_HEADERS.join(';'), ...rows.map((r) => EXPORT_HEADERS.map((h) => cell(r[h])).join(';'))].join('\r\n') + '\r\n';
}

export function toXlsx(rows: ExportRow[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...EXPORT_HEADERS] });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Artikelen');
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
