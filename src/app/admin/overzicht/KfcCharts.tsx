'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

/** Revenue over time and revenue per shop, as recharts inside shadcn chart frames. Values are euro. */

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const barConfig = { value: { label: 'Omzet', color: 'var(--chart-1)' } } satisfies ChartConfig;
const SHOP_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

export function RevenueBars({ bars }: { bars: { label: string; value: number }[] }) {
  return (
    <ChartContainer config={barConfig} className="h-64 w-full">
      <BarChart data={bars} margin={{ left: 0, right: 0, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
        <YAxis hide domain={[0, 'dataMax']} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => euro.format(Number(value))} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}

export function ShopDonut({ slices }: { slices: { label: string; value: number }[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const config = Object.fromEntries(slices.map((slice, i) => [slice.label, { label: slice.label, color: SHOP_COLORS[i % SHOP_COLORS.length] }])) satisfies ChartConfig;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <ChartContainer config={config} className="aspect-square h-40">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="label" formatter={(value) => euro.format(Number(value))} />} />
          <Pie data={slices} dataKey="value" nameKey="label" innerRadius={44} outerRadius={70} strokeWidth={2} isAnimationActive={false}>
            {slices.map((slice, i) => <Cell key={slice.label} fill={SHOP_COLORS[i % SHOP_COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="grid min-w-56 flex-1 gap-2 text-sm">
        {slices.map((slice, i) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: SHOP_COLORS[i % SHOP_COLORS.length] }} />
            <span className="text-muted-foreground">{slice.label}</span>
            <span className="ml-auto font-medium tabular-nums">{euro.format(slice.value)}</span>
            <span className="text-muted-foreground w-12 text-right tabular-nums">{total ? Math.round((slice.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
