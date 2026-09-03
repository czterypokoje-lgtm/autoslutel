import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isoDate, suggestTechnicians, type TechnicianLike } from '@/lib/crmJobs';
import styles from '../jobs.module.css';
import PlanForm, { type PlanLead } from './PlanForm';

export const dynamic = 'force-dynamic';

/**
 * "Plan in": turn a lead into a job.
 *
 * The technician ranking is computed here, on the server, because it needs the
 * day's existing load — a suggestion that ignores who is already booked is
 * worse than no suggestion.
 */
export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; order?: string; datum?: string }>;
}) {
  await requireOfficeUser('/admin/jobs/nieuw');

  const { lead: leadId, order: orderId, datum } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let lead: PlanLead | null = null;
  if (leadId) {
    const { data } = await supabase
      .from('leads')
      .select(
        'id, name, phone, phone_e164, postcode, location, brand, model, year, kenteken, service, source, created_at'
      )
      .eq('id', leadId)
      .maybeSingle();
    if (!data) notFound();
    lead = data as unknown as PlanLead;
  }

  /*
   * A paid webshop order that needs a technician arrives here the same way a
   * lead does. It is presented as a lead-shaped object so the form below does
   * not have to know which of the two it came from — the only real difference
   * is that this customer has already paid.
   */
  let order: { id: string; order_number: string; total_inc: number } | null = null;
  if (!lead && orderId) {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, name, phone, email, street, postcode, city, kenteken, total_inc, created_at')
      .eq('id', orderId)
      .maybeSingle();
    if (!data) notFound();

    order = {
      id: data.id as string,
      order_number: data.order_number as string,
      total_inc: Number(data.total_inc ?? 0),
    };

    lead = {
      id: data.id as string,
      name: data.name as string,
      phone: (data.phone as string) ?? null,
      phone_e164: (data.phone as string) ?? null,
      postcode: (data.postcode as string) ?? null,
      location: (data.city as string) ?? null,
      brand: null,
      model: null,
      year: null,
      kenteken: (data.kenteken as string) ?? null,
      service: 'Webshopbestelling met monteur',
      source: 'webshop_service',
      created_at: data.created_at as string,
    };
  }

  const date = datum && /^\d{4}-\d{2}-\d{2}$/.test(datum) ? datum : isoDate(new Date());

  const [{ data: technicians, error: techError }, { data: dayJobs }, { data: away }] =
    await Promise.all([
      supabase
        .from('technicians')
        .select('id, name, active, werkgebied, color')
        .order('name'),
      supabase.from('jobs').select('technician_id').eq('scheduled_date', date),
      supabase
        .from('technician_availability')
        .select('technician_id')
        .eq('date', date)
        .eq('available', false),
    ]);

  if (techError) {
    return (
      <div className={styles.warning}>
        Monteurs konden niet worden geladen: {techError.message}
        <br />
        Voer <code>supabase/migrations/0004_jobs_agenda.sql</code> uit.
      </div>
    );
  }

  /*
   * Has this car been here before?
   *
   * The same plate returning soon after a finished job is either a warranty
   * case or a second key, and which one it is changes the price before anyone
   * quotes it. Cheap to check, expensive to find out afterwards.
   */
  let recentWork: { scheduled_date: string; service_type: string | null; dagen_geleden: number } | null = null;
  if (lead?.kenteken) {
    const { data: history } = await supabase
      .from('crm_warranty_watch')
      .select('scheduled_date, service_type, dagen_geleden')
      .eq('kenteken', lead.kenteken)
      .order('scheduled_date', { ascending: false })
      .limit(1);
    const hit = history?.[0];
    if (hit) {
      recentWork = {
        scheduled_date: hit.scheduled_date as string,
        service_type: (hit.service_type as string) ?? null,
        dagen_geleden: Number(hit.dagen_geleden),
      };
    }
  }

  const loadByTechnician: Record<string, number> = {};
  for (const job of dayJobs ?? []) {
    const id = job.technician_id as string | null;
    if (id) loadByTechnician[id] = (loadByTechnician[id] ?? 0) + 1;
  }

  const suggestions = suggestTechnicians({
    technicians: (technicians ?? []) as unknown as TechnicianLike[],
    postcode: lead?.postcode ?? null,
    loadByTechnician,
    unavailable: new Set((away ?? []).map((a) => a.technician_id as string)),
  }).map((s) => ({
    id: s.technician.id,
    name: s.technician.name,
    inRegion: s.inRegion,
    reason: s.reason,
  }));

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Klus inplannen</h1>
        <span className={styles.count}>
          {order ? 'vanuit een webshopbestelling' : lead ? 'vanuit een lead' : 'handmatig'}
        </span>
        <div className={styles.toolbar}>
          <Link className={styles.navBtn} href="/admin/leads">
            Terug naar leads
          </Link>
        </div>
      </div>

      {recentWork && (
        <p className={styles.warning}>
          <strong>{lead?.kenteken}</strong> is hier{' '}
          {recentWork.dagen_geleden} dagen geleden al geweest
          {recentWork.service_type ? ` voor ${recentWork.service_type}` : ''} (
          {recentWork.scheduled_date}).
          {recentWork.dagen_geleden <= 90
            ? ' Binnen drie maanden — controleer eerst of dit garantie is voordat er een prijs wordt afgesproken.'
            : ' Bekijk de vorige klus: welke chip is gebruikt en hoe lang het duurde.'}
        </p>
      )}

      {technicians?.length === 0 && (
        <p className={styles.warning}>
          Er zijn nog geen monteurs. Voeg ze eerst toe bij{' '}
          <Link className={styles.link} href="/admin/monteurs">
            Monteurs
          </Link>{' '}
          — zonder monteurs heeft de agenda geen kolommen en kan er niemand
          worden toegewezen.
        </p>
      )}

      <PlanForm lead={lead} order={order} date={date} suggestions={suggestions} />
    </>
  );
}
