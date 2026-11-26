import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { checkOps, logOps } from './opsAuth.ts';
import { findSensitive, guardText, maskSecrets, type Audience, type Finding } from './jobRoomGuard.ts';
import { DESKS, heartbeatStatus } from './jobRoomLive.ts';
import { toE164NL } from './phone.ts';

/**
 * The job room, as the server transport sees it (slice S1, SHADOW).
 *
 * Everything here records. Nothing sends: there is no claim or report step, and
 * the database refuses a shadow outbox row that is claimed or sent. Going live
 * is a later, separate decision.
 *
 * Handlers take the client and the parsed body and return a status and a body,
 * so the route files stay thin and the logic is testable without Next.
 */

export type Result = { status: number; body: Record<string, unknown> };

const ok = (body: Record<string, unknown>, status = 200): Result => ({ status, body });
const bad = (error: string, status = 400, extra: Record<string, unknown> = {}): Result => ({
  status,
  body: { error, ...extra },
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A trimmed string within a length, or null. Control characters are stripped. */
export function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  return text && text.length <= max ? text : null;
}

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | null =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Accent folding for names: ğ→g, ı→i, ö→o. Exact match only, never fuzzy. */
export function foldName(name: string): string {
  return name
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/gi, 'g')
    .replace(/ş/gi, 's')
    .replace(/ç/gi, 'c')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

/** The same message for the same job, person, kind, tier and audience is one row; a different tier or audience is a different row, so the first proposer cannot pick the tier for everyone. */
export const dedupeKey = (jobRoomId: string, contactId: string, kind: string, textHash: string, tier: number, audience: string) =>
  sha256([jobRoomId, contactId, kind, textHash, String(tier), audience].join('\u001f'));

export { guardText };
export type { Audience };

/** Stable JSON: keys sorted, so a jsonb round trip does not change a hash. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (isObject(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
}

/**
 * What an approver actually approves: the job, the recipient, the audience, the
 * tier, the kind, the exact text and the attachment. Stored as the row's
 * text_hash and re-computed at decision time (and by the transport before it
 * sends), so a row that was changed after the card was shown fails the check.
 */
export function outboxBindingHash(o: {
  job_room_id: string; contact_id: string; audience: string; tier: number; kind: string; body: string; attachment?: unknown;
}): string {
  return sha256(
    canonical([o.job_room_id, o.contact_id, o.audience, Number(o.tier), o.kind, o.body, sha256(canonical(o.attachment ?? null))])
  );
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

const ROLES = ['customer', 'technician', 'garage', 'staff', 'owner'] as const;
const COUNTRIES = ['NL', 'DE'] as const;
const LANGS = ['nl', 'de', 'en', 'tr'] as const;

type ContactInput = {
  phone: string;
  name: string;
  role: (typeof ROLES)[number];
  country: (typeof COUNTRIES)[number];
  language: (typeof LANGS)[number];
  waName: string | null;
  city: string | null;
};

function parseContact(b: Record<string, unknown>): ContactInput | string {
  const phone = toE164NL(typeof b.phone === 'string' ? b.phone : null);
  if (!phone || !/^\+[1-9][0-9]{7,14}$/.test(phone)) return 'Ongeldig telefoonnummer';
  const name = clean(b.name, 120);
  if (!name) return 'Naam ontbreekt';
  return {
    phone,
    name,
    role: oneOf(b.role, ROLES) ?? 'customer',
    country: oneOf(b.country, COUNTRIES) ?? 'NL',
    language: oneOf(b.language, LANGS) ?? 'nl',
    waName: clean(b.waName, 120),
    city: clean(b.city, 80),
  };
}

type Row = Record<string, unknown>;

/** Finds the contact by number or creates it. The number is the key; a later name never overwrites. */
async function upsertContact(
  supabase: SupabaseClient,
  c: ContactInput
): Promise<{ id: string; created: boolean; role: string } | { error: string }> {
  const now = new Date().toISOString();
  const found = await supabase.from('contacts').select('id, role').eq('phone_e164', c.phone).maybeSingle();
  if (found.error) return { error: found.error.message };
  if (found.data) {
    await supabase.from('contacts').update({ last_contact_at: now }).eq('id', found.data.id);
    return { id: found.data.id as string, created: false, role: found.data.role as string };
  }
  const ins = await supabase
    .from('contacts')
    .insert({
      phone_e164: c.phone,
      display_name: c.name,
      wa_name: c.waName,
      role: c.role,
      country: c.country,
      language: c.language,
      city: c.city,
      first_contact_at: now,
      last_contact_at: now,
    })
    .select('id')
    .single();
  if (ins.error?.code === '23505') {
    const again = await supabase.from('contacts').select('id, role').eq('phone_e164', c.phone).maybeSingle();
    if (again.data) return { id: again.data.id as string, created: false, role: again.data.role as string };
  }
  if (ins.error || !ins.data) return { error: ins.error?.message ?? 'insert failed' };
  return { id: ins.data.id as string, created: true, role: c.role };
}

/** Roles the API may create. Owner and staff exist only through SQL (0083 also enforces it), because they unlock the `internal` audience. */
const API_ROLES = ['customer', 'technician', 'garage'] as const;

/** POST: save a contact (every customer who writes) and optionally one explicit alias. */
export async function saveContact(supabase: SupabaseClient, raw: unknown): Promise<Result> {
  if (!isObject(raw)) return bad('Ongeldige invoer');
  const parsed = parseContact(raw);
  if (typeof parsed === 'string') return bad(parsed);
  if (!(API_ROLES as readonly string[]).includes(parsed.role)) return bad('Rol niet toegestaan', 403);
  const saved = await upsertContact(supabase, parsed);
  if ('error' in saved) return bad('Opslaan mislukt', 500);

  // A technician, garage or staff member is always findable by the full name
  // they were saved under. This is identity, not a guess, so it needs no pick.
  if (saved.created && parsed.role !== 'customer') {
    await supabase.from('contact_aliases').insert({
      contact_id: saved.id,
      alias: parsed.name,
      alias_folded: foldName(parsed.name),
      source: 'system',
    });
  }

  const alias = clean(raw.alias, 120);
  if (alias) {
    // Aliases come only from an explicit pick, so the pick must say who confirmed it.
    const confirmedBy = clean(raw.confirmedBy, 80);
    if (!confirmedBy) return bad('Alias vraagt een bevestiging', 400, { contactId: saved.id });
    const ins = await supabase.from('contact_aliases').insert({
      contact_id: saved.id,
      alias,
      alias_folded: foldName(alias),
      source: 'owner_pick',
      confirmed_by: confirmedBy,
    });
    if (ins.error && ins.error.code !== '23505') return bad('Alias opslaan mislukt', 500);
  }
  return ok({ contactId: saved.id, created: saved.created }, saved.created ? 201 : 200);
}

/**
 * GET: exact alias match after folding. One hit resolves; none or several
 * return the candidates so the caller asks. Fuzzy matches are never returned.
 */
export async function resolveContact(
  supabase: SupabaseClient,
  q: string | null,
  opts: { role?: string | null; last4?: string | null } = {}
): Promise<Result> {
  const name = clean(q, 120);
  if (!name) return bad('Naam ontbreekt');
  const folded = foldName(name);

  const aliases = await supabase
    .from('contact_aliases')
    .select('contact_id')
    .eq('alias_folded', folded)
    .is('revoked_at', null);
  if (aliases.error) return bad('Zoeken mislukt', 500);

  const ids = [...new Set((aliases.data ?? []).map((a) => a.contact_id as string))];
  if (ids.length === 0) return ok({ status: 'none', candidates: [] });

  const role = opts.role ? oneOf(opts.role, ROLES) : null;
  if (opts.role && !role) return bad('Ongeldige rol');
  const last4 = opts.last4 && /^\d{4}$/.test(opts.last4) ? opts.last4 : null;
  if (opts.last4 && !last4) return bad('Ongeldige laatste 4 cijfers');

  let lookup = supabase
    .from('contacts')
    .select('id, display_name, role, city, phone_e164')
    .in('id', ids)
    .eq('active', true);
  // Technicians resolve only from the technician book.
  if (role) lookup = lookup.eq('role', role);
  const contacts = await lookup;
  if (contacts.error) return bad('Zoeken mislukt', 500);
  if (last4) contacts.data = (contacts.data ?? []).filter((c: Row) => String(c.phone_e164).endsWith(last4));

  // Only the last 4 digits leave this function, enough to tell two people apart.
  const candidates = (contacts.data ?? []).map((c: Row) => ({
    id: c.id,
    name: c.display_name,
    role: c.role,
    city: c.city,
    last4: String(c.phone_e164).slice(-4),
  }));
  if (candidates.length === 1) return ok({ status: 'one', contact: candidates[0], candidates });
  return ok({ status: candidates.length === 0 ? 'none' : 'ambiguous', candidates });
}

// ---------------------------------------------------------------------------
// Job rooms
// ---------------------------------------------------------------------------

/** POST: create the job room for a lead or job; the same lead or job returns the same room. */
export async function openJobRoom(supabase: SupabaseClient, raw: unknown): Promise<Result> {
  if (!isObject(raw)) return bad('Ongeldige invoer');
  const leadId = raw.leadId === undefined ? null : raw.leadId;
  const jobId = raw.jobId === undefined ? null : raw.jobId;
  if (leadId !== null && !isUuid(leadId)) return bad('Ongeldige lead');
  if (jobId !== null && !isUuid(jobId)) return bad('Ongeldige klus');

  const keyCol = leadId ? 'lead_id' : jobId ? 'job_id' : null;
  const keyVal = (leadId ?? jobId) as string | null;
  if (keyCol && keyVal) {
    const existing = await supabase.from('job_rooms').select('id, code').eq(keyCol, keyVal).maybeSingle();
    if (existing.error) return bad('Opslaan mislukt', 500);
    if (existing.data) return ok(roomBody(existing.data, false));
  }

  let customerContactId: string | null = null;
  if (raw.customer !== undefined) {
    const parsed = isObject(raw.customer) ? parseContact(raw.customer) : 'Ongeldige klant';
    if (typeof parsed === 'string') return bad(parsed);
    const saved = await upsertContact(supabase, { ...parsed, role: 'customer' });
    if ('error' in saved) return bad('Opslaan mislukt', 500);
    customerContactId = saved.id;
  }

  const postcode = clean(raw.postcode, 12);
  const row = {
    lead_id: leadId,
    job_id: jobId,
    customer_contact_id: customerContactId,
    country: oneOf(raw.country, COUNTRIES) ?? 'NL',
    language: oneOf(raw.language, ['nl', 'de', 'en'] as const) ?? 'nl',
    service_type: clean(raw.serviceType, 80),
    city: clean(raw.city, 80),
    postcode4: postcode && /^\d{4}/.test(postcode) ? postcode.slice(0, 4) : null,
    car_label: clean(raw.carLabel, 80),
    plate: clean(raw.plate, 12),
  };
  const ins = await supabase.from('job_rooms').insert(row).select('id, code').single();
  if (ins.error?.code === '23505' && keyCol && keyVal) {
    const again = await supabase.from('job_rooms').select('id, code').eq(keyCol, keyVal).maybeSingle();
    if (again.data) return ok(roomBody(again.data, false));
  }
  if (ins.error || !ins.data) return bad('Opslaan mislukt', 500);

  if (customerContactId) {
    await supabase
      .from('job_parties')
      .insert({ job_room_id: ins.data.id, contact_id: customerContactId, role: 'customer' });
  }
  return ok(roomBody(ins.data, true), 201);
}

const roomBody = (r: Row, created: boolean) => ({
  jobRoomId: r.id,
  code: `J-${r.code}`,
  created,
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const CHANNELS = ['whatsapp', 'telegram', 'crm', 'voice', 'system'] as const;
const DIRECTIONS = ['in', 'out', 'internal'] as const;

/**
 * Event meta is for ids and codes. Keep at most 20 flat keys with short values,
 * mask keys-like strings, and drop any value that carries a phone number, email,
 * bank number or plate, so meta cannot be used to smuggle contact details.
 */
export function cleanMeta(meta: unknown): Row {
  if (!isObject(meta)) return {};
  const out: Row = {};
  for (const [k, v] of Object.entries(meta).slice(0, 20)) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(k) || /\d{6,}/.test(k)) continue; // a key is a name, not a number in disguise
    if (typeof v === 'number' && Number.isFinite(v)) {
      if (String(Math.abs(v)).replace(/\D/g, '').length <= 8) out[k] = v; // 9+ digits could be a phone or account number
    }
    else if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string') {
      const masked = maskSecrets(v).slice(0, 200);
      out[k] = findSensitive(masked, ['phone', 'email', 'iban', 'plate', 'url', 'payment'], { strictPlate: true }) ? '[verwijderd]' : masked;
    }
  }
  return out;
}

/** Who may write events through the route. Internal refusal and block events are written by this module only. */
const EVENT_ACTORS = ['transport', 'wacli', 'intake', 'translator', 'quote-relay', 'dispatcher', 'invoice', 'reports', 'doctor', 'crm'] as const;
const EVENT_KIND = /^[a-z][a-z0-9._-]{1,59}$/;
const RESERVED_KIND = /^(approval|outbox|heartbeat|privacy)\./;
/** Only the transport reports what customers wrote; every other actor may write `out` and `internal` rows. */
const INBOUND_ACTORS = new Set(['transport', 'wacli']);
const PROVIDER_ID = /^[\w.:@=+/-]{1,200}$/;

/**
 * POST: one row per message in or out. A replay (same provider message id) is a
 * harmless no-op. The caller picks from a short list of actors and may not use
 * the kinds this module writes itself; the status is always `recorded`.
 * Anything key-like in the text is masked before it is stored.
 */
export async function recordEvent(supabase: SupabaseClient, raw: unknown, opts: { transport?: boolean } = {}): Promise<Result> {
  if (!isObject(raw)) return bad('Ongeldige invoer');
  const direction = oneOf(raw.direction, DIRECTIONS);
  const channel = oneOf(raw.channel, CHANNELS);
  const actor = oneOf(raw.actor, EVENT_ACTORS);
  const kind = typeof raw.kind === 'string' && EVENT_KIND.test(raw.kind) && !RESERVED_KIND.test(raw.kind) ? raw.kind : null;
  if (!direction || !channel || !actor || !kind) return bad('Ongeldige gebeurtenis');
  // "in" (what a customer wrote) is accepted only on the path that checked the transport credential
  // (the inbound route), never because the body says actor = transport.
  if (direction === 'in' && (opts.transport !== true || !INBOUND_ACTORS.has(actor))) return bad('Alleen het transport meldt inkomende berichten', 403);
  if (raw.jobRoomId !== undefined && raw.jobRoomId !== null && !isUuid(raw.jobRoomId)) {
    return bad('Ongeldige klus');
  }
  if (raw.contactId !== undefined && raw.contactId !== null && !isUuid(raw.contactId)) {
    return bad('Ongeldig contact');
  }
  const providerId = raw.providerMessageId === undefined ? null : String(raw.providerMessageId);
  if (providerId !== null && !PROVIDER_ID.test(providerId)) return bad('Ongeldig bericht-id');
  // The room must exist, and a contact named on it must belong to that room.
  if (typeof raw.jobRoomId === 'string') {
    const room = await supabase.from('job_rooms').select('id, customer_contact_id').eq('id', raw.jobRoomId).maybeSingle();
    if (!room.data) return bad('Klus niet gevonden', 404);
    if (typeof raw.contactId === 'string' && !(await isParty(supabase, room.data, raw.contactId))) return bad('Contact hoort niet bij deze klus', 403);
  }
  const eventKey = clean(raw.eventKey, 150);

  const body = typeof raw.body === 'string' ? maskSecrets(raw.body.slice(0, 8000)) : null;
  const row = {
    job_room_id: (raw.jobRoomId as string | null | undefined) ?? null,
    contact_id: (raw.contactId as string | null | undefined) ?? null,
    direction,
    channel,
    actor,
    kind,
    provider_message_id: providerId,
    // Scoped per source, so one caller cannot block another's keys.
    event_key: eventKey ? `${actor}:${eventKey}` : null,
    body,
    meta: cleanMeta(raw.meta),
    status: 'recorded',
  };
  const ins = await supabase.from('job_events').insert(row).select('id').single();
  if (ins.error?.code === '23505') return ok({ duplicate: true });
  if (ins.error || !ins.data) return bad('Opslaan mislukt', 500);
  return ok({ eventId: ins.data.id, duplicate: false }, 201);
}

// ---------------------------------------------------------------------------
// Outbox (shadow) and approvals
// ---------------------------------------------------------------------------

/**
 * Tier 0 is sent without a person's approval, so the text is never the caller's:
 * each kind has one fixed text on the server, and a body that differs is refused.
 */
export const TIER0_TEMPLATES: Record<string, string> = Object.assign(Object.create(null) as Record<string, string>, {
  ack: 'Wij hebben uw bericht ontvangen. Een medewerker reageert zo snel mogelijk.',
  on_my_way: 'De monteur is onderweg naar u.',
  review_request: 'Bedankt voor uw vertrouwen in Autosleutel24. Wilt u ons een korte review geven? Wij sturen u daar zo meer over.',
  intake_q_plate: 'Wat is het kenteken van uw auto, of het merk, model en bouwjaar?',
  intake_q_location: 'Op welke locatie staat uw auto?',
  intake_q_keys: 'Bent u alle sleutels kwijt, of heeft u nog een reservesleutel?',
  intake_q_photo: 'Kunt u een foto van uw sleutel sturen, als u die nog heeft?',
});

/**
 * When a tier 0 text may go out without a person: the intake and acknowledgement texts only as a
 * reply (the customer wrote first); "on my way" and the review request only in the job states they belong to.
 */
const TIER0_RULES: Record<string, { reply?: true; states?: string[] }> = Object.assign(Object.create(null), {
  ack: { reply: true }, intake_q_plate: { reply: true }, intake_q_location: { reply: true }, intake_q_keys: { reply: true }, intake_q_photo: { reply: true },
  on_my_way: { states: ['awarded', 'scheduled'] },
  review_request: { states: ['done', 'invoiced', 'closed'] },
});
const GENERIC_KIND = /^[a-z][a-z0-9._-]{0,79}$/;

type OutboxInput = {
  jobRoomId: string; contactId: string; audience: Audience; kind: string; tier: number; body: string;
  attachment?: Row | null; allow?: Finding[];
};

/**
 * The one place an outbox row is written. Guards the text, binds the hash to
 * everything an approver sees, and dedupes. Shadow only: `proposed`,
 * shadow = true, never past `approved`. A refused text is logged as a blocked
 * event (reason only) instead of being stored.
 */
async function insertOutbox(supabase: SupabaseClient, p: OutboxInput): Promise<Result> {
  const refused = guardText(p.body, p.audience, p.allow ?? []);
  if (refused) {
    await supabase.from('job_events').insert({
      job_room_id: p.jobRoomId,
      contact_id: p.contactId,
      direction: 'internal',
      channel: 'system',
      actor: 'jobroom-guard',
      kind: 'outbox.blocked',
      status: 'blocked',
      meta: { reason: refused, audience: p.audience, kind: p.kind.split(':')[0] },
    });
    return bad('Bericht geblokkeerd', 422, { reason: refused });
  }
  if (p.attachment && Buffer.byteLength(JSON.stringify(p.attachment), 'utf8') > 2000) return bad('Bijlage te groot', 422);

  const key = dedupeKey(p.jobRoomId, p.contactId, p.kind, sha256(p.body), p.tier, p.audience);
  const textHash = outboxBindingHash({
    job_room_id: p.jobRoomId, contact_id: p.contactId, audience: p.audience, tier: p.tier, kind: p.kind, body: p.body, attachment: p.attachment,
  });
  const ins = await supabase
    .from('job_outbox')
    .insert({
      job_room_id: p.jobRoomId,
      contact_id: p.contactId,
      audience: p.audience,
      kind: p.kind,
      tier: p.tier,
      body: p.body,
      text_hash: textHash,
      dedupe_key: key,
      state: 'proposed',
      shadow: true,
      // Needs migration 0079; written only when there is something to attach.
      ...(p.attachment ? { attachment: p.attachment } : {}),
    })
    .select('id, state')
    .single();
  if (ins.error?.code === '23505') {
    const existing = await supabase.from('job_outbox').select('id, state, text_hash').eq('dedupe_key', key).maybeSingle();
    if (existing.data) {
      return ok({ outboxId: existing.data.id, state: existing.data.state, textHash: existing.data.text_hash, duplicate: true });
    }
  }
  if (ins.error || !ins.data) return bad('Opslaan mislukt', 500);
  return ok({ outboxId: ins.data.id, state: ins.data.state, textHash, duplicate: false, shadow: true }, 201);
}

/** The job's customer or a listed party, nobody else. */
async function isParty(supabase: SupabaseClient, room: Row, contactId: string): Promise<boolean> {
  if (room.customer_contact_id === contactId) return true;
  const party = await supabase.from('job_parties').select('id').eq('job_room_id', room.id).eq('contact_id', contactId).maybeSingle();
  return Boolean(party.data);
}

/**
 * POST: propose one message (the generic route). Everything that decides how
 * much a message may do is derived on the server, never taken from the caller:
 * the audience from the recipient (a customer who wrote first in this job in the
 * last 24 hours gets `customer_reply`, anyone else `self_started`; technicians
 * `technician`; `internal` only for a contact with an active approver row), the
 * recipient must belong to the job, invoice rules cannot be reached (no
 * attachment, no invoice kind) and tier 0 (no approval) only exists as a fixed
 * server-side template per kind.
 */
export async function proposeOutbox(supabase: SupabaseClient, raw: unknown): Promise<Result> {
  if (!isObject(raw)) return bad('Ongeldige invoer');
  if (!isUuid(raw.jobRoomId)) return bad('Ongeldige klus');
  if (!isUuid(raw.contactId)) return bad('Ongeldig contact');
  if (raw.attachment !== undefined && raw.attachment !== null) return bad('Bijlage niet toegestaan', 422);
  const kind = typeof raw.kind === 'string' && GENERIC_KIND.test(raw.kind) ? raw.kind : null;
  const tier = typeof raw.tier === 'number' && [0, 1, 2].includes(raw.tier) ? raw.tier : null;
  if (!kind || tier === null) return bad('Ongeldig bericht');
  if (/invoice|factuur/i.test(kind)) return bad('Gereserveerde soort', 422);

  let body: string | null;
  if (tier === 0) {
    // own keys only: 'constructor' and '__proto__' are kinds a caller can type, not templates
    if (!Object.hasOwn(TIER0_TEMPLATES, kind)) return bad('Tier 0 niet toegestaan voor deze soort', 422);
    const template = TIER0_TEMPLATES[kind];
    if (raw.body !== undefined && raw.body !== null && clean(raw.body, 4000) !== template) return bad('Tier 0 heeft een vaste tekst', 422);
    body = template;
  } else {
    body = clean(raw.body, 4000);
  }
  if (!body) return bad('Ongeldig bericht');

  const room = await supabase.from('job_rooms').select('id, customer_contact_id, state').eq('id', raw.jobRoomId).maybeSingle();
  if (room.error) return bad('Ophalen mislukt', 500);
  if (!room.data) return bad('Klus niet gevonden', 404);
  const contact = await supabase.from('contacts').select('id, role, active').eq('id', raw.contactId).maybeSingle();
  if (contact.error) return bad('Ophalen mislukt', 500);
  if (!contact.data || contact.data.active === false) return bad('Contact niet gevonden', 404);
  if (!(await isParty(supabase, room.data, raw.contactId))) return bad('Contact hoort niet bij deze klus', 403);

  const role = String(contact.data.role);
  let audience: Audience;
  if (role === 'customer') {
    const inbound = await supabase
      .from('job_events')
      .select('id, created_at')
      .eq('job_room_id', raw.jobRoomId)
      .eq('contact_id', raw.contactId)
      .eq('direction', 'in')
      .in('actor', ['transport', 'wacli'])
      .order('created_at', { ascending: false })
      .limit(20);
    const wroteFirst = (inbound.data ?? []).some((e: Row) => Date.now() - Date.parse(String(e.created_at)) < 24 * 3_600_000);
    audience = wroteFirst ? 'customer_reply' : 'self_started';
  } else if (role === 'technician' || role === 'garage') {
    audience = 'technician';
  } else {
    // staff and owner: `internal` only if they really are an active approver
    if (!(await approverRowFor(supabase, raw.contactId, role))) return bad('Geen intern contact', 403);
    audience = 'internal';
  }
  if (tier === 0) {
    const rule = TIER0_RULES[kind];
    if (role !== 'customer') return bad('Tier 0 is alleen voor klanten', 422);
    const stateOk = rule.states?.includes(String(room.data.state));
    if (!(rule.reply && audience === 'customer_reply') && !stateOk) return bad('Tier 0 niet toegestaan in deze situatie', 422);
  }

  return insertOutbox(supabase, { jobRoomId: raw.jobRoomId, contactId: raw.contactId, audience, kind, tier, body });
}

/** POST: add a person to a job (a technician who is offered it, an assistant). The role must fit the contact. */
export async function addParty(supabase: SupabaseClient, raw: unknown): Promise<Result> {
  if (!isObject(raw)) return bad('Ongeldige invoer');
  if (!isUuid(raw.jobRoomId)) return bad('Ongeldige klus');
  if (!isUuid(raw.contactId)) return bad('Ongeldig contact');
  const role = oneOf(raw.role, ['customer', 'technician', 'assistant', 'owner'] as const);
  if (!role) return bad('Ongeldige rol');
  const fits: Record<string, string[]> = {
    customer: ['customer'], technician: ['technician', 'garage'], assistant: ['staff'], owner: ['owner'],
  };
  const [room, contact] = await Promise.all([
    supabase.from('job_rooms').select('id').eq('id', raw.jobRoomId).maybeSingle(),
    supabase.from('contacts').select('id, role').eq('id', raw.contactId).maybeSingle(),
  ]);
  if (!room.data || !contact.data) return bad('Niet gevonden', 404);
  if (!fits[role].includes(String(contact.data.role))) return bad('Rol past niet bij het contact', 409);
  // Staff and owner unlock the internal audience: only people who really are approvers.
  if ((role === 'assistant' || role === 'owner') && !(await approverRowFor(supabase, raw.contactId, String(contact.data.role)))) {
    return bad('Geen goedkeurder', 403);
  }
  const ins = await supabase.from('job_parties').insert({ job_room_id: raw.jobRoomId, contact_id: raw.contactId, role });
  if (ins.error && ins.error.code !== '23505') return bad('Opslaan mislukt', 500);
  return ok({ added: !ins.error }, ins.error ? 200 : 201);
}

/** GET: the queue, newest first, so the transport (and the owner) can see what is waiting. */
export async function listOutbox(
  supabase: SupabaseClient,
  state: string | null,
  limit: number
): Promise<Result> {
  const wanted = state ? oneOf(state, ['proposed', 'approved', 'sent', 'unknown', 'failed', 'cancelled'] as const) : null;
  if (state && !wanted) return bad('Ongeldige status');
  let query = supabase
    .from('job_outbox')
    .select('id, job_room_id, contact_id, audience, kind, tier, state, shadow, text_hash, created_at')
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (wanted) query = query.eq('state', wanted);
  const { data, error } = await query;
  if (error) return bad('Ophalen mislukt', 500);
  return ok({ items: data ?? [] });
}

/** How long a proposed message stays approvable. Config, not a guess about the owner: override with JOBROOM_APPROVAL_TTL_HOURS. */
export const approvalTtlHours = () => Number(process.env.JOBROOM_APPROVAL_TTL_HOURS) || 24;
const WAITING_MINUTES = 15;

// --- Approval token -----------------------------------------------------------
//
// An approval is not a field in a JSON body. It is a short-lived token signed
// with JOBROOM_APPROVAL_SECRET, issued by the verified approval channel
// (tech-listen for the assistant, the owner's own channel for the owner). The
// proposing side (the transport, an assistant's process) holds only the ops
// token, so it cannot approve what it proposed. Who approves, how, what and
// which exact hash all travel inside the signature.

export type ApprovalClaim = {
  o: string; // outbox id
  h: string; // binding hash the approver was shown
  p: string; // approver's number, E.164, as seen by the verified channel
  v: 'owner_tap' | 'owner_voice' | 'assistant';
  d: 'approved' | 'rejected';
  i: number; // issued at, seconds
  e: number; // expires at, seconds
};

const MAX_TOKEN_SECONDS = 600;

export function signApproval(claim: ApprovalClaim, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claim), 'utf8').toString('base64url');
  const mac = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

