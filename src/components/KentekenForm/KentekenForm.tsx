'use client';

import React, { useState } from 'react';
import styles from './KentekenForm.module.css';
import { SITE_CONFIG } from '@/config/site.config';
import { reportLeadConversion } from '@/lib/leadTracking';
import { tagLeadClaritySession } from '@/lib/clarity';

type ServiceType = 'Reservesleutel' | 'Alle sleutels kwijt' | '';

export default function KentekenForm() {
  const [kenteken, setKenteken] = useState('');
  const [service, setService] = useState<ServiceType>('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatKenteken = (value: string) => {
    return value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  };

  const handleKentekenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKenteken(formatKenteken(e.target.value));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!kenteken || !phone) {
      alert('Vul alstublieft uw kenteken en telefoonnummer in.');
      return;
    }

    setIsSubmitting(true);

    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'KENTEKEN AANVRAAG',
          model: kenteken,
          year: 'N/A',
          service: service || 'Prijsopgave via kenteken',
          location: city,
          postcode: '',
          phone,
          photoUrl: '',
          source: 'kenteken_form_vertical',
          scenario: null,
          quotedPrice: null,
          gclid: getCookie('gclid'),
          wbraid: getCookie('wbraid'),
          gbraid: getCookie('gbraid'),
          msclkid: getCookie('msclkid'),
        }),
      });
      const json = await res.json().catch(() => null);
      tagLeadClaritySession(json?.data?.id);

      reportLeadConversion({
        source: 'kenteken_form_vertical',
        phone,
        city,
      });
      window.oaiq?.('track', 'lead_created', { content_name: 'kenteken_form_vertical' });
      
      setIsSubmitted(true);
    } catch (err) {
      console.error("Error saving lead", err);
      alert('Er ging iets mis. Probeer het opnieuw of bel ons direct.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.container} id="offerte-form" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Aanvraag Ontvangen!</h3>
        <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>Bedankt voor uw aanvraag. We hebben uw kenteken ontvangen en bellen u binnen 5 minuten met de exacte prijs.</p>
      </div>
    );
  }

  return (
    <div className={styles.container} id="offerte-form">
      <h2 className={styles.title}>Vraag direct een exacte offerte aan</h2>
      <p className={styles.subtitle}>
        Vul uw gegevens in en ontvang direct de exacte prijs voor uw auto.
      </p>

      <div className={styles.formGroup}>

        {/* Kenteken Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>1. Wat is uw kenteken?</label>
          <div className={styles.licensePlateWrapper}>
            <div className={styles.euStrip}>
              <span className={styles.euStars}>★</span>
              <span className={styles.nlText}>NL</span>
            </div>
            <input
              type="text"
              className={styles.kentekenInput}
              placeholder="XX-XXX-X"
              value={kenteken}
              onChange={handleKentekenChange}
              maxLength={10}
              aria-label="Kenteken"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Service Type */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>2. Wat is de situatie?</label>
          <div className={styles.optionsWrapper}>
            <button
              type="button"
              onClick={() => setService(service === 'Reservesleutel' ? '' : 'Reservesleutel')}
              className={`${styles.optionBtn} ${service === 'Reservesleutel' ? styles.optionActive : ''}`}
            >
              🔑 Extra (Reserve) Sleutel
            </button>
            <button
              type="button"
              onClick={() => setService(service === 'Alle sleutels kwijt' ? '' : 'Alle sleutels kwijt')}
              className={`${styles.optionBtn} ${service === 'Alle sleutels kwijt' ? styles.optionActive : ''}`}
            >
              🚨 Alle Sleutels Kwijt
            </button>
          </div>
        </div>

        {/* City Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>3. Waar staat de auto?</label>
          <input
            type="text"
            className={styles.cityInput}
            placeholder="Bijv. Amsterdam, Utrecht..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Phone Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>4. Telefoonnummer</label>
          <input
            type="tel"
            className={styles.cityInput}
            placeholder="06 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ paddingLeft: '1rem' }}
          />
        </div>

        {/* Submit */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.btnSubmit}
            disabled={isSubmitting}
            style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', width: '100%' }}
          >
            {isSubmitting ? 'Verzenden...' : 'Prijs opvragen'}
          </button>

          <span style={{ color: '#475569', display: 'block', textAlign: 'center', marginTop: '1rem' }}>of bel direct</span>

          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.phoneLink}>
            {SITE_CONFIG.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
