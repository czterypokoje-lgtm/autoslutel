'use client';

import Link from 'next/link';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CHANNELS, MOVE_REASONS, REPORTS, type ReportMeta } from '@/lib/kfcReportColumns';
import { usePreviewLanguage } from '../../PreviewLanguage';

export interface FilterValues {
  from: string; to: string; date: string; q: string; category: string; warehouse: string; channel: string;
  group: string; reason: string; basis: string; speed: string; lead: number;
}

const field = 'border-input bg-background h-9 rounded-md border px-2 text-sm';
const iso = (d: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(d);

/** Period shortcuts, Monday-based weeks, Amsterdam calendar. */
function presets(today: string) {
  const t = new Date(`${today}T12:00:00Z`);
  const shift = (days: number) => iso(new Date(t.getTime() + days * 86_400_000));
  const monday = shift(-((t.getUTCDay() + 6) % 7));
  const monthStart = today.slice(0, 8) + '01';
  const lastMonthEnd = iso(new Date(Date.parse(`${monthStart}T12:00:00Z`) - 86_400_000));
  return [
    { nl: 'Vandaag', en: 'Today', from: today, to: today },
    { nl: 'Deze week', en: 'This week', from: monday, to: today },
    { nl: 'Deze maand', en: 'This month', from: monthStart, to: today },
    { nl: 'Vorige maand', en: 'Last month', from: lastMonthEnd.slice(0, 8) + '01', to: lastMonthEnd },
    { nl: '90 dagen', en: '90 days', from: shift(-89), to: today },
    { nl: 'Dit jaar', en: 'This year', from: today.slice(0, 5) + '01-01', to: today },
    { nl: '12 maanden', en: '12 months', from: shift(-364), to: today },
  ];
}

/**
 * The filter bar of one report: a plain GET form, so the filters are the URL
 * (bookmark it, send it, it is a saved view) and it works before any script
 * has loaded. Hidden fields keep the report, columns and sort.
 */
export default function ReportFilters({ meta, values, options, today, keep }: {
  meta: ReportMeta; values: FilterValues; today: string;
  options: { categories: string[]; warehouses: string[] };
  keep: Record<string, string>;
}) {
  const { english } = usePreviewLanguage();
  const has = (key: string) => meta.filters.includes(key as never);
  const L = (nl: string, en: string) => (english ? en : nl);
  const base = new URLSearchParams({ r: meta.id, ...keep });
  const presetHref = (from: string, to: string) => {
    const next = new URLSearchParams(base);
    for (const [key, value] of Object.entries({ category: values.category, warehouse: values.warehouse, channel: values.channel, group: values.group, q: values.q, basis: values.basis })) {
      if (value && has(key)) next.set(key, value);
    }
    next.set('from', from); next.set('to', to);
    return `?${next}`;
  };
  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-3 print:hidden">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="r" value={meta.id} />
        {Object.entries(keep).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
        {has('from') && <label className="grid gap-1 text-xs font-medium">{L('Vanaf', 'From')}<input className={field} type="date" name="from" defaultValue={values.from} /></label>}
        {has('to') && <label className="grid gap-1 text-xs font-medium">{L('Tot en met', 'Up to')}<input className={field} type="date" name="to" defaultValue={values.to} /></label>}
        {has('date') && <label className="grid gap-1 text-xs font-medium">{L('Peildatum', 'As of')}<input className={field} type="date" name="date" defaultValue={values.date} max={today} /></label>}
        {has('q') && <label className="grid min-w-44 flex-1 gap-1 text-xs font-medium">{L('Artikel, SKU of naam', 'Item, SKU or name')}
          <input className={field} type="search" name="q" defaultValue={values.q} autoComplete="off" /></label>}
        {has('category') && <label className="grid gap-1 text-xs font-medium">{L('Categorie', 'Category')}
          <select className={field} name="category" defaultValue={values.category}>
            <option value="">{L('Alle categorieën', 'All categories')}</option>
            {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></label>}
        {has('warehouse') && <label className="grid gap-1 text-xs font-medium">{L('Magazijn', 'Warehouse')}
          <select className={field} name="warehouse" defaultValue={values.warehouse}>
            <option value="">{L('Alle magazijnen', 'All warehouses')}</option>
            {options.warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
            {meta.id !== 'ledger' && <option value="(geen locatie)">{L('(geen locatie)', '(no location)')}</option>}
          </select></label>}
        {has('channel') && <label className="grid gap-1 text-xs font-medium">{L('Kanaal', 'Channel')}
          <select className={field} name="channel" defaultValue={values.channel}>
            <option value="">{L('Alle kanalen', 'All channels')}</option>
            {CHANNELS.map((c) => <option key={c.id} value={c.id}>{english ? c.en : c.nl}</option>)}
          </select></label>}
        {has('reason') && <label className="grid gap-1 text-xs font-medium">{L('Soort boeking', 'Movement type')}
          <select className={field} name="reason" defaultValue={values.reason}>
            <option value="">{L('Alle soorten', 'All types')}</option>
            {MOVE_REASONS.map((r) => <option key={r.id} value={r.id}>{english ? r.en : r.nl}</option>)}
          </select></label>}
        {has('group') && meta.groups && <label className="grid gap-1 text-xs font-medium">{L('Groeperen', 'Group by')}
          <select className={field} name="group" defaultValue={values.group}>
            {meta.groups.map((g) => <option key={g.id} value={g.id}>{english ? g.en : g.nl}</option>)}
          </select></label>}
        {has('basis') && <label className="grid gap-1 text-xs font-medium">{L('Rangschikken op', 'Rank by')}
          <select className={field} name="basis" defaultValue={values.basis}>
            <option value="aantal">{L('Aantal', 'Units')}</option>
            <option value="omzet">{L('Omzet', 'Revenue')}</option>
            <option value="winst">{L('Brutowinst', 'Gross profit')}</option>
          </select></label>}
        {has('speed') && <label className="grid gap-1 text-xs font-medium">{L('Snelheid', 'Speed')}
          <select className={field} name="speed" defaultValue={values.speed}>
            <option value="">{L('Alles', 'All')}</option>
            <option value="snel">{L('Snellopers', 'Fast movers')}</option>
            <option value="traag">{L('Traaglopers', 'Slow movers')}</option>
            <option value="dood">{L('Voorraad zonder verkoop', 'Stock without sales')}</option>
          </select></label>}
        {has('lead') && <label className="grid gap-1 text-xs font-medium">{L('Levertijd (dagen)', 'Lead time (days)')}
          <input className={`${field} w-24`} type="number" name="lead" min={1} max={120} defaultValue={values.lead} /></label>}
        <Button type="submit" size="sm" className="h-9"><Filter aria-hidden="true" />{L('Toepassen', 'Apply')}</Button>
        <Button asChild type="button" variant="ghost" size="sm" className="h-9"><Link href={`?r=${meta.id}`}><RotateCcw aria-hidden="true" />{L('Wissen', 'Reset')}</Link></Button>
      </form>
      {has('from') && (
        <nav className="flex flex-wrap gap-1.5" aria-label={L('Periode', 'Period')}>
          {presets(today).map((p) => {
            const active = p.from === values.from && p.to === values.to;
            return <Link key={p.nl} href={presetHref(p.from, p.to)} aria-current={active ? 'true' : undefined}
              className={`rounded-md border px-2.5 py-1 text-xs ${active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}>{english ? p.en : p.nl}</Link>;
          })}
        </nav>
      )}
    </div>
  );
}

/** Report picker: stock reports and sales reports, money reports only for office. */
export function ReportNav({ current, office }: { current: string; office: boolean }) {
  const { english } = usePreviewLanguage();
  const sections = [
    { id: 'voorraad', nl: 'Voorraad', en: 'Stock' },
    { id: 'verkoop', nl: 'Verkoop en winst', en: 'Sales and profit' },
  ] as const;
  return (
    <nav className="flex flex-col gap-2 print:hidden" aria-label={english ? 'Reports' : 'Rapporten'}>
      {sections.map((section) => {
        const reports = REPORTS.filter((r) => r.section === section.id && (office || !r.money));
        if (!reports.length) return null;
        return (
          <div key={section.id} className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground w-28 shrink-0 text-xs font-medium uppercase tracking-wide">{english ? section.en : section.nl}</span>
            {reports.map((r) => (
              <Link key={r.id} href={`?r=${r.id}`} aria-current={r.id === current ? 'page' : undefined} title={english ? r.descEn : r.descNl}
                className={`rounded-lg border px-3 py-1.5 text-sm ${r.id === current ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'}`}>
                {english ? r.en : r.nl}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

export function ReportHeading({ meta }: { meta: ReportMeta }) {
  const { english } = usePreviewLanguage();
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{english ? meta.en : meta.nl}</h2>
      <p className="text-muted-foreground text-sm">{english ? meta.descEn : meta.descNl}</p>
    </div>
  );
}
