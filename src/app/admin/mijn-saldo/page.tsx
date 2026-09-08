import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from './Dashboard.module.css';
import PayoutForm from './PayoutForm';

export const dynamic = 'force-dynamic';

export default async function MijnSaldoPage() {
  const user = await requireCrmUser('/admin/mijn-saldo');
  const supabase = await createSupabaseServerClient();

  const { data: tech } = await supabase.from('technicians').select('id, name').eq('user_id', user.id).single();

  if (!tech) {
    return <div style={{ padding: '2rem' }}>Je account is nog niet gekoppeld.</div>;
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, car_make, car_model, service_type, quoted_price, final_price, commission_pct, status, scheduled_date')
    .eq('technician_id', tech.id)
    .eq('status', 'afgerond')
    .order('scheduled_date', { ascending: false });

  const { data: payouts } = await supabase
    .from('payout_requests')
    .select('amount, status')
    .eq('technician_id', tech.id);

  const completedJobs = jobs || [];
  
  let totalRevenue = 0;
  let totalEarnings = 0;
  const makeCounts: Record<string, number> = {};

  for (const job of completedJobs) {
    /*
     * What was actually charged, not what was quoted. A job that ran into a
     * second immobiliser and was settled at a different figure would otherwise
     * pay the monteur on the phone estimate.
     */
    const price = Number(job.final_price ?? job.quoted_price) || 0;
    /*
     * ?? and not ||: a technician on a 0% deal had `0 || 25` turn into 25, and
     * a quarter of their money vanished into a commission nobody agreed.
     */
    const comm = Number(job.commission_pct ?? 25);
    totalRevenue += price;
    totalEarnings += price * ((100 - comm) / 100);
    
    if (job.car_make) {
      makeCounts[job.car_make] = (makeCounts[job.car_make] || 0) + price;
    }
  }

  /*
   * A rejected request is not money that left. The old sum counted every row
   * whatever its status — it read `status` and never used it — so a refusal
   * permanently reduced what the monteur could draw, in our favour.
   *
   * Pending still holds the amount back, because otherwise the same money can
   * be requested twice; it is shown separately so it does not read as paid.
   */
  const paidOut = (payouts || [])
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingOut = (payouts || [])
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalWithdrawn = paidOut;
  const availableBalance = Math.max(0, totalEarnings - paidOut - pendingOut);
  
  const avgPrice = completedJobs.length > 0 ? (totalRevenue / completedJobs.length) : 0;
  
  // Progress for Revenue Target (e.g. € 5000)
  const target = 5000;
  const progressPct = Math.min(100, Math.round((totalRevenue / target) * 100));
  const strokeDash = `${(progressPct / 100) * 125.6} 125.6`;

  // Sort top makes
  const topMakes = Object.entries(makeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Overzicht (Mijn Saldo)</h1>
        <PayoutForm availableBalance={availableBalance} />
      </header>

      {/* TOP CARDS */}
      <div className={styles.grid4}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Klussen Afgerond
            <svg width="60" height="20" viewBox="0 0 60 20"><path d="M0,15 L15,10 L30,12 L45,5 L60,2" fill="none" stroke="#3b82f6" strokeWidth="2"/><path d="M0,20 L0,15 L15,10 L30,12 L45,5 L60,2 L60,20 Z" fill="rgba(59, 130, 246, 0.1)"/></svg>
          </div>
          <div className={styles.cardValue}>{completedJobs.length}</div>
          <div className={styles.cardTrend}>
            <span className={styles.trendUp}>↑ 12%</span> <span className={styles.trendText}>vs vorige maand</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Beschikbaar Saldo
            <svg width="60" height="20" viewBox="0 0 60 20"><path d="M0,18 L15,12 L30,15 L45,8 L60,5" fill="none" stroke="#f97316" strokeWidth="2"/><path d="M0,20 L0,18 L15,12 L30,15 L45,8 L60,5 L60,20 Z" fill="rgba(249, 115, 22, 0.1)"/></svg>
          </div>
          <div className={styles.cardValue}>€ {availableBalance.toFixed(0)}</div>
          <div className={styles.cardTrend}>
            <span className={styles.trendUp}>↑ 5%</span> <span className={styles.trendText}>vs vorige maand</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Totale Omzet
            <svg width="60" height="20" viewBox="0 0 60 20"><path d="M0,10 L15,8 L30,12 L45,4 L60,2" fill="none" stroke="#eab308" strokeWidth="2"/><path d="M0,20 L0,10 L15,8 L30,12 L45,4 L60,2 L60,20 Z" fill="rgba(234, 179, 8, 0.1)"/></svg>
          </div>
          <div className={styles.cardValue}>€ {totalRevenue.toFixed(0)}</div>
          <div className={styles.cardTrend}>
            <span className={styles.trendUp}>↑ 18%</span> <span className={styles.trendText}>vs vorige maand</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Gemiddelde Prijs
            <svg width="60" height="20" viewBox="0 0 60 20"><path d="M0,5 L15,12 L30,8 L45,15 L60,10" fill="none" stroke="#10b981" strokeWidth="2"/><path d="M0,20 L0,5 L15,12 L30,8 L45,15 L60,10 L60,20 Z" fill="rgba(16, 185, 129, 0.1)"/></svg>
          </div>
          <div className={styles.cardValue}>€ {avgPrice.toFixed(0)}</div>
          <div className={styles.cardTrend}>
            <span className={styles.trendDown}>↓ 2%</span> <span className={styles.trendText}>vs vorige maand</span>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Omzet Trend (Laatste 7 dagen)</div>
            <select className={styles.chartSelect}><option>Deze week</option></select>
          </div>
          <div style={{ height: '200px', width: '100%', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
              <path d="M0,100 L50,80 L100,90 L150,50 L200,60 L250,90 L300,40 L350,50 L400,20" fill="none" stroke="#60a5fa" strokeWidth="2"/>
              <path d="M0,150 L0,100 L50,80 L100,90 L150,50 L200,60 L250,90 L300,40 L350,50 L400,20 L400,150 Z" fill="rgba(96, 165, 250, 0.05)"/>
            </svg>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', padding: '0 10px' }}>
              <span>Ma</span><span>Di</span><span>Wo</span><span>Do</span><span>Vr</span><span>Za</span><span>Zo</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Maanddoel</div>
            <select className={styles.chartSelect}><option>Deze maand</option></select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <svg width="200" height="100" viewBox="0 0 100 50">
              <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#334155" strokeWidth="15" strokeLinecap="round" />
              <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#60a5fa" strokeWidth="15" strokeLinecap="round" strokeDasharray={strokeDash} />
            </svg>
            <div style={{ marginTop: '-20px', fontSize: '2rem', fontWeight: 'bold' }}>{progressPct}%</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '20px', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>€0</span>
              <span>Doel: €5.000</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Soort Klussen (Analyse)</div>
            <select className={styles.chartSelect}><option>Deze week</option></select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <svg width="150" height="150" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#334155" strokeWidth="6"></circle>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray="60 40" strokeDashoffset="25"></circle>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#60a5fa" strokeWidth="6" strokeDasharray="30 70" strokeDashoffset="-35"></circle>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#bfdbfe" strokeWidth="6" strokeDasharray="10 90" strokeDashoffset="-65"></circle>
            </svg>
            <div style={{ marginLeft: '2rem' }}>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#f8fafc' }}><span style={{ color: '#3b82f6' }}>●</span> Bijmaken (60%)</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#f8fafc' }}><span style={{ color: '#60a5fa' }}>●</span> Kwijt (30%)</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#f8fafc' }}><span style={{ color: '#bfdbfe' }}>●</span> Slot (10%)</div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Top Automerken</div>
            <select className={styles.chartSelect}><option>Deze maand</option></select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className={styles.listRow} style={{ color: '#94a3b8', borderBottom: 'none' }}>
              <span>Automerk</span>
              <span>Omzet</span>
            </div>
            {topMakes.length === 0 ? (
              <div className={styles.listRow}>Geen data</div>
            ) : (
              topMakes.map(([make, amount]) => (
                <div key={make} className={styles.listRow}>
                  <span style={{ fontWeight: 500, color: '#f8fafc' }}>{make}</span>
                  <span style={{ color: '#94a3b8' }}>€ {amount}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FULL WIDTH ROW: HISTORY */}
      <div className={styles.card} style={{ marginTop: '1.5rem' }}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>Transactiegeschiedenis (Recente Klussen)</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.listRow} style={{ color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
            <span style={{ flex: 2 }}>Voertuig & Datum</span>
            <span style={{ flex: 1 }}>Dienst</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Klant betaalde</span>
            <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>Jouw verdienste</span>
          </div>
          {completedJobs.length === 0 ? (
            <div className={styles.listRow} style={{ padding: '1rem 0' }}>Geen afgeronde klussen gevonden.</div>
          ) : (
            completedJobs.slice(0, 50).map(job => {
              const price = Number(job.final_price ?? job.quoted_price) || 0;
              const comm = Number(job.commission_pct ?? 25);
              const earned = price * ((100 - comm) / 100);

              // Date formatting safely
              const dateStr = job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Onbekend';

              return (
                <div key={job.id} className={styles.listRow} style={{ padding: '1rem 0', alignItems: 'center' }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontWeight: 500, color: '#f8fafc' }}>{job.car_make} {job.car_model}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dateStr}</div>
                  </div>
                  <div style={{ flex: 1, color: '#94a3b8' }}>
                    {job.service_type || 'Sleutel bijmaken'}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', color: '#94a3b8' }}>
                    € {price.toFixed(2).replace('.', ',')}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                    + € {earned.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
