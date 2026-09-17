import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { DIENSTEN } from '@/config/diensten';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import { BLOG_POSTS } from '@/config/services';
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
    '/algemene-voorwaarden'
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
  // These slugs are 301'd in next.config.ts. A sitemap should only list final
  // URLs, so listing them wasted crawl budget on four guaranteed redirects.
  const REDIRECTED_BLOG_SLUGS = new Set([
    'auto-openen-zonder-sleutel-tips-hulp',
    'auto-openen-zonder-sleutel-schadevrij',
    'autosleutel-bijmaken-tips-snel-veilig',
    'sleutel-bijmaken-auto-mobiele-service',
  ]);

  const blogPages = BLOG_POSTS
    .filter(b => !REDIRECTED_BLOG_SLUGS.has(b.slug))
    .map(b => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: lastModifiedFor(`/blog/${b.slug}`, 'blog'),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
      images: [`${base}/og-image.png`],
    }));

  return [
    ...corePages,
    ...servicePages,
    ...cityPages,
    ...brandPages,
    ...blogPages
  ];
}
