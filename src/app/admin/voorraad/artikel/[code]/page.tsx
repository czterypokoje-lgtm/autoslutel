import { notFound } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { articleDetail } from '@/lib/kfcInventoryReports';
import { ARTICLE_CODE } from '@/lib/stockCatalog';
import ArticleDetailView from './ArticleDetailView';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Artikel | ${BRAND.name}` };

/** /admin/voorraad/artikel/<code> — the article 360°. Warehouse roles see it without amounts. */
export default async function ArticlePage({ params }: { params: Promise<{ code: string }> }) {
  if (!WAREHOUSE) notFound();
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase();
  const user = await requireWarehouseUser(`/admin/voorraad/artikel/${encodeURIComponent(code)}`);
  if (!ARTICLE_CODE.test(code)) notFound();
  const office = seesPrices(user);
  const detail = await articleDetail(code, office);
  if (!detail) notFound();
  return <ArticleDetailView detail={detail} office={office} />;
}
