/**
 * Which customer this deployment is.
 *
 * One codebase, one install per customer: each install has its own Vercel
 * project, its own Supabase project and its own users, and this one env var
 * says which one we are. Anything not set means Autosleutel24, so the live
 * CRM behaves exactly as before.
 *
 * KeyForCars is a car-key shop: a store plus WooCommerce webshops. It gets the
 * office CRM — dashboard, customers, conversations (e-mail and forms),
 * invoices, expenses, reports — plus its own web-shop orders and warehouse
 * stock, and for now the workshop calendar (see WORKSHOP). What it does not
 * get is our technician network (technicians' own screens, offers and bids,
 * payouts, dispatch rates, the network chat), jobs and leads, WhatsApp ads,
 * click-fraud tooling and our public website: those answer 404 there, pages
 * and their APIs alike (enforced in src/proxy.ts). Even a screen we forgot to
 * hide would read KeyForCars's own database, never ours — the Supabase guard
 * in src/lib/supabase/installGuard.ts refuses any other project.
 */

export type Install = 'autosleutel24' | 'keyforcars';

export const INSTALL: Install = process.env.CRM_INSTALL === 'keyforcars' ? 'keyforcars' : 'autosleutel24';
export const IS_KEYFORCARS = INSTALL === 'keyforcars';

/**
 * The shadcn shell and the Studio screens (leads dashboard, chat). Always on
 * for KeyForCars. Autosleutel24 opts in per deployment with CRM_UI=studio, so
 * the live CRM keeps its old look until that variable is set and gets it back
 * the moment it is removed. Screens that read KeyForCars-only tables stay
 * behind IS_KEYFORCARS regardless of this flag.
 */
export const STUDIO_UI = IS_KEYFORCARS || process.env.CRM_UI === 'studio';

/**
 * The warehouse and e-commerce modules (stock ledger, pick list, purchasing,
 * shipping, webshop orders, bank import, agent centre, staff assistant).
 * Always on for KeyForCars; Autosleutel24 opts in per deployment with
 * CRM_WAREHOUSE=1 once its database has the kfc_* migrations. Like CRM_UI it
 * is fixed at build time (next.config env), so a rebuild is needed to change it.
 */
export const WAREHOUSE = IS_KEYFORCARS || process.env.CRM_WAREHOUSE === '1';

export const BRAND = IS_KEYFORCARS
  ? { name: 'KeyForCars', crm: 'KeyForCars CRM', staff: 'Alleen voor medewerkers van KeyForCars.' }
  : { name: 'Autosleutel24', crm: 'Autosleutel24 CRM', staff: 'Alleen voor medewerkers en monteurs van Autosleutel24.' };

/**
 * The workshop calendar (/admin/agenda, migration 0104) and the ElevenLabs
 * Workshop Service agent (/api/agent/workshop). KeyForCars is a shop, but it
 * keeps these for now; the owner switches them off per deployment with
 * KFC_WORKSHOP=0 (inlined at build time like CRM_INSTALL, so a redeploy is
 * needed). Autosleutel24 never had them hidden.
 */
export const WORKSHOP = !IS_KEYFORCARS || process.env.KFC_WORKSHOP !== '0';

/**
 * Autosleutel24-only screens: our technician network, jobs and leads, the
 * WhatsApp and ad-click tooling, and the old webshop. Each entry also closes
 * its own /api/admin/<same> route (see servesPath), so a hidden screen's API
 * cannot be called directly.
 */
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
  // Jobs, leads and the dispatch office: KeyForCars has no technicians.
  '/admin/leads',
  '/admin/jobs',
  '/admin/live',
  '/admin/kantoor',
  // WhatsApp ads and the click-fraud evidence: KeyForCars runs neither.
  '/admin/whatsapp-advertenties',
  '/admin/whatsapp-analyse',
  '/admin/klikfraude',
  '/admin/attributie',
];

/**
 * API routes behind hidden screens whose names differ from the screen's, so
 * the /admin -> /api/admin mirror in servesPath does not reach them.
 */
const KEYFORCARS_HIDDEN_API = [
  '/api/admin/technicians', // monteurs
  '/api/admin/invite-technician', // monteurs
  '/api/admin/jobroom', // technician approval links
  '/api/admin/offers', // biedingen
  '/api/admin/availability', // mijn-agenda
  '/api/admin/profiel', // mijn-profiel
  '/api/admin/products', // producten (old webshop)
  '/api/admin/whatsapp-quotes', // whatsapp-analyse
  '/api/admin/ad-campaigns', // attributie
  '/api/admin/ad-reviews', // whatsapp-advertenties
];

/** Closed only when the owner switches the workshop off (WORKSHOP above). */
const KEYFORCARS_WORKSHOP = ['/admin/agenda', '/api/admin/workshop', '/api/agent/workshop'];

/** Outside the CRM, only the asset paths the proxy matcher does not skip. */
const KEYFORCARS_OUTSIDE = [
  '/vendor', // barcode decoder .wasm
  '/api/woo', // WooCommerce order webhooks (signature-checked in the route)
  '/api/cron/kfc-reconcile', // nightly import check (CRON_SECRET)
  '/api/cron/kfc-woo-stock', // stock push to the Woo shops (CRON_SECRET; off until WOO_<SHOP>_STOCK_PUSH is set)
  '/api/agent/workshop', // ElevenLabs Workshop Service tools (KFC_WORKSHOP_AGENT_TOKEN); other /api/agent routes stay closed
  '/api/webhooks/resend', // Resend inbound e-mail for Gesprekken (signature-checked); Meta WhatsApp stays closed
  '/_next', // dev reload
  '/__nextjs_original-stack-frame', // dev error overlay
];

const under = (pathname: string, prefix: string) =>
  prefix.endsWith('/') || prefix.endsWith('-')
    ? pathname.startsWith(prefix)
    : pathname === prefix || pathname.startsWith(`${prefix}/`);

export type ServeOptions = { install: Install; workshop: boolean };

/**
 * The pure rule behind installServes, with the install passed in so a test
 * can evaluate both installs in one process.
 */
export function servesPath(pathname: string, { install, workshop }: ServeOptions): boolean {
  if (install !== 'keyforcars') return true;
  if (!workshop && KEYFORCARS_WORKSHOP.some((prefix) => under(pathname, prefix))) return false;
  if (pathname === '/' || pathname === '/admin') return true; // both redirect to the dashboard
  if (pathname.startsWith('/admin/')) {
    return !KEYFORCARS_HIDDEN.some((prefix) => under(pathname, prefix));
  }
  if (pathname.startsWith('/api/admin/')) {
    // /api/admin/<x> belongs to /admin/<x>: a hidden screen's API is hidden too.
    const screen = pathname.slice('/api'.length);
    return (
      !KEYFORCARS_HIDDEN.some((prefix) => under(screen, prefix)) &&
      !KEYFORCARS_HIDDEN_API.some((prefix) => under(pathname, prefix))
    );
  }
  return KEYFORCARS_OUTSIDE.some((prefix) => under(pathname, prefix));
}

/** True when this install serves the path; false means 404. */
export function installServes(pathname: string): boolean {
  return servesPath(pathname, { install: INSTALL, workshop: WORKSHOP });
}
