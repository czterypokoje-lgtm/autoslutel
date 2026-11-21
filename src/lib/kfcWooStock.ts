import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { CRM_READONLY } from '@/lib/readonly';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { IS_KEYFORCARS } from '@/config/install';
import { WOO_SHOPS, wooConfigured, wooCredentials, type WooShop } from '@/lib/kfcWoo';

/*
 * Stock push: CRM ledger → WooCommerce (migration 0132).
 *
 * Every stock move, reservation and job reservation queues its article in
 * kfc_woo_stock_outbox (database triggers, so the POS, receipts, counts,
 * returns and shipping need no code of their own). The worker here claims due
 * articles, works out what each shop should show (kfc_webshop_position.available:
 * on the shelves minus reservations minus van stock, never below zero), and sends
 * only the changed numbers through `products/batch` and
 * `products/<parent>/variations/batch`, 100 per request, with a pause between
 * requests and a stop on HTTP 429/503 (the article backs off and retries).
 *
 * Per-shop switch, default OFF: WOO_<SHOP>_STOCK_PUSH
 *   unset / off   nothing is sent and nothing is logged for that shop
 *   dry           the worker logs what it would send (kfc_woo_sync_runs), sends nothing
 *   on            live
 * CRM_READONLY or CRM_PREVIEW turns "on" into "dry". Only KeyForCars has shops.
 */

export type PushMode = 'off' | 'dry' | 'on';
export const SHOPS = Object.keys(WOO_SHOPS) as WooShop[];

export function pushMode(shop: WooShop): PushMode {
  if (!IS_KEYFORCARS || !wooConfigured(shop)) return 'off';
  const raw = (process.env[`WOO_${WOO_SHOPS[shop]}_STOCK_PUSH`] ?? '').trim().toLowerCase();
  const mode: PushMode = raw === 'on' || raw === '1' || raw === 'true' ? 'on' : raw === 'dry' ? 'dry' : 'off';
  return mode === 'on' && (CRM_READONLY || CRM_PREVIEW) ? 'dry' : mode;
}

const BATCH = 100; // WooCommerce batch limit
const INTERVAL_MS = Math.max(200, Number(process.env.WOO_STOCK_PUSH_INTERVAL_MS) || 1000);
const MAX_REQUESTS = Math.max(1, Number(process.env.WOO_STOCK_PUSH_MAX_REQUESTS) || 30); // per shop per batch

const db = () => createSupabaseAdminClient();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const THROTTLED = 'remt af';

class WooHttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
  get throttled() { return this.status === 429 || this.status === 503; }
}

