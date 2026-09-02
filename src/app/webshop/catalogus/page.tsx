import React, { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import CatalogFilters from '@/components/webshop/CatalogFilters';
import ProductCardList from '@/components/webshop/ProductCardList';
import {
  getProducts,
  filterProducts,
  buildFacets,
  shelfPrice,
  formatPrice,
  facetLabel,
  type Filters,
  type FacetKey,
} from '@/lib/catalog';

/**
 * Faceted catalogue browse page.
 *
 * Renders on the server from the URL, so a filtered view is shareable and
 * crawlable-if-we-choose. It is currently noindex along with the rest of
 * /webshop; when the shop opens, only the unfiltered category views should be
 * indexed and every ?filter= combination must stay noindex with a canonical
 * back to the clean category URL.
 */

export const metadata: Metadata = {
  title: { absolute: 'Catalogus — autosleutels & onderdelen | Autosleutel24' },
  description:
    'Blader door sleutelbehuizingen, afstandsbedieningen, smart keys, transponders en batterijen. Filter op automerk, type en aantal knoppen.',
};

const FACET_ORDER: FacetKey[] = [
  'make', 'category', 'subcategory', 'buttons', 'condition', 'manufacturer', 'frequency',
];

const PAGE_SIZE = 24;

function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const buttons = one('buttons');
  return {
    category: one('category'),
    subcategory: one('subcategory'),
    make: one('make'),
    manufacturer: one('manufacturer'),
    condition: one('condition'),
    buttons: buttons ? Number(buttons) : undefined,
    frequency: one('frequency'),
    q: one('q'),
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const isB2B = cookieStore.get('b2b_session')?.value === 'true';
  const filters = parseFilters(sp);

  // Public catalogue only. Trade lines (lock picks, key programmers) are
  // excluded at the data layer, not hidden in the UI.
  const all = getProducts(isB2B ? 'all' : 'public');
  const results = filterProducts(all, filters);
  const facets = buildFacets(all, filters, FACET_ORDER);

  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(results.length / PAGE_SIZE);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
      <nav style={{ fontSize: '.85rem', color: '#64748b', marginBottom: '1rem' }}>
        <Link href="/webshop" style={{ color: '#64748b' }}>Webshop</Link>
        <span aria-hidden="true"> › </span>
        <span>Catalogus</span>
      </nav>

      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        Catalogus
        {isB2B && (
          <span style={{ fontSize: '0.8rem', background: '#16a34a', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 99, fontWeight: 700, verticalAlign: 'middle' }}>
            B2B Modus Actief
          </span>
        )}
      </h1>
      <p style={{ color: '#475569', marginBottom: '1.75rem', maxWidth: '62ch' }}>
        Sleutelbehuizingen, afstandsbedieningen, smart keys, transponders en batterijen.
        Filter op automerk en type — of laat onze monteur het hele werk doen.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
          gap: '1.75rem',
          alignItems: 'start',
        }}
      >
        <Suspense fallback={<div />}>
          <CatalogFilters facets={facets} order={FACET_ORDER} resultCount={results.length} />
        </Suspense>

        <div>
          {pageItems.length === 0 ? (
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
              }}
            >
              <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '.4rem' }}>
                Geen producten gevonden
              </p>
              <p style={{ color: '#475569', fontSize: '.9rem' }}>
                Probeer een filter te verwijderen, of{' '}
                <Link href="/contact">vraag het ons even</Link> — wij hebben veel meer op voorraad
                dan online staat.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pageItems.map((p) => {
                const price = shelfPrice(p.costPrice);
                return (
                  <ProductCardList
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    title={p.titleNl || p.title}
                    category={p.category ? facetLabel('category', p.category) : 'Onderdeel'}
                    price={price ? price.toFixed(2) : '0.00'}
                    img={p.image || '/images/placeholder.png'}
                  />
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {page > 1 ? (
                <Link
                  href={{ query: { ...sp, page: page - 1 } }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                    padding: '.6rem 1.2rem', borderRadius: 8,
                    border: '1px solid #cbd5e1', background: '#fff',
                    fontWeight: 600, fontSize: '.9rem', color: '#0f172a',
                    textDecoration: 'none',
                  }}
                >
                  ← Vorige
                </Link>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  padding: '.6rem 1.2rem', borderRadius: 8,
                  border: '1px solid #e5e7eb', background: '#f8fafc',
                  fontWeight: 600, fontSize: '.9rem', color: '#94a3b8',
                  cursor: 'not-allowed',
                }}>
                  ← Vorige
                </span>
              )}

              <span style={{ fontSize: '.88rem', color: '#475569' }}>
                Pagina {page} van {totalPages} — {results.length} producten
              </span>

              {page < totalPages ? (
                <Link
                  href={{ query: { ...sp, page: page + 1 } }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                    padding: '.6rem 1.2rem', borderRadius: 8,
                    border: '1px solid #cbd5e1', background: '#fff',
                    fontWeight: 600, fontSize: '.9rem', color: '#0f172a',
                    textDecoration: 'none',
                  }}
                >
                  Volgende →
                </Link>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  padding: '.6rem 1.2rem', borderRadius: 8,
                  border: '1px solid #e5e7eb', background: '#f8fafc',
                  fontWeight: 600, fontSize: '.9rem', color: '#94a3b8',
                  cursor: 'not-allowed',
                }}>
                  Volgende →
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
