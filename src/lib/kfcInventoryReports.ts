import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/kfcOrders';
import {
  REPORTS, amsterdamToday, isoDate, labelOf, CHANNELS,
  type ReportColumn, type ReportData, type ReportId, type ReportRow, type ReportSummary,
} from '@/lib/kfcReportColumns';

/*
 * Server loaders for the inventory and sales reports (/admin/voorraad/analyse),
 * the article master list (/admin/voorraad/artikelen) and the article 360°
 * page. They read the views and functions of migration 0131 with the
 * service-role client after the page or route has checked the user's role.
 *
 * Prices: `office` is seesPrices(user). Without it every money column and money
 * summary is removed here, before the data leaves the server.
 *
 * The functions are called with { get: true }: they are read-only, and a GET
 * also works on the read-only redesign copy (src/lib/readonly.ts).
 */

const db = () => createSupabaseAdminClient();
/** Embedded selects are typed as arrays by supabase-js; these are many-to-one, so one object. */
const typed = <T,>(query: PromiseLike<unknown>) => query as PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
const DAY = 86_400_000;

/* ── parameters ──────────────────────────────────────────────────────── */

export interface ReportParams {
  from: string; to: string; date: string; q: string; category: string; warehouse: string; channel: string;
  group: string; reason: string; basis: string; speed: string; lead: number; page: number;
}

type Search = Record<string, string | string[] | undefined> | URLSearchParams;
const read = (search: Search, key: string) => {
  const value = search instanceof URLSearchParams ? search.get(key) : search[key];
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? '' : '';
};
/** Free text for a filter: trimmed, no control characters, at most `max` long. */
export const clean = (value: string, max = 80) => value.replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);
const shiftDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY).toISOString().slice(0, 10);
/** The UTC instant of midnight in Amsterdam on an ISO date (summer and winter time). */
export function amsterdamMidnight(iso: string) {
  const utc = Date.parse(`${iso}T00:00:00Z`);
  const wall = (zone: string) => Date.parse(new Date(utc).toLocaleString('en-US', { timeZone: zone }) + ' UTC');
  return new Date(utc - (wall('Europe/Amsterdam') - wall('UTC'))).toISOString();
}

export function parseReportParams(id: ReportId, search: Search): ReportParams {
  const today = amsterdamToday();
  const longWindow = id === 'movers' || id === 'abc';
  const defaultFrom = longWindow ? shiftDays(today, -89) : today.slice(0, 8) + '01';
  let from = isoDate(read(search, 'from')) ?? defaultFrom;
  let to = isoDate(read(search, 'to')) ?? today;
  if (from > to) [from, to] = [to, from];
  const meta = REPORTS.find((r) => r.id === id);
  const group = read(search, 'group');
  const lead = Number(read(search, 'lead'));
  const page = Number(read(search, 'page'));
  return {
    from, to,
    date: isoDate(read(search, 'date')) ?? today,
    q: clean(read(search, 'q')),
    category: clean(read(search, 'category')),
    warehouse: clean(read(search, 'warehouse')),
    channel: CHANNELS.some((c) => c.id === read(search, 'channel')) ? read(search, 'channel') : '',
    group: meta?.groups?.some((g) => g.id === group) ? group : meta?.groups?.[0]?.id ?? '',
    reason: /^[a-z]{1,20}$/.test(read(search, 'reason')) ? read(search, 'reason') : '',
    basis: ['omzet', 'aantal', 'winst'].includes(read(search, 'basis')) ? read(search, 'basis') : (id === 'top' ? 'aantal' : 'omzet'),
    speed: ['snel', 'traag', 'dood'].includes(read(search, 'speed')) ? read(search, 'speed') : '',
    lead: Number.isInteger(lead) && lead >= 1 && lead <= 120 ? lead : 7,
    page: Number.isInteger(page) && page >= 1 && page <= 100_000 ? page : 1,
  };
}

/* ── shared helpers ──────────────────────────────────────────────────── */

const matchesQuery = (q: string, ...fields: (string | null | undefined)[]) =>
  !q || fields.some((field) => (field ?? '').toLocaleLowerCase('nl').includes(q.toLocaleLowerCase('nl')));

/** Drop money columns and summaries for users who may not see prices. */
export function stripMoney(data: ReportData, office: boolean): ReportData {
  if (office) return data;
  const keep = data.columns.filter((c) => !c.money);
  const keys = new Set(keep.map((c) => c.key));
  return {
    ...data,
    columns: keep,
    rows: data.rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => keys.has(key) || key === 'code'))),
    summary: data.summary.filter((s) => !s.money),
  };
}

const sum = (rows: ReportRow[], key: string) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);

async function vanNames(): Promise<Map<string, string>> {
  const { data } = await db().from('technicians').select('id, name');
  return new Map((data ?? []).map((t: { id: string; name: string }) => [t.id, t.name]));
}

function locationLabel(warehouse: string | null, shelf: string | null, box: string | null, kind: string | null, van?: string) {
  if (van) return `Bus · ${van}`;
  if (!warehouse || warehouse === '(geen locatie)') return '(geen locatie)';
  const place = [warehouse, shelf, box].filter(Boolean).join(' / ');
  return kind === 'quarantine' ? `${place} (quarantaine)` : place;
}

/* ── filter options ──────────────────────────────────────────────────── */

export async function filterOptions() {
  const [categories, locations, suppliers] = await Promise.all([
    fetchAll<{ category: string }>((a, b) => db().from('kfc_articles').select('category').neq('category', '').order('category').range(a, b)),
    db().from('kfc_locations').select('warehouse').order('warehouse'),
    db().from('kfc_purchase_orders').select('supplier').order('supplier').limit(5000),
  ]);
  return {
    categories: [...new Set(categories.map((r) => r.category))],
    warehouses: [...new Set((locations.data ?? []).map((r: { warehouse: string }) => r.warehouse))],
    suppliers: [...new Set((suppliers.data ?? []).map((r: { supplier: string }) => r.supplier).filter(Boolean))],
  };
}

/* ── reports ─────────────────────────────────────────────────────────── */

const C = (key: string, nl: string, en: string, type: ReportColumn['type'], extra: Partial<ReportColumn> = {}): ReportColumn => ({ key, nl, en, type, ...extra });
const ARTICLE_COLS = [C('code', 'Artikel', 'Item', 'code'), C('name', 'Naam', 'Name', 'text'), C('sku', 'SKU', 'SKU', 'text'), C('category', 'Categorie', 'Category', 'text', { optional: true })];