export function verifyApproval(token: unknown, secret: string, nowSec: number): ApprovalClaim | null {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const [payload, mac, extra] = token.split('.');
  if (!payload || !mac || extra !== undefined) return null;
  // Exactly base64url: Node's decoder would silently ignore stray characters, so a padded or spaced token is not the token that was signed.
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(mac)) return null;
  const want = createHmac('sha256', secret).update(payload).digest();
  let got: Buffer;
  try { got = Buffer.from(mac, 'base64url'); } catch { return null; }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  let c: Row;
  try { c = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (!isObject(c)) return null;
  if (!isUuid(c.o) || typeof c.h !== 'string' || !/^[0-9a-f]{64}$/.test(c.h)) return null;
  if (typeof c.p !== 'string' || !/^\+[1-9][0-9]{7,14}$/.test(c.p)) return null;
  if (!oneOf(c.v, ['owner_tap', 'owner_voice', 'assistant'] as const)) return null;
  if (!oneOf(c.d, ['approved', 'rejected'] as const)) return null;
  if (typeof c.i !== 'number' || typeof c.e !== 'number') return null;
  if (c.e < nowSec || c.i > nowSec + 30 || c.e - c.i > MAX_TOKEN_SECONDS) return null;
  return c as unknown as ApprovalClaim;
}

