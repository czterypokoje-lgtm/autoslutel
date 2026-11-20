import { checkWorkshopAgent } from '@/lib/agentAuth';
import { distinctStarts, freeSlots, getWorkshopSettings, json, matchService, readBody, serviceError, slotView } from '@/lib/workshopAgent';
import {
  amsterdamParts, bookAppointment, cleanEmail, cleanPhone, cleanText, cleanYear, parseSlotId, type AppointmentSource,
} from '@/lib/workshopAgenda';

export const dynamic = 'force-dynamic';

const SOURCES: Record<string, AppointmentSource> = { telefoon: 'telefoon', phone: 'telefoon', call: 'telefoon', whatsapp: 'whatsapp' };

/**
 * create_service_appointment — ElevenLabs Workshop Service agent.
 *
 * Call only after the customer has explicitly confirmed the time. The slot is
 * re-validated in the database under a lock (kfc_workshop_book), so a slot
 * taken in the meantime returns `conflict`, never a second booking. The same
 * idempotency_key sent again returns `already_booked` with the original
 * reference instead of creating another appointment.
 */
export async function POST(request: Request) {
  const auth = checkWorkshopAgent(request);
  if (!auth.ok) return json({ result: 'unauthorized', error: auth.error }, auth.status);

  const body = await readBody(request);
  if (!body) return json({ result: 'invalid_request', message: 'Send a JSON object.' }, 400);

  const slot = parseSlotId(body.slot_id);
  const customerName = cleanText(body.customer_name, 120);
  const customerPhone = cleanPhone(body.customer_phone);
  const customerEmail = cleanEmail(body.customer_email);
  const vehicleMake = cleanText(body.vehicle_make, 40);
  const vehicleModel = cleanText(body.vehicle_model, 60);
  const yearGiven = body.vehicle_year != null && body.vehicle_year !== '';
  const vehicleYear = yearGiven ? cleanYear(body.vehicle_year) : null;
  const source = SOURCES[String(body.source ?? '').toLowerCase().trim()];
  const idempotencyKey = typeof body.idempotency_key === 'string' && /^[A-Za-z0-9:_.-]{8,100}$/.test(body.idempotency_key.trim())
    ? body.idempotency_key.trim() : null;

  const missing = [
    !slot && 'slot_id', !body.service && 'service', !customerName && 'customer_name',
    !customerPhone && !customerEmail && 'customer_phone', !vehicleMake && 'vehicle_make', !vehicleModel && 'vehicle_model',
    yearGiven && !vehicleYear && 'vehicle_year', !source && 'source', !idempotencyKey && 'idempotency_key',
  ].filter(Boolean);
  if (missing.length || !slot || !customerName || !source) return json({ result: 'invalid_request', missing }, 400);

  try {
    const settings = await getWorkshopSettings();
    const service = matchService(settings.services, body.service);
    if (!service) return json({ result: 'invalid_request', missing: ['service'], message: 'Unknown service.' }, 400);
    if (service.code !== slot.serviceCode) {
      return json({ result: 'invalid_request', message: 'slot_id belongs to a different service. Check availability again.' }, 400);
    }

    const outcome = await bookAppointment({
      serviceId: service.id, start: slot.start, calendarId: null, source,
      customerName, customerPhone, customerEmail, vehicleMake, vehicleModel, vehicleYear,
      notes: cleanText(body.notes, 500), idempotencyKey, actor: null,
    });

    const times = (start: string, end: string) => ({
      date: amsterdamParts(start).day, start, end,
      start_local: amsterdamParts(start).time, end_local: amsterdamParts(end).time, timezone: 'Europe/Amsterdam',
    });

    if (outcome.result === 'booked') {
      return json({ result: 'booked', reference: outcome.reference, service: service.code, ...times(outcome.starts_at!, outcome.ends_at!) }, 201);
    }
    if (outcome.result === 'duplicate') {
      return json({ result: 'already_booked', reference: outcome.reference, service: service.code, ...times(outcome.starts_at!, outcome.ends_at!) });
    }
    if (outcome.result === 'idempotency_mismatch') {
      return json({ result: 'idempotency_conflict', message: 'This idempotency_key was already used for a different slot. Use a new key for a new booking.' }, 409);
    }

    // No longer bookable: offer what is still free that day.
    const { slots } = await freeSlots(service.id, amsterdamParts(slot.start).day);
    const alternatives = distinctStarts(slots).slice(0, 5).map((s) => slotView(service, s));
    const reason = outcome.result === 'full' ? 'slot_taken' : outcome.result;
    return json({ result: 'conflict', reason, alternatives }, 409);
  } catch (error) {
    console.error('[workshop booking]', error);
    return serviceError();
  }
}
