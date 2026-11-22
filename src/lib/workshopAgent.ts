import 'server-only';
import {
  amsterdamParts, amsterdamToday, cleanText, distinctStarts, freeSlots, getWorkshopSettings, isDay, makeSlotId,
  type FreeSlot, type WorkshopService,
} from '@/lib/workshopAgenda';

/*
 * Shapes shared by the two Workshop Service agent routes. Nothing here returns
 * customer data: availability is times only, booking echoes the reference and
 * the times it actually stored.
 */

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export const serviceError = () => json({ result: 'service_error', message: 'The workshop calendar is temporarily unavailable. Offer a callback instead.' }, 503);

export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

const norm = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();

/** Service by code, or by its Dutch or English name as the agent heard it. */
export function matchService(services: WorkshopService[], input: unknown): WorkshopService | null {
  const text = cleanText(input, 80);
  if (!text) return null;
  const wanted = norm(text);
  const active = services.filter((s) => s.active);
  return active.find((s) => s.code === text.toLowerCase())
    ?? active.find((s) => norm(s.code) === wanted || norm(s.name_nl) === wanted || norm(s.name_en) === wanted)
    ?? null;
}

export const serviceList = (services: WorkshopService[]) => services.filter((s) => s.active)
  .map((s) => ({ code: s.code, name_nl: s.name_nl, name_en: s.name_en, duration_minutes: s.duration_minutes }));

export const slotView = (service: WorkshopService, slot: FreeSlot) => ({
  slot_id: makeSlotId(service.code, slot.starts_at),
  start: slot.starts_at,
  end: slot.ends_at,
  start_local: amsterdamParts(slot.starts_at).time,
  end_local: amsterdamParts(slot.ends_at).time,
});

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** First day after `day` (up to 21 days ahead) with at least one free slot. */
export async function nextAvailableDate(serviceId: string, day: string): Promise<string | null> {
  for (let i = 1; i <= 21; i++) {
    const candidate = addDays(day, i);
    const { status, slots } = await freeSlots(serviceId, candidate);
    if (status === 'open' && slots.length) return candidate;
  }
  return null;
}

export { amsterdamToday, distinctStarts, freeSlots, getWorkshopSettings, isDay };