type Approver = { role: string; audiences: string[]; max_tier: number; may_invoice: boolean; name: string; contactId: string };

/** The active approver row of this contact, and only if its role matches who the contact is. */
async function approverRowFor(supabase: SupabaseClient, contactId: string, contactRole: string): Promise<Row | null> {
  const row = await supabase
    .from('job_approvers')
    .select('role, audiences, max_tier, may_invoice, active')
    .eq('contact_id', contactId)
    .maybeSingle();
  if (!row.data || row.data.active === false) return null;
  const expected = row.data.role === 'owner' ? 'owner' : 'staff';
  return contactRole === expected ? row.data : null;
}

/** The sender's number → an active approver, or null. A stranger, technician or customer has no row. */
async function findApprover(supabase: SupabaseClient, phone: string): Promise<Approver | null> {
  const contact = await supabase
    .from('contacts')
    .select('id, display_name, active, role')
    .eq('phone_e164', phone)
    .maybeSingle();
  if (!contact.data || contact.data.active === false) return null;
  const row = await approverRowFor(supabase, String(contact.data.id), String(contact.data.role));
  if (!row) return null;
  return {
    role: String(row.role),
    audiences: (row.audiences as string[] | null) ?? [],
    max_tier: Number(row.max_tier) || 0,
    may_invoice: row.may_invoice === true,
    name: String(contact.data.display_name).slice(0, 80),
    contactId: String(contact.data.id),
  };
}

