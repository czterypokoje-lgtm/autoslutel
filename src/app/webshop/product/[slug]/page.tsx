import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TrustpilotPlaceholder from '@/components/webshop/TrustpilotPlaceholder';
import ProductRelatedSearches from '@/components/webshop/ProductRelatedSearches';
import CustomerLifestyleGallery from '@/components/webshop/CustomerLifestyleGallery';
import ProductBundleSection from '@/components/webshop/ProductBundleSection';
import ProductBuyBox from '@/components/webshop/ProductBuyBox';
import VehicleFitmentWidget from '@/components/webshop/VehicleFitmentWidget';
import ProductAccordions from '@/components/webshop/ProductAccordions';
import ProductGallery from '@/components/webshop/ProductGallery';
import ProductAlternatives from '@/components/webshop/ProductAlternatives';
import ProductFitmentList from '@/components/webshop/ProductFitmentList';
import StickyBuyBar from '@/components/webshop/StickyBuyBar';
import BackToTop from '@/components/webshop/BackToTop';
import PaymentMethods from '@/components/webshop/PaymentMethods';
import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { getShopProductBySlug } from '@/lib/shopCatalog';
import { facetLabel } from '@/lib/catalog';

/** Categories that require programming after installation. */
const NEEDS_PROGRAMMING_CATEGORIES = new Set([
  'transponders',
  'smart-keys',
  'afstandsbedieningen',
]);

/**
 * Per-product metadata.
 *
 * Every one of these pages used to inherit the webshop layout's title and the
 * root canonical, so all of them carried the same <title> and each declared
 * itself to be the homepage. Titles, descriptions and canonicals now come from
 * the derived catalogue, where they are generated in Dutch per product.
 */
