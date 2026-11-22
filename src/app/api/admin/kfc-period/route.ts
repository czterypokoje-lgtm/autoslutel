import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { StockError } from '@/lib/kfcInventory';
import { getPeriodLock, setPeriodLock } from '@/lib/kfcPeriodLock';

export const runtime = 'nodejs';
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

/** The period lock: office reads it, only the owner sets, moves or removes it. */
export async function GET() {
  if (!WAREHOUSE || CRM_PREVIEW) return reply({}, 404);
  const { response } = await requireOfficeUserApi();
  if (response) return response;
  try {
    return reply(await getPeriodLock());
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}

/** { until: 'YYYY-MM-DD' | null, note?: string }. until null removes the lock (needs a note). */
export async function POST(request: Request) {
  if (!WAREHOUSE || CRM_PREVIEW) return reply({}, 404);
  const { user, response } = await requireOfficeUserApi();
  if (response) return response;
  if (user.role !== 'owner') return reply({ error: 'Alleen de eigenaar kan een periode afsluiten of heropenen.' }, 403);
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || !('until' in input)) return reply({ error: 'Ongeldige invoer.' }, 400);
  if (input.until !== null && typeof input.until !== 'string') return reply({ error: 'Controleer de datum.' }, 400);
  if (input.note != null && typeof input.note !== 'string') return reply({ error: 'Ongeldige notitie.' }, 400);
  try {
    await setPeriodLock(input.until, input.note ?? null, user);
    return reply(await getPeriodLock());
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}