const isInvoiceRow = (o: { kind: string; body?: string; attachment?: unknown }) =>
  /invoice|factuur|rekening|iban/i.test(o.kind) ||
  /factuur|invoice|\biban\b|\bnl\d{2}\s?[a-z]{4}/i.test(o.body ?? '') ||
  (isObject(o.attachment) && o.attachment.type === 'invoice_pdf');

/** What this approver may release. An owner may release everything; an assistant only what was granted. */
function mayRelease(a: Approver, o: { audience: string; tier: number; kind: string; body?: string; attachment?: unknown }): string | null {
  if (a.role === 'owner') return null;
  if (isInvoiceRow(o) && !a.may_invoice) return 'invoice';
  if (o.tier > a.max_tier) return 'tier';
  if (!a.audiences.includes(o.audience)) return 'audience';
  return null;
}

/**
 * POST: a person releases (or refuses) one exact row. The body carries only the
 * signed token; the approver's number, channel, decision and hash are read from
 * the token, never from the JSON around it. Then: the number must belong to an
 * active approver with the right for this kind of message; the row must still
 * hash to what the approver was shown (text, recipient, audience, tier, kind
 * and attachment); and it must not be older than the approval window. The
 * approval row and the outbox change are one database transaction. In shadow
 * this only moves proposed → approved; nothing is sent. Refusals are logged by
 * reason, never with the number. Fails closed with no secret configured.
 */
