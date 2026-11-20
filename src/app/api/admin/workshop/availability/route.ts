import { requireWarehouseUserApi } from '@/lib/crmSession';
import { freeSlots, isDay, isUuid, WorkshopUnavailable } from '@/lib/workshopAgenda';

export const dynamic = 'force-dynamic';

/** Free start times for the CRM form: the same database function the agent uses. */
export async function GET(request: Request) {
  const auth = await requireWarehouseUserApi();
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const service = url.searchParams.get('service');
  const date = url.searchParams.get('date');
  const calendar = url.searchParams.get('calendar');
  if (!isUuid(service) || !isDay(date) || (calendar && !isUuid(calendar))) {
    return Response.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }
  try {
    const result = await freeSlots(service, date, calendar || null);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[workshop availability]', error);
    return Response.json({ error: error instanceof WorkshopUnavailable ? 'Agenda niet beschikbaar' : 'Onbekende fout', code: 'service_error' }, { status: 503 });
  }
}
