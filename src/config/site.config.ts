// ============================================================
// SITE CONFIG — the active site
//
// The business data used to live in this file. It now lives in
// ./sites/{nl,be,de}.ts and SITE_ID picks one at build time; this file stays
// as the import everyone already uses.
//
// That is the whole reason it is a re-export rather than a deletion: 77 files
// import SITE_CONFIG from here and 237 call sites read it. Moving the data
// without moving the import means the three-country split is invisible to all
// of them, and the Dutch site's output is unchanged.
// ============================================================

import { ACTIVE_SITE } from './sites';
import type { SiteConfig } from './sites/types';

export type { SiteConfig };
export { SITE_ID, SITES, SITE_IDS, type SiteId } from './sites';

export const SITE_CONFIG: SiteConfig = ACTIVE_SITE;

export const WHATSAPP_URL = '/whatsapp';

/**
 * Whether the VAT number is at least in the shape this country issues.
 *
 * Pages that print it check this first, so a placeholder can never end up on
 * an invoice or in the terms. The pattern comes from the active site because
 * the three countries do not agree on it: NL42123555B01, BE0123456789 and
 * DE123456789 are all valid and none of them matches the others' format — so
 * the old hardcoded Dutch regex would have hidden a perfectly good Belgian
 * number rather than printing it.
 */
export function isBtwConfigured(): boolean {
  return new RegExp(SITE_CONFIG.vatNumberPattern).test(SITE_CONFIG.btw ?? '');
}
