import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
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
import { waLink } from '@/lib/whatsapp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PreviewDate, PreviewText } from '../../PreviewLanguage';
import { readDashboard, PERIOD_LABEL, sourceLabel, type Kpi, type Period } from '../dashboardData';
import BrandLogo from '../BrandLogo';
import StudioSalesChart from './StudioSalesChart';

/**
 * The office home screen in the Studio look: the same four questions, the
 * same numbers from readDashboard() and the same links as OfficeOverview,
 * laid out with shadcn cards and a recharts chart. Presentation only — this
 * screen reads nothing OfficeOverview does not read.
 *
 * Only reachable on Autosleutel24 with CRM_UI=studio: page.tsx answers
 * KeyForCars with KfcDashboard before this branch, so the KeyForCars-only
 * parts of the old screen (the sample-order list, the invoice button) have
 * no place here.
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
  if (k.value === null || k.prev === null || k.prev === 0) {
    return <span className="text-muted-foreground text-xs"><PreviewText>geen vergelijking</PreviewText></span>;
  }
  const change = Math.round(((k.value - k.prev) / Math.abs(k.prev)) * 100);
  const good = lowerIsBetter ? change <= 0 : change >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${good ? 'text-emerald-600' : 'text-red-600'}`}>
      {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {Math.abs(change)}% <span className="text-muted-foreground font-normal"><PreviewText>vs vorige</PreviewText></span>
    </span>
  );
}

function KpiCard({ label, value, k, foot, lowerIsBetter, strong }: {
  label: string;
  value: string;
  k: Kpi;
  foot?: ReactNode;
  lowerIsBetter?: boolean;
  strong?: boolean;
}) {
  return (
    <Card className={strong ? 'border-primary/40 bg-primary/5' : undefined}>
      <CardHeader className="pb-2">
        <CardDescription><PreviewText>{label}</PreviewText></CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums"><PreviewText>{value}</PreviewText></CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <Trend k={k} lowerIsBetter={lowerIsBetter} />
        {foot !== undefined && (
          <span className="text-muted-foreground text-xs">{typeof foot === 'string' ? <PreviewText>{foot}</PreviewText> : foot}</span>
        )}
      </CardContent>
    </Card>
  );
}

const TILE_TONE: Record<string, string> = {
  stop: 'bg-red-500/10 text-red-600',
  warn: 'bg-amber-500/10 text-amber-600',
  ok: 'bg-emerald-500/10 text-emerald-600',
  steel: 'bg-sky-500/10 text-sky-600',
  navy: 'bg-primary/10 text-primary',
  accent: 'bg-orange-500/10 text-orange-600',
  blue: 'bg-blue-500/10 text-blue-600',
  ai: 'bg-violet-500/10 text-violet-600',
};

/** One tappable card: icon, title, one line of context. */
function Tile({ href, icon, title, sub, tone = 'steel' }: {
  href: string;
  icon: ReactNode;
  title: ReactNode;
  sub: ReactNode;
  tone?: keyof typeof TILE_TONE | string;
}) {
  return (
    <Link href={href} className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none">
      <Card className="hover:border-primary/40 h-full gap-0 py-4 transition-colors">
        <CardContent className="flex items-start gap-3 px-4">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${TILE_TONE[tone] ?? TILE_TONE.steel}`}>{icon}</span>
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate text-sm font-medium">{title}</span>
            <span className="text-muted-foreground truncate text-xs">{sub}</span>
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{children}</h2>;
}

const STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  gepland: { label: 'Gepland', variant: 'outline' },
  onderweg: { label: 'Onderweg', variant: 'secondary' },
  bezig: { label: 'Bezig', variant: 'secondary' },
  afgerond: { label: 'Afgerond', variant: 'default' },
};

const LEAD_STATUS: Record<string, string> = { qualified: 'Gekwalificeerd', contacted: 'Gebeld' };

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(iso));

export default async function StudioOfficeOverview({ period }: { period: Period }) {
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
  ].filter(Boolean) as { href: string; tone: 'stop' | 'warn' | 'ok' | 'steel'; icon: ReactNode; title: string; sub: string }[];

  const margePct = d.revenue.value ? Math.round(((d.margin.value ?? 0) / d.revenue.value) * 100) : null;
  const roas = d.adSpend.value ? (d.revenue.value ?? 0) / d.adSpend.value : null;
  const totalLeads = d.series.reduce((t, p) => t + p.leads, 0);

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>{greeting(now)}</PreviewText></h1>
        <p className="text-muted-foreground text-sm"><PreviewDate value={now.getTime()} /></p>
      </div>

      <section className="flex flex-col gap-3">
        <SectionLabel><PreviewText>Snel starten</PreviewText></SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Tile tone="navy" href="/admin/jobs/nieuw" icon={<CalendarPlus size={22} strokeWidth={1.8} />} title={<PreviewText>Klus inplannen</PreviewText>} sub={<PreviewText>Lead of bestelling naar een monteur</PreviewText>} />
          <Tile tone="accent" href="/admin/leads" icon={<Phone size={22} strokeWidth={1.8} />} title={<PreviewText>Leads bellen</PreviewText>} sub={d.todo.newLeads ? <>{d.todo.newLeads} <PreviewText>wachten op een belletje</PreviewText></> : <PreviewText>Alles is gebeld</PreviewText>} />
          <Tile tone="blue" href="/admin/facturen/nieuw" icon={<FilePlus2 size={22} strokeWidth={1.8} />} title={<PreviewText>Factuur maken</PreviewText>} sub={<PreviewText>Voor een afgeronde klus</PreviewText>} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel><PreviewText>Nu doen</PreviewText></SectionLabel>
        {todo.length === 0 ? (
          <p className="text-muted-foreground text-sm"><PreviewText>Niets dat wacht. Alles is bij.</PreviewText></p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todo.map((t) => (
              <Tile key={t.href} href={t.href} tone={t.tone} icon={t.icon} title={<PreviewText>{t.title}</PreviewText>} sub={<PreviewText>{t.sub}</PreviewText>} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel><PreviewText>Cijfers</PreviewText> · <PreviewText>{PERIOD_LABEL[period].toLowerCase()}</PreviewText></SectionLabel>
          <nav className="flex gap-1 rounded-lg border p-1" aria-label="Periode">
            {(['vandaag', 'week', 'maand'] as Period[]).map((p) => (
              <Button key={p} asChild size="sm" variant={p === period ? 'default' : 'ghost'}>
                <Link href={`/admin/overzicht?periode=${p}`}><PreviewText>{PERIOD_LABEL[p]}</PreviewText></Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle><PreviewText>Verkoop per dag</PreviewText> · <PreviewText>laatste</PreviewText> {d.series.length} <PreviewText>dagen</PreviewText></CardTitle>
          <CardDescription>{totalLeads} <PreviewText>leads in deze reeks</PreviewText></CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm"><Link href="/admin/winst"><PreviewText>Winst &amp; verbruik →</PreviewText></Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <StudioSalesChart data={d.series} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle><PreviewText>Monteurs</PreviewText></CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm"><Link href="/admin/jobs"><PreviewText>Agenda →</PreviewText></Link></Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.technicians.length === 0 ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Geen actieve monteurs.</PreviewText></p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><PreviewText>Monteur</PreviewText></TableHead>
                      <TableHead><PreviewText>Vandaag</PreviewText></TableHead>
                      <TableHead className="text-right">Week</TableHead>
                      <TableHead className="text-right"><PreviewText>Omzet week</PreviewText></TableHead>
                      <TableHead className="text-right"><PreviewText>Winst week</PreviewText></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.technicians.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="flex items-center gap-2 font-medium">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ background: t.color ?? 'var(--muted-foreground)' }} />
                          {t.name}
                        </TableCell>
                        <TableCell>
                          {t.todayTotal === 0 ? (
                            <span className="text-muted-foreground"><PreviewText>vrij</PreviewText></span>
                          ) : (
                            <span className="flex items-center gap-2">
                              {t.todayDone}/{t.todayTotal} <PreviewText>klaar</PreviewText>
                              {t.todayBusy && <Badge variant="secondary"><PreviewText>onderweg</PreviewText></Badge>}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{t.weekJobs}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(t.weekRevenue)}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(t.weekMargin)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle><PreviewText>Vandaag op de weg</PreviewText> · {d.today.length}</CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm"><Link href="/admin/jobs"><PreviewText>Planning →</PreviewText></Link></Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.today.length === 0 ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Vandaag staan er geen klussen gepland.</PreviewText></p>
            ) : (
              <ul className="grid gap-1">
                {d.today.slice(0, 8).map((j) => {
                  const st = STATUS[j.status] ?? { label: j.status, variant: 'outline' as const };
                  return (
                    <li key={j.id}>
                      <Link href={`/admin/jobs/${j.id}`} className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2 py-2">
                        <span className="text-muted-foreground w-20 shrink-0 text-xs tabular-nums">{j.slot}</span>
                        <BrandLogo make={j.make} />
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <b className="truncate text-sm font-medium">{j.car}</b>
                          <span className="text-muted-foreground truncate text-xs">
                            {j.place} · {j.technician ?? <span className="text-amber-600"><PreviewText>geen monteur</PreviewText></span>}
                          </span>
                        </span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound size={17} aria-hidden="true" /> <PreviewText>Tweede sleutel verkopen</PreviewText> · {d.spareKeys.length}
            </CardTitle>
            <CardDescription>
              <PreviewText>Klanten met alle sleutels kwijt rijden nu met één sleutel. Bied een reservesleutel aan: zelfde auto, tevreden klant, snelle klus. Ze verdwijnen hier zodra ze een bijmaak-klus boeken.</PreviewText>
            </CardDescription>
            {d.spareKeyPrice !== null && (
              <CardAction>
                <span className="text-muted-foreground text-xs"><PreviewText>gem. bijmaken</PreviewText> {money(d.spareKeyPrice)}</span>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {d.spareKeys.length === 0 ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Geen open kansen.</PreviewText></p>
            ) : (
              <ul className="grid gap-1">
                {d.spareKeys.slice(0, 6).map((c) => {
                  const first = c.name?.split(' ')[0];
                  const link = waLink(
                    c.phone,
                    `Goedendag${first ? ` ${first}` : ''}, hier ${BRAND.name}. Op ${shortDate(c.date)} hebben we een nieuwe sleutel voor uw ${c.car} gemaakt. Met maar één sleutel staat u stil als die kwijtraakt. Zullen we een reservesleutel voor u bijmaken? Dat kan op locatie, meestal binnen een uur.`
                  );
                  return (
                    <li key={c.jobId} className="flex items-center gap-3 rounded-lg px-2 py-2">
                      <BrandLogo make={c.make} />
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <b className="truncate text-sm font-medium">{c.name ?? 'Klant'}</b>
                        <span className="text-muted-foreground truncate text-xs">
                          {c.car} · alle sleutels kwijt op {shortDate(c.date)}
                        </span>
                      </span>
                      {link && (
                        <Button asChild size="sm">
                          <a href={link} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <a href={`tel:${c.phone}`}><PreviewText>Bellen</PreviewText></a>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle><PreviewText>Offertes opvolgen</PreviewText> · {d.followUps.length}</CardTitle>
            <CardDescription><PreviewText>Gebeld of gekwalificeerd, maar nog niet verkocht (laatste 14 dagen). Oudste eerst.</PreviewText></CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm"><Link href="/admin/leads">Leads →</Link></Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.followUps.length === 0 ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Niets op te volgen.</PreviewText></p>
            ) : (
              <ul className="grid gap-1">
                {d.followUps.map((f) => (
                  <li key={f.id}>
                    <Link href="/admin/leads" className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2 py-2">
                      <BrandLogo make={f.make} />
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <b className="truncate text-sm font-medium">{f.name ?? 'Naam onbekend'}</b>
                        <span className="text-muted-foreground truncate text-xs">
                          {f.car} · {shortDate(f.createdAt)}
                        </span>
                      </span>
                      {f.quoted !== null && <b className="text-sm tabular-nums">{money(f.quoted)}</b>}
                      <Badge variant="secondary">{LEAD_STATUS[f.status] ?? f.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle><PreviewText>Waar komen de leads vandaan</PreviewText> · <PreviewText>{PERIOD_LABEL[period].toLowerCase()}</PreviewText></CardTitle>
          <CardAction>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/rapportage"><PreviewText>Rapportage →</PreviewText></Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {d.sources.length === 0 ? (
            <p className="text-muted-foreground text-sm"><PreviewText>Nog geen leads in deze periode.</PreviewText></p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><PreviewText>Bron</PreviewText></TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right"><PreviewText>Verkocht</PreviewText></TableHead>
                    <TableHead className="text-right"><PreviewText>Conversie</PreviewText></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.sources.map((s) => (
                    <TableRow key={s.source}>
                      <TableCell className="font-medium">{sourceLabel(s.source)}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.leads}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.sold}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.leads ? `${Math.round((s.sold / s.leads) * 100)}%` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionLabel><PreviewText>Snel naar</PreviewText></SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile href="/admin/gesprekken" tone="ai" icon={<PhoneCall size={20} strokeWidth={1.8} />} title={<PreviewText>Gesprekken</PreviewText>} sub={<PreviewText>Wat de AI-agent deed</PreviewText>} />
          <Tile href="/admin/jobs" tone="steel" icon={<CalendarDays size={20} strokeWidth={1.8} />} title={<PreviewText>Agenda</PreviewText>} sub={<PreviewText>Wie is waar</PreviewText>} />
          <Tile href="/admin/rapport" tone="ok" icon={<BarChart3 size={20} strokeWidth={1.8} />} title={<PreviewText>Prestaties</PreviewText>} sub={<PreviewText>Week, maand, jaar en per monteur</PreviewText>} />
          <Tile href="/admin/monteurs" icon={<Wrench size={20} strokeWidth={1.8} />} title="Monteurs" sub="Team en dekking" />
        </div>
      </section>
    </div>
  );
}
