import Link from 'next/link';
import { Check } from 'lucide-react';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBrandLogo } from '@/lib/brandLogos';
import { SCENARIO_INFO, isScenario } from '@/lib/scenarios';
import { TIER_TERMS, type Tier } from '@/lib/subscription';

import type { JobDetail } from '../[id]/JobEditor';
import type { OfferRow } from '../[id]/OfferHistory';
import DeleteJobButton from '../[id]/DeleteJobButton';
import OfferButton from '../[id]/OfferButton';
import PaymentPanel, { type PaymentRow } from '../[id]/PaymentPanel';
import StudioAdClickPanel from './ad-click-panel';
import StudioJobEditor from './job-editor';

/**
 * One job, Studio look.
 *
 * [id]/page.tsx still does the role check and every read; this draws them.
 * Every action is the component that already owned it — the payment panel, the
 * offer button and the delete button are shared with the old look, so there is
 * one implementation of each fetch, not two.
 */

const SOURCE_LABEL: Record<string, string> = {
  autosleutel24: 'Kantoor',
  agent: 'Voice agent',
  eigen: 'Eigen klant monteur',
  partner: 'Partner',
};

const STEPS = ['gepland', 'onderweg', 'bezig', 'afgerond'] as const;
const STEP_LABEL: Record<string, string> = { gepland: 'Gepland', onderweg: 'Onderweg', bezig: 'Bezig', afgerond: 'Afgerond' };

export default function StudioJobDetail({
  job,
  crew,
  payments,
  offers,
  briefingLink,
  openOffers,
}: {
  job: JobDetail & { job_source: string | null; lead_id: string | null };
  crew: { id: string; name: string; phone: string | null; active: boolean }[];
  payments: PaymentRow[];
  offers: OfferRow[];
  briefingLink: string | null;
  /** Offers still waiting for an answer, for the offer button's own warning. */
  openOffers: number;
}) {
  const assigned = crew.find((t) => t.id === job.technician_id);
  const car = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ');
  const logo = getBrandLogo(job.car_make);
  const work = isScenario(job.scenario) ? SCENARIO_INFO[job.scenario].label : job.service_type;
  const when = new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${job.scheduled_date}T12:00:00Z`));
  const stepAt = STEPS.indexOf(job.status as (typeof STEPS)[number]);

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-lg" aria-hidden="true">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="max-h-7 w-auto" />
            ) : (
              <span className="text-muted-foreground text-xs font-semibold">
                {String(job.car_make ?? '?').slice(0, 3).toUpperCase()}
              </span>
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-3xl leading-none font-medium tracking-tight">{car || 'Klus'}</h1>
            <p className="text-muted-foreground text-sm">
              <span className="first-letter:uppercase">{when}</span> · {String(job.slot_start).slice(0, 5)}
              {job.slot_end && <>–{String(job.slot_end).slice(0, 5)}</>}
              {work && <> · {work}</>}
              {job.kenteken && <> · {job.kenteken}</>}
              {assigned && <> · {assigned.name}</>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {job.job_source && (
            <Badge variant={job.job_source === 'agent' ? 'default' : 'outline'}>
              {SOURCE_LABEL[job.job_source] ?? job.job_source}
            </Badge>
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/jobs?datum=${job.scheduled_date}`}>Terug naar agenda</Link>
          </Button>
          {job.lead_id && (
            <Button variant="outline" asChild>
              <Link href={`/admin/leads?q=${job.kenteken ?? ''}`}>Bekijk lead</Link>
            </Button>
          )}
          {/*
            The briefing a technician needs, already written: when, where,
            which car, what work, who to ring. A link, not an integration —
            it opens WhatsApp and a person presses send.
          */}
          {briefingLink && (
            <Button variant="outline" asChild>
              <a href={briefingLink} target="_blank" rel="noopener noreferrer">
                Appen naar {assigned?.name ?? 'monteur'}
              </a>
            </Button>
          )}
          <DeleteJobButton jobId={job.id} />
        </div>
      </div>

      {job.status === 'geannuleerd' ? (
        <p className="border-destructive/40 bg-destructive/10 rounded-lg border p-3 text-sm">
          Deze klus is geannuleerd.
        </p>
      ) : (
        <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Status">
          {STEPS.map((st, i) => {
            const done = i < stepAt;
            const now = i === stepAt;
            return (
              <li
                key={st}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                  now ? 'border-primary bg-muted font-medium' : done ? 'text-muted-foreground' : 'text-muted-foreground opacity-60'
                }`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded-full text-[10px] ${
                    done || now ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {done ? <Check className="size-2.5" /> : i + 1}
                </span>
                {STEP_LABEL[st]}
              </li>
            );
          })}
        </ol>
      )}

      <PaymentPanel
        jobId={job.id}
        due={Number(job.final_price ?? job.quoted_price) || 0}
        payments={payments}
      />

      <StudioJobEditor job={job} technicians={crew.filter((t) => t.active)} />

      {/* Renders itself away unless this job has no attribution and an
          unclaimed click landed near its date. */}
      <StudioAdClickPanel jobId={job.id} />

      {/*
        Offering is only on the table while the job is still to be done — a
        finished job sent out to bid is how a monteur drives to work that
        someone else already did.
      */}
      {job.status !== 'afgerond' && job.status !== 'geannuleerd' && (
        <div>
          <OfferButton jobId={job.id} alreadyOpen={openOffers} />
        </div>
      )}

      <StudioOfferHistory offers={offers} />
    </div>
  );
}

const RESPONSE_LABEL: Record<string, string> = {
  accepted: 'Geaccepteerd',
  declined: 'Afgewezen',
  expired: 'Verlopen',
};

const RESPONSE_VARIANT: Record<string, 'default' | 'outline' | 'destructive'> = {
  accepted: 'default',
  declined: 'destructive',
  expired: 'outline',
};

function time(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Who this job went to, in order, and what happened when it reached them.
 *
 * Offered, never assigned — so the interesting fact per row is not just "did
 * they take it" but at what rank and tier they saw it, and how long it sat
 * with them before they answered.
 */
function StudioOfferHistory({ offers }: { offers: OfferRow[] }) {
  if (!offers.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <PreviewText>{'Aanbod'}</PreviewText>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Deze klus is nog aan niemand aangeboden.
        </CardContent>
      </Card>
    );
  }

  const sorted = [...offers].sort((a, b) => a.rank - b.rank);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Aanbod · {sorted.length} monteur{sorted.length === 1 ? '' : 'en'}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>
                <PreviewText>{'Monteur'}</PreviewText>
              </TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Aangeboden</TableHead>
              <TableHead>Reactie</TableHead>
              <TableHead>Toelichting</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>{offer.rank}</TableCell>
                <TableCell>{offer.technician_name}</TableCell>
                <TableCell>{TIER_TERMS[offer.tier_at_offer as Tier]?.label ?? offer.tier_at_offer}</TableCell>
                <TableCell>{offer.score === null ? '—' : offer.score.toFixed(1)}</TableCell>
                <TableCell>
                  {time(offer.offered_at)}
                  {offer.responded_at && offer.responded_at !== offer.offered_at && (
                    <> → {time(offer.responded_at)}</>
                  )}
                </TableCell>
                <TableCell>
                  {offer.response ? (
                    <Badge variant={RESPONSE_VARIANT[offer.response]}>{RESPONSE_LABEL[offer.response]}</Badge>
                  ) : (
                    <Badge variant="outline">Wacht op reactie</Badge>
                  )}
                </TableCell>
                <TableCell>{offer.decline_note || offer.reason || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
