'use client';

import React, { useState } from 'react';
import styles from './AfspraakForm.module.css';
import { SITE_CONFIG } from '@/config/site.config';
import { CITIES } from '@/config/cities';
import { SERVICE_REGIONS } from '@/config/regions';
import { reportLeadConversion } from '@/lib/leadTracking';
import { tagLeadClaritySession } from '@/lib/clarity';

declare global {
  interface Window {
    oaiq?: ((...args: unknown[]) => void) & { q: unknown[][] };
  }
}

/** Cities grouped under their province, in the order SERVICE_REGIONS defines. */
const CITIES_BY_REGION = SERVICE_REGIONS.map((region) => ({
  region,
  cities: CITIES.filter((c) => c.region === region.name).sort((a, b) => a.city.localeCompare(b.city)),
}));

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

export default function AfspraakForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plaats, setPlaats] = useState('');
  const [postcode, setPostcode] = useState('');
  const [kenteken, setKenteken] = useState('');
  const [vehicle, setVehicle] = useState<{ merk: string; model: string; bouwjaar: string } | null>(null);
  const [isFetchingVehicle, setIsFetchingVehicle] = useState(false);
  const [timing, setTiming] = useState('');
  const [werkzaamheden, setWerkzaamheden] = useState('');
  const [hp, setHp] = useState(''); // honeypot — real visitors never see or fill this
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicleData = async (plate: string) => {
    const cleanPlate = plate.replace(/-/g, '');
    if (cleanPlate.length < 4) return;
    setIsFetchingVehicle(true);
    try {
      const res = await fetch(`/api/kenteken?q=${encodeURIComponent(cleanPlate)}`);
      const data = await res.json();
      if (data.success && data.data) setVehicle(data.data);
    } catch (err) {
      console.error('RDW fetch error', err);
    } finally {
      setIsFetchingVehicle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone) {
      setError('Vul in elk geval uw naam en telefoonnummer in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const service = [werkzaamheden, timing && `Gewenste timing: ${timing}`].filter(Boolean).join(' — ') || null;

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hp,
          name,
          email,
          phone,
          location: plaats || postcode || null,
          postcode,
          brand: vehicle?.merk ?? null,
          model: vehicle ? `${kenteken} - ${vehicle.model}` : kenteken || null,
          year: vehicle?.bouwjaar ?? null,
          service,
          source: 'afspraak_form',
          gclid: getCookie('gclid'),
          wbraid: getCookie('wbraid'),
          gbraid: getCookie('gbraid'),
          msclkid: getCookie('msclkid'),
        }),
      });

      if (!res.ok) throw new Error(`/api/leads ${res.status}`);

      const json = await res.json().catch(() => null);
      tagLeadClaritySession(json?.data?.id);
      reportLeadConversion({ source: 'afspraak_form', email, phone, postcode, city: plaats });
      window.oaiq?.('measure', 'lead_created', { type: 'customer_action' });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error saving afspraak lead', err);
      setError(`Versturen lukte niet. Probeer het opnieuw of bel ons direct op ${SITE_CONFIG.phone}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.card}>
        <div className={styles.successIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className={styles.title}>Aanvraag ontvangen!</h2>
        <p className={styles.subtitle}>
          Bedankt, {name}. Wij nemen snel contact met u op om de afspraak te bevestigen.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Afspraak maken, zo geregeld</h2>
      <p className={styles.subtitle}>
        Plan eenvoudig uw afspraak wanneer het u uitkomt. Laat uw gegevens achter en wij nemen
        snel contact met u op om alles af te stemmen. Duidelijk, snel en zonder gedoe.
      </p>
      <p className={styles.contactLine}>
        <a href={`tel:${SITE_CONFIG.phoneTel}`}>📞 {SITE_CONFIG.phone}</a>
        <a href={`mailto:${SITE_CONFIG.email}`}>✉️ {SITE_CONFIG.email}</a>
      </p>

      {/* Honeypot — real visitors never see this field; autofill-safe name per the bug fixed on the main wizard. */}
      <input
        type="text"
        name="hp"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <label className={styles.field}>
        <span className={styles.label}>Naam</span>
        <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam" required />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>E-mailadres</span>
          <input type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mailadres" />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Telefoonnummer</span>
          <input type="tel" className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefoonnummer" required />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Plaats</span>
          <select className={styles.input} value={plaats} onChange={(e) => setPlaats(e.target.value)}>
            <option value="">Kies uw plaats</option>
            {CITIES_BY_REGION.map(({ region, cities }) => (
              <optgroup key={region.slug} label={region.label}>
                {cities.map((c) => (
                  <option key={c.slug} value={c.city}>{c.city}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Postcode</span>
          <input className={styles.input} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Bijv. 1011 AB" />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>
          Kenteken voertuig
          {isFetchingVehicle && <span className={styles.hint}> — zoeken...</span>}
          {vehicle && <span className={styles.hintFound}> — {vehicle.merk} {vehicle.model} herkend</span>}
        </span>
        <input
          className={styles.input}
          value={kenteken}
          onChange={(e) => { setKenteken(e.target.value.toUpperCase()); setVehicle(null); }}
          onBlur={() => fetchVehicleData(kenteken)}
          placeholder="XX-XXX-X"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Wanneer wilt u de afspraak inplannen</span>
        <input className={styles.input} value={timing} onChange={(e) => setTiming(e.target.value)} placeholder="Bijvoorbeeld: met spoed, binnen een week, flexibel" />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Werkzaamheden</span>
        <textarea className={styles.textarea} value={werkzaamheden} onChange={(e) => setWerkzaamheden(e.target.value)} placeholder="Wat moet er gebeuren?" rows={4} />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? 'Versturen...' : 'Afspraak aanvragen'}
      </button>
    </form>
  );
}
