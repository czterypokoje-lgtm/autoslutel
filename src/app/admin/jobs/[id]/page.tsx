import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { waLink, jobBriefing } from '@/lib/whatsapp';
import styles from '../jobs.module.css';
import JobEditor, { type JobDetail } from './JobEditor';
import AdClickPanel from './AdClickPanel';
import PaymentPanel, { type PaymentRow } from './PaymentPanel';
import OfferHistory, { type OfferRow } from './OfferHistory';
import OfferButton from './OfferButton';
import DeleteJobButton from './DeleteJobButton';
import { Badge } from '../../_ui';
import { getBrandLogo } from '@/lib/brandLogos';
import { SCENARIO_INFO, isScenario, scenarioFromLabel } from '@/lib/scenarios';
import jd from './job-detail.module.css';
import { STUDIO_UI, WAREHOUSE } from '@/config/install';
import JobWarehouseStock from '../JobWarehouseStock';
import StudioJobDetail from '../_studio/job-detail';
import { priceFor as dispatchPriceFor, type PriceRow } from '@/lib/dispatchPricing';
import { priceFor as technicianPriceFor, type PricedCoverageRow } from '@/lib/capability';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PreviewText } from '../../PreviewLanguage';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

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
        'id, status, technician_id, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type, quoted_price, final_price, commission_pct, commission_amount, notes, started_at, completed_at, lead_id, created_at, customer_name, customer_phone, billing_account_id, communication_contact_id, job_source, car_make, car_model, car_year, scenario, keyless, revenue_callout, revenue_materials, revenue_labor, revenue_discount, cost_materials, cost_technician, cost_travel, cost_payment_fee, cost_other, gross_margin, travel_km'
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

  const scenario = isScenario(job.scenario) ? job.scenario : scenarioFromLabel(job.service_type);
  let rates = null;
  if (scenario && job.car_make) {
    const car = { make: job.car_make, model: job.car_model, year: job.car_year };
    const columns = 'make, model, scenario, from_year, to_year, keyless, price';
    const [dispatch, coverage] = await Promise.all([
      supabase.from('dispatch_pricing').select(`${columns}, service_price`).eq('scenario', scenario),
      job.technician_id
        ? supabase.from('technician_coverage').select(`${columns}, excluded`)
            .eq('technician_id', job.technician_id).eq('scenario', scenario)
        : null,
    ]);
    const rate = dispatchPriceFor((dispatch.data ?? []) as PriceRow[], car, scenario, job.keyless);
    const service = rate?.price ?? null;
    const technician = technicianPriceFor((coverage?.data ?? []) as PricedCoverageRow[], car, scenario, job.keyless);
    rates = (
      <Card>
        <CardHeader><CardTitle><PreviewText>Tariefsuggesties</PreviewText></CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt><PreviewText>Tarief uit Tarieven</PreviewText></dt><dd>{service === null ? <PreviewText>Geen passend tarief</PreviewText> : MONEY.format(service)}</dd></div>
            {rate?.servicePrice !== undefined && <div><dt><PreviewText>Diensttarief excl. btw</PreviewText></dt><dd>{MONEY.format(rate.servicePrice)}</dd></div>}
            <div><dt><PreviewText>Tarief toegewezen monteur</PreviewText></dt><dd>{technician === null ? <PreviewText>Geen passend tarief</PreviewText> : MONEY.format(technician)}</dd></div>
          </dl>
        </CardContent>
      </Card>
    );
  }

  const { data: linkedInvoices, error: invoicesError } = await supabase.from('sales_invoices')
    .select('id, invoice_number, status').eq('job_id', job.id).order('issue_date', { ascending: false });
  const issuedIds = (linkedInvoices ?? []).filter((invoice) => invoice.status !== 'concept').map((invoice) => invoice.id);
  const snapshots = issuedIds.length ? await createSupabaseAdminClient().from('job_invoice_snapshots')
    .select('invoice_id, subtotal, material_cost, technician_cost, warehouse_materials').in('invoice_id', issuedIds) : null;
  const snapshotByInvoice = new Map((snapshots?.data ?? []).map((snapshot) => [snapshot.invoice_id, snapshot]));
  const invoiceHistory = (linkedInvoices?.length || invoicesError || snapshots?.error) ? (
    <Card>
      <CardHeader><CardTitle><PreviewText>Facturen</PreviewText></CardTitle></CardHeader>
      <CardContent>
        {(invoicesError || snapshots?.error) && <p><PreviewText>Factuurgegevens konden niet worden geladen.</PreviewText></p>}
        <ul className="space-y-2 text-sm">
          {(linkedInvoices ?? []).map((invoice) => {
            const snapshot = snapshotByInvoice.get(invoice.id);
            const materials = (snapshot?.warehouse_materials ?? []) as { article_code: string; quantity: number; unit_cost_cents: number | null }[];
            return <li key={invoice.id}>
              <Link className="underline" href={`/admin/facturen/${invoice.id}`}>{invoice.invoice_number}</Link>
              {snapshot && <span className="text-muted-foreground">
                {' · '}<PreviewText>Brutobijdrage bij uitgifte</PreviewText>{' '}
                {snapshot.material_cost == null || snapshot.technician_cost == null
                  ? <PreviewText>Directe kosten onbekend</PreviewText>
                  : MONEY.format(snapshot.subtotal - snapshot.material_cost - snapshot.technician_cost)}
              </span>}
              {materials.length > 0 && <details className="text-muted-foreground mt-1">
                <summary className="cursor-pointer"><PreviewText>Magazijnkosten bij uitgifte</PreviewText></summary>
                <ul className="mt-1 space-y-1">
                  {materials.map((item, index) =>
                    <li key={item.article_code + ':' + index}>
                      {item.article_code} · {item.quantity} × {item.unit_cost_cents === null
                        ? <PreviewText>Directe kosten onbekend</PreviewText>
                        : MONEY.format(item.unit_cost_cents / 100)}
                    </li>)}
                </ul>
              </details>}
            </li>;
          })}
        </ul>
      </CardContent>
    </Card>
  ) : null;
  const billingResult = job.billing_account_id ? await createSupabaseAdminClient().from('kfc_customers')
    .select('company').eq('id', job.billing_account_id).is('anonymised_at', null).maybeSingle() : null;
  const accountSummary = billingResult?.data && <Card>
    <CardHeader><CardTitle><PreviewText>Klantaccount</PreviewText></CardTitle></CardHeader>
    <CardContent className="grid gap-2 text-sm">
      <div><PreviewText>Aan wie factureren we?</PreviewText> <Link className="underline" href={'/admin/klanten/relaties?account=' + job.billing_account_id}>{billingResult.data.company}</Link></div>
      <div><PreviewText>Met wie nemen we contact op?</PreviewText> {job.customer_name ?? '—'} {job.customer_phone ?? ''}</div>
    </CardContent>
  </Card>;
  const invoiceLink = job.status === 'afgerond' && (
    <Link className="w-fit text-sm underline underline-offset-4" href={`/admin/facturen/nieuw?klus=${job.id}`}>
      <PreviewText>Nieuwe factuur</PreviewText>
    </Link>
  );

  const crew = (technicians ?? []) as { id: string; name: string; phone: string | null; active: boolean }[];
  const assigned = crew.find((t) => t.id === job.technician_id);
  const briefingLink = assigned
    ? waLink(assigned.phone, jobBriefing(job as Parameters<typeof jobBriefing>[0], 'assigned'))
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

  const openOffers = (offers ?? []).filter((o) => o.response === null).length;

  /* Studio (shadcn) look. Same job, same payments, same offers, and the same
     action components underneath — only the markup differs. */
  if (STUDIO_UI) {
    return (
      <>
      <StudioJobDetail
        job={job as unknown as JobDetail & { job_source: string | null; lead_id: string | null }}
        crew={crew}
        payments={(payments ?? []) as PaymentRow[]}
        offers={offerRows}
        briefingLink={briefingLink}
        openOffers={openOffers}
      />
      {WAREHOUSE && <JobWarehouseStock jobId={job.id} />}
      {accountSummary}
      {invoiceLink}
      {invoiceHistory}
      {rates}
      </>
    );
  }

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

      {WAREHOUSE && <JobWarehouseStock jobId={job.id} />}
      {accountSummary}
      {invoiceLink}
      {invoiceHistory}
      {rates}
      <JobEditor
        job={job as unknown as JobDetail}
        technicians={crew.filter((t) => t.active)}
      />

      {/* Renders itself away unless this job has no attribution and an
          unclaimed click landed near its date. */}
      <AdClickPanel jobId={job.id as string} />

      {/*
        * Offering is only on the table while the job is still to be done —
        * a finished job sent out to bid is how a monteur drives to work that
        * someone else already did.
        */}
      {job.status !== 'afgerond' && job.status !== 'geannuleerd' && (
        <div style={{ margin: '1.5rem 0' }}>
          <OfferButton jobId={job.id as string} alreadyOpen={openOffers} />
        </div>
      )}

      <OfferHistory offers={offerRows} />
    </>
  );
}
