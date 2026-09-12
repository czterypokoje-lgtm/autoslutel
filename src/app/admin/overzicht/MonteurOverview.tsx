import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Car, MapPin, Wrench } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isoDate, slotLabel, JOB_STATUS_LABELS, type JobStatus } from '@/lib/crmJobs';
import { earnedOn, computeAvailable } from '@/lib/technicianBalance';
import { PageHead, Card, CardHead, Row, Notice, Empty } from '../_ui';
import { HighlightCard, BarChart, chart } from '../_ui/charts';
import styles from './overzicht.module.css';
import type { CrmUser } from '@/lib/crmSession';

const euro = (value: number) => `€ ${value.toFixed(2).replace('.', ',')}`;
const euroHeadline = (value: number) =>
  value >= 1000 ? `€ ${Math.round(value).toLocaleString('nl-NL')}` : `€ ${value.toFixed(2).replace('.', ',')}`;

const DAY_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

/** Same accent-by-status treatment as the Vandaag job card, for one visual language. */
const STATUS_ACCENT: Record<string, string> = {
  gepland: 'var(--crm-steel)',
  onderweg: 'var(--crm-warn)',
  bezig: 'var(--crm-warn)',
  afgerond: 'var(--crm-ok)',
  geannuleerd: 'var(--crm-muted)',
};

function delta(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

/** Monday of the week containing `date`, at local midnight. */
function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * The technician's homepage.
 *
 * Glanced at before getting in the van, not analyzed — so it leads with the
 * one thing that matters most right now (the next job) and summarizes what
 * Vandaag/Mijn saldo/Aanbod already show in full, rather than repeating them.
 */
export default async function MonteurOverview({ user }: { user: CrmUser }) {
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
  const monday = mondayOf(now);
  const mondayISO = isoDate(monday);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextMondayISO = isoDate(nextMonday);
  const lastMonday = new Date(monday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastMondayISO = isoDate(lastMonday);

  const [
    { data: todayJobs },
    { data: weekJobs },
    { count: lastWeekCount },
    { data: doneJobs },
    { data: payouts },
    { count: offerCount },
    { data: stock },
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select(
        'id, status, slot_start, slot_end, city, postcode, service_type, car_make, car_model, car_year, keyless, final_price, quoted_price, commission_pct'
      )
      .eq('technician_id', tech.id)
      .eq('scheduled_date', today)
      .order('slot_start', { ascending: true }),
    supabase
      .from('jobs')
      .select('id, scheduled_date, status')
      .eq('technician_id', tech.id)
      .gte('scheduled_date', mondayISO)
      .lt('scheduled_date', nextMondayISO),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('technician_id', tech.id)
      .gte('scheduled_date', lastMondayISO)
      .lt('scheduled_date', mondayISO),
    supabase
      .from('jobs')
      .select('final_price, quoted_price, commission_pct')
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

  const earnedToday = finishedToday.reduce((sum, j) => sum + earnedOn(j), 0);
  const available = computeAvailable(doneJobs ?? [], payouts ?? []);

  const thisWeekCount = (weekJobs ?? []).length;
  const pendingPayout = (payouts ?? [])
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const lowStock = (stock ?? []).filter(
    (s) => s.min_quantity !== null && Number(s.quantity) <= Number(s.min_quantity)
  ).length;

  /* ── this week, per day ── */
  const weekBars = DAY_LABELS.map((label, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(dayDate.getDate() + index);
    const dayISO = isoDate(dayDate);
    const count = (weekJobs ?? []).filter((j) => j.scheduled_date === dayISO && j.status !== 'geannuleerd').length;
    return { label, value: count };
  });

  const address = next ? [next.postcode, next.city].filter(Boolean).join(' ') : '';
  const car = next ? [next.car_make, next.car_model, next.car_year].filter(Boolean).join(' ') : '';

  return (
    <>
      <PageHead title="Overzicht" sub={`Hallo ${tech.name.split(' ')[0]}, dit is uw dag.`} />

      <div
        className={styles.heroWrap}
        style={{ '--hero-accent': next ? STATUS_ACCENT[next.status] : 'var(--crm-rule)' } as CSSProperties}
      >
      <Card className={styles.hero}>
        <CardHead>Volgende klus</CardHead>
        {!next ? (
          <Empty>
            {finishedToday.length > 0
              ? `Geen klussen meer vandaag — ${finishedToday.length} afgerond.`
              : 'Geen klussen gepland voor vandaag.'}
          </Empty>
        ) : (
          <div className={styles.heroBody}>
            <div className={styles.heroSlot}>
              {slotLabel(next.slot_start, next.slot_end)} · {JOB_STATUS_LABELS[next.status as JobStatus] ?? next.status}
            </div>
            {car && (
              <div className={styles.heroLine}>
                <Car size={18} strokeWidth={2} className={styles.heroIcon} />
                {car}
                {next.keyless !== null && (
                  <span className={styles.heroBadge}>{next.keyless ? 'Keyless' : 'Sleutel'}</span>
                )}
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
        <Link href="/admin/vandaag" className={styles.heroLink}>
          Bekijk alle klussen vandaag →
        </Link>
      </Card>
      </div>

      <div className={chart.highlights}>
        <HighlightCard label="Vandaag verdiend" value={euroHeadline(earnedToday)} delta={null} tint />
        <HighlightCard label="Deze week klussen" value={thisWeekCount} delta={delta(thisWeekCount, lastWeekCount ?? 0)} />
        <HighlightCard label="Beschikbaar" value={euroHeadline(available)} delta={null} tint />
        <HighlightCard label="Open aanbod" value={offerCount ?? 0} delta={null} />
      </div>

      {(lowStock > 0 || pendingPayout > 0) && (
        <Card className={styles.stack}>
          <CardHead>Even checken</CardHead>
          {lowStock > 0 && (
            <Row title="Lage voorraad in uw bus" meta={`${lowStock} artikel${lowStock === 1 ? '' : 'en'}`} href="/admin/mijn-bus" />
          )}
          {pendingPayout > 0 && (
            <Row title="Uitbetaling aangevraagd" meta={euro(pendingPayout)} href="/admin/mijn-saldo" />
          )}
        </Card>
      )}

      <Card padded>
        <strong className={styles.cardLabel}>Week vooruitblik</strong>
        <BarChart bars={weekBars} format={(v) => String(v)} />
      </Card>
    </>
  );
}
