/**
 * Who is waiting on us.
 *
 * Pure on purpose: this runs every few minutes, so it is plain rules rather than
 * a model reading the lead list, and it costs nothing when nothing is wrong. It
 * only proposes. Nothing here contacts anybody.
 */

export interface FollowupLead {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  phone_e164: string | null;
  brand: string | null;
  model: string | null;
  service: string | null;
  postcode: string | null;
  status: string;
  first_contact_at: string | null;
  retracted_at: string | null;
  consent_marketing: boolean | null;
}

export interface FollowupConversation {
  id: string;
  created_at: string;
  channel: string | null;
  phone: string | null;
  outcome: string | null;
  summary: string | null;
}

export type FollowupKind = 'onbeantwoord' | 'geen_afspraak' | 'gesprek_zonder_lead';

export interface Followup {
  kind: FollowupKind;
  /** 1 is the most urgent. */
  priority: 1 | 2 | 3;
  ageMinutes: number;
  leadId: string | null;
  conversationId: string | null;
  name: string | null;
  phone: string | null;
  what: string | null;
  consentMarketing: boolean;
}

export const FOLLOWUP_RULES = {
  /** A lead nobody answered, after this long, is a lead going cold. */
  unansweredAfterMinutes: 15,
  /** Contacted but never booked: chase after a day, give up after two weeks. Unanswered leads never expire. */
  noBookingAfterMinutes: 24 * 60,
  noBookingUntilMinutes: 14 * 24 * 60,
  /** An agent conversation with no lead or job behind it, within a week. */
  conversationWithinMinutes: 7 * 24 * 60,
} as const;

/** Same person, however the number was typed. */
const phoneKey = (phone: string | null | undefined): string | null => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : null;
};

const minutesSince = (iso: string, now: number) => Math.floor((now - Date.parse(iso)) / 60_000);

export function findFollowups(input: {
  leads: FollowupLead[];
  conversations: FollowupConversation[];
  /** Customer phones with a job, in any state. */
  jobPhones: Array<string | null>;
  now?: Date;
}): Followup[] {
  const now = (input.now ?? new Date()).getTime();
  const booked = new Set(input.jobPhones.map(phoneKey).filter(Boolean));
  const known = new Set(input.leads.map((l) => phoneKey(l.phone_e164 ?? l.phone)).filter(Boolean));
  const seen = new Set<string>();
  const out: Followup[] = [];

  /* Newest first, so one person with three enquiries appears once, as the latest. */
  const leads = [...input.leads].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  for (const lead of leads) {
    if (lead.retracted_at) continue;

    const key = phoneKey(lead.phone_e164 ?? lead.phone);
    if (key && (booked.has(key) || seen.has(key))) continue;

    const age = minutesSince(lead.created_at, now);
    const unanswered =
      lead.status === 'new' && !lead.first_contact_at && age >= FOLLOWUP_RULES.unansweredAfterMinutes;
    const noBooking =
      ['contacted', 'qualified'].includes(lead.status) &&
      age >= FOLLOWUP_RULES.noBookingAfterMinutes &&
      age <= FOLLOWUP_RULES.noBookingUntilMinutes;
    if (!unanswered && !noBooking) continue;

    if (key) seen.add(key);
    out.push({
      kind: unanswered ? 'onbeantwoord' : 'geen_afspraak',
      priority: unanswered ? 1 : 2,
      ageMinutes: age,
      leadId: lead.id,
      conversationId: null,
      name: lead.name?.trim() || null,
      phone: lead.phone_e164 ?? lead.phone,
      what: [lead.brand, lead.model, lead.service].filter(Boolean).join(' ') || null,
      consentMarketing: lead.consent_marketing === true,
    });
  }

  for (const talk of input.conversations) {
    const key = phoneKey(talk.phone);
    if (!key || booked.has(key) || known.has(key) || seen.has(key)) continue;

    const age = minutesSince(talk.created_at, now);
    if (age > FOLLOWUP_RULES.conversationWithinMinutes) continue;

    seen.add(key);
    out.push({
      kind: 'gesprek_zonder_lead',
      priority: 3,
      ageMinutes: age,
      leadId: null,
      conversationId: talk.id,
      name: null,
      phone: talk.phone,
      what: talk.summary?.slice(0, 200) ?? null,
      /* A conversation carries no recorded consent, so none is assumed. */
      consentMarketing: false,
    });
  }

  return out.sort((a, b) => a.priority - b.priority || a.ageMinutes - b.ageMinutes);
}
