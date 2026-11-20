import { PreviewText } from '@/app/admin/PreviewLanguage';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { CalendarDays, Car, Handshake, MapPin, Package, Wallet, Wrench } from 'lucide-react';
import { slotLabel, JOB_STATUS_LABELS, type JobStatus } from '@/lib/crmJobs';
import { earnedOn, priceOf } from '@/lib/technicianBalance';
import { PageHead, Card, CardHead, Row, Notice, Empty, Label, TileGrid, Tile } from '../_ui';
import BrandLogo from './BrandLogo';
import SalesChart from './SalesChart';
import InvestmentBar from './InvestmentBar';
import { PERIOD_LABEL, type Period } from './dashboardData';
import { dayOf, readMonteur, serviceOf, START_INVESTMENT } from './monteurData';
import styles from './overzicht.module.css';
import dash from './dashboard.module.css';
import type { CrmUser } from '@/lib/crmSession';

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const EUR2 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

const STATUS_ACCENT: Record<string, string> = {
  gepland: 'var(--crm-steel)',
  onderweg: 'var(--crm-warn)',
  bezig: 'var(--crm-warn)',
  afgerond: 'var(--crm-ok)',
  geannuleerd: 'var(--crm-muted)',
};

function Trend({ cur, prev }: { cur: number; prev: number }) {
  if (!prev) return <span className={dash.trendNone}><PreviewText>{"geen vergelijking"}</PreviewText></span>;
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
  const data = await readMonteur(user, period);

  if (!data) {
    return (
      <>
        <PageHead title="Overzicht" />
        <Notice tone="bad">Uw login is nog niet aan een monteur gekoppeld.</Notice>
      </>
    );
  }

  const {
    tech, jobsToday, upcoming, next, finishedToday, done, available, pendingPayout, outOfStock, lowStock,
    weekCount, monthJobs, earnedMonth, monthName, offerCount, k, avgCur, avgPrev, days, series, address, car,
  } = data;

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
                · {upcoming.length} <PreviewText>{upcoming.length === 1 ? 'klus' : 'klussen'}</PreviewText> nog te gaan
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

      <InvestmentBar investment={START_INVESTMENT} earned={earnedMonth} jobs={monthJobs.length} monthName={monthName} />

      <Label><PreviewText>{"Snel naar"}</PreviewText></Label>
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
          <span>Per dag · laatste {days} <PreviewText>{"dagen"}</PreviewText></span>
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
                <th><PreviewText>{"Datum"}</PreviewText></th>
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
