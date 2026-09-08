import { BadgeEuro, CheckCircle2, Coins, TrendingUp } from 'lucide-react';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, StatGrid, Stat, Card, CardHead, Badge, Empty, Notice, Table, ui } from '../_ui';
import { SCENARIO_INFO, isScenario } from '@/lib/scenarios';
import PayoutForm from './PayoutForm';

export const dynamic = 'force-dynamic';

const euro = (value: number) => `€ ${value.toFixed(2).replace('.', ',')}`;

/**
 * What this technician earned, and what they can draw.
 *
 * Every figure here comes from their own completed jobs. The version this
 * replaces printed "↑ 12% vs vorige maand" beside every tile, a revenue curve
 * with an invented shape, and a job-type ring reading 60/30/10 — none of it
 * from the database. A number somebody cannot trust is worse than no number,
 * because they stop believing the ones that are real as well.
 *
 * Where there is nothing to compare against yet, no comparison is shown.
 * "Geen vergelijking" is the honest answer in a technician's first month.
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
        'id, car_make, car_model, scenario, service_type, quoted_price, final_price, commission_pct, scheduled_date'
      )
      .eq('technician_id', tech.id)
      .eq('status', 'afgerond')
      .order('scheduled_date', { ascending: false }),
    supabase.from('payout_requests').select('amount, status').eq('technician_id', tech.id),
  ]);

  const done = jobs ?? [];

  /** What was charged, not what was quoted; the agreed commission even at 0%. */
  const priceOf = (job: (typeof done)[number]) => Number(job.final_price ?? job.quoted_price) || 0;
  const earnedOn = (job: (typeof done)[number]) =>
    priceOf(job) * ((100 - Number(job.commission_pct ?? 25)) / 100);

  const revenue = done.reduce((total, job) => total + priceOf(job), 0);
  const earned = done.reduce((total, job) => total + earnedOn(job), 0);

  const paidOut = (payouts ?? [])
    .filter((p) => p.status === 'paid')
    .reduce((total, p) => total + Number(p.amount), 0);
  const pendingOut = (payouts ?? [])
    .filter((p) => p.status === 'pending')
    .reduce((total, p) => total + Number(p.amount), 0);

  const available = Math.max(0, earned - paidOut - pendingOut);

  /* ── this month against last, from the rows themselves ── */
  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = monthKey(now);
  const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const inMonth = (key: string) => done.filter((job) => (job.scheduled_date ?? '').startsWith(key));
  const revenueThis = inMonth(thisMonth).reduce((total, job) => total + priceOf(job), 0);
  const revenueLast = inMonth(lastMonth).reduce((total, job) => total + priceOf(job), 0);

  /** Null when last month holds nothing to compare with — not 0%, not a guess. */
  const change = revenueLast > 0 ? Math.round(((revenueThis - revenueLast) / revenueLast) * 100) : null;
  const changeText =
    change == null
      ? 'geen vergelijking met vorige maand'
      : `${change >= 0 ? '+' : ''}${change}% t.o.v. vorige maand`;

  const average = done.length ? revenue / done.length : 0;

  /* ── what kind of work this actually was ── */
  const byKind = new Map<string, { count: number; revenue: number }>();
  for (const job of done) {
    const label = isScenario(job.scenario)
      ? SCENARIO_INFO[job.scenario].label
      : (job.service_type ?? 'Overig');
    const entry = byKind.get(label) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += priceOf(job);
    byKind.set(label, entry);
  }
  const kinds = [...byKind].sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <>
      <PageHead
        title="Mijn saldo"
        sub="Wat u heeft verdiend op klussen via Autosleutel24, en wat u kunt opnemen."
        actions={<PayoutForm available={available} />}
      />

      <StatGrid>
        <Stat
          label="Beschikbaar"
          value={euro(available)}
          foot={pendingOut > 0 ? `${euro(pendingOut)} in behandeling` : 'direct op te nemen'}
          icon={<Coins size={15} strokeWidth={2} />}
          tone={available > 0 ? 'ok' : undefined}
        />
        <Stat
          label="Klussen afgerond"
          value={done.length}
          foot={`${inMonth(thisMonth).length} deze maand`}
          icon={<CheckCircle2 size={15} strokeWidth={2} />}
        />
        <Stat
          label="Omzet"
          value={euro(revenue)}
          foot={changeText}
          icon={<TrendingUp size={15} strokeWidth={2} />}
          tone={change == null ? undefined : change >= 0 ? 'ok' : 'warn'}
        />
        <Stat
          label="Gemiddelde klus"
          value={done.length ? euro(average) : '—'}
          foot={done.length ? 'over alle afgeronde klussen' : 'nog geen klussen'}
          icon={<BadgeEuro size={15} strokeWidth={2} />}
        />
      </StatGrid>

      <Card>
        <CardHead>Soort werk</CardHead>
        {kinds.length === 0 ? (
          <Empty>Nog geen afgeronde klussen.</Empty>
        ) : (
          <div style={{ padding: 'var(--sp-4) var(--sp-5)', display: 'grid', gap: 'var(--sp-3)' }}>
            {kinds.map(([label, entry]) => {
              const share = revenue > 0 ? Math.round((entry.revenue / revenue) * 100) : 0;
              return (
                <div key={label} style={{ display: 'grid', gap: 'var(--sp-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)' }}>
                    <span style={{ color: 'var(--crm-ink)', fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                      {label}
                    </span>
                    <span className={ui.hint}>
                      {entry.count}× · {euro(entry.revenue)}
                    </span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--crm-muted)',
                        fontSize: 'var(--fs-label)',
                      }}
                    >
                      {share}%
                    </span>
                  </div>
                  {/*
                    A bar, not a ring. Five kinds of work compare by length far
                    more easily than by wedge, and a bar needs no legend beside
                    it repeating the same words.
                  */}
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--crm-raised)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ width: `${share}%`, height: '100%', background: 'var(--crm-accent)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <h2 className={ui.section}>Afgeronde klussen</h2>
      <Card>
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
