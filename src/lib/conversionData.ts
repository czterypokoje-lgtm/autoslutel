import type { SupabaseClient } from '@supabase/supabase-js';
import { readClickOrigin } from './adClickId.ts';
import { readPaged } from './attributionData.ts';
import { codesIn, proposeMatches, toIncl, type Decision, type PoolClick, type PoolLead, type Sale, type SaleReview } from './conversionMatcher.ts';

/**
 * Reads what /admin/conversies and its API compare: sales (finished jobs,
 * WhatsApp wins, WhatsApp ad reviews marked "gedaan"), the clicks and leads
 * that might explain them, and the decisions already taken. Runs on the server
 * with the office user's own session, so row-level security still applies.
 * Phone numbers are read for comparison and never returned to the browser.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/* Sales back to here are loaded (older ones only feed the "te oud" count). */
const SALES_DAYS = 180;
/* Clicks and leads back to here: 90 days before the oldest sale that can still be uploaded. */
const POOL_DAYS = 190;

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

export interface ConversionData {
  reviews: SaleReview[];
  decisions: Decision[];
  /** WhatsApp reviews already downloaded by hand from /admin/whatsapp-advertenties: left out so nothing is sent twice. */
  reviewsExportedByHand: number;
  /** Parts that could not be read (a migration not run yet); the rest still works. */
  warnings: string[];
}

function jobSale(j: Row): Sale | null {
  const at = str(j.completed_at);
  if (!at) return null;
  const finalPrice = num(j.final_price);
  const quoted = num(j.quoted_price);
  /* final_price is what the customer pays: incl. BTW. The quote is a fallback the reviewer can correct. */
  const { incl } = toIncl(finalPrice ?? quoted, 'incl');
  const car = [str(j.car_make), str(j.car_model)].filter(Boolean).join(' ');
  return {
    source: 'job',
    id: String(j.id),
    at,
    enteredAt: str(j.created_at),
    phone: str(j.customer_phone),
    leadId: str(j.lead_id),
    own: { gclid: str(j.gclid), gbraid: str(j.gbraid), wbraid: str(j.wbraid), capturedAt: str(j.click_captured_at) },
    valueIncl: incl,
    vatAssumed: false,
    title: car || 'Klus',
    detail: [str(j.customer_name), str(j.city), finalPrice === null && quoted !== null ? 'bedrag = offerte' : null].filter(Boolean).join(' · '),
  };
}

function quoteSale(q: Row): Sale | null {
  const at = str(q.quoted_at) ?? str(q.asked_at);
  if (!at) return null;
  const amount = num(q.final_price_amount) ?? num(q.price_amount);
  const { incl, assumed } = toIncl(amount, str(q.price_vat));
  const context = Array.isArray(q.context) ? (q.context as Row[]) : [];
  const text = [str(q.quote_excerpt) ?? '', ...context.map((m) => (typeof m?.text === 'string' ? m.text : ''))].join('\n');
  const car = [str(q.make), str(q.model)].filter(Boolean).join(' ');
  return {
    source: 'whatsapp_quote',
    id: String(q.id),
    at,
    phone: str(q.phone),
    codes: codesIn(text),
    valueIncl: incl,
    vatAssumed: assumed,
    title: car || 'WhatsApp-verkoop',
    detail: [str(q.contact_name), str(q.city), str(q.problem)].filter(Boolean).join(' · '),
  };
}

function reviewSale(r: Row): Sale | null {
  const day = str(r.work_date) ?? str(r.chat_at)?.slice(0, 10) ?? null;
  if (!day) return null;
  const { incl, assumed } = toIncl(num(r.value), null);
  return {
    source: 'whatsapp_review',
    id: String(r.id),
    /* Midday on the work date: the review stores a day, not a time. */
    at: `${day}T12:00:00Z`,
    codes: str(r.ref) ? [String(r.ref)] : [],
    valueIncl: incl,
    vatAssumed: assumed,
    title: str(r.car) ?? 'WhatsApp-advertentie',
    detail: [`code ${str(r.ref) ?? '?'}`, str(r.price_note)].filter(Boolean).join(' · '),
  };
}

