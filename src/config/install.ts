/**
 * Which customer this deployment is.
 *
 * One codebase, one install per customer: each install has its own Vercel
 * project, its own Supabase project and its own users, and this one env var
 * says which one we are. Anything not set means Autosleutel24, so the live
 * CRM behaves exactly as before.
 *
 * KeyForCars gets the whole office CRM — dashboard, leads, AI conversations,
 * calendar, customers, invoices, expenses, reports — plus its own web-shop
 * orders and warehouse stock. What it does not get is our technician network
 * (technicians' own screens, offers and bids, payouts, dispatch rates, the
 * network chat) and our public website: those answer 404 there (enforced in
 * src/proxy.ts). Even a screen we forgot to hide would read KeyForCars's own
 * database, never ours.
 */

export type Install = 'autosleutel24' | 'keyforcars';

export const INSTALL: Install = process.env.CRM_INSTALL === 'keyforcars' ? 'keyforcars' : 'autosleutel24';
export const IS_KEYFORCARS = INSTALL === 'keyforcars';

export const BRAND = IS_KEYFORCARS
  ? { name: 'KeyForCars', crm: 'KeyForCars CRM', staff: 'Alleen voor medewerkers van KeyForCars.' }
  : { name: 'Autosleutel24', crm: 'Autosleutel24 CRM', staff: 'Alleen voor medewerkers en monteurs van Autosleutel24.' };

/** Autosleutel24-only screens: our technician network and the old webshop. */
const KEYFORCARS_HIDDEN = [
  '/admin/aanbod',
  '/admin/biedingen',
  '/admin/vandaag',
  '/admin/monteurs',
  '/admin/monteurtarieven',
  '/admin/tarieven',
  '/admin/kas',
  '/admin/netwerk',
  '/admin/start',
  '/admin/producten',
  '/admin/mijn-',
  '/admin/orders/', // the list is KeyForCars's own; detail and purchase pages read our old webshop
];

/** Outside the CRM, only the asset paths the proxy matcher does not skip. */
const KEYFORCARS_OUTSIDE = [
  '/vendor', // barcode decoder .wasm
  '/api/woo', // WooCommerce order webhooks (signature-checked in the route)
  '/api/cron/kfc-reconcile', // nightly import check (CRON_SECRET)
  '/api/agent/workshop', // ElevenLabs Workshop Service tools (KFC_WORKSHOP_AGENT_TOKEN); other /api/agent routes stay closed
  '/_next', // dev reload
  '/__nextjs_original-stack-frame', // dev error overlay
];

const under = (pathname: string, prefix: string) =>
  prefix.endsWith('/') || prefix.endsWith('-')
    ? pathname.startsWith(prefix)
    : pathname === prefix || pathname.startsWith(`${prefix}/`);

/** True when this install serves the path; false means 404. */
export function installServes(pathname: string): boolean {
  if (!IS_KEYFORCARS) return true;
  if (pathname === '/' || pathname === '/admin') return true; // both redirect to the dashboard
  if (pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) {
    return !KEYFORCARS_HIDDEN.some((prefix) => under(pathname, prefix));
  }
  return KEYFORCARS_OUTSIDE.some((prefix) => under(pathname, prefix));
}
