'use client';

import React, { useState } from 'react';
import styles from './KentekenForm.module.css';
import { SITE_CONFIG } from '@/config/site.config';

export default function KentekenForm() {
  const [kenteken, setKenteken] = useState('');

  const formatKenteken = (value: string) => {
    // Remove non-alphanumeric characters
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Add dashes for visual presentation, simple logic for Dutch plates. 
    // Real Dutch plate formatting is complex, so we just allow users to type and manually add a dash if they want,
    // or just let them type without dashes. It's usually better to just let them type as they wish, 
    // but we can auto-capitalize. We will just use the clean uppercase value and let them add dashes if they want.
    // Wait, let's just let them type freely but uppercase it.
    return value.toUpperCase();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKenteken(formatKenteken(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kenteken) {
      alert("Vul alstublieft een kenteken in.");
      return;
    }
    const whatsappMsg = `Hallo, wat kost een nieuwe sleutel voor mijn auto? Mijn kenteken is: ${kenteken}`;
    const customWhatsAppUrl = `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(customWhatsAppUrl, '_blank');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Geef uw kenteken op en vraag direct een offerte aan</h2>
      <p className={styles.subtitle}>
        Vul uw kenteken in en wij nemen zo snel mogelijk contact met u op met een prijsopgave voor uw autosleutel via WhatsApp.
      </p>

      <form onSubmit={handleSubmit} className={styles.formGroup}>
        
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
            onChange={handleInputChange}
            maxLength={10}
            required
            aria-label="Kenteken"
          />
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.btnSubmit}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Offerte aanvragen
          </button>
          
          <span style={{ color: '#475569' }}>of</span>
          
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.phoneLink}>
            bel {SITE_CONFIG.phone}
          </a>
        </div>
      </form>
    </div>
  );
}
