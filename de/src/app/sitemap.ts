import { MetadataRoute } from 'next';
import { SITE_CONFIG, siteIsReady } from '@/config/site.config';
import { ZAKELIJK_SEGMENTS } from '@/config/geschaeftskunden';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/leistungen';
import { CITIES } from '@/config/cities';
import { isNoindexCity } from '@/config/thinPages';
import { SERVICE_REGIONS } from '@/config/regions';
import { lastModifiedFor } from '@/lib/contentDates';

/*
 * Nur URLs, die es gibt.
 *
 * Die niederländische Sitemap listet zusätzlich 59 Markenseiten, rund dreißig
 * Blogartikel und eine Kennisbank. Diese drei Bereiche sind in dieser App
 * nicht enthalten (siehe config/services.ts und BrandsLogoGrid), also stehen
 * sie auch nicht hier: eine Sitemap, die auf 404 zeigt, ist der schnellste
 * Weg, das Vertrauen in alle übrigen Einträge zu verlieren.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  /* Eine Vorschau listet nichts: siehe robots.ts. */
  if (!siteIsReady()) return [];

  const base = SITE_CONFIG.domain;

  // 1. Kernseiten
  const corePages = [
    '', '/leistungen', '/staedte', '/preise',
    '/ueber-uns', '/galerie', '/bewertungen', '/haeufige-fragen',
    '/kontakt', '/impressum', '/datenschutz', '/cookie-richtlinie', '/agb',
    /*
     * Die eigenständigen Landingpages. Jede davon antwortet auf eine eigene
     * Suchintention, die die Leistungsseiten nicht abdecken: "verloren" und
     * "gestohlen" sind Notfälle, "in der Nähe" ist eine lokale Suche ohne
     * Stadtnamen, "kopieren" und "nachmachen lassen" sind dieselbe Arbeit in
     * anderen Worten, und "mobiler Schlüsseldienst" sucht ein Gewerbe statt
     * einer Leistung.
     */
    '/autoschluessel-verloren', '/autoschluessel-gestohlen',
    '/autoschluessel-nachmachen-in-der-naehe', '/autoschluessel-kopieren',
    '/autoschluessel-nachmachen-lassen', '/mobiler-schluesseldienst',
    '/motorradschluessel-nachmachen',
    // B2B und Partnergewinnung: anderes Publikum, andere Suchanfragen.
    '/geschaeftskunden', '/partner-werden',
  ].map(p => ({
    url: `${base}${p}`,
    lastModified: lastModifiedFor(
      p || '/',
      p === '' ? 'home'
        : ['/datenschutz', '/cookie-richtlinie', '/agb', '/impressum'].includes(p) ? 'legal'
        : p === '/preise' ? 'preise'
        : p === '/leistungen' ? 'leistungen'
        : p === '/staedte' ? 'staedte'
        : 'static'
    ),
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1.0 : 0.8,
  }));

  // 2. Leistungsseiten
  const serviceSlugs = DIENSTEN
    .filter(s => !REDIRECTED_SERVICE_SLUGS.has(s.slug))
    .map(s => s.slug);

  const servicePages = serviceSlugs.map(slug => ({
    url: `${base}/leistungen/${slug}`,
    lastModified: lastModifiedFor(`/leistungen/${slug}`, 'leistungen'),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  /*
   * 3. Städte — nur die vier mit einem Partner.
   *
   * isNoindexCity ist das Erbe der niederländischen Seite und der Grund, dass
   * sie keine Doorway-Pages hat: eine Stadtseite ist nur indexierbar, wenn
   * dort wirklich jemand hinfährt. Darum stehen hier vier Städte und nicht
   * vierhundert.
   */
  const cityPages = CITIES.filter(c => !isNoindexCity(c.slug)).map(c => ({
    url: `${base}/staedte/${c.slug}`,
    lastModified: lastModifiedFor(`/staedte/${c.slug}`, 'staedte'),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  // 3b. Regionen: Berlin, Hamburg, Bayern, Hessen.
  const regionPages = SERVICE_REGIONS.map(r => ({
    url: `${base}/regionen/${r.slug}`,
    lastModified: lastModifiedFor(`/regionen/${r.slug}`, 'staedte'),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  const zakelijkPages = ZAKELIJK_SEGMENTS.map((seg) => ({
    url: `${base}/geschaeftskunden/${seg.slug}`,
    lastModified: lastModifiedFor(`/geschaeftskunden/${seg.slug}`, 'static'),
    changeFrequency: 'monthly' as const,
    /* Unter den Verbraucherseiten: weniger Suchanfragen, aber jede Anfrage
       ist mehrere Aufträge wert statt einen. */
    priority: 0.7,
  }));

  return [
    ...corePages,
    ...servicePages,
    ...regionPages,
    ...cityPages,
    ...zakelijkPages,
  ];
}
