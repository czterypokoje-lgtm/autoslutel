import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { ZAKELIJK_SEGMENTS } from '@/config/zakelijk';
import { DIENSTEN } from '@/config/diensten';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import { BLOG_POSTS, REDIRECTED_BLOG_SLUGS } from '@/config/services';
import { lastModifiedFor } from '@/lib/contentDates';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.domain;

  // 1. Core Pages
  const corePages = [
    '', '/diensten', '/steden', '/merken', '/prijzen', '/blog', '/kennisbank',
    '/over-ons', '/galerij', '/beoordelingen', '/veelgestelde-vragen',
    '/contact', '/privacybeleid', '/cookiebeleid',
    '/autosleutel-kwijt', '/autosleutel-bestellen-op-kenteken',
    // Linked from the footer of every page and indexable, but was never
    // listed here — the only orphan left after the model pages came out.
    '/algemene-voorwaarden',
    // B2B and recruitment. Different audience and different queries from the
    // consumer pages, so they earn their own entries rather than riding along.
    '/zakelijk', '/monteur-worden'
  ].map(p => ({
    url: `${base}${p}`,
    lastModified: lastModifiedFor(
      p || '/',
      p === '' ? 'home'
        : ['/privacybeleid', '/cookiebeleid', '/algemene-voorwaarden'].includes(p) ? 'legal'
        : p === '/prijzen' ? 'prijzen'
        : p === '/kennisbank' ? 'kennisbank'
        : p === '/blog' ? 'blog'
        : p === '/diensten' ? 'diensten'
        : p === '/steden' ? 'steden'
        : p === '/merken' ? 'merken'
        : 'static'
    ),
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1.0 : 0.8,
    images: [`${base}/og-image.png`, `${base}/logo.png`],
  }));

  // 2. Service Pages
  // `auto-slotenmaker` and `autosleutel-bijmaken` are standalone route folders
  // rather than DIENSTEN entries, so they were missing from the sitemap even
  // though the navigation links to them from every page.
  const STANDALONE_SERVICES = ['auto-slotenmaker', 'autosleutel-bijmaken'];

  const serviceSlugs = Array.from(
    new Set([...DIENSTEN.map(s => s.slug), ...STANDALONE_SERVICES])
  );

  const servicePages = serviceSlugs.map(slug => ({
    url: `${base}/diensten/${slug}`,
    lastModified: lastModifiedFor(`/diensten/${slug}`, 'diensten'),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  // 3. City Pages
  const cityPages = CITIES.map(c => {
    const images = [];
    if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `autosleutel-bijmaken-${c.slug}.webp`))) {
      images.push(`${base}/images/autosleutel-bijmaken-${c.slug}.webp`);
    }
    return {
      url: `${base}/steden/${c.slug}`,
      lastModified: lastModifiedFor(`/steden/${c.slug}`, 'steden'),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
      images,
    };
  });

  // 4. Brand Pages
  const brandPages = BRANDS.map(b => ({
    url: `${base}/merken/${b.nameSlug}-autosleutel-bijmaken`,
    lastModified: lastModifiedFor(`/merken/${b.nameSlug}-autosleutel-bijmaken`, 'merken'),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  /*
   * 5. No model pages.
   *
   * There used to be one page per brand-and-model pair — 664 of them, built
   * from a single template and measuring 94-97% identical to one another.
   * They now 301 to their brand page (see next.config.ts), and a sitemap
   * should only ever list final URLs, never redirects.
   */
  // 8. Blog Pages
  const blogPages = BLOG_POSTS
    .filter(b => !REDIRECTED_BLOG_SLUGS.has(b.slug))
    .map(b => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: lastModifiedFor(`/blog/${b.slug}`, 'blog'),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
      images: [`${base}/og-image.png`],
    }));

  const zakelijkPages = ZAKELIJK_SEGMENTS.map((seg) => ({
    url: `${base}/zakelijk/${seg.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    /* Below the consumer service pages: fewer searches, but each enquiry is
       worth several jobs rather than one. */
    priority: 0.7,
  }));

  return [
    ...corePages,
    ...servicePages,
    ...cityPages,
    ...brandPages,
    ...zakelijkPages,
    ...blogPages
  ];
}
