import { requireOfficeUserApi, requireWarehouseUserApi, seesPrices } from '@/lib/crmSession';
import {
  amsterdamToUtc, APPOINTMENT_SOURCES, bookAppointment, cancelAppointment, cleanEmail, cleanPhone, cleanText, cleanYear,
  isDay, isTime, isUuid, listAppointments, moveAppointment, setAppointmentStatus, WorkshopUnavailable, type AppointmentSource,
} from '@/lib/workshopAgenda';

export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const unavailable = (error: unknown) => {
  console.error('[workshop appointments]', error);
  return json({ error: error instanceof WorkshopUnavailable ? 'Agenda niet beschikbaar' : 'Onbekende fout', code: 'service_error' }, 503);
};

/**
 * Workshop appointments for the CRM calendar.
 * GET: office and warehouse roles. The warehouse and picker see the schedule
 * (customer name, service, car, time) but not the phone, e-mail or notes.
 * POST (create) and PATCH (move, cancel, status): office roles only.
 */
export async function GET(request: Request) {
  const auth = await requireWarehouseUserApi();
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';
  const calendar = url.searchParams.get('calendar');
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to)) || Date.parse(to) <= Date.parse(from)
    || Date.parse(to) - Date.parse(from) > 62 * 86_400_000) {
    return json({ error: 'Ongeldige periode' }, 400);
  }
  if (calendar && !isUuid(calendar)) return json({ error: 'Ongeldige kalender' }, 400);
  try {
    const rows = await listAppointments(new Date(from).toISOString(), new Date(to).toISOString(), calendar);
    const office = seesPrices(auth.user);
    return json({
      appointments: office ? rows : rows.map((row) => ({ ...row, customer_phone: null, customer_email: null, notes: null })),
      canEdit: office,
    });
  } catch (error) {
    return unavailable(error);
  }
}

async function body(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;
  const input = await body(request);
  if (!input) return json({ error: 'Ongeldige aanvraag' }, 400);

  const customerName = cleanText(input.customer_name, 120);
  const customerPhone = cleanPhone(input.customer_phone);
  const customerEmail = cleanEmail(input.customer_email);
  const yearGiven = input.vehicle_year != null && input.vehicle_year !== '';
  const vehicleYear = yearGiven ? cleanYear(input.vehicle_year) : null;
  const source = (APPOINTMENT_SOURCES as readonly string[]).includes(String(input.source)) ? input.source as AppointmentSource : null;
  const errors: string[] = [];
  if (!isUuid(input.service_id)) errors.push('service_id');
  if (!isDay(input.date) || !isTime(input.time)) errors.push('start');
  if (input.calendar_id != null && input.calendar_id !== '' && !isUuid(input.calendar_id)) errors.push('calendar_id');
  if (!customerName) errors.push('customer_name');
  if (input.customer_phone && !customerPhone) errors.push('customer_phone');
  if (input.customer_email && !customerEmail) errors.push('customer_email');
  if (!customerPhone && !customerEmail) errors.push('contact');
  if (yearGiven && !vehicleYear) errors.push('vehicle_year');
  if (!source) errors.push('source');
  const idempotencyKey = typeof input.idempotency_key === 'string' && /^[A-Za-z0-9:_.-]{8,100}$/.test(input.idempotency_key) ? input.idempotency_key : null;
  if (errors.length) return json({ error: 'Controleer de velden', code: 'invalid', fields: errors }, 400);

  try {
    const outcome = await bookAppointment({
      serviceId: input.service_id as string,
      start: amsterdamToUtc(input.date as string, input.time as string),
      calendarId: (input.calendar_id as string) || null,
      source: source!, customerName: customerName!, customerPhone, customerEmail,
      vehicleMake: cleanText(input.vehicle_make, 40), vehicleModel: cleanText(input.vehicle_model, 60), vehicleYear,
      notes: cleanText(input.notes, 500), idempotencyKey, actor: auth.user.id,
    });
    if (outcome.result === 'booked' || outcome.result === 'duplicate') return json(outcome, outcome.result === 'booked' ? 201 : 200);
    return json({ error: outcome.result, code: outcome.result }, 409);
  } catch (error) {
    return unavailable(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;
  const input = await body(request);
  if (!input || !isUuid(input.id)) return json({ error: 'Ongeldige aanvraag' }, 400);
  const id = input.id as string;
  try {
    if (input.action === 'cancel') {
      const result = await cancelAppointment(id, auth.user.id);
      return result === 'not_found' ? json({ error: result, code: result }, 404) : json({ result });
    }
    if (input.action === 'move') {
      if (!isDay(input.date) || !isTime(input.time)) return json({ error: 'invalid', code: 'invalid', fields: ['start'] }, 400);
      if (input.calendar_id != null && input.calendar_id !== '' && !isUuid(input.calendar_id)) return json({ error: 'invalid', code: 'invalid' }, 400);
      const moved = await moveAppointment(id, amsterdamToUtc(input.date as string, input.time as string), (input.calendar_id as string) || null, auth.user.id);
      if (moved.result !== 'moved') return json({ error: moved.result, code: moved.result }, moved.result === 'not_found' ? 404 : 409);
      return json(moved);
    }
    if (input.action === 'status' && ['gepland', 'bevestigd', 'afgerond', 'no_show'].includes(String(input.status))) {
      const result = await setAppointmentStatus(id, input.status as 'gepland', auth.user.id);
      return result === 'not_found' ? json({ error: result, code: result }, 404) : json({ result });
    }
    return json({ error: 'Onbekende actie', code: 'invalid' }, 400);
  } catch (error) {
    return unavailable(error);
  }
}
