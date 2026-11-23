/**
 * Which deployment switches are on.
 *
 * This codebase is Autosleutel24's alone. KeyForCars, which used to run as a
 * second install of the same code (CRM_INSTALL=keyforcars), now lives in its
 * own repository (czterypokoje-lgtm/keyforcars-crm1); see
 * docs/keyforcars-ayrisma.md. The Supabase guard in
 * src/lib/supabase/installGuard.ts still refuses any database but ours.
 */

/**
 * The shadcn shell and the Studio screens (leads dashboard, chat).
 * Autosleutel24 opts in per deployment with CRM_UI=studio, so the live CRM
 * keeps its old look until that variable is set and gets it back the moment
 * it is removed.
 */
export const STUDIO_UI = process.env.CRM_UI === 'studio';

/**
 * The warehouse and e-commerce modules (stock ledger, pick list, purchasing,
 * shipping, webshop orders, bank import, agent centre, staff assistant).
 * Autosleutel24 opts in per deployment with CRM_WAREHOUSE=1 once its database
 * has the kfc_* migrations. Like CRM_UI it is fixed at build time (next.config
 * env), so a rebuild is needed to change it.
 */
export const WAREHOUSE = process.env.CRM_WAREHOUSE === '1';

export const BRAND = {
  name: 'Autosleutel24',
  crm: 'Autosleutel24 CRM',
  staff: 'Alleen voor medewerkers en monteurs van Autosleutel24.',
};
