import { getBrandLogo } from '@/lib/brandLogos';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isoDate, slotLabel } from '@/lib/crmJobs';
import { stockStatus } from '@/lib/stockStatus';
import { PageHead, Card, CardHead, Badge, Notice } from '../_ui';
import { LineChart, BarChart, RankedBars, chart } from '../_ui/charts';
import { MixedChart } from './MixedChart';
import styles from './overzicht.module.css';
import Link from 'next/link';
import { Users, Briefcase, Euro, Target, CheckCircle, Phone, MoreHorizontal, AlertCircle, AlertTriangle, FileText, PackageX, MapPin, Clock } from 'lucide-react';

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
    { data: marketingCosts },
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, status, final_price, quoted_price, technician_id, city, slot_start, slot_end, car_make, car_model, kenteken, service_type')
      .eq('scheduled_date', today),
    supabase.from('jobs').select('status, final_price, quoted_price').eq('scheduled_date', sameDayLastWeek),
    supabase.from('leads').select('id, created_at').gte('created_at', daysAgo(14).toISOString()),
    supabase.from('crm_orders_to_plan').select('id', { count: 'exact', head: true }),
    supabase.from('payout_requests').select('amount').eq('status', 'pending'),
    supabase.from('stock_items').select('technician_id, quantity, min_quantity'),
    supabase.from('unmet_requests').select('id', { count: 'exact', head: true }).gte('created_at', daysAgo(7).toISOString()),
    supabase.from('technicians').select('id, name, online, active, city, phone'),
    supabase.from('jobs').select('scheduled_date, final_price, quoted_price').eq('status', 'afgerond').gte('scheduled_date', startOfThisYear),
    supabase.from('crm_report_technician').select('*').order('omzet', { ascending: false }).limit(5),
    supabase.from('leads').select('status').in('status', ['new', 'qualified', 'contacted']),
    supabase.from('crm_report_source').select('*'),
    supabase.from('crm_marketing_costs').select('*').gte('date', daysAgo(14).toISOString().split('T')[0]),
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
      case 'afgerond': return { tone: 'ok' as const, label: 'Afgerond' };
      case 'onderweg': return { tone: 'warn' as const, label: 'In Behandeling' };
      case 'bezig': return { tone: 'warn' as const, label: 'In Behandeling' };
      case 'gepland': return { tone: 'info' as const, label: 'Wachtend' };
      default: return { tone: 'info' as const, label: 'Gepland' };
    }
  };

  
  
  // Aggregate real marketing data and revenue for the chart
  const mixedData = Array.from({ length: 14 }).map((_, i) => {
    const d = daysAgo(13 - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    
    // Revenue for that day
    const dayJobs = (yearJobs || []).filter(j => j.scheduled_date === dateStr && j.final_price);
    const revenue = dayJobs.reduce((sum, j) => sum + (Number(j.final_price) || 0), 0);
    
    // Clicks/Calls for that day
    const dayCosts = (marketingCosts || []).filter(c => c.date === dateStr);
    const clicks = dayCosts.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
    
    // Total leads generated that day
    const dayLeads = (leadDates || []).filter(l => l.created_at.startsWith(dateStr));
    const leads = dayLeads.length;
    
    /*
     * Both of these used to be invented when no marketing data existed, which
     * is still the case today:
     *
     *   calls      = leads * 2      ("dummy estimate if API not set up")
     *   conversion = 100            when clicks were zero but leads were not
     *
     * The chart therefore drew a call volume derived from an unrelated count,
     * and a flat 100% conversion, with nothing on screen saying so. A gap in a
     * chart prompts someone to connect the source; a plausible line does not.
     *
     * null rather than 0: zero is a measurement ("nobody clicked"), and the
     * chart renders a break instead of a floor.
     */
    const hasCostData = dayCosts.length > 0;
    const conversion = hasCostData && clicks > 0
      ? Math.min(Math.round((leads / clicks) * 100), 100)
      : null;

    return {
      date: displayDate,
      revenue,
      calls: hasCostData ? clicks : null,
      conversion,
    };
  });
  

  return (
    <div className={styles.dashboardGrid}>
      <div>
        <div style={{color: 'var(--crm-muted)', fontSize: '13px', marginBottom: '4px'}}>Goedendag 👋</div>
        <PageHead title="Operatiecentrum Vandaag" sub={`Operaties verlopen normaal. ${jobsToday.length - doneToday.length} actieve klussen, ${last7} nieuwe leads wachten.`} />
      </div>

      
      {/* 1. Top KPI Row (5 Cards) */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px'}}>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E8F5E9', padding: '6px', borderRadius: '50%'}}><Target size={16} color="var(--crm-ok)"/></div> Leads
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{last7}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 2 vandaag</div>
        </div></Card>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#F3E5F5', padding: '6px', borderRadius: '50%'}}><FileText size={16} color="#9C27B0"/></div> Quotes
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>12</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 3 deze week</div>
        </div></Card>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E3F2FD', padding: '6px', borderRadius: '50%'}}><Briefcase size={16} color="#2196F3"/></div> Jobs
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{jobsToday.length}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{jobsToday.length - doneToday.length} in uitvoering</div>
        </div></Card>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E3F2FD', padding: '6px', borderRadius: '50%'}}><FileText size={16} color="#2196F3"/></div> Invoices
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>14</div>
          <div style={{fontSize: '12px', color: 'var(--crm-stop)'}}>↓ 6 openstaand</div>
        </div></Card>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E8F5E9', padding: '6px', borderRadius: '50%'}}><CheckCircle size={16} color="var(--crm-ok)"/></div> Betaald
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€4.320</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 12% deze maand</div>
        </div></Card>
      </div>

      {/* 2. Financieel Overzicht */}
      <div style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <div>
            <h2 style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>Financieel Overzicht</h2>
            <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>1 - 26 Feb 2025</div>
          </div>
          <select style={{fontSize: '13px', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--crm-rule)', background: 'var(--crm-bg)'}}>
            <option>Deze maand</option>
          </select>
        </div>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px'}}>
          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Openstaand</div>
              <FileText size={14} color="var(--crm-warn)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€9.156</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>12 facturen</div>
          </div></Card>
          
          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Vervallen</div>
              <Clock size={14} color="var(--crm-stop)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€3.420</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>6 facturen</div>
          </div></Card>

          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Omzet (Deze maand)</div>
              <div style={{background: '#E8F5E9', padding: '2px 4px', borderRadius: '4px'}}><Target size={12} color="var(--crm-ok)"/></div>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€12.480</div>
            <div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 18% tov vorige maand</div>
          </div></Card>

          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Uitgaven</div>
              <div style={{background: '#E8F5E9', padding: '2px 4px', borderRadius: '4px'}}><Target size={12} color="var(--crm-ok)"/></div>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€2.830</div>
            <div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 6% tov vorige maand</div>
          </div></Card>

          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Brutowinst</div>
              <Euro size={14} color="var(--crm-ok)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€9.650</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>77% marge</div>
          </div></Card>
        </div>
      </div>
      <div className={styles.kpiStrip}>
<Card className={styles.actionCenterCard}>
          <CardHead>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <AlertCircle size={18} color="var(--crm-stop)" /> 
                Actiecentrum
              </span>
              <Link href="/admin/orders" style={{color: 'var(--crm-accent-hover)', fontSize: '12px', textDecoration: 'none'}}>Bekijk alle acties &rarr;</Link>
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
              <Link href="/admin/orders" className={styles.actionBtn} style={{background: 'var(--crm-stop-bg)', color: 'var(--crm-stop)'}}>Monteur Toewijzen</Link>
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
              <Link href="/admin/kas" className={styles.actionBtn} style={{background: 'var(--crm-warn-bg)', color: 'var(--crm-warn)'}}>Uitbetalen</Link>
            </div>
          )}
          {(outOfStockTechnicians.size > 0 || lowStockTechnicians.size > 0) && (
            <div className={styles.actionItem}>
              <div className={styles.actionIcon} style={{background: 'var(--crm-warn-bg)', color: 'var(--crm-warn)'}}>
                <PackageX size={16} />
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionTitle}>Lage voorraad waarschuwing</div>
                <div className={styles.actionSub}>{outOfStockTechnicians.size + lowStockTechnicians.size} monteur tekort</div>
              </div>
              <Link href="/admin/monteurs" className={styles.actionBtn} style={{background: 'var(--crm-warn-bg)', color: 'var(--crm-warn)'}}>Voorraad details</Link>
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
              <Link href="/admin/leads" className={styles.actionBtn} style={{background: 'var(--crm-steel-bg)', color: 'var(--crm-steel)'}}>Nu bellen</Link>
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
                Klussen Vandaag
              </span>
              <Link href="/admin/jobs" style={{color: 'var(--crm-accent-hover)', fontSize: '12px', textDecoration: 'none'}}>Bekijk alles &rarr;</Link>
            </div>
          </CardHead>
          {jobsToday.length === 0 ? (
            <Notice tone="info">Vandaag geen klussen gepland.</Notice>
          ) : (
            jobsToday.map((job) => {
              const b = badgeProps(job.status);
              const logo = getBrandLogo(job.car_make);
              const title = [job.car_make, job.car_model].filter(Boolean).join(' ') || 'Autosleutel Maken';
              const plateAndService = [job.kenteken, job.service_type].filter(Boolean).join(' • ');

              return (
                <div key={job.id} className={styles.timelineItem}>
                  <div className={styles.timelineTime} style={{width: '45px', fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '3px', height: '14px', background: 'var(--crm-accent)', borderRadius: '2px', marginRight: '8px'}} />
                    {job.slot_start?.slice(0,5) || '09:00'}
                  </div>
                  
                  <div style={{width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {logo ? (
                      <img src={logo} alt={job.car_make || ''} style={{width: '28px', height: '28px', objectFit: 'contain'}} />
                    ) : (
                      <div className={styles.techAvatar} style={{width: '28px', height: '28px', fontSize: '10px'}}>{job.car_make?.substring(0,3).toUpperCase() || 'OTO'}</div>
                    )}
                  </div>
                  
                  <div className={styles.timelineContent} style={{flex: 1, paddingLeft: '8px'}}>
                    <div className={styles.timelineBrand} style={{fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)'}}>{title}</div>
                    <div className={styles.timelineDetails} style={{fontSize: '11px', color: 'var(--crm-muted)', marginTop: '2px'}}>{plateAndService}</div>
                    <div className={styles.timelineDetails} style={{fontSize: '11px', color: 'var(--crm-muted)'}}>{job.city || 'Onbekend'}</div>
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
                Live Monteurs
              </span>
              <Link href="/admin/monteurs" style={{color: 'var(--crm-accent-hover)', fontSize: '12px', textDecoration: 'none'}}>Bekijk het team &rarr;</Link>
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
                <div style={{flex: 'none'}}><Badge tone={tech.online ? 'ok' : 'info'}>{tech.online ? 'Beschikbaar' : 'Offline'}</Badge></div>
                {/*
                  * Both of these were <button> with no handler. The phone one
                  * is a link now — the query did not even select the number,
                  * so there was nothing to dial. The second opened a menu that
                  * does not exist, and is replaced by a link to the person's
                  * own page, which does.
                  */}
                <div className={styles.techActions}>
                  {tech.phone ? (
                    <a
                      className={styles.techBtn}
                      href={`tel:${tech.phone}`}
                      title={`Bel ${tech.name}`}
                      aria-label={`Bel ${tech.name}`}
                    >
                      <Phone size={14} />
                    </a>
                  ) : (
                    <span className={styles.techBtn} title="Geen nummer bekend" aria-hidden="true">
                      <Phone size={14} opacity={0.35} />
                    </span>
                  )}
                  <Link
                    className={styles.techBtn}
                    href={`/admin/monteurs/${tech.id}`}
                    title={`Open ${tech.name}`}
                    aria-label={`Open ${tech.name}`}
                  >
                    <MoreHorizontal size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <div className={chart.wideRow}>
        <Card padded>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <strong className={styles.cardLabel} style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px'}}>
              <span style={{color: 'var(--crm-accent)'}}>📊</span> Omzet, Aramalar ve Dönüşüm
            </strong>
            <select style={{fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--crm-rule)'}}>
              <option>Laatste 14 Dagen</option>
            </select>
          </div>
          <div style={{display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', color: 'var(--crm-muted)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--crm-accent)', opacity: 0.5}}></div> Omzet (€)</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#2196F3'}}></div> Oproepen</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#4CAF50'}}></div> Conversie (%)</div>
          </div>
          <MixedChart data={mixedData} />
        </Card>
        <Card padded>
          <strong className={styles.cardLabel}>Top Monteurs</strong>
          <RankedBars rows={topTechnicians} format={euro} />
        </Card>
      </div>
    </div>
  );
}
