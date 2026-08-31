import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { DIENSTEN } from '@/config/diensten';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import { BLOG_POSTS } from '@/config/services';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.domain;
  const now = new Date();

  // 1. Core Pages
  const corePages = [
    '', '/diensten', '/steden', '/merken', '/prijzen', '/blog', '/kennisbank',
    '/over-ons', '/galerij', '/beoordelingen', '/veelgestelde-vragen',
    '/contact', '/privacybeleid',
    '/autosleutel-kwijt', '/autosleutel-bestellen-op-kenteken'
  ].map(p => ({
    url: `${base}${p}`,
    lastModified: now,
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
    lastModified: now,
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
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
      images,
    };
  });

  // 4. Brand Pages
  const brandPages = BRANDS.map(b => ({
    url: `${base}/merken/${b.nameSlug}-autosleutel-bijmaken`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  // 5. Model Pages and Special Intents
  const modelPages = BRANDS.flatMap(b => {
    const models = (b.models || []).map(m => ({
      url: `${base}/merken/${b.nameSlug.toLowerCase()}-autosleutel-bijmaken/${m.slug}-sleutel-bijmaken`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }));
    
    const intents = (b.specialIntents || []).map(intent => ({
      url: `${base}/merken/${b.nameSlug.toLowerCase()}-autosleutel-bijmaken/${intent.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }));

    return [...models, ...intents];
  });
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
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
      images: [`${base}/og-image.png`],
    }));

  return [
    ...corePages,
    ...servicePages,
    ...cityPages,
    ...brandPages,
    ...modelPages,
    ...blogPages
  ];
}
