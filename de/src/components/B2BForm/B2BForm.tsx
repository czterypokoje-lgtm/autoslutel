'use client';

import { reportLeadConversion } from '@/lib/leadTracking';
import { tagLeadClaritySession } from '@/lib/clarity';

import React, { useState } from 'react';
import styles from './B2BForm.module.css';

/**
 * Das Anfrageformular der Geschäftskundenseiten.
 *
 * Mit Absicht nicht LeadCaptureForm. Ein Verbraucher ist eine Person mit einem
 * Fahrzeug und will jetzt einen Preis; eine Werkstatt will wissen, ob das
 * überhaupt funktioniert, und vergleicht Anbieter. Also fragt dieses Formular,
 * wer sie sind und wie viel Arbeit es ist, und verspricht ein schriftliches
 * Angebot statt einer Ankunftszeit.
 *
 * WO DIE ANFRAGE LANDET
 *
 * Am selben /api/leads-Endpunkt und in derselben Tabelle wie alles andere, und
 * das ist Absicht — eine B2B-Anfrage in einem eigenen Postfach ist eine, die
 * niemand liest. Das Büro sieht sie neben den Verbraucheranfragen, mit `source`
 * als Herkunft.
 *
 * Die Tabelle hat keine Spalte für den Firmennamen, also wird er in `name` als
 * "Ansprechpartner — Firma" eingefaltet. Das liest sich im CRM richtig und
 * braucht keine Migration — was zählt, weil ohnehin schon Migrationen auf
 * ihre Ausführung warten.
 */
export default function B2BForm({
  segment,
  segmentLabel,
}: {
  /** Slug, z. B. 'kfz-werkstaetten'. Landet in `source`, damit das Büro die Herkunft kennt. */
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
          service: `Geschäftskunde: ${segmentLabel}`,
          /* Für Freitext gibt es kein eigenes Feld, also reist er mit der
             Leistungsbeschreibung mit, die das Büro ohnehin liest. */
          model: String(form.get('volume') || '').slice(0, 80) || null,
          source: `b2b-${segment}`,
        }),
      });
      if (!res.ok) throw new Error('fehlgeschlagen');
      const json = await res.json().catch(() => null);
      tagLeadClaritySession(json?.data?.id);

      /* Anders als die Verbraucherformulare bleibt dieses auf der Seite und
         zeigt eine Bestätigung — es kann also auf die Antwort warten und nur
         eine Anfrage melden, die die API tatsächlich angenommen hat. */
      reportLeadConversion({
        source: `b2b-${segment}`,
        email: String(form.get('email') || '') || null,
        phone: String(form.get('phone') || '') || null,
      });

      setDone(true);
    } catch {
      setError('Das Senden hat nicht funktioniert. Rufen Sie uns gern direkt an — das geht schneller.');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className={styles.card}>
        <h3 className={styles.doneTitle}>Danke — Ihre Anfrage liegt bei uns.</h3>
        <p className={styles.doneText}>
          Wir melden uns innerhalb eines Werktags mit einem Preis und einem
          Vorschlag zum Ablauf. Eilt es? Rufen Sie gern direkt an.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      <h3 className={styles.title}>Angebot für Geschäftskunden anfordern</h3>
      <p className={styles.sub}>
        Sagen Sie kurz, was Sie brauchen. Sie erhalten innerhalb eines Werktags
        einen Preis und einen Vorschlag — keine automatischen Mails.
      </p>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Firmenname</span>
          <input name="company" required autoComplete="organization" />
        </label>
        <label className={styles.field}>
          <span>Ansprechpartner</span>
          <input name="contact" required autoComplete="name" />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Telefon</span>
          <input name="phone" type="tel" required autoComplete="tel" />
        </label>
        <label className={styles.field}>
          <span>E-mail</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>

      <label className={styles.field}>
        <span>Ort</span>
        <input name="city" required autoComplete="address-level2" />
      </label>

      <label className={styles.field}>
        <span>Um wie viele Fahrzeuge geht es, und um welche Marken?</span>
        <input name="volume" placeholder="z. B. 6 Gebrauchtwagen, VW und Opel" />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submit} type="submit" disabled={sending}>
        {sending ? 'Wird gesendet…' : 'Angebot anfordern'}
      </button>
    </form>
  );
}
