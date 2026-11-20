import { IS_KEYFORCARS } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUserApi, seesPrices } from '@/lib/crmSession';
import { StockError, createPurchaseOrder, listPurchaseOrders, receivePurchaseLine, setPurchaseOrderStatus } from '@/lib/kfcInventory';

export const runtime = 'nodejs';

/**
 * Purchase orders for the KeyForCars warehouse.
 *
 * Office creates, orders and cancels; warehouse and picker may list and
 * receive. Receiving is the only path that books 'received' stock moves.
 */
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

async function gate() {
  if (!IS_KEYFORCARS || CRM_PREVIEW) return { user: undefined, response: reply({}, 404) };
  return requireWarehouseUserApi();
}

export async function GET() {
  const { user, response } = await gate();
  if (response) return response;
  try {
    return reply({ orders: await listPurchaseOrders(user) });
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}

export async function POST(request: Request) {
  const { user, response } = await gate();
  if (response) return response;
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return reply({ error: 'Ongeldige invoer.' }, 400);
  try {
    if (input.action === 'create') {
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor maakt inkooporders.' }, 403);
      const lines = Array.isArray(input.lines) ? input.lines : [];
      const id = await createPurchaseOrder({
        supplier: String(input.supplier ?? ''), expected_on: typeof input.expected_on === 'string' ? input.expected_on : null,
        note: typeof input.note === 'string' ? input.note : null,
        lines: lines.map((line: Record<string, unknown>) => ({
          article: String(line.article ?? ''), quantity: Number(line.quantity),
          unit_cost_cents: line.unit_cost_cents == null || line.unit_cost_cents === '' ? null : Number(line.unit_cost_cents),
        })),
      }, user);
      return reply({ id });
    }
    if (input.action === 'status') {
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor wijzigt inkooporders.' }, 403);
      if (typeof input.id !== 'string' || !uuid.test(input.id) || !['ordered', 'cancelled'].includes(input.status)) return reply({ error: 'Ongeldige invoer.' }, 400);
      await setPurchaseOrderStatus(input.id, input.status);
      return reply({ ok: true });
    }
    if (input.action === 'receive') {
      if (typeof input.line !== 'string' || !uuid.test(input.line) || typeof input.key !== 'string' || !uuid.test(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
      await receivePurchaseLine(input.line, Number(input.quantity), String(input.shelf ?? '').toUpperCase(), String(input.box ?? '').toUpperCase(), input.key, user);
      return reply({ ok: true });
    }
    return reply({ error: 'Onbekende actie.' }, 400);
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}
