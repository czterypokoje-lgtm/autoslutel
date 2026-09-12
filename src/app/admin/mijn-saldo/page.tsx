import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, CardHead, Badge, Empty, Notice, Table, ui } from '../_ui';
import { HighlightCard, LineChart, Legend, BarChart, RankedBars, Donut, chart } from '../_ui/charts';
import { SCENARIO_INFO, isScenario } from '@/lib/scenarios';
import { priceOf, earnedOn, computeAvailable } from '@/lib/technicianBalance';
import PayoutForm from './PayoutForm';

export const dynamic = 'force-dynamic';

const euro = (value: number) => `€ ${value.toFixed(2).replace('.', ',')}`;
const euroShort = (value: number) =>
  value >= 1000 ? `€${Math.round(value / 1000)}K` : `€${Math.round(value)}`;

/*
 * The figure at the top of a dashboard, without cents once it runs into the
 * thousands: "€ 21.940,00" did not fit its card and was cut to "€ 21.940…",
 * and two decimals on a headline number are two characters nobody reads. The
 * table below still carries them, which is where they matter.
 */
const euroHeadline = (value: number) =>
  value >= 1000
    ? `€ ${Math.round(value).toLocaleString('nl-NL')}`
    : `€ ${value.toFixed(2).replace('.', ',')}`;

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

/**
 * The technician's own analytics.
 *
 * Everything on this page is computed from their completed jobs. Nothing is
 * illustrative: where a comparison has no previous period the delta is simply
 * absent, and every chart draws an empty state rather than a flat line through
 * zero — a line through zero looks like a measurement, and it is not one.
 *
 * The four cards at the top are light on a dark page. That is the only place in
 * this CRM the surfaces invert, and it is deliberate: they are the answer, and
 * they should be legible before anything else is read.
 */