async function balance(p: ReportParams): Promise<ReportData> {
  type Level = { article_code: string; quantity: number; minimum: number; last_counted_at: string | null;
    kfc_articles: { name: string; sku: string; category: string; purchase_price_cents: number | null } | null;
    kfc_locations: { warehouse: string; shelf: string; box: string; kind: string; technician_id: string | null } | null };
  type Loose = { article_code: string; name: string; sku: string; category: string; quantity: number; unit_cost_cents: number | null };
  const [levels, loose, vans] = await Promise.all([
    fetchAll<Level>((a, b) => {
      let query = db().from('kfc_stock_levels')
        .select('article_code, quantity, minimum, last_counted_at, kfc_articles!inner(name, sku, category, purchase_price_cents), kfc_locations!inner(warehouse, shelf, box, kind, technician_id)')
        .neq('quantity', 0);
      if (p.category) query = query.eq('kfc_articles.category', p.category);
      if (p.warehouse) query = query.eq('kfc_locations.warehouse', p.warehouse);
      return typed<Level>(query.order('article_code').order('location_id').range(a, b));
    }),
    // Stock booked before the article had a shelf: the ledger knows it, the bins do not.
    p.warehouse && p.warehouse !== '(geen locatie)' ? Promise.resolve([] as Loose[]) :
      fetchAll<Loose>((a, b) => db().rpc('kfc_stock_valuation', { p_date: amsterdamToday(), p_warehouse: '(geen locatie)', p_category: p.category }, { get: true })
        .order('article_code').range(a, b)),
    vanNames(),
  ]);
  const detail: ReportRow[] = [
    ...levels.map((l) => {
      const loc = l.kfc_locations!;
      const cost = l.kfc_articles?.purchase_price_cents ?? null;
      return {
        code: l.article_code, name: l.kfc_articles?.name ?? '', sku: l.kfc_articles?.sku ?? '', category: l.kfc_articles?.category ?? '',
        warehouse: loc.warehouse, location: locationLabel(loc.warehouse, loc.shelf, loc.box, loc.kind, loc.technician_id ? vans.get(loc.technician_id) : undefined),
        quantity: l.quantity, minimum: l.minimum, last_counted_at: l.last_counted_at,
        unit_cost_cents: cost, value_cents: loc.kind === 'quarantine' ? 0 : Math.max(l.quantity, 0) * (cost ?? 0),
      };
    }),
    ...loose.map((l) => ({
      code: l.article_code, name: l.name, sku: l.sku, category: l.category, warehouse: '(geen locatie)', location: '(geen locatie)',
      quantity: Number(l.quantity), minimum: null, last_counted_at: null, unit_cost_cents: l.unit_cost_cents,
      value_cents: Math.max(Number(l.quantity), 0) * (l.unit_cost_cents ?? 0),
    })),
  ].filter((row) => matchesQuery(p.q, row.code, row.name, row.sku));

  const totals: ReportSummary[] = [
    { nl: 'Stuks', en: 'Units', value: sum(detail, 'quantity'), type: 'int' },
    { nl: 'Waarde (inkoopprijs)', en: 'Value (purchase price)', value: sum(detail, 'value_cents'), type: 'money', money: true },
    { nl: 'Artikelen', en: 'Items', value: new Set(detail.map((r) => r.code)).size, type: 'int' },
    { nl: 'Zonder kostprijs', en: 'Without cost', value: detail.filter((r) => r.unit_cost_cents === null && Number(r.quantity) > 0).length, type: 'int',
      tone: detail.some((r) => r.unit_cost_cents === null && Number(r.quantity) > 0) ? 'warn' : undefined },
  ];
  const notes = [{ nl: 'Waarde = stuks × huidige inkoopprijs; quarantaine telt niet mee in de waarde. Negatieve standen tellen als 0.',
    en: 'Value = units × current purchase price; quarantine is not valued. Negative balances count as 0.' }];

  if (p.group === 'detail') {
    return { columns: [...ARTICLE_COLS, C('location', 'Locatie', 'Location', 'text'), C('quantity', 'Aantal', 'Qty', 'int'),
      C('minimum', 'Minimum', 'Minimum', 'int', { optional: true }), C('last_counted_at', 'Laatst geteld', 'Last counted', 'date', { optional: true }),
      C('unit_cost_cents', 'Inkoopprijs', 'Unit cost', 'money', { money: true }), C('value_cents', 'Waarde', 'Value', 'money', { money: true })],
      rows: detail.sort((a, b) => String(a.code).localeCompare(String(b.code)) || String(a.location).localeCompare(String(b.location))), summary: totals, notes };
  }
  const key = p.group === 'warehouse' ? 'warehouse' : p.group === 'category' ? 'category' : 'code';
  const groups = new Map<string, ReportRow>();
  for (const row of detail) {
    const k = String(row[key] || '(geen)');
    const g = groups.get(k) ?? (key === 'code'
      ? { code: row.code, name: row.name, sku: row.sku, category: row.category, quantity: 0, value_cents: 0, locations: 0, unit_cost_cents: row.unit_cost_cents }
      : { [key]: k, quantity: 0, value_cents: 0, articles: 0, _codes: [] as string[] });
    g.quantity = Number(g.quantity) + Number(row.quantity);
    g.value_cents = Number(g.value_cents) + Number(row.value_cents);
    if (key === 'code') g.locations = Number(g.locations) + 1;
    else (g._codes as string[]).push(String(row.code));
    groups.set(k, g);
  }
  const rows = [...groups.values()].map((g) => {
    if (key !== 'code') { g.articles = new Set(g._codes as string[]).size; delete g._codes; }
    return g;
  }).sort((a, b) => Number(b.value_cents) - Number(a.value_cents) || Number(b.quantity) - Number(a.quantity));
  const columns = key === 'code'
    ? [...ARTICLE_COLS, C('locations', 'Locaties', 'Locations', 'int'), C('quantity', 'Aantal', 'Qty', 'int'),
      C('unit_cost_cents', 'Inkoopprijs', 'Unit cost', 'money', { money: true }), C('value_cents', 'Waarde', 'Value', 'money', { money: true })]
    : [C(key, key === 'warehouse' ? 'Magazijn' : 'Categorie', key === 'warehouse' ? 'Warehouse' : 'Category', 'text'), C('articles', 'Artikelen', 'Items', 'int'),
      C('quantity', 'Aantal', 'Qty', 'int'), C('value_cents', 'Waarde', 'Value', 'money', { money: true })];
  return { columns, rows, summary: totals, notes };
}

async function valuation(p: ReportParams): Promise<ReportData> {
  type Row = { article_code: string; name: string; sku: string; category: string; warehouse: string; shelf: string | null; box: string | null;
    kind: string; technician_id: string | null; quantity: number; unit_cost_cents: number | null; value_cents: number; cost_estimated: boolean };
  const [rows, vans] = await Promise.all([
    fetchAll<Row>((a, b) => db().rpc('kfc_stock_valuation', { p_date: p.date, p_warehouse: p.warehouse, p_category: p.category }, { get: true })
      .order('article_code').order('location_id').range(a, b)),
    vanNames(),
  ]);
  const detail: ReportRow[] = rows.map((r) => ({
    code: r.article_code, name: r.name, sku: r.sku, category: r.category, warehouse: r.warehouse,
    location: locationLabel(r.warehouse, r.shelf, r.box, r.kind, r.technician_id ? vans.get(r.technician_id) : undefined),
    quantity: Number(r.quantity), unit_cost_cents: r.unit_cost_cents, value_cents: Number(r.value_cents), estimated: r.cost_estimated,
  }));
  const summary: ReportSummary[] = [
    { nl: `Waarde op ${p.date}`, en: `Value on ${p.date}`, value: sum(detail, 'value_cents'), type: 'money', money: true },
    { nl: 'Stuks', en: 'Units', value: sum(detail, 'quantity'), type: 'int' },
    { nl: 'Artikelen', en: 'Items', value: new Set(detail.map((r) => r.code)).size, type: 'int' },
    { nl: 'Geschatte kostprijs', en: 'Estimated cost', value: detail.filter((r) => r.estimated).length, type: 'int' },
  ];
  const notes = [{ nl: 'Kostprijs = laatste ontvangst- of montagekostprijs tot en met die dag; zonder ontvangst de huidige inkoopprijs (geschat).',
    en: 'Cost = last receipt or assembly cost up to that day; without a receipt the current purchase price (estimated).' }];
  if (p.group === 'detail') {
    return { columns: [...ARTICLE_COLS, C('location', 'Locatie', 'Location', 'text'), C('quantity', 'Aantal', 'Qty', 'int'),
      C('unit_cost_cents', 'Kostprijs', 'Unit cost', 'money', { money: true }), C('value_cents', 'Waarde', 'Value', 'money', { money: true }),
      C('estimated', 'Geschat', 'Estimated', 'text', { optional: true })], rows: detail, summary, notes };
  }
  const key = p.group === 'warehouse' ? 'warehouse' : p.group === 'category' ? 'category' : 'code';
  const groups = new Map<string, ReportRow>();
  for (const row of detail) {
    const k = String(row[key] || '(geen)');
    const g = groups.get(k) ?? (key === 'code'
      ? { code: row.code, name: row.name, sku: row.sku, category: row.category, quantity: 0, unit_cost_cents: row.unit_cost_cents, value_cents: 0 }
      : { [key]: k, quantity: 0, value_cents: 0, share: 0 });
    g.quantity = Number(g.quantity) + Number(row.quantity);
    g.value_cents = Number(g.value_cents) + Number(row.value_cents);
    groups.set(k, g);
  }
  const total = sum(detail, 'value_cents');
  const out = [...groups.values()].map((g) => (key === 'code' ? g : { ...g, share: total ? Math.round(Number(g.value_cents) / total * 1000) / 10 : 0 }))
    .sort((a, b) => Number(b.value_cents) - Number(a.value_cents));
  const columns = key === 'code'
    ? [...ARTICLE_COLS, C('quantity', 'Aantal', 'Qty', 'int'), C('unit_cost_cents', 'Kostprijs', 'Unit cost', 'money', { money: true }), C('value_cents', 'Waarde', 'Value', 'money', { money: true })]
    : [C(key, key === 'warehouse' ? 'Magazijn' : 'Categorie', key === 'warehouse' ? 'Warehouse' : 'Category', 'text'), C('quantity', 'Aantal', 'Qty', 'int'),
      C('value_cents', 'Waarde', 'Value', 'money', { money: true }), C('share', 'Aandeel', 'Share', 'pct', { money: true })];
  return { columns, rows: out, summary, notes };
}

