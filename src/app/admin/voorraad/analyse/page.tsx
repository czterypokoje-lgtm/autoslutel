import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Boxes, LineChart } from 'lucide-react';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { filterOptions, loadReport, parseReportParams } from '@/lib/kfcInventoryReports';
import { amsterdamToday, reportMeta, type ReportData } from '@/lib/kfcReportColumns';
import ReportFilters, { ReportHeading, ReportNav } from './ReportFilters';
import ReportTable from './ReportTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Analyse en rapporten | ${BRAND.name}` };

/**
 * /admin/voorraad/analyse — the inventory and sales reports in one place, in
 * the spirit of ERPNext's stock and selling reports: stock balance per
 * location, valuation on a date, the stock ledger, ageing, fast/slow movers,
 * ABC, critical stock and reorder, count differences, sales, gross profit and
 * top sellers. ?r=<report> picks one; every filter, the visible columns and
 * the sort are in the URL, so a link is a saved view. Warehouse and picker
 * roles see the stock reports without amounts; the money reports are office
 * only.
 */
export default async function AnalysePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!WAREHOUSE) notFound();
  const user = await requireWarehouseUser('/admin/voorraad/analyse');
  const office = seesPrices(user);
  const search = await searchParams;
  const requested = reportMeta(typeof search.r === 'string' ? search.r : '');
  const meta = requested && (office || !requested.money) ? requested : reportMeta('balance')!;
  const params = parseReportParams(meta.id, search);

  const [{ data, failure }, options] = await Promise.all([
    loadReport(meta.id, params, office).then(
      (loaded): { data: ReportData | null; failure: string } => ({ data: loaded, failure: '' }),
      (error: unknown) => ({ data: null, failure: error instanceof Error ? error.message : String(error) }),
    ),
    filterOptions().catch(() => ({ categories: [], warehouses: [], suppliers: [] })),
  ]);

  const filterQuery = new URLSearchParams();
  for (const key of meta.filters) {
    const value = String(params[key as keyof typeof params] ?? '');
    if (value) filterQuery.set(key, value);
  }
  const exportHref = `/api/admin/voorraad-analyse?export=${meta.id}&${filterQuery}`;
  const keep: Record<string, string> = {};
  for (const key of ['cols', 'sort', 'dir']) if (typeof search[key] === 'string') keep[key] = search[key] as string;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight"><PreviewText>Analyse en rapporten</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>Voorraad, verkoop en winst per artikel, locatie en periode. Elke selectie is een link die je kunt bewaren of delen.</PreviewText></p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button asChild variant="outline" size="sm"><a href="/admin/voorraad/artikelen"><Boxes aria-hidden="true" /><PreviewText>Artikellijst</PreviewText></a></Button>
          {office && <Button asChild variant="outline" size="sm"><Link href="/admin/rapporten/eigenaar"><LineChart aria-hidden="true" /><PreviewText>Eigenaarsoverzicht</PreviewText></Link></Button>}
        </div>
      </header>
      <ReportNav current={meta.id} office={office} />
      <ReportHeading meta={meta} />
      <ReportFilters meta={meta} today={amsterdamToday()} options={options} keep={keep}
        values={{ from: params.from, to: params.to, date: params.date, q: params.q, category: params.category, warehouse: params.warehouse,
          channel: params.channel, group: params.group, reason: params.reason, basis: params.basis, speed: params.speed, lead: params.lead }} />
      {data ? <ReportTable key={`${meta.id}-${params.group}`} data={data} exportHref={exportHref} title={meta.nl} /> : (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100">
          <p className="font-medium"><PreviewText>Dit rapport kon niet worden geladen.</PreviewText></p>
          <p className="mt-1 text-xs opacity-80">{failure}</p>
          <p className="mt-1 text-xs opacity-80"><PreviewText>Staat migratie 0131_kfc_inventory_reports.sql op deze database?</PreviewText></p>
        </div>
      )}
    </div>
  );
}
