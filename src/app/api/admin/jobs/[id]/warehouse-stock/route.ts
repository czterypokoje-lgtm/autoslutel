import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { getCrmUser, seesPrices } from '@/lib/crmSession';
import { returnLocations } from '@/lib/kfcInventory';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const reply = (error: string, status: number) => Response.json({ error }, { status });

async function access(id: string) {
  if (!WAREHOUSE || CRM_PREVIEW || !uuid.test(id)) return null;
  const user = await getCrmUser();
  if (!user || (!seesPrices(user) && user.role !== 'monteur')) return null;
  const db = createSupabaseAdminClient();
  const { data: job } = await db.from('jobs').select('technician_id, status').eq('id', id).maybeSingle();
  if (!job) return null;
  const office = seesPrices(user);
  if (!office) {
    const { data: technician } = await db.from('technicians').select('id').eq('user_id', user.id).maybeSingle();
    if (!technician || technician.id !== job.technician_id) return null;
  }
  return { db, user, office, status: job.status };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await access(id);
  if (!context) return reply('Geen toegang', 403);
  const { data: reservations, error } = await context.db.from('kfc_job_stock')
    .select('id, article_code, quantity, state').eq('job_id', id).order('created_at');
  if (error) return reply('Voorraad lezen mislukt.', 500);
  const locations = reservations.some((row) => row.state === 'reserved') ? await returnLocations() : [];
  return Response.json({ reservations, locations, canReserve: context.office && !['afgerond', 'geannuleerd'].includes(context.status), canRelease: context.office });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await access(id);
  if (!context) return reply('Geen toegang', 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== 'string' || !uuid.test(body.id)) return reply('Ongeldige invoer.', 400);
  const reserve = body.action === 'reserve';
  const release = body.action === 'release';
  if ((reserve || release) && !context.office) return reply('Geen toegang', 403);
  if (reserve) {
    if (typeof body.article !== 'string' || !/^[A-Z0-9-]{1,50}$/.test(body.article) ||
        !Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 2147483647) return reply('Ongeldige invoer.', 400);
  } else if (!release && (body.action !== 'use' || typeof body.location !== 'string' || !uuid.test(body.location))) {
    return reply('Ongeldige invoer.', 400);
  }
  const result = reserve
    ? await context.db.rpc('kfc_reserve_job_stock', { p_id: body.id, p_job: id, p_article: body.article, p_quantity: body.quantity })
    : await context.db.rpc('kfc_finish_job_stock', { p_id: body.id, p_job: id, p_location: release ? null : body.location, p_user: context.user.id });
  if (!result.error) return Response.json({ ok: true });
  const message = result.error.message;
  if (message.includes('KFC_INSUFFICIENT')) return reply('Onvoldoende vrije voorraad.', 409);
  if (message.includes('KFC_UNKNOWN_ARTICLE')) return reply('Onbekend artikel.', 404);
  if (message.includes('KFC_LOCATION_REQUIRED')) return reply('Kies een locatie en bak.', 400);
  if (/KFC_(JOB_CLOSED|RESERVATION_CLOSED|RESERVATION_MISMATCH|NO_RESERVATION)/.test(message)) {
    return reply('Deze reservering kan niet worden gewijzigd.', 409);
  }
  return reply('Opslaan mislukt.', 500);
}
