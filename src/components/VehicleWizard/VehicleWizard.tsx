'use client';

declare global {
  interface Window {
    dataLayer?: unknown[];
    uetq?: unknown[];
  }
}

import { reportLeadConversion } from '@/lib/leadTracking';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './VehicleWizard.module.css';
import { serviceLimit } from '@/lib/serviceLimits';
import { SITE_CONFIG } from '@/config/site.config';
import {
  PushButtonIcon,
  TurnKeyIcon,
  RemoteYesIcon,
  RemoteNoIcon,
  CheckIcon,
  PhoneIcon,
  WhatsAppIcon,
} from './icons';


    setStep('success');
    setSending(false);
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  const stepClass = goingBack ? styles.stepBack : styles.step;

  return (
    <div className={styles.shell}>
      {/* Someone genuinely locked out will call, not fill in a form. Keep both
          routes above the wizard rather than below it. */}
      <div className={styles.urgent}>
        <a
          href={`tel:${SITE_CONFIG.phoneTel}`}
          className={`${styles.urgentBtn} ${styles.callBtn}`}
          id="wizard-call"
        >
          <PhoneIcon /> Bel direct
        </a>
        <a
          href="/whatsapp"
          className={`${styles.urgentBtn} ${styles.waBtn}`}
          id="wizard-whatsapp"
        >
          <WhatsAppIcon /> WhatsApp
        </a>
      </div>

      <div className={styles.progress} aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span
            key={i}
            className={`${styles.tick} ${i < step ? styles.tickDone : ''}`}
          >
            <span className={styles.tickFill} />
          </span>
        ))}
      </div>

      <div className={styles.stepMeta}>
        <span>Stap {step} van {TOTAL_STEPS}</span>
        {step > 1 && (
          <button type="button" className={styles.back} onClick={() => go(step - 1)}>
            Terug
          </button>
        )}
      </div>

      <div className={styles.body}>
        {/* ── 1. Licence plate ── */}
        {step === 1 && (
          <div className={stepClass} key="s1">
            <h3 className={styles.q}>Wat is uw kenteken?</h3>
            <p className={styles.hint}>
              Wij halen merk, model en bouwjaar automatisch op bij de RDW — u hoeft
              verder niets op te zoeken.
            </p>

            <div className={styles.plateWrap}>
              <span className={styles.euBand} aria-hidden="true">
                <span>★</span>
                <span>NL</span>
              </span>
              <input
                className={styles.plateInput}
                value={kenteken}
                onChange={(e) => {
                  setKenteken(e.target.value.toUpperCase());
                  setVehicle(null);
                  setLookupState('idle');
                }}
                onBlur={lookup}
                placeholder="XX-XXX-X"
                maxLength={10}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-label="Kenteken"
                inputMode="text"
              />
            </div>

            {vehicle && (
              <div className={styles.found}>
                <span className={styles.foundIcon}><CheckIcon /></span>
                <span className={styles.foundText}>
                  <span className={styles.foundName}>
                    {vehicle.merk} {vehicle.model}
                  </span>
                  <span className={styles.foundSub}>Bouwjaar {vehicle.bouwjaar}</span>
                </span>
              </div>
            )}

            {lookupState === 'busy' && (
              <p className={styles.lookupNote}>Kenteken opzoeken…</p>
            )}
            {lookupState === 'fail' && (
              <p className={`${styles.lookupNote} ${styles.lookupErr}`}>
                Dit kenteken kunnen wij niet ophalen. Geen probleem — u kunt gewoon
                doorgaan.
              </p>
            )}

            <button
              type="button"
              className={styles.cta}
              disabled={plateDigits.length < 4}
              onClick={() => { lookup(); go(2); }}
            >
              Verder
            </button>

            {fallback && (
              <button
                type="button"
                className={styles.escape}
                onClick={() => setShowFallback(true)}
              >
                Ik weet mijn kenteken niet
              </button>
            )}
          </div>
        )}

        {/* ── 2. How does the car start ── */}
        {step === 2 && (
          <div className={stepClass} key="s2">
            <h3 className={styles.q}>Hoe start u uw auto?</h3>
            <p className={styles.hint}>
              Hiermee weten wij welk type sleutel u nodig heeft.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Hoe start u uw auto">
              <button
                type="button"
                role="radio"
                aria-checked={startType === 'push'}
                className={`${styles.card} ${startType === 'push' ? styles.cardOn : ''}`}
                onClick={() => { setStartType('push'); go(3); }}
              >
                <span className={styles.cardArt}><PushButtonIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Startknop</span>
                  <span className={styles.cardSub}>Keyless — sleutel blijft in uw zak</span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={startType === 'key'}
                className={`${styles.card} ${startType === 'key' ? styles.cardOn : ''}`}
                onClick={() => { setStartType('key'); go(3); }}
              >
                <span className={styles.cardArt}><TurnKeyIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Sleutel omdraaien</span>
                  <span className={styles.cardSub}>Sleutel in het contactslot</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── 3. Remote buttons ── */}
        {step === 3 && (
          <div className={stepClass} key="s3">
            <h3 className={styles.q}>Zitten er knoppen op uw sleutel?</h3>
            <p className={styles.hint}>
              Bedoeld zijn de knoppen voor openen en sluiten op afstand.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Knoppen op de sleutel">
              <button
                type="button"
                role="radio"
                aria-checked={remote === 'yes'}
                className={`${styles.card} ${remote === 'yes' ? styles.cardOn : ''}`}
                onClick={() => { setRemote('yes'); go(4); }}
              >
                <span className={styles.cardArt}><RemoteYesIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Ja, met knoppen</span>
                  <span className={styles.cardSub}>Centrale vergrendeling</span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={remote === 'no'}
                className={`${styles.card} ${remote === 'no' ? styles.cardOn : ''}`}
                onClick={() => { setRemote('no'); go(4); }}
              >
                <span className={styles.cardArt}><RemoteNoIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Nee, geen knoppen</span>
                  <span className={styles.cardSub}>Alleen een sleutelbaard</span>
                </span>
              </button>
            </div>
          </div>
        )}

        
        {/* ── 4. Werkende sleutel ── */}
        {step === 4 && (
          <div className={stepClass} key="s4">
            <h3 className={styles.q}>Heeft u nog een werkende sleutel?</h3>
            <p className={styles.hint}>
              Als u alle sleutels kwijt bent, moeten wij de auto openen zonder schade en een nieuwe sleutel vanaf nul inleren.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Heeft u nog een werkende sleutel">
              <button
                type="button"
                role="radio"
                aria-checked={workingKey === 'yes'}
                className={`${styles.card} ${workingKey === 'yes' ? styles.cardOn : ''}`}
                onClick={() => { setWorkingKey('yes'); go(5); }}
              >
                <span className={styles.cardArt}><RemoteYesIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Ja, ik heb een sleutel</span>
                  <span className={styles.cardSub}>Ik wil een extra reservesleutel</span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={workingKey === 'no'}
                className={`${styles.card} ${workingKey === 'no' ? styles.cardOn : ''}`}
                onClick={() => { setWorkingKey('no'); go(5); }}
              >
                <span className={styles.cardArt}><RemoteNoIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Nee, alles is kwijt</span>
                  <span className={styles.cardSub}>Ik heb een compleet nieuwe nodig</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── 5. Contact ── */}
        {step === 5 && (
          <form className={stepClass} key="s5" onSubmit={submit}>
            <h3 className={styles.q}>Waar mogen wij naartoe komen?</h3>
            <p className={styles.hint}>
              U krijgt direct de exacte prijs en aankomsttijd via WhatsApp.
            </p>

            {limit.status !== 'ok' && (
              <div
                className={
                  limit.status === 'unavailable' ? styles.limitBlock : styles.limitWarn
                }
                role="alert"
              >
                <strong className={styles.limitTitle}>{limit.title}</strong>
                <span className={styles.limitDetail}>{limit.detail}</span>
              </div>
            )}

            {/*
              * No price when we cannot do the job. A "richtprijs" beside a
              * notice saying we cannot help is the kind of mixed message that
              * gets someone to send the form anyway.
              */}
            {limit.status !== 'unavailable' && (
            <div className={styles.quote}>
              <div className={styles.quoteLabel}>Richtprijs — {quote.service}</div>
              <div className={styles.quoteAmount}>vanaf €{quote.from}</div>
              <div className={styles.quoteNote}>
                {vehicle
                  ? `Voor uw ${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar}). `
                  : ''}
                De exacte prijs bevestigen wij vooraf — nooit achteraf.
                {limit.status === 'lead-time' && ` Levertijd ${limit.lead}.`}
              </div>
            </div>
            )}

            <div className={styles.fields}>
              <div className={styles.row2}>
                <label className={styles.field}>
                  <span className={styles.label}>Postcode</span>
                  <input
                    className={styles.input}
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="1011 AB"
                    autoComplete="postal-code"
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Telefoonnummer</span>
                  <input
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 1234 5678"
                    type="tel"
                    autoComplete="tel"
                    required
                  />
                </label>
              </div>
            </div>

            {/* Honeypot — hidden from people, tempting to bots. */}
            <input
              type="text"
              name="company"
              className={styles.hp}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <button type="submit" className={styles.cta} disabled={sending}>
              {sending ? 'Versturen…' : 'Ontvang prijs & aankomsttijd'}
            </button>
          </form>
        )}
        {step === 'success' && (
          <div className={styles.successState} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Aanvraag Ontvangen!</h3>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>Bedankt voor uw aanvraag. We bellen u binnen 5 minuten met de exacte prijs en beschikbaarheid.</p>
          </div>
        )}
      </div>
    </div>
  );
}
