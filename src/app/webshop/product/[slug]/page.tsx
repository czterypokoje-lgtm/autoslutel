import React from 'react';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import ProductBundleSection from '@/components/webshop/ProductBundleSection';
import ProductBuyBox from '@/components/webshop/ProductBuyBox';
import FitmentWidget from '@/components/webshop/FitmentWidget';
import ProductAccordions from '@/components/webshop/ProductAccordions';
import { slugify, formatProductDescription } from '@/lib/utils';
import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { getProductBySlug, shelfPrice } from '@/lib/catalog';

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
  const entry = getProductBySlug(slug);
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
  
  const productsPath = path.join(process.cwd(), 'src/lib/scraped_products.json');
  const fileContents = fs.readFileSync(productsPath, 'utf8');
  const products = JSON.parse(fileContents);
  
  // Find product by slug
  const product = products.find((p: any) => slugify(p.title) === resolvedParams.slug);

  if (!product) {
    notFound();
  }

  // Load bundle mapping
  let bundleMapping: any = {};
  try {
    const mappingPath = path.join(process.cwd(), 'src/lib/bundle_mapping.json');
    bundleMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  } catch (e) {
    console.error('Could not load bundle_mapping.json');
  }

  const bundleData = bundleMapping[resolvedParams.slug] || {};
  const batteryData = bundleData.battery || null;

  // Structured attributes for this product: Dutch copy, fitment, price.
  const entry = getProductBySlug(resolvedParams.slug);
  const sellPrice = shelfPrice(entry?.costPrice ?? null);

  const productSchema = entry && {
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
          itemCondition:
            entry.condition === 'genuine'
              ? 'https://schema.org/NewCondition'
              : 'https://schema.org/NewCondition',
          seller: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
        }
      : undefined,
    // No aggregateRating: there are no verified-purchase reviews yet, and
    // marking up invented ones is a manual-action risk.
  };

  const breadcrumbSchema = entry && {
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

  const rawPrice = product.price || 24.95;
  const price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : parseFloat(rawPrice);
  const rawOldPrice = product.compareAtPrice;
  const oldPrice = rawOldPrice 
    ? (typeof rawOldPrice === 'string' ? parseFloat(rawOldPrice.replace(/[^0-9.]/g, '')) : parseFloat(rawOldPrice))
    : parseFloat((price * 1.4).toFixed(2));

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: '2rem 0', fontFamily: 'Inter, sans-serif' }}>
      {/* Plain <script>, not next/script: schema injected after hydration is
          absent from the HTML Googlebot fetches first. */}
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}

      {/* A complete answer in two or three sentences — the passage LLMs and
          Google featured snippets quote. The English supplier blurb never
          answered the question on its own. */}
      {entry && (
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
      )}
      
      {/* Fitment Widget Header */}
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', marginBottom: '1.5rem' }}>
        <FitmentWidget />
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Main 2-Col Layout (Left: Gallery & Bundles, Right: Buy Box) */}
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '3rem', alignItems: 'start' }}>
          
          {/* Left: Gallery & Bundle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Main Image */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
               <img src={product.imageOriginalUrl || product.imageUrl || '/images/bmw-key-desktop.png'} alt={product.title} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
            </div>

            {/* Dynamic Bundle Section */}
            <ProductBundleSection 
              mainProductTitle={product.title} 
              mainProductPrice={price} 
              mainProductImage={product.imageOriginalUrl || product.imageUrl || '/images/bmw-key-desktop.png'}
              batteryData={batteryData}
            />
          </div>

          {/* Right: Details (Crutchfield Style) */}
          <div style={{ paddingRight: '2rem' }}>
            <ProductBuyBox 
              title={product.title} 
              price={price.toString()} 
              oldPrice={oldPrice ? oldPrice.toString() : ''} 
              description={formatProductDescription(product.description)} 
            />
          </div>
        </div>
      </div>

      {/* Below the Fold: Product Highlights (Beige Background) */}
      <div style={{ background: '#f6f4eb', padding: '4rem 1rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <ProductAccordions product={product} />

        </div>
      </div>

    </div>
  );
}