export const LEDGER_PAGE = 100;
type LedgerMove = {
  id: number; created_at: string; article_code: string; name: string; sku: string; category: string; reason: string; delta: number;
  quantity_after: number | null; balance: number; warehouse: string | null; shelf: string | null; box: string | null; unit_cost_cents: number | null;
  value_cents: number | null; note: string | null; supplier: string | null; order_number: string | null; invoice_number: string | null;
  order_line_id: string | null; sales_invoice_id: string | null; count_batch_id: string | null;
};
export async function ledgerMoves(p: ReportParams & { article?: string }, pageSize = LEDGER_PAGE) {
  const { data, error } = await db().rpc('kfc_stock_ledger', {
    p_from: p.from, p_to: p.to, p_article: p.article ?? '', p_reason: p.reason, p_warehouse: p.warehouse,
    p_query: p.q, p_page: p.page, p_page_size: pageSize,
  }, { get: true });
  if (error) throw new Error(`Voorraadgrootboek laden mislukt: ${error.message}`);
  return data as { opening: number; count: number; incoming: number; outgoing: number; rows: LedgerMove[] };
}

const sourceOf = (m: LedgerMove) => m.order_number ? `Bestelling ${m.order_number}` : m.invoice_number ? `Factuur ${m.invoice_number}`
  : m.supplier ? `Inkoop ${m.supplier}` : m.count_batch_id ? 'Bulktelling' : m.note ?? '';

async function ledger(p: ReportParams, all: boolean): Promise<ReportData> {
  const report = await ledgerMoves(p, all ? 0 : LEDGER_PAGE);
  const rows: ReportRow[] = report.rows.map((m) => ({
    created_at: m.created_at, code: m.article_code, name: m.name, sku: m.sku, category: m.category, reason: m.reason,
    location: locationLabel(m.warehouse, m.shelf, m.box, null), incoming: m.delta > 0 ? m.delta : null, outgoing: m.delta < 0 ? -m.delta : null,
    quantity_after: m.quantity_after, balance: Number(m.balance), unit_cost_cents: m.unit_cost_cents, value_cents: m.value_cents, source: sourceOf(m),
  }));
  return {
    columns: [C('created_at', 'Datum', 'Date', 'datetime'), ...ARTICLE_COLS, C('reason', 'Soort', 'Type', 'badge'), C('location', 'Locatie', 'Location', 'text'),
      C('incoming', 'In', 'In', 'int'), C('outgoing', 'Uit', 'Out', 'int'), C('quantity_after', 'Na boeking (bak)', 'After (bin)', 'int', { optional: true }),
      C('balance', 'Saldo artikel', 'Item balance', 'int'), C('unit_cost_cents', 'Kostprijs', 'Unit cost', 'money', { money: true, optional: true }),
      C('value_cents', 'Waarde', 'Value', 'money', { money: true }), C('source', 'Bron', 'Source', 'text')],
    rows,
    summary: [
      { nl: 'Beginsaldo', en: 'Opening', value: Number(report.opening), type: 'int' },
      { nl: 'In', en: 'In', value: Number(report.incoming), type: 'int' },
      { nl: 'Uit', en: 'Out', value: Number(report.outgoing), type: 'int' },
      { nl: 'Eindsaldo', en: 'Closing', value: Number(report.opening) + Number(report.incoming) - Number(report.outgoing), type: 'int' },
    ],
    notes: [{ nl: 'Saldo artikel = voorraad van dat artikel over alle locaties direct na de boeking. Beginsaldo en eindsaldo gelden voor de gefilterde artikelen (alle locaties).',
      en: 'Item balance = that item’s stock over all locations right after the movement. Opening and closing cover the filtered items (all locations).' }],
    total: Number(report.count), page: all ? 1 : p.page, pageSize: all ? Number(report.count) : LEDGER_PAGE,
  };
}

async function ageing(p: ReportParams): Promise<ReportData> {
  type Row = { code: string; name: string; sku: string; category: string; physical: number; unit_cost_cents: number | null; value_cents: number;
    q_0_30: number; q_31_60: number; q_61_90: number; q_91_180: number; q_181_365: number; q_365p: number;
    oldest_days: number | null; avg_days: number | null; last_received_at: string | null; last_sold_at: string | null };
  const data = await fetchAll<Row>((a, b) => db().rpc('kfc_stock_ageing', { p_category: p.category }, { get: true }).order('code').range(a, b));
  const rows: ReportRow[] = data.filter((r) => matchesQuery(p.q, r.code, r.name, r.sku)).map((r) => ({
    ...r, physical: Number(r.physical), value_cents: Number(r.value_cents),
    q_0_30: Number(r.q_0_30), q_31_60: Number(r.q_31_60), q_61_90: Number(r.q_61_90), q_91_180: Number(r.q_91_180), q_181_365: Number(r.q_181_365), q_365p: Number(r.q_365p),
    avg_days: r.avg_days === null ? null : Number(r.avg_days),
    days_since_receipt: r.last_received_at ? Math.floor((Date.now() - Date.parse(r.last_received_at)) / DAY) : null,
  })).sort((a, b) => Number(b.avg_days ?? 99999) - Number(a.avg_days ?? 99999));
  const bucket = (key: string) => rows.reduce((s, r) => s + Number(r[key]), 0);
  return {
    columns: [...ARTICLE_COLS, C('physical', 'Voorraad', 'Stock', 'int'), C('q_0_30', '0–30 d', '0–30 d', 'int'), C('q_31_60', '31–60 d', '31–60 d', 'int'),
      C('q_61_90', '61–90 d', '61–90 d', 'int'), C('q_91_180', '91–180 d', '91–180 d', 'int'), C('q_181_365', '181–365 d', '181–365 d', 'int'),
      C('q_365p', '> 365 d / onbekend', '> 365 d / unknown', 'int'), C('avg_days', 'Gem. leeftijd', 'Avg age', 'days'),
      C('days_since_receipt', 'Dagen sinds ontvangst', 'Days since receipt', 'days'), C('last_sold_at', 'Laatst verkocht', 'Last sold', 'date', { optional: true }),
      C('value_cents', 'Waarde', 'Value', 'money', { money: true })],
    rows,
    summary: [
      { nl: '0–90 dagen', en: '0–90 days', value: bucket('q_0_30') + bucket('q_31_60') + bucket('q_61_90'), type: 'int' },
      { nl: '91–365 dagen', en: '91–365 days', value: bucket('q_91_180') + bucket('q_181_365'), type: 'int' },
      { nl: 'Ouder dan een jaar of onbekend', en: 'Over a year or unknown', value: bucket('q_365p'), type: 'int', tone: bucket('q_365p') ? 'warn' : undefined },
      { nl: 'Waarde', en: 'Value', value: rows.reduce((s, r) => s + Number(r.value_cents), 0), type: 'money', money: true },
    ],
    notes: [{ nl: 'FIFO: de huidige voorraad wordt toegewezen aan de laatste ontvangsten, retouren en positieve tellingen. Voorraad ouder dan de eerste boeking telt als "onbekend".',
      en: 'FIFO: current stock is assigned to the latest receipts, returns and positive counts. Stock older than the first movement counts as "unknown".' }],
  };
}

