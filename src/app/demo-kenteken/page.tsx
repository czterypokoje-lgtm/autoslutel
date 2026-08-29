'use client';

import React, { useState } from 'react';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './page.module.css';

interface VehicleData {
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: string;
}

export default function DemoKentekenPage() {
  const [kenteken, setKenteken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  // Phone and postcode for step 2
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const formatKenteken = (value: string) => {
    return value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  };

  const handleKentekenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKenteken(formatKenteken(e.target.value));
    setVehicle(null);
    setError('');
  };

  const fetchVehicle = async () => {
    if (!kenteken || kenteken.replace(/-/g, '').length < 4) {
      setError('Vul een geldig kenteken in.');
      return;
    }

    setLoading(true);
    setError('');
    setVehicle(null);

    try {
      const res = await fetch(`/api/kenteken?q=${kenteken}`);
      const data = await res.json();

      if (data.success && data.data) {
        setVehicle(data.data);
      } else {
        setError(data.error || 'Voertuig niet gevonden.');
      }
    } catch (err) {
      setError('Er is een fout opgetreden bij het ophalen van de gegevens.');
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsappUrl = () => {
    let msg = `Hallo, ik wil graag een prijsopgave voor een autosleutel.\n\n`;
    msg += `*Kenteken:* ${kenteken}\n`;
    msg += `*Auto:* ${vehicle?.merk} ${vehicle?.model} (${vehicle?.bouwjaar})\n`;
    if (postcode) msg += `*Locatie/Postcode:* ${postcode}\n`;
    if (phone) msg += `*Telefoon:* ${phone}\n`;
    return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    // Read ad parameters from cookies
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    
    try {
      // 1. Save to Supabase
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'KENTEKEN DEMO',
          model: `${kenteken} - ${vehicle?.merk} ${vehicle?.model}`,
          year: vehicle?.bouwjaar || 'N/A',
          service: 'Demo Kenteken Check',
          location: `${postcode} (Tel: ${phone})`,
          photoUrl: '',
          gclid: getCookie('gclid'),
          wbraid: getCookie('wbraid'),
          gbraid: getCookie('gbraid')
        }),
      });

      // 2. Alert user it worked
      alert(`✅ Succes! De test data is nu opgeslagen in Supabase.\n\nU wordt nu doorgestuurd naar WhatsApp.`);
      
      // 3. Open WhatsApp in new tab
      window.open(buildWhatsappUrl(), '_blank');
      
    } catch (err) {
      console.error(err);
      alert('Er ging iets mis bij het opslaan.');
    } finally {
      setSubmitted(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Demo: RDW Kenteken Check (2-Step)</h1>
        <p className={styles.description}>
          Dit is een testomgeving. Vul een kenteken in (bijv. <strong>ZL-915-J</strong>) en bekijk hoe de RDW API de voertuiggegevens ophaalt.
        </p>

        <div className={styles.card}>
          <div className={styles.step}>
            <h2>Stap 1: Uw Auto</h2>
            <div className={styles.inputGroup}>
              <label>Kenteken</label>
              <div className={styles.kentekenWrapper}>
                <div className={styles.euStrip}>
                  <span className={styles.euStars}>★</span>
                  <span>NL</span>
                </div>
                <input
                  type="text"
                  className={styles.kentekenInput}
                  placeholder="XX-XXX-X"
                  value={kenteken}
                  onChange={handleKentekenChange}
                  maxLength={10}
                />
              </div>
            </div>
            
            <button 
              className={styles.fetchBtn} 
              onClick={fetchVehicle} 
              disabled={loading}
            >
              {loading ? 'Bezig met zoeken...' : 'Zoek Auto'}
            </button>

            {error && <div className={styles.error}>{error}</div>}
            
            {vehicle && (
              <div className={styles.successBox}>
                <strong>Voertuig Gevonden:</strong>
                <p>{vehicle.merk} {vehicle.model} ({vehicle.bouwjaar})</p>
              </div>
            )}
          </div>

          {vehicle && (
            <div className={styles.step}>
              <h2>Stap 2: Contactgegevens</h2>
              <form onSubmit={handleFinalSubmit}>
                <div className={styles.inputGroup}>
                  <label>Postcode / Stad</label>
                  <input 
                    type="text" 
                    className={styles.standardInput} 
                    placeholder="1011 AB" 
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Telefoonnummer</label>
                  <input 
                    type="tel" 
                    className={styles.standardInput} 
                    placeholder="06 1234 5678" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={submitted}>
                  {submitted ? 'Verzenden...' : 'Ontvang Prijsopgave'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
