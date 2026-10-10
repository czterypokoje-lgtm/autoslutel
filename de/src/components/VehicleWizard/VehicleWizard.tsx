'use client';

declare global {
  interface Window {
    dataLayer?: unknown[];
    uetq?: unknown[];
  }
}

import { reportLeadConversion } from '@/lib/leadTracking';
import { tagLeadClaritySession } from '@/lib/clarity';

import React, { useState, useCallback } from 'react';
import styles from './VehicleWizard.module.css';
import { serviceLimit } from '@/lib/serviceLimits';
import { SITE_CONFIG } from '@/config/site.config';
import { BRANDS_LIST } from '@/data/carModels';
import {
  PushButtonIcon,
  TurnKeyIcon,
  RemoteYesIcon,
  RemoteNoIcon,
  PhoneIcon,
  WhatsAppIcon,
} from './icons';

/**
 * Der Assistent im Hero: fünf Schritte mit je einer Entscheidung.
 *
 * Statt eines Formulars mit sechs Feldern (Marke, Modell, Baujahr, Leistung,
 * Telefon, Ort) fünf Bildschirme mit je einer Frage. Die Begründung: wer neben
 * einem verschlossenen Auto steht, kennt sein Kennzeichen auswendig, aber oft
 * nicht die genaue Ausstattung.
 *
 * DIE EINE ÄNDERUNG GEGENÜBER DER NIEDERLÄNDISCHEN FASSUNG
 *
 * Dort fragt Schritt 1 nur das Kennzeichen und holt Marke, Modell und Baujahr
 * automatisch beim RDW — dem offenen niederländischen Fahrzeugregister. Der
 * Satz "Wij halen merk, model en bouwjaar automatisch op" ist dort wahr und
 * der Grund, warum der Schritt überhaupt funktioniert.
 *
 * In Deutschland gibt es dieses Register nicht. Das Kraftfahrt-Bundesamt gibt
 * Fahrzeug- und Halterdaten nicht an Dritte heraus; es existiert keine
 * Abfrage, die wir für den Besucher machen könnten. Den Aufruf einfach stehen
 * zu lassen, wäre doppelt falsch gewesen: das Versprechen wird gebrochen, und
 * das Kennzeichen eines deutschen Besuchers wäre an eine niederländische
 * Behörde geschickt worden.
 *
 * Also: das Kennzeichenfeld bleibt — es ist die erkennbare Form dieses
 * Abschnitts, und ein deutscher Fahrer kennt sein Kennzeichen — aber es wird
 * als Text aufgenommen und an die Anfrage angehängt. Marke und Baujahr fragen
 * wir dort, wo vorher die Bestätigung stand: zwei Auswahlfelder, gefüllt aus
 * demselben Markenverzeichnis wie der Rest der Seite. Das ist ein Tippen mehr
 * als in den Niederlanden und immer noch weniger als die sechs Felder, die es
 * ersetzt — und es liefert bessere Daten, weil die Auswahl des Fahrers
 * stimmt, wo ein Register nur die Erstzulassung kennt.
 *
 * Die beiden Icon-Fragen sind kein Füllmaterial: zusammen bestimmen sie die
 * Schlüsselart und damit den Preis, sodass der letzte Schritt eine echte Zahl
 * zeigen kann, statt eine Telefonnummer für nichts zu verlangen.
 *
 * Wer kein Kennzeichen zur Hand hat, springt über den Ausweichlink direkt ins
 * einfache Formular.
 */

type StartType = 'push' | 'key';
type RemoteType = 'yes' | 'no';
type WorkingKeyType = 'yes' | 'no';

interface Props {
  /** Wird gezeigt, wenn der Besucher sagt, er habe sein Kennzeichen nicht zur Hand. */
  fallback?: React.ReactNode;
  city?: string;
}

const TOTAL_STEPS = 5;

/** Die Jahre, die zur Auswahl stehen. OLDEST_YEAR in serviceLimits.ts ist 2000. */
const YEARS = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

