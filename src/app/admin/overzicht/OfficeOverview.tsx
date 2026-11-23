import Link from 'next/link';
import {
  BarChart3,
  Boxes,
  CalendarDays,
  CalendarPlus,
  FilePlus2,
  KeyRound,
  Phone,
  PhoneCall,
  Receipt,
  UserX,
  Wallet,
  Wrench,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { BRAND } from '@/config/install';
import { PreviewDate, PreviewText } from '../PreviewLanguage';
import { waLink } from '@/lib/whatsapp';
import { PageHead, Label, TileGrid, Tile, Badge } from '../_ui';
import { readDashboard, PERIOD_LABEL, sourceLabel, type Kpi, type Period } from './dashboardData';
import styles from './dashboard.module.css';
import SalesChart from './SalesChart';
import BrandLogo from './BrandLogo';

/**
 * The office home screen. Four questions, top to bottom:
 *   1. What do I start?        Quick start
 *   2. What is waiting on me?  Nu doen (only what is actually waiting)
 *   3. How is the business?    KPI's for the chosen period, vs the period before
 *   4. Who does what, and where is the next sale?  Monteurs, vandaag,
 *      tweede-sleutel kansen, offertes opvolgen, bronnen.
 */

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const money = (v: number | null) => (v === null ? '—' : EUR.format(v));

function greeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat('nl-NL', { hour: 'numeric', hour12: false, timeZone: 'Europe/Amsterdam' }).format(now)
  );
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

/** ↑ 12% / ↓ 5% against the previous period; "lower is better" flips the colour. */
function Trend({ k, lowerIsBetter = false }: { k: Kpi; lowerIsBetter?: boolean }) {
  if (k.value === null || k.prev === null || k.prev === 0) return <span className={styles.trendNone}><PreviewText>geen vergelijking</PreviewText></span>;
  const change = Math.round(((k.value - k.prev) / Math.abs(k.prev)) * 100);
  const good = lowerIsBetter ? change <= 0 : change >= 0;
  return (
    <span className={good ? styles.trendUp : styles.trendDown}>
      {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% <PreviewText>vs vorige</PreviewText>
    </span>
  );
}

function KpiCard({
  label,
  value,
  k,
  foot,
  lowerIsBetter,
  strong,
}: {
  label: string;
  value: string;
  k: Kpi;
  foot?: React.ReactNode;
  lowerIsBetter?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={strong ? `${styles.kpi} ${styles.kpiStrong}` : styles.kpi}>
      <span className={styles.kpiLabel}><PreviewText>{label}</PreviewText></span>
      <span className={styles.kpiValue}><PreviewText>{value}</PreviewText></span>
      <Trend k={k} lowerIsBetter={lowerIsBetter} />
      {foot && <span className={styles.kpiFoot}>{typeof foot === 'string' ? <PreviewText>{foot}</PreviewText> : foot}</span>}
    </div>
  );
}

const STATUS: Record<string, { label: string; tone: 'ok' | 'warn' | 'info' }> = {
  gepland: { label: 'Gepland', tone: 'info' },
  onderweg: { label: 'Onderweg', tone: 'warn' },
  bezig: { label: 'Bezig', tone: 'warn' },
  afgerond: { label: 'Afgerond', tone: 'ok' },
};

const LEAD_STATUS: Record<string, string> = { qualified: 'Gekwalificeerd', contacted: 'Gebeld' };

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(iso));

