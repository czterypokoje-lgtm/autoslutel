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
    // Basic formatting for Dutch plates: remove invalid chars, uppercase
    // Real spacing logic could be added, but relying on monospace + uppercase is solid.
    let formatted = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Auto-add dashes visually if we want, but simple string is often easier for the user to type
    // We'll keep it simple and clean.
    if (formatted.length > 2 && formatted.length <= 4) {
      formatted = formatted.slice(0, 2) + '-' + formatted.slice(2);
    } else if (formatted.length > 4 && formatted.length <= 6) {
      formatted = formatted.slice(0, 2) + '-' + formatted.slice(2, 4) + '-' + formatted.slice(4);
    } else if (formatted.length > 6) {
      // Dutch plates are max 6 chars usually (8 with dashes). Let them type freely if it's new formats.
      formatted = formatted.slice(0, 2) + '-' + formatted.slice(2, 5) + '-' + formatted.slice(5, 6);
    }
    
    // For now, let's just let them type without forcing dashes if it gets annoying, 
    // actually just upper casing is safest for all plate types:
    return value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  };

  const handleKentekenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKenteken(formatKenteken(e.target.value));
    setVehicle(null);
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
    
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    
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
          <div className={styles.labelRow}>
            <label className={styles.label}>Uw kenteken</label>
            {isFetching && <span className={styles.fetchingText}>Zoeken...</span>}
            {vehicle && (
              <span className={styles.vehicleFound}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {vehicle.merk}
              </span>
            )}
          </div>
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
          <div className={styles.labelRow}>
            <label className={styles.label}>Postcode / Stad</label>
          </div>
          <div className={styles.standardWrapper}>
            <input
              type="text"
              className={styles.standardInput}
              placeholder="Bijv. 1011AB"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
            <span className={styles.iconLeft}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </span>
          </div>
        </div>
        
        {/* Telefoonnummer */}
        <div className={styles.inputGroup}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Telefoonnummer</label>
          </div>
          <div className={styles.standardWrapper}>
            <input
              type="tel"
              className={styles.standardInput}
              placeholder="06 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <span className={styles.iconLeft}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>

      </div>
    </div>
  );
}
