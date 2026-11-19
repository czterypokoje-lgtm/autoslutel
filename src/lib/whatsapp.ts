/**
 * WhatsApp links from the CRM — browser-safe, imported by client components
 * (VanScreen, LeadsTable, MonteursPanel) as well as server code. Deliberately
 * has no dependency on the Twilio SDK: that lives in `whatsappSend.ts`
 * instead, guarded with `server-only`, so it can never end up bundled into a
 * page a phone downloads (Twilio's Node SDK pulls in things like `net`, which
 * do not exist in a browser and broke the build the first time this was
 * tried in this same file).
 */

import { guardText } from './jobRoomGuard.ts';

/**
 * "06 11 75 12 31" -> "31611751231".
 *
 * wa.me wants digits only, with the country code and no plus. A Dutch mobile
 * written the way everyone writes it starts with a 0 that has to go, or the
 * link opens a chat with a number that does not exist.
 */
export function waNumber(phone: string | null | undefined): string | null {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('31')) return digits;
  if (digits.startsWith('0')) return `31${digits.slice(1)}`;
  // Already international, or a number we cannot read — hand it over as it is
  // rather than guessing a country onto it.
  return digits;
}

/** A wa.me link with the message pre-written, or null without a usable number. */
export function waLink(phone: string | null | undefined, message: string): string | null {
  const number = waNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

interface JobBriefing {
  scheduled_date?: string | null;
  slot_start?: string | null;
  slot_end?: string | null;
  street?: string | null;
  postcode?: string | null;
  city?: string | null;
  kenteken?: string | null;
  service_type?: string | null;
  quoted_price?: number | string | null;
  notes?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
}

const time = (value: string | null | undefined) => (value ? String(value).slice(0, 5) : null);

/**
 * The message a technician needs to do the job, in the order they need it:
 * when, where, which car, what work, who to ring.
 *
 * `stage` 'offer' (default) is everything sent before an award: no customer
 * phone. 'assigned' is for a job the office already gave to one technician.
 *
 * No price unless one was quoted — a technician quoting a figure the office
 * never agreed is worse than one who has to ask.
 */
export function jobBriefing(job: JobBriefing, stage: 'offer' | 'assigned' = 'offer'): string {
  // Before the award the technician never gets the customer's number (never-rule),
  // and free text a customer typed (name, street, notes) is dropped if it holds a
  // phone number, email, plate or key: it could be used to pass contact details.
  const customerPhone = stage === 'assigned' ? job.customer_phone : null;
  const safe = (text: string | null | undefined) =>
    stage === 'assigned' || !text || guardText(text, 'technician') === null ? text : null;
  job = { ...job, street: safe(job.street), notes: safe(job.notes), customer_name: safe(job.customer_name) };
  const when = [job.scheduled_date, [time(job.slot_start), time(job.slot_end)].filter(Boolean).join('–')]
    .filter(Boolean)
    .join(' ');

  const address = [job.street, [job.postcode, job.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');

  return [
    'Klus van Autosleutel24',
    when ? `Wanneer: ${when}` : null,
    address ? `Waar: ${address}` : null,
    job.kenteken ? `Kenteken: ${job.kenteken.toUpperCase()}` : null,
    job.service_type ? `Werk: ${job.service_type}` : null,
    job.customer_name || customerPhone
      ? `Klant: ${[job.customer_name, customerPhone].filter(Boolean).join(' — ')}`
      : null,
    job.quoted_price ? `Afgesproken prijs: € ${Number(job.quoted_price).toFixed(2)}` : null,
    job.notes ? `Let op: ${job.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/** "Ik ben onderweg" — sent by the technician, from their own number. */
export function onTheWayMessage(customerName?: string | null, service?: string | null): string {
  return `Goedendag${customerName ? ` ${customerName}` : ''}, ik ben onderweg naar u voor ${
    service ?? 'de afspraak'
  }. Tot zo — Autosleutel24.`;
}
