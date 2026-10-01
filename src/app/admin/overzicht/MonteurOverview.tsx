import Link from 'next/link';
import type { CSSProperties } from 'react';
import { CalendarDays, Car, Handshake, MapPin, Package, Wallet, Wrench } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { addDays, isoDate, slotLabel, weekStart, JOB_STATUS_LABELS, type JobStatus } from '@/lib/crmJobs';
import { earnedOn, priceOf, computeAvailable } from '@/lib/technicianBalance';
import { stockStatus } from '@/lib/stockStatus';
import { SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import { PageHead, Card, CardHead, Row, Notice, Empty, Label, TileGrid, Tile } from '../_ui';
import BrandLogo from './BrandLogo';
import SalesChart from './SalesChart';
import { PERIOD_LABEL, type Period } from './dashboardData';
import styles from './overzicht.module.css';
import dash from './dashboard.module.css';
import type { CrmUser } from '@/lib/crmSession';

/**
 * What every technician puts in when they join. Not stored per person yet:
 * when amounts start to differ, this becomes a column on technicians.
 */
const START_INVESTMENT = 500;

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const EUR2 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

const STATUS_ACCENT: Record<string, string> = {
  gepland: 'var(--crm-steel)',
  onderweg: 'var(--crm-warn)',
  bezig: 'var(--crm-warn)',
  afgerond: 'var(--crm-ok)',
  geannuleerd: 'var(--crm-muted)',
};

interface DoneJob {
  id: string;
  final_price: number | string | null;
  quoted_price: number | string | null;
  commission_pct: number | string | null;
  scheduled_date: string | null;
  completed_at: string | null;
  city: string | null;
  car_make: string | null;
  car_model: string | null;
  scenario: string | null;
  service_type: string | null;
}

/** The day a finished job counts on: when it was finished, else when it was planned. */
const dayOf = (j: DoneJob) => (j.completed_at ? isoDate(new Date(j.completed_at)) : (j.scheduled_date ?? '').slice(0, 10));

function ranges(period: Period, today: string) {
  if (period === 'vandaag') return { cur: [today, today], prev: [addDays(today, -1), addDays(today, -1)] };
  if (period === 'week') {
    const mon = weekStart(today);
    const n = Math.round((Date.parse(today) - Date.parse(mon)) / 86_400_000);
    return { cur: [mon, today], prev: [addDays(mon, -7), addDays(mon, n - 7)] };
  }
  const first = `${today.slice(0, 7)}-01`;
  const prevFirst = addDays(first, -1).slice(0, 7) + '-01';
  const prevEnd = addDays(prevFirst, Number(today.slice(8)) - 1);
  const lastOfPrev = addDays(first, -1);
  return { cur: [first, today], prev: [prevFirst, prevEnd < lastOfPrev ? prevEnd : lastOfPrev] };
}

function Trend({ cur, prev }: { cur: number; prev: number }) {
  if (!prev) return <span className={dash.trendNone}>geen vergelijking</span>;
  const change = Math.round(((cur - prev) / prev) * 100);
  return (
    <span className={change >= 0 ? dash.trendUp : dash.trendDown}>
      {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs vorige
    </span>
  );
}

/**
 * The technician's home: their next job, their investment, their own
 * numbers. Every query is scoped to their technician row, and the database
 * policies only return their own jobs anyway — nothing here widens access.
 */
export default async function MonteurOverview({ user, period }: { user: CrmUser; period: Period }) {
  const supabase = await createSupabaseServerClient();

  const { data: tech } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tech) {
    return (
      <>
        <PageHead title="Overzicht" />
        <Notice tone="bad">Uw login is nog niet aan een monteur gekoppeld.</Notice>
      </>
    );
  }

  const now = new Date();
  const today = isoDate(now);
  const mon = weekStart(today);

  const [{ data: todayJobs }, { data: weekJobs }, { data: doneJobs }, { data: payouts }, { count: offerCount }, { data: stock }] =
    await Promise.all([
      supabase
        .from('jobs')
        .select('id, status, slot_start, slot_end, city, postcode, service_type, car_make, car_model, car_year, keyless')
        .eq('technician_id', tech.id)
        .eq('scheduled_date', today)
        .order('slot_start', { ascending: true }),
      supabase
        .from('jobs')
        .select('id')
        .eq('technician_id', tech.id)
        .gte('scheduled_date', mon)
        .lte('scheduled_date', addDays(mon, 6))
        .neq('status', 'geannuleerd'),
      supabase
        .from('jobs')
        .select('id, final_price, quoted_price, commission_pct, scheduled_date, completed_at, city, car_make, car_model, scenario, service_type')
        .eq('technician_id', tech.id)
        .eq('status', 'afgerond'),
      supabase.from('payout_requests').select('amount, status').eq('technician_id', tech.id),
      supabase
        .from('job_offers')
        .select('id', { count: 'exact', head: true })
        .eq('technician_id', tech.id)
        .is('responded_at', null)
        .gt('expires_at', now.toISOString()),
      supabase.from('stock_items').select('quantity, min_quantity').eq('technician_id', tech.id),
    ]);

  const jobsToday = todayJobs ?? [];
  const upcoming = jobsToday.filter((j) => j.status === 'gepland' || j.status === 'onderweg' || j.status === 'bezig');
  const next = upcoming[0] ?? null;
  const finishedToday = jobsToday.filter((j) => j.status === 'afgerond');

  const done = ((doneJobs ?? []) as DoneJob[]).sort((a, b) => dayOf(b).localeCompare(dayOf(a)));
  const available = computeAvailable(done, payouts ?? []);
  const pendingPayout = (payouts ?? []).filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const outOfStock = (stock ?? []).filter((s) => stockStatus(s) === 'out').length;
  const lowStock = (stock ?? []).filter((s) => stockStatus(s) === 'low').length;
  const weekCount = (weekJobs ?? []).length;

  /* ── investment: earned back from everything ever finished ── */
  const earnedAll = done.reduce((s, j) => s + earnedOn(j), 0);
  const backPct = Math.min(100, Math.round((earnedAll / START_INVESTMENT) * 100));
  const beyond = earnedAll - START_INVESTMENT;
  const avgEarn = done.length ? earnedAll / done.length : 0;
  const jobsToGo = beyond < 0 && avgEarn > 0 ? Math.ceil(-beyond / avgEarn) : null;

  /* ── this period vs the one before ── */
  const { cur, prev } = ranges(period, today);
  const inR = (r: string[]) => done.filter((j) => dayOf(j) >= r[0] && dayOf(j) <= r[1]);
  const curJobs = inR(cur);
  const prevJobs = inR(prev);
  const sum = (list: DoneJob[], f: (j: DoneJob) => number) => list.reduce((s, j) => s + f(j), 0);
  const k = {
    jobs: [curJobs.length, prevJobs.length],
    revenue: [sum(curJobs, priceOf), sum(prevJobs, priceOf)],
    earned: [sum(curJobs, earnedOn), sum(prevJobs, earnedOn)],
  };
  const avgCur = curJobs.length ? k.earned[0] / curJobs.length : 0;
  const avgPrev = prevJobs.length ? k.earned[1] / prevJobs.length : 0;

  /* ── per day, for the chart ── */
  const days = period === 'maand' ? 30 : 14;
  const series = Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    const list = done.filter((j) => dayOf(j) === day);
    return { day, revenue: sum(list, priceOf), margin: sum(list, earnedOn), leads: list.length };
  });

  const address = next ? [next.postcode, next.city].filter(Boolean).join(' ') : '';
  const car = next ? [next.car_make, next.car_model, next.car_year].filter(Boolean).join(' ') : '';
  const serviceOf = (j: DoneJob) =>
    j.service_type || (j.scenario ? (SCENARIO_INFO[j.scenario as Scenario]?.label ?? j.scenario) : 'Klus');
  const shortDate = (iso: string) =>
    new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(`${iso}T12:00:00Z`));

  return (
    <>
      <PageHead
        title={`Hallo ${tech.name.split(' ')[0]}`}
        sub={`${jobsToday.length} ${jobsToday.length === 1 ? 'klus' : 'klussen'} vandaag · ${finishedToday.length} afgerond`}
      />

      <div
        className={styles.heroWrap}
        style={{ '--hero-accent': next ? STATUS_ACCENT[next.status] : 'var(--crm-rule)' } as CSSProperties}
      >
        <Card className={styles.hero}>
          <CardHead>
            Volgende klus
            {upcoming.length > 0 && (
              <span className={styles.heroCount}>
                · {upcoming.length} {upcoming.length === 1 ? 'klus' : 'klussen'} nog te gaan
              </span>
            )}
          </CardHead>
          {!next ? (
            <Empty>
              {finishedToday.length > 0
                ? `Geen klussen meer vandaag — ${finishedToday.length} afgerond. Goed gedaan!`
                : 'Geen klussen gepland voor vandaag.'}
            </Empty>
          ) : (
            <div className={styles.heroBody}>
              <div className={styles.heroSlot}>
                {slotLabel(next.slot_start, next.slot_end)} · {JOB_STATUS_LABELS[next.status as JobStatus] ?? next.status}
              </div>
              {car && (
                <div className={styles.heroLine}>
                  {next.car_make ? <BrandLogo make={next.car_make} /> : <Car size={18} strokeWidth={2} className={styles.heroIcon} />}
                  {car}
                  {next.keyless !== null && <span className={styles.heroBadge}>{next.keyless ? 'Keyless' : 'Sleutel'}</span>}
                </div>
              )}
              <div className={styles.heroLine}>
                <MapPin size={16} strokeWidth={2} className={styles.heroIcon} />
                {address || 'Geen adres'}
              </div>
              <div className={styles.heroLine}>
                <Wrench size={14} strokeWidth={2} className={styles.heroIcon} />
                {next.service_type ?? 'geen dienst'}
              </div>
            </div>
          )}
          {upcoming.length > 1 && (
            <div className={styles.heroUpcoming}>
              {upcoming.slice(1).map((job) => (
                <Row
                  key={job.id}
                  title={[job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ') || 'Klus'}
                  note={job.service_type ?? undefined}
                  meta={`${slotLabel(job.slot_start, job.slot_end)} · ${job.city || '—'}`}
                />
              ))}
            </div>
          )}
          <Link href="/admin/vandaag" className={styles.heroStart}>
            {next?.status === 'gepland' ? 'Start: ik ga rijden' : 'Open Vandaag'}
          </Link>
        </Card>
      </div>

      <section className={styles.invest} aria-label="Jouw investering">
        <div className={styles.investTop}>
          <div>
            <span className={styles.investLabel}>Jouw investering</span>
            <span className={styles.investBig}>{EUR.format(START_INVESTMENT)}</span>
          </div>
          <div className={styles.investRight}>
            <span className={styles.investLabel}>{beyond >= 0 ? 'Winst boven je investering' : 'Terugverdiend'}</span>
            <span className={beyond >= 0 ? styles.investWin : styles.investBig}>
              {beyond >= 0 ? `+ ${EUR.format(beyond)}` : EUR.format(earnedAll)}
            </span>
          </div>
        </div>
        <div className={styles.investBar} role="progressbar" aria-valuenow={backPct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${backPct}%` }} />
        </div>
        <p className={styles.investFoot}>
          {beyond >= 0
            ? `Terugverdiend in ${done.length} klussen. Alles wat je nu verdient is winst: ${EUR.format(earnedAll)} totaal verdiend.`
            : `${backPct}% terugverdiend · nog ${EUR.format(-beyond)} te gaan${jobsToGo ? `, ongeveer ${jobsToGo} ${jobsToGo === 1 ? 'klus' : 'klussen'}` : ''}.`}
        </p>
      </section>

      <Label>Snel naar</Label>
      <TileGrid>
        <Tile
          big
          tone="accent"
          href="/admin/aanbod"
          icon={<Handshake size={26} strokeWidth={1.8} />}
          title="Aanbod"
          sub={offerCount ? `${offerCount} nieuwe klus${offerCount === 1 ? '' : 'sen'} aangeboden` : 'Nu geen aanbod'}
        />
        <Tile href="/admin/mijn-agenda" iconTone="steel" icon={<CalendarDays size={20} strokeWidth={1.8} />} title="Mijn agenda" sub={`${weekCount} klussen deze week`} />
        <Tile href="/admin/mijn-bus" iconTone={outOfStock || lowStock ? 'warn' : undefined} icon={<Package size={20} strokeWidth={1.8} />} title="Mijn bus" sub={outOfStock || lowStock ? `${outOfStock + lowStock} bijna op` : 'Voorraad in orde'} />
        <Tile href="/admin/mijn-saldo" iconTone="ok" icon={<Wallet size={20} strokeWidth={1.8} />} title="Saldo" sub={`${EUR2.format(available)} beschikbaar${pendingPayout ? ' · uitbetaling aangevraagd' : ''}`} />
      </TileGrid>

      <div className={dash.kpiHead}>
        <Label>Mijn cijfers · {PERIOD_LABEL[period].toLowerCase()}</Label>
        <nav className={dash.periods} aria-label="Periode">
          {(['vandaag', 'week', 'maand'] as Period[]).map((p) => (
            <Link key={p} href={`/admin/overzicht?periode=${p}`} className={p === period ? dash.periodOn : dash.period}>
              {PERIOD_LABEL[p]}
            </Link>
          ))}
        </nav>
      </div>
      <div className={dash.kpis}>
        <div className={`${dash.kpi} ${dash.kpiStrong}`}>
          <span className={dash.kpiLabel}>Jij verdiende</span>
          <span className={dash.kpiValue}>{EUR.format(k.earned[0])}</span>
          <Trend cur={k.earned[0]} prev={k.earned[1]} />
          <span className={dash.kpiFoot}>na commissie</span>
        </div>
        <div className={dash.kpi}>
          <span className={dash.kpiLabel}>Klussen afgerond</span>
          <span className={dash.kpiValue}>{k.jobs[0]}</span>
          <Trend cur={k.jobs[0]} prev={k.jobs[1]} />
        </div>
        <div className={dash.kpi}>
          <span className={dash.kpiLabel}>Omzet klanten</span>
          <span className={dash.kpiValue}>{EUR.format(k.revenue[0])}</span>
          <Trend cur={k.revenue[0]} prev={k.revenue[1]} />
          <span className={dash.kpiFoot}>wat de klanten betaalden</span>
        </div>
        <div className={dash.kpi}>
          <span className={dash.kpiLabel}>Gemiddeld per klus</span>
          <span className={dash.kpiValue}>{EUR.format(avgCur)}</span>
          <Trend cur={avgCur} prev={avgPrev} />
          <span className={dash.kpiFoot}>jouw deel per klus</span>
        </div>
      </div>

      <section className={dash.card}>
        <header className={dash.cardHead}>
          <span>Per dag · laatste {days} dagen</span>
          <Link href="/admin/mijn-saldo">Saldo →</Link>
        </header>
        <SalesChart data={series} barLabel="Omzet" lineLabel="Jij verdiende" countLabel="klussen" />
      </section>

      <section className={dash.card}>
        <header className={dash.cardHead}>
          <span>Mijn klussen · {done.length} afgerond</span>
          <Link href="/admin/mijn-klussen">Alles →</Link>
        </header>
        {done.length === 0 ? (
          <p className={dash.empty}>Nog geen afgeronde klussen. Je eerste verschijnt hier.</p>
        ) : (
          <table className={dash.table}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Auto en klus</th>
                <th>Waar</th>
                <th className={dash.num}>Klant betaalde</th>
                <th className={dash.num}>Jij kreeg</th>
              </tr>
            </thead>
            <tbody>
              {done.slice(0, 10).map((j) => (
                <tr key={j.id}>
                  <td>{shortDate(dayOf(j))}</td>
                  <td>
                    <span className={styles.jobCell}>
                      <BrandLogo make={j.car_make} />
                      <span>
                        <b>{[j.car_make, j.car_model].filter(Boolean).join(' ') || 'Auto'}</b>
                        <span className={dash.muted}> · {serviceOf(j)}</span>
                      </span>
                    </span>
                  </td>
                  <td>{j.city ?? '—'}</td>
                  <td className={dash.num}>{EUR2.format(priceOf(j))}</td>
                  <td className={dash.num}>
                    <b>{EUR2.format(earnedOn(j))}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {(outOfStock > 0 || lowStock > 0) && (
        <Card className={styles.stack}>
          <CardHead>Even checken</CardHead>
          {outOfStock > 0 && <Row title="Artikelen op in je bus" meta={`${outOfStock} artikel${outOfStock === 1 ? '' : 'en'}`} href="/admin/mijn-bus" />}
          {lowStock > 0 && <Row title="Bijna op in je bus" meta={`${lowStock} artikel${lowStock === 1 ? '' : 'en'}`} href="/admin/mijn-bus" />}
        </Card>
      )}
    </>
  );
}
