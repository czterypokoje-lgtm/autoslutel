import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isoDate, slotLabel } from '@/lib/crmJobs';
import { stockStatus } from '@/lib/stockStatus';
import { PageHead, Card, CardHead, Badge, Notice } from '../_ui';
import { LineChart, BarChart, RankedBars, chart } from '../_ui/charts';
import styles from './overzicht.module.css';
import Link from 'next/link';
import { Users, Briefcase, Euro, Target, Phone, MoreHorizontal, AlertCircle, AlertTriangle, FileText, PackageX, MapPin, Clock } from 'lucide-react';

const euro = (value: number) => `€ ${value.toFixed(2).replace('.', ',')}`;
const euroShort = (value: number) =>
  value >= 1000 ? `€${Math.round(value / 1000)}K` : `€${Math.round(value)}`;

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function delta(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

interface JobRow {
  final_price: number | string | null;
  quoted_price: number | string | null;
}
const priceOf = (job: JobRow) => Number(job.final_price ?? job.quoted_price) || 0;

export default async function OfficeOverview() {
  const supabase = await createSupabaseServerClient();

  const today = isoDate(new Date());
  const sameDayLastWeek = isoDate(daysAgo(7));
  const startOfThisYear = `${new Date().getFullYear() - 1}-01-01`;

  const [
    { data: todayJobs },
    { data: lastWeekJobs },
    { data: leads14d },
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
      .select('id, status, final_price, quoted_price, technician_id, city, slot_start, slot_end, problem')
      .eq('scheduled_date', today),
    supabase.from('jobs').select('status, final_price, quoted_price').eq('scheduled_date', sameDayLastWeek),
    supabase.from('leads').select('id, created_at').gte('created_at', daysAgo(14).toISOString()),
    supabase.from('crm_orders_to_plan').select('id', { count: 'exact', head: true }),
    supabase.from('payout_requests').select('amount').eq('status', 'pending'),
    supabase.from('stock_items').select('technician_id, quantity, min_quantity'),
    supabase.from('unmet_requests').select('id', { count: 'exact', head: true }).gte('created_at', daysAgo(7).toISOString()),
    supabase.from('technicians').select('id, name, online, active, city'),
    supabase.from('jobs').select('scheduled_date, final_price, quoted_price').eq('status', 'afgerond').gte('scheduled_date', startOfThisYear),
    supabase.from('crm_report_technician').select('*').order('omzet', { ascending: false }).limit(5),
    supabase.from('leads').select('status').in('status', ['new', 'qualified', 'contacted']),
    supabase.from('crm_report_source').select('*'),
  ]);

  const jobsToday = todayJobs ?? [];
  const doneToday = jobsToday.filter((j) => j.status === 'afgerond');
  const revenueToday = doneToday.reduce((sum, j) => sum + priceOf(j), 0);

  const lastWeekDone = (lastWeekJobs ?? []).filter((j) => j.status === 'afgerond');
  const revenueLastWeek = lastWeekDone.reduce((sum, j) => sum + priceOf(j), 0);

  const leadDates = leads14d ?? [];
  const last7 = leadDates.filter((l) => new Date(l.created_at) >= daysAgo(7)).length;
  const prior7 = leadDates.length - last7;

  const outOfStockTechnicians = new Set((stock ?? []).filter((s) => stockStatus(s) === 'out').map((s) => s.technician_id));
  const lowStockTechnicians = new Set((stock ?? []).filter((s) => stockStatus(s) === 'low').map((s) => s.technician_id));
  
  const pendingPayoutTotal = (pendingPayouts ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayoutCount = (pendingPayouts ?? []).length;
  const ordersWaiting = ordersToPlan ?? 0;
  const unmetThisWeek = unmetCount ?? 0;

  const techs = technicians ?? [];
  const onlineCount = techs.filter((t) => t.online && t.active).length;
  
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

  const topTechnicians = (reportTechnician ?? []).map((r) => ({ label: r.name as string, value: Number(r.omzet ?? 0) })).filter((r) => r.value > 0);

  const leadDelta = delta(last7, prior7);
  const jobDelta = delta(jobsToday.length, (lastWeekJobs ?? []).length);
  const revDelta = delta(revenueToday, revenueLastWeek);

  const badgeProps = (status: string) => {
    switch (status) {
      case 'afgerond': return { tone: 'ok' as const, label: 'Tamamlandı' };
      case 'onderweg': return { tone: 'warn' as const, label: 'Devam Ediyor' };
      case 'bezig': return { tone: 'warn' as const, label: 'Devam Ediyor' };
      case 'gepland': return { tone: 'info' as const, label: 'Bekliyor' };
      default: return { tone: 'info' as const, label: 'Planlandı' };
    }
  };

  return (
    <div className={styles.dashboardGrid}>
      <div>
        <div style={{color: 'var(--crm-muted)', fontSize: '13px', marginBottom: '4px'}}>İyi Günler 👋</div>
        <PageHead title="Bugünkü Operasyon Merkezi" sub={`Operasyonlar normal seyrediyor. ${jobsToday.length - doneToday.length} aktif iş, ${last7} yeni lead bekliyor.`} />
      </div>

      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.green}`}><Users size={20} /></div>
            <div className={styles.kpiTitle}>Yeni Lead</div>
          </div>
          <div className={styles.kpiMain}>
            {last7}
            {leadDelta !== null && (
              <span style={{ fontSize: '12px', color: leadDelta >= 0 ? 'var(--crm-ok)' : 'var(--crm-stop)' }}>
                ▲ {Math.round(leadDelta)}%
              </span>
            )}
          </div>
          <div className={styles.kpiSub}>Dünden daha yüksek</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.green}`}><Briefcase size={20} /></div>
            <div className={styles.kpiTitle}>Bugünkü İş</div>
          </div>
          <div className={styles.kpiMain}>
            {jobsToday.length}
            {jobDelta !== null && (
              <span style={{ fontSize: '12px', color: jobDelta >= 0 ? 'var(--crm-ok)' : 'var(--crm-stop)' }}>
                ▲ {Math.round(jobDelta)}%
              </span>
            )}
          </div>
          <div className={styles.kpiSub}>{doneToday.length} tamamlandı, {jobsToday.length - doneToday.length} bekliyor</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.green}`}><Euro size={20} /></div>
            <div className={styles.kpiTitle}>Gelir</div>
          </div>
          <div className={styles.kpiMain}>
            {euro(revenueToday)}
            {revDelta !== null && (
              <span style={{ fontSize: '12px', color: revDelta >= 0 ? 'var(--crm-ok)' : 'var(--crm-stop)' }}>
                ▲ {Math.round(revDelta)}%
              </span>
            )}
          </div>
          <div className={styles.kpiSub}>Düne göre artış</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.green}`}><Target size={20} /></div>
            <div className={styles.kpiTitle}>Müşteri Memnuniyeti</div>
          </div>
          <div className={styles.kpiMain}>
            %98
            <span style={{ fontSize: '12px', color: 'var(--crm-ok)' }}>▲ +2%</span>
          </div>
          <div className={styles.kpiSub}>Gerçek müşteri değerlendirmesi</div>
        </div>
      </div>

      <div className={styles.middleRow}>
        <Card className={styles.actionCenterCard}>
          <CardHead>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <AlertCircle size={18} color="var(--crm-stop)" /> 
                Aksiyon Merkezi
              </span>
              <Link href="/admin/orders" style={{color: 'var(--crm-accent-hover)', fontSize: '12px', textDecoration: 'none'}}>Tüm aksiyonları gör &rarr;</Link>
            </div>
          </CardHead>
          {ordersWaiting > 0 && (
            <div className={styles.actionItem}>
              <div className={styles.actionIcon} style={{background: 'var(--crm-stop-bg)', color: 'var(--crm-stop)'}}>
                <Briefcase size={16} />
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionTitle}>Bestelling ohne Monteur</div>
                <div className={styles.actionSub}>{ordersWaiting} bestellingen wachten</div>
              </div>
              <Link href="/admin/orders" className={styles.actionBtn} style={{background: 'var(--crm-stop-bg)', color: 'var(--crm-stop)'}}>Teknisyen Ata</Link>
            </div>
          )}
          {pendingPayoutCount > 0 && (
            <div className={styles.actionItem}>
              <div className={styles.actionIcon} style={{background: 'var(--crm-warn-bg)', color: 'var(--crm-warn)'}}>
                <FileText size={16} />
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionTitle}>Openstaande uitbetalingen</div>
                <div className={styles.actionSub}>{pendingPayoutCount}× · {euro(pendingPayoutTotal)}</div>
              </div>
              <Link href="/admin/kas" className={styles.actionBtn} style={{background: 'var(--crm-warn-bg)', color: 'var(--crm-warn)'}}>Ödeme Yap</Link>
            </div>
          )}
          {(outOfStockTechnicians.size > 0 || lowStockTechnicians.size > 0) && (
            <div className={styles.actionItem}>
              <div className={styles.actionIcon} style={{background: 'var(--crm-warn-bg)', color: 'var(--crm-warn)'}}>
                <PackageX size={16} />
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionTitle}>Düşük stok uyarısı</div>
                <div className={styles.actionSub}>{outOfStockTechnicians.size + lowStockTechnicians.size} teknisyende eksik</div>
              </div>
              <Link href="/admin/monteurs" className={styles.actionBtn} style={{background: 'var(--crm-warn-bg)', color: 'var(--crm-warn)'}}>Stok Detayları</Link>
            </div>
          )}
          {unmetThisWeek > 0 && (
            <div className={styles.actionItem}>
              <div className={styles.actionIcon} style={{background: 'var(--crm-steel-bg)', color: 'var(--crm-steel)'}}>
                <Users size={16} />
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionTitle}>Gemiste aanvragen (7d)</div>
                <div className={styles.actionSub}>{unmetThisWeek}× geen dekking</div>
              </div>
              <Link href="/admin/leads" className={styles.actionBtn} style={{background: 'var(--crm-steel-bg)', color: 'var(--crm-steel)'}}>Şimdi Ara</Link>
            </div>
          )}
          {ordersWaiting === 0 && pendingPayoutCount === 0 && outOfStockTechnicians.size === 0 && unmetThisWeek === 0 && (
            <Notice tone="ok">Alles onder controle — geen openstaande zaken.</Notice>
          )}
        </Card>

        <Card className={styles.actionCenterCard}>
          <CardHead>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Clock size={18} color="var(--crm-accent)" /> 
                Bugünün İşleri
              </span>
              <Link href="/admin/jobs" style={{color: 'var(--crm-accent-hover)', fontSize: '12px', textDecoration: 'none'}}>Tümünü gör &rarr;</Link>
            </div>
          </CardHead>
          {jobsToday.length === 0 ? (
            <Notice tone="info">Vandaag geen klussen gepland.</Notice>
          ) : (
            jobsToday.map((job) => {
              const b = badgeProps(job.status);
              return (
                <div key={job.id} className={styles.timelineItem}>
                  <div className={styles.timelineTime}>{job.slot_start?.slice(0,5) || '09:00'}</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineBrand}>{job.problem || 'Autosleutel'}</div>
                    <div className={styles.timelineDetails}><MapPin size={12} style={{display: 'inline', marginRight: '4px'}}/>{job.city || 'Onbekend'}</div>
                  </div>
                  <div className={styles.timelineBadge}>
                    <Badge tone={b.tone}>{b.label}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </Card>

        <Card className={styles.actionCenterCard}>
          <CardHead>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Users size={18} color="var(--crm-accent)" /> 
                Canlı Teknisyenler
              </span>
              <Link href="/admin/monteurs" style={{color: 'var(--crm-accent-hover)', fontSize: '12px', textDecoration: 'none'}}>Tüm ekibi gör &rarr;</Link>
            </div>
          </CardHead>
          {techs.length === 0 ? (
            <Notice tone="info">Geen monteurs gevonden.</Notice>
          ) : (
            techs.map((tech) => (
              <div key={tech.id} className={styles.techItem}>
                <div className={`${styles.techAvatar} ${tech.online ? styles.ok : ''}`}>
                  {tech.name.substring(0,2).toUpperCase()}
                </div>
                <div className={styles.techInfo}>
                  <div className={styles.techName}>{tech.name}</div>
                  <div className={styles.techLocation}>{tech.city || 'Nederland'}</div>
                </div>
                <div style={{flex: 'none'}}><Badge tone={tech.online ? 'ok' : 'info'}>{tech.online ? 'Müsait' : 'Çevrimdışı'}</Badge></div>
                <div className={styles.techActions}>
                  <button className={styles.techBtn}><Phone size={14} /></button>
                  <button className={styles.techBtn}><MoreHorizontal size={14} /></button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <div className={chart.wideRow}>
        <Card padded>
          <strong className={styles.cardLabel}>Gelir ve Performans</strong>
          <LineChart series={series} labels={MONTHS.slice(0, upTo)} format={euroShort} />
        </Card>
        <Card padded>
          <strong className={styles.cardLabel}>Top Teknisyenler</strong>
          <RankedBars rows={topTechnicians} format={euro} />
        </Card>
      </div>
    </div>
  );
}
