import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProductBySlug, shelfPrice } from '@/lib/catalog';
import styles from '../../klanten/klanten.module.css';
import ProductEditor, { type EditorProduct } from './ProductEditor';

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireOfficeUser(`/admin/producten/${slug}`);

  const feed = getProductBySlug(slug);
  if (!feed) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: o } = await supabase
    .from('product_overrides')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  const product: EditorProduct = {
    slug,
    audience: feed.audience,
    category: feed.category ?? '',
    makes: feed.makes ?? [],

    // What the feed says — shown as placeholder so it is always clear what you
    // are replacing, and what happens if you clear a field.
    feedTitle: feed.titleNl ?? feed.title,
    feedDescription: feed.descriptionNl ?? '',
    feedExcerpt: feed.excerpt ?? '',
    feedDirectAnswer: feed.directAnswer ?? '',
    feedMetaDescription: feed.metaDescriptionNl ?? '',
    feedImage: feed.image ?? null,
    feedCost: feed.costPrice,
    feedPrice: shelfPrice(feed.costPrice),

    published: (o?.published as boolean | null) ?? null,
    titleOverride: (o?.title_override as string) ?? '',
    descriptionOverride: (o?.description_override as string) ?? '',
    excerptOverride: (o?.excerpt_override as string) ?? '',
    directAnswerOverride: (o?.direct_answer_override as string) ?? '',
    metaTitleOverride: (o?.meta_title_override as string) ?? '',
    metaDescriptionOverride: (o?.meta_description_override as string) ?? '',
    imageOverride: (o?.image_override as string) ?? null,
    images: Array.isArray(o?.images)
      ? (o.images as unknown[]).filter((u): u is string => typeof u === 'string')
      : [],
    priceOverride: o?.price_override != null ? Number(o.price_override) : null,
    costOverride: o?.cost_override != null ? Number(o.cost_override) : null,
    trackStock: o?.track_stock === true,
    stockQuantity: o ? Number(o.stock_quantity ?? 0) : 0,
    minQuantity: o ? Number(o.min_quantity ?? 0) : 0,
    featured: o?.featured === true,
    internalNote: (o?.internal_note as string) ?? '',
  };

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>
          {product.titleOverride || product.feedTitle}
        </h1>
        <span className={styles.count}>{slug}</span>
        <span className={styles.search}>
          <Link className={styles.link} href="/admin/producten">
            Terug naar producten
          </Link>
        </span>
      </div>

      <ProductEditor product={product} />
    </>
  );
}
