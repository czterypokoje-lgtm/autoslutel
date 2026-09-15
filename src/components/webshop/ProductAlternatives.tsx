import React from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/catalog';
import { getShopProducts, type ShopProduct } from '@/lib/shopCatalog';
import AddToCartButton from '@/components/webshop/AddToCartButton';

/**
 * "Vaak vergeleken" — the other keys that fit the same cars, side by side.
 *
 * Someone who lands on a three-button remote for a Renault Mégane usually has
 * two open questions: is there a cheaper one, and is there one with the right
 * number of buttons. Every large parts shop answers that on the page itself;
 * without it the customer leaves to compare somewhere else.
 *
 * Everything in the table is read from the catalogue — price, frequency,
 * transponder, buttons — so there is nothing here to keep in sync by hand.
 */

const MAX = 3;

function score(current: ShopProduct, other: ShopProduct): number {
  let points = 0;

  // Same category is the baseline; a housing is not an alternative to a key.
  if (other.category !== current.category) return -1;

  const sharedMake = other.makes.some((m) => current.makes.includes(m));
  if (!sharedMake) return -1;
  points += 10;

  if (other.frequency && other.frequency === current.frequency) points += 4;
  if (other.chip && other.chip === current.chip) points += 4;
  if (other.blade && other.blade === current.blade) points += 3;
  if (other.buttons && other.buttons === current.buttons) points += 2;

  // Close on price beats far on price.
  if (current.price != null && other.price != null) {
    const gap = Math.abs(other.price - current.price) / Math.max(current.price, 1);
    points += Math.max(0, 3 - gap * 3);
  }

  return points;
}

const ROWS: { label: string; value: (p: ShopProduct) => string | null }[] = [
  { label: 'Prijs', value: (p) => formatPrice(p.price) },
  { label: 'Frequentie', value: (p) => p.frequency },
  { label: 'Transponder', value: (p) => p.chip },
  { label: 'Sleutelbaard', value: (p) => p.blade },
  { label: 'Knoppen', value: (p) => (p.buttons ? String(p.buttons) : null) },
  { label: 'Artikelcode', value: (p) => p.articleCode ?? null },
];

export default async function ProductAlternatives({ product }: { product: ShopProduct }) {
  const all = await getShopProducts('public');

  const alternatives = all
    .filter((p) => p.slug !== product.slug)
    .map((p) => ({ p, s: score(product, p) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, MAX)
    .map(({ p }) => p);

  if (alternatives.length === 0) return null;

  const columns = [product, ...alternatives];

  return (
    <section style={{ maxWidth: 1000, margin: '2.5rem auto 0', padding: '0 clamp(1rem, 4vw, 2rem)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: '1.5rem' }}>
        Vaak vergeleken
      </h2>

      {/* Wide on purpose, and scrolls inside its own box rather than the page. */}
      <div className="shop-compare-scroll">
        <table className="shop-compare">
          <thead>
            <tr>
              <th scope="col" className="shop-compare-corner" />
              {columns.map((p, i) => (
                <th key={p.slug} scope="col">
                  <Link href={`/webshop/product/${p.slug}`} className="shop-compare-head">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image ?? '/images/product-placeholder.svg'} alt="" />
                    <span className="shop-compare-label">
                      {i === 0 ? 'Dit artikel' : 'Alternatief'}
                    </span>
                    <span className="shop-compare-title">{p.titleNl}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ label, value }) => {
              // A row nobody in this table can answer is not worth a line.
              if (!columns.some((p) => value(p))) return null;
              return (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {columns.map((p) => (
                    <td key={p.slug}>{value(p) ?? '—'}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Bestellen</th>
              {columns.map((p) => (
                <td key={p.slug}>
                  {p.price == null ? (
                    '—'
                  ) : (
                    <AddToCartButton slug={p.slug} disabled={!p.inStock} variant="outline" />
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