export async function decideApproval(
  supabase: SupabaseClient,
  raw: unknown,
  secret: string | undefined = process.env.JOBROOM_APPROVAL_SECRET,
  nowSec: number = Math.floor(Date.now() / 1000)
): Promise<Result> {
  if (!secret || secret.length < 32) return bad('Niet beschikbaar', 503);
  if (!isObject(raw)) return bad('Ongeldige invoer');
  const claim = verifyApproval(raw.token, secret, nowSec);
  if (!claim) return bad('Ongeldig goedkeuringstoken', 403, { reason: 'bad_token' });
  if (raw.outboxId !== undefined && raw.outboxId !== claim.o) return bad('Token hoort niet bij dit bericht', 403, { reason: 'bad_token' });
  const { o: outboxId, h: seenHash, p: phone, v: via, d: decision } = claim;

  const found = await supabase
    .from('job_outbox')
    .select('id, job_room_id, contact_id, state, text_hash, audience, tier, kind, body, created_at')
    .eq('id', outboxId)
    .maybeSingle();
  if (found.error) return bad('Ophalen mislukt', 500);
  if (!found.data) return bad('Bericht niet gevonden', 404);
  // Written only after migration 0079; a missing column just means no attachment.
  const att = await supabase.from('job_outbox').select('attachment').eq('id', outboxId).maybeSingle();
  const attachment = att.error ? null : (att.data?.attachment ?? null);

  const refuse = async (reason: string, status: number, error: string) => {
    await supabase.from('job_events').insert({
      job_room_id: found.data!.job_room_id,
      direction: 'internal',
      channel: 'system',
      actor: 'jobroom-approval',
      kind: 'approval.refused',
      status: 'blocked',
      meta: { reason, outboxId: found.data!.id },
    });
    return bad(error, status, { reason });
  };

  const approver = await findApprover(supabase, phone);
  if (!approver) return refuse('not_approver', 403, 'Geen goedkeuringsrecht');
  // The channel must match the person: an assistant only through the assistant path, an owner never through it.
  if ((approver.role === 'assistant') !== (via === 'assistant')) return refuse('wrong_channel', 403, 'Verkeerd kanaal');
  const lacking = mayRelease(approver, { ...(found.data as { audience: string; tier: number; kind: string; body: string }), attachment });
  if (lacking) return refuse(`not_allowed_${lacking}`, 403, 'Geen recht voor dit bericht');

  if (found.data.state !== 'proposed') return bad('Bericht is al behandeld', 409, { state: found.data.state });
  const ageHours = (Date.now() - Date.parse(String(found.data.created_at))) / 3_600_000;
  if (ageHours > approvalTtlHours()) {
    await supabase.from('job_outbox').update({ state: 'cancelled', last_error: 'verlopen' }).eq('id', found.data.id).eq('state', 'proposed');
    return refuse('expired', 410, 'Bericht is verlopen');
  }
  // The row must still be what its hash says, and what the approver was shown.
  const now = outboxBindingHash({ ...(found.data as Row as Parameters<typeof outboxBindingHash>[0]), attachment });
  if (now !== found.data.text_hash) return refuse('row_changed', 409, 'Bericht is gewijzigd');
  if (seenHash !== found.data.text_hash) return refuse('hash_mismatch', 409, 'Tekst is gewijzigd');

  const done = await supabase.rpc('job_decide_approval', {
    p_outbox_id: found.data.id,
    p_decision: decision,
    p_text_hash: seenHash,
    p_decided_by: approver.contactId, // the person's id, not a display name that can change
    p_decided_via: via,
  });
  if (done.error) {
    const m = String(done.error.message);
    if (m.includes('already_decided') || m.includes('hash_changed')) return bad('Bericht is al behandeld', 409);
    if (m.includes('not_found')) return bad('Bericht niet gevonden', 404);
    return bad('Opslaan mislukt', 500);
  }
  const result = (Array.isArray(done.data) ? done.data[0] : done.data) as { code: number; new_state: string } | undefined;
  if (!result) return bad('Opslaan mislukt', 500);
  return ok({ approvalCode: `A${result.code}`, state: result.new_state, by: approver.role, shadow: true }, 201);
}

