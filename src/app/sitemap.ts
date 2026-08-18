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
  const servicePages = DIENSTEN.map(s => ({
    url: `${base}/diensten/${s.slug}`,
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
    ...modelPages,
    ...blogPages
  ];
}