type Movement = { code: string; name: string; sku: string; category: string; status: string; physical: number; available: number; stock_value_cents: number;
  sold: number; revenue_cents: number; profit_cents: number; last_sold_at: string | null; last_received_at: string | null; days_cover: number | null };
async function movementRows(p: ReportParams) {
  const rows = await fetchAll<Movement>((a, b) => db().rpc('kfc_article_movement', { p_from: p.from, p_to: p.to, p_category: p.category }, { get: true }).order('code').range(a, b));
  return rows.map((r) => ({ ...r, sold: Number(r.sold), revenue_cents: Number(r.revenue_cents), profit_cents: Number(r.profit_cents), stock_value_cents: Number(r.stock_value_cents),
    days_cover: r.days_cover === null ? null : Number(r.days_cover) })).filter((r) => matchesQuery(p.q, r.code, r.name, r.sku));
}

async function movers(p: ReportParams): Promise<ReportData> {
  const all = await movementRows(p);
  const selling = all.filter((r) => r.sold > 0).sort((a, b) => b.sold - a.sold);
  const fastCut = selling[Math.max(0, Math.ceil(selling.length * 0.2) - 1)]?.sold ?? Infinity;
  const classify = (r: Movement) => r.sold <= 0 ? (r.physical > 0 ? 'dood' : 'geen') : r.sold >= fastCut ? 'snel' : (r.days_cover ?? 0) > 180 ? 'traag' : 'normaal';
  const label: Record<string, string> = { snel: 'Snel', traag: 'Traag', dood: 'Niet verkocht', normaal: 'Normaal', geen: '—' };
  const rows: ReportRow[] = all.map((r) => ({ ...r, speed: classify(r) }))
    .filter((r) => !p.speed || r.speed === p.speed)
    .sort((a, b) => b.sold - a.sold || b.physical - a.physical)
    .map((r) => ({ ...r, speed_label: label[r.speed] }));
  const days = Math.round((Date.parse(p.to) - Date.parse(p.from)) / DAY) + 1;
  return {
    columns: [...ARTICLE_COLS, C('speed_label', 'Snelheid', 'Speed', 'badge'), C('sold', 'Verkocht', 'Sold', 'int'), C('physical', 'Voorraad', 'Stock', 'int'),
      C('days_cover', 'Dagen voorraad', 'Days of cover', 'days'), C('last_sold_at', 'Laatst verkocht', 'Last sold', 'date'),
      C('last_received_at', 'Laatst ontvangen', 'Last received', 'date', { optional: true }), C('revenue_cents', 'Omzet', 'Revenue', 'money', { money: true, optional: true }),
      C('stock_value_cents', 'Voorraadwaarde', 'Stock value', 'money', { money: true })],
    rows,
    summary: [
      { nl: `Verkocht in ${days} dagen`, en: `Sold in ${days} days`, value: all.reduce((s, r) => s + r.sold, 0), type: 'int' },
      { nl: 'Snellopers (top 20%)', en: 'Fast movers (top 20%)', value: all.filter((r) => classify(r) === 'snel').length, type: 'int', tone: 'ok' },
      { nl: 'Traag (> 180 dagen voorraad)', en: 'Slow (> 180 days cover)', value: all.filter((r) => classify(r) === 'traag').length, type: 'int', tone: 'warn' },
      { nl: 'Voorraad zonder verkoop', en: 'Stock without sales', value: all.filter((r) => classify(r) === 'dood').length, type: 'int', tone: 'stop' },
      { nl: 'Waarde zonder verkoop', en: 'Value without sales', value: all.filter((r) => classify(r) === 'dood').reduce((s, r) => s + r.stock_value_cents, 0), type: 'money', money: true },
    ],
    notes: [{ nl: 'Snel = de 20% artikelen met de meeste verkochte stuks; traag = verkocht, maar de voorraad dekt meer dan 180 dagen; dagen voorraad = voorraad ÷ verkoop per dag in de periode.',
      en: 'Fast = the 20% of items with most units sold; slow = selling, but stock covers more than 180 days; days of cover = stock ÷ sales per day in the period.' }],
  };
}

async function abc(p: ReportParams): Promise<ReportData> {
  const all = await movementRows(p);
  const metric = (r: Movement) => p.basis === 'aantal' ? r.sold : p.basis === 'winst' ? r.profit_cents : r.revenue_cents;
  const selling = all.filter((r) => metric(r) > 0).sort((a, b) => metric(b) - metric(a));
  const total = selling.reduce((s, r) => s + metric(r), 0);
  let running = 0;
  const rows: ReportRow[] = selling.map((r) => {
    const share = total ? metric(r) / total * 100 : 0;
    const before = running;
    running += share;
    return { ...r, share: Math.round(share * 10) / 10, cumulative: Math.round(running * 10) / 10, class: before < 80 ? 'A' : before < 95 ? 'B' : 'C' };
  });
  for (const r of all) if (metric(r) <= 0 && r.physical > 0) rows.push({ ...r, share: 0, cumulative: null, class: 'D' });
  const per = (k: string) => rows.filter((r) => r.class === k);
  const basisLabel = p.basis === 'aantal' ? ['aantal', 'units'] : p.basis === 'winst' ? ['winst', 'profit'] : ['omzet', 'revenue'];
  return {
    columns: [C('class', 'Klasse', 'Class', 'badge'), ...ARTICLE_COLS, C('sold', 'Verkocht', 'Sold', 'int'), C('revenue_cents', 'Omzet', 'Revenue', 'money', { money: true }),
      C('profit_cents', 'Brutowinst', 'Gross profit', 'money', { money: true }), C('share', 'Aandeel', 'Share', 'pct'), C('cumulative', 'Cumulatief', 'Cumulative', 'pct'),
      C('physical', 'Voorraad', 'Stock', 'int'), C('stock_value_cents', 'Voorraadwaarde', 'Stock value', 'money', { money: true })],
    rows,
    summary: (['A', 'B', 'C', 'D'] as const).map((k) => ({
      nl: `Klasse ${k}: artikelen / voorraadwaarde`, en: `Class ${k}: items / stock value`,
      value: `${per(k).length} / ${new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(per(k).reduce((s, r) => s + Number(r.stock_value_cents), 0) / 100)}`,
      type: 'text' as const, money: true, tone: k === 'D' && per(k).length ? 'warn' as const : undefined,
    })),
    notes: [{ nl: `Gerangschikt op ${basisLabel[0]} in de periode. A = samen de eerste 80%, B = tot 95%, C = de rest, D = voorraad zonder verkoop.`,
      en: `Ranked by ${basisLabel[1]} in the period. A = together the first 80%, B = up to 95%, C = the rest, D = stock without sales.` }],
  };
}

