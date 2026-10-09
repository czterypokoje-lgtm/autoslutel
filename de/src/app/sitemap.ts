import type { MetadataRoute } from 'next';
import { SITE, siteIsReady } from '@/config/site';
import { STAEDTE } from '@/config/staedte';
import { LEISTUNGEN } from '@/config/leistungen';

/**
 * Die Sitemap zählt nur, was indexiert werden soll.
 *
 * Es gibt hier nichts auszuschließen, und das ist der Vorteil daran, die Seite
 * neu zu bauen statt die niederländische zu übersetzen: es existiert keine
 * Seite, die noch auf Niederländisch wäre, und keine Stadt ohne Partner. Was
 * im Build existiert, darf in die Sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  /* Eine Vorschau listet nichts: siehe robots.ts. */
  if (!siteIsReady()) return [];

  const now = new Date();
  const statisch = [
    '',
    '/leistungen',
    '/staedte',
    '/preise',
    '/kontakt',
    '/partner-werden',
    '/impressum',
    '/datenschutz',
    '/widerrufsrecht',
  ];

  return [
    ...statisch.map((path) => ({
      url: `${SITE.domain}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...LEISTUNGEN.map((l) => ({
      url: `${SITE.domain}/leistungen/${l.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...STAEDTE.map((s) => ({
      url: `${SITE.domain}/staedte/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
  ];
}
