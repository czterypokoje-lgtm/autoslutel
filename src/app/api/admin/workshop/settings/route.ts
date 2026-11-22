import { requireOfficeUserApi, requireWarehouseUserApi } from '@/lib/crmSession';
import {
  addClosure, amsterdamToUtc, cleanText, deleteClosure, getWorkshopSettings, isDay, isTime, isUuid, saveCalendar, saveHours,
  saveService, WorkshopUnavailable, type WorkshopHours,
} from '@/lib/workshopAgenda';

export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET() {
  const auth = await requireWarehouseUserApi();
  if (auth.response) return auth.response;
  try {
    return json(await getWorkshopSettings());
  } catch (error) {
    console.error('[workshop settings]', error);
    return json({ error: 'Agenda niet beschikbaar', code: 'service_error' }, 503);
  }
}

/**
 * Office roles edit opening hours, service durations, calendar capacity and
 * closures/blocks. One `kind` per request.
 */
export async function PATCH(request: Request) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'Ongeldige aanvraag' }, 400);
  }
  try {
    switch (input?.kind) {
      case 'hours': {
        if (!Array.isArray(input.hours) || input.hours.length > 7) return json({ error: 'Ongeldige openingstijden' }, 400);
        await saveHours((input.hours as WorkshopHours[]).map((h) => ({
          weekday: Number(h.weekday), closed: !!h.closed, open_time: h.open_time ?? null, close_time: h.close_time ?? null,
        })));
        break;
      }
      case 'service':
        if (!isUuid(input.id)) return json({ error: 'Ongeldige dienst' }, 400);
        await saveService(input.id, {
          duration_minutes: input.duration_minutes === undefined ? undefined : Number(input.duration_minutes),
          active: input.active === undefined ? undefined : !!input.active,
        });
        break;
      case 'calendar':
        if (!isUuid(input.id)) return json({ error: 'Ongeldige kalender' }, 400);
        await saveCalendar(input.id, {
          capacity: input.capacity === undefined ? undefined : Number(input.capacity),
          active: input.active === undefined ? undefined : !!input.active,
        });
        break;
      case 'closure_add': {
        if (!isDay(input.start_date) || !isDay(input.end_date)) return json({ error: 'Ongeldige periode' }, 400);
        if (input.calendar_id != null && input.calendar_id !== '' && !isUuid(input.calendar_id)) return json({ error: 'Ongeldige kalender' }, 400);
        const startTime = isTime(input.start_time) ? input.start_time : '00:00';
        const endTime = isTime(input.end_time) ? input.end_time : null;
        // Without an end time the closure runs through the whole end date.
        const nextDay = new Date(Date.parse(`${input.end_date}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
        const end = endTime ? amsterdamToUtc(input.end_date, endTime) : amsterdamToUtc(nextDay, '00:00');
        await addClosure({
          calendarId: (input.calendar_id as string) || null, start: amsterdamToUtc(input.start_date, startTime), end,
          reason: cleanText(input.reason, 200), actor: auth.user.id,
        });
        break;
      }
      case 'closure_delete':
        if (!isUuid(input.id)) return json({ error: 'Ongeldige blokkade' }, 400);
        await deleteClosure(input.id);
        break;
      default:
        return json({ error: 'Onbekende instelling' }, 400);
    }
    return json(await getWorkshopSettings());
  } catch (error) {
    if (error instanceof RangeError) return json({ error: 'Ongeldige waarde', code: error.message }, 400);
    console.error('[workshop settings]', error);
    return json({ error: error instanceof WorkshopUnavailable ? 'Agenda niet beschikbaar' : 'Onbekende fout', code: 'service_error' }, 503);
  }
}
