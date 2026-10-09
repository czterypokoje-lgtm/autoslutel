import type { MetadataRoute } from 'next';
import { SITE, siteIsReady } from '@/config/site';

/**
 * Solange eine Angabe fehlt, lädt diese Seite niemanden ein.
 *
 * An dieselbe Prüfung gekoppelt wie das noindex im Layout. Eine Vorschau mit
 * einer Sitemap voller Adressen und einem offenen robots.txt wäre eine
 * Einladung, die Platzhalter zu indexieren — und das Zurücknehmen dauert
 * länger als das Einrichten.
 */
export default function robots(): MetadataRoute.Robots {
  if (!siteIsReady()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE.domain}/sitemap.xml`,
    host: SITE.domain,
  };
}
