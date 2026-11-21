import { IS_KEYFORCARS, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { canBookReturns, requireWarehouseUserApi, seesPrices } from '@/lib/crmSession';
import { returnShopLine, StockError } from '@/lib/kfcInventory';
import { clearSampleData, getShopOrder, loadSampleData, markPicked, shipOrder } from '@/lib/kfcOrders';
import { importPage, isWooShop, wooConfigured } from '@/lib/kfcWoo';
import { importOwnOrders } from '@/lib/kfcOwnShop';
import { createLabel, setTracking } from '@/lib/kfcShipping';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 300;

const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

/**
 * Shop orders: import one page (office), pick a line and ship an order
 * (warehouse). The backfill runs page by page from the browser, so a
 * 12-month history never hits a function time limit. Pick, label, tracking
 * and ship reply with the fresh order, so the screens patch one card instead
 * of reloading the page.
 */
export async function POST(request: Request) {
  if (!WAREHOUSE || CRM_PREVIEW) return reply({}, 404);
  const { user, response } = await requireWarehouseUserApi();
  if (response) return response;
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return reply({ error: 'Ongeldige invoer.' }, 400);
  try {
    if (input.action === 'import') {
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor importeert.' }, 403);
      const { shop, page, days } = input;
      if (typeof shop !== 'string' || !isWooShop(shop)) return reply({ error: 'Onbekende webshop.' }, 400);
      if (!wooConfigured(shop)) return reply({ error: `Geen API-sleutel voor ${shop} ingesteld.` }, 409);
      const pageNo = Number.isInteger(page) && page > 0 ? page : 1;
      const since = Number.isInteger(days) && days > 0 ? new Date(Date.now() - Math.min(days, 730) * 86_400_000).toISOString().replace(/\.\d{3}Z$/, '') : undefined;
      const db = createSupabaseAdminClient();
      const run = pageNo === 1 ? await db.from('kfc_import_runs').insert({ shop, kind: 'backfill' }).select('id').single() : null;
      const result = await importPage(shop, pageNo, { after: since });
      if (run?.data) await db.from('kfc_import_runs').update({ finished_at: new Date().toISOString(), orders: result.fetched }).eq('id', run.data.id);
      return reply(result);
    }
    if (input.action === 'import-own') {
      // Autosleutel24 only: its webshop writes into public.orders in this same database.
      if (IS_KEYFORCARS) return reply({ error: 'Onbekende actie.' }, 400);
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor importeert.' }, 403);
      const days = Number.isInteger(input.days) && input.days > 0 ? Math.min(input.days, 1825) : 0;
      const since = days ? new Date(Date.now() - days * 86_400_000).toISOString() : undefined;
      return reply(await importOwnOrders({ since }));
    }
    if (input.action === 'sample-load') {
      if (!IS_KEYFORCARS) return reply({ error: 'Onbekende actie.' }, 400);
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor.' }, 403);
      return reply(await loadSampleData(user));
    }
    if (input.action === 'sample-clear') {
      if (!IS_KEYFORCARS) return reply({ error: 'Onbekende actie.' }, 400);
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor.' }, 403);
      await clearSampleData();
      return reply({ ok: true });
    }
    if (input.action === 'return') {
      if (!canBookReturns(user)) return reply({ error: 'Geen toegang' }, 403);
      const { line, location, key, quantity } = input;
      if (![line, location, key].every((value) => typeof value === 'string' && uuid.test(value)) ||
          !Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) {
        return reply({ error: 'Ongeldige invoer.' }, 400);
      }
      await returnShopLine(line, quantity, location, key, user);
      return reply({ ok: true });
    }
    if (input.action === 'pick') {
      if (typeof input.line !== 'string' || !uuid.test(input.line)) return reply({ error: 'Ongeldige regel.' }, 400);
      const orderId = await markPicked(input.line, input.picked !== false);
      return reply({ ok: true, order: await getShopOrder(orderId) });
    }
    if (input.action === 'label') {
      if (typeof input.id !== 'string' || !uuid.test(input.id)) return reply({ error: 'Ongeldige invoer.' }, 400);
      const label = await createLabel(input.id);
      return reply({ ...label, order: await getShopOrder(input.id) });
    }
    if (input.action === 'tracking') {
      if (typeof input.id !== 'string' || !uuid.test(input.id)) return reply({ error: 'Ongeldige invoer.' }, 400);
      await setTracking(input.id, String(input.carrier ?? ''), String(input.tracking ?? ''));
      return reply({ ok: true, order: await getShopOrder(input.id) });
    }
    if (input.action === 'ship') {
      if (typeof input.id !== 'string' || !uuid.test(input.id) || typeof input.key !== 'string' || !uuid.test(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
      const shipped = await shipOrder(input.id, input.key, user);
      return reply({ ...shipped, order: await getShopOrder(input.id) });
    }
    return reply({ error: 'Onbekende actie.' }, 400);
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    return reply({ error: (error as Error).message }, 500);
  }
}