export async function loadConversionData(supabase: SupabaseClient, now: Date = new Date()): Promise<ConversionData> {
  const warnings: string[] = [];
  const salesSince = new Date(now.getTime() - SALES_DAYS * DAY_MS).toISOString();
  const poolSince = new Date(now.getTime() - (SALES_DAYS + POOL_DAYS) * DAY_MS).toISOString();

  const clickColumns = 'id, created_at, gclid, wbraid, gbraid, ref, claimed_by_job_id, source_url';
  const [jobs, quotes, adReviews, decisions, leads, clicksFull] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, created_at, completed_at, status, customer_name, customer_phone, city, car_make, car_model, final_price, quoted_price, lead_id, gclid, wbraid, gbraid, click_captured_at')
      .eq('status', 'afgerond')
      .gte('completed_at', salesSince)
      .order('completed_at', { ascending: false })
      .limit(3000),
    supabase
      .from('whatsapp_quotes')
      .select('id, phone, contact_name, asked_at, quoted_at, make, model, city, problem, price_amount, final_price_amount, price_vat, quote_excerpt, context')
      .eq('outcome', 'gewonnen')
      .is('job_id', null)
      .limit(2000),
    supabase
      .from('whatsapp_ad_reviews')
      .select('id, ref, chat_at, car, price_note, value, work_date, exported_at')
      .eq('decision', 'gedaan')
      .limit(2000),
    supabase.from('ad_conversion_matches').select('*').limit(5000),
    readPaged<PoolLead>(supabase, 'leads', 'id, created_at, phone, phone_e164, gclid, wbraid, gbraid', poolSince),
    readPaged<Row>(supabase, 'call_clicks', `${clickColumns}, chat_phone_key, chat_phone_conflict`, poolSince),
  ]);

  /* 0088 adds chat_phone_*; without it the code-by-number rule is off, the rest works. */
  const clicks = clicksFull.error ? await readPaged<Row>(supabase, 'call_clicks', clickColumns, poolSince) : clicksFull;
  if (clicksFull.error) warnings.push('call_clicks zonder telefoonkolommen (migratie 0088 niet uitgevoerd?): regel "WhatsApp-code vanaf dit nummer" staat uit.');

  if (jobs.error) warnings.push(`Klussen lezen mislukte: ${jobs.error.message}`);
  if (quotes.error) warnings.push(`WhatsApp-verkopen lezen mislukte (migratie 0106?): ${quotes.error.message}`);
  if (adReviews.error) warnings.push(`WhatsApp-beoordelingen lezen mislukte (migratie 0077?): ${adReviews.error.message}`);
  if (decisions.error) warnings.push(`Besluiten lezen mislukte: voer supabase/migrations/0109_ad_conversion_matches.sql uit. (${decisions.error.message})`);
  if (leads.error) warnings.push(`Leads lezen mislukte: ${leads.error}`);
  if (clicks.error) warnings.push(`Klikken lezen mislukte: ${clicks.error}`);

  const reviewRows = (adReviews.data ?? []) as Row[];
  const reviewsExportedByHand = reviewRows.filter((r) => r.exported_at).length;

  const sales: Sale[] = [
    ...((jobs.data ?? []) as Row[]).map(jobSale),
    ...((quotes.data ?? []) as Row[]).map(quoteSale),
    ...reviewRows.filter((r) => !r.exported_at).map(reviewSale),
  ].filter((s): s is Sale => s !== null);

  const pool = {
    leads: leads.rows,
    clicks: clicks.rows.map((c): PoolClick => {
      const origin = readClickOrigin(str(c.source_url));
      return {
        id: String(c.id),
        created_at: str(c.created_at),
        gclid: str(c.gclid),
        wbraid: str(c.wbraid),
        gbraid: str(c.gbraid),
        ref: str(c.ref),
        claimed_by_job_id: str(c.claimed_by_job_id),
        chat_phone_key: str(c.chat_phone_key),
        chat_phone_conflict: c.chat_phone_conflict === true,
        campaignId: origin.campaignId,
        page: origin.page,
      };
    }),
  };

  const decisionRows = (decisions.data ?? []) as Decision[];
  const reviews = proposeMatches(sales, pool, decisionRows, now).sort(
    (a, b) => (a.sale.at < b.sale.at ? 1 : a.sale.at > b.sale.at ? -1 : 0)
  );
  return { reviews, decisions: decisionRows, reviewsExportedByHand, warnings };
}

/** The phone number never leaves the server: strip it before anything goes to the browser. */
export function forBrowser(reviews: readonly SaleReview[]): SaleReview[] {
  return reviews.map((r) => ({ ...r, sale: { ...r.sale, phone: null, own: null, leadId: null } }));
}
