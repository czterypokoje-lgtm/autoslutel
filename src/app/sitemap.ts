import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import { DIENSTEN } from '@/config/diensten';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.domain;
  const now = new Date();

  // 1. Core Pages
  const corePages = [
    '', '/diensten', '/locaties', '/merken', '/prijzen', '/blog',
    '/over-ons', '/galerij', '/beoordelingen', '/veelgestelde-vragen',
    '/contact', '/privacybeleid', '/auto-op-slot', '/spoedhulp-autosleutel'
  ].map(p => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1.0 : 0.8,
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
  }));

  // 4. Brand Pages
  const brandPages = BRANDS.map(b => ({
    url: `${base}/merken/${b.nameSlug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  // 5. Model Pages (Year SEO)
  const modelPages: MetadataRoute.Sitemap = [];
  BRANDS.forEach(b => {
    if (b.models) {
      b.models.forEach(m => {
        modelPages.push({
          url: `${base}/merken/${b.nameSlug}/${m.slug}`,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        });
      });
    }
  });

  // 6. Combo Pages (City x Brand)
  const comboPages: MetadataRoute.Sitemap = [];
  CITIES.forEach(city => {
    BRANDS.forEach(brand => {
      if (
        (city.priority === 'P1' && (brand.priority === 'P1' || brand.priority === 'P2')) ||
        (city.priority === 'P2' && brand.priority === 'P1') ||
        (city.priority === 'P3' && brand.priority === 'P1')
      ) {
        comboPages.push({
          url: `${base}/steden/${city.slug}/${brand.nameSlug}-sleutel-programmeren`,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        });
      }
    });
  });

  // 7. Combo Pages (City x Service)
  const cityServicePages: MetadataRoute.Sitemap = [];
  CITIES.forEach(city => {
    const coreSlugs = ['alle-sleutels-kwijt-auto', 'sleutel-bijmaken', 'transponder-sleutel-programmeren', 'smart-key-programmeren', 'contact-reparatie'];
    const services = city.priority === 'P3'
      ? DIENSTEN.filter(s => coreSlugs.includes(s.slug))
      : DIENSTEN;
    services.forEach(service => {
      cityServicePages.push({
        url: `${base}/steden/${city.slug}/${service.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      });
    });
  });

  return [
    ...corePages,
    ...servicePages,
    ...cityPages,
    ...brandPages,
    ...modelPages,
    ...comboPages,
    ...cityServicePages
  ];
}
