import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, CardHead, Badge, Empty, Notice, Table, ui } from '../../_ui';
import { HighlightCard, LineChart, Legend, BarChart, Donut, chart } from '../../_ui/charts';
import { SCENARIO_INFO, isScenario } from '@/lib/scenarios';
import { priceOf } from '@/lib/technicianBalance';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const euro = (value: number) => `€ ${value.toFixed(2).replace('.', ',')}`;
const euroShort = (value: number) =>
  value >= 1000 ? `€${Math.round(value / 1000)}K` : `€${Math.round(value)}`;
const euroHeadline = (value: number) =>
  value >= 1000
    ? `€ ${Math.round(value).toLocaleString('nl-NL')}`
    : `€ ${value.toFixed(2).replace('.', ',')}`;

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

/** Monday of the ISO week containing `date`, at 00:00. */
function startOfIsoWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * A single technician's job history, from the office side.
 *
 * This is the same shape as the technician's own `mijn-saldo` page, opened
 * instead by the office for any monteur — because "how much did Maaster make
 * this week, and what did he actually do" is an office question too, not
 * only a self-service one.
 *
 * One deliberate difference from `mijn-saldo`: this page does NOT use
 * `earnedOn()` / `commission_pct` to compute a "you earned" figure. That
 * formula assumes a flat percentage the business takes from every job, but
 * the real commission arrangements per technician are flat euro amounts,
 * and the direction differs — some technicians are paid a fee per job by the
 * business, others pay the business a referral fee out of what they collect
 * themselves. Guessing that direction here would show a confidently wrong
 * number. `commission_amount` is shown as its own column instead, labelled
 * plainly, with `job.tech_note` visible so the actual arrangement can be
 * read rather than assumed.
 */
