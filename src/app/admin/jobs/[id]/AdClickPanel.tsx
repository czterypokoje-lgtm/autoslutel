'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MousePointerClick } from 'lucide-react';
import { ui } from '../../_ui';
import jd from './job-detail.module.css';

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
  ref: string | null;
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
  const [code, setCode] = useState('');

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

  /* Nothing to decide once it is attributed. Without nearby clicks the panel
     still shows, but only the code field: a WhatsApp code is exact, whatever
     the date. */
  if (attributed === null || attributed) return null;

  /* The customer's WhatsApp message starts with "[K7F2]" when they came from
     an ad. That code finds its click directly — no list to weigh. */
  async function findByCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/call-clicks?ref=${encodeURIComponent(code.trim().toUpperCase())}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Zoeken mislukt');
      if (!json.clicks?.length) throw new Error('Geen open advertentieklik met deze code.');
      setClicks(json.clicks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zoeken mislukt');
    } finally {
      setBusy(false);
    }
  }

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
    <section className={`${ui.card} ${jd.panel}`}>
      <h2 className={jd.panelTitle}>
        <MousePointerClick size={16} /> Kwam deze klus uit een advertentie?
      </h2>
      <p className={jd.panelNote}>
        Deze klus heeft geen aanvraag en geen advertentieklik. Begint het WhatsApp-bericht
        van de klant met een code tussen haken, bijvoorbeeld <strong>[K7F2]</strong>? Vul die
        hieronder in — dan telt de omzet mee in Google Ads.
        {clicks.length > 0 && (
          <> Geen code? Hieronder staan de kliks die het dichtst bij deze klus liggen. Weet je
          het niet zeker, laat het staan: een verkeerde koppeling stuurt de advertenties de
          verkeerde kant op.</>
        )}
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); void findByCode(); }}
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code, bijv. K7F2"
          maxLength={6}
          aria-label="WhatsApp-code"
          style={{ padding: '0.35rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: 6, width: '10rem', textTransform: 'uppercase' }}
        />
        <button type="submit" className={`${ui.btn} ${jd.smallBtn}`} disabled={busy || !code.trim()}>
          Zoek
        </button>
      </form>

      {error && <p className={jd.panelErr}>{error}</p>}

      <div className={jd.clickList}>
        {clicks.map((click) => (
          <div key={click.id} className={jd.click}>
            <div className={jd.clickMain}>
              <strong>{WHEN.format(new Date(click.created_at))}</strong>
              <span className={jd.clickMeta}> · {ago(click.hoursFromJob)} · {click.network}</span>
              {click.ref && <span className={jd.clickMeta} style={{ color: '#16a34a', fontWeight: 600 }}> · code {click.ref}</span>}
              {click.source_url && (
                <div className={jd.clickSub}>
                  {click.source_url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}
                </div>
              )}
            </div>
            <button className={`${ui.btn} ${jd.smallBtn}`} disabled={busy} onClick={() => void claim(click.id)}>
              Dit was het
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