type Overview = {
  code: string; name: string; sku: string; ean: string[]; category: string; status: string; condition: string; tracking: string; supplier_ref: string | null;
  sale_price_cents: number | null; purchase_price_cents: number | null; photo_version: string | null; physical: number; unusable: number; reserved: number;
  available: number; incoming: number; minimum: number; stock_value_cents: number; unpriced: boolean; warehouses: string[]; locations: string[];
  last_counted_at: string | null; suppliers: string[]; last_supplier: string | null; last_po_cost_cents: number | null; last_received_at: string | null;
  last_sold_at: string | null; last_move_at: string | null; sold_30d: number; sold_90d: number; sold_365d: number; stock_state: string; margin_pct: number | null;
  created_at: string; updated_at: string;
};

async function reorder(p: ReportParams): Promise<ReportData> {
  const rows = await fetchAll<Overview>((a, b) => {
    let query = db().from('kfc_article_overview').select('*').neq('status', 'discontinued')
      .or('stock_state.in.(negatief,laag),sold_90d.gt.0,and(stock_state.eq.nul,status.eq.held)');
    if (p.category) query = query.eq('category', p.category);
    return query.order('code').range(a, b);
  });
  const cover = 30;
  const out: ReportRow[] = [];
  for (const r of rows) {
    if (!matchesQuery(p.q, r.code, r.name, r.sku, r.supplier_ref)) continue;
    const perDay = Number(r.sold_90d) / 90;
    const needed = Math.max(Number(r.minimum), Math.ceil(perDay * (p.lead + cover)));
    const position = Number(r.available) + Number(r.incoming);
    const suggest = Math.max(0, needed - position);
    const daysLeft = perDay > 0 ? Math.floor(Math.max(Number(r.available), 0) / perDay) : null;
    const priority = Number(r.physical) < 0 || (Number(r.available) <= 0 && perDay > 0) ? 'kritiek'
      : daysLeft !== null && daysLeft <= p.lead ? 'kritiek'
      : suggest > 0 ? 'bestellen' : r.stock_state === 'nul' ? 'op' : '';
    if (!priority) continue;
    const cost = r.last_po_cost_cents ?? r.purchase_price_cents;
    out.push({
      priority: priority === 'kritiek' ? 'Kritiek' : priority === 'bestellen' ? 'Bestellen' : 'Op (geen verkoop)',
      code: r.code, name: r.name, sku: r.sku, category: r.category, state: labelOf([{ id: 'negatief', nl: 'Negatief', en: 'Negative' }, { id: 'nul', nl: 'Nul', en: 'Zero' }, { id: 'laag', nl: 'Laag', en: 'Low' }, { id: 'op_voorraad', nl: 'Op voorraad', en: 'In stock' }], r.stock_state),
      physical: Number(r.physical), reserved: Number(r.reserved), available: Number(r.available), incoming: Number(r.incoming), minimum: Number(r.minimum),
      sold_90d: Number(r.sold_90d), days_left: daysLeft, suggest, supplier: r.last_supplier ?? r.supplier_ref ?? '',
      unit_cost_cents: cost, order_value_cents: cost === null ? null : cost * suggest, _rank: priority === 'kritiek' ? 0 : priority === 'bestellen' ? 1 : 2,
    });
  }
  out.sort((a, b) => Number(a._rank) - Number(b._rank) || Number(a.days_left ?? 99999) - Number(b.days_left ?? 99999) || Number(b.sold_90d) - Number(a.sold_90d));
  out.forEach((r) => delete r._rank);
  return {
    columns: [C('priority', 'Prioriteit', 'Priority', 'badge'), ...ARTICLE_COLS, C('state', 'Stand', 'State', 'text', { optional: true }),
      C('physical', 'Fysiek', 'Physical', 'int'), C('reserved', 'Gereserveerd', 'Reserved', 'int', { optional: true }), C('available', 'Beschikbaar', 'Available', 'int'),
      C('incoming', 'Onderweg', 'Incoming', 'int'), C('minimum', 'Minimum', 'Minimum', 'int'), C('sold_90d', 'Verkocht 90 d', 'Sold 90 d', 'int'),
      C('days_left', 'Dagen over', 'Days left', 'days'), C('suggest', 'Advies bestellen', 'Suggested order', 'int'), C('supplier', 'Leverancier', 'Supplier', 'text'),
      C('unit_cost_cents', 'Inkoopprijs', 'Unit cost', 'money', { money: true, optional: true }), C('order_value_cents', 'Bestelwaarde', 'Order value', 'money', { money: true })],
    rows: out,
    summary: [
      { nl: 'Kritiek', en: 'Critical', value: out.filter((r) => r.priority === 'Kritiek').length, type: 'int', tone: 'stop' },
      { nl: 'Bestellen', en: 'To order', value: out.filter((r) => r.priority === 'Bestellen').length, type: 'int', tone: 'warn' },
      { nl: 'Stuks te bestellen', en: 'Units to order', value: sum(out, 'suggest'), type: 'int' },
      { nl: 'Bestelwaarde', en: 'Order value', value: sum(out, 'order_value_cents'), type: 'money', money: true },
    ],
    notes: [{ nl: `Advies = max(minimum, verkoop per dag × (levertijd ${p.lead} + ${cover} dagen)) − beschikbaar − onderweg. Verkoop per dag = verkocht in 90 dagen ÷ 90. Kritiek = negatief, op terwijl het verkoopt, of op binnen de levertijd.`,
      en: `Suggestion = max(minimum, sales per day × (lead time ${p.lead} + ${cover} days)) − available − incoming. Sales per day = sold in 90 days ÷ 90. Critical = negative, out while selling, or out within the lead time.` }],
  };
}

async function counts(p: ReportParams): Promise<ReportData> {
  type Row = { id: number; created_at: string; article_code: string; delta: number; quantity_after: number | null; count_batch_id: string | null; note: string | null;
    kfc_articles: { name: string; sku: string; category: string; purchase_price_cents: number | null } | null;
    kfc_locations: { warehouse: string; shelf: string; box: string; kind: string } | null };
  const ends = shiftDays(p.to, 1);
  const data = await fetchAll<Row>((a, b) => typed<Row>(db().from('kfc_stock_moves')
    .select('id, created_at, article_code, delta, quantity_after, count_batch_id, note, kfc_articles(name, sku, category, purchase_price_cents), kfc_locations(warehouse, shelf, box, kind)')
    .eq('reason', 'count').gte('created_at', amsterdamMidnight(p.from)).lt('created_at', amsterdamMidnight(ends))
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(a, b)));
  const rows: ReportRow[] = data.filter((m) => matchesQuery(p.q, m.article_code, m.kfc_articles?.name, m.kfc_articles?.sku)).map((m) => {
    const cost = m.kfc_articles?.purchase_price_cents ?? null;
    return {
      created_at: m.created_at, code: m.article_code, name: m.kfc_articles?.name ?? '', sku: m.kfc_articles?.sku ?? '', category: m.kfc_articles?.category ?? '',
      location: locationLabel(m.kfc_locations?.warehouse ?? null, m.kfc_locations?.shelf ?? null, m.kfc_locations?.box ?? null, m.kfc_locations?.kind ?? null),
      before: m.quantity_after === null ? null : m.quantity_after - m.delta, counted: m.quantity_after, difference: m.delta,
      value_cents: cost === null ? null : cost * m.delta, batch: m.count_batch_id ? `Bulk ${m.count_batch_id.slice(0, 8)}` : 'Los', note: m.note ?? '',
    };
  });
  const plus = rows.filter((r) => Number(r.difference) > 0), minus = rows.filter((r) => Number(r.difference) < 0);
  return {
    columns: [C('created_at', 'Datum', 'Date', 'datetime'), ...ARTICLE_COLS, C('location', 'Locatie', 'Location', 'text'), C('before', 'Was', 'Before', 'int'),
      C('counted', 'Geteld', 'Counted', 'int'), C('difference', 'Verschil', 'Difference', 'int'), C('value_cents', 'Waarde verschil', 'Difference value', 'money', { money: true }),
      C('batch', 'Telling', 'Count', 'text'), C('note', 'Notitie', 'Note', 'text', { optional: true })],
    rows,
    summary: [
      { nl: 'Tellingen met verschil', en: 'Counts with a difference', value: rows.length, type: 'int' },
      { nl: 'Meer gevonden (stuks)', en: 'Found extra (units)', value: sum(plus, 'difference'), type: 'int' },
      { nl: 'Minder gevonden (stuks)', en: 'Missing (units)', value: -sum(minus, 'difference'), type: 'int', tone: minus.length ? 'warn' : undefined },
      { nl: 'Netto waarde verschil', en: 'Net difference value', value: sum(rows, 'value_cents'), type: 'money', money: true },
    ],
    notes: [{ nl: 'Een telling zonder verschil maakt geen boeking en staat hier dus niet; de teldatum staat wel bij de bak. Waarde tegen de huidige inkoopprijs.',
      en: 'A count without a difference books nothing and is not listed; the count date is kept on the bin. Valued at the current purchase price.' }],
  };
}

