'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export interface BidRow {
  id: string;
  technician: string;
  price: number | null;
  date: string | null;
  start: string | null;
  end: string | null;
}

export interface BidJob {
  jobId: string;
  label: string;
  askedFor: number | null;
  bids: BidRow[];
}

/**
 * One card per job, bids inside it — same award flow (POST
 * /api/admin/offers/:id/award) and no "cheapest" badge, as in AwardPanel.
 */
function AwardCard({ job }: { job: BidJob }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function award(id: string) {
    setBusy(id);
    setError('');
    const response = await fetch(`/api/admin/offers/${id}/award`, { method: 'POST' }).catch(() => null);
    if (!response?.ok) {
      setError((await response?.json().catch(() => null))?.error ?? 'Gunnen mislukt.');
      setBusy(null);
      return;
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>{job.label}</CardTitle>
        <CardDescription className="shrink-0 text-right">
          {job.askedFor ? `richtprijs ${MONEY.format(Number(job.askedFor))} · ` : ''}
          {job.bids.length} bod{job.bids.length === 1 ? '' : 'en'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        {error && <p className="px-4 pb-2 text-sm text-destructive">{error}</p>}
        {job.bids.map((bid) => (
          <div key={bid.id} className="flex items-center justify-between gap-4 border-t px-4 py-3">
            <div className="min-w-0">
              <div className="font-medium">{bid.technician}</div>
              <div className="text-sm text-muted-foreground">
                {bid.date ?? '—'}
                {bid.start ? ` · ${String(bid.start).slice(0, 5)}–${String(bid.end ?? '').slice(0, 5)}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold tabular-nums">{bid.price === null ? '—' : MONEY.format(Number(bid.price))}</span>
              <Button size="lg" className="h-10" onClick={() => award(bid.id)} disabled={busy !== null}>
                {busy === bid.id ? '…' : 'Gun deze'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function StudioBiedingen({ jobs }: { jobs: BidJob[] }) {
  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight">Biedingen</h1>
        <p className="text-muted-foreground text-sm">Monteurs noemen hun prijs en hun moment via Telegram. U gunt de klus.</p>
      </div>

      {jobs.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nog geen biedingen. Een monteur krijgt een aanbod in Telegram, kiest een dag en een tijd, en stuurt zijn bedrag — dat komt hier
          binnen.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <AwardCard key={job.jobId} job={job} />
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Gunnen zet de klus op naam van die monteur, neemt zijn tijdvak over en boekt zijn bedrag als loonkosten. De verkoopprijs aan de
        klant verandert niet. Dit sluit de andere biedingen. Iedereen die bood krijgt meteen bericht — ook wie hem niet kreeg, want anders
        houdt die zijn dag vrij voor werk dat niet komt.
      </p>
    </div>
  );
}
