'use client';

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { DayPoint } from '../dashboardData';
import { usePreviewLanguage } from '../../PreviewLanguage';

/**
 * The same series as the old SalesChart — revenue as bars, gross profit as a
 * line — drawn with recharts inside the shadcn chart frame. The leads per day move to the tooltip's label line.
 */
export default function StudioSalesChart({
  data,
  barLabel = 'Omzet',
  lineLabel = 'Brutowinst',
  countLabel = 'leads',
}: {
  data: DayPoint[];
  barLabel?: string;
  lineLabel?: string;
  /** What the number on the tooltip's label line counts (leads, klussen …). */
  countLabel?: string;
}) {
  const { english, t } = usePreviewLanguage();
  const euro = new Intl.NumberFormat(english ? 'en-GB' : 'nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const config = {
    revenue: { label: t(barLabel), color: 'var(--chart-1)' },
    margin: { label: t(lineLabel), color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  const rows = data.map((d) => {
    const date = new Date(`${d.day}T12:00:00Z`);
    return { ...d, label: `${date.getUTCDate()}/${date.getUTCMonth() + 1}` };
  });
  const leadsOf = new Map(rows.map((r) => [r.label, r.leads]));

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <ComposedChart data={rows} margin={{ left: 0, right: 0, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
        <YAxis hide domain={[0, 'dataMax']} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `${label} · ${leadsOf.get(String(label)) ?? 0} ${t(countLabel)}`}
              formatter={(value) => euro.format(Number(value))}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} isAnimationActive={false} />
        <Line dataKey="margin" type="monotone" stroke="var(--color-margin)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ChartContainer>
  );
}