/**
 * GET: the owner's summary (09:00, 13:00, 18:00): what waits, and what has
 * waited more than 15 minutes. Counts and ages only, no message text.
 */
export async function approvalSummary(supabase: SupabaseClient, now: Date = new Date()): Promise<Result> {
  const { data, error } = await supabase
    .from('job_outbox')
    .select('id, job_room_id, audience, kind, tier, created_at')
    .eq('state', 'proposed')
    .limit(500);
  if (error) return bad('Ophalen mislukt', 500);
  const items = (data ?? []).map((o: Row) => ({
    id: o.id,
    jobRoomId: o.job_room_id,
    audience: o.audience,
    kind: String(o.kind).split(':')[0],
    tier: o.tier,
    waitingMinutes: Math.max(0, Math.round((now.getTime() - Date.parse(String(o.created_at))) / 60_000)),
  }));
  const late = items.filter((i) => i.waitingMinutes > WAITING_MINUTES).sort((a, b) => b.waitingMinutes - a.waitingMinutes);
  return ok({ waiting: items.length, waitingOver15: late.length, oldest: late.slice(0, 10) });
}

// ---------------------------------------------------------------------------
// S8: heartbeat and stop alarm
// ---------------------------------------------------------------------------

const SERVICE = /^[a-z][a-z0-9_-]{1,39}$/;
const ALERT_REPEAT_MINUTES = 60;

/** Services that must keep beating. Config: JOBROOM_HEARTBEAT_SERVICES, comma separated (default: transport). */
export const expectedServices = (): string[] =>
  (process.env.JOBROOM_HEARTBEAT_SERVICES ?? 'transport').split(',').map((x) => x.trim()).filter(Boolean);

/** Names a service may beat under: the expected ones and the office desks. Anything else is refused. */
const allowedServices = (): Set<string> => new Set([...expectedServices(), ...DESKS.map((d) => d.key)]);

/** POST: a service says it is alive. One upsert, so two beats at once cannot race into an error. Resets any earlier alert. */
export async function recordHeartbeat(supabase: SupabaseClient, raw: unknown): Promise<Result> {
  if (!isObject(raw)) return bad('Ongeldige invoer');
  const service = typeof raw.service === 'string' ? raw.service : '';
  if (!SERVICE.test(service) || !allowedServices().has(service)) return bad('Ongeldige dienst');
  const done = await supabase
    .from('job_heartbeats')
    .upsert({ service, beat_at: new Date().toISOString(), note: clean(raw.note, 200), alerted_at: null }, { onConflict: 'service' });
  if (done.error) return bad('Opslaan mislukt', 500);
  return ok({ service, ok: true });
}

/**
 * GET: which expected services have gone quiet. With `alert` on, and only when
 * alerts are switched on, the owner gets one Telegram line per stale service,
 * at most once an hour. The alarm text holds the service name and minutes,
 * nothing else. Not a job message: nothing here reaches a customer.
 */
export async function checkHeartbeats(
  supabase: SupabaseClient,
  opts: {
    expected: string[];
    alert: boolean;
    alertsOn: boolean;
    notify?: (text: string) => Promise<void>;
    now?: Date;
  }
): Promise<Result> {
  const now = opts.now ?? new Date();
  const rows = await supabase.from('job_heartbeats').select('service, beat_at, alerted_at');
  if (rows.error) return bad('Ophalen mislukt', 500);
  const beats = heartbeatStatus((rows.data ?? []) as never, opts.expected, now);

  const alerted: string[] = [];
  const failed: string[] = [];
  const canAlert = opts.alert && opts.alertsOn && !!opts.notify;
  for (const b of beats.filter((x) => x.stale)) {
    if (!canAlert) continue;
    // Claim first, atomically: of two overlapping checks only one gets true.
    const claim = await supabase.rpc('job_heartbeat_claim_alert', { p_service: b.service, p_minutes: ALERT_REPEAT_MINUTES });
    if (claim.error || claim.data !== true) continue;
    const since = b.ageMinutes === null ? 'nog nooit' : `al ${b.ageMinutes} minuten niet`;
    try {
      await opts.notify!(`Waarschuwing: ${b.service} heeft ${since} een teken van leven gegeven.`);
      alerted.push(b.service);
    } catch {
      failed.push(b.service);
    }
  }
  return ok({
    services: beats,
    stale: beats.filter((b) => b.stale).map((b) => b.service),
    alerted,
    failed,
    alertsOn: opts.alertsOn,
  });
}

// ---------------------------------------------------------------------------
// Owner approval token (off by default)
// ---------------------------------------------------------------------------

/**
 * Mints a short-lived approval token for the OWNER, from the owner's signed-in
 * CRM session (the route checks the session; this function checks the rest).
 * The server, not the caller, decides what is approved: it re-computes the hash
 * of the stored row, and the approver's number comes from the owner's approver
 * row. Off unless JOBROOM_MINT_ENABLED=on. Fails closed without a secret.
 * The assistant never reaches this: it has no CRM session, and its own tokens
 * come from the tech-listen process (see docs/jobroom-approval-secret.md).
 */
