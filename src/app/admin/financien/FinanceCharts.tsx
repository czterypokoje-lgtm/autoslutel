'use client';

import { CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { usePreviewLanguage } from '../PreviewLanguage';

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export function BankFlowChart({ rows, weekly }: {
  rows: { date: string; incoming: number; outgoing: number; tick?: boolean }[];
  weekly: boolean;
}) {
  const { english, t } = usePreviewLanguage();
  const locale = english ? 'en-GB' : 'nl-NL';
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
  const date = new Intl.DateTimeFormat(locale, weekly
    ? { weekday: 'short', timeZone: 'UTC' }
    : { month: 'short', year: '2-digit', timeZone: 'UTC' });
  const config = {
    incoming: { label: t('Inkomend'), color: 'var(--chart-2)' },
    outgoing: { label: t('Uitgaand'), color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  return <>
    <div className="mb-2 flex gap-4 text-xs">
      <span><span aria-hidden className="mr-1 inline-block w-4 border-t-2 border-dashed border-chart-2 align-middle" />{config.incoming.label}</span>
      <span><span aria-hidden className="mr-1 inline-block w-4 border-t-2 border-chart-1 align-middle" />{config.outgoing.label}</span>
    </div>
    <ChartContainer config={config} className="h-[220px] w-full">
      <LineChart accessibilityLayer data={rows} margin={{ top: 10, right: 12, bottom: 4, left: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" ticks={rows.filter((row) => row.tick !== false).map((row) => row.date)} axisLine={false} tickLine={false} tickMargin={10} tickFormatter={(key) => date.format(new Date(key))} />
        <YAxis hide domain={[0, 'auto']} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent
            labelFormatter={(key) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', ...(String(key).includes('T') ? { timeStyle: 'short' } : {}), timeZone: 'UTC' }).format(new Date(key))}
            formatter={(value, name) => <><span>{config[name as keyof typeof config]?.label}</span><strong className="ml-auto tabular-nums">{currency.format(Number(value) / 100)}</strong></>}
          />}
        />
        <Line dataKey="incoming" type="linear" dot={rows.length === 1 ? { r: 4 } : false} stroke="var(--color-incoming)" strokeDasharray="5 5" strokeWidth={2} isAnimationActive={false} />
        <Line dataKey="outgoing" type="linear" dot={rows.length === 1 ? { r: 4 } : false} stroke="var(--color-outgoing)" strokeLinecap="round" strokeWidth={3} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  </>;
}

export function ExpenseDonut({ categories, total }: { categories: { label: string; amount: number }[]; total: number }) {
  const { english, t } = usePreviewLanguage();
  const locale = english ? 'en-GB' : 'nl-NL';
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
  const data = categories.map((item, index) => ({ ...item, name: t(item.label), fill: colors[index % colors.length] }));
  const canDraw = total > 0 && data.every((item) => item.amount >= 0);
  const config = { amount: { label: t('Uitgaven') } } satisfies ChartConfig;

  return <div className="flex flex-wrap items-center gap-4">
    {canDraw && <div className="relative mx-auto size-[184px] shrink-0">
      <ChartContainer config={config} className="size-full">
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={85}
            paddingAngle={2} cornerRadius={6} stroke="var(--card)" strokeWidth={2} isAnimationActive={false} />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
        <span className="text-muted-foreground text-xs">{t('Totaal')}</span>
        <strong className="text-base tabular-nums">{money.format(total / 100)}</strong>
      </div>
    </div>}
    <ul className="grid min-w-36 flex-1 gap-2 text-sm">
      {data.map((item) => <li key={item.label} className="grid grid-cols-[1fr_auto] items-end gap-2">
        <div className="min-w-0">
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            {canDraw && <span aria-hidden className="h-2 w-1 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />}
            {item.name}
          </div>
          <strong className="font-medium tabular-nums">{money.format(item.amount / 100)}</strong>
        </div>
        {canDraw && <span className="tabular-nums">{percent.format(item.amount / total)}</span>}
      </li>)}
    </ul>
  </div>;
}
