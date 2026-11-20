import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, Car, Handshake, MapPin, Package, Wallet, Wrench } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { slotLabel, JOB_STATUS_LABELS, type JobStatus } from '@/lib/crmJobs';
import { earnedOn, priceOf } from '@/lib/technicianBalance';
import type { CrmUser } from '@/lib/crmSession';
import { PreviewText } from '../../PreviewLanguage';
import { PERIOD_LABEL, type Period } from '../dashboardData';
import { dayOf, readMonteur, serviceOf, START_INVESTMENT } from '../monteurData';
import BrandLogo from '../BrandLogo';
import StudioSalesChart from './StudioSalesChart';

/**
 * The technician's home in the Studio look. Every number comes from
 * readMonteur() — the same queries, scoped to their own technician row, that
 * MonteurOverview reads — and every link points where the old screen pointed.
 */

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const EUR2 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

function Trend({ cur, prev }: { cur: number; prev: number }) {
  if (!prev) return <span className="text-muted-foreground text-xs"><PreviewText>geen vergelijking</PreviewText></span>;
  const change = Math.round(((cur - prev) / prev) * 100);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
      {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {Math.abs(change)}% <span className="text-muted-foreground font-normal">vs vorige</span>
    </span>
  );
}

function KpiCard({ label, value, cur, prev, foot, strong }: {
  label: string;
  value: string;
  cur: number;
  prev: number;
  foot?: string;
  strong?: boolean;
}) {
  return (
    <Card className={strong ? 'border-primary/40 bg-primary/5' : undefined}>
      <CardHeader className="pb-2">
        <CardDescription><PreviewText>{label}</PreviewText></CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <Trend cur={cur} prev={prev} />
        {foot && <span className="text-muted-foreground text-xs"><PreviewText>{foot}</PreviewText></span>}
      </CardContent>
    </Card>
  );
}

const TILE_TONE: Record<string, string> = {
  accent: 'bg-orange-500/10 text-orange-600',
  steel: 'bg-sky-500/10 text-sky-600',
  warn: 'bg-amber-500/10 text-amber-600',
  ok: 'bg-emerald-500/10 text-emerald-600',
  plain: 'bg-muted text-muted-foreground',
};

