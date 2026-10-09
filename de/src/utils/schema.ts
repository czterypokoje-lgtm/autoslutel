import { SITE_CONFIG } from '@/config/site.config';
import { SERVICE_REGIONS } from '@/config/regions';

/*
 * One business, one node.
 *
 * The full description of Autosleutel24 (name, phone, address, hours, service
 * area, sameAs) is emitted ONCE, by LocalBusinessSchema in the root layout, under
 * BIZ_ID. Every other structured-data block on the site refers to it with
 * `{ '@id': BIZ_ID }` instead of describing the business again.
 *
 * It used to be described in full on each page -- with no @id on most of them and
 * a separate "#locksmith" record per city -- so a crawler, or an AI assistant that
 * reads the markup, counted dozens of businesses, each with a slightly different
 * address, service area and (on a handful of pages) phone format.
 */
export const BIZ_ID = `${SITE_CONFIG.domain}/#localbusiness`;

/** The reference every other node uses for "the business". */
export const businessRef = { '@id': BIZ_ID } as const;

/**
 * The business as a `provider`/`publisher`/`worksFor` value: a reference plus the
 * name and URL so the markup still reads on its own. Not a description -- the
 * description lives in the root layout.
 */
export function getBaseLocalBusinessSchema() {
  return {
    '@type': 'Locksmith',
    '@id': BIZ_ID,
    name: SITE_CONFIG.fullName,
    url: SITE_CONFIG.domain,
  };
}

/** The provinces we serve, as one list every page can reuse for areaServed. */
export function serviceRegionNodes() {
  return SERVICE_REGIONS.map((r) => ({ '@type': 'AdministrativeArea', name: r.name }));
}

/** A BreadcrumbList with Home first. `path` is site-relative, e.g. "/merken". */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      ...trail.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: t.name,
        item: `${SITE_CONFIG.domain}${t.path}`,
      })),
    ],
  };
}
