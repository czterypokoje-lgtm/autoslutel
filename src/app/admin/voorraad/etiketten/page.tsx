import { notFound } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ARTICLE_CODE } from '@/lib/stockCatalog';
import LabelPrint, { type LabelArticle } from './LabelPrint';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Etiketten | ${BRAND.name}` };

/** /admin/voorraad/etiketten?codes=A,B — shelf / price labels for up to 500 articles. */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ codes?: string }> }) {
  if (!WAREHOUSE) notFound();
  const user = await requireWarehouseUser('/admin/voorraad/etiketten');
  const { codes = '' } = await searchParams;
  const wanted = [...new Set(codes.split(',').map((c) => c.trim().toUpperCase()).filter((c) => ARTICLE_CODE.test(c)))].slice(0, 500);
  type Row = { code: string; name: string; sku: string; sale_price_cents: number | null; locations: string[] };
  const { data } = wanted.length
    ? await createSupabaseAdminClient().from('kfc_article_overview').select('code, name, sku, sale_price_cents, locations').in('code', wanted)
    : { data: [] as Row[] };
  const byCode = new Map(((data ?? []) as Row[]).map((r) => [r.code, r]));
  const articles: LabelArticle[] = wanted.flatMap((code) => {
    const r = byCode.get(code);
    // Location without the warehouse name: shelf / box is what the label sits on.
    return r ? [{ code: r.code, name: r.name, sku: r.sku, price: r.sale_price_cents, location: (r.locations[0] ?? '').split('/').slice(1).join('/') }] : [];
  });
  return <LabelPrint articles={articles} showPrice={seesPrices(user)} />;
}
