'use client';

declare global {
  interface Window {
    dataLayer?: unknown[];
    uetq?: unknown[];
  }
}

import { reportLeadConversion } from '@/lib/leadTracking';
import { tagLeadClaritySession } from '@/lib/clarity';

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

/**
 * Booking wizard for the hero. The phone number comes at step 2 and the lead
 * is saved right there; the questions after it only sharpen the quote, so a
 * visitor who stops early is still a lead the office can call.
 *
 * (Originally: four-step booking wizard for the hero.)
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
type WorkingKeyType = 'yes' | 'no';

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

const TOTAL_STEPS = 5;

/** Key type follows from the two icon answers, and the price follows from that. */
function quoteFor(start: StartType | null, remote: RemoteType | null, workingKey: WorkingKeyType | null) {
  if (workingKey === 'no') {
    return {
      service: 'Alle sleutels kwijt (noodaanmaak)',
      from: SITE_CONFIG.prices.allKeysLost,
    };
  }
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
  const [step, setStep] = useState<number | 'success'>(1);
  const [goingBack, setGoingBack] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const [kenteken, setKenteken] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lookupState, setLookupState] = useState<'idle' | 'busy' | 'fail'>('idle');

  const [startType, setStartType] = useState<StartType | null>(null);
  const [remote, setRemote] = useState<RemoteType | null>(null);
  const [workingKey, setWorkingKey] = useState<WorkingKeyType | null>(null);

  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState(city);
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  /* The lead is saved at step 2; the later answers are added to it with this. */
  const [lead, setLead] = useState<{ id: string; token: string } | null>(null);

  const lastLookup = useRef('');

  const go = useCallback((next: number) => {
    setGoingBack(typeof step === 'number' ? typeof step === 'number' && next < step : false);
    setStep(next);
  }, [step]);

  /*
   * One GA4 event per step reached, so the drop-off between steps is visible.
   * Goes through gtag, so Consent Mode decides what leaves the browser.
   */
  useEffect(() => {
    const name = step === 'success' ? 'klaar' : ['kenteken', 'contact', 'start', 'knoppen', 'werkende_sleutel'][(step as number) - 1];
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.('event', 'form_step', { form_name: 'hero_wizard', step_number: step === 'success' ? TOTAL_STEPS + 1 : step, step_name: name });
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
          // RDW often repeats the make in the model ("FIAT PANDA"), which read as "FIAT FIAT PANDA".
          model: String(json.data.model ?? '').replace(new RegExp(`^${String(json.data.merk).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), ''),
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

  const quote = quoteFor(startType, remote, workingKey);

  /*
   * What we can actually do for this car.
   *
   * Shown before the price rather than after it: a visitor who reads "vanaf
   * €249" and only then learns we cannot key their 2016 Mercedes has already
   * cost us the click and is about to cost us the phone call. `workingKey`
   * decides the scenario — no working key is all-keys-lost, which is the
   * harder job and has stricter limits.
   */
  const limit = serviceLimit(
    vehicle?.merk,
    vehicle?.bouwjaar,
    workingKey === 'no' ? 'akl' : 'add-key',
  );

  function buildWhatsAppUrl() {
    const lines = [
      'Hallo Autosleutel24!',
      '',
      `Kenteken: ${kenteken || 'niet ingevuld'}`,
      vehicle ? `Auto: ${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar})` : null,
      `Sleuteltype: ${quote.service}`,
      `Werkende sleutel: ${workingKey === 'yes' ? 'Ja' : 'Nee, alle sleutels kwijt'}`, 
      `Start met: ${startType === 'push' ? 'Startknop' : 'Sleutel in contact'}`,
      postcode ? `Postcode: ${postcode}` : null,
      phone ? `Telefoon: ${phone}` : null,
      '',
      'Graag hoor ik de prijs en de aankomsttijd.',
    ].filter(Boolean);
    return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSaveFailed(false);

    const cookie = (name: string) => {
      const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return m ? m[2] : null;
    };

    /*
     * Awaited, unlike LeadCaptureForm.
     *
     * That form fires and forgets for a stated reason: it opens WhatsApp two
     * statements later and the page can be gone before any promise settles.
     * This wizard copied the pattern without the navigation that justified it
     * — it calls setStep('success') and stays put. So nothing here races a
     * handoff, and there is no second channel either: the success screen
     * promises "de exacte prijs en aankomsttijd via WhatsApp", which only
     * happens if the office has a row to act on. A 429 from the rate limiter
     * or a 500 from the insert used to land on that same screen, and the
     * customer waited for a message nobody could send.
     */
    const post = fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: vehicle?.merk || 'Onbekend',
        model: vehicle ? `${kenteken} — ${vehicle.model}` : kenteken,
        year: vehicle?.bouwjaar || '',
        service: 'Nog te bepalen (aanvraag via kenteken)',
        location: postcode,
        postcode,
        phone,
        source: 'hero_wizard',
        company: honeypot,
        gclid: cookie('gclid'),
        wbraid: cookie('wbraid'),
        gbraid: cookie('gbraid'),
        msclkid: cookie('msclkid'),
      }),
      keepalive: true,
    }).catch(() => null);

    /*
     * Raced against a clock, and deliberately not aborted.
     *
     * /api/leads only answers after it has awaited notifyNewLead() and
     * sendOpenAiEvent(). Resend carries a 10s timeout and sendTelegram
     * carries none, so a sulking Telegram can hold the response open far
     * longer than anyone will stand next to a locked car watching
     * "Versturen…". Before this file awaited anything that cost nobody
     * anything; now it does, so the wait needs a ceiling.
     *
     * An AbortSignal would cancel the request and throw away a lead that was
     * about to be written. So the fetch is left running under keepalive and
     * only the UI gives up: the row still lands, the customer is told to ring
     * rather than wait, and if they do ring, the 72-hour same-phone dedupe in
     * /api/leads flags the second enquiry instead of creating a twin.
     */
    const res = await Promise.race([
      post,
      new Promise<null>((resolve) => { setTimeout(() => resolve(null), 8000); }),
    ]);

    if (!res || !res.ok) {
      /* Say so, and give the phone number: this is the only moment the
         customer can still be told that nobody received the request. */
      console.error('Error saving lead', res ? res.status : 'network');
      setSaveFailed(true);
      setSending(false);
      return;
    }

    const json = await res.json().catch(() => null);
    tagLeadClaritySession(json?.data?.id);
    if (json?.data?.id && json?.data?.token) setLead({ id: json.data.id, token: json.data.token });

    /* Only now — a conversion Google can bid on has to mean a lead the office
       actually has. */
    reportLeadConversion({
      source: 'hero_wizard',
      phone,
      postcode,
    });

    setSending(false);
    go(3);
  }

  /* The answers to the follow-up questions sharpen the lead the office already has. */
  function finish(answer: WorkingKeyType) {
    setWorkingKey(answer);
    const q = quoteFor(startType, remote, answer);
    if (lead) {
      void fetch('/api/leads/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, service: q.service, quotedPrice: Number(q.from) }),
        keepalive: true,
      }).catch(() => null);
    }
    setGoingBack(false);
    setStep('success');
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
            className={`${styles.tick} ${typeof step === 'number' && i < step ? styles.tickDone : ''}`}
          >
            <span className={styles.tickFill} />
          </span>
        ))}
      </div>

      <div className={styles.stepMeta}>
        <span>Stap {step === 'success' ? TOTAL_STEPS : step} van {TOTAL_STEPS}</span>
        {typeof step === 'number' && step > 1 && step !== 3 && (
          <button type="button" className={styles.back} onClick={() => go((step as number) - 1)}>
            Terug
          </button>
        )}
      </div>

      <div className={styles.body}>
        {/* ── 1. Licence plate ── */}
        {step === 1 && (
          <div className={stepClass} key="s1">
            <p className={styles.q}>Wat is uw kenteken?</p>
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

            <button type="button" className={styles.escape} onClick={() => go(2)}>
              Liever direct gebeld? Laat alleen uw nummer achter
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

        {/* ── 2. Contact: the lead is saved here ── */}
        {step === 2 && (
          <form className={stepClass} key="s2" onSubmit={submit}>
            <p className={styles.q}>Waar staat de auto, en op welk nummer bellen wij u?</p>
            <p className={styles.hint}>
              Wij bellen u terug met de prijs en aankomsttijd. Daarna nog 3 korte vragen voor een richtprijs.
            </p>

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

            {saveFailed && (
              <p role="alert" style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', lineHeight: 1.5, color: '#fca5a5' }}>
                Versturen lukte niet — wij hebben uw aanvraag niet ontvangen.
                Probeer het opnieuw of bel ons direct op{' '}
                <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ color: '#fff', textDecoration: 'underline' }}>
                  {SITE_CONFIG.phone}
                </a>
                .
              </p>
            )}

            <button type="submit" className={styles.cta} disabled={sending}>
              {sending ? 'Versturen…' : 'Bel mij terug'}
            </button>
          </form>
        )}
        {/* ── 3. How does the car start ── */}
        {step === 3 && (
          <div className={stepClass} key="s3">
            <p className={styles.saved} role="status">✓ Ontvangen — wij bellen u zo. Wilt u alvast een richtprijs? Nog 3 vragen.</p>
            <p className={styles.q}>Hoe start u uw auto?</p>
            <p className={styles.hint}>
              Hiermee weten wij welk type sleutel u nodig heeft.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Hoe start u uw auto">
              <button
                type="button"
                role="radio"
                aria-checked={startType === 'push'}
                className={`${styles.card} ${startType === 'push' ? styles.cardOn : ''}`}
                onClick={() => { setStartType('push'); go(4); }}
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
                onClick={() => { setStartType('key'); go(4); }}
              >
                <span className={styles.cardArt}><TurnKeyIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Sleutel omdraaien</span>
                  <span className={styles.cardSub}>Sleutel in het contactslot</span>
                </span>
              </button>
            </div>
            <button type="button" className={styles.escape} onClick={() => { setGoingBack(false); setStep('success'); }}>
              Overslaan — bel mij gewoon
            </button>
          </div>
        )}

        {/* ── 4. Remote buttons ── */}
        {step === 4 && (
          <div className={stepClass} key="s4">
            <p className={styles.q}>Zitten er knoppen op uw sleutel?</p>
            <p className={styles.hint}>
              Bedoeld zijn de knoppen voor openen en sluiten op afstand.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Knoppen op de sleutel">
              <button
                type="button"
                role="radio"
                aria-checked={remote === 'yes'}
                className={`${styles.card} ${remote === 'yes' ? styles.cardOn : ''}`}
                onClick={() => { setRemote('yes'); go(5); }}
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
                onClick={() => { setRemote('no'); go(5); }}
              >
                <span className={styles.cardArt}><RemoteNoIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Nee, geen knoppen</span>
                  <span className={styles.cardSub}>Alleen een sleutelbaard</span>
                </span>
              </button>
            </div>
            <button type="button" className={styles.escape} onClick={() => { setGoingBack(false); setStep('success'); }}>
              Overslaan — bel mij gewoon
            </button>
          </div>
        )}

        
        {/* ── 5. Werkende sleutel ── */}
        {step === 5 && (
          <div className={stepClass} key="s5">
            <p className={styles.q}>Heeft u nog een werkende sleutel?</p>
            <p className={styles.hint}>
              Als u alle sleutels kwijt bent, moeten wij de auto openen zonder schade en een nieuwe sleutel vanaf nul inleren.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Heeft u nog een werkende sleutel">
              <button
                type="button"
                role="radio"
                aria-checked={workingKey === 'yes'}
                className={`${styles.card} ${workingKey === 'yes' ? styles.cardOn : ''}`}
                onClick={() => finish('yes')}
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
                onClick={() => finish('no')}
              >
                <span className={styles.cardArt}><RemoteNoIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Nee, alles is kwijt</span>
                  <span className={styles.cardSub}>Ik heb een compleet nieuwe nodig</span>
                </span>
              </button>
            </div>
            <button type="button" className={styles.escape} onClick={() => { setGoingBack(false); setStep('success'); }}>
              Overslaan — bel mij gewoon
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className={styles.successState} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Aanvraag Ontvangen!</h3>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>Bedankt voor uw aanvraag. We bellen u binnen 5 minuten met de exacte prijs en beschikbaarheid.</p>
            {workingKey && (
              <div style={{ textAlign: 'left', marginTop: '1.25rem' }}>
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
  
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
