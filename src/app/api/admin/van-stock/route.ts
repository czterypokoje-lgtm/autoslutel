import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { getCrmUser, seesPrices } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export async function POST(request: Request) {
  const user = await getCrmUser();
  if (!WAREHOUSE || CRM_PREVIEW || !user || (!seesPrices(user) && user.role !== 'monteur')) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 });
  }
  const input = await request.json().catch(() => null);
  if (!input || typeof input.article !== 'string' || !/^[A-Z0-9-]{1,50}$/.test(input.article) ||
      !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 2147483647 ||
      ![input.id, input.location, input.target].every((value) => typeof value === 'string' && uuid.test(value))) {
    return Response.json({ error: 'Ongeldige invoer.' }, { status: 400 });
  }
  const db = createSupabaseAdminClient();
  const common = { p_id: input.id, p_article: input.article, p_quantity: input.quantity, p_user: user.id };
  let result;
  if (input.action === 'use' && user.role === 'monteur') {
    result = await db.rpc('kfc_use_van_stock', { ...common, p_job: input.target, p_location: input.location });
  } else if (input.action === 'transfer' && seesPrices(user) && typeof input.toVan === 'boolean') {
    result = await db.rpc('kfc_transfer_van_stock', { ...common, p_central: input.location, p_technician: input.target, p_to_van: input.toVan });
  } else {
    return Response.json({ error: 'Geen toegang' }, { status: 403 });
  }
  if (!result.error) return Response.json({ ok: true });
  const message = result.error.message;
  if (/KFC_BAD_VAN/.test(message)) return Response.json({ error: 'Deze bus hoort niet bij deze klus of monteur.' }, { status: 403 });
  if (/KFC_INSUFFICIENT/.test(message)) return Response.json({ error: 'Onvoldoende vrije voorraad.' }, { status: 409 });
  if (/KFC_JOB_CLOSED/.test(message)) return Response.json({ error: 'Deze klus is geannuleerd of al gefactureerd.' }, { status: 409 });
  if (/KFC_RESERVATION_MISMATCH|23505/.test(message + result.error.code)) return Response.json({ error: 'Deze boeking heeft al andere gegevens.' }, { status: 409 });
  if (/KFC_LOCATION_REQUIRED|KFC_UNKNOWN_ARTICLE/.test(message) || result.error.code === '23503') {
    return Response.json({ error: 'Onbekend artikel of onbekende locatie.' }, { status: 400 });
  }
  return Response.json({ error: 'Opslaan mislukt.' }, { status: 500 });
}
