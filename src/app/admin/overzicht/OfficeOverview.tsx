import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isoDate, slotLabel } from '@/lib/crmJobs';
import { stockStatus } from '@/lib/stockStatus';
import { PageHead, Card, CardHead, Row, Badge, Notice } from '../_ui';
import { HighlightCard, LineChart, BarChart, RankedBars, Donut, chart } from '../_ui/charts';
import styles from './overzicht.module.css';

const euro = (value: number) => `€ ${value.toFixed(2).replace('.', ',')}`;
const euroShort = (value: number) =>
  value >= 1000 ? `€${Math.round(value / 1000)}K` : `€${Math.round(value)}`;
const euroHeadline = (value: number) =>
  value >= 1000 ? `€ ${Math.round(value).toLocaleString('nl-NL')}` : `€ ${value.toFixed(2).replace('.', ',')}`;

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'Nieuw',
  qualified: 'Gekwalificeerd',
  contacted: 'Benaderd',
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Percentage change, or null when the earlier period holds nothing to compare against. */
function delta(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

interface JobRow {
  final_price: number | string | null;
  quoted_price: number | string | null;
}
const priceOf = (job: JobRow) => Number(job.final_price ?? job.quoted_price) || 0;

/**
 * The owner's homepage.
 *
 * Every figure here is read straight from what the office already has —
 * jobs, leads, the reporting views Rapportage already built. Nothing is
 * illustrative: a queue with nothing in it is left out rather than shown as
 * a zero, and a chart with nothing to plot says so instead of drawing a flat
 * line through the origin.
 */
export default async function OfficeOverview() {
  const supabase = await createSupabaseServerClient();

  const today = isoDate(new Date());
  const sameDayLastWeek = isoDate(daysAgo(7));
  const startOfThisYear = `${new Date().getFullYear() - 1}-01-01`;

  const [
    { data: todayJobs },
    { data: lastWeekJobs },
    { data: leads14d },
    { data: response },
    { count: ordersToPlan },
    { data: pendingPayouts },
    { data: stock },
    { count: unmetCount },
    { data: technicians },
    { data: yearJobs },
    { data: reportTechnician },
    { data: openLeads },
    { data: reportSource },
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, status, final_price, quoted_price, technician_id, city, slot_start, slot_end')
      .eq('scheduled_date', today),
    supabase.from('jobs').select('status, final_price, quoted_price').eq('scheduled_date', sameDayLastWeek),
    supabase.from('leads').select('id, created_at').gte('created_at', daysAgo(14).toISOString()),
    supabase.from('crm_report_response').select('*').order('week', { ascending: false }).limit(2),
    supabase.from('crm_orders_to_plan').select('id', { count: 'exact', head: true }),
    supabase.from('payout_requests').select('amount').eq('status', 'pending'),
    supabase.from('stock_items').select('technician_id, quantity, min_quantity'),
    supabase
      .from('unmet_requests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', daysAgo(7).toISOString()),
    supabase.from('technicians').select('id, name, online, active'),
    supabase
      .from('jobs')
      .select('scheduled_date, final_price, quoted_price')
      .eq('status', 'afgerond')
      .gte('scheduled_date', startOfThisYear),
    supabase.from('crm_report_technician').select('*').order('omzet', { ascending: false }).limit(5),
    supabase.from('leads').select('status').in('status', ['new', 'qualified', 'contacted']),
    supabase.from('crm_report_source').select('*'),
  ]);

  /* ── today, against the same weekday last week ── */
  const jobsToday = todayJobs ?? [];
  const doneToday = jobsToday.filter((j) => j.status === 'afgerond');
  const revenueToday = doneToday.reduce((sum, j) => sum + priceOf(j), 0);

  const lastWeekDone = (lastWeekJobs ?? []).filter((j) => j.status === 'afgerond');
  const revenueLastWeek = lastWeekDone.reduce((sum, j) => sum + priceOf(j), 0);

  /* ── leads, last 7 days against the 7 before ── */
  const leadDates = leads14d ?? [];
  const last7 = leadDates.filter((l) => new Date(l.created_at) >= daysAgo(7)).length;
  const prior7 = leadDates.length - last7;

  /* ── response time, this week's row against last week's ── */
  const weeks = response ?? [];
  const latestWeek = weeks[0];
  const priorWeek = weeks[1];

  /* ── the queues that need a decision ── */
  const outOfStockTechnicians = new Set(
    (stock ?? []).filter((s) => stockStatus(s) === 'out').map((s) => s.technician_id)
  );
  const lowStockTechnicians = new Set(
    (stock ?? []).filter((s) => stockStatus(s) === 'low').map((s) => s.technician_id)
  );
  const pendingPayoutTotal = (pendingPayouts ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayoutCount = (pendingPayouts ?? []).length;
  const ordersWaiting = ordersToPlan ?? 0;
  const unmetThisWeek = unmetCount ?? 0;

  const hasQueue =
    ordersWaiting > 0 ||
    pendingPayoutCount > 0 ||
    outOfStockTechnicians.size > 0 ||
    lowStockTechnicians.size > 0 ||
    unmetThisWeek > 0;

  /* ── who's out there right now ── */
  const techs = technicians ?? [];
  const onlineCount = techs.filter((t) => t.online && t.active).length;
  const activeCount = techs.filter((t) => t.active).length;
  const techName = new Map(techs.map((t) => [t.id, t.name]));
  const outNow = jobsToday
    .filter((j) => j.status === 'onderweg' || j.status === 'bezig')
    .map((j) => ({ ...j, name: (j.technician_id && techName.get(j.technician_id)) || 'Onbekend' }));

  /* ── the year, company-wide ── */
  const year = new Date().getFullYear();
  const monthly = (whichYear: number) =>
    MONTHS.map((_, index) =>
      (yearJobs ?? [])
        .filter((j) => (j.scheduled_date ?? '').startsWith(`${whichYear}-${String(index + 1).padStart(2, '0')}`))
        .reduce((sum, j) => sum + priceOf(j), 0)
    );
  const thisYear = monthly(year);
  const previousYear = monthly(year - 1);
  const hasLastYear = previousYear.some((v) => v > 0);
  const upTo = new Date().getMonth() + 1;
  const series = [
    { label: `${year}`, points: thisYear.slice(0, upTo) },
    ...(hasLastYear ? [{ label: `${year - 1}`, points: previousYear.slice(0, upTo), dashed: true }] : []),
  ];

  /* ── top monteurs, this month ── */
  const topTechnicians = (reportTechnician ?? [])
    .map((r) => ({ label: r.name as string, value: Number(r.omzet ?? 0) }))
    .filter((r) => r.value > 0);

  /* ── the pipeline ── */
  const pipelineCounts = new Map<string, number>();
  for (const lead of openLeads ?? []) {
    pipelineCounts.set(lead.status, (pipelineCounts.get(lead.status) ?? 0) + 1);
  }
  const pipeline = [...pipelineCounts.entries()].map(([status, value]) => ({
    label: LEAD_STATUS_LABELS[status] ?? status,
    value,
  }));

  /* ── leads per bron, this month ── */
  const thisMonthKey = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const bySource = new Map<string, number>();
  for (const row of reportSource ?? []) {
    if (!(row.maand as string)?.startsWith(thisMonthKey)) continue;
    bySource.set(row.source, (bySource.get(row.source) ?? 0) + Number(row.leads ?? 0));
  }
  const sources = [...bySource.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <>
      <PageHead title="Overzicht" sub="Vandaag, deze week, en wat om aandacht vraagt." />

      <div className={chart.highlights}>
        <HighlightCard label="Omzet vandaag" value={euroHeadline(revenueToday)} delta={delta(revenueToday, revenueLastWeek)} tint />
        <HighlightCard label="Klussen vandaag" value={jobsToday.length} delta={delta(jobsToday.length, (lastWeekJobs ?? []).length)} />
        <HighlightCard label="Nieuwe leads (7d)" value={last7} delta={delta(last7, prior7)} tint />
        <HighlightCard
          label="Reactietijd deze week"
          value={latestWeek ? `${Math.round(Number(latestWeek.gemiddelde_minuten))} min` : '—'}
          delta={
            latestWeek && priorWeek
              ? delta(Number(latestWeek.gemiddelde_minuten), Number(priorWeek.gemiddelde_minuten))
              : null
          }
        />
      </div>

      <Card className={styles.stack}>
        <CardHead>Wacht op u</CardHead>
        {!hasQueue ? (
          <Notice tone="ok">Alles onder controle — geen openstaande zaken.</Notice>
        ) : (
          <>
            {ordersWaiting > 0 && (
              <Row
                title="Bestellingen zonder monteur"
                meta={`${ordersWaiting} bestelling${ordersWaiting === 1 ? '' : 'en'}`}
                href="/admin/orders"
              />
            )}
            {pendingPayoutCount > 0 && (
              <Row
                title="Openstaande uitbetalingen"
                meta={`${pendingPayoutCount}× · ${euro(pendingPayoutTotal)}`}
                href="/admin/kas"
              />
            )}
            {outOfStockTechnicians.size > 0 && (
              <Row
                title="Artikelen op"
                meta={`bij ${outOfStockTechnicians.size} monteur${outOfStockTechnicians.size === 1 ? '' : 's'}`}
                href="/admin/monteurs"
              />
            )}
            {lowStockTechnicians.size > 0 && (
              <Row
                title="Lage voorraad"
                meta={`bij ${lowStockTechnicians.size} monteur${lowStockTechnicians.size === 1 ? '' : 's'}`}
                href="/admin/monteurs"
              />
            )}
            {unmetThisWeek > 0 && (
              <Row title="Gemiste aanvragen (7d)" meta={`${unmetThisWeek}× geen dekking of prijs`} />
            )}
          </>
        )}
      </Card>

      <Card className={styles.stack}>
        <CardHead>Nu actief</CardHead>
        <div className={styles.activeStrip}>
          <Badge tone={onlineCount > 0 ? 'ok' : 'info'}>
            {onlineCount} van {activeCount} monteurs online
          </Badge>
        </div>
        {outNow.length === 0 ? (
          <Notice tone="info">Niemand onderweg of bezig op dit moment.</Notice>
        ) : (
          outNow.map((job) => (
            <Row
              key={job.id}
              title={job.name}
              note={job.status === 'onderweg' ? 'Onderweg' : 'Bezig'}
              meta={`${slotLabel(job.slot_start, job.slot_end)} · ${job.city || '—'}`}
            />
          ))
        )}
      </Card>

      <div className={chart.wideRow}>
        <Card padded>
          <strong className={styles.cardLabel}>Omzet per maand</strong>
          <LineChart series={series} labels={MONTHS.slice(0, upTo)} format={euroShort} />
        </Card>
        <Card padded>
          <strong className={styles.cardLabel}>Top monteurs deze maand</strong>
          <RankedBars rows={topTechnicians} format={euro} />
        </Card>
      </div>

      <div className={chart.splitRow}>
        <Card padded>
          <strong className={styles.cardLabel}>Leads in behandeling</strong>
          <Donut slices={pipeline} format={(v) => String(v)} />
        </Card>
        <Card padded>
          <strong className={styles.cardLabel}>Leads per bron deze maand</strong>
          <BarChart bars={sources} format={(v) => String(v)} />
        </Card>
      </div>
    </>
  );
}