function Tile({ href, icon, title, sub, tone = 'plain' }: {
  href: string;
  icon: ReactNode;
  title: ReactNode;
  sub: ReactNode;
  tone?: string;
}) {
  return (
    <Link href={href} className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none">
      <Card className="hover:border-primary/40 h-full gap-0 py-4 transition-colors">
        <CardContent className="flex items-start gap-3 px-4">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${TILE_TONE[tone] ?? TILE_TONE.plain}`}>{icon}</span>
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate text-sm font-medium">{title}</span>
            <span className="text-muted-foreground truncate text-xs">{sub}</span>
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function StudioMonteurOverview({ user, period }: { user: CrmUser; period: Period }) {
  const data = await readMonteur(user, period);

  if (!data) {
    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Overzicht</PreviewText></h1>
        <Card className="border-destructive/30">
          <CardContent className="text-destructive text-sm">
            <PreviewText>Uw login is nog niet aan een monteur gekoppeld.</PreviewText>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    tech, jobsToday, upcoming, next, finishedToday, done, available, pendingPayout, outOfStock, lowStock,
    weekCount, monthJobs, earnedMonth, monthName, offerCount, k, avgCur, avgPrev, days, series, address, car,
  } = data;

  const shortDate = (iso: string) =>
    new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(`${iso}T12:00:00Z`));

  const investPct = Math.min(100, Math.round((earnedMonth / START_INVESTMENT) * 100));
  const beyond = earnedMonth - START_INVESTMENT;

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight">Hallo {tech.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm">
          {jobsToday.length} <PreviewText>{jobsToday.length === 1 ? 'klus' : 'klussen'}</PreviewText> <PreviewText>vandaag</PreviewText>
          {' · '}{finishedToday.length} <PreviewText>afgerond</PreviewText>
        </p>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            <PreviewText>Volgende klus</PreviewText>
            {upcoming.length > 0 && (
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                · {upcoming.length} <PreviewText>{upcoming.length === 1 ? 'klus' : 'klussen'}</PreviewText> <PreviewText>nog te gaan</PreviewText>
              </span>
            )}
          </CardTitle>
          <CardAction>
            <Button asChild size="sm">
              <Link href="/admin/vandaag">
                <PreviewText>{next?.status === 'gepland' ? 'Start: ik ga rijden' : 'Open Vandaag'}</PreviewText>
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!next ? (
            <p className="text-muted-foreground text-sm">
              <PreviewText>
                {finishedToday.length > 0
                  ? `Geen klussen meer vandaag — ${finishedToday.length} afgerond. Goed gedaan!`
                  : 'Geen klussen gepland voor vandaag.'}
              </PreviewText>
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{slotLabel(next.slot_start, next.slot_end)}</Badge>
                <span className="text-muted-foreground text-sm">{JOB_STATUS_LABELS[next.status as JobStatus] ?? next.status}</span>
              </div>
              {car && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  {next.car_make ? <BrandLogo make={next.car_make} /> : <Car size={18} strokeWidth={2} className="text-muted-foreground" />}
                  {car}
                  {next.keyless !== null && <Badge variant="outline">{next.keyless ? 'Keyless' : 'Sleutel'}</Badge>}
                </div>
              )}
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <MapPin size={16} strokeWidth={2} />
                <PreviewText>{address || 'Geen adres'}</PreviewText>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Wrench size={14} strokeWidth={2} />
                <PreviewText>{next.service_type ?? 'geen dienst'}</PreviewText>
              </div>
            </div>
          )}

          {upcoming.length > 1 && (
            <ul className="grid gap-1 border-t pt-3">
              {upcoming.slice(1).map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 px-1 py-1.5">
                  <span className="grid min-w-0 gap-0.5">
                    <b className="truncate text-sm font-medium">{[job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ') || 'Klus'}</b>
                    {job.service_type && <span className="text-muted-foreground truncate text-xs">{job.service_type}</span>}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {slotLabel(job.slot_start, job.slot_end)} · {job.city || '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <PreviewText>Investering</PreviewText> {monthName} <b>{EUR.format(START_INVESTMENT)}</b>
          </CardTitle>
          <CardAction>
            <span className={`text-sm font-medium ${beyond >= 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {beyond >= 0 ? `+ ${EUR.format(beyond)} winst` : `nog ${EUR.format(-beyond)}`}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={investPct} aria-label={`Investering ${monthName}`} />
          <span className="text-muted-foreground text-xs">
            {EUR.format(earnedMonth)} <PreviewText>verdiend in</PreviewText> {monthJobs.length}{' '}
            <PreviewText>{monthJobs.length === 1 ? 'klus' : 'klussen'}</PreviewText> <PreviewText>deze maand</PreviewText> · {investPct}%{' '}
            <PreviewText>terugverdiend</PreviewText>
          </span>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase"><PreviewText>Snel naar</PreviewText></h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            tone="accent"
            href="/admin/aanbod"
            icon={<Handshake size={22} strokeWidth={1.8} />}
            title="Aanbod"
            sub={offerCount ? `${offerCount} nieuwe klus${offerCount === 1 ? '' : 'sen'} aangeboden` : 'Nu geen aanbod'}
          />
          <Tile tone="steel" href="/admin/mijn-agenda" icon={<CalendarDays size={20} strokeWidth={1.8} />} title="Mijn agenda" sub={`${weekCount} klussen deze week`} />
          <Tile
            tone={outOfStock || lowStock ? 'warn' : 'plain'}
            href="/admin/mijn-bus"
            icon={<Package size={20} strokeWidth={1.8} />}
            title="Mijn bus"
            sub={outOfStock || lowStock ? `${outOfStock + lowStock} bijna op` : 'Voorraad in orde'}
          />
          <Tile
            tone="ok"
            href="/admin/mijn-saldo"
            icon={<Wallet size={20} strokeWidth={1.8} />}
            title="Saldo"
            sub={`${EUR2.format(available)} beschikbaar${pendingPayout ? ' · uitbetaling aangevraagd' : ''}`}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            <PreviewText>Mijn cijfers</PreviewText> · <PreviewText>{PERIOD_LABEL[period].toLowerCase()}</PreviewText>
          </h2>
          <nav className="flex gap-1 rounded-lg border p-1" aria-label="Periode">
            {(['vandaag', 'week', 'maand'] as Period[]).map((p) => (
              <Button key={p} asChild size="sm" variant={p === period ? 'default' : 'ghost'}>
                <Link href={`/admin/overzicht?periode=${p}`}><PreviewText>{PERIOD_LABEL[p]}</PreviewText></Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard strong label="Jij verdiende" value={EUR.format(k.earned[0])} cur={k.earned[0]} prev={k.earned[1]} foot="na commissie" />
          <KpiCard label="Klussen afgerond" value={String(k.jobs[0])} cur={k.jobs[0]} prev={k.jobs[1]} />
          <KpiCard label="Omzet klanten" value={EUR.format(k.revenue[0])} cur={k.revenue[0]} prev={k.revenue[1]} foot="wat de klanten betaalden" />
          <KpiCard label="Gemiddeld per klus" value={EUR.format(avgCur)} cur={avgCur} prev={avgPrev} foot="jouw deel per klus" />
        </div>
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle><PreviewText>Per dag</PreviewText> · <PreviewText>laatste</PreviewText> {days} <PreviewText>dagen</PreviewText></CardTitle>
          <CardAction>
            <Button asChild variant="outline" size="sm"><Link href="/admin/mijn-saldo">Saldo →</Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <StudioSalesChart data={series} barLabel="Omzet" lineLabel="Jij verdiende" countLabel="klussen" />
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle><PreviewText>Mijn klussen</PreviewText> · {done.length} <PreviewText>afgerond</PreviewText></CardTitle>
          <CardAction>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/mijn-klussen">Alles →</Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {done.length === 0 ? (
            <p className="text-muted-foreground text-sm"><PreviewText>Nog geen afgeronde klussen. Je eerste verschijnt hier.</PreviewText></p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><PreviewText>Datum</PreviewText></TableHead>
                    <TableHead><PreviewText>Auto en klus</PreviewText></TableHead>
                    <TableHead><PreviewText>Waar</PreviewText></TableHead>
                    <TableHead className="text-right"><PreviewText>Klant betaalde</PreviewText></TableHead>
                    <TableHead className="text-right"><PreviewText>Jij kreeg</PreviewText></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {done.slice(0, 10).map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="whitespace-nowrap">{shortDate(dayOf(j))}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <BrandLogo make={j.car_make} />
                          <span className="min-w-0">
                            <b className="font-medium">{[j.car_make, j.car_model].filter(Boolean).join(' ') || 'Auto'}</b>
                            <span className="text-muted-foreground"> · {serviceOf(j)}</span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>{j.city ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{EUR2.format(priceOf(j))}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{EUR2.format(earnedOn(j))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {(outOfStock > 0 || lowStock > 0) && (
        <Card>
          <CardHeader>
            <CardTitle><PreviewText>Even checken</PreviewText></CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1">
              {outOfStock > 0 && (
                <li>
                  <Link href="/admin/mijn-bus" className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-2 py-2">
                    <span className="text-sm font-medium"><PreviewText>Artikelen op in je bus</PreviewText></span>
                    <span className="text-muted-foreground text-xs">{outOfStock} artikel{outOfStock === 1 ? '' : 'en'}</span>
                  </Link>
                </li>
              )}
              {lowStock > 0 && (
                <li>
                  <Link href="/admin/mijn-bus" className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-2 py-2">
                    <span className="text-sm font-medium"><PreviewText>Bijna op in je bus</PreviewText></span>
                    <span className="text-muted-foreground text-xs">{lowStock} artikel{lowStock === 1 ? '' : 'en'}</span>
                  </Link>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
