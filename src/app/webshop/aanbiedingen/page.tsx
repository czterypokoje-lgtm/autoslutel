import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCardList from '@/components/webshop/ProductCardList';
import { shelfPrice } from '@/lib/catalog';
import { getShopProducts } from '@/lib/shopCatalog';

/**
 * Aanbiedingen.
 *
 * The webshop menu has linked here since it was written; the route did not
 * exist, so "Aanbiedingen" was a 404 in the main navigation.
 *
 * What counts as an offer is a real, checkable fact and nothing else: the
 * office set a manual price in the CRM that is below what the margin rule
 * would have asked. That difference is a discount someone actually decided on,
 * and it is the only figure that may be shown struck through — an invented
 * "van/voor" price is a misleidende handelspraktijk (BW 6:193c), which is why
 * the `price * 1.4` reference prices came off the cards.
 *
 * With no such prices set, the page says so rather than filling itself with
 * ordinary products under an offers heading.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Aanbiedingen — afgeprijsde autosleutels | Autosleutel24' },
  description:
    'Autosleutels, behuizingen en printplaten die op dit moment onder onze normale prijs staan.',
};

export default async function OffersPage() {
  const products = await getShopProducts('public');

  const offers = products
    .map((product) => {
      const normal = shelfPrice(product.costPrice);
      const discount =
        product.priceIsManual && product.price != null && normal != null && product.price < normal
          ? normal - product.price
          : 0;
      return { product, normal, discount };
    })
    .filter((o) => o.discount > 0)
    .sort((a, b) => b.discount / (b.normal ?? 1) - a.discount / (a.normal ?? 1));

  return (
    <div style={{ background: '#f6f4eb', minHeight: '100vh', paddingBottom: '6rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', padding: '1.5rem 0 2rem', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1600, width: '95%', margin: '0 auto' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
            <Link href="/webshop" style={{ color: '#64748b', textDecoration: 'none' }}>Webshop</Link>
            {' / Aanbiedingen'}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Aanbiedingen</h1>
          <p style={{ color: '#475569', marginTop: '0.5rem', maxWidth: '62ch', lineHeight: 1.6 }}>
            {offers.length > 0
              ? `${offers.length} ${offers.length === 1 ? 'artikel staat' : 'artikelen staan'} op dit moment onder onze normale prijs.`
              : 'Op dit moment staat er niets afgeprijsd.'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1600, width: '95%', margin: '2rem auto 0' }}>
        {offers.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '2.5rem' }}>
            <p style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 600, margin: 0 }}>
              Er lopen nu geen acties.
            </p>
            <p style={{ color: '#475569', marginTop: '0.75rem', lineHeight: 1.6 }}>
              Wij zetten hier alleen artikelen neer die daadwerkelijk onder onze normale prijs
              staan. Bekijk in de tussentijd de{' '}
              <Link href="/webshop/catalogus" style={{ color: '#b93c20' }}>volledige catalogus</Link>,
              of geef uw kenteken door — dan zoeken wij de juiste sleutel voor u op.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {offers.map(({ product, normal }) => (
              <ProductCardList
                key={product.slug}
                slug={product.slug}
                title={product.titleNl}
                subtitle={product.directAnswer}
                specs={product.specs}
                inStock={product.stockQuantity === null ? null : product.inStock}
                category={product.category ?? 'Onderdeel'}
                price={product.price !== null ? product.price.toFixed(2) : ''}
                // The price this article stands at outside the action — a real
                // figure from the margin rule, not a decorated one.
                oldPrice={normal != null ? normal.toFixed(2) : undefined}
                img={product.image || '/images/product-placeholder.svg'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
