'use client';

import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Label, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { LeadsDashboard } from '@/lib/kfcLeads';
import { usePreviewLanguage } from '../../PreviewLanguage';

import { sourceLabel } from './labels';

const serviceChartConfig = {
  actual: { label: 'Verkocht', color: 'var(--chart-1)' },
  remaining: { label: 'Niet verkocht', color: 'var(--chart-2)' },
  label: { color: 'var(--primary-foreground)' },
} satisfies ChartConfig;

export function InsightCards({ data }: { data: LeadsDashboard }) {
  const { t } = usePreviewLanguage();
  const totalLeads = data.bySource.reduce((acc, curr) => acc + curr.leads, 0);
  const sourceConfig: ChartConfig = { leads: { label: 'Leads' } };
  const sourceData = data.bySource.map((item, i) => {
    sourceConfig[item.source] = { label: t(sourceLabel(item.source)), color: `var(--chart-${(i % 5) + 1})` };
    return { ...item, fill: `var(--color-${item.source})` };
  });
  const sold = data.byService.reduce((s, r) => s + r.actual, 0);
  const all = data.byService.reduce((s, r) => s + r.actual + r.remaining, 0);

  function downloadCsv() {
    const lines = ['Bron;Leads', ...data.bySource.map((r) => `${sourceLabel(r.source)};${r.leads}`)];
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })), download: 'leads-per-bron.csv' });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-5">
      <Card className="col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle>{t('Leads per bron')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <ChartContainer config={sourceConfig} className="mx-auto aspect-square max-h-48 flex-1">
            <PieChart className="m-0" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={sourceData} dataKey="leads" nameKey="source" innerRadius={65} outerRadius={90} paddingAngle={2} cornerRadius={4} isAnimationActive={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold tabular-nums">
                            {totalLeads.toLocaleString('nl-NL')}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                            Leads
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul className="flex flex-col gap-3">
            {sourceData.map((item) => (
              <li key={item.source} className="flex w-36 items-center justify-between">
                <span className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: sourceConfig[item.source]?.color }} />
                  {sourceConfig[item.source]?.label}
                </span>
                <span className="text-xs tabular-nums">{item.leads}</span>
              </li>
            ))}
            {sourceData.length === 0 && <li className="text-muted-foreground text-xs">{t('Nog geen leads deze maand.')}</li>}
          </ul>
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm" variant="outline" className="basis-1/2" asChild>
            <Link href="/admin/attributie">{t('Volledig rapport')}</Link>
          </Button>
          <Button size="sm" variant="outline" className="basis-1/2" onClick={downloadCsv}>
            {t('Download CSV')}
          </Button>
        </CardFooter>
      </Card>

      <Card className="col-span-1 xl:col-span-3">
        <CardHeader>
          <CardTitle>{t('Verkocht per dienst')}</CardTitle>
        </CardHeader>
        <CardContent className="size-full max-h-52">
          <ChartContainer config={serviceChartConfig} className="size-full">
            <BarChart accessibilityLayer data={data.byService} layout="vertical">
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} hide />
              <XAxis dataKey="actual" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Bar stackId="a" dataKey="actual" fill="var(--color-actual)" isAnimationActive={false}>
                <LabelList dataKey="name" position="insideLeft" offset={8} className="fill-primary-foreground text-xs" />
                <LabelList dataKey="actual" position="insideRight" offset={8} className="fill-primary-foreground text-xs tabular-nums" />
              </Bar>
              <Bar stackId="a" dataKey="remaining" fill="var(--color-remaining)" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                <LabelList dataKey="remaining" position="insideRight" offset={8} className="fill-primary-foreground text-xs tabular-nums" />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">
            {t('Conversie')}: {all > 0 ? Math.round((sold / all) * 100) : 0}% · {sold} {t('van')} {all} {t('leads verkocht, afgelopen twaalf maanden')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