type SalesRow = { key: string; label: string; category: string | null; quantity: number; lines: number; revenue_cents: number; cost_cents: number;
  profit_cents: number; margin_pct: number | null; estimated: number; first_at: string; last_at: string };
export async function salesRows(p: Pick<ReportParams, 'from' | 'to' | 'group' | 'category' | 'channel' | 'q'>) {
  const rows = await fetchAll<SalesRow>((a, b) => db().rpc('kfc_sales_report', {
    p_from: p.from, p_to: p.to, p_group: p.group, p_category: p.category, p_channel: p.channel, p_query: p.q,
  }, { get: true }).order('key').range(a, b));
  return rows.map((r) => ({ ...r, quantity: Number(r.quantity), lines: Number(r.lines), revenue_cents: Number(r.revenue_cents), cost_cents: Number(r.cost_cents),
    profit_cents: Number(r.profit_cents), margin_pct: r.margin_pct === null ? null : Number(r.margin_pct), estimated: Number(r.estimated) }));
}

const salesKeyColumn = (group: string): ReportColumn[] => group === 'article' ? ARTICLE_COLS.filter((c) => c.key !== 'sku')
  : [C('label', { category: 'Categorie', day: 'Dag', month: 'Maand', channel: 'Kanaal', shop: 'Webshop' }[group] ?? 'Groep',
    { category: 'Category', day: 'Day', month: 'Month', channel: 'Channel', shop: 'Web shop' }[group] ?? 'Group', group === 'day' || group === 'month' ? 'date' : 'text')];

async function sales(p: ReportParams, mode: 'sales' | 'profit' | 'top'): Promise<ReportData> {
  const group = mode === 'top' ? 'article' : p.group;
  const data = await salesRows({ ...p, group });
  let rows: ReportRow[] = data.map((r) => ({
    code: r.key, label: group === 'channel' ? labelOf(CHANNELS, r.label) : r.label, name: r.label, category: r.category ?? '',
    quantity: r.quantity, lines: r.lines, revenue_cents: r.revenue_cents, cost_cents: r.cost_cents, profit_cents: r.profit_cents, margin_pct: r.margin_pct,
    avg_price_cents: r.quantity ? Math.round(r.revenue_cents / r.quantity) : null, estimated: r.estimated,
  }));
  if (group === 'day' || group === 'month') rows.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  else if (mode === 'profit') rows.sort((a, b) => Number(b.profit_cents) - Number(a.profit_cents));
  else if (mode === 'top') {
    const k = p.basis === 'winst' ? 'profit_cents' : p.basis === 'omzet' ? 'revenue_cents' : 'quantity';
    rows = rows.sort((a, b) => Number(b[k]) - Number(a[k])).slice(0, 50).map((r, i) => ({ rank: i + 1, ...r }));
  } else rows.sort((a, b) => Number(b.revenue_cents) - Number(a.revenue_cents));
  const revenue = sum(rows, 'revenue_cents'), cost = sum(rows, 'cost_cents');
  const allRevenue = mode === 'top' ? data.reduce((s, r) => s + r.revenue_cents, 0) : revenue;
  const columns: ReportColumn[] = [
    ...(mode === 'top' ? [C('rank', '#', '#', 'int')] : []),
    ...salesKeyColumn(group),
    C('quantity', 'Aantal', 'Units', 'int'), C('lines', 'Regels', 'Lines', 'int', { optional: true }),
    C('avg_price_cents', 'Gem. prijs', 'Avg price', 'money', { money: true, optional: mode !== 'sales' }),
    C('revenue_cents', 'Omzet excl. btw', 'Revenue excl. VAT', 'money', { money: true }),
    C('cost_cents', 'Kostprijs', 'Cost', 'money', { money: true, optional: mode === 'sales' }),
    C('profit_cents', 'Brutowinst', 'Gross profit', 'money', { money: true, optional: mode === 'sales' }),
    C('margin_pct', 'Marge', 'Margin', 'pct', { money: true }),
    C('estimated', 'Geschat', 'Estimated', 'int', { optional: true }),
  ];
  return {
    columns, rows,
    summary: [
      { nl: mode === 'top' ? 'Omzet top 50' : 'Omzet excl. btw', en: mode === 'top' ? 'Revenue top 50' : 'Revenue excl. VAT', value: revenue, type: 'money', money: true },
      { nl: 'Brutowinst', en: 'Gross profit', value: revenue - cost, type: 'money', money: true },
      { nl: 'Marge', en: 'Margin', value: revenue ? Math.round((revenue - cost) / revenue * 1000) / 10 : null, type: 'pct', money: true },
      mode === 'top'
        ? { nl: 'Aandeel in totale omzet', en: 'Share of total revenue', value: allRevenue ? Math.round(revenue / allRevenue * 1000) / 10 : null, type: 'pct', money: true }
        : { nl: 'Stuks verkocht', en: 'Units sold', value: sum(rows, 'quantity'), type: 'int' },
    ],
    notes: [{ nl: 'Op leverdatum (verzending, kassabon of factuur), retouren verlagen aantal en omzet. Webshop: regeltotaal excl. btw; kassa/factuur: de factuurregel; anders schapprijs ÷ 1,21 (geschat). Kostprijs: kostprijs op de boeking, anders huidige inkoopprijs (geschat).',
      en: 'By delivery date (shipment, till receipt or invoice); returns reduce units and revenue. Web shop: line total excl. VAT; till/invoice: the invoice line; otherwise shelf price ÷ 1.21 (estimated). Cost: cost on the movement, else current purchase price (estimated).' }],
  };
}

export async function loadReport(id: ReportId, p: ReportParams, office: boolean, all = false): Promise<ReportData> {
  const data = await ({
    balance: () => balance(p), valuation: () => valuation(p), ledger: () => ledger(p, all), ageing: () => ageing(p),
    movers: () => movers(p), abc: () => abc(p), reorder: () => reorder(p), counts: () => counts(p),
    sales: () => sales(p, 'sales'), profit: () => sales(p, 'profit'), top: () => sales(p, 'top'),
  } satisfies Record<ReportId, () => Promise<ReportData>>)[id]();
  return stripMoney(data, office);
}

