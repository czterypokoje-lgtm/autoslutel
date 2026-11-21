import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BarChart3, ClipboardList } from 'lucide-react';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { findArticlesByScan } from '@/lib/kfcInventory';
import { articleTotals, filterOptions, listArticles, parseArticleQuery } from '@/lib/kfcInventoryReports';
import ArticleList from './ArticleList';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Artikellijst | ${BRAND.name}` };

/**
 * /admin/voorraad/artikelen — the article master list (ERPNext Item list).
 * Warehouse and picker roles see it without prices. A scan with ?scan=1 that
 * matches exactly one article (code, SKU, EAN or supplier reference) opens it.
 */
export default async function ArticlesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!WAREHOUSE) notFound();
  const user = await requireWarehouseUser('/admin/voorraad/artikelen');
  const office = seesPrices(user);
  const query = parseArticleQuery(await searchParams);

  if (query.scan && query.q) {
    const hits = await findArticlesByScan(query.q).catch(() => []);
    if (hits.length === 1) redirect(`/admin/voorraad/artikel/${encodeURIComponent(hits[0].id)}`);
  }

  const empty = { rows: [], total: 0, columns: [] };
  const [{ list, failure }, totals, options] = await Promise.all([
    listArticles(query, office).then(
      (loaded) => ({ list: loaded, failure: '' }),
      (error: unknown) => ({ list: empty, failure: error instanceof Error ? error.message : String(error) }),
    ),
    articleTotals(office).catch(() => ({ articles: 0, inStock: 0, low: 0, zero: 0, negative: 0, incoming: 0, value: null, unpriced: 0 })),
    filterOptions().catch(() => ({ categories: [], warehouses: [], suppliers: [] })),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight"><PreviewText>Artikellijst</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>Alle artikelen met voorraad, reservering, onderweg en verkoop. Filters, kolommen en sortering staan in de link.</PreviewText></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><a href="/admin/voorraad"><ClipboardList aria-hidden="true" /><PreviewText>Boeken en tellen</PreviewText></a></Button>
          <Button asChild variant="outline" size="sm"><Link href="/admin/voorraad/analyse"><BarChart3 aria-hidden="true" /><PreviewText>Analyse en rapporten</PreviewText></Link></Button>
        </div>
      </header>
      {failure ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100">
          <p className="font-medium"><PreviewText>De artikellijst kon niet worden geladen.</PreviewText></p>
          <p className="mt-1 text-xs opacity-80">{failure}</p>
          <p className="mt-1 text-xs opacity-80"><PreviewText>Staat migratie 0131_kfc_inventory_reports.sql op deze database?</PreviewText></p>
        </div>
      ) : (
        <ArticleList key={JSON.stringify(query)} rows={list.rows} total={list.total} columns={list.columns} query={query} options={options} totals={totals} office={office} />
      )}
    </div>
  );
}
