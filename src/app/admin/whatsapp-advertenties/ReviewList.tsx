'use client';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Card, CardHead, Empty, Notice, ui } from '../_ui';
import styles from '../attributie/attributie.module.css';

export interface Review {
  id: string;
  ref: string;
  phone_end: string | null;
  chat_at: string | null;
  ai_result: string | null;
  car: string | null;
  price_note: string | null;
  decision: 'gedaan' | 'geen_job' | null;
  value: number | string | null;
  work_date: string | null;
  exported_at: string | null;
}

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
    <tr>
      <td>{review.ref}</td>
      <td>{review.chat_at?.slice(0, 10) ?? '-'}</td>
      <td>{review.phone_end ? `..${review.phone_end}` : '-'}</td>
      <td>{review.car ?? '-'}</td>
      <td>{review.price_note ?? '-'}</td>
      <td>{AI_LABEL[review.ai_result ?? ''] ?? '-'}</td>
      <td>
        {review.decision ? (
          <Badge tone={review.decision === 'gedaan' ? 'ok' : undefined}>
            {review.decision === 'gedaan' ? `Gedaan ${review.value ?? ''}` : 'Geen job'}
            {review.exported_at ? ' (geüpload)' : ''}
          </Badge>
        ) : (
          <div className={styles.bar}>
            <input className={ui.input} type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
            <input
              className={ui.input}
              inputMode="decimal"
              placeholder="Bedrag"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => decide('gedaan')}>
              Gedaan
            </button>
            <button className={ui.btn} disabled={busy} onClick={() => decide('geen_job')}>
              Geen job
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const ready = reviews.filter((r) => r.decision === 'gedaan' && !r.exported_at).length;

  async function markUploaded() {
    const res = await fetch('/api/admin/ad-reviews/export', { method: 'POST' });
    if (!res.ok) setError('Opslaan mislukt');
    router.refresh();
  }

  return (
    <>
      {error && <Notice>{error}</Notice>}
      <div className={styles.bar}>
        <button className={ui.btn} onClick={() => window.location.assign('/api/admin/ad-reviews/export')}>
          Download voor Google ({ready})
        </button>
        <button className={ui.btn} disabled={!ready} onClick={markUploaded}>
          Markeer als geüpload
        </button>
      </div>
      <Card>
        <CardHead>Gesprekken met advertentiecode</CardHead>
        {reviews.length === 0 ? (
          <Empty>Nog geen gesprekken.</Empty>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th><PreviewText>{"Datum"}</PreviewText></th>
                  <th>Tel.</th>
                  <th><PreviewText>{"Auto"}</PreviewText></th>
                  <th>Prijs in gesprek</th>
                  <th>Assistent</th>
                  <th>Besluit</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <Row key={review.id} review={review} onError={setError} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
