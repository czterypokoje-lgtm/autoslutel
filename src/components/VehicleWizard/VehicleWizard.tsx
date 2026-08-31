'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './VehicleWizard.module.css';
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

/**
 * Four-step booking wizard for the hero.
 *
 * Replaces a six-field form (make, model, year, service, phone, city) with
 * four one-decision screens. The reasoning: a driver standing next to a locked
 * car knows the licence plate by heart but often not the exact trim or year,
 * so the plate plus an RDW lookup removes three fields and a moment of doubt.
 *
 * The two icon questions are not filler — together they determine the key type
 * and therefore the price, which lets the last step show a real figure instead
 * of asking for a phone number in exchange for nothing.
 *
 * Anyone without a Dutch plate (foreign car, helping a friend) can skip
 * straight to the plain form via the escape link, so the lookup never becomes
 * a dead end.
 */

type StartType = 'push' | 'key';
type RemoteType = 'yes' | 'no';

interface Vehicle {
  merk: string;
  model: string;
  bouwjaar: string;
}

interface Props {
  /** Rendered when the visitor says they do not have a plate to hand. */
  fallback?: React.ReactNode;
  city?: string;
}

const TOTAL_STEPS = 4;

/** Key type follows from the two icon answers, and the price follows from that. */
function quoteFor(start: StartType | null, remote: RemoteType | null) {
  if (start === 'push') {
    return {
      service: 'Smart key / keyless bijmaken',
      from: SITE_CONFIG.prices.smartKey,
    };
  }
  if (remote === 'yes') {
    return {
      service: 'Afstandsbediening-sleutel bijmaken',
      from: SITE_CONFIG.prices.remote,
    };
  }
  return {
    service: 'Transpondersleutel bijmaken',
    from: SITE_CONFIG.prices.transponder,
  };
}

export default function VehicleWizard({ fallback, city = '' }: Props) {
  const [step, setStep] = useState(1);
  const [goingBack, setGoingBack] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const [kenteken, setKenteken] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lookupState, setLookupState] = useState<'idle' | 'busy' | 'fail'>('idle');

  const [startType, setStartType] = useState<StartType | null>(null);
  const [remote, setRemote] = useState<RemoteType | null>(null);

  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState(city);
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);

  const lastLookup = useRef('');

  const go = useCallback((next: number) => {
    setGoingBack(next < step);
    setStep(next);
  }, [step]);

  const plateDigits = kenteken.replace(/[^A-Za-z0-9]/g, '');

  /**
   * RDW lookup. Never blocks progress: a failure or a timeout just means the
   * vehicle box stays empty and the visitor carries on.
   */
  const lookup = useCallback(async () => {
    const q = plateDigits.toUpperCase();
    if (q.length < 4 || q === lastLookup.current) return;
    lastLookup.current = q;
    setLookupState('busy');
    try {
      const res = await fetch(`/api/kenteken?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success && json.data?.merk) {
        setVehicle({
          merk: json.data.merk,
          model: json.data.model,
          bouwjaar: json.data.bouwjaar,
        });
        setLookupState('idle');
      } else {
        setVehicle(null);
        setLookupState('fail');
      }
    } catch {
      setVehicle(null);
      setLookupState('fail');
    }
  }, [plateDigits]);

  /**
   * Look the plate up while the visitor is still typing, rather than only on
   * blur. A Dutch plate is six characters, so as soon as six are entered we
   * have enough to ask. This matters because the confirmation ("SKODA FABIA,
   * 2022") is the moment that earns trust — waiting for blur means anyone who
   * taps "Verder" straight away never sees it.
   */
  useEffect(() => {
    if (plateDigits.length < 6) return;
    const t = setTimeout(() => { void lookup(); }, 450);
    return () => clearTimeout(t);
  }, [plateDigits, lookup]);

  const quote = quoteFor(startType, remote);

  function buildWhatsAppUrl() {
    const lines = [
      'Hallo Autosleutel24!',
      '',
      `Kenteken: ${kenteken || 'niet ingevuld'}`,
      vehicle ? `Auto: ${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar})` : null,
      `Sleuteltype: ${quote.service}`,
      postcode ? `Postcode: ${postcode}` : null,
      phone ? `Telefoon: ${phone}` : null,
      '',
      'Graag hoor ik de prijs en de aankomsttijd.',
    ].filter(Boolean);
    return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const cookie = (name: string) => {
      const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return m ? m[2] : null;
    };

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: vehicle?.merk || 'Onbekend',
        model: vehicle ? `${kenteken} — ${vehicle.model}` : kenteken,
        year: vehicle?.bouwjaar || '',
        service: quote.service,
        location: postcode,
        postcode,
        phone,
        source: 'hero_wizard',
        company: honeypot,
        gclid: cookie('gclid'),
        wbraid: cookie('wbraid'),
        gbraid: cookie('gbraid'),
      }),
      keepalive: true,
    }).catch((err) => console.error('Error saving lead', err));

    // Synchronous, inside the click's call stack — a setTimeout here would be
    // treated as an unrequested popup and silently blocked on iOS Safari.
    const win = window.open(buildWhatsAppUrl(), '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = buildWhatsAppUrl();
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

        {/* ── 4. Contact ── */}
        {step === 4 && (
          <form className={stepClass} key="s4" onSubmit={submit}>
            <h3 className={styles.q}>Waar mogen wij naartoe komen?</h3>
            <p className={styles.hint}>
              U krijgt direct de exacte prijs en aankomsttijd via WhatsApp.
            </p>

            <div className={styles.quote}>
              <div className={styles.quoteLabel}>Richtprijs — {quote.service}</div>
              <div className={styles.quoteAmount}>vanaf €{quote.from}</div>
              <div className={styles.quoteNote}>
                {vehicle
                  ? `Voor uw ${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar}). `
                  : ''}
                De exacte prijs bevestigen wij vooraf — nooit achteraf.
              </div>
            </div>

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
      </div>
    </div>
  );
}