/** Die Schlüsselart folgt aus den beiden Icon-Antworten, der Preis aus ihr. */
function quoteFor(start: StartType | null, remote: RemoteType | null, workingKey: WorkingKeyType | null) {
  if (workingKey === 'no') {
    return {
      service: 'Alle Schlüssel verloren (Notanfertigung)',
      from: SITE_CONFIG.prices.allKeysLost,
    };
  }
  if (start === 'push') {
    return {
      service: 'Keyless Go / Smart Key anfertigen',
      from: SITE_CONFIG.prices.smartKey,
    };
  }
  if (remote === 'yes') {
    return {
      service: 'Funkschlüssel anfertigen',
      from: SITE_CONFIG.prices.remote,
    };
  }
  return {
    service: 'Transponderschlüssel anfertigen',
    from: SITE_CONFIG.prices.transponder,
  };
}

export default function VehicleWizard({ fallback, city = '' }: Props) {
  const [step, setStep] = useState<number | 'success'>(1);
  const [goingBack, setGoingBack] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const [kennzeichen, setKennzeichen] = useState('');
  const [marke, setMarke] = useState('');
  const [baujahr, setBaujahr] = useState('');

  const [startType, setStartType] = useState<StartType | null>(null);
  const [remote, setRemote] = useState<RemoteType | null>(null);
  const [workingKey, setWorkingKey] = useState<WorkingKeyType | null>(null);

  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState(city);
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);

  const go = useCallback((next: number) => {
    setGoingBack(typeof step === 'number' ? next < step : false);
    setStep(next);
  }, [step]);

  /*
   * Hier stand ein Debounce-Effekt, der das Kennzeichen beim Tippen an
   * /api/kenteken schickte, sobald sechs Zeichen eingegeben waren. Der
   * Endpunkt ist ein Proxy auf das niederländische RDW-Register; mit einem
   * deutschen Kennzeichen hätte er nie etwas gefunden, und jede Eingabe wäre
   * an eine niederländische Behörde gegangen. Entfernt — siehe den Dateikopf.
   */

  const quote = quoteFor(startType, remote, workingKey);

  /*
   * Was wir für dieses Fahrzeug tatsächlich tun können.
   *
   * Steht vor dem Preis und nicht dahinter: wer "ab 249 €" liest und erst
   * danach erfährt, dass wir seinen Mercedes von 2016 nicht anlernen können,
   * hat uns den Klick gekostet und kostet gleich noch das Telefonat.
   * workingKey entscheidet das Szenario — ohne funktionierenden Schlüssel ist
   * es der schwerere Fall mit den strengeren Grenzen.
   *
   * Marke und Baujahr kommen jetzt aus der Auswahl des Besuchers statt aus
   * einer Registerabfrage. Für diese Prüfung ist das die bessere Quelle: das
   * Register kennt die Erstzulassung, der Fahrer kennt sein Auto.
   */
  const limit = serviceLimit(marke || undefined, baujahr || undefined, workingKey === 'no' ? 'akl' : 'add-key');

  /*
   * Hier stand buildWhatsAppUrl(): baute eine WhatsApp-Nachricht mit allen
   * Angaben des Assistenten. Schon auf der niederländischen Seite rief sie
   * niemand auf — die WhatsApp-Schaltfläche oben geht auf /whatsapp, das die
   * Weiterleitung samt Anzeigen-Zuordnung übernimmt. Entfernt statt
   * mitübersetzt: toter Code, der aussieht wie eine Funktion, ist schlimmer
   * als keiner, weil beim nächsten Lesen jemand glaubt, dieser Weg existiere.
   *
   * Wird die Nachricht gebraucht, gehört sie in /whatsapp, wo der Rest der
   * WhatsApp-Logik liegt.
   */

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
        brand: marke || 'Unbekannt',
        /* Das Kennzeichen reist im Modellfeld mit: die Tabelle hat keine
           eigene Spalte dafür, und das Büro liest dieses Feld ohnehin. */
        model: kennzeichen || '',
        year: baujahr || '',
        service: quote.service,
        workingKey: workingKey === 'yes' ? 'Ja' : 'Nein',
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
    })
      .then((r) => r.json())
      .then((d) => tagLeadClaritySession(d?.data?.id))
      .catch((err) => console.error('Error saving lead', err));

    reportLeadConversion({
      source: 'hero_wizard',
      phone,
      postcode,
    });

    setStep('success');
    setSending(false);
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  const stepClass = goingBack ? styles.stepBack : styles.step;

  return (
    <div className={styles.shell}>
      {/* Wer wirklich ausgeschlossen ist, ruft an und füllt kein Formular aus.
          Beide Wege stehen deshalb über dem Assistenten und nicht darunter. */}
      <div className={styles.urgent}>
        <a
          href={`tel:${SITE_CONFIG.phoneTel}`}
          className={`${styles.urgentBtn} ${styles.callBtn}`}
          id="wizard-call"
        >
          <PhoneIcon /> Jetzt anrufen
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
        <span>Schritt {step === 'success' ? TOTAL_STEPS : step} von {TOTAL_STEPS}</span>
        {typeof step === 'number' && step > 1 && (
          <button type="button" className={styles.back} onClick={() => go((step as number) - 1)}>
            Zurück
          </button>
        )}
      </div>

      <div className={styles.body}>
        {/* ── 1. Kennzeichen, Marke und Baujahr ── */}
        {step === 1 && (
          <div className={stepClass} key="s1">
            <p className={styles.q}>Welches Fahrzeug ist es?</p>
            {/*
              * Der Hinweis sagt NICHT, dass wir Marke und Baujahr automatisch
              * holen. Auf der niederländischen Seite steht genau das, und dort
              * stimmt es; hier gibt es kein öffentliches Register, das man
              * abfragen könnte. Siehe den Dateikopf.
              */}
            <p className={styles.hint}>
              Das Kennzeichen hilft uns beim Zuordnen vor Ort. Marke und Baujahr brauchen wir,
              um Ihnen den Festpreis nennen zu können — beides steht in Ihrer
              Zulassungsbescheinigung Teil I.
            </p>

            <div className={styles.plateWrap}>
              <span className={styles.euBand} aria-hidden="true">
                <span>★</span>
                <span>D</span>
              </span>
              <input
                className={styles.plateInput}
                value={kennzeichen}
                onChange={(e) => setKennzeichen(e.target.value.toUpperCase())}
                placeholder="B-AB 1234"
                maxLength={12}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-label="Kennzeichen"
                inputMode="text"
              />
            </div>

            {/*
              * Wo auf der niederländischen Seite die Bestätigung aus dem
              * Register erscheint ("SKODA FABIA, 2022"), stehen hier zwei
              * Auswahlfelder. Dieselbe Stelle, dieselbe Rolle: sie sagen dem
              * Besucher, dass wir sein Auto kennen — nur weiß es hier er und
              * nicht eine Behörde.
              */}
            <div className={styles.vehiclePick}>
              <label className={styles.field}>
                <span className={styles.label}>Marke</span>
                <select
                  className={styles.input}
                  value={marke}
                  onChange={(e) => setMarke(e.target.value)}
                  aria-label="Marke"
                >
                  <option value="">Marke wählen…</option>
                  {BRANDS_LIST.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Baujahr</span>
                <select
                  className={styles.input}
                  value={baujahr}
                  onChange={(e) => setBaujahr(e.target.value)}
                  aria-label="Baujahr"
                >
                  <option value="">Baujahr wählen…</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              className={styles.cta}
              disabled={!marke}
              onClick={() => go(2)}
            >
              Weiter
            </button>

            {fallback && (
              <button
                type="button"
                className={styles.escape}
                onClick={() => setShowFallback(true)}
              >
                Ich habe die Angaben nicht zur Hand
              </button>
            )}
          </div>
        )}

        {/* ── 2. How does the car start ── */}
        {step === 2 && (
          <div className={stepClass} key="s2">
            <p className={styles.q}>Wie starten Sie Ihr Auto?</p>
            <p className={styles.hint}>
              Daran erkennen wir, welche Schlüsselart Sie brauchen.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Wie starten Sie Ihr Auto">
              <button
                type="button"
                role="radio"
                aria-checked={startType === 'push'}
                className={`${styles.card} ${startType === 'push' ? styles.cardOn : ''}`}
                onClick={() => { setStartType('push'); go(3); }}
              >
                <span className={styles.cardArt}><PushButtonIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Startknopf</span>
                  <span className={styles.cardSub}>Keyless Go — der Schlüssel bleibt in der Tasche</span>
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
                  <span className={styles.cardLabel}>Schlüssel drehen</span>
                  <span className={styles.cardSub}>Schlüssel steckt im Zündschloss</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── 3. Remote buttons ── */}
        {step === 3 && (
          <div className={stepClass} key="s3">
            <p className={styles.q}>Hat Ihr Schlüssel Tasten?</p>
            <p className={styles.hint}>
              Gemeint sind die Tasten zum Ver- und Entriegeln aus der Entfernung.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Tasten am Schlüssel">
              <button
                type="button"
                role="radio"
                aria-checked={remote === 'yes'}
                className={`${styles.card} ${remote === 'yes' ? styles.cardOn : ''}`}
                onClick={() => { setRemote('yes'); go(4); }}
              >
                <span className={styles.cardArt}><RemoteYesIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Ja, mit Tasten</span>
                  <span className={styles.cardSub}>Zentralverriegelung per Funk</span>
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
                  <span className={styles.cardLabel}>Nein, keine Tasten</span>
                  <span className={styles.cardSub}>Nur das Schlüsselblatt</span>
                </span>
              </button>
            </div>
          </div>
        )}

        
        {/* ── 4. Funktionierender Schlüssel ── */}
        {step === 4 && (
          <div className={stepClass} key="s4">
            <p className={styles.q}>Haben Sie noch einen funktionierenden Schlüssel?</p>
            <p className={styles.hint}>
              Sind alle Schlüssel weg, müssen wir das Fahrzeug schadenfrei öffnen und einen neuen
              Schlüssel von null an der Wegfahrsperre anlernen — mehr Arbeit, anderer Preis.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Haben Sie noch einen funktionierenden Schlüssel">
              <button
                type="button"
                role="radio"
                aria-checked={workingKey === 'yes'}
                className={`${styles.card} ${workingKey === 'yes' ? styles.cardOn : ''}`}
                onClick={() => { setWorkingKey('yes'); go(5); }}
              >
                <span className={styles.cardArt}><RemoteYesIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Ja, einen habe ich</span>
                  <span className={styles.cardSub}>Ich möchte einen Zweitschlüssel</span>
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
                  <span className={styles.cardLabel}>Nein, alle sind weg</span>
                  <span className={styles.cardSub}>Ich brauche einen komplett neuen</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── 5. Contact ── */}
        {step === 5 && (
          <form className={stepClass} key="s5" onSubmit={submit}>
            <p className={styles.q}>Wohin sollen wir kommen?</p>
            <p className={styles.hint}>
              Sie hören den Festpreis und ein Zeitfenster, bevor jemand losfährt.
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
              * Kein Preis, wenn wir die Arbeit nicht machen können. Ein
              * Richtpreis neben dem Hinweis, dass wir nicht helfen können, ist
              * genau die widersprüchliche Botschaft, die jemanden dazu bringt,
              * das Formular trotzdem abzuschicken.
              */}
            {limit.status !== 'unavailable' && (
            <div className={styles.quote}>
              <div className={styles.quoteLabel}>Richtprijs — {quote.service}</div>
              <div className={styles.quoteAmount}>vanaf €{quote.from}</div>
              <div className={styles.quoteNote}>
                {marke ? `Für Ihren ${marke}${baujahr ? ` (${baujahr})` : ''}. ` : ''}
                Den Festpreis bestätigen wir vorab — nie hinterher.
                {limit.status === 'lead-time' && ` Lieferzeit ${limit.lead}.`}
              </div>
            </div>
            )}

            <div className={styles.fields}>
              <div className={styles.row2}>
                <label className={styles.field}>
                  <span className={styles.label}>Postleitzahl</span>
                  {/* Fünfstellig, deutsches Format. "1011 AB" ist eine
                      niederländische PLZ, und ein Beispiel im falschen Format
                      lässt Leute falsch tippen. */}
                  <input
                    className={styles.input}
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="10115"
                    inputMode="numeric"
                    maxLength={5}
                    pattern="[0-9]{5}"
                    autoComplete="postal-code"
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Telefonnummer</span>
                  <input
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0151 23456789"
                    type="tel"
                    autoComplete="tel"
                    required
                  />
                </label>
              </div>
            </div>

            {/* Honeypot — für Menschen unsichtbar, für Bots verlockend. */}
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
              {sending ? 'Wird gesendet…' : 'Festpreis & Zeitfenster erhalten'}
            </button>
          </form>
        )}
        {step === 'success' && (
          <div className={styles.successState} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Anfrage angekommen</h3>
            {/* Hier stand "We bellen u binnen 5 minuten" — eine Zusage, die bei
                vier Partnern niemand halten kann und die beim ersten Mal
                auffällt, an dem sie nicht stimmt. */}
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>Danke. Wir rufen Sie mit dem Festpreis für Ihr Fahrzeug und einem Zeitfenster zurück. Eilt es? Rufen Sie an — das ist schneller.</p>
          </div>
        )}
      </div>
    </div>
  );
}
