'use client';

import React, { useState } from 'react';
import styles from './KentekenForm.module.css';
import { SITE_CONFIG } from '@/config/site.config';

type ServiceType = 'Reservesleutel' | 'Alle sleutels kwijt' | '';

export default function KentekenForm() {
  const [kenteken, setKenteken] = useState('');
  const [service, setService] = useState<ServiceType>('');
  const [city, setCity] = useState('');

  const formatKenteken = (value: string) => {
    return value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  };

  const handleKentekenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKenteken(formatKenteken(e.target.value));
  };

  // Build WhatsApp URL synchronously at click time — never from stale state
  const buildWhatsappUrl = () => {
    let msg = `Hallo, ik wil graag een prijsopgave voor een autosleutel.\n\n`;
    msg += `*Kenteken:* ${kenteken || 'Niet ingevuld'}\n`;
    if (service) msg += `*Dienst:* ${service}\n`;
    if (city) msg += `*Locatie:* ${city}\n`;
    return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  const handleSubmit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!kenteken) {
      e.preventDefault();
      alert('Vul alstublieft minimaal uw kenteken in om een exacte prijs te ontvangen.');
      return;
    }
    // Update href synchronously right before navigation
    (e.currentTarget as HTMLAnchorElement).href = buildWhatsappUrl();
  };

  return (
    <div className={styles.container} id="offerte-form">
      <h2 className={styles.title}>Vraag direct een exacte offerte aan</h2>
      <p className={styles.subtitle}>
        Vul uw gegevens in en ontvang via WhatsApp direct de exacte prijs voor uw auto.
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

        {/* Submit */}
        <div className={styles.actions}>
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
            onClick={handleSubmit}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnSubmit}
            id="kenteken-form-whatsapp-btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Offerte aanvragen via WhatsApp
          </a>

          <span style={{ color: '#475569' }}>of bel</span>

          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.phoneLink}>
            {SITE_CONFIG.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
