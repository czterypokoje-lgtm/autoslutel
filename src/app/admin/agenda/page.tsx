import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { amsterdamToday } from '@/lib/amsterdamTime';
import { getWorkshopSettings, type WorkshopSettings } from '@/lib/workshopAgenda';
import WorkshopCalendar from './WorkshopCalendar';

export const dynamic = 'force-dynamic';

/*
 * Werkplaatsagenda. Office roles plan, move and cancel; the warehouse and
 * picker see the schedule read-only and without customer contact details.
 */
export default async function AgendaPage() {
  const user = await requireWarehouseUser('/admin/agenda');
  let settings: WorkshopSettings | null = null;
  try {
    settings = await getWorkshopSettings();
  } catch (error) {
    console.error('[agenda]', error);
  }
  return <WorkshopCalendar initialSettings={settings} canEdit={seesPrices(user)} today={amsterdamToday()} />;
}