export default async function OfficeOverview({ period }: { period: Period }) {
  const supabase = CRM_PREVIEW ? null : await createSupabaseServerClient();
  const d = await readDashboard(supabase, period);
  const now = new Date();

  const todo = [
    d.todo.newLeads > 0 && { href: '/admin/leads', tone: 'stop' as const, icon: <Phone size={20} />, title: `${d.todo.newLeads} nieuwe leads`, sub: 'Nog niet gebeld' },
    d.todo.unassigned > 0 && { href: '/admin/jobs', tone: 'warn' as const, icon: <UserX size={20} />, title: `${d.todo.unassigned} zonder monteur`, sub: 'Geplande klussen' },
    d.todo.ordersToPlan > 0 && { href: '/admin/orders', tone: 'warn' as const, icon: <CalendarPlus size={20} />, title: `${d.todo.ordersToPlan} bestellingen`, sub: 'Nog inplannen' },
    d.todo.payouts > 0 && { href: '/admin/kas', tone: 'ok' as const, icon: <Wallet size={20} />, title: `${d.todo.payouts} uitbetaling${d.todo.payouts === 1 ? '' : 'en'}`, sub: `${money(d.todo.payoutTotal)} aangevraagd` },
    d.todo.expensesToApprove > 0 && { href: '/admin/uitgaven', tone: 'steel' as const, icon: <Receipt size={20} />, title: `${d.todo.expensesToApprove} uitgaven`, sub: 'Goedkeuren' },
    d.todo.lowStock > 0 && { href: '/admin/voorraad', tone: 'warn' as const, icon: <Boxes size={20} />, title: `${d.todo.lowStock} artikelen`, sub: 'Bijna of helemaal op' },
  ].filter(Boolean) as { href: string; tone: 'stop' | 'warn' | 'ok' | 'steel'; icon: React.ReactNode; title: string; sub: string }[];

  const margePct = d.revenue.value ? Math.round(((d.margin.value ?? 0) / d.revenue.value) * 100) : null;
  const roas = d.adSpend.value ? (d.revenue.value ?? 0) / d.adSpend.value : null;

  const quickActions = (
    <>
      <Label><PreviewText>Snel starten</PreviewText></Label>
      <TileGrid>
        <Tile big tone="navy" href="/admin/jobs/nieuw" icon={<CalendarPlus size={26} strokeWidth={1.8} />} title={<PreviewText>Klus inplannen</PreviewText>} sub={<PreviewText>Lead of bestelling naar een monteur</PreviewText>} />
        <Tile big tone="accent" href="/admin/leads" icon={<Phone size={26} strokeWidth={1.8} />} title={<PreviewText>Leads bellen</PreviewText>} sub={d.todo.newLeads ? <>{d.todo.newLeads} <PreviewText>wachten op een belletje</PreviewText></> : <PreviewText>Alles is gebeld</PreviewText>} />
        <Tile big tone="blue" href="/admin/facturen/nieuw" icon={<FilePlus2 size={26} strokeWidth={1.8} />} title={<PreviewText>Factuur maken</PreviewText>} sub={<PreviewText>Voor een afgeronde klus</PreviewText>} />
      </TileGrid>

      <Label><PreviewText>Nu doen</PreviewText></Label>
      {todo.length === 0 ? (
        <p className={styles.allClear}><PreviewText>Niets dat wacht. Alles is bij.</PreviewText></p>
      ) : (
        <TileGrid>
          {todo.map((t) => (
            <Tile key={t.href} href={t.href} iconTone={t.tone} icon={t.icon} title={t.title} sub={t.sub} />
          ))}
        </TileGrid>
      )}
    </>
  );

  return (
    <div className={styles.page}>
      <PageHead
        title={<PreviewText>{greeting(now)}</PreviewText>}
        sub={<PreviewDate value={now.getTime()} />}
      />
      {quickActions}

      <div className={styles.kpiHead}>
        <Label><PreviewText>Cijfers</PreviewText> · <PreviewText>{PERIOD_LABEL[period].toLowerCase()}</PreviewText></Label>
        <nav className={styles.periods} aria-label="Periode">
          {(['vandaag', 'week', 'maand'] as Period[]).map((p) => (
            <Link key={p} href={`/admin/overzicht?periode=${p}`} className={p === period ? styles.periodOn : styles.period}>
              <PreviewText>{PERIOD_LABEL[p]}</PreviewText>
            </Link>
          ))}
        </nav>
      </div>
      <div className={styles.kpis}>
        <KpiCard label="Omzet" value={money(d.revenue.value)} k={d.revenue} foot={<>{d.jobsDone.value} <PreviewText>klussen afgerond</PreviewText></>} />
        <KpiCard label="Brutowinst" value={money(d.margin.value)} k={d.margin} foot={margePct === null ? 'na materiaal, reis en monteur' : `${margePct}% van de omzet`} />
        <KpiCard label="Gemiddelde klus" value={money(d.avgTicket.value)} k={d.avgTicket} foot="omzet per afgeronde klus" />
        <KpiCard label="Leads binnen" value={String(d.leads.value ?? 0)} k={d.leads} foot={d.conversion.value === null ? 'nog geen leads' : `${d.conversion.value}% verkocht`} />
        <KpiCard
          label="Advertenties"
          value={d.hasAdData ? money(d.adSpend.value) : 'Niet gekoppeld'}
          k={d.adSpend}
          lowerIsBetter
          foot={d.hasAdData ? (roas ? `ROAS ${roas.toFixed(1)}× · ${money(d.costPerJob.value)} per klus` : 'nog geen klussen') : 'Google/Bing kosten nog niet gesynchroniseerd'}
        />
        <KpiCard label="Uitgaven" value={money(d.expenses.value)} k={d.expenses} lowerIsBetter foot="bonnetjes, niet afgewezen" />
        <KpiCard strong label="Netto over" value={money(d.net.value)} k={d.net} foot="brutowinst − advertenties − uitgaven" />
      </div>


      <section className={styles.card}>
        <header className={styles.cardHead}>
          <span><PreviewText>Verkoop per dag · laatste</PreviewText> {d.series.length} <PreviewText>dagen</PreviewText></span>
          <Link href="/admin/winst"><PreviewText>Winst & verbruik →</PreviewText></Link>
        </header>
        <SalesChart data={d.series} />
      </section>

      <div className={styles.twoCol}>
        <section className={styles.card}>
          <header className={styles.cardHead}>
            <span><PreviewText>Monteurs</PreviewText></span>
            <Link href="/admin/jobs"><PreviewText>Agenda →</PreviewText></Link>
          </header>
          {d.technicians.length === 0 ? (
            <p className={styles.empty}><PreviewText>Geen actieve monteurs.</PreviewText></p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><PreviewText>{"Monteur"}</PreviewText></th>
                  <th><PreviewText>{"Vandaag"}</PreviewText></th>
                  <th className={styles.num}>Week</th>
                  <th className={styles.num}><PreviewText>{"Omzet week"}</PreviewText></th>
                  <th className={styles.num}><PreviewText>{"Winst week"}</PreviewText></th>
                </tr>
              </thead>
              <tbody>
                {d.technicians.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className={styles.dot} style={{ background: t.color ?? 'var(--crm-muted)' }} />
                      {t.name}
                    </td>
                    <td>
                      {t.todayTotal === 0 ? (
                        <span className={styles.muted}><PreviewText>{"vrij"}</PreviewText></span>
                      ) : (
                        <>
                          {t.todayDone}/{t.todayTotal} <PreviewText>{"klaar"}</PreviewText> {t.todayBusy && <Badge tone="warn"><PreviewText>{"onderweg"}</PreviewText></Badge>}
                        </>
                      )}
                    </td>
                    <td className={styles.num}>{t.weekJobs}</td>
                    <td className={styles.num}>{money(t.weekRevenue)}</td>
                    <td className={styles.num}>{money(t.weekMargin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className={styles.card}>
          <header className={styles.cardHead}>
            <span><PreviewText>Vandaag op de weg</PreviewText> · {d.today.length}</span>
            <Link href="/admin/jobs"><PreviewText>Planning →</PreviewText></Link>
          </header>
          {d.today.length === 0 ? (
            <p className={styles.empty}><PreviewText>Vandaag staan er geen klussen gepland.</PreviewText></p>
          ) : (
            <ul className={styles.list}>
              {d.today.slice(0, 8).map((j) => {
                const st = STATUS[j.status] ?? { label: j.status, tone: 'info' as const };
                return (
                  <li key={j.id}>
                    <Link href={`/admin/jobs/${j.id}`} className={styles.listRow}>
                      <span className={styles.slot}>{j.slot}</span>
                      <BrandLogo make={j.make} />
                      <span className={styles.grow}>
                        <b>{j.car}</b>
                        <span className={styles.muted}>
                          {j.place} · {j.technician ?? <span className={styles.warnText}><PreviewText>{"geen monteur"}</PreviewText></span>}
                        </span>
                      </span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className={styles.twoCol}>
        <section className={`${styles.card} ${styles.cardChance}`}>
          <header className={styles.cardHead}>
            <span>
              <KeyRound size={17} aria-hidden="true" /> <PreviewText>Tweede sleutel verkopen</PreviewText> · {d.spareKeys.length}
            </span>
            {d.spareKeyPrice !== null && <span className={styles.muted}><PreviewText>{"gem. bijmaken"}</PreviewText> {money(d.spareKeyPrice)}</span>}
          </header>
          <p className={styles.explain}>
            <PreviewText>Klanten met alle sleutels kwijt rijden nu met één sleutel. Bied een reservesleutel aan: zelfde auto, tevreden klant, snelle klus. Ze verdwijnen hier zodra ze een bijmaak-klus boeken.</PreviewText>
          </p>
          {d.spareKeys.length === 0 ? (
            <p className={styles.empty}><PreviewText>Geen open kansen.</PreviewText></p>
          ) : (
            <ul className={styles.list}>
              {d.spareKeys.slice(0, 6).map((c) => {
                const first = c.name?.split(' ')[0];
                const link = waLink(
                  c.phone,
                  `Goedendag${first ? ` ${first}` : ''}, hier ${BRAND.name}. Op ${shortDate(c.date)} hebben we een nieuwe sleutel voor uw ${c.car} gemaakt. Met maar één sleutel staat u stil als die kwijtraakt. Zullen we een reservesleutel voor u bijmaken? Dat kan op locatie, meestal binnen een uur.`
                );
                return (
                  <li key={c.jobId} className={styles.listRow}>
                    <BrandLogo make={c.make} />
                    <span className={styles.grow}>
                      <b>{c.name ?? 'Klant'}</b>
                      <span className={styles.muted}>
                        {c.car} · alle sleutels kwijt op {shortDate(c.date)}
                      </span>
                    </span>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                        WhatsApp
                      </a>
                    )}
                    <a href={`tel:${c.phone}`} className={styles.ghostBtn}>
                      <PreviewText>{"Bellen"}</PreviewText>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.card}>
          <header className={styles.cardHead}>
            <span><PreviewText>Offertes opvolgen</PreviewText> · {d.followUps.length}</span>
            <Link href="/admin/leads">Leads →</Link>
          </header>
          <p className={styles.explain}><PreviewText>Gebeld of gekwalificeerd, maar nog niet verkocht (laatste 14 dagen). Oudste eerst.</PreviewText></p>
          {d.followUps.length === 0 ? (
            <p className={styles.empty}><PreviewText>Niets op te volgen.</PreviewText></p>
          ) : (
            <ul className={styles.list}>
              {d.followUps.map((f) => (
                <li key={f.id}>
                  <Link href="/admin/leads" className={styles.listRow}>
                    <BrandLogo make={f.make} />
                    <span className={styles.grow}>
                      <b>{f.name ?? 'Naam onbekend'}</b>
                      <span className={styles.muted}>
                        {f.car} · {shortDate(f.createdAt)}
                      </span>
                    </span>
                    {f.quoted !== null && <b>{money(f.quoted)}</b>}
                    <Badge tone="warn">{LEAD_STATUS[f.status] ?? f.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <span><PreviewText>Waar komen de leads vandaan</PreviewText> · <PreviewText>{PERIOD_LABEL[period].toLowerCase()}</PreviewText></span>
          <Link href="/admin/rapportage"><PreviewText>Rapportage →</PreviewText></Link>
        </header>
        {d.sources.length === 0 ? (
          <p className={styles.empty}><PreviewText>Nog geen leads in deze periode.</PreviewText></p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th><PreviewText>{"Bron"}</PreviewText></th>
                <th className={styles.num}>Leads</th>
                <th className={styles.num}><PreviewText>{"Verkocht"}</PreviewText></th>
                <th className={styles.num}><PreviewText>{"Conversie"}</PreviewText></th>
              </tr>
            </thead>
            <tbody>
              {d.sources.map((s) => (
                <tr key={s.source}>
                  <td>{sourceLabel(s.source)}</td>
                  <td className={styles.num}>{s.leads}</td>
                  <td className={styles.num}>{s.sold}</td>
                  <td className={styles.num}>{s.leads ? `${Math.round((s.sold / s.leads) * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Label><PreviewText>Snel naar</PreviewText></Label>
      <TileGrid>
        <Tile href="/admin/gesprekken" ai iconTone="ai" icon={<PhoneCall size={20} strokeWidth={1.8} />} title={<PreviewText>Gesprekken</PreviewText>} sub={<PreviewText>Wat de AI-agent deed</PreviewText>} />
        <Tile href="/admin/jobs" iconTone="steel" icon={<CalendarDays size={20} strokeWidth={1.8} />} title={<PreviewText>Agenda</PreviewText>} sub={<PreviewText>Wie is waar</PreviewText>} />
        <Tile href="/admin/rapport" iconTone="ok" icon={<BarChart3 size={20} strokeWidth={1.8} />} title={<PreviewText>Prestaties</PreviewText>} sub={<PreviewText>Week, maand, jaar en per monteur</PreviewText>} />
        <Tile href="/admin/monteurs" icon={<Wrench size={20} strokeWidth={1.8} />} title="Monteurs" sub="Team en dekking" />
      </TileGrid>
    </div>
  );
}
