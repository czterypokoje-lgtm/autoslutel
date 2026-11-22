import { notFound } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ARTICLE_CODE, stockCatalog } from '@/lib/stockCatalog';
import { labelProfiles } from '@/lib/labelProfiles';
import LabelPrint, { type LabelArticle } from './LabelPrint';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Etiketten | ${BRAND.name}` };

/** A SKU as printed on a drawer (ALRC03): lets a list of drawer codes go straight to labels. */
const SKU = /^[A-Z0-9][A-Z0-9._-]{1,39}$/;

/**
 * /admin/voorraad/etiketten?codes=A,B — shelf / price labels for up to 500
 * articles, by article code or by SKU (an ambiguous SKU prints nothing).
 */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ codes?: string }> }) {
  if (!WAREHOUSE) notFound();
  const user = await requireWarehouseUser('/admin/voorraad/etiketten');
  const { codes = '' } = await searchParams;
  const asked = [...new Set(codes.split(',').map((c) => c.trim().toUpperCase()).filter((c) => ARTICLE_CODE.test(c) || SKU.test(c)))].slice(0, 500);
  type Row = { code: string; name: string; sku: string; sale_price_cents: number | null; locations: string[] };
  type Photo = { code: string; sku: string | null; image: string | null; photo_version: string | null; ean: string[] | null };
  const db = createSupabaseAdminClient();
  const skus = asked.filter((c) => !ARTICLE_CODE.test(c));
  const { data: bySkuRows } = skus.length ? await db.from('kfc_articles').select('code, sku').in('sku', skus) : { data: [] };
  const skuHits = new Map<string, string[]>();
  for (const r of (bySkuRows ?? []) as { code: string; sku: string }[]) skuHits.set(r.sku.toUpperCase(), [...(skuHits.get(r.sku.toUpperCase()) ?? []), r.code]);
  const wanted = [...new Set(asked.flatMap((c) => ARTICLE_CODE.test(c) ? [c] : (skuHits.get(c)?.length === 1 ? skuHits.get(c)! : [])))];
  const [{ data }, { data: photoRows }] = wanted.length
    ? await Promise.all([
      db.from('kfc_article_overview').select('code, name, sku, sale_price_cents, locations').in('code', wanted),
      db.from('kfc_articles').select('code, sku, image, photo_version, ean').in('code', wanted),
    ])
    : [{ data: [] as Row[] }, { data: [] as Photo[] }];
  const byCode = new Map(((data ?? []) as Row[]).map((r) => [r.code, r]));
  // Our own photo first (taken in the CRM), else the catalogue picture.
  const photos = new Map(((photoRows ?? []) as Photo[]).map((r) => [r.code,
    r.photo_version ? `/api/admin/voorraad-local?foto=${encodeURIComponent(r.code)}&v=${r.photo_version}` : (r.image || null)]));
  // The drawer's own number (a learned all-digit barcode) is printed, so the drawer keeps its number.
  const numbers = new Map(((photoRows ?? []) as Photo[]).map((r) => [r.code, (r.ean ?? []).find((e) => /^\d{8,14}$/.test(e.trim()))?.trim() ?? null]));
  const profiles = await labelProfiles([...new Set(((data ?? []) as Row[]).map((r) => r.sku).filter(Boolean))]);
  const catalogSources = new Map(stockCatalog.map((a) => [a.id, a.sources]));
  const articles: LabelArticle[] = wanted.flatMap((code) => {
    const r = byCode.get(code);
    // Location without the warehouse name: shelf / box is what the label sits on.
    return r ? [{ code: r.code, name: r.name, sku: r.sku, price: r.sale_price_cents, location: (r.locations[0] ?? '').split('/').slice(1).join('/'), photo: photos.get(code) ?? null, number: numbers.get(code) ?? null,
      // Models, key blade, chip: the same profile the drawer label in Voorraad prints.
      profile: (r.sku ? profiles[r.sku] : null) ?? null,
      // Shop pages for the QR (labelLink): the catalogue knows them per article code.
      sources: catalogSources.get(r.code) ?? [] }] : [];
  });
  // Asked for but not printable: unknown code or SKU, or a SKU on several articles. Shown, so nothing drops silently.
  const printed = new Set(articles.flatMap((a) => [a.code, a.sku.toUpperCase()]));
  const missing = asked.filter((c) => !printed.has(c));
  return <LabelPrint articles={articles} missing={missing} showPrice={seesPrices(user)} />;
}
