import React from 'react';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import ProductBundleSection from '@/components/webshop/ProductBundleSection';
import ProductBuyBox from '@/components/webshop/ProductBuyBox';
import VehicleFitmentWidget from '@/components/webshop/VehicleFitmentWidget';
import ProductAccordions from '@/components/webshop/ProductAccordions';
import ProductGallery from '@/components/webshop/ProductGallery';
import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { getShopProductBySlug } from '@/lib/shopCatalog';

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

  // Load bundle mapping (optional — fails silently)
  interface BatteryData { slug: string; title: string; price: number; image: string; }
  let bundleMapping: Record<string, { battery?: BatteryData }> = {};
  try {
    const mappingPath = path.join(process.cwd(), 'src/lib/bundle_mapping.json');
    bundleMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  } catch {
    // bundle_mapping.json is optional; missing is fine
  }

  const bundleData = bundleMapping[resolvedParams.slug] ?? {};
  const batteryData: BatteryData | null = bundleData.battery ?? null;

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
    // What the part fits, as structured data rather than prose.
    isAccessoryOrSparePartFor: entry.fitment.slice(0, 20).map((f) => ({
      '@type': 'Vehicle',
      name: `${f.make} ${f.model}`,
      vehicleModelDate: `${f.from}/${f.to}`,
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
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: '2rem 0', fontFamily: 'Inter, sans-serif' }}>
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

      {/* A complete answer in two or three sentences — the passage LLMs and
          Google featured snippets quote. The English supplier blurb never
          answered the question on its own. */}
      <div
        data-direct-answer
        style={{
          maxWidth: 1240,
          margin: '0 auto 1.25rem',
          padding: '0 1.25rem',
        }}
      >
        <p
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderLeft: '3px solid #b93c20',
            borderRadius: 10,
            padding: '0.9rem 1.1rem',
            margin: 0,
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: '#334155',
          }}
        >
          {entry.directAnswer}
        </p>
      </div>

      {/* Fitment Widget Header */}
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 2rem)', marginBottom: '1.5rem' }}>
        <VehicleFitmentWidget fitment={entry.fitment} />
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 2rem)' }}>

        {/* Main 2-Col Layout (Left: Gallery & Bundles, Right: Buy Box) */}
        <div className="shop-product-grid">

          {/* Left: Gallery & Bundle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Main Image */}
            <ProductGallery images={entry.images && entry.images.length > 0 ? entry.images : (entry.image ? [entry.image] : ['/images/bmw-key-desktop.webp'])} />

            {/* Dynamic Bundle Section */}
            <ProductBundleSection
              mainProductSlug={entry.slug}
              mainProductTitle={entry.titleNl}
              mainProductPrice={sellPrice ?? 0}
              mainProductImage={entry.image ?? '/images/bmw-key-desktop.webp'}
              batteryData={batteryData}
            />
          </div>

          {/* Right: Details */}
          <div>
            <ProductBuyBox
              slug={resolvedParams.slug}
              title={entry.titleNl}
              price={sellPrice || 0}
              oldPrice={oldPriceNum || 0}
              description={entry.descriptionNl}
              needsProgramming={needsProgramming}
              category={entry.category ?? ''}
              specs={entry.specs}
            />
          </div>
        </div>
      </div>

      {/* Below the Fold: Product Highlights (Beige Background) */}
      <div style={{ background: '#f6f4eb', padding: '4rem 1rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <ProductAccordions product={entry} />
        </div>
      </div>

    </div>
  );
}