/** One REST call with a timeout. Only reached when the shop's mode allows it. */
async function wooCall<T>(shop: WooShop, path: string, init: RequestInit = {}): Promise<{ body: T; headers: Headers }> {
  const { key, secret } = wooCredentials(shop);
  if (!key || !secret) throw new Error(`WooCommerce-sleutels voor ${shop} ontbreken.`);
  const response = await fetch(`https://${shop}/wp-json/wc/v3${path}`, {
    ...init,
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    const text = (await response.text().catch(() => '')).slice(0, 200);
    throw new WooHttpError(response.status, `${shop} ${path.split('?')[0]}: HTTP ${response.status} ${text}`.trim());
  }
  return { body: (await response.json()) as T, headers: response.headers };
}

// ---------------------------------------------------------------------------
// Mapping: shop products ↔ articles, by SKU.
// ---------------------------------------------------------------------------

export type MappingStatus = 'ok' | 'unmapped' | 'ambiguous' | 'no_stock';
export interface MappingRow {
  shop: WooShop; woo_product_id: number; woo_variation_id: number; sku: string; name: string; woo_type: string;
  manage_stock: boolean; shop_quantity: number | null; article_code: string | null; manual: boolean; status: MappingStatus;
  candidates: string[]; pushed_quantity: number | null; pushed_at: string | null; push_error: string | null; seen_at: string;
}

interface WooProduct { id: number; sku: string; name: string; type: string; manage_stock: boolean | 'parent'; stock_quantity: number | null; variations?: number[] }
interface WooVariation { id: number; sku: string; manage_stock: boolean | 'parent'; stock_quantity: number | null; attributes?: { option: string }[] }
type Listed = Pick<MappingRow, 'shop' | 'woo_product_id' | 'woo_variation_id' | 'sku' | 'name' | 'woo_type' | 'manage_stock' | 'shop_quantity'>;

const skuKey = (sku: string | null | undefined) => (sku ?? '').trim().toUpperCase();
const rowKey = (row: { woo_product_id: number; woo_variation_id: number }) => `${row.woo_product_id}:${row.woo_variation_id}`;

async function articleSkus(): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  for (let from = 0; from < 100_000; from += 1000) {
    const { data, error } = await db().from('kfc_articles').select('code, sku').neq('sku', '').order('code').range(from, from + 999);
    if (error) throw new Error(`Artikelen lezen mislukt: ${error.message}`);
    for (const row of data ?? []) {
      const key = skuKey(row.sku);
      if (key) out.set(key, [...(out.get(key) ?? []), row.code]);
    }
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function listShopProducts(shop: WooShop): Promise<Listed[]> {
  const listed: Listed[] = [];
  for (let page = 1; page <= 200; page++) {
    const params = new URLSearchParams({ per_page: '100', page: String(page), status: 'any', _fields: 'id,sku,name,type,manage_stock,stock_quantity,variations' });
    const { body, headers } = await wooCall<WooProduct[]>(shop, `/products?${params}`);
    for (const product of body) {
      if (product.type === 'variable') {
        for (let vpage = 1; vpage <= 20 && product.variations?.length; vpage++) {
          await sleep(INTERVAL_MS);
          const vparams = new URLSearchParams({ per_page: '100', page: String(vpage), _fields: 'id,sku,manage_stock,stock_quantity,attributes' });
          const { body: variations, headers: vheaders } = await wooCall<WooVariation[]>(shop, `/products/${product.id}/variations?${vparams}`);
          for (const v of variations) {
            listed.push({
              shop, woo_product_id: product.id, woo_variation_id: v.id, sku: (v.sku ?? '').trim(),
              name: [product.name, ...(v.attributes ?? []).map((a) => a.option)].join(' · ').slice(0, 200), woo_type: 'variation',
              manage_stock: v.manage_stock === true, shop_quantity: v.stock_quantity ?? null,
            });
          }
          if (vpage >= Number(vheaders.get('x-wp-totalpages') ?? '1')) break;
        }
        continue;
      }
      listed.push({
        shop, woo_product_id: product.id, woo_variation_id: 0, sku: (product.sku ?? '').trim(), name: (product.name ?? '').slice(0, 200),
        woo_type: product.type, manage_stock: product.manage_stock === true, shop_quantity: product.stock_quantity ?? null,
      });
    }
    if (page >= Number(headers.get('x-wp-totalpages') ?? '1')) break;
    await sleep(INTERVAL_MS);
  }
  return listed;
}

/**
 * Read every product and variation of one shop (GET only) and rebuild its
 * mapping rows. Manual links survive; products gone from the shop are removed
 * (only after a complete read). Queues every mapped article for a check.
 */
export async function refreshMapping(shop: WooShop): Promise<Record<MappingStatus | 'products', number>> {
  if (!IS_KEYFORCARS) throw new Error('Alleen voor KeyForCars.');
  if (!wooConfigured(shop)) throw new Error(`Geen API-sleutel voor ${shop} ingesteld.`);
  const started = new Date().toISOString();
  const run = await db().from('kfc_woo_sync_runs').insert({ shop, kind: 'mapping' }).select('id').single();
  try {
    const [listed, bySku, existing] = await Promise.all([listShopProducts(shop), articleSkus(), readMapping(shop)]);
    const prior = new Map(existing.map((row) => [rowKey(row), row]));
    const inShop = new Map<string, number>();
    for (const row of listed) if (skuKey(row.sku)) inShop.set(skuKey(row.sku), (inShop.get(skuKey(row.sku)) ?? 0) + 1);

    const counts = { products: listed.length, ok: 0, unmapped: 0, ambiguous: 0, no_stock: 0 };
    const rows = listed.map((row) => {
      const before = prior.get(rowKey(row));
      const manual = !!(before?.manual && before.article_code);
      const matches = bySku.get(skuKey(row.sku)) ?? [];
      let article: string | null = null; let status: MappingStatus; let candidates: string[] = [];
      if (manual) { article = before!.article_code; status = row.manage_stock ? 'ok' : 'no_stock'; }
      else if (!skuKey(row.sku) || !matches.length) status = 'unmapped';
      else if (matches.length > 1 || (inShop.get(skuKey(row.sku)) ?? 0) > 1) { status = 'ambiguous'; candidates = matches.slice(0, 10); }
      else { article = matches[0]; status = row.manage_stock ? 'ok' : 'no_stock'; }
      counts[status]++;
      const keep = before && before.article_code === article;
      return {
        ...row, article_code: article, manual, status, candidates, seen_at: started,
        pushed_quantity: keep ? before.pushed_quantity : null, pushed_at: keep ? before.pushed_at : null, push_error: keep ? before.push_error : null,
      };
    });
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db().from('kfc_woo_products').upsert(rows.slice(i, i + 500), { onConflict: 'shop,woo_product_id,woo_variation_id' });
      if (error) throw new Error(`Koppelingen opslaan mislukt: ${error.message}`);
    }
    await db().from('kfc_woo_products').delete().eq('shop', shop).lt('seen_at', started);
    const mapped = [...new Set(rows.filter((row) => row.status === 'ok').map((row) => row.article_code!))];
    for (let i = 0; i < mapped.length; i += 1000) await db().rpc('kfc_woo_enqueue', { p_articles: mapped.slice(i, i + 1000) });
    if (run.data) await db().from('kfc_woo_sync_runs').update({ finished_at: new Date().toISOString(), articles: counts.products, updated: counts.ok, detail: counts }).eq('id', run.data.id);
    return counts;
  } catch (cause) {
    if (run.data) await db().from('kfc_woo_sync_runs').update({ finished_at: new Date().toISOString(), error: (cause as Error).message.slice(0, 500) }).eq('id', run.data.id);
    throw cause;
  }
}

export async function readMapping(shop?: WooShop, status?: MappingStatus): Promise<MappingRow[]> {
  const out: MappingRow[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    let query = db().from('kfc_woo_products').select('*').order('shop').order('sku').order('woo_product_id').order('woo_variation_id').range(from, from + 999);
    if (shop) query = query.eq('shop', shop);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new Error(`Koppelingen lezen mislukt: ${error.message}`);
    out.push(...((data ?? []) as MappingRow[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Link (or unlink with null) one shop product by hand; queues the old and the new article. */
export async function setMapping(shop: WooShop, productId: number, variationId: number, article: string | null): Promise<void> {
  const { data: row, error } = await db().from('kfc_woo_products').select('article_code, manage_stock')
    .eq('shop', shop).eq('woo_product_id', productId).eq('woo_variation_id', variationId).maybeSingle();
  if (error || !row) throw new Error('Webshopproduct niet gevonden. Ververs eerst de koppelingen.');
  if (article) {
    const { data: found } = await db().from('kfc_articles').select('code').eq('code', article).maybeSingle();
    if (!found) throw new Error(`Onbekend artikel ${article}.`);
  }
  const update = article
    ? { article_code: article, manual: true, status: row.manage_stock ? 'ok' : 'no_stock', candidates: [], pushed_quantity: null, pushed_at: null, push_error: null }
    : { article_code: null, manual: false, status: 'unmapped', pushed_quantity: null, pushed_at: null, push_error: null };
  const result = await db().from('kfc_woo_products').update(update).eq('shop', shop).eq('woo_product_id', productId).eq('woo_variation_id', variationId);
  if (result.error) throw new Error(`Koppeling opslaan mislukt: ${result.error.message}`);
  const codes = [row.article_code, article].filter((code): code is string => !!code);
  if (codes.length) await db().rpc('kfc_woo_enqueue', { p_articles: codes });
}

// ---------------------------------------------------------------------------
// The worker.
// ---------------------------------------------------------------------------

type Target = { row: MappingRow; quantity: number };
export interface ShopResult {
  shop: WooShop; mode: PushMode; articles: number; updated: number; skipped: number; failed: number; error: string | null;
  preview: { sku: string; article: string; from: number | null; to: number }[];
}

async function sellable(codes: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (let i = 0; i < codes.length; i += 500) {
    const { data, error } = await db().from('kfc_webshop_position').select('article_code, available').in('article_code', codes.slice(i, i + 500));
    if (error) throw new Error(`Voorraad lezen mislukt: ${error.message}`);
    for (const row of data ?? []) out.set(row.article_code, Math.max(0, Number(row.available) || 0));
  }
  return out;
}

async function mappedRows(codes: string[], shops: WooShop[]): Promise<MappingRow[]> {
  const out: MappingRow[] = [];
  for (let i = 0; i < codes.length; i += 500) {
    const { data, error } = await db().from('kfc_woo_products').select('*').in('article_code', codes.slice(i, i + 500)).in('shop', shops).eq('status', 'ok');
    if (error) throw new Error(`Koppelingen lezen mislukt: ${error.message}`);
    out.push(...((data ?? []) as MappingRow[]));
  }
  return out;
}

async function markRow(shop: WooShop, row: MappingRow, values: Partial<MappingRow>) {
  await db().from('kfc_woo_products').update(values)
    .eq('shop', shop).eq('woo_product_id', row.woo_product_id).eq('woo_variation_id', row.woo_variation_id);
}

/**
 * One shop's targets. Returns per-article errors (absent = done for this shop).
 * Dry: compute and report only. Unchanged numbers are skipped unless forced.
 * Stops the shop on throttling, the request cap or the deadline; what is left
 * gets an error, so the outbox retries it with backoff.
 */
async function pushShop(shop: WooShop, mode: PushMode, targets: Target[], force: boolean, deadline: number) {
  const result: ShopResult = { shop, mode, articles: new Set(targets.map((t) => t.row.article_code)).size, updated: 0, skipped: 0, failed: 0, error: null, preview: [] };
  const errors = new Map<string, string>();
  const changed = targets.filter((t) => force || t.row.push_error || t.row.pushed_quantity !== t.quantity);
  result.skipped = targets.length - changed.length;
  if (mode === 'dry') {
    result.preview = changed.slice(0, 50).map((t) => ({ sku: t.row.sku, article: t.row.article_code!, from: t.row.pushed_quantity ?? t.row.shop_quantity, to: t.quantity }));
    result.updated = changed.length;
    return { result, errors };
  }

  // Simple products share one endpoint; variations are batched per parent.
  const groups = new Map<string, Target[]>();
  for (const t of changed) {
    const path = t.row.woo_variation_id ? `/products/${t.row.woo_product_id}/variations/batch` : '/products/batch';
    groups.set(path, [...(groups.get(path) ?? []), t]);
  }
  let requests = 0; let stopped: string | null = null;
  for (const [path, list] of groups) {
    for (let i = 0; i < list.length; i += BATCH) {
      const chunk = list.slice(i, i + BATCH);
      if (stopped || requests >= MAX_REQUESTS || Date.now() > deadline) {
        for (const t of chunk) errors.set(t.row.article_code!, stopped ?? 'Uitgesteld naar de volgende run.');
        continue;
      }
      if (requests++) await sleep(INTERVAL_MS);
      const now = new Date().toISOString();
      try {
        const payload = { update: chunk.map((t) => ({ id: t.row.woo_variation_id || t.row.woo_product_id, stock_quantity: t.quantity })) };
        const { body } = await wooCall<{ update?: { id: number; stock_quantity?: number | null; error?: { message?: string } }[] }>(shop, path, { method: 'POST', body: JSON.stringify(payload) });
        const answered = new Map((body.update ?? []).map((item) => [item.id, item]));
        for (const t of chunk) {
          const item = answered.get(t.row.woo_variation_id || t.row.woo_product_id);
          const message = !item ? 'Geen antwoord voor dit product.' : item.error ? (item.error.message ?? 'Fout van WooCommerce.') : null;
          if (message) {
            result.failed++;
            errors.set(t.row.article_code!, `${shop}: ${message}`);
            await markRow(shop, t.row, { push_error: message.slice(0, 300) });
          } else {
            result.updated++;
            await markRow(shop, t.row, { pushed_quantity: t.quantity, pushed_at: now, push_error: null, shop_quantity: item?.stock_quantity ?? t.quantity });
          }
        }
      } catch (cause) {
        const error = cause as Error;
        const message = error.message.slice(0, 300);
        if (error instanceof WooHttpError && error.throttled) stopped = `${shop} ${THROTTLED} (HTTP ${error.status}); later opnieuw.`;
        result.failed += chunk.length;
        result.error = message;
        for (const t of chunk) {
          errors.set(t.row.article_code!, `${shop}: ${message}`);
          await markRow(shop, t.row, { push_error: message });
        }
      }
    }
  }
  if (stopped) result.error = stopped;
  return { result, errors };
}

/** Compute and push a set of articles to every shop whose mode is not off. */
async function pushArticles(codes: string[], options: { force?: boolean; dryRun?: boolean; deadline: number }) {
  const shops = SHOPS.map((shop) => ({ shop, mode: pushMode(shop) }))
    .filter((s) => s.mode !== 'off')
    .map((s) => ({ ...s, mode: options.dryRun ? ('dry' as const) : s.mode }));
  const errors = new Map<string, string>();
  const results: ShopResult[] = [];
  if (!codes.length || !shops.length) return { results, errors };
  const [rows, quantities] = await Promise.all([mappedRows(codes, shops.map((s) => s.shop)), sellable(codes)]);
  for (const { shop, mode } of shops) {
    const targets = rows.filter((row) => row.shop === shop).map((row) => ({ row, quantity: quantities.get(row.article_code!) ?? 0 }));
    if (!targets.length) continue;
    const { result, errors: shopErrors } = await pushShop(shop, mode, targets, !!options.force, options.deadline);
    results.push(result);
    for (const [article, message] of shopErrors) errors.set(article, errors.has(article) ? `${errors.get(article)} · ${message}` : message);
  }
  return { results, errors };
}

async function logRuns(results: ShopResult[], started: string) {
  const rows = results.filter((r) => r.articles > 0).map((r) => ({
    shop: r.shop, kind: r.mode === 'dry' ? 'dry_run' : 'push', started_at: started, finished_at: new Date().toISOString(),
    articles: r.articles, updated: r.updated, failed: r.failed, error: r.error,
    detail: { skipped: r.skipped, ...(r.preview.length ? { preview: r.preview } : {}) },
  }));
  if (rows.length) await db().from('kfc_woo_sync_runs').insert(rows);
}

/**
 * Drain the outbox until it is empty or the time budget is spent. Safe to run
 * in parallel (claims skip locked rows). Leaves the queue untouched when every
 * shop is off, so switching a shop on later still finds the backlog. Articles
 * whose only shops are off are settled; "Alles opnieuw" re-queues them.
 */
export async function runStockPush(options: { budgetMs?: number; limit?: number } = {}) {
  if (!SHOPS.some((shop) => pushMode(shop) !== 'off')) {
    return { claimed: 0, results: [] as ShopResult[], skipped: 'Alle webshops staan uit (WOO_<SHOP>_STOCK_PUSH).' };
  }
  const limit = options.limit ?? 200;
  const deadline = Date.now() + (options.budgetMs ?? 45_000);
  const all: ShopResult[] = [];
  let claimed = 0;
  while (Date.now() < deadline - 5_000) {
    const started = new Date().toISOString();
    const { data, error } = await db().rpc('kfc_woo_claim', { p_limit: limit });
    if (error) throw new Error(`Wachtrij lezen mislukt: ${error.message}`);
    const batch = (data ?? []) as { article_code: string; queued_at: string; attempts: number }[];
    if (!batch.length) break;
    claimed += batch.length;
    let outcome: Awaited<ReturnType<typeof pushArticles>>;
    try {
      outcome = await pushArticles(batch.map((row) => row.article_code), { deadline });
    } catch (cause) {
      for (const row of batch) await db().rpc('kfc_woo_settle', { p_article: row.article_code, p_queued_at: row.queued_at, p_error: (cause as Error).message });
      throw cause;
    }
    for (const row of batch) {
      await db().rpc('kfc_woo_settle', { p_article: row.article_code, p_queued_at: row.queued_at, p_error: outcome.errors.get(row.article_code) ?? null });
    }
    await logRuns(outcome.results, started);
    all.push(...outcome.results);
    if (batch.length < limit || outcome.results.some((r) => r.error?.includes(THROTTLED))) break;
  }
  return { claimed, results: all, skipped: null };
}

/** "Nu pushen" for one article from the status screen: forced, outside the queue order. */
export async function pushNow(article: string) {
  const { data: queued } = await db().from('kfc_woo_stock_outbox').select('queued_at').eq('article_code', article).maybeSingle();
  const started = new Date().toISOString();
  const outcome = await pushArticles([article], { force: true, deadline: Date.now() + 30_000 });
  await logRuns(outcome.results, started);
  if (queued) await db().rpc('kfc_woo_settle', { p_article: article, p_queued_at: queued.queued_at, p_error: outcome.errors.get(article) ?? null });
  return { results: outcome.results, error: outcome.errors.get(article) ?? null };
}

/** Dry run over what is queued now: nothing is sent, nothing is consumed. */
export async function previewQueue(limit = 200) {
  const { data, error } = await db().from('kfc_woo_stock_outbox').select('article_code').order('next_attempt_at').limit(limit);
  if (error) throw new Error(`Wachtrij lezen mislukt: ${error.message}`);
  const started = new Date().toISOString();
  const outcome = await pushArticles((data ?? []).map((row) => row.article_code), { dryRun: true, deadline: Date.now() + 30_000 });
  await logRuns(outcome.results, started);
  return outcome.results;
}

/**
 * Full resync: forget the last-pushed numbers (so nothing is skipped as unchanged)
 * and queue every mapped article. Used after switching a shop on, or after numbers
 * were edited by hand in WooCommerce.
 */
export async function enqueueAll(): Promise<number> {
  const reset = await db().from('kfc_woo_products').update({ pushed_quantity: null }).eq('status', 'ok');
  if (reset.error) throw new Error(`Koppelingen bijwerken mislukt: ${reset.error.message}`);
  const rows = await readMapping(undefined, 'ok');
  const codes = [...new Set(rows.map((row) => row.article_code!))];
  let queued = 0;
  for (let i = 0; i < codes.length; i += 1000) {
    const { data, error } = await db().rpc('kfc_woo_enqueue', { p_articles: codes.slice(i, i + 1000) });
    if (error) throw new Error(`In wachtrij zetten mislukt: ${error.message}`);
    queued += Number(data) || 0;
  }
  return queued;
}

// ---------------------------------------------------------------------------
// Status screen.
// ---------------------------------------------------------------------------

export interface SyncRun { id: number; shop: string; kind: 'push' | 'dry_run' | 'mapping'; started_at: string; finished_at: string | null; articles: number; updated: number; failed: number; error: string | null; detail: Record<string, unknown> | null }
export interface ShopStatus { shop: WooShop; configured: boolean; mode: PushMode; lastPush: SyncRun | null; lastMapping: SyncRun | null; counts: Record<MappingStatus, number>; errors: number }

export async function syncStatus() {
  const client = db();
  const count = async (status: MappingStatus | 'error', shop: WooShop) => {
    let query = client.from('kfc_woo_products').select('woo_product_id', { count: 'exact', head: true }).eq('shop', shop);
    query = status === 'error' ? query.not('push_error', 'is', null) : query.eq('status', status);
    return (await query).count ?? 0;
  };
  const [queue, due, retrying, runs, productErrors, shopCounts] = await Promise.all([
    client.from('kfc_woo_stock_outbox').select('article_code', { count: 'exact', head: true }),
    client.from('kfc_woo_stock_outbox').select('article_code', { count: 'exact', head: true }).lte('next_attempt_at', new Date().toISOString()),
    client.from('kfc_woo_stock_outbox').select('article_code, attempts, last_error, next_attempt_at').gt('attempts', 0).order('attempts', { ascending: false }).limit(25),
    client.from('kfc_woo_sync_runs').select('*').order('started_at', { ascending: false }).limit(80),
    client.from('kfc_woo_products').select('shop, sku, name, article_code, push_error, pushed_at').not('push_error', 'is', null).order('shop').limit(50),
    Promise.all(SHOPS.map(async (shop) => {
      const [ok, unmapped, ambiguous, no_stock, error] = await Promise.all((['ok', 'unmapped', 'ambiguous', 'no_stock', 'error'] as const).map((s) => count(s, shop)));
      return { ok, unmapped, ambiguous, no_stock, error };
    })),
  ]);
  const runRows = (runs.data ?? []) as SyncRun[];
  const shops: ShopStatus[] = SHOPS.map((shop, index) => {
    const { error, ...counts } = shopCounts[index];
    return {
      shop, configured: wooConfigured(shop), mode: pushMode(shop), counts, errors: error,
      lastPush: runRows.find((run) => run.shop === shop && run.kind !== 'mapping') ?? null,
      lastMapping: runRows.find((run) => run.shop === shop && run.kind === 'mapping') ?? null,
    };
  });
  return {
    queue: queue.count ?? 0, due: due.count ?? 0,
    retrying: (retrying.data ?? []) as { article_code: string; attempts: number; last_error: string | null; next_attempt_at: string }[],
    runs: runRows.slice(0, 30), shops,
    productErrors: (productErrors.data ?? []) as { shop: string; sku: string; name: string; article_code: string | null; push_error: string; pushed_at: string | null }[],
  };
}
