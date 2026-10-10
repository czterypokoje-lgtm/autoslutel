import React from 'react';
import { breadcrumbSchema } from '@/utils/schema';
import type { Metadata } from 'next';
import { SITE_CONFIG, isUstIdConfigured, isReady } from '@/config/site.config';

/**
 * Impressum — § 5 DDG.
 *
 * Für Deutschland keine Fußnote, sondern Pflicht. Ein fehlendes oder
 * unvollständiges Impressum ist der häufigste Abmahngrund überhaupt, und die
 * Angaben müssen "leicht erkennbar, unmittelbar erreichbar und ständig
 * verfügbar" sein — deshalb steht der Link in der Fußzeile jeder Seite.
 *
 * Diese Seite erfindet nichts. Jede Angabe kommt aus site.config.ts, und
 * solange dort ein Platzhalter steht, startet der Build überhaupt nicht
 * (assertSiteReady im Root-Layout). Was hier mit isReady() geprüft wird, sind
 * die Angaben, die nicht für jede Rechtsform gelten: eine
 * Handelsregisternummer hat ein Einzelunternehmen nicht, eine USt-IdNr. hat
 * ein Kleinunternehmer nach § 19 UStG nicht.
 *
 * Vor dem Start von einem Steuerberater oder Anwalt prüfen lassen. Offen ist
 * insbesondere, ob diese Tätigkeit in die Anlage A der Handwerksordnung
 * fällt und damit eine Eintragung bei der Handwerkskammer braucht — das
 * entscheidet, ob hier zusätzlich Kammer, Berufsbezeichnung und
 * berufsrechtliche Regelung stehen müssen (§ 5 Abs. 1 Nr. 5 DDG).
 */

export const metadata: Metadata = {
  title: { absolute: `Impressum | ${SITE_CONFIG.name}` },
  description: `Impressum und Anbieterkennzeichnung nach § 5 DDG für ${SITE_CONFIG.fullName}, mobiler Autoschlüssel-Service in ${SITE_CONFIG.serviceAreaString}.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/impressum` },
  /* Ein Impressum gehört in den Index — es muss auffindbar sein —, aber es
     trägt nichts zum Ranking bei und soll keine Suchanfrage gewinnen. */
  robots: { index: true, follow: true },
};

const h2: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 800,
  color: '#0f172a',
  margin: '2.25rem 0 0.6rem',
};

const p: React.CSSProperties = { color: '#334155', lineHeight: 1.7, margin: '0 0 1rem' };

export default function ImpressumPage() {
  return (
    <main style={{ background: '#fff' }}>
      <script
        id="bc-impressum"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([{ name: 'Impressum', path: '/impressum' }])),
        }}
      />
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)' }}>
          Impressum
        </h1>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 5rem' }}>
        <h2 style={{ ...h2, marginTop: 0 }}>Angaben gemäß § 5 DDG</h2>
        <p style={p}>
          {SITE_CONFIG.fullName}
          {isReady(SITE_CONFIG.legalForm) && <> ({SITE_CONFIG.legalForm})</>}
          <br />
          {SITE_CONFIG.address.street}
          <br />
          {SITE_CONFIG.address.postal} {SITE_CONFIG.address.city}
          <br />
          {SITE_CONFIG.countryName}
        </p>

        <h2 style={h2}>Kontakt</h2>
        <p style={p}>
          Telefon: <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ color: '#f97316' }}>{SITE_CONFIG.phone}</a>
          <br />
          E-Mail: <a href={`mailto:${SITE_CONFIG.email}`} style={{ color: '#f97316' }}>{SITE_CONFIG.email}</a>
        </p>

        {(isReady(SITE_CONFIG.hrb) || isUstIdConfigured()) && (
          <>
            <h2 style={h2}>Registereintrag und Steuernummer</h2>
            <p style={p}>
              {isReady(SITE_CONFIG.registerCourt) && (
                <>
                  Registergericht: {SITE_CONFIG.registerCourt}
                  <br />
                </>
              )}
              {isReady(SITE_CONFIG.hrb) && (
                <>
                  Registernummer: {SITE_CONFIG.hrb}
                  <br />
                </>
              )}
              {isUstIdConfigured() && (
                <>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: {SITE_CONFIG.ustId}</>
              )}
            </p>
          </>
        )}

        <h2 style={h2}>Verantwortlich für den Inhalt</h2>
        <p style={p}>
          Nach § 18 Abs. 2 MStV verantwortlich: {SITE_CONFIG.responsible}
          <br />
          {SITE_CONFIG.address.street}, {SITE_CONFIG.address.postal} {SITE_CONFIG.address.city}
        </p>

        <h2 style={h2}>Was wir tun — und wer vor Ort arbeitet</h2>
        <p style={p}>
          {SITE_CONFIG.fullName} ist ein Netzwerk selbstständiger Fachbetriebe
          für Autoschlüssel. Wir nehmen Ihre Anfrage auf, nennen Ihnen den
          Festpreis und beauftragen den Partnerbetrieb, der zu Ihrem Fahrzeug
          fährt. Vertragspartner für die Leistung und Rechnungsstellung sind
          wir; die Arbeit führt ein selbstständiger Partnerbetrieb aus. Welcher
          das in Ihrem Fall ist, nennen wir Ihnen auf Wunsch jederzeit.
        </p>

        <h2 style={h2}>Verbraucherstreitbeilegung</h2>
        <p style={p}>
          Wir sind nicht verpflichtet und nicht bereit, an einem
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen. Beschwerden richten Sie bitte zuerst an uns — unsere
          Kontaktdaten stehen oben, und wir antworten innerhalb von zwei
          Werktagen.
        </p>

        <h2 style={h2}>Haftung für Inhalte und Links</h2>
        <p style={p}>
          Für die eigenen Inhalte dieser Seiten sind wir nach den allgemeinen
          Gesetzen verantwortlich. Für die Inhalte verlinkter externer Seiten
          ist deren jeweiliger Anbieter verantwortlich; zum Zeitpunkt der
          Verlinkung waren dort keine rechtswidrigen Inhalte erkennbar. Werden
          uns Rechtsverstöße bekannt, entfernen wir den Link.
        </p>

        <h2 style={h2}>Urheberrecht</h2>
        <p style={p}>
          Die Texte und Fotos auf dieser Seite sind urheberrechtlich geschützt.
          Die Arbeitsfotos zeigen Aufträge aus dem Netzwerk; eine Verwendung
          außerhalb dieser Seite bedarf unserer Zustimmung.
        </p>

        <p style={{ ...p, marginTop: '2.5rem', fontSize: '0.9rem', color: '#64748b' }}>
          Weitere Informationen: <a href="/datenschutz" style={{ color: '#f97316' }}>Datenschutzerklärung</a>{' · '}
          <a href="/agb" style={{ color: '#f97316' }}>AGB</a>{' · '}
          <a href="/cookie-richtlinie" style={{ color: '#f97316' }}>Cookie-Richtlinie</a>
        </p>
      </div>
    </main>
  );
}