export default async function MijnSaldoPage() {
  const user = await requireCrmUser('/admin/mijn-saldo');
  const supabase = await createSupabaseServerClient();

  const { data: tech } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tech) {
    return (
      <>
        <PageHead title="Mijn saldo" />
        <Notice tone="bad">Uw login is nog niet aan een monteur gekoppeld.</Notice>
      </>
    );
  }

  const [{ data: jobs }, { data: payouts }] = await Promise.all([
    supabase
      .from('jobs')
      .select(
        'id, car_make, car_model, city, scenario, service_type, quoted_price, final_price, commission_pct, scheduled_date'
      )
      .eq('technician_id', tech.id)
      .eq('status', 'afgerond')
      .order('scheduled_date', { ascending: false }),
    supabase.from('payout_requests').select('amount, status').eq('technician_id', tech.id),
  ]);

  const done = jobs ?? [];

  const revenue = done.reduce((total, job) => total + priceOf(job), 0);
  const available = computeAvailable(done, payouts ?? []);

  /* ── periods ── */
  const now = new Date();
  const year = now.getFullYear();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = monthKey(now);
  const lastMonth = monthKey(new Date(year, now.getMonth() - 1, 1));

  const inMonth = (key: string) => done.filter((job) => (job.scheduled_date ?? '').startsWith(key));

  /** Percentage change, or null when the earlier period holds nothing. */
  const delta = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : null;

  const revenueThis = inMonth(thisMonth).reduce((t, j) => t + priceOf(j), 0);
  const revenueLast = inMonth(lastMonth).reduce((t, j) => t + priceOf(j), 0);
  const countThis = inMonth(thisMonth).length;
  const countLast = inMonth(lastMonth).length;
  const avgThis = countThis ? revenueThis / countThis : 0;
  const avgLast = countLast ? revenueLast / countLast : 0;

  /* ── twelve months, this year against last ── */
  const monthly = (whichYear: number) =>
    MONTHS.map((_, index) =>
      done
        .filter((job) => (job.scheduled_date ?? '').startsWith(`${whichYear}-${String(index + 1).padStart(2, '0')}`))
        .reduce((total, job) => total + priceOf(job), 0)
    );

  const thisYear = monthly(year);
  const previousYear = monthly(year - 1);
  const hasLastYear = previousYear.some((value) => value > 0);

  /* Only the months up to now: a line that drops to zero in December every
     year is drawing the calendar, not the work. */
  const upTo = now.getMonth() + 1;
  const series = [
    { label: `${year}`, points: thisYear.slice(0, upTo) },
    ...(hasLastYear ? [{ label: `${year - 1}`, points: previousYear.slice(0, upTo), dashed: true }] : []),
  ];

  /* ── the cars, the work, the places ── */
  const tally = (key: (job: (typeof done)[number]) => string | null) => {
    const map = new Map<string, number>();
    for (const job of done) {
      const label = key(job);
      if (!label) continue;
      map.set(label, (map.get(label) ?? 0) + priceOf(job));
    }
    return [...map]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  const makes = tally((job) => job.car_make).slice(0, 6);
  const kinds = tally((job) =>
    isScenario(job.scenario) ? SCENARIO_INFO[job.scenario].label : (job.service_type ?? null)
  ).slice(0, 6);
  const places = tally((job) => job.city).slice(0, 5);

  return (
    <>
      <PageHead
        title="Mijn saldo"
        sub="Wat u verdiende op klussen via Autosleutel24, en waar het vandaan kwam."
        actions={<PayoutForm available={available} />}
      />

      <div className={chart.highlights}>
        <HighlightCard label="Beschikbaar" value={euroHeadline(available)} delta={null} tint />
        <HighlightCard
          label="Klussen"
          value={done.length}
          delta={delta(countThis, countLast)}
        />
        <HighlightCard label="Omzet" value={euroHeadline(revenue)} delta={delta(revenueThis, revenueLast)} tint />
        <HighlightCard
          label="Gemiddelde klus"
          value={done.length ? euroHeadline(revenue / done.length) : '—'}
          delta={delta(avgThis, avgLast)}
        />
      </div>

      {/* ── the year, and where the work came from ── */}
      <div className={chart.wideRow}>
        <Card padded>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-5)' }}>
            <strong style={{ color: 'var(--crm-ink)', fontSize: 'var(--fs-sm)' }}>Omzet per maand</strong>
            <div style={{ marginLeft: 'auto' }}>
              <Legend
                items={[
                  { label: `${year}` },
                  ...(hasLastYear ? [{ label: `${year - 1}`, dashed: true }] : []),
                ]}
              />
            </div>
          </div>
          <LineChart series={series} labels={MONTHS.slice(0, upTo)} format={euroShort} />
        </Card>

        <Card padded>
          <strong style={{ color: 'var(--crm-ink)', fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 'var(--sp-5)' }}>
            Automerken
          </strong>
          <RankedBars rows={makes} format={euro} />
        </Card>
      </div>

      {/* ── what kind of work, and where ── */}
      <div className={chart.splitRow}>
        <Card padded>
          <strong style={{ color: 'var(--crm-ink)', fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 'var(--sp-4)' }}>
            Soort werk
          </strong>
          <BarChart bars={kinds} format={euroShort} />
        </Card>

        <Card padded>
          <strong style={{ color: 'var(--crm-ink)', fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 'var(--sp-4)' }}>
            Waar u werkte
          </strong>
          <Donut slices={places} format={euro} />
        </Card>
      </div>

      {/* ── the jobs behind the numbers ── */}
      <Card>
        <CardHead>Afgeronde klussen</CardHead>
        {done.length === 0 ? (
          <Empty>Zodra u een klus afrondt, verschijnt hij hier.</Empty>
        ) : (
          <Table
            head={
              <>
                <th>Datum</th>
                <th>Auto</th>
                <th>Werk</th>
                <th className={ui.numeric}>Klus</th>
                <th className={ui.numeric}>Commissie</th>
                <th className={ui.numeric}>Voor u</th>
              </>
            }
          >
            {done.slice(0, 50).map((job) => (
              <tr key={job.id}>
                <td className={ui.rowNote}>
                  {job.scheduled_date
                    ? new Date(job.scheduled_date).toLocaleDateString('nl-NL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td style={{ color: 'var(--crm-ink)' }}>
                  {[job.car_make, job.car_model].filter(Boolean).join(' ') || '—'}
                </td>
                <td>
                  <Badge>
                    {isScenario(job.scenario)
                      ? SCENARIO_INFO[job.scenario].label
                      : (job.service_type ?? 'Overig')}
                  </Badge>
                </td>
                <td className={ui.numeric}>{euro(priceOf(job))}</td>
                <td className={ui.numeric} style={{ color: 'var(--crm-muted)' }}>
                  {Number(job.commission_pct ?? 25)}%
                </td>
                <td className={ui.numeric} style={{ color: 'var(--crm-ink)', fontWeight: 600 }}>
                  {euro(earnedOn(job))}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
