'use client';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Review } from './ReviewList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AI_LABEL: Record<string, string> = {
  gedaan: 'Lijkt gedaan',
  gepland: 'Afspraak',
  geen_job: 'Lijkt geen job',
  onduidelijk: 'Onduidelijk',
};

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

function Row({ review, onError }: { review: Review; onError: (message: string) => void }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [workDate, setWorkDate] = useState(today());
  const [busy, setBusy] = useState(false);

  async function decide(decision: 'gedaan' | 'geen_job') {
    setBusy(true);
    const res = await fetch(`/api/admin/ad-reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision, value, workDate }),
    });
    setBusy(false);
    if (!res.ok) {
      onError((await res.json().catch(() => null))?.error ?? 'Opslaan mislukt');
      return;
    }
    router.refresh();
  }

  return (
    <TableRow>
      <TableCell>{review.ref}</TableCell>
      <TableCell>{review.chat_at?.slice(0, 10) ?? '-'}</TableCell>
      <TableCell>{review.phone_end ? `..${review.phone_end}` : '-'}</TableCell>
      <TableCell>{review.car ?? '-'}</TableCell>
      <TableCell>{review.price_note ?? '-'}</TableCell>
      <TableCell>{AI_LABEL[review.ai_result ?? ''] ?? '-'}</TableCell>
      <TableCell>
        {review.decision ? (
          <Badge
            variant="outline"
            className={
              review.decision === 'gedaan'
                ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300'
                : undefined
            }
          >
            {review.decision === 'gedaan' ? `Gedaan ${review.value ?? ''}` : <PreviewText>Geen job</PreviewText>}
            {review.exported_at ? ' (geüpload)' : ''}
          </Badge>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} className="w-36" />
            <Input inputMode="decimal" placeholder="Bedrag" value={value} onChange={(e) => setValue(e.target.value)} className="w-28" />
            <Button size="sm" disabled={busy} onClick={() => decide('gedaan')}>
              <PreviewText>Gedaan</PreviewText>
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => decide('geen_job')}>
              <PreviewText>Geen job</PreviewText>
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

/** Studio restyle of ReviewList: same decide()/markUploaded() calls, onto shadcn Card/Table/Button. */
export default function StudioReviewList({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const ready = reviews.filter((r) => r.decision === 'gedaan' && !r.exported_at).length;

  async function markUploaded() {
    const res = await fetch('/api/admin/ad-reviews/export', { method: 'POST' });
    if (!res.ok) setError('Opslaan mislukt');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.location.assign('/api/admin/ad-reviews/export')}>
          <PreviewText>{`Download voor Google (${ready})`}</PreviewText>
        </Button>
        <Button variant="outline" disabled={!ready} onClick={markUploaded}>
          <PreviewText>Markeer als geüpload</PreviewText>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle><PreviewText>Gesprekken met advertentiecode</PreviewText></CardTitle>
        </CardHeader>
        <CardContent className={reviews.length ? 'overflow-x-auto' : undefined}>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm"><PreviewText>Nog geen gesprekken.</PreviewText></p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead><PreviewText>Datum</PreviewText></TableHead>
                  <TableHead>Tel.</TableHead>
                  <TableHead><PreviewText>Auto</PreviewText></TableHead>
                  <TableHead>Prijs in gesprek</TableHead>
                  <TableHead>Assistent</TableHead>
                  <TableHead>Besluit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <Row key={review.id} review={review} onError={setError} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
