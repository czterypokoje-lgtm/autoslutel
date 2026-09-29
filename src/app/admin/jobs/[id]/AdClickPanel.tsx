'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MousePointerClick } from 'lucide-react';
import { ui } from '../../_ui';

/**
 * Which ad click paid for this phone-in.
 *
 * Nothing in the database knows. The automatic claim looks back 45 minutes
 * from the moment the job is typed in, and across every click ever captured
 * the nearest job was 30 to 63 hours later — so it has never once fired, and
 * fourteen clicks with a gclid sit unspent.
 *
 * Widening the window is the obvious fix and the wrong one: over three days
 * "the nearest unclaimed click" is a guess between a dozen candidates, and a
 * wrong gclid sent to Google teaches Smart Bidding to buy the wrong traffic.
 * This account has already been there — ten conversions retracted against one
 * kept. So the list is offered and the office, who took the call, decides.
 */

interface Click {
  id: string;
  created_at: string;
  source_url: string | null;
  network: string;
  hoursFromJob: number;
}

const WHEN = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  timeZone: 'Europe/Amsterdam',
});

export default function AdClickPanel({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [clicks, setClicks] = useState<Click[]>([]);
  const [attributed, setAttributed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/jobs/${jobId}/call-clicks`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        setAttributed(Boolean(json.attributed));
        setClicks(json.clicks ?? []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [jobId]);

  /* Nothing to decide: either it is already attributed, or no unclaimed click
     landed anywhere near this job. Showing an empty panel on every job would
     make the one that matters harder to notice. */
  if (attributed === null || attributed || clicks.length === 0) return null;

  async function claim(clickId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/call-clicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ click_id: clickId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Koppelen mislukt');
      router.refresh();
      setClicks([]);
      setAttributed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Koppelen mislukt');
    } finally {
      setBusy(false);
    }
  }

  const ago = (hours: number) =>
    hours === 0 ? 'zelfde moment'
      : hours < 0 ? `${Math.abs(hours)} uur vóór de klus`
      : `${hours} uur ná de klus`;

  return (
    <section className={ui.card} style={{ padding: '1.25rem', marginTop: '1rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '0.35rem' }}>
        <MousePointerClick size={16} /> Kwam deze klus uit een advertentie?
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.9rem' }}>
        Deze klus heeft geen aanvraag en geen advertentieklik. Rond deze datum is er wel op
        het telefoonnummer geklikt vanuit een advertentie. Weet u welke het was, koppel hem —
        dan telt de omzet mee in Google Ads. Weet u het niet zeker, laat het staan: een
        verkeerde koppeling stuurt de advertenties de verkeerde kant op. Hieronder staan
        de kliks die het dichtst bij deze klus liggen.
      </p>

      {error && <p style={{ fontSize: '0.85rem', color: '#dc2626', marginBottom: '0.6rem' }}>{error}</p>}

      <div style={{ display: 'grid', gap: '0.4rem' }}>
        {clicks.map((click) => (
          <div
            key={click.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '0.75rem', padding: '0.5rem 0.7rem',
              border: '1px solid #e2e8f0', borderRadius: 8,
            }}
          >
            <div style={{ fontSize: '0.85rem' }}>
              <strong>{WHEN.format(new Date(click.created_at))}</strong>
              <span style={{ color: '#64748b' }}> · {ago(click.hoursFromJob)} · {click.network}</span>
              {click.source_url && (
                <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                  {click.source_url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}
                </div>
              )}
            </div>
            <button className={ui.btn} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} disabled={busy} onClick={() => void claim(click.id)}>
              Dit was het
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
