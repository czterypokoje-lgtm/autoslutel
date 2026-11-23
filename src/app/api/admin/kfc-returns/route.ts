import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { canBookReturns, requireWarehouseUserApi } from '@/lib/crmSession';
import { StockError } from '@/lib/kfcInventory';
import { receiveReturn, scanReturnLine, type ReturnCondition } from '@/lib/kfcReturns';

export const runtime = 'nodejs';

const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const CONDITIONS: ReturnCondition[] = ['new', 'opened', 'defect'];
const text = (value: unknown, max: number) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);

/**
 * "Retour ontvangen" on a webshop order: find the line by scan, then book the
 * return once (idempotency key from the browser, retried with the same key).
 */
export async function POST(request: Request) {
  if (!WAREHOUSE || CRM_PREVIEW) return reply({}, 404);
  const { user, response } = await requireWarehouseUserApi();
  if (response) return response;
  if (!canBookReturns(user)) return reply({ error: 'Geen toegang' }, 403);
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return reply({ error: 'Ongeldige invoer.' }, 400);
  try {
    if (input.action === 'scan') {
      const scan = text(input.scan, 80);
      if (typeof input.order !== 'string' || !uuid.test(input.order) || !scan) return reply({ error: 'Ongeldige invoer.' }, 400);
      return reply({ lines: await scanReturnLine(input.order, scan) });
    }
    if (input.action === 'receive') {
      const { line, key, quantity, condition } = input;
      const location = input.location ?? null;
      const refund = input.refund ?? null;
      if (![line, key].every((value) => typeof value === 'string' && uuid.test(value))
        || !Number.isInteger(quantity) || quantity < 1 || quantity > 10_000
        || !CONDITIONS.includes(condition)
        || (location !== null && (typeof location !== 'string' || !uuid.test(location)))
        || (refund !== null && (typeof refund !== 'string' || !uuid.test(refund)))
        || (condition !== 'defect' && !location)) {
        return reply({ error: 'Ongeldige invoer.' }, 400);
      }
      const result = await receiveReturn({ line, key, quantity, condition, location, refund, scan: text(input.scan, 80), note: text(input.note, 300) }, user);
      return reply({ ok: true, ...result });
    }
    return reply({ error: 'Onbekende actie.' }, 400);
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    return reply({ error: 'Retour boeken mislukt.' }, 500);
  }
}
