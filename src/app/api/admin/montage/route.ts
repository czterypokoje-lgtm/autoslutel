import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUserApi, seesPurchasePrices } from '@/lib/crmSession';
import { StockError, articleCosts, assemble, recentAssemblies } from '@/lib/kfcInventory';

export const runtime = 'nodejs';

/**
 * Assembly (spec S3, migration 0112): parts into a product in one transaction.
 * Warehouse roles may assemble; only the office sees costs (purchase prices).
 */
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

async function gate() {
  if (!WAREHOUSE || CRM_PREVIEW) return { user: undefined, response: reply({}, 404) };
  return requireWarehouseUserApi();
}

export async function GET(request: Request) {
  const { user, response } = await gate();
  if (response) return response;
  const prices = seesPurchasePrices(user);
  // ?costs=CODE,CODE: purchase prices for the live cost preview.
  const costs = new URL(request.url).searchParams.get('costs');
  if (costs !== null) return prices ? reply({ costs: await articleCosts(costs.split(',')) }) : reply({ costs: {} });
  const rows = await recentAssemblies();
  return reply({ assemblies: prices ? rows : rows.map((row) => ({ ...row, labour_cents: 0, unit_cost_cents: null, components: row.components.map((c) => ({ ...c, unit_cost_cents: null })) })) });
}

export async function POST(request: Request) {
  const { user, response } = await gate();
  if (response) return response;
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || typeof input.key !== 'string' || !uuid.test(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
  try {
    const parts = Array.isArray(input.components) ? input.components : [];
    const row = await assemble({
      output: String(input.output ?? ''), shelf: String(input.shelf ?? '').toUpperCase(), box: String(input.box ?? '').toUpperCase(),
      quantity: Number(input.quantity), labour_cents: Number(input.labour_cents ?? 0), note: typeof input.note === 'string' ? input.note : null, key: input.key,
      components: parts.map((part: Record<string, unknown>) => ({
        article: String(part.article ?? ''), shelf: String(part.shelf ?? '').toUpperCase(), box: String(part.box ?? '').toUpperCase(), quantity: Number(part.quantity),
      })),
    }, user);
    return reply({ assembly: seesPurchasePrices(user) ? row : { ...row, unit_cost_cents: null } });
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}
