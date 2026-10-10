import React from 'react';
import { breadcrumbSchema } from '@/utils/schema';
import type { Metadata } from 'next';
import { SITE_CONFIG, isUstIdConfigured, isReady } from '@/config/site.config';

/**
 * Allgemeine Geschäftsbedingungen.
 *
 * Nur mobiler Autoschlüssel-Service — auf dieser Domain gibt es keinen
 * Webshop, also betrifft jede Klausel hier den Einsatz vor Ort: Identität,
 * Preis, Vertragsschluss, Gewährleistung, Haftung, Beschwerden.
 *
 * WAS GEGENÜBER DER NIEDERLÄNDISCHEN FASSUNG ANDERS IST
 *
 * Nicht übersetzt, sondern ersetzt — das sind die Stellen, an denen eine
 * Übersetzung rechtlich falsch geworden wäre:
 *
 *  - Der Steuersatz. Die niederländische Fassung las VAT_RATE aus
 *    lib/catalog.ts, und der stand auf 21 % — dem niederländischen Satz. Auf
 *    einer deutschen Seite ist das eine falsche Angabe in den AGB. Der Satz
 *    kommt jetzt aus site.config.ts (19 %), wo auch die Preise ihn lesen.
 *  - Das Widerrufsrecht. Niederländisches Recht kennt BW 6:230m, deutsches
 *    § 312g BGB; der Fernabsatzvertrag entsteht auch hier am Telefon oder per
 *    WhatsApp, und das Widerrufsrecht von 14 Tagen gilt. Für den Notdienst
 *    ist die Ausnahme in § 356 Abs. 4 BGB entscheidend: beginnt die Arbeit auf
 *    ausdrücklichen Wunsch vor Ablauf der Frist und wird sie vollständig
 *    erbracht, erlischt das Widerrufsrecht. Deshalb steht hier, dass der
 *    Partner diese Zustimmung vor Beginn einholt.
 *  - Gewährleistung. BW 7:17 wird zu §§ 434 ff. BGB, mit den zwei Jahren,
 *    die das Gesetz vorsieht; unsere eigene Garantie von zwölf Monaten tritt
 *    daneben und nicht an ihre Stelle.
 *  - Recht und Gerichtsstand: deutsches Recht statt niederländischem.
 *  - Der Identitätsnachweis. Das Kennzeichen beweist in Deutschland nichts
 *    (kein öffentliches Register), also die Zulassungsbescheinigung Teil I.
 *
 * WICHTIG: Dieser Text ist von keinem Anwalt geprüft. Vor dem Start von einem
 * Fachanwalt für IT- oder Verbraucherrecht durchsehen lassen — insbesondere
 * die Widerrufsbelehrung, die formale Anforderungen hat, die ein Absatz in
 * einer AGB-Seite allein nicht erfüllt.
 */

const VAT_PERCENT = SITE_CONFIG.vat.rate;

export const metadata: Metadata = {
  title: { absolute: `AGB | ${SITE_CONFIG.name}` },
  description: `Die Bedingungen, unter denen ${SITE_CONFIG.fullName} einen Autoschlüssel vor Ort anfertigt oder ein Fahrzeug öffnet: Preis, Zahlung, Gewährleistung, Widerruf und Haftung.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/agb` },
};

const h2: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 800,
  color: '#0f172a',
  margin: '2.25rem 0 0.6rem',
};

const p: React.CSSProperties = { color: '#334155', lineHeight: 1.7, margin: '0 0 1rem' };

