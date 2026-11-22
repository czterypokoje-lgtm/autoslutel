import Link from 'next/link';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';

import type { PlanLead } from '../nieuw/PlanForm';
import type { PickerMake } from '../nieuw/CarPicker';
import StudioPlanForm from './plan-form';

/**
 * The chrome around "Klus inplannen" in the Studio look.
 *
 * nieuw/page.tsx still does the role check, the lead/order read, the warranty
 * check and the technician ranking; this only draws them. The two warnings are
 * the same sentences as the old screen, because both are things somebody has
 * to act on before a price is agreed.
 */
export default function StudioNewJob({
  lead,
  accounts,
  order,
  date,
  suggestions,
  initialSlot,
  initialTechnicianId,
  cars,
  recentWork,
  noTechnicians,
}: {
  accounts: React.ComponentProps<typeof StudioPlanForm>["accounts"];
  lead: PlanLead | null;
  order: { id: string; order_number: string; total_inc: number } | null;
  date: string;
  suggestions: React.ComponentProps<typeof StudioPlanForm>['suggestions'];
  initialSlot?: string;
  initialTechnicianId?: string;
  cars: PickerMake[];
  recentWork: { scheduled_date: string; service_type: string | null; dagen_geleden: number } | null;
  noTechnicians: boolean;
}) {
  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight">
            <PreviewText>{'Klus inplannen'}</PreviewText>
          </h1>
          <p className="text-muted-foreground text-sm">
            {order ? 'vanuit een webshopbestelling' : lead ? 'vanuit een lead' : 'handmatig'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/leads">Terug naar leads</Link>
        </Button>
      </div>

      {recentWork && (
        <p className="border-destructive/40 bg-destructive/10 rounded-lg border p-3 text-sm">
          <strong>{lead?.kenteken}</strong> is hier {recentWork.dagen_geleden} dagen geleden al geweest
          {recentWork.service_type ? ` voor ${recentWork.service_type}` : ''} ({recentWork.scheduled_date}).
          {recentWork.dagen_geleden <= 90
            ? ' Binnen drie maanden — controleer eerst of dit garantie is voordat er een prijs wordt afgesproken.'
            : ' Bekijk de vorige klus: welke chip is gebruikt en hoe lang het duurde.'}
        </p>
      )}

      {noTechnicians && (
        <p className="border-destructive/40 bg-destructive/10 rounded-lg border p-3 text-sm">
          Er zijn nog geen monteurs. Voeg ze eerst toe bij{' '}
          <Link className="underline" href="/admin/monteurs">
            <PreviewText>{'Monteurs'}</PreviewText>
          </Link>{' '}
          — zonder monteurs heeft de agenda geen kolommen en kan er niemand worden toegewezen.
        </p>
      )}

      <StudioPlanForm
        accounts={accounts}
        lead={lead}
        order={order}
        date={date}
        suggestions={suggestions}
        initialSlot={initialSlot}
        initialTechnicianId={initialTechnicianId}
        cars={cars}
      />
    </div>
  );
}
