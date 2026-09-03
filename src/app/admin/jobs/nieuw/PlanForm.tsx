'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../jobs.module.css';
import { TIME_SLOTS } from '@/lib/crmJobs';

export interface PlanLead {
  id: string;
  name: string | null;
  phone: string | null;
  phone_e164: string | null;
  postcode: string | null;
  location: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
  kenteken: string | null;
  service: string | null;
  source: string | null;
  created_at: string;
}

interface SuggestionView {
  id: string;
  name: string;
  inRegion: boolean;
  reason: string;
}

export default function PlanForm({
  lead,
  order,
  date,
  suggestions,
}: {
  lead: PlanLead | null;
  order: { id: string; order_number: string; total_inc: number } | null;
  date: string;
  suggestions: SuggestionView[];
}) {
  const router = useRouter();

  const [scheduledDate, setScheduledDate] = useState(date);
  // 10:00–12:00 is the first slot of a normal working day; night windows exist
  // but should never be the default.
  const [slot, setSlot] = useState('10:00');
  const [technicianId, setTechnicianId] = useState<string>(
    suggestions[0]?.id ?? ''
  );
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(lead?.location ?? '');
  const [postcode, setPostcode] = useState(lead?.postcode ?? '');
  const [kenteken, setKenteken] = useState(lead?.kenteken ?? '');
  const [service, setService] = useState(lead?.service ?? '');
  // A webshop order is already paid, so the agreed price is known exactly.
  const [quoted, setQuoted] = useState(order ? String(order.total_inc) : '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const window = TIME_SLOTS.find((s) => s.start === slot);

    const response = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // One or the other, never both: the id is the same value in the
        // order case and would otherwise be written into a lead column.
        lead_id: order ? null : (lead?.id ?? null),
        order_id: order?.id ?? null,
        customer_name: lead?.name ?? null,
        customer_phone: lead?.phone_e164 ?? lead?.phone ?? null,
        technician_id: technicianId || null,
        scheduled_date: scheduledDate,
        slot_start: window?.start ?? slot,
        slot_end: window?.end ?? '',
        street,
        postcode,
        city,
        kenteken,
        service_type: service,
        quoted_price: quoted,
        notes,
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Inplannen mislukt. Probeer opnieuw.');
      setSaving(false);
      return;
    }

    router.push(`/admin/jobs?datum=${scheduledDate}`);
    router.refresh();
  }

  return (
    <form className={styles.planWrap} onSubmit={submit}>
      <div className={styles.panel}>
        <h2>Klus</h2>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="datum">
              Datum
            </label>
            <input
              id="datum"
              className={styles.control}
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="tijdvak">
              Tijdvak
            </label>
            <select
              id="tijdvak"
              className={styles.control}
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {TIME_SLOTS.map((s) => (
                <option key={s.start} value={s.start}>
                  {s.start}–{s.end}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="dienst">
              Dienst
            </label>
            <input
              id="dienst"
              className={styles.control}
              value={service}
              onChange={(e) => setService(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prijs">
              Afgesproken prijs (€)
            </label>
            <input
              id="prijs"
              className={styles.control}
              inputMode="decimal"
              placeholder="249.00"
              value={quoted}
              onChange={(e) => setQuoted(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="straat">
              Straat en huisnummer
            </label>
            <input
              id="straat"
              className={styles.control}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pc">
              Postcode
            </label>
            <input
              id="pc"
              className={styles.control}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="plaats">
              Plaats
            </label>
            <input
              id="plaats"
              className={styles.control}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kent">
              Kenteken
            </label>
            <input
              id="kent"
              className={styles.control}
              value={kenteken}
              onChange={(e) => setKenteken(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field} style={{ marginTop: 12 }}>
          <label className={styles.fieldLabel} htmlFor="notitie">
            Notitie voor de monteur
          </label>
          <textarea
            id="notitie"
            className={styles.control}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <p className={styles.note}>
          Het tijdvak is wat de klant te horen krijgt. Een exacte tijd beloven
          werkt in spoedwerk niet: de klus ervoor loopt uit en de belofte is
          gebroken voordat iemand vertrokken is.
        </p>

        <div className={styles.actions}>
          <button className={styles.primary} type="submit" disabled={saving}>
            {saving ? 'Inplannen…' : 'Klus inplannen'}
          </button>
          <Link
            className={styles.secondary}
            href={lead ? '/admin/leads' : '/admin/jobs'}
          >
            Annuleren
          </Link>
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>

      <div className={styles.panel}>
        {order && (
          <>
            <h2>Bestelling</h2>
            <div className={styles.summary}>
              <span className={styles.summaryKey}>Ordernummer</span>
              <span className={styles.summaryVal}>{order.order_number}</span>
              <span className={styles.summaryKey}>Al betaald</span>
              <span className={styles.summaryVal}>€ {order.total_inc.toFixed(2)}</span>
            </div>
          </>
        )}

        {lead && !order && (
          <>
            <h2>Lead</h2>
            <div className={styles.summary}>
              <span className={styles.summaryKey}>Klant</span>
              <span className={styles.summaryVal}>{lead.name ?? 'geen naam'}</span>
              <span className={styles.summaryKey}>Telefoon</span>
              <span className={styles.summaryVal}>
                {lead.phone_e164 ? (
                  <a href={`tel:${lead.phone_e164}`}>{lead.phone_e164}</a>
                ) : (
                  '—'
                )}
              </span>
              <span className={styles.summaryKey}>Voertuig</span>
              <span className={styles.summaryVal}>
                {[lead.brand, lead.model, lead.year].filter(Boolean).join(' ') || '—'}
              </span>
              <span className={styles.summaryKey}>Bron</span>
              <span className={styles.summaryVal}>{lead.source ?? 'unknown'}</span>
            </div>
          </>
        )}

        <h2>Monteur</h2>
        {suggestions.length === 0 ? (
          <p className={styles.note}>
            Geen beschikbare monteurs voor deze dag.
          </p>
        ) : (
          <>
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className={
                  technicianId === s.id
                    ? `${styles.suggestion} ${styles.suggestionActive}`
                    : styles.suggestion
                }
                onClick={() => setTechnicianId(s.id)}
              >
                <span>
                  <span className={styles.suggestionName}>{s.name}</span>
                  <span className={styles.suggestionWhy}>{s.reason}</span>
                </span>
                {s.inRegion && <span className={styles.regionTag}>regio</span>}
              </button>
            ))}
            <button
              type="button"
              className={
                technicianId === ''
                  ? `${styles.suggestion} ${styles.suggestionActive}`
                  : styles.suggestion
              }
              onClick={() => setTechnicianId('')}
            >
              <span>
                <span className={styles.suggestionName}>Nog niet toewijzen</span>
                <span className={styles.suggestionWhy}>
                  plan de klus vast in, kies later wie gaat
                </span>
              </span>
            </button>
          </>
        )}

        <p className={styles.note}>
          De volgorde is een voorstel op basis van werkgebied en drukte, geen
          toewijzing. Verkeer, voorraad in de bus en een klant die om een
          bepaalde monteur vraagt weet dit scherm niet.
        </p>
      </div>
    </form>
  );
}