export default function TermsPage() {
  return (
    <main style={{ background: '#fff' }}>
      <script id="bc-agb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'AGB', path: '/agb' }])) }} />
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)' }}>
          Allgemeine Geschäftsbedingungen
        </h1>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 5rem' }}>
        <h2 style={{ ...h2, marginTop: 0 }}>1. Wer wir sind</h2>
        <p style={p}>
          {SITE_CONFIG.fullName}
          {isReady(SITE_CONFIG.legalForm) && <> ({SITE_CONFIG.legalForm})</>}, mobiler
          Autoschlüssel-Service, tätig in {SITE_CONFIG.serviceAreaString}.
          <br />
          E-Mail: {SITE_CONFIG.email} · Telefon: {SITE_CONFIG.phone}
          {isReady(SITE_CONFIG.hrb) && (
            <>
              <br />
              Registernummer: {SITE_CONFIG.hrb}
            </>
          )}
          {isUstIdConfigured() && (
            <>
              <br />
              Umsatzsteuer-Identifikationsnummer: {SITE_CONFIG.ustId}
            </>
          )}
          <br />
          Die vollständigen Angaben nach § 5 DDG stehen im{' '}
          <a href="/impressum" style={{ color: '#b93c20' }}>Impressum</a>.
        </p>

        <h2 style={h2}>2. Geltungsbereich</h2>
        <p style={p}>
          Diese Bedingungen gelten für jeden Auftrag an einen unserer Partnerbetriebe. Weicht etwas
          davon ab, halten wir das schriftlich fest; die abweichende Abrede gilt dann vor diesen
          Bedingungen.
        </p>
        <p style={p}>
          {SITE_CONFIG.fullName} ist ein Netzwerk selbstständiger Fachbetriebe. Wir nehmen Ihre
          Anfrage auf, nennen den Festpreis und sind Ihr Vertragspartner; die Arbeit am Fahrzeug
          führt ein selbstständiger Partnerbetrieb aus. Welcher das ist, nennen wir Ihnen auf
          Wunsch.
        </p>

        <h2 style={h2}>3. Preise</h2>
        <p style={p}>
          Alle Preise sind in Euro und <strong>Bruttopreise inklusive {VAT_PERCENT} % Mehrwertsteuer</strong>,
          wie es die Preisangabenverordnung gegenüber Verbrauchern verlangt. Sie hören den Festpreis,
          bevor der Partner losfährt. Der vereinbarte Betrag ist der Betrag, der abgerechnet wird —
          es kommt nichts hinzu, auch kein Zuschlag für Abend, Nacht, Wochenende oder Feiertag, und
          die Anfahrt ist enthalten.
        </p>

        <h2 style={h2}>4. Vertragsschluss</h2>
        <p style={p}>
          Der Vertrag kommt zustande, sobald wir Ihren Auftrag bestätigen. Stellt sich heraus, dass
          ein genannter Preis durch einen offensichtlichen Fehler unrichtig war, teilen wir das vor
          Beginn der Arbeit mit; an den fehlerhaften Preis sind Sie dann nicht gebunden.
        </p>

        <h2 style={h2}>5. Widerrufsrecht</h2>
        <p style={p}>
          Weil der Auftrag in der Regel am Telefon oder per WhatsApp zustande kommt, ist er ein
          Fernabsatzvertrag. Als Verbraucher haben Sie das Recht, binnen 14 Tagen ohne Angabe von
          Gründen zu widerrufen (§ 312g BGB). Die Erklärung genügt in Textform an{' '}
          {SITE_CONFIG.email}.
        </p>
        <p style={p}>
          Für einen Noteinsatz gilt eine gesetzliche Ausnahme, auf die wir ausdrücklich hinweisen:
          Verlangen Sie, dass die Arbeit noch innerhalb der Widerrufsfrist beginnt, und wird sie
          vollständig erbracht, erlischt das Widerrufsrecht mit der vollständigen Erbringung
          (§ 356 Abs. 4 BGB). Genau deshalb holt der Partner diese Zustimmung ein, bevor er
          anfängt — wer vor einem verschlossenen Auto steht, möchte in der Regel nicht 14 Tage
          warten.
        </p>

        <h2 style={h2}>6. Gewährleistung und Garantie</h2>
        <p style={p}>
          Es gilt die gesetzliche Gewährleistung nach §§ 434 ff. BGB mit zwei Jahren. Darüber
          hinaus geben wir <strong>12 Monate Garantie</strong> auf unsere Arbeit und die gelieferte
          Elektronik. Diese Garantie ist eine freiwillige Zusage und tritt neben Ihre gesetzlichen
          Rechte, nicht an deren Stelle — sie verkürzt die Gewährleistung also nicht.
        </p>

        <h2 style={h2}>7. Arbeit an Ihrem Fahrzeug</h2>
        <p style={p}>
          Unsere Partner arbeiten an einem Fahrzeug nur, wenn Sie nachweisen können, dass Sie der
          Halter sind oder dazu bevollmächtigt wurden. Wir verlangen dafür Ihren Personalausweis
          oder Pass und die Zulassungsbescheinigung Teil I. Ohne diesen Nachweis wird kein Fahrzeug
          geöffnet und kein Schlüssel angelernt — auch nicht im Notfall. Das ist keine Formalität:
          es ist der Grund, warum sich ein Dritter für Ihr Auto bei uns keinen Schlüssel machen
          lassen kann.
        </p>
        <p style={p}>
          Für das Anlernen eines Schlüssels wird mit der Elektronik Ihres Fahrzeugs gearbeitet. Für
          Mängel, die dort bereits bestanden, und für Folgeschäden durch eine Störung, die mit
          unserer Arbeit nicht zusammenhängt, haften wir nicht.
        </p>

        <h2 style={h2}>8. Haftung</h2>
        <p style={p}>
          Bei leichter Fahrlässigkeit ist unsere Haftung auf den Betrag des jeweiligen Auftrags
          begrenzt. Diese Begrenzung gilt nicht bei Vorsatz und grober Fahrlässigkeit, nicht bei
          der Verletzung von Leben, Körper oder Gesundheit, nicht bei der Verletzung wesentlicher
          Vertragspflichten und nicht, soweit das Gesetz zwingend etwas anderes bestimmt.
        </p>

        <h2 style={h2}>9. Beschwerden, Recht und Gerichtsstand</h2>
        <p style={p}>
          Melden Sie eine Beschwerde zeitnah an {SITE_CONFIG.email}. Wir antworten innerhalb von
          zwei Werktagen. Es gilt deutsches Recht. Kommen wir gemeinsam nicht weiter, steht Ihnen
          der Weg zum zuständigen Gericht offen. Wir sind nicht verpflichtet und nicht bereit, an
          einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <p style={{ ...p, marginTop: '2.5rem', fontSize: '.9rem', color: '#64748b' }}>
          Stand: Oktober 2026. Diese Bedingungen sind anwaltlich nicht geprüft; insbesondere die
          Widerrufsbelehrung sollte vor dem Start von einem Fachanwalt durchgesehen werden.
        </p>
      </div>
    </main>
  );
}