export async function mintOwnerApproval(
  supabase: SupabaseClient,
  raw: unknown,
  cfg: { enabled: boolean; secret: string | undefined; nowSec?: number }
): Promise<Result> {
  if (!cfg.enabled) return bad('Niet beschikbaar', 404);
  if (!cfg.secret || cfg.secret.length < 32) return bad('Niet beschikbaar', 503);
  if (!isObject(raw) || !isUuid(raw.outboxId)) return bad('Ongeldig bericht');
  const decision = oneOf(raw.decision, ['approved', 'rejected'] as const);
  if (!decision) return bad('Ongeldige beslissing');

  const row = await supabase
    .from('job_outbox')
    .select('id, job_room_id, contact_id, state, text_hash, audience, tier, kind, body')
    .eq('id', raw.outboxId)
    .maybeSingle();
  if (row.error) return bad('Ophalen mislukt', 500);
  if (!row.data) return bad('Bericht niet gevonden', 404);
  if (row.data.state !== 'proposed') return bad('Bericht is al behandeld', 409);
  const att = await supabase.from('job_outbox').select('attachment').eq('id', raw.outboxId).maybeSingle();
  const attachment = att.error ? null : (att.data?.attachment ?? null);
  const hash = outboxBindingHash({ ...(row.data as Row as Parameters<typeof outboxBindingHash>[0]), attachment });
  if (hash !== row.data.text_hash) return bad('Bericht is gewijzigd', 409);

  const approvers = await supabase.from('job_approvers').select('contact_id, role, active').eq('role', 'owner');
  const owner = (approvers.data ?? []).find((a: Row) => a.active !== false);
  if (!owner) return bad('Geen eigenaar als goedkeurder', 409);
  const contact = await supabase.from('contacts').select('phone_e164, role').eq('id', owner.contact_id).maybeSingle();
  if (!contact.data || contact.data.role !== 'owner') return bad('Geen eigenaar als goedkeurder', 409);

  const now = cfg.nowSec ?? Math.floor(Date.now() / 1000);
  const token = signApproval(
    { o: row.data.id as string, h: hash, p: String(contact.data.phone_e164), v: 'owner_tap', d: decision, i: now, e: now + 120 },
    cfg.secret
  );
  return ok({ token, expiresInSeconds: 120 });
}

// ---------------------------------------------------------------------------
// Route wrapper: the checkOps / logOps pattern every /api/ops route uses
// ---------------------------------------------------------------------------

/**
 * Auth first (fails closed), then the body or the query, then the handler, then
 * one audit row. The client is created after auth so an unauthenticated call
 * never touches the database or its keys. `input` is the parsed JSON body for a
 * POST and the URL for a GET.
 */
export async function runOps(
  request: Request,
  getClient: () => SupabaseClient,
  action: string,
  handler: (supabase: SupabaseClient, input: unknown, request: Request) => Promise<Result>
): Promise<Response> {
  const json = (r: Result) =>
    new Response(JSON.stringify(r.body), {
      status: r.status,
      headers: { 'content-type': 'application/json' },
    });

  const auth = checkOps(request);
  if (!auth.ok) return json(bad(auth.error, auth.status));

  let input: unknown;
  if (request.method === 'GET') {
    input = new URL(request.url);
  } else {
    input = await request.json().catch(() => null);
    if (input === null) return json(bad('Ongeldige invoer'));
  }

  const supabase = getClient();
  const result = await handler(supabase, input, request);
  // The action and the outcome, never the message text or the number.
  await logOps(supabase, action, { status: result.status });
  return json(result);
}

/**
 * The transport's own credential, separate from OPS_API_TOKEN, sent as `x-transport-token`.
 * Without JOBROOM_TRANSPORT_TOKEN (32+ characters) nothing counts as inbound (fails closed).
 */
export function transportOk(request: Request): boolean {
  const want = process.env.JOBROOM_TRANSPORT_TOKEN;
  const got = request.headers.get('x-transport-token') ?? '';
  if (!want || want.length < 32 || !got) return false;
  return timingSafeEqual(createHash('sha256').update(got).digest(), createHash('sha256').update(want).digest());
}

// ---------------------------------------------------------------------------
// S3: several names in one note, and every customer who writes
// ---------------------------------------------------------------------------

const NAME_SPLIT = /\s*(?:,|;|\/|&|\+|\n|\band\b|\ben\b|\bve\b|\bund\b)\s*/i;

/**
 * "Ali, Mehmet en Oğuz" → one lookup per name. Every name must resolve to
 * exactly one contact; otherwise `status` is 'ask' and `ask` lists what to put
 * to the owner (numbered choices with name, city and last 4 digits). Nothing
 * here guesses: a name with no exact alias is `none`, never the nearest match.
 */
export async function resolveNote(
  supabase: SupabaseClient,
  text: string | null,
  opts: { role?: string | null } = {}
): Promise<Result> {
  const note = clean(text, 400);
  if (!note) return bad('Naam ontbreekt');
  const names = [...new Set(note.split(NAME_SPLIT).map((n) => n.trim()).filter(Boolean))];
  if (names.length === 0 || names.length > 10) return bad('Ongeldig aantal namen');

  const results: Row[] = [];
  for (const name of names) {
    const r = await resolveContact(supabase, name, opts);
    if (r.status !== 200) return r;
    results.push({ input: name, status: r.body.status, contact: r.body.contact ?? null, candidates: r.body.candidates });
  }

  // Two different names that land on the same person are one recipient.
  const picked = new Set<string>();
  for (const r of results) {
    const id = (r.contact as Row | null)?.id as string | undefined;
    if (id && picked.has(id)) r.status = 'duplicate';
    if (id) picked.add(id);
  }
  const ask = results.filter((r) => r.status === 'none' || r.status === 'ambiguous');
  return ok({
    status: ask.length === 0 ? 'all' : 'ask',
    recipients: [...picked],
    results,
    ask: ask.map((r) => ({ input: r.input, status: r.status, candidates: r.candidates })),
  });
}

/**
 * POST: a message arrived from a number. The sender is saved as a contact at
 * once (a number already known keeps its role: a technician is never turned
 * into a customer), and the raw message is logged before anything reads it.
 */
export async function recordInbound(supabase: SupabaseClient, raw: unknown): Promise<Result> {
  if (!isObject(raw)) return bad('Ongeldige invoer');
  const phone = toE164NL(typeof raw.phone === 'string' ? raw.phone : null);
  if (!phone || !/^\+[1-9][0-9]{7,14}$/.test(phone)) return bad('Ongeldig telefoonnummer');
  const providerMessageId = clean(raw.providerMessageId, 200);
  if (!providerMessageId) return bad('Bericht-id ontbreekt');
  const channel = oneOf(raw.channel, CHANNELS) ?? 'whatsapp';
  const waName = clean(raw.waName, 120);
  if (raw.jobRoomId !== undefined && raw.jobRoomId !== null && !isUuid(raw.jobRoomId)) return bad('Ongeldige klus');

  const german = phone.startsWith('+49');
  const saved = await upsertContact(supabase, {
    phone,
    name: waName ?? `Klant ${phone.slice(-4)}`,
    role: 'customer',
    country: german ? 'DE' : 'NL',
    language: german ? 'de' : 'nl',
    waName,
    city: null,
  });
  if ('error' in saved) return bad('Opslaan mislukt', 500);

  const ev = await recordEvent(supabase, {
    direction: 'in',
    channel,
    actor: 'transport',
    kind: 'message',
    providerMessageId,
    contactId: saved.id,
    jobRoomId: raw.jobRoomId ?? null,
    body: typeof raw.body === 'string' ? raw.body : null,
  }, { transport: true });
  if (ev.status >= 500) return ev;
  return ok(
    { contactId: saved.id, created: saved.created, role: saved.role, duplicate: ev.body.duplicate === true },
    saved.created ? 201 : 200
  );
}