export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const entry = await getShopProductBySlug(slug);
  const url = `${SITE_CONFIG.domain}/webshop/product/${slug}`;

  if (!entry) {
    return { title: { absolute: 'Product niet gevonden | Autosleutel24' } };
  }

  return {
    title: { absolute: `${entry.titleNl} | Autosleutel24` },
    description: entry.metaDescriptionNl,
    alternates: { canonical: url },
    openGraph: {
      title: entry.titleNl,
      description: entry.metaDescriptionNl,
      url,
      images: entry.image ? [{ url: entry.image }] : undefined,
    },
  };
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await props.params;

  // Single source of truth: the derived catalogue.
  const entry = await getShopProductBySlug(resolvedParams.slug);

  if (!entry) {
    notFound();
  }

  /*
   * The battery that belongs in this key, looked up in our own catalogue.
   *
   * This used to come from bundle_mapping.json — 1,146 entries keyed on the
   * previous Shopify catalogue's slugs, with photos on a CDN that no longer
   * answers, so the block never rendered for an A-Key product.
   */
  const batteryProduct = entry.battery ? await getShopProductBySlug(entry.battery) : null;
  const batteryData =
    batteryProduct && batteryProduct.price != null
      ? {
          slug: batteryProduct.slug,
          title: batteryProduct.titleNl,
          price: batteryProduct.price,
          image: batteryProduct.image ?? '/images/product-placeholder.svg',
        }
      : null;

  // Already merged with the office's overrides; the margin rule is the fallback.
  const sellPrice = entry.price;

  /*
   * No invented reference price.
   *
   * This used to be `sellPrice * 1.8`, shown struck through as a "dealer"
   * price. Nobody was ever charged it. A crossed-out price is a claim that
   * this was once the price, and under BW 6:193c presenting one that never
   * existed is a misleading commercial practice — the same reason the invented
   * reviews and certificates were taken off this site.
   *
   * Put a real figure here when there is a documented dealer average, with the
   * source written down.
   */
  const oldPriceNum: number | null = null;

  const needsProgramming = NEEDS_PROGRAMMING_CATEGORIES.has(entry.category ?? '');

  /** The chips under the title: the specs a customer checks before buying. */
  const HEADLINE_SPECS = ['Frequentie', 'Transponder', 'Sleutelbaard', 'Aantal knoppen', 'Artikelcode'];
  const headlineSpecs = (entry.specs ?? []).filter(([label]) => HEADLINE_SPECS.includes(label));

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE_CONFIG.domain}/webshop/product/${entry.slug}#product`,
    name: entry.titleNl,
    description: entry.descriptionNl,
    sku: entry.id,
    category: entry.category ?? undefined,
    image: entry.image ? [`${SITE_CONFIG.domain}${entry.image}`] : undefined,
    brand: entry.manufacturer
      ? { '@type': 'Brand', name: entry.manufacturer }
      : undefined,
    // The supplier's article number, which is what a customer searches for.
    mpn: entry.articleCode ?? undefined,
    /*
     * What the part fits, as structured data rather than prose. No
     * vehicleModelDate: A-Key publishes no year ranges, and "0/9999" is not a
     * production span — an invented one would be marked-up misinformation.
     */
    isAccessoryOrSparePartFor: entry.fitment.slice(0, 30).map((f) => ({
      '@type': 'Vehicle',
      name: `${f.make} ${f.model}`,
    })),
    offers: sellPrice
      ? {
          '@type': 'Offer',
          url: `${SITE_CONFIG.domain}/webshop/product/${entry.slug}`,
          priceCurrency: 'EUR',
          price: sellPrice.toFixed(2),
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
        }
      : undefined,
    // No aggregateRating: there are no verified-purchase reviews yet, and
    // marking up invented ones is a manual-action risk.
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Webshop', item: `${SITE_CONFIG.domain}/webshop` },
      {
        '@type': 'ListItem',
        position: 3,
        name: entry.titleNl,
        item: `${SITE_CONFIG.domain}/webshop/product/${entry.slug}`,
      },
    ],
  };

  return (
    <div className="shop-product-page" style={{ background: '#f9fafb', minHeight: '100vh', padding: '2rem 0', fontFamily: 'Inter, sans-serif' }}>
      {/* Plain <script>, not next/script: schema injected after hydration is
          absent from the HTML Googlebot fetches first. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 2rem)' }}>

        {/*
          Three blocks, in the order a phone should read them: the photos, the
          price and the button, then everything that supports the decision.
          The fitment check used to sit above all of it — a 400px panel between
          the customer and the product they had just clicked.
        */}
        <div className="shop-product-grid">

          <div className="shop-product-head">
            <nav style={{ fontSize: '.8rem', color: '#64748b', marginBottom: '.6rem' }}>
              <Link href="/webshop" style={{ color: '#64748b', textDecoration: 'none' }}>Webshop</Link>
              <span aria-hidden="true"> › </span>
              {entry.category && (
                <>
                  <Link
                    href={`/webshop/catalogus?category=${entry.category}`}
                    style={{ color: '#64748b', textDecoration: 'none' }}
                  >
                    {facetLabel('category', entry.category)}
                  </Link>
                  <span aria-hidden="true"> › </span>
                </>
              )}
              <span style={{ color: '#0f172a' }}>{entry.articleCode ?? entry.titleNl}</span>
            </nav>

            {/* The title and direct answer sentence were moved to ProductBuyBox to match Crutchfield layout */}

            {entry.replacedBy && (
              <p style={{ fontSize: '.85rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '.5rem .75rem', margin: '0 0 .75rem' }}>
                Let op: onze leverancier vervangt dit artikel door <strong>{entry.replacedBy}</strong>.
                U ontvangt de opvolger als deze uitverkocht is — bel ons als u specifiek deze
                uitvoering nodig heeft.
              </p>
            )}

            {/* Frequency, transponder and blade: what decides whether this key
                can be made to work, before the photo rather than after it. */}
            {headlineSpecs.length > 0 && (
              <dl style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem .5rem', margin: 0, padding: 0 }}>
                {headlineSpecs.map(([label, value]) => (
                  <div
                    key={label}
                    style={{ display: 'flex', gap: '.35rem', alignItems: 'baseline', background: '#eef2f7', borderRadius: 999, padding: '.25rem .7rem', fontSize: '.8rem' }}
                  >
                    <dt style={{ color: '#64748b' }}>{label}</dt>
                    <dd style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="shop-product-media">
            <ProductGallery images={entry.images && entry.images.length > 0 ? entry.images : (entry.image ? [entry.image] : ['/images/product-placeholder.svg'])} />
            
            <div style={{ marginTop: '2rem' }}>
              <ProductBundleSection
                mainProductSlug={entry.slug}
                mainProductTitle={entry.titleNl}
                mainProductPrice={sellPrice ?? 0}
                mainProductImage={entry.image ?? '/images/product-placeholder.svg'}
                batteryData={batteryData}
                offerBatteryLink={NEEDS_PROGRAMMING_CATEGORIES.has(entry.category ?? '')}
              />
            </div>
          </div>

          <div className="shop-product-buy">
            <ProductBuyBox
              slug={resolvedParams.slug}
              title={entry.titleNl}
              subtitle={entry.directAnswer}
              brand={entry.manufacturer ?? undefined}
              price={sellPrice || 0}
              oldPrice={oldPriceNum || 0}
              description={entry.descriptionNl}
              needsProgramming={needsProgramming}
              category={entry.category ?? ''}
              inStock={entry.inStock}
            />
          </div>

          <div className="shop-product-extra">
            {/* What a customer can pay with, and who brings it. */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
              <PaymentMethods />
            </div>

            <ProductFitmentList product={entry} />

            <VehicleFitmentWidget 
              fitment={entry.fitment} 
              productChip={entry.chip}
              productBlade={entry.blade}
              productFrequency={entry.frequency}
            />
          </div>
        </div>
      </div>

      {/* Below the Fold: Product Highlights (Beige Background) */}
      <div style={{ background: '#f6f4eb', padding: 'clamp(2rem, 6vw, 4rem) 1rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <ProductAccordions product={entry} />
        </div>

        <ProductAlternatives product={entry} />
      </div>

      <ProductRelatedSearches product={entry} />
      <TrustpilotPlaceholder />
      <CustomerLifestyleGallery />

      <BackToTop />

      {/* Follows the page down once the real button is out of view. */}
      <StickyBuyBar
        slug={entry.slug}
        title={entry.titleNl}
        image={entry.image ?? '/images/product-placeholder.svg'}
        price={sellPrice}
        inStock={entry.inStock}
      />
    </div>
  );
}

