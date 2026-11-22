import { PreviewText } from '@/app/admin/PreviewLanguage';
import { requireCrmUser } from '@/lib/crmSession';
import { BRAND, STUDIO_UI } from '@/config/install';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, CardHead, Badge, Empty, Notice } from '../_ui';
import { getProducts, filterProducts, shelfPrice, type CatalogProduct } from '@/lib/catalog';
import { cleanPhoto } from '@/lib/productPhoto';
import OrderGrid, { type ShopProduct } from './OrderGrid';
import StudioOrderGrid from './StudioOrderGrid';
import styles from './bestellen.module.css';
import { Card as SCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge as SBadge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export const metadata = { title: `Onderdelen bestellen | ${BRAND.name}` };

/** How many cards one page shows. More is a scroll nobody finishes. */
const PAGE_SIZE = 48;

/**
 * The parts catalogue, for the person who actually fits them.
 *
 * 3627 articles with a photo and an article number have been sitting behind
 * /admin/producten, which is a webshop screen for the office. A monteur who
 * needed something sent a message, and the office guessed which of the four
 * Peugeot remotes was meant.
 *
 * Filtering happens here, on the server, and deliberately so: the catalogue
 * is a multi-megabyte build-time import (see stockCategory.ts, which makes
 * the same point) and shipping it to a phone in a van would cost more than
 * the feature is worth. The page renders at most 48 cards.
 *
 * Not a webshop. No basket, no checkout, no payment — a monteur asks for a
 * part and the office orders it. One line per article, one status.
 */
export default async function BestellenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; merk?: string; p?: string }>;
}) {
  const user = await requireCrmUser('/admin/bestellen');
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const { data: me } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  const all = getProducts('all');

  /*
   * Search every word, not the whole phrase.
   *
   * catalog.ts matches the query as one substring across title, article code
   * and fitment — which means "peugeot 107" finds nothing at all, and so does
   * "vw golf", because those words never sit next to each other in a title.
   * Measured on this catalogue: "peugeot 107" goes from 0 hits to 2 and
   * "vw golf" from 0 to 5. A monteur types the car, not the product name.
   *
   * Done here rather than in filterProducts because that one also serves the
   * public webshop, and widening its search is a change to a page nobody
   * asked me to touch.
   */
  const words = (params.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = (product: CatalogProduct) =>
    `${product.titleNl ?? ''} ${product.title ?? ''} ${product.articleCode ?? ''} ${(product.makes ?? []).join(' ')} ${(product.fitment ?? [])
      .map((f) => `${f.make} ${f.model}`)
      .join(' ')}`.toLowerCase();

  const search = <T extends CatalogProduct>(products: T[]): T[] =>
    words.length ? products.filter((product) => {
      const hay = haystack(product);
      return words.every((word) => hay.includes(word));
    }) : products;

  const filtered = search(
    filterProducts(all, {
      category: params.cat || undefined,
      make: params.merk || undefined,
    })
  );

  const page = Math.max(1, Number(params.p ?? 1) || 1);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Counts from the filtered set, not the whole catalogue: a category chip
     that says 440 and then shows 3 is a chip that lies. */
  const categories = new Map<string, number>();
  for (const product of search(filterProducts(all, { make: params.merk || undefined }))) {
    if (product.category) categories.set(product.category, (categories.get(product.category) ?? 0) + 1);
  }

  const makes = new Map<string, number>();
  for (const product of search(filterProducts(all, { category: params.cat || undefined }))) {
    for (const make of product.makes ?? []) makes.set(make, (makes.get(make) ?? 0) + 1);
  }

  const toShop = (product: CatalogProduct): ShopProduct => ({
    slug: product.slug,
    title: product.titleNl || product.title,
    category: product.category ?? null,
    subcategory: product.subcategory ?? null,
    articleCode: product.articleCode ?? null,
    /* Null when every photo of this part carries A-Key's logo — the card
       then shows its placeholder rather than somebody else's branding. */
    image: cleanPhoto(product),
    costPrice: product.costPrice ?? null,
    shelf: shelfPrice(product.costPrice) ?? null,
    /* The three answers that decide whether a key can work at all. */
    frequency: product.frequency ?? null,
    chip: product.chip ?? null,
    buttons: product.buttons ?? null,
    /* Which cars, in the shortest honest form: a list of 40 models is not
       information on a phone. */
    fits: (product.fitment ?? [])
      .slice(0, 6)
      .map((f) => `${f.make} ${f.model}${f.from ? ` ${f.from}–${f.to || 'nu'}` : ''}`),
    fitsMore: Math.max(0, (product.fitment ?? []).length - 6),
    makes: (product.makes ?? []).slice(0, 4),
  });

  /* Their own open requests, so the same part is not asked for twice. */
  const { data: mine } = me
    ? await supabase
        .from('part_orders')
        .select('id, description, article_code, quantity, status, created_at, status_note')
        .eq('technician_id', me.id)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] };

  const sub = `${all.length.toLocaleString('nl-NL')} artikelen. Vraag aan wat u nodig heeft; kantoor bestelt het.`;

  if (STUDIO_UI) {
    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Onderdelen bestellen</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>{sub}</PreviewText></p>
        </div>

        {!me && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <PreviewText>Uw login is niet aan een monteur gekoppeld, dus u kunt niets aanvragen. Kantoor kan dit koppelen bij Monteurs.</PreviewText>
          </p>
        )}

        <StudioOrderGrid
          products={slice.map(toShop)}
          total={filtered.length}
          page={page}
          pages={pages}
          q={params.q ?? ''}
          cat={params.cat ?? ''}
          merk={params.merk ?? ''}
          categories={[...categories.entries()].sort((a, b) => b[1] - a[1])}
          makes={[...makes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)}
          canOrder={Boolean(me)}
        />

        {(mine ?? []).length > 0 && (
          <SCard>
            <CardHeader>
              <CardTitle><PreviewText>Uw laatste aanvragen</PreviewText></CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {(mine ?? []).map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{`${order.quantity}× ${order.description}`}</span>
                    <span className="text-muted-foreground text-xs">
                      {order.article_code ? `${order.article_code} · ` : ''}
                      {String(order.created_at).slice(0, 10)}
                      {order.status_note ? ` · ${order.status_note}` : ''}
                    </span>
                  </div>
                  <SBadge
                    variant={order.status === 'afgewezen' ? 'destructive' : 'outline'}
                    className={
                      order.status === 'geleverd'
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : order.status === 'afgewezen'
                          ? undefined
                          : 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300'
                    }
                  >
                    {order.status}
                  </SBadge>
                </div>
              ))}
            </CardContent>
          </SCard>
        )}

        {!filtered.length && (
          <p className="text-muted-foreground text-sm"><PreviewText>Niets gevonden. Probeer een artikelnummer of een automerk.</PreviewText></p>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Onderdelen bestellen"
        sub={sub}
      />

      {!me && (
        <Notice tone="bad">
          <PreviewText>{"Uw login is niet aan een monteur gekoppeld, dus u kunt niets aanvragen. Kantoor kan dit koppelen bij Monteurs."}</PreviewText>
        </Notice>
      )}

      <OrderGrid
        products={slice.map(toShop)}
        total={filtered.length}
        page={page}
        pages={pages}
        q={params.q ?? ''}
        cat={params.cat ?? ''}
        merk={params.merk ?? ''}
        categories={[...categories.entries()].sort((a, b) => b[1] - a[1])}
        makes={[...makes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)}
        canOrder={Boolean(me)}
      />

      {(mine ?? []).length > 0 && (
        <Card>
          <CardHead><PreviewText>{"Uw laatste aanvragen"}</PreviewText></CardHead>
          <div className={styles.requests}>
            {(mine ?? []).map((order) => (
              <div key={order.id} className={styles.request}>
                <div>
                  <div className={styles.requestTitle}>
                    {order.quantity}× {order.description}
                  </div>
                  <div className={styles.requestMeta}>
                    {order.article_code ? `${order.article_code} · ` : ''}
                    {String(order.created_at).slice(0, 10)}
                    {order.status_note ? ` · ${order.status_note}` : ''}
                  </div>
                </div>
                <Badge
                  tone={
                    order.status === 'geleverd'
                      ? 'ok'
                      : order.status === 'afgewezen'
                        ? 'stop'
                        : 'warn'
                  }
                >
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!filtered.length && <Empty>Niets gevonden. Probeer een artikelnummer of een automerk.</Empty>}
    </>
  );
}
