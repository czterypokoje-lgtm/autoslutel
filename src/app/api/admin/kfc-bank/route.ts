import { IS_KEYFORCARS } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { StockError } from '@/lib/kfcInventory';
import { importLines, matchLine, parseCamt053, parseCsv, setLineStatus } from '@/lib/kfcBank';

export const runtime = 'nodejs';
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

/** Bank statements: import a file's text, match a line to a customer, set a line aside. Office only. */
export async function POST(request: Request) {
  if (!IS_KEYFORCARS || CRM_PREVIEW) return reply({}, 404);
  const { user, response } = await requireOfficeUserApi();
  if (response) return response;
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return reply({ error: 'Ongeldige invoer.' }, 400);
  try {
    if (input.action === 'import') {
      if (typeof input.text !== 'string' || input.text.length > 5_000_000) return reply({ error: 'Bestand ontbreekt of is te groot (max 5 MB).' }, 400);
      const lines = /<Document|<BkToCstmrStmt/.test(input.text) ? parseCamt053(input.text) : parseCsv(input.text);
      return reply(await importLines(lines));
    }
    if (input.action === 'match') {
      if (typeof input.line !== 'string' || !uuid.test(input.line) || typeof input.customer !== 'string' || !uuid.test(input.customer) || typeof input.key !== 'string' || !uuid.test(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
      await matchLine(input.line, input.customer, Number.isInteger(input.invoice_entry_id) ? input.invoice_entry_id : null, input.key, user);
      return reply({ ok: true });
    }
    if (input.action === 'status') {
      if (typeof input.line !== 'string' || !uuid.test(input.line) || !['open', 'ignored'].includes(input.status)) return reply({ error: 'Ongeldige invoer.' }, 400);
      await setLineStatus(input.line, input.status, typeof input.reason === 'string' ? input.reason : undefined);
      return reply({ ok: true });
    }
    return reply({ error: 'Onbekende actie.' }, 400);
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}
