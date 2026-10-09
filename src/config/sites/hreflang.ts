import { SITES, type SiteId } from './index';
import { missingFields } from './types';

/**
 * The hreflang cluster across the three domains.
 *
 * Two rules decide what belongs in it, and both of them are rules about not
 * lying to a crawler.
 *
 * FIRST: only a site that is actually finished is listed. A site is finished
 * when it has no placeholder left — the same test that lets it build at all.
 * An hreflang pointing at a domain that is not serving yet is a link to a
 * 404, and Google drops the whole cluster when one member does not reciprocate.
 * Today that means NL is alone in the cluster and emits exactly what it
 * emitted before this file existed. Germany joins itself the day its config is
 * filled in; nobody has to remember to come back here.
 *
 * SECOND: a cluster is for pages that are the same page in another language.
 * The home page, the price page and the contact page are. A city page is NOT:
 * /steden/utrecht and /staedte/berlin are two different cities, not two
 * translations, so city pages get a canonical and no alternates. The old code
 * listed a city page as its own 'nl-NL' and 'x-default', which was harmless
 * and meant nothing; what would not be harmless is wiring Utrecht to Berlin
 * because both are "the city page".
 */

/** A site whose config has no placeholders left, i.e. one that is serving. */
export function isLive(id: SiteId): boolean {
  return missingFields(SITES[id]).length === 0;
}

export const LIVE_SITE_IDS = (Object.keys(SITES) as SiteId[]).filter(isLive);

/**
 * `languages` for Next's `alternates`, for a page that genuinely exists in
 * more than one language.
 *
 * `pathBySite` gives the path on each site, because the slugs differ:
 * { nl: '/prijzen', de: '/preise' }. A site left out of the map does not have
 * the page and is not listed. Paths are site-relative and start with '/'; ''
 * means the home page.
 */
export function alternateLanguages(
  pathBySite: Partial<Record<SiteId, string>>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of LIVE_SITE_IDS) {
    const path = pathBySite[id];
    if (path === undefined) continue;
    const site = SITES[id];
    const url = `${site.domain}${path}`;
    out[site.hreflang] = url;
    if (site.isXDefault) out['x-default'] = url;
  }
  return out;
}

/**
 * The same path on every live site, for pages whose slug does not change.
 * '' is the home page.
 */
export function alternatesForPath(path: string): Record<string, string> {
  return alternateLanguages(
    Object.fromEntries(LIVE_SITE_IDS.map((id) => [id, path]))
  );
}
