import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { waLink, jobBriefing } from '@/lib/whatsapp';
import styles from '../jobs.module.css';
import JobEditor, { type JobDetail } from './JobEditor';
import PaymentPanel, { type PaymentRow } from './PaymentPanel';
import OfferHistory, { type OfferRow } from './OfferHistory';
import { Badge } from '../../_ui';

const SOURCE_LABEL: Record<string, string> = {
  autosleutel24: 'Kantoor',
  agent: 'Voice agent',
  eigen: 'Eigen klant monteur',
  partner: 'Partner',
};

export const dynamic = 'force-dynamic';

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOfficeUser(`/admin/jobs/${id}`);

  const supabase = await createSupabaseServerClient();

  const [{ data: job, error }, { data: technicians }, { data: payments }, { data: offers }] = await Promise.all([
    supabase
      .from('jobs')
      .select(
        'id, status, technician_id, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type, quoted_price, final_price, notes, started_at, completed_at, lead_id, created_at, customer_name, customer_phone, job_source, car_make, car_model, car_year, scenario, keyless'
      )
      .eq('id', id)
      .maybeSingle(),
    // The phone comes along so the briefing can be sent from this page.
    supabase.from('technicians').select('id, name, phone, active').order('name'),
    /*
     * What has been taken on this job. `status` is what decides whether the
     * money arrived — an iDEAL request exists before it is paid, so a row alone
     * is not revenue.
     */
    supabase
      .from('job_payments')
      .select('id, amount, method, status, checkout_url, commission_amount, paid_at, received_by')
      .eq('job_id', id)
      .order('created_at', { ascending: false }),
    /* Who this job was offered to, in what order, and how each one answered. */
    supabase
      .from('job_offers')
      .select(
        'id, rank, tier_at_offer, score, reason, offered_at, expires_at, responded_at, response, decline_note, technician_id, technicians (name)'
      )
      .eq('job_id', id)
      .order('rank'),
  ]);

  if (error) {
    return (
      <div className={styles.warning}>
        De klus kon niet worden geladen: {error.message}
      </div>
    );
  }
  if (!job) notFound();

  const crew = (technicians ?? []) as { id: string; name: string; phone: string | null; active: boolean }[];
  const assigned = crew.find((t) => t.id === job.technician_id);
  const briefingLink = assigned
    ? waLink(assigned.phone, jobBriefing(job as Parameters<typeof jobBriefing>[0]))
    : null;

  const offerRows: OfferRow[] = (offers ?? []).map((o) => {
    const tech = Array.isArray(o.technicians) ? o.technicians[0] : o.technicians;
    return {
      id: o.id,
      rank: o.rank,
      tier_at_offer: o.tier_at_offer,
      score: o.score,
      reason: o.reason,
      offered_at: o.offered_at,
      expires_at: o.expires_at,
      responded_at: o.responded_at,
      response: o.response,
      decline_note: o.decline_note,
      technician_id: o.technician_id,
      technician_name: tech?.name ?? 'Onbekende monteur',
    };
  });

  const car = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ');

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Klus</h1>
        <span className={styles.count}>
          {job.scheduled_date} · {String(job.slot_start).slice(0, 5)}
          {car && <> · {car}</>}
          {job.scenario && <> · {job.scenario}</>}
        </span>
        {job.job_source && (
          <Badge tone={job.job_source === 'agent' ? 'info' : undefined}>
            {SOURCE_LABEL[job.job_source] ?? job.job_source}
          </Badge>
        )}
        <div className={styles.toolbar}>
          <Link className={styles.navBtn} href={`/admin/jobs?datum=${job.scheduled_date}`}>
            Terug naar agenda
          </Link>
          {job.lead_id && (
            <Link className={styles.navBtn} href={`/admin/leads?q=${job.kenteken ?? ''}`}>
              Bekijk lead
            </Link>
          )}

          {/*
            The briefing a technician needs, already written: when, where,
            which car, what work, who to ring. A link, not an integration —
            it opens WhatsApp and a person presses send.
          */}
          {briefingLink && (
            <a
              className={styles.navBtn}
              href={briefingLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Appen naar {assigned?.name ?? 'monteur'}
            </a>
          )}
        </div>
      </div>

      <PaymentPanel
        jobId={job.id}
        due={Number(job.final_price ?? job.quoted_price) || 0}
        payments={(payments ?? []) as PaymentRow[]}
      />

      <JobEditor
        job={job as unknown as JobDetail}
        technicians={crew.filter((t) => t.active)}
      />

      <OfferHistory offers={offerRows} />
    </>
  );
}