/* ── article master list ─────────────────────────────────────────────── */

export const ARTICLE_COLUMNS: ReportColumn[] = [
  C('code', 'Artikel', 'Item', 'code'), C('name', 'Naam', 'Name', 'text'), C('sku', 'SKU', 'SKU', 'text'),
  C('ean', 'EAN', 'EAN', 'list', { optional: true }), C('category', 'Categorie', 'Category', 'text'),
  C('status', 'Status', 'Status', 'badge', { optional: true }), C('stock_state', 'Stand', 'State', 'badge'),
  C('physical', 'Fysiek', 'Physical', 'int'), C('reserved', 'Gereserveerd', 'Reserved', 'int', { optional: true }),
  C('available', 'Beschikbaar', 'Available', 'int'), C('incoming', 'Onderweg', 'Incoming', 'int'),
  C('unusable', 'Onbruikbaar', 'Unusable', 'int', { optional: true }), C('minimum', 'Minimum', 'Minimum', 'int', { optional: true }),
  C('locations', 'Locaties', 'Locations', 'list', { optional: true }), C('last_supplier', 'Leverancier', 'Supplier', 'text', { optional: true }),
  C('supplier_ref', 'Leveranciersref.', 'Supplier ref', 'text', { optional: true }),
  C('sold_30d', 'Verkocht 30 d', 'Sold 30 d', 'int'), C('sold_90d', 'Verkocht 90 d', 'Sold 90 d', 'int', { optional: true }),
  C('sold_365d', 'Verkocht 365 d', 'Sold 365 d', 'int', { optional: true }),
  C('last_sold_at', 'Laatst verkocht', 'Last sold', 'date', { optional: true }), C('last_received_at', 'Laatst ontvangen', 'Last received', 'date', { optional: true }),
  C('last_counted_at', 'Laatst geteld', 'Last counted', 'date', { optional: true }),
  C('condition', 'Conditie', 'Condition', 'text', { optional: true }), C('tracking', 'Registratie', 'Tracking', 'text', { optional: true }),
  C('purchase_price_cents', 'Inkoopprijs', 'Purchase price', 'money', { money: true }),
  C('sale_price_cents', 'Verkoopprijs incl. btw', 'Sale price incl. VAT', 'money', { money: true }),
  C('margin_pct', 'Marge', 'Margin', 'pct', { money: true, optional: true }),
  C('stock_value_cents', 'Voorraadwaarde', 'Stock value', 'money', { money: true }),
];
const SORTABLE = new Set(ARTICLE_COLUMNS.filter((c) => !['ean', 'locations'].includes(c.key)).map((c) => c.key));
export const PAGE_SIZES = [50, 100, 250, 500];

export interface ArticleQuery {
  q: string; category: string; status: string; supplier: string; location: string; state: string; preset: string;
  sort: string; dir: 'asc' | 'desc'; page: number; size: number; cols: string[]; scan: boolean;
}

export function parseArticleQuery(search: Search): ArticleQuery {
  const sort = read(search, 'sort');
  const size = Number(read(search, 'size'));
  const page = Number(read(search, 'page'));
  const cols = read(search, 'cols').split(',').filter((key) => ARTICLE_COLUMNS.some((c) => c.key === key));
  return {
    q: clean(read(search, 'q')), category: clean(read(search, 'category')), status: ['held', 'on_demand', 'discontinued'].includes(read(search, 'status')) ? read(search, 'status') : '',
    supplier: clean(read(search, 'supplier')), location: clean(read(search, 'location')),
    state: ['op_voorraad', 'laag', 'nul', 'negatief', 'tekort'].includes(read(search, 'state')) ? read(search, 'state') : '',
    preset: ['dood', 'zonder_prijs', 'onderweg', 'gereserveerd'].includes(read(search, 'preset')) ? read(search, 'preset') : '',
    sort: SORTABLE.has(sort) ? sort : 'code', dir: read(search, 'dir') === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(page) && page >= 1 ? page : 1, size: PAGE_SIZES.includes(size) ? size : 50,
    cols, scan: read(search, 'scan') === '1',
  };
}

/** A value safe inside a PostgREST or=() list: double-quoted, no quotes, backslashes or wildcards of its own. */
const pgrstQuoted = (value: string) => `"${value.replace(/["\\*%]/g, '')}"`;

