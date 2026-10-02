import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { waLink, jobBriefing } from '@/lib/whatsapp';
import styles from '../jobs.module.css';
import JobEditor, { type JobDetail } from './JobEditor';
import AdClickPanel from './AdClickPanel';
import PaymentPanel, { type PaymentRow } from './PaymentPanel';
import OfferHistory, { type OfferRow } from './OfferHistory';
import DeleteJobButton from './DeleteJobButton';
import { Badge } from '../../_ui';
import { getBrandLogo } from '@/lib/brandLogos';
import { SCENARIO_INFO, isScenario } from '@/lib/scenarios';
import jd from './job-detail.module.css';

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
        'id, status, technician_id, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type, quoted_price, final_price, commission_pct, commission_amount, notes, started_at, completed_at, lead_id, created_at, customer_name, customer_phone, job_source, car_make, car_model, car_year, scenario, keyless, revenue_callout, revenue_materials, revenue_labor, revenue_discount, cost_materials, cost_technician, cost_travel, cost_payment_fee, cost_other, gross_margin, travel_km'
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
  const logo = getBrandLogo(job.car_make as string | null);
  const work = isScenario(job.scenario) ? SCENARIO_INFO[job.scenario].label : (job.service_type as string | null);
  const when = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${job.scheduled_date}T12:00:00Z`)
  );
  const STEPS = ['gepland', 'onderweg', 'bezig', 'afgerond'] as const;
  const STEP_LABEL: Record<string, string> = { gepland: 'Gepland', onderweg: 'Onderweg', bezig: 'Bezig', afgerond: 'Afgerond' };
  const stepAt = STEPS.indexOf(job.status as (typeof STEPS)[number]);

  return (
    <>
      <div className={jd.hero}>
        <span className={jd.heroLogo} aria-hidden="true">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" />
          ) : (
            <span>{String(job.car_make ?? '?').slice(0, 3).toUpperCase()}</span>
          )}
        </span>
        <div className={jd.heroText}>
          <h1 className={jd.heroTitle}>{car || 'Klus'}</h1>
          <span className={jd.heroSub}>
            {when} · {String(job.slot_start).slice(0, 5)}
            {job.slot_end && <>–{String(job.slot_end).slice(0, 5)}</>}
            {work && <> · {work}</>}
            {job.kenteken && <> · {job.kenteken}</>}
            {assigned && <> · {assigned.name}</>}
          </span>
        </div>
      </div>

      {job.status === 'geannuleerd' ? (
        <p className={jd.cancelled}>Deze klus is geannuleerd.</p>
      ) : (
        <ol className={jd.steps} aria-label="Status">
          {STEPS.map((st, i) => (
            <li key={st} className={i < stepAt ? jd.stepDone : i === stepAt ? jd.stepNow : jd.stepTodo}>
              <span className={jd.stepDot}>{i < stepAt ? '✓' : i + 1}</span>
              {STEP_LABEL[st]}
            </li>
          ))}
        </ol>
      )}

      <div className={styles.head}>
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

          <DeleteJobButton jobId={job.id} />
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

      {/* Renders itself away unless this job has no attribution and an
          unclaimed click landed near its date. */}
      <AdClickPanel jobId={job.id as string} />

      <OfferHistory offers={offerRows} />
    </>
  );
}
