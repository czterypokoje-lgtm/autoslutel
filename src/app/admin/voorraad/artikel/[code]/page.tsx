import { notFound, redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
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
  if (!ARTICLE_CODE.test(code)) {
    // A SKU (the code on a drawer label's QR) opens its article when exactly one article has it.
    if (!/^[A-Z0-9][A-Z0-9._-]{1,39}$/.test(code)) notFound();
    const { data } = await createSupabaseAdminClient().from('kfc_articles').select('code').ilike('sku', code).limit(2);
    if (data?.length !== 1) notFound();
    redirect(`/admin/voorraad/artikel/${encodeURIComponent(data[0].code)}`);
  }
  const office = seesPrices(user);
  const detail = await articleDetail(code, office);
  if (!detail) notFound();
  return <ArticleDetailView detail={detail} office={office} />;
}
