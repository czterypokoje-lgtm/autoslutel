import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { ZAKELIJK_SEGMENTS } from '@/config/zakelijk';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/diensten';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import { isNoindexBrand, isNoindexCity } from '@/config/thinPages';
import { SERVICE_REGIONS } from '@/config/regions';
import { BLOG_POSTS, REDIRECTED_BLOG_SLUGS } from '@/config/services';
import { lastModifiedFor } from '@/lib/contentDates';
import { PROBLEM_PAGES, problemHref } from '@/config/problemPages';
import fs from 'fs';
import path from 'path';
import { cityPath } from '@/config/cityUrls';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.domain;

  // 1. Core Pages
  const corePages = [
    '', '/diensten', '/steden', '/merken', '/prijzen', '/blog', '/kennisbank',
    '/over-ons', '/galerij', '/beoordelingen', '/veelgestelde-vragen',
    '/contact', '/privacybeleid', '/cookiebeleid',
    '/autosleutel-kwijt', '/autosleutel-bestellen-op-kenteken',
    /*
     * Two pages built from the Search Console export rather than from a
     * guess: "gestolen" is 612 impressions sitting at position 50 against a
     * blog post that sells nothing, and the sleutelmaker/slotenmaker family
     * is 708 impressions of people looking for a trade rather than a task.
     */
    '/autosleutel-gestolen', '/mobiele-sleutelmaker',
    /*
     * "in de buurt" is already at position 8.4 with the best click rate of
     * any local query in the export, ranking against the city hub because
     * nothing answered it directly. (/autosleutel-kopieren and
     * /autosleutel-laten-maken were listed here too; since 12 Nov 2026 they
     * 301 to /diensten/autosleutel-bijmaken, so they are not listed.)
     */
    '/autosleutel-bijmaken-in-de-buurt',
    /*
     * The Renault sleutelkaart queries (about 425 impressions, no clicks)
     * had no page to land on.
     */
    '/renault-sleutelkaart-kwijt-of-kapot',
    // Replaces the twelve cut car brands with the ten motorcycle brands on Dutch roads, as one page.
    '/motorsleutel-bijmaken',
    // Linked from the footer of every page and indexable, but was never
    // listed here — the only orphan left after the model pages came out.
    '/algemene-voorwaarden',
    // B2B and recruitment. Different audience and different queries from the
    // consumer pages, so they earn their own entries rather than riding along.
    '/zakelijk'
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

  // 1b. Problem pages: one per customer problem (src/config/problemPages.ts).
  // /diensten/autosleutel-bijmaken is one of them now, listed here only.
  const problemPages = PROBLEM_PAGES.map(p => ({
    url: `${base}${problemHref(p)}`,
    lastModified: lastModifiedFor(problemHref(p), 'static'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // 2. Service Pages
  // `auto-slotenmaker` is a standalone route folder rather than a DIENSTEN
  // entry, so it was missing from the sitemap even though the navigation
  // links to it from every page. (`autosleutel-bijmaken` was too; it is a
  // problem page now and listed above.)
  const STANDALONE_SERVICES = ['auto-slotenmaker'];

  const serviceSlugs = Array.from(
    new Set([...DIENSTEN.filter(s => !REDIRECTED_SERVICE_SLUGS.has(s.slug)).map(s => s.slug), ...STANDALONE_SERVICES])
  );

  const servicePages = serviceSlugs.map(slug => ({
    url: `${base}/diensten/${slug}`,
    lastModified: lastModifiedFor(`/diensten/${slug}`, 'diensten'),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  // 3. City Pages
  const cityPages = CITIES.filter(c => !isNoindexCity(c.slug)).map(c => {
    const images = [];
    if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `autosleutel-bijmaken-${c.slug}.webp`))) {
      images.push(`${base}/images/autosleutel-bijmaken-${c.slug}.webp`);
    }
    return {
      url: `${base}${cityPath(c.slug)}`,
      lastModified: lastModifiedFor(cityPath(c.slug), 'steden'),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
      images,
    };
  });

  // 3b. Province hubs: Utrecht, Noord-Holland, Zuid-Holland, Gelderland, Flevoland.
  const regionPages = SERVICE_REGIONS.map(r => ({
    url: `${base}/regio/${r.slug}`,
    lastModified: lastModifiedFor(`/regio/${r.slug}`, 'steden'),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  // 4. Brand Pages
  const brandPages = BRANDS.filter(b => !isNoindexBrand(b.nameSlug)).map(b => ({
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
    ...problemPages,
    ...servicePages,
    ...regionPages,
    ...cityPages,
    ...brandPages,
    ...zakelijkPages,
    ...blogPages
  ];
}
