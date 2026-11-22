'use client';

import { Line, LineChart, XAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import StudioPayoutForm from './StudioPayoutForm';

const euro = (value: number) => `€ ${value.toFixed(2).replace('.', ',')}`;
const euroHeadline = (value: number) =>
  value >= 1000 ? `€ ${Math.round(value).toLocaleString('nl-NL')}` : `€ ${value.toFixed(2).replace('.', ',')}`;
const euroShort = (value: number) => (value >= 1000 ? `€${Math.round(value / 1000)}K` : `€${Math.round(value)}`);

const tone = (n: number | null) => (n !== null && n < 0 ? 'text-destructive' : 'text-green-500');
const signed = (n: number | null) => (n === null ? 'nieuw' : `${n >= 0 ? '+' : ''}${Math.round(n)}%`);

export interface SaldoRanked {
  label: string;
  value: number;
}

export interface SaldoJobRow {
  id: string;
  date: string | null;
  make: string | null;
  model: string | null;
  logo: string | null;
  service: string;
  price: number;
  commission: number;
  earned: number;
}

export default function StudioSaldo({
  available,
  earnedTotal,
  paidOut,
  pending,
  doneCount,
  countDelta,
  revenue,
  revenueDelta,
  avgDelta,
  chartData,
  thisYearLabel,
  lastYearLabel,
  hasLastYear,
  makes,
  kinds,
  places,
  rows,
}: {
  available: number;
  earnedTotal: number;
  paidOut: number;
  pending: number;
  doneCount: number;
  countDelta: number | null;
  revenue: number;
  revenueDelta: number | null;
  avgDelta: number | null;
  chartData: { month: string; thisYear: number; lastYear: number | null }[];
  thisYearLabel: string;
  lastYearLabel: string;
  hasLastYear: boolean;
  makes: SaldoRanked[];
  kinds: SaldoRanked[];
  places: SaldoRanked[];
  rows: SaldoJobRow[];
}) {
  const chartConfig = {
    thisYear: { label: thisYearLabel, color: 'var(--chart-1)' },
    lastYear: { label: lastYearLabel, color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  const maxMake = Math.max(1, ...makes.map((m) => m.value));
  const maxKind = Math.max(1, ...kinds.map((k) => k.value));
  const maxPlace = Math.max(1, ...places.map((p) => p.value));

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight">Mijn saldo</h1>
        <p className="text-muted-foreground text-sm">Wat je verdiende op klussen via Autosleutel24, en waar het vandaan kwam.</p>
      </div>

      <Card className="bg-foreground text-background">
        <CardContent className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm opacity-70">Beschikbaar om op te nemen</span>
            <span className="text-3xl font-semibold tabular-nums">{euro(available)}</span>
            <span className="text-sm opacity-70">
              Verdiend {euro(earnedTotal)} · uitbetaald {euro(paidOut)}
              {pending > 0 && <> · aangevraagd {euro(pending)}</>}
            </span>
          </div>
          <StudioPayoutForm available={available} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Beschikbaar</CardDescription>
            <CardTitle className="text-xl">{euroHeadline(available)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Klussen</CardDescription>
            <CardTitle className="text-xl">{doneCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-sm font-medium ${tone(countDelta)}`}>{signed(countDelta)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Omzet</CardDescription>
            <CardTitle className="text-xl">{euroHeadline(revenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-sm font-medium ${tone(revenueDelta)}`}>{signed(revenueDelta)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Gemiddelde klus</CardDescription>
            <CardTitle className="text-xl">{doneCount ? euroHeadline(revenue / doneCount) : '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-sm font-medium ${tone(avgDelta)}`}>{signed(avgDelta)}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Omzet per maand</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-56 w-full" config={chartConfig}>
              <LineChart data={chartData} margin={{ left: 0, right: 8, top: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={8} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => euroShort(Number(value))} />} />
                <Line dataKey="thisYear" stroke="var(--color-thisYear)" strokeWidth={2} dot={false} isAnimationActive={false} />
                {hasLastYear && (
                  <Line
                    dataKey="lastYear"
                    stroke="var(--color-lastYear)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automerken</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {makes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nog geen afgeronde klussen.</p>
            ) : (
              makes.map((m) => (
                <div key={m.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{m.label}</span>
                    <span className="font-medium tabular-nums">{euro(m.value)}</span>
                  </div>
                  <Progress value={(m.value / maxMake) * 100} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Soort werk</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {kinds.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nog geen afgeronde klussen.</p>
            ) : (
              kinds.map((k) => (
                <div key={k.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{k.label}</span>
                    <span className="font-medium tabular-nums">{euroShort(k.value)}</span>
                  </div>
                  <Progress value={(k.value / maxKind) * 100} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waar je werkte</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {places.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nog geen afgeronde klussen.</p>
            ) : (
              places.map((p) => (
                <div key={p.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{p.label}</span>
                    <span className="font-medium tabular-nums">{euro(p.value)}</span>
                  </div>
                  <Progress value={(p.value / maxPlace) * 100} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Afgeronde klussen</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <p className="text-muted-foreground px-6 text-sm">Zodra je een klus afrondt, verschijnt hij hier.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Auto</TableHead>
                  <TableHead>Werk</TableHead>
                  <TableHead className="text-right">Klus</TableHead>
                  <TableHead className="text-right">Commissie</TableHead>
                  <TableHead className="text-right">Voor jou</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="text-muted-foreground">
                      {job.date ? new Date(job.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {job.logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={job.logo} alt="" className="size-5 object-contain" />
                        )}
                        {[job.make, job.model].filter(Boolean).join(' ') || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.service}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{euro(job.price)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{euro(job.commission)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{euro(job.earned)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