export default async function MonteurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOfficeUser('/admin/monteurs');
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: tech } = await supabase
    .from('technicians')
    .select('id, name, phone, active, werkgebied')
    .eq('id', id)
    .maybeSingle();

  if (!tech) notFound();

  /*
   * Their price list and the trail behind it.
   *
   * Both are read-only here: the office needs to see what a monteur charges
   * and how it has moved, but a price is the monteur's own declaration and
   * changing it behind their back would make the log a record of nobody's
   * decision. price is selected defensively — the column arrives with
   * 0038, and this page must still render on a database that has not run it.
   */
  const [{ data: priceRows }, { data: priceLog }] = await Promise.all([
    supabase
      .from('technician_coverage')
      .select('id, make, model, scenario, from_year, to_year, keyless, excluded, price')
      .eq('technician_id', id)
      .order('make'),
    supabase
      .from('technician_coverage_log')
      .select('id, action, make, model, scenario, old_price, new_price, changed_at')
      .eq('technician_id', id)
      .order('changed_at', { ascending: false })
      .limit(25),
  ]);

  const { data: jobsData, error } = await supabase
    .from('jobs')
    .select(
      'id, car_make, car_model, city, scenario, service_type, quoted_price, final_price, commission_pct, commission_amount, scheduled_date, status, tech_note'
    )
    .eq('technician_id', id)
    .order('scheduled_date', { ascending: false });

  if (error) {
    return (
      <>
        <PageHead title={tech.name} />
        <Notice tone="bad">Klussen konden niet worden geladen: {error.message}</Notice>
      </>
    );
  }

  const all = jobsData ?? [];
  const done = all.filter((job) => job.status === 'afgerond');

  const revenue = done.reduce((total, job) => total + priceOf(job), 0);
  const commissionTotal = done.reduce((total, job) => total + (Number(job.commission_amount) || 0), 0);

  /* ── today / this week / this month, this year against last ── */
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const weekStart = startOfIsoWeek(now);
  const weekStartKey = weekStart.toISOString().slice(0, 10);

  const inDay = (job: (typeof done)[number]) => (job.scheduled_date ?? '') === todayKey;
  const inWeek = (job: (typeof done)[number]) => (job.scheduled_date ?? '') >= weekStartKey;

  const todayJobs = done.filter(inDay);
  const weekJobs = done.filter(inWeek);
  const todayRevenue = todayJobs.reduce((t, j) => t + priceOf(j), 0);
  const weekRevenue = weekJobs.reduce((t, j) => t + priceOf(j), 0);

  const year = now.getFullYear();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = monthKey(now);
  const lastMonth = monthKey(new Date(year, now.getMonth() - 1, 1));
  const inMonth = (key: string) => done.filter((job) => (job.scheduled_date ?? '').startsWith(key));
  const delta = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : null;
  const revenueThis = inMonth(thisMonth).reduce((t, j) => t + priceOf(j), 0);
  const revenueLast = inMonth(lastMonth).reduce((t, j) => t + priceOf(j), 0);

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
  const upTo = now.getMonth() + 1;
  const firstActiveMonth = Array.from({ length: 12 }).findIndex(
    (_, i) => thisYear[i] > 0 || previousYear[i] > 0
  );
  const startMonthIndex = firstActiveMonth === -1 ? 0 : firstActiveMonth;
  const series = [
    { label: `${year}`, points: thisYear.slice(startMonthIndex, upTo) },
    ...(hasLastYear ? [{ label: `${year - 1}`, points: previousYear.slice(startMonthIndex, upTo), dashed: true }] : []),
  ];
  const chartLabels = MONTHS.slice(startMonthIndex, upTo);

  /* ── the work, and where ── */
  const tally = (key: (job: (typeof done)[number]) => string | null) => {
    const map = new Map<string, number>();
    for (const job of done) {
      const label = key(job);
      if (!label) continue;
      map.set(label, (map.get(label) ?? 0) + priceOf(job));
    }
    return [...map].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };

  const kinds = tally((job) =>
    isScenario(job.scenario) ? SCENARIO_INFO[job.scenario].label : (job.service_type ?? null)
  ).slice(0, 6);
  const places = tally((job) => job.city).slice(0, 6);

  return (
    <>
      <PageHead
        title={tech.name}
        sub={`${tech.phone ?? 'Geen telefoon'} · ${tech.werkgebied && tech.werkgebied.length > 0 ? tech.werkgebied.join(', ') : 'geen werkgebied'}`}
        actions={<Link href="/admin/monteurs" className={ui.badge}>← Alle monteurs</Link>}
      />

      <div className={chart.highlights}>
        <HighlightCard label="Vandaag" value={`${todayJobs.length} klus${todayJobs.length === 1 ? '' : 'sen'}`} delta={null} tint />
        <HighlightCard label="Omzet vandaag" value={euroHeadline(todayRevenue)} delta={null} />
        <HighlightCard label="Deze week" value={`${weekJobs.length} klus${weekJobs.length === 1 ? '' : 'sen'}`} delta={null} tint />
        <HighlightCard label="Omzet deze week" value={euroHeadline(weekRevenue)} delta={null} />
      </div>

      <div className={chart.highlights} style={{ marginTop: 'var(--sp-3)' }}>
        <HighlightCard label="Klussen (totaal)" value={done.length} delta={null} tint />
        <HighlightCard label="Omzet (totaal)" value={euroHeadline(revenue)} delta={delta(revenueThis, revenueLast)} />
        <HighlightCard label="Gemiddelde klus" value={done.length ? euroHeadline(revenue / done.length) : '—'} delta={null} tint />
        <HighlightCard label="Commissie (totaal)" value={euroHeadline(commissionTotal)} delta={null} />
      </div>

      <div className={chart.wideRow}>
        <Card padded>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-5)' }}>
            <strong style={{ color: 'var(--crm-ink)', fontSize: 'var(--fs-sm)' }}>Omzet per maand</strong>
            <div style={{ marginLeft: 'auto' }}>
              <Legend items={[{ label: `${year}` }, ...(hasLastYear ? [{ label: `${year - 1}`, dashed: true }] : [])]} />
            </div>
          </div>
          <LineChart series={series} labels={chartLabels} format={euroShort} />
        </Card>

        <Card padded>
          <strong style={{ color: 'var(--crm-ink)', fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 'var(--sp-5)' }}>
            Waar
          </strong>
          <Donut slices={places} format={euro} />
        </Card>
      </div>

      <div className={chart.splitRow}>
        <Card padded>
          <strong style={{ color: 'var(--crm-ink)', fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 'var(--sp-4)' }}>
            Soort werk
          </strong>
          <BarChart bars={kinds} format={euroShort} />
        </Card>
      </div>

      <Card>
        <CardHead>Klussen ({all.length})</CardHead>
        {all.length === 0 ? (
          <Empty>Nog geen klussen voor deze monteur.</Empty>
        ) : (
          <Table
            head={
              <>
                <th>Datum</th>
                <th>Status</th>
                <th>Auto</th>
                <th>Werk</th>
                <th>Plaats</th>
                <th className={ui.numeric}>Klus</th>
                <th className={ui.numeric}>Commissie</th>
                <th></th>
              </>
            }
          >
            {all.slice(0, 100).map((job) => (
              <tr key={job.id}>
                <td className={ui.rowNote}>
                  {job.scheduled_date
                    ? new Date(job.scheduled_date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td>
                  <Badge tone={job.status === 'afgerond' ? 'ok' : job.status === 'geannuleerd' ? 'stop' : 'info'}>
                    {job.status}
                  </Badge>
                </td>
                <td style={{ color: 'var(--crm-ink)' }}>
                  {[job.car_make, job.car_model].filter(Boolean).join(' ') || '—'}
                </td>
                <td>
                  <Badge>
                    {isScenario(job.scenario) ? SCENARIO_INFO[job.scenario].label : (job.service_type ?? 'Overig')}
                  </Badge>
                </td>
                <td className={ui.rowNote}>{job.city ?? '—'}</td>
                <td className={ui.numeric}>{job.quoted_price != null || job.final_price != null ? euro(priceOf(job)) : '—'}</td>
                <td className={ui.numeric} style={{ color: 'var(--crm-muted)' }}>
                  {job.commission_amount != null ? euro(Number(job.commission_amount)) : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/admin/jobs/${job.id}`} style={{ color: 'var(--crm-accent)', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                    Bewerk
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHead>
          <h2>Prijzen van deze monteur</h2>
          <span className={ui.sub}>
            {priceRows?.length ?? 0} {(priceRows?.length ?? 0) === 1 ? 'auto' : 'auto\u2019s'} — wat
            hij hiervoor rekent. Een prijs is tegelijk zijn opgave dat hij het werk doet.
          </span>
        </CardHead>
        {!priceRows || priceRows.length === 0 ? (
          <Empty>
            Nog geen prijzen opgegeven. Zolang deze lijst leeg is krijgt hij geen klussen
            aangeboden.
          </Empty>
        ) : (
          <Table
            head={
              <>
                <th>Merk</th>
                <th>Model</th>
                <th>Bouwjaar</th>
                <th>Scenario</th>
                <th>Sleutel</th>
                <th className={ui.numeric}>Prijs</th>
              </>
            }
          >
            {priceRows.map((row) => (
              <tr key={row.id as string}>
                <td className={ui.rowStrong}>{row.make as string}</td>
                <td className={ui.rowNote}>{(row.model as string) ?? 'Heel merk'}</td>
                <td className={ui.rowNote}>
                  {row.from_year || row.to_year
                    ? `${row.from_year ?? ''}\u2013${row.to_year ?? ''}`
                    : 'alle'}
                </td>
                <td>
                  {isScenario(row.scenario)
                    ? SCENARIO_INFO[row.scenario].label
                    : ((row.scenario as string) ?? '—')}
                </td>
                <td className={ui.rowNote}>
                  {row.keyless === true ? 'Keyless' : row.keyless === false ? 'Baard/contact' : 'Beide'}
                </td>
                <td className={ui.numeric}>
                  {row.price != null ? euro(Number(row.price)) : '—'}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHead>
          <h2>Wijzigingen</h2>
          <span className={ui.sub}>
            De laatste 25 aanpassingen aan zijn prijslijst, met datum.
          </span>
        </CardHead>
        {!priceLog || priceLog.length === 0 ? (
          <Empty>
            Nog geen wijzigingen vastgelegd. De geschiedenis begint zodra
            0038_technician_pricing.sql is uitgevoerd.
          </Empty>
        ) : (
          <Table
            head={
              <>
                <th>Wanneer</th>
                <th>Actie</th>
                <th>Auto</th>
                <th>Scenario</th>
                <th className={ui.numeric}>Van</th>
                <th className={ui.numeric}>Naar</th>
              </>
            }
          >
            {priceLog.map((entry) => (
              <tr key={String(entry.id)}>
                <td className={ui.rowNote}>
                  {new Date(entry.changed_at as string).toLocaleString('nl-NL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td>
                  <Badge tone={entry.action === 'delete' ? 'stop' : 'info'}>
                    {entry.action === 'insert'
                      ? 'toegevoegd'
                      : entry.action === 'update'
                        ? 'gewijzigd'
                        : 'verwijderd'}
                  </Badge>
                </td>
                <td className={ui.rowStrong}>
                  {[entry.make, entry.model].filter(Boolean).join(' ') || '—'}
                </td>
                <td className={ui.rowNote}>
                  {isScenario(entry.scenario)
                    ? SCENARIO_INFO[entry.scenario].label
                    : ((entry.scenario as string) ?? '—')}
                </td>
                <td className={ui.numeric} style={{ color: 'var(--crm-muted)' }}>
                  {entry.old_price != null ? euro(Number(entry.old_price)) : '—'}
                </td>
                <td className={ui.numeric}>
                  {entry.new_price != null ? euro(Number(entry.new_price)) : '—'}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
