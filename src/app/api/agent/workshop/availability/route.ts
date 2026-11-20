import { checkWorkshopAgent } from '@/lib/agentAuth';
import {
  addDays, amsterdamToday, distinctStarts, freeSlots, getWorkshopSettings, isDay, json, matchService, nextAvailableDate,
  readBody, serviceError, serviceList, slotView,
} from '@/lib/workshopAgent';
import { isTime, amsterdamParts } from '@/lib/workshopAgenda';

export const dynamic = 'force-dynamic';

const MAX_SLOTS = 20;

/**
 * get_service_availability — ElevenLabs Workshop Service agent.
 *
 * Body: { service, date?, after? }. `date` defaults to today in Amsterdam.
 * Results: available | closed | full | past_date | unknown_service |
 * invalid_request | service_error. Past slots and slots that would run past
 * closing time are never listed (the database function decides both).
 * No customer data is returned.
 */
export async function POST(request: Request) {
  const auth = checkWorkshopAgent(request);
  if (!auth.ok) return json({ result: 'unauthorized', error: auth.error }, auth.status);

  const body = await readBody(request);
  if (!body) return json({ result: 'invalid_request', message: 'Send a JSON object.' }, 400);

  const today = amsterdamToday();
  const rawDate = typeof body.date === 'string' ? body.date.trim() : '';
  if (rawDate && !isDay(rawDate)) return json({ result: 'invalid_request', message: 'date must be YYYY-MM-DD.' }, 400);
  const date = rawDate || today;
  const after = typeof body.after === 'string' && isTime(body.after.trim()) ? body.after.trim() : null;

  try {
    const settings = await getWorkshopSettings();
    const service = matchService(settings.services, body.service);
    if (!service) return json({ result: 'unknown_service', services: serviceList(settings.services) });

    const base = {
      service: { code: service.code, name_nl: service.name_nl, name_en: service.name_en, duration_minutes: service.duration_minutes },
      date, timezone: 'Europe/Amsterdam',
    };
    // nextAvailableDate looks from the day after its argument, so yesterday finds today.
    if (date < today) return json({ ...base, result: 'past_date', next_available_date: await nextAvailableDate(service.id, addDays(today, -1)) });

    const { status, slots } = await freeSlots(service.id, date);
    if (status === 'closed') return json({ ...base, result: 'closed', next_available_date: await nextAvailableDate(service.id, date) });
    if (status === 'past') return json({ ...base, result: 'full', reason: 'no_time_left_today', next_available_date: await nextAvailableDate(service.id, date) });

    const starts = distinctStarts(slots).filter((slot) => !after || amsterdamParts(slot.starts_at).time >= after);
    if (!starts.length) return json({ ...base, result: 'full', next_available_date: await nextAvailableDate(service.id, date) });

    return json({
      ...base,
      result: 'available',
      slots: starts.slice(0, MAX_SLOTS).map((slot) => slotView(service, slot)),
      more_available: starts.length > MAX_SLOTS,
    });
  } catch (error) {
    console.error('[workshop availability]', error);
    return serviceError();
  }
}
