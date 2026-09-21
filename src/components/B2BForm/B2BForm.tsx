'use client';

import { reportLeadConversion } from '@/lib/leadTracking';

import React, { useState } from 'react';
import styles from './B2BForm.module.css';

/**
 * The enquiry form on the zakelijk pages.
 *
 * Deliberately not LeadCaptureForm. A consumer is one person with one car and
 * wants a price now; a garage wants to know whether this is workable at all and
 * is comparing suppliers. So this asks who they are and how much work there is,
 * and promises a written quote rather than an arrival time.
 *
 * WHERE IT LANDS
 *
 * The same /api/leads endpoint and the same leads table as everything else, on
 * purpose — a B2B enquiry that arrives in a separate inbox is one nobody reads.
 * The office sees it beside the consumer leads with `source` naming the segment.
 *
 * The leads table has no company column, so the company name is folded into
 * `name` as "Contactpersoon — Bedrijf". That reads correctly in the CRM without
 * a migration, which matters: there are already several migrations waiting to be
 * run, and adding another to ship a form would be a poor trade.
 */
export default function B2BForm({
  segment,
  segmentLabel,
}: {
  /** Slug, e.g. 'garages'. Ends up in `source` so the office knows the origin. */
  segment: string;
  segmentLabel: string;
}) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const company = String(form.get('company') || '').trim();
    const contact = String(form.get('contact') || '').trim();

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: company ? `${contact} — ${company}` : contact,
          phone: form.get('phone'),
          email: form.get('email'),
          location: form.get('city'),
          service: `Zakelijk: ${segmentLabel}`,
          /* Free text has nowhere else to go, so it rides along with the
             service description the office already reads. */
          model: String(form.get('volume') || '').slice(0, 80) || null,
          source: `b2b-${segment}`,
        }),
      });
      if (!res.ok) throw new Error('mislukt');

      /* Unlike the consumer forms, this one stays on the page and shows a
         confirmation — so it can wait for the response and only report a
         lead the API actually accepted. */
      reportLeadConversion({
        source: `b2b-${segment}`,
        email: String(form.get('email') || '') || null,
        phone: String(form.get('phone') || '') || null,
      });

      setDone(true);
    } catch {
      setError('Versturen lukte niet. Belt u ons gerust direct — dat gaat sneller.');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className={styles.card}>
        <h3 className={styles.doneTitle}>Bedankt — uw aanvraag staat bij ons.</h3>
        <p className={styles.doneText}>
          Wij nemen binnen één werkdag contact met u op met een prijs en een
          voorstel voor de werkwijze. Heeft u haast? Bel ons gerust direct.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      <h3 className={styles.title}>Vraag een zakelijk voorstel aan</h3>
      <p className={styles.sub}>
        Vertel kort wat u nodig heeft. U krijgt binnen één werkdag een prijs en
        een voorstel — geen automatische mailtjes.
      </p>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Bedrijfsnaam</span>
          <input name="company" required autoComplete="organization" />
        </label>
        <label className={styles.field}>
          <span>Contactpersoon</span>
          <input name="contact" required autoComplete="name" />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Telefoon</span>
          <input name="phone" type="tel" required autoComplete="tel" />
        </label>
        <label className={styles.field}>
          <span>E-mail</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>

      <label className={styles.field}>
        <span>Plaats</span>
        <input name="city" required autoComplete="address-level2" />
      </label>

      <label className={styles.field}>
        <span>Om hoeveel voertuigen gaat het, en welke merken?</span>
        <input name="volume" placeholder="bijv. 6 occasions, VW en Opel" />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submit} type="submit" disabled={sending}>
        {sending ? 'Versturen…' : 'Voorstel aanvragen'}
      </button>
    </form>
  );
}
