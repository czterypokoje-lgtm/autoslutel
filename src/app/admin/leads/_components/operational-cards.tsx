'use client';

import Link from 'next/link';
import { cn } from 'cn';
import { Clock } from 'lucide-react';
import { Funnel, FunnelChart, LabelList } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import type { LeadsDashboard } from '@/lib/kfcLeads';
import { usePreviewLanguage } from '../../PreviewLanguage';

import { MONEY0, signed } from './labels';

const funnelConfig = { value: { label: 'Leads', color: 'var(--chart-1)' }, stage: { label: 'Fase' } } satisfies ChartConfig;

export function OperationalCards({ data }: { data: LeadsDashboard }) {
  const { t } = usePreviewLanguage();
  const totalSales = data.regions.reduce((sum, region) => sum + region.sales, 0);
  const funnelData = data.funnel.map((row, i) => ({ ...row, stage: t(row.stage), fill: `var(--chart-${i + 1})` }));
  const conversion = data.funnel[0].value > 0 ? Math.round((data.funnel[3].value / data.funnel[0].value) * 100) : 0;

  /* Backlog that needs a person today, each linking to the list that shows it. */
  const items = [
    { id: 1, count: data.actions.staleNew, title: t('Nieuwe leads langer dan een uur onaangeraakt'), desc: t('Bel terug of wijs toe'), due: t('Vandaag'), priority: 'High', href: '/admin/leads/lijst?status=new&dagen=7' },
    { id: 2, count: data.actions.noContact, title: t('Leads zonder eerste contact na 24 uur'), desc: t('Nog niemand heeft de klant gesproken'), due: t('Deze week'), priority: 'Medium', href: '/admin/leads/lijst?status=qualified' },
    { id: 3, count: data.actions.quietQuotes, title: t('Offertes zonder antwoord na 7 dagen'), desc: t('Stuur een herinnering of sluit af'), due: t('Deze week'), priority: 'Low', href: '/admin/leads/lijst?status=contacted&dagen=30' },
  ];

  return (
    <div className="grid gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{t('Verkooptrechter')}</CardTitle>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer config={funnelConfig} className="size-full">
            <FunnelChart margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <Funnel className="stroke-card stroke-2" dataKey="value" data={funnelData} isAnimationActive={false}>
                <LabelList className="fill-foreground stroke-0" dataKey="stage" position="right" offset={10} />
                <LabelList className="fill-foreground stroke-0" dataKey="value" position="left" offset={10} />
              </Funnel>
            </FunnelChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">{conversion}% {t('van de leads van de afgelopen twaalf maanden is verkocht.')}</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Verkoop per regio')}</CardTitle>
          <CardDescription className="font-medium tabular-nums">{MONEY0.format(totalSales)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {data.regions.map((region) => (
              <div key={region.region} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{region.region}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold tabular-nums">{MONEY0.format(region.sales)}</span>
                    <span className={cn('text-xs font-medium tabular-nums', region.growth !== null && region.growth < 0 ? 'text-destructive' : 'text-green-500')}>{signed(region.growth)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={region.percentage} />
                  <span className="text-muted-foreground text-xs font-medium tabular-nums">{region.percentage}%</span>
                </div>
              </div>
            ))}
            {data.regions.length === 0 && <p className="text-muted-foreground text-sm">{t('Nog geen verkopen in de afgelopen zes maanden.')}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-muted-foreground flex justify-between gap-1 text-xs">
            <span>{data.regions.length} {t("regio's")}</span>
            <span>•</span>
            <span>{data.regions.filter((r) => (r.growth ?? 0) > 0).length} {t('groeiend')}</span>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Actiepunten')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className="space-y-2 rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={item.count === 0} disabled aria-label={item.count === 0 ? t('Afgehandeld') : t('Open')} />
                  <Link href={item.href} className="text-sm font-medium hover:underline">
                    {item.count} {item.title.toLowerCase()}
                  </Link>
                  <span
                    className={cn(
                      'w-fit rounded-md px-2 py-1 text-xs font-medium',
                      item.priority === 'High' && 'bg-destructive/20 text-destructive',
                      item.priority === 'Medium' && 'bg-yellow-500/20 text-yellow-500',
                      item.priority === 'Low' && 'bg-green-500/20 text-green-500',
                    )}
                  >
                    {t(item.priority === 'High' ? 'Hoog' : item.priority === 'Medium' ? 'Midden' : 'Laag')}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs font-medium">{item.desc}</div>
                <div className="flex items-center gap-1">
                  <Clock className="text-muted-foreground size-3" />
                  <span className="text-muted-foreground text-xs font-medium">{item.due}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
