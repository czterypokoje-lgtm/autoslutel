/**
 * Which country this build is.
 *
 * One repo, one `git push`, three Vercel projects — each with its own
 * SITE_ID. The alternative was resolving the site from the Host header in
 * src/proxy.ts, and it was rejected: SITE_CONFIG is a module constant imported
 * in 77 files and read at 237 call sites, so making it request-scoped means
 * threading a context through all of them and giving up static generation for
 * every page on the site. It would also put untested German copy in the same
 * deployment as the Dutch site that pays for everything.
 *
 * Selecting at build time costs nothing at the call sites, keeps the pages
 * static, gives each domain its own sitemap, robots and Search Console
 * property, and means a broken German deploy cannot reach autosleutel24.nl.
 *
 * Unset SITE_ID means NL. That is not a default chosen for tidiness: it is so
 * that an existing deployment, a local checkout and every script that imports
 * this keep behaving exactly as they did before Belgium and Germany existed.
 */

import { NL_SITE } from './nl';
import { BE_SITE } from './be';
import { DE_SITE } from './de';
import { assertSiteComplete, type SiteConfig } from './types';

export const SITES = {
  nl: NL_SITE,
  be: BE_SITE,
  de: DE_SITE,
} as const satisfies Record<string, SiteConfig>;

export type SiteId = keyof typeof SITES;

export const SITE_IDS = Object.keys(SITES) as SiteId[];

function resolveSiteId(): SiteId {
  const raw = (process.env.SITE_ID ?? 'nl').trim().toLowerCase();
  if (raw in SITES) return raw as SiteId;
  // Fail loudly: a typo'd SITE_ID silently serving the Dutch site on a German
  // domain is the worst of the available outcomes.
  throw new Error(
    `SITE_ID="${raw}" is not a known site. Expected one of: ${SITE_IDS.join(', ')}.`
  );
}

export const SITE_ID: SiteId = resolveSiteId();

const selected: SiteConfig = SITES[SITE_ID];

/* A build that would show a customer a placeholder price or VAT number
   refuses to start. NL has no placeholders, so nothing changes there. */
assertSiteComplete(selected);

export const ACTIVE_SITE = selected;
