import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCardList from '@/components/webshop/ProductCardList';
import { getShopProducts, type ShopProduct } from '@/lib/shopCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Zoeken | Autosleutel24',
  // A search result page has nothing of its own to offer a search engine.
  robots: { index: false, follow: true },
};

/** `JPR105E`, `jpr-105 e` and `jpr105e` all have to find the same article. */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface Hit {
  product: ShopProduct;
  score: number;
}

/**
 * Ranked search over the catalogue.
 *
 * The single most common query in this trade is an article code copied off an
 * old key or a supplier's quote — so an exact code match has to come first and
 * on its own. Everything else is a fallback for people who do not have a code.
 */
function search(products: ShopProduct[], query: string): Hit[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const nq = normalise(q);
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);

  const hits: Hit[] = [];

  for (const product of products) {
    const code = normalise(product.articleCode ?? '');
    const title = (product.titleNl || product.title || '').toLowerCase();
    const nTitle = normalise(title);
    const makes = (product.makes ?? []).map((m) => m.toLowerCase());

    let score = 0;

    const fitsModel = product.fitment.some(
      (f) => nq.length >= 3 && normalise(`${f.make}${f.model}`).includes(nq)
    );
    if (fitsModel) score += 150;

    if (code && code === nq) score += 1000;
    else if (code && code.startsWith(nq) && nq.length >= 3) score += 500;
    else if (nq.length >= 3 && nTitle.includes(nq)) score += 200;

    /*
     * Every word has to appear somewhere, so "bmw smart key" does not match a
     * product that is merely a BMW something.
     *
     * Dutch plurals are matched loosely on purpose: the catalogue says
     * "printplaten" and "behuizingen" while a customer types "printplaat" and
     * "behuizing". Without this, the most natural search term for a category
     * returns nothing.
     */
    const haystack = [
      title,
      makes.join(' '),
      product.category ?? '',
      product.subcategory ?? '',
      product.chip ?? '',
      product.blade ?? '',
      product.frequency ?? '',
      // The models it fits: "combo", "grande punto" and "megane" are what
      // people actually type, and until the fitment list was read off the
      // supplier's pages there was nothing here to match them against.
      product.fitment.map((f) => `${f.make} ${f.model}`).join(' '),
    ]
      .join(' ')
      .toLowerCase();

    const matchesWord = (word: string): boolean => {
      if (haystack.includes(word)) return true;
      // printplaat -> printplat(en), behuizing -> behuizingen, sleutel -> sleutels
      const stem = word.replace(/(en|s)$/, '').replace(/([aeiou])\1/g, '$1');
      return stem.length >= 4 && haystack.includes(stem);
    };

    if (words.length > 0 && words.every(matchesWord)) {
      score += 100 + words.length;
    }

    if (score > 0) hits.push({ product, score });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.product.titleNl.localeCompare(b.product.titleNl))
    .slice(0, 120);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').slice(0, 80);

  const products = await getShopProducts('public');
  const hits = query ? search(products, query) : [];

  return (
    <div style={{ background: '#f6f4eb', minHeight: '100vh', paddingBottom: '6rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', padding: '1.5rem 0 2rem', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1600, width: '95%', margin: '0 auto' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
            <Link href="/webshop" style={{ color: '#64748b', textDecoration: 'none' }}>
              Webshop
            </Link>{' '}
            / Zoeken
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {query ? `Zoekresultaten voor “${query}”` : 'Zoeken'}
          </h1>
          {query && (
            <p style={{ color: '#475569', marginTop: '0.5rem' }}>
              {hits.length === 0
                ? 'Geen resultaten.'
                : `${hits.length} ${hits.length === 1 ? 'resultaat' : 'resultaten'}`}
            </p>
          )}

          {/* A second search box, so a failed search can be corrected here. */}
          <form action="/webshop/zoeken" method="get" style={{ display: 'flex', maxWidth: 620, marginTop: '1rem' }}>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Artikelcode, merk of omschrijving"
              style={{ flex: 1, padding: '0.75rem 1rem', border: '2px solid #94a3b8', borderRadius: '4px 0 0 4px', fontSize: '1rem', outline: 'none' }}
            />
            <button
              type="submit"
              style={{ background: '#b93c20', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontWeight: 700 }}
            >
              Zoek
            </button>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 1600, width: '95%', margin: '2rem auto 0' }}>
        {query && hits.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 600, margin: 0 }}>
              Niets gevonden voor “{query}”.
            </p>
            <p style={{ color: '#475569', marginTop: '0.75rem', lineHeight: 1.6 }}>
              Zoek op de artikelcode van uw sleutel (bijvoorbeeld <strong>JPR105E</strong>),
              op merk, of op het soort onderdeel. Weet u het niet zeker?{' '}
              <Link href="/contact" style={{ color: '#b93c20' }}>
                Geef uw kenteken door
              </Link>{' '}
              — dan zoeken wij het voor u op.
            </p>
          </div>
        )}

        {hits.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hits.map(({ product }) => (
              <ProductCardList
                key={product.slug}
                slug={product.slug}
                title={product.titleNl || product.title}
                subtitle={product.directAnswer}
                specs={product.specs}
                inStock={product.stockQuantity === null ? null : product.inStock}
                category={product.category ?? 'Onderdeel'}
                price={product.price !== null ? product.price.toFixed(2) : ''}
                img={product.image || '/images/product-placeholder.svg'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