// ---------------------------------------------------------------------------
// S6: invoice send, CRM side (shadow)
// ---------------------------------------------------------------------------

const INVOICE_NUMBER = /^I-\d{5}$/;
const euro = (n: number) => n.toFixed(2).replace('.', ',');
/** Statuses an invoice may be sent in. Anything else (paid, written off, an unknown new one) is refused. */
const SENDABLE = ['concept', 'verzonden', 'overdue', 'partially_paid'];

type Snapshot = { invoiceNumber: string; status: string; total: number; jobId: string | null; hash: string };

/**
 * The invoice as it stands now, hashed: number, dates, client name and address,
 * totals, lines and the Moneybird id. Any later edit changes the hash.
 */
async function invoiceSnapshot(
  supabase: SupabaseClient,
  invoiceNumber: string,
  moneybirdId: string | null
): Promise<Snapshot | Result> {
  const inv = await supabase
    .from('sales_invoices')
    .select('id, invoice_number, status, issue_date, client_name, client_street, client_postcode, client_city, total, subtotal, vat_total, credit_applied, job_id')
    .eq('invoice_number', invoiceNumber)
    .maybeSingle();
  if (inv.error) return bad('Ophalen mislukt', 500);
  if (!inv.data) return bad('Factuur niet gevonden', 404);

  const lines = await supabase
    .from('sales_invoice_lines')
    .select('line_no, description, quantity, unit_price, discount, vat_rate')
    .eq('invoice_id', inv.data.id)
    .order('line_no', { ascending: true });
  if (lines.error) return bad('Ophalen mislukt', 500);

  const total = Number(inv.data.total) || 0;
  const d = inv.data;
  const hash = sha256(
    canonical([
      d.invoice_number, d.issue_date, d.client_name, d.client_street, d.client_postcode, d.client_city,
      total, Number(d.subtotal), Number(d.vat_total), Number(d.credit_applied), lines.data ?? [], moneybirdId,
    ])
  );
  return { invoiceNumber: d.invoice_number as string, status: String(d.status), total, jobId: (d.job_id as string | null) ?? null, hash };
}

const isSnapshot = (v: Snapshot | Result): v is Snapshot => 'hash' in v;

/**
 * The customer chose their own display name (it comes from WhatsApp), and the
 * invoice text is exempt from the payment rule, so the name must be a name:
 * letters, spaces, hyphen and apostrophe, at most 40 characters, and not
 * something that reads as a link, address or payment request.
 */
export function safeGreetingName(raw: string): string | null {
  if (guardText(raw, 'customer_reply') !== null) return null;
  const name = raw.normalize('NFKC').replace(/[^\p{L} '’-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40).trim();
  if (name.length < 2 || /^klant$/i.test(name)) return null;
  return guardText(name, 'customer_reply') === null ? name : null;
}

/**
 * POST: propose sending one invoice to the customer of a job room. It goes
 * through the outbox as a tier 2 row (a person approves it), never straight to
 * the customer, and only this function may set the invoice tier and attachment.
 * The text is fixed code, not model output. The invoice must belong to this
 * job, have lines and a total, and be in a sendable status; the recipient must
 * be the job's customer. Nothing is sent and Moneybird is not called.
 */
export async function proposeInvoice(supabase: SupabaseClient, raw: unknown): Promise<Result> {
  if (!isObject(raw)) return bad('Ongeldige invoer');
  if (!isUuid(raw.jobRoomId)) return bad('Ongeldige klus');
  const number = typeof raw.invoiceNumber === 'string' ? raw.invoiceNumber.trim() : '';
  if (!INVOICE_NUMBER.test(number)) return bad('Ongeldig factuurnummer');
  const mb = raw.moneybirdInvoiceId === undefined ? null : String(raw.moneybirdInvoiceId);
  if (mb !== null && !/^\d{6,20}$/.test(mb)) return bad('Ongeldig Moneybird-id');

  const room = await supabase
    .from('job_rooms')
    .select('id, job_id, customer_contact_id')
    .eq('id', raw.jobRoomId)
    .maybeSingle();
  if (room.error) return bad('Ophalen mislukt', 500);
  if (!room.data) return bad('Klus niet gevonden', 404);
  if (!room.data.customer_contact_id) return bad('Klus heeft geen klant', 409);

  const contact = await supabase
    .from('contacts')
    .select('id, display_name, role')
    .eq('id', room.data.customer_contact_id)
    .maybeSingle();
  if (contact.error) return bad('Ophalen mislukt', 500);
  if (!contact.data || contact.data.role !== 'customer') return bad('Ontvanger is geen klant', 409);

  const snap = await invoiceSnapshot(supabase, number, mb);
  if (!isSnapshot(snap)) return snap;
  if (!SENDABLE.includes(snap.status)) return bad('Factuur kan niet verstuurd worden', 409, { status: snap.status });
  if (!(snap.total > 0)) return bad('Factuur heeft geen bedrag', 409);
  if (!room.data.job_id || snap.jobId !== room.data.job_id) return bad('Factuur hoort niet bij deze klus', 409);

  const name = safeGreetingName(String(contact.data.display_name));
  const greeting = name ? `Beste ${name}` : 'Beste klant';
  const body = `${greeting}, hierbij de factuur ${snap.invoiceNumber} van Autosleutel24, totaal € ${euro(snap.total)}. Betalen kan binnen 14 dagen. Bedankt!`;

  return insertOutbox(supabase, {
    jobRoomId: room.data.id as string,
    contactId: contact.data.id as string,
    audience: 'self_started',
    kind: `invoice:${snap.invoiceNumber}:${snap.hash.slice(0, 12)}`,
    tier: 2,
    body,
    allow: ['payment'], // the fixed invoice text says "Betalen kan binnen 14 dagen"; it has no link and no bank number
    attachment: {
      type: 'invoice_pdf',
      invoiceNumber: snap.invoiceNumber,
      total: snap.total,
      snapshotHash: snap.hash,
      ...(mb ? { moneybirdInvoiceId: mb } : {}),
    },
  });
}

/**
 * GET: is the invoice behind this outbox row still the one that was approved,
 * and is the row still waiting to go out? The transport asks this right before
 * it attaches the invoice; `unchanged: false` means propose again and get a new
 * approval.
 */
export async function verifyInvoice(supabase: SupabaseClient, outboxId: string | null): Promise<Result> {
  if (!isUuid(outboxId)) return bad('Ongeldig bericht');
  const row = await supabase.from('job_outbox').select('id, state, attachment').eq('id', outboxId).maybeSingle();
  if (row.error) return bad('Ophalen mislukt', 500);
  const att = row.data?.attachment as Row | null | undefined;
  if (!row.data || !att || att.type !== 'invoice_pdf') return bad('Geen factuurbericht', 404);

  const snap = await invoiceSnapshot(supabase, String(att.invoiceNumber), (att.moneybirdInvoiceId as string | undefined) ?? null);
  if (!isSnapshot(snap)) return snap;
  const waiting = ['proposed', 'approved'].includes(String(row.data.state));
  const unchanged = waiting && snap.hash === att.snapshotHash && SENDABLE.includes(snap.status);
  return ok({ unchanged, state: row.data.state, invoiceNumber: snap.invoiceNumber, status: snap.status });
}