export async function listArticles(query: ArticleQuery, office: boolean, options: { all?: boolean; codes?: string[] } = {}) {
  const build = () => {
    let q = db().from('kfc_article_overview').select('*', { count: 'exact' });
    if (options.codes?.length) q = q.in('code', options.codes);
    if (query.q) {
      const term = query.q.replace(/["\\*%,()]/g, ' ').trim();
      if (term) {
        const like = pgrstQuoted(`*${term}*`);
        q = q.or(`code.ilike.${like},name.ilike.${like},sku.ilike.${like},supplier_ref.ilike.${like},category.ilike.${like},ean.cs.{${pgrstQuoted(term)}}`);
      }
    }
    if (query.category) q = q.eq('category', query.category);
    if (query.status) q = q.eq('status', query.status);
    if (query.supplier) q = q.or(`last_supplier.eq.${pgrstQuoted(query.supplier)},suppliers.cs.{${pgrstQuoted(query.supplier)}}`);
    if (query.location) q = q.filter(query.location.includes('/') ? 'locations' : 'warehouses', 'cs', `{${pgrstQuoted(query.location)}}`);
    if (query.state === 'tekort') q = q.in('stock_state', ['laag', 'nul', 'negatief']);
    else if (query.state) q = q.eq('stock_state', query.state);
    if (query.preset === 'dood') q = q.gt('physical', 0).eq('sold_90d', 0);
    if (query.preset === 'zonder_prijs') q = q.eq('unpriced', true);
    if (query.preset === 'onderweg') q = q.gt('incoming', 0);
    if (query.preset === 'gereserveerd') q = q.gt('reserved', 0);
    const sortKey = !office && ARTICLE_COLUMNS.find((c) => c.key === query.sort)?.money ? 'code' : query.sort;
    q = q.order(sortKey, { ascending: query.dir === 'asc', nullsFirst: false });
    if (sortKey !== 'code') q = q.order('code');
    return q;
  };
  let rows: Overview[]; let total: number;
  if (options.all) {
    rows = await fetchAll<Overview>((a, b) => build().range(a, b));
    total = rows.length;
  } else {
    const from = (query.page - 1) * query.size;
    const { data, count, error } = await build().range(from, from + query.size - 1);
    if (error) throw new Error(`Artikelen laden mislukt: ${error.message}`);
    rows = (data ?? []) as Overview[]; total = count ?? rows.length;
  }
  const money = new Set(ARTICLE_COLUMNS.filter((c) => c.money).map((c) => c.key));
  const out: ReportRow[] = rows.map((r) => {
    const row: ReportRow = {
      ...Object.fromEntries(ARTICLE_COLUMNS.map((c) => [c.key, (r as unknown as Record<string, ReportRow[string]>)[c.key] ?? null])),
      image: r.photo_version ? `/api/admin/voorraad-local?foto=${encodeURIComponent(r.code)}&v=${r.photo_version}` : null,
    };
    if (!office) for (const key of money) delete row[key];
    return row;
  });
  return { rows: out, total, columns: office ? ARTICLE_COLUMNS : ARTICLE_COLUMNS.filter((c) => !c.money) };
}

/** Totals for the list header and the owner dashboard, over the whole catalogue (one RPC). */
export async function articleTotals(office: boolean) {
  const { data, error } = await db().rpc('kfc_article_totals', {}, { get: true });
  if (error) throw new Error(`Artikeltotalen laden mislukt: ${error.message}`);
  const t = data as Record<string, number>;
  return {
    articles: Number(t.articles), inStock: Number(t.in_stock), low: Number(t.low), zero: Number(t.zero),
    negative: Number(t.negative), incoming: Number(t.incoming), value: office ? Number(t.value) : null, unpriced: Number(t.unpriced),
  };
}

/* ── article 360° ────────────────────────────────────────────────────── */

export async function articleDetail(code: string, office: boolean) {
  const client = db();
  const { data: article, error } = await client.from('kfc_article_overview').select('*').eq('code', code).maybeSingle();
  if (error) throw new Error(`Artikel laden mislukt: ${error.message}`);
  if (!article) return null;
  const today = amsterdamToday();
  const yearAgo = shiftDays(today, -364);
  type Level = { quantity: number; minimum: number; last_counted_at: string | null; updated_at: string;
    kfc_locations: { id: string; warehouse: string; shelf: string; box: string; kind: string; technician_id: string | null } | null };
  type PoLine = { id: string; quantity: number; received: number; unit_cost_cents: number | null;
    kfc_purchase_orders: { id: string; supplier: string; status: string; created_at: string; ordered_at: string | null; received_at: string | null; expected_on: string | null; invoice_ref: string | null } | null };
  type Reservation = { id: string; quantity: number; reserved: number; picked: number; state: string;
    kfc_shop_orders: { id: string; number: string; shop: string; status: string; fulfilment: string; created_at: string } | null };
  type Sale = { move_id: number; created_at: string; day: string; quantity: number; channel: string; shop: string | null; document: string | null;
    order_line_id: string | null; sales_invoice_id: string | null; revenue_cents: number; cost_cents: number; revenue_estimated: boolean; cost_estimated: boolean };
  const [levels, poLines, reservations, salesLines, vans, ledger] = await Promise.all([
    client.from('kfc_stock_levels').select('quantity, minimum, last_counted_at, updated_at, kfc_locations(id, warehouse, shelf, box, kind, technician_id)').eq('article_code', code),
    client.from('kfc_purchase_order_lines').select('id, quantity, received, unit_cost_cents, kfc_purchase_orders(id, supplier, status, created_at, ordered_at, received_at, expected_on, invoice_ref)')
      .eq('article_code', code).limit(500),
    client.from('kfc_shop_order_lines').select('id, quantity, reserved, picked, state, kfc_shop_orders(id, number, shop, status, fulfilment, created_at)')
      .eq('article_code', code).in('state', ['open', 'short', 'reserved', 'picked']).limit(200),
    fetchAll<Sale>((a, b) => client.from('kfc_sales_lines').select('move_id, created_at, day, quantity, channel, shop, document, order_line_id, sales_invoice_id, revenue_cents, cost_cents, revenue_estimated, cost_estimated')
      .eq('article_code', code).gte('day', yearAgo).order('created_at', { ascending: false }).range(a, b), 1000, 10000),
    vanNames(),
    ledgerMoves({ ...parseReportParams('ledger', {}), from: '2000-01-01', to: today, article: code, page: 1 }, 200),
  ]);
  const months = new Map<string, { units: number; revenue: number; profit: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.parse(today.slice(0, 8) + '15') - i * 30.44 * DAY);
    months.set(d.toISOString().slice(0, 7), { units: 0, revenue: 0, profit: 0 });
  }
  const channels = new Map<string, number>();
  for (const s of salesLines) {
    const m = months.get(String(s.day).slice(0, 7));
    if (m) { m.units += Number(s.quantity); m.revenue += Number(s.revenue_cents); m.profit += Number(s.revenue_cents) - Number(s.cost_cents); }
    channels.set(s.channel, (channels.get(s.channel) ?? 0) + Number(s.quantity));
  }
  const revenue = salesLines.reduce((t, s) => t + Number(s.revenue_cents), 0);
  const cost = salesLines.reduce((t, s) => t + Number(s.cost_cents), 0);
  const purchases = ((poLines.data ?? []) as unknown as PoLine[]).filter((l) => l.kfc_purchase_orders)
    .map((l) => ({ ...l, po: l.kfc_purchase_orders! }))
    .sort((a, b) => (b.po.ordered_at ?? b.po.created_at).localeCompare(a.po.ordered_at ?? a.po.created_at));
  const hideMoney = <T extends Record<string, unknown>>(row: T, keys: string[]): T => office ? row : Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k))) as T;
  return {
    article: hideMoney(article as Overview, ['purchase_price_cents', 'sale_price_cents', 'stock_value_cents', 'margin_pct', 'last_po_cost_cents']) as Overview,
    levels: ((levels.data ?? []) as unknown as Level[]).map((l) => ({
      ...l, location: locationLabel(l.kfc_locations?.warehouse ?? null, l.kfc_locations?.shelf ?? null, l.kfc_locations?.box ?? null, l.kfc_locations?.kind ?? null,
        l.kfc_locations?.technician_id ? vans.get(l.kfc_locations.technician_id) : undefined),
      warehouse: l.kfc_locations?.warehouse ?? '', kind: l.kfc_locations?.kind ?? 'shelf',
    })).sort((a, b) => b.quantity - a.quantity),
    purchases: purchases.map((l) => hideMoney({ id: l.id, poId: l.po.id, supplier: l.po.supplier, status: l.po.status, date: l.po.ordered_at ?? l.po.created_at,
      receivedAt: l.po.received_at, expected: l.po.expected_on, invoice: l.po.invoice_ref, quantity: l.quantity, received: l.received, unit_cost_cents: l.unit_cost_cents }, ['unit_cost_cents'])),
    reservations: ((reservations.data ?? []) as unknown as Reservation[]).filter((r) => r.kfc_shop_orders).map((r) => ({
      id: r.id, orderId: r.kfc_shop_orders!.id, number: r.kfc_shop_orders!.number, shop: r.kfc_shop_orders!.shop, status: r.kfc_shop_orders!.status,
      fulfilment: r.kfc_shop_orders!.fulfilment, created_at: r.kfc_shop_orders!.created_at, quantity: r.quantity, reserved: r.reserved, picked: r.picked, state: r.state,
    })),
    sales: salesLines.slice(0, 100).map((s) => hideMoney({ ...s, quantity: Number(s.quantity), revenue_cents: Number(s.revenue_cents), cost_cents: Number(s.cost_cents) }, ['revenue_cents', 'cost_cents'])),
    salesTotals: { units: salesLines.reduce((t, s) => t + Number(s.quantity), 0), revenue: office ? revenue : null, profit: office ? revenue - cost : null,
      margin: office && revenue ? Math.round((revenue - cost) / revenue * 1000) / 10 : null, lines: salesLines.length },
    months: [...months].map(([month, v]) => ({ month, units: v.units, revenue: office ? v.revenue : 0, profit: office ? v.profit : 0 })),
    channels: [...channels].map(([channel, units]) => ({ channel: labelOf(CHANNELS, channel), units })),
    ledger: { opening: Number(ledger.opening), count: Number(ledger.count), rows: ledger.rows.map((m) => hideMoney({
      id: m.id, created_at: m.created_at, reason: m.reason, delta: m.delta, balance: Number(m.balance), quantity_after: m.quantity_after,
      location: locationLabel(m.warehouse, m.shelf, m.box, null), source: sourceOf(m), value_cents: m.value_cents,
      order_line_id: m.order_line_id, sales_invoice_id: m.sales_invoice_id,
    }, ['value_cents'])) },
  };
}
export type ArticleDetail = NonNullable<Awaited<ReturnType<typeof articleDetail>>>;
