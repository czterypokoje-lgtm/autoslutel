'use client';

import { BadgeDollarSign, Wallet } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { LeadsDashboard } from '@/lib/kfcLeads';
import { usePreviewLanguage } from '../../PreviewLanguage';

import { MONEY0, signed } from './labels';

const leadsChartConfig = {
  newLeads: { label: 'Nieuwe leads', color: 'var(--chart-1)' },
  disqualified: { label: 'Afgewezen / dubbel', color: 'var(--chart-3)' },
  background: { color: 'var(--primary)' },
} satisfies ChartConfig;
const quotesChartConfig = { proposalsSent: { label: 'Offertes', color: 'var(--chart-1)' } } satisfies ChartConfig;
const revenueChartConfig = { revenue: { label: 'Omzet', color: 'var(--chart-1)' } } satisfies ChartConfig;

const tone = (n: number | null) => (n !== null && n < 0 ? 'text-destructive' : 'text-green-500');

export function OverviewCards({ data }: { data: LeadsDashboard }) {
  const { t } = usePreviewLanguage();
  return (
    <div className="grid gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Nieuwe leads')}</CardTitle>
          <CardDescription>{t('Afgelopen 30 dagen')}</CardDescription>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer className="size-full min-h-24" config={leadsChartConfig}>
            <BarChart accessibilityLayer data={data.newLeads.buckets} barSize={8}>
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => `${t('Dag')} ${label}`} />} />
              <Bar background={{ fill: 'var(--color-background)', radius: 4, opacity: 0.07 }} dataKey="newLeads" stackId="a" fill="var(--color-newLeads)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="disqualified" stackId="a" fill="var(--color-disqualified)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xl font-semibold tabular-nums">{data.newLeads.total}</span>
          <span className={`text-sm font-medium ${tone(data.newLeads.change)}`}>{signed(data.newLeads.change)}</span>
        </CardFooter>
      </Card>

      <Card className="overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>{t('Offertes')}</CardTitle>
          <CardDescription>{t('Afgelopen 30 dagen')} · {data.quotes.total}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ChartContainer className="size-full min-h-24" config={quotesChartConfig}>
            <AreaChart data={data.quotes.buckets} margin={{ left: 0, right: 0, top: 5 }}>
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => `${t('Dag')} ${label}`} hideIndicator />} />
              <Area dataKey="proposalsSent" fill="var(--color-proposalsSent)" fillOpacity={0.05} stroke="var(--color-proposalsSent)" strokeWidth={2} type="monotone" isAnimationActive={false} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="w-fit rounded-lg bg-green-500/10 p-2">
            <Wallet className="size-5 text-green-500" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between">
          <div className="space-y-1.5">
            <CardTitle>{t('Omzet uit leads')}</CardTitle>
            <CardDescription>{t('Afgelopen 6 maanden')}</CardDescription>
          </div>
          <p className="text-2xl font-medium tabular-nums">{MONEY0.format(data.revenue6m.amount)}</p>
          <div className={`w-fit rounded-md px-2 py-1 text-xs font-medium ${data.revenue6m.change !== null && data.revenue6m.change < 0 ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-500'}`}>{signed(data.revenue6m.change)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="bg-destructive/10 w-fit rounded-lg p-2">
            <BadgeDollarSign className="text-destructive size-5" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between">
          <div className="space-y-1.5">
            <CardTitle>{t('Verkocht')}</CardTitle>
            <CardDescription>{t('Afgelopen 6 maanden')}</CardDescription>
          </div>
          <p className="text-2xl font-medium tabular-nums">{data.won6m.count}</p>
          <div className={`w-fit rounded-md px-2 py-1 text-xs font-medium ${data.won6m.change !== null && data.won6m.change < 0 ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-500'}`}>{signed(data.won6m.change)}</div>
        </CardContent>
      </Card>

      <Card className="col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle>{t('Omzetgroei')}</CardTitle>
          <CardDescription>{t('Laatste 12 maanden')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueChartConfig} className="h-24 w-full">
            <LineChart data={data.revenueByMonth} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" strokeWidth={2} dataKey="revenue" stroke="var(--color-revenue)" activeDot={{ r: 6 }} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-sm">{data.revenueYoy === null ? t('Nog geen vergelijking met vorig jaar') : `${signed(data.revenueYoy)} ${t('ten opzichte van dezelfde periode vorig jaar')}`}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
