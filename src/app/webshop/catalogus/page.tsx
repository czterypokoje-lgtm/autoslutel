import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import CatalogFilters from '@/components/webshop/CatalogFilters';
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
  const filters = parseFilters(sp);

  // Public catalogue only. Trade lines (lock picks, key programmers) are
  // excluded at the data layer, not hidden in the UI.
  const all = getProducts('public');
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

      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '.35rem' }}>
        Catalogus
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
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              {pageItems.map((p) => {
                const price = shelfPrice(p.costPrice);
                const fitsCount = p.fitment.length;
                return (
                  <li
                    key={p.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '.5rem',
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: '1',
                        background: '#f8fafc',
                        borderRadius: 8,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.title}
                          loading="lazy"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      )}
                    </div>

                    <div style={{ fontSize: '.7rem', letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b' }}>
                      {p.category ? facetLabel('category', p.category) : 'Onderdeel'}
                    </div>

                    <Link
                      href={`/webshop/product/${p.slug}`}
                      style={{ fontWeight: 700, color: '#0f172a', textDecoration: 'none', lineHeight: 1.35 }}
                    >
                      {p.title}
                    </Link>

                    <div style={{ fontSize: '.78rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                      {p.buttons && <span>{p.buttons} knoppen</span>}
                      {p.frequency && <span>· {p.frequency}</span>}
                      {fitsCount > 0 && <span>· past op {fitsCount} model{fitsCount === 1 ? '' : 'len'}</span>}
                    </div>

                    <div style={{ marginTop: 'auto', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatPrice(price)}
                      <span style={{ fontSize: '.72rem', fontWeight: 500, color: '#64748b', marginLeft: '.35rem' }}>
                        incl. btw
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
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
