'use client';

import React, { useState } from 'react';
import styles from './HorizontalKentekenForm.module.css';
import { SITE_CONFIG } from '@/config/site.config';

export default function HorizontalKentekenForm() {
  const [kenteken, setKenteken] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const formatKenteken = (value: string) => {
    return value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  };

  const handleKentekenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKenteken(formatKenteken(e.target.value));
    setVehicle(null); // Reset vehicle if they change it
  };

  const fetchVehicleData = async (k: string) => {
    const cleanK = k.replace(/-/g, '');
    if (cleanK.length < 4) return;
    
    setIsFetching(true);
    try {
      const res = await fetch(`/api/kenteken?q=${cleanK}`);
      const data = await res.json();
      if (data.success && data.data) {
        setVehicle(data.data);
      }
    } catch (err) {
      console.error("RDW fetch error", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleKentekenBlur = () => {
    if (kenteken && !vehicle) {
      fetchVehicleData(kenteken);
    }
  };

  const buildWhatsappUrl = () => {
    let msg = `Hallo, ik wil graag een prijsopgave voor een autosleutel.\n\n`;
    msg += `*Kenteken:* ${kenteken || 'Niet ingevuld'}\n`;
    if (vehicle) {
      msg += `*Auto:* ${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar})\n`;
    }
    if (postcode) msg += `*Locatie/Postcode:* ${postcode}\n`;
    if (phone) msg += `*Telefoon:* ${phone}\n`;
    return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  const handleSubmit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!kenteken) {
      e.preventDefault();
      alert('Vul alstublieft minimaal uw kenteken in om een exacte prijs te ontvangen.');
      return;
    }
    
    // Read ad parameters from cookies
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    
    // Save to Supabase (fire and forget)
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: vehicle ? vehicle.merk : 'KENTEKEN AANVRAAG',
        model: vehicle ? `${kenteken} - ${vehicle.model}` : kenteken,
        year: vehicle ? vehicle.bouwjaar : 'N/A',
        service: 'Prijsopgave via kenteken',
        location: `${postcode} (Tel: ${phone})`,
        photoUrl: '',
        gclid: getCookie('gclid'),
        wbraid: getCookie('wbraid'),
        gbraid: getCookie('gbraid')
      }),
      keepalive: true
    }).catch(err => console.error("Error saving lead", err));
    
    (e.currentTarget as HTMLAnchorElement).href = buildWhatsappUrl();
  };

  return (
    <div className={styles.card}>
      <div className={styles.inputsRow}>
        
        {/* Kenteken */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Uw kenteken {isFetching && <span style={{fontSize:'0.75rem', color:'#64748b'}}>(zoeken...)</span>}
            {vehicle && <span style={{fontSize:'0.75rem', color:'#10b981', marginLeft: '4px'}}>✓ {vehicle.merk}</span>}
          </label>
          <div className={styles.kentekenWrapper}>
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
              onBlur={handleKentekenBlur}
              maxLength={10}
              aria-label="Kenteken"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Postcode */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Postcode / Stad</label>
          <div className={styles.postcodeWrapper}>
            <input
              type="text"
              className={styles.postcodeInput}
              placeholder="Bijv. 1011AB"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
            <span className={styles.locationIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
            </span>
          </div>
        </div>
        
        {/* Telefoonnummer */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Telefoonnummer</label>
          <div className={styles.postcodeWrapper}>
            <input
              type="tel"
              className={styles.postcodeInput}
              placeholder="06 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <span className={styles.locationIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className={styles.actionGroup}>
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
            onClick={handleSubmit}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={styles.btnSubmit}
          >
            Prijs opvragen
          </a>
        </div>

      </div>
    </div>
  );
}
