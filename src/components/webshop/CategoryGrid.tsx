import React from 'react';
import Link from 'next/link';
import { facetLabel } from '@/lib/catalog';
import { getShopProducts } from '@/lib/shopCatalog';

/**
 * The category tiles, built from what is in the catalogue.
 *
 * The list used to be hard-coded and had drifted: "Sloten & Cilinders" and
 * "Smart Keys / Keyless" both linked to `?category=`-values that no product
 * carries, so two of the nine tiles on the home page opened an empty
 * catalogue, while "Overige sleutels" (90 products) had no tile at all.
 *
 * Counts come from the same merged catalogue the catalogue page filters, so a
 * tile can never promise products that a click does not deliver.
 */

/** Only for the look of the tile; unknown categories fall back to a key. */
const EMOJI: Record<string, string> = {
  afstandsbedieningen: '📡',
  behuizingen: '🧩',
  'universal-remotes': '🎛️',
  transponders: '📶',
  printplaten: '🔌',
  noodsleutels: '🗝️',
  sleutelbaarden: '🔑',
  batterijen: '🔋',
  gereedschap: '🔧',
  accessoires: '🛒',
  'overige-sleutels': '🔐',
  diensten: '🧰',
  sloten: '🔒',
  'smart-keys': '📲',
  transpondersleutels: '🔑',
  'sleutels-zonder-chip': '🗝️',
  motorsleutels: '🏍️',
  woningsleutels: '🚪',
  programmeerapparatuur: '💻',
  sleutelmachines: '⚙️',
  'frezen-en-tasters': '🪚',
};

/** Below this a tile is not worth a slot on the home page. */
const MIN_PRODUCTS = 5;

export default async function CategoryGrid() {
  const products = await getShopProducts('public');

  const counts = new Map<string, number>();
  for (const product of products) {
    if (!product.category) continue;
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  const categories = [...counts.entries()]
    .filter(([, count]) => count >= MIN_PRODUCTS)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="category-grid">
      {categories.map(([slug, count]) => (
        <Link
          href={`/webshop/catalogus?category=${slug}`}
          key={slug}
          className="category-card"
          style={{ textDecoration: 'none' }}
        >
          <div className="category-card-img-wrapper" style={{ fontSize: '2.5rem', textAlign: 'center', padding: '1rem' }}>
            {EMOJI[slug] ?? '🔑'}
          </div>
          <div className="category-card-title">{facetLabel('category', slug)}</div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', paddingBottom: '0.75rem' }}>
            {count} artikelen
          </div>
        </Link>
      ))}
    </div>
  );
}
