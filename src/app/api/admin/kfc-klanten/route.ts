import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { StockError } from '@/lib/kfcInventory';
import { createCustomer, postEntry, reverseEntry, updateCustomer } from '@/lib/kfcReceivables';

export const runtime = 'nodejs';
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

/** Customer accounts: office only. Create and edit customers, book payments and credits, reverse mistakes. */
export async function POST(request: Request) {
  if (!WAREHOUSE || CRM_PREVIEW) return reply({}, 404);
  const { user, response } = await requireOfficeUserApi();
  if (response) return response;
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return reply({ error: 'Ongeldige invoer.' }, 400);
  try {
    if (input.action === 'create') return reply({ id: await createCustomer(input.customer ?? {}, user) });
    if (input.action === 'update') {
      if (typeof input.id !== 'string' || !uuid.test(input.id)) return reply({ error: 'Ongeldige klant.' }, 400);
      await updateCustomer(input.id, input.customer ?? {});
      return reply({ ok: true });
    }
    if (input.action === 'entry') {
      if (typeof input.customer !== 'string' || !uuid.test(input.customer) || typeof input.key !== 'string' || !uuid.test(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
      if (!['payment', 'credit_note', 'refund', 'opening', 'write_off'].includes(input.type)) return reply({ error: 'Onbekend boekingstype.' }, 400);
      const id = await postEntry({ customer: input.customer, type: input.type, amount_cents: Number(input.amount_cents), entry_date: input.entry_date, note: input.note, allocations: Array.isArray(input.allocations) ? input.allocations : null, key: input.key }, user);
      return reply({ id });
    }
    if (input.action === 'reverse') {
      if (!Number.isInteger(input.entry) || typeof input.key !== 'string' || !uuid.test(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
      await reverseEntry(input.entry, input.key, user, typeof input.note === 'string' ? input.note : undefined);
      return reply({ ok: true });
    }
    return reply({ error: 'Onbekende actie.' }, 400);
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}
