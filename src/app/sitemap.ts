import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { DIENSTEN } from '@/config/diensten';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import { BLOG_POSTS } from '@/config/services';

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
  const servicePages = DIENSTEN.map(s => ({
    url: `${base}/diensten/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  // 3. City Pages
  const cityPages = CITIES.map(c => ({
    url: `${base}/steden/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
    images: Array.from({ length: 8 }).map((_, i) => `${base}/images/cities/${c.slug}/autosleutel-bijmaken-${c.slug}-${i + 1}.webp`),
  }));

  // 4. Brand Pages
  const brandPages = BRANDS.map(b => ({
    url: `${base}/merken/${b.nameSlug}-autosleutel-bijmaken`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));




  // 8. Blog Pages
  const blogPages = BLOG_POSTS.map(b => ({
    url: `${base}/blog/${b.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [
    ...corePages,
    ...servicePages,
    ...cityPages,
    ...brandPages,
    ...blogPages
  ];
}
