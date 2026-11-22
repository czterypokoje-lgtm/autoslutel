import { WAREHOUSE } from '@/config/install';
import { requireWarehouseUserApi, seesPrices } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ARTICLE_CODE } from '@/lib/stockCatalog';
import { listArticles, loadReport, parseArticleQuery, parseReportParams, clean } from '@/lib/kfcInventoryReports';
import { reportMeta, sheetValue, toCsv, amsterdamToday, type ReportColumn, type ReportRow } from '@/lib/kfcReportColumns';

export const dynamic = 'force-dynamic';
/** xlsx is a Node library; it cannot run on the edge runtime. */
export const runtime = 'nodejs';

/*
 * Downloads and bulk edits for the inventory analysis screens.
 *
 * GET  ?export=<report id>|articles&format=csv|xlsx&<the screen's own filters>
 *      The file is built by the same loader the screen renders from
 *      (src/lib/kfcInventoryReports.ts), so it cannot disagree with the page.
 *      Paged reports (ledger) and the article list export every matching row.
 *      `cols` limits and orders the columns like the screen's column picker;
 *      `codes` limits the article export to a bulk selection.
 * POST { action: 'status' | 'category', codes: string[], value: string }
 *      Office only: set the status or category of selected articles.
 *
 * Prices are removed for warehouse and picker roles exactly as on screen.
 */

const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

async function file(name: string, columns: ReportColumn[], rows: ReportRow[], format: string, english: boolean) {
  const stamp = amsterdamToday();
  if (format === 'xlsx') {
    const { utils, write } = await import('xlsx');
    const sheet = utils.aoa_to_sheet([
      columns.map((c) => (english ? c.en : c.nl)),
      ...rows.map((row) => columns.map((c) => sheetValue(row[c.key], c.type))),
    ]);
    sheet['!cols'] = columns.map((c) => ({ wch: c.type === 'text' ? 32 : c.type === 'list' ? 28 : 14 }));
    const book = utils.book_new();
    utils.book_append_sheet(book, sheet, name.slice(0, 31));
    const body = write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return new Response(new Uint8Array(body), { headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${name}-${stamp}.xlsx"`, 'Cache-Control': 'no-store',
    } });
  }
  return new Response(toCsv(columns, rows, english), { headers: {
    'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}-${stamp}.csv"`, 'Cache-Control': 'no-store',
  } });
}

function pickColumns(columns: ReportColumn[], cols: string | null) {
  const wanted = (cols ?? '').split(',').filter(Boolean);
  if (!wanted.length) return columns;
  const picked = wanted.map((key) => columns.find((c) => c.key === key)).filter((c): c is ReportColumn => !!c);
  return picked.length ? picked : columns;
}

export async function GET(request: Request) {
  if (!WAREHOUSE) return reply({ error: 'Niet beschikbaar' }, 404);
  const { user, response } = await requireWarehouseUserApi();
  if (response) return response;
  const office = seesPrices(user);
  const url = new URL(request.url);
  const search = url.searchParams;
  const format = search.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const english = search.get('lang') === 'en';
  const target = search.get('export') ?? '';
  try {
    if (target === 'articles') {
      const query = parseArticleQuery(search);
      const codes = (search.get('codes') ?? '').split(',').map((c) => c.trim().toUpperCase()).filter((c) => ARTICLE_CODE.test(c)).slice(0, 2000);
      const { rows, columns } = await listArticles(query, office, { all: true, codes: codes.length ? codes : undefined });
      return file('artikelen', pickColumns(columns, search.get('cols')), rows, format, english);
    }
    const meta = reportMeta(target);
    if (!meta) return reply({ error: 'Onbekend rapport' }, 400);
    if (meta.money && !office) return reply({ error: 'Geen toegang' }, 403);
    const data = await loadReport(meta.id, parseReportParams(meta.id, search), office, true);
    return file(meta.id, pickColumns(data.columns, search.get('cols')), data.rows, format, english);
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Export mislukt' }, 500);
  }
}

const STATUSES = ['held', 'on_demand', 'discontinued'];

export async function POST(request: Request) {
  if (!WAREHOUSE) return reply({ error: 'Niet beschikbaar' }, 404);
  const { user, response } = await requireWarehouseUserApi();
  if (response) return response;
  if (!seesPrices(user)) return reply({ error: 'Alleen kantoor kan artikelen in bulk wijzigen.' }, 403);
  let body: { action?: unknown; codes?: unknown; value?: unknown };
  try { body = await request.json(); } catch { return reply({ error: 'Ongeldig verzoek' }, 400); }
  const codes = Array.isArray(body.codes) ? [...new Set(body.codes.filter((c): c is string => typeof c === 'string' && ARTICLE_CODE.test(c)))] : [];
  if (!codes.length || codes.length > 1000) return reply({ error: 'Kies 1 tot 1000 artikelen.' }, 400);
  const value = typeof body.value === 'string' ? clean(body.value) : '';
  let patch: Record<string, string>;
  if (body.action === 'status' && STATUSES.includes(value)) patch = { status: value };
  else if (body.action === 'category' && value) patch = { category: value };
  else return reply({ error: 'Kies een geldige actie en waarde.' }, 400);
  const { data, error } = await createSupabaseAdminClient().from('kfc_articles')
    .update({ ...patch, updated_at: new Date().toISOString() }).in('code', codes).select('code');
  if (error) return reply({ error: `Opslaan mislukt: ${error.message}` }, 500);
  return reply({ updated: (data ?? []).length });
}
