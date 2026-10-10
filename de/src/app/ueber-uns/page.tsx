import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG, isReady } from '@/config/site.config';

/*
 * Über uns — und wer vor Ort tatsächlich auftaucht.
 *
 * Die niederländische Fassung dieser Seite hat ein Gesicht und eine Adresse:
 * Berkan Acarol als Chef-Techniker, der jeden Notruf persönlich annimmt, und
 * eine Werkstatt mit Lager in Utrecht, von der aus die Servicefahrzeuge
 * ausfahren. Beides ist dort wahr.
 *
 * Hier ist es nicht wahr, und das ist der Grund, warum diese Seite nicht
 * übersetzt, sondern neu geschrieben ist. In Deutschland fährt ein
 * selbstständiger Partnerbetrieb zum Fahrzeug, mit eigener Technik und
 * eigenem Lager. Zu schreiben, es komme ein bestimmter Techniker aus einer
 * bestimmten Werkstatt, wäre genau die Zusage, an der ein Schlüsseldienst
 * gemessen wird — und die erste, die auffällt, wenn sie nicht stimmt.
 *
 * Drei weitere Mitnahmen sind hier entfernt:
 *
 *  - Die Kennzahl "34 min gemiddelde reactietijd". Sie war schon auf der
 *    niederländischen Seite von Hand getippt und für Deutschland eine
 *    Erfindung. Siehe config/arrival.ts.
 *  - Die Google-Score-Kachel. rating steht auf '0', weil diese Domain noch
 *    keine eigenen Bewertungen hat; die Kachel hätte "0★" gezeigt.
 *  - Der Link zum Bewertungsschreiben trug eine fest eingetragene
 *    Google-Place-ID — die des niederländischen Unternehmensprofils. Ein
 *    deutscher Kunde hätte damit das niederländische Profil bewertet. Der
 *    Link erscheint erst, wenn in site.config.ts ein eigenes Profil steht.
 */

export const metadata: Metadata = {
  title: {
    absolute: `Über ${SITE_CONFIG.name} | Netzwerk für Autoschlüssel`,
  },
  description: `${SITE_CONFIG.fullName} ist ein Netzwerk selbstständiger Fachbetriebe für Autoschlüssel in ${SITE_CONFIG.serviceAreaString}. Wer wir sind, mit welcher Technik gearbeitet wird und wer zu Ihrem Fahrzeug kommt.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/ueber-uns`,
    languages: { 'de-DE': `${SITE_CONFIG.domain}/ueber-uns` },
  },
};

const tools = [
  'Autel IM608 Pro II',
  'VVDI BIMTool Pro',
  'Yanhua Mini ACDP',
  'FC-200 / Hextag',
  'AVDI Abrites',
  'Lonsdor K518',
  'Xhorse Key Tool Plus',
  'BMW ICOM NEXT + ISTA',
  'Magic Motorsport FLEX',
  'Dolphin XP005L CNC',
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Über uns', item: `${SITE_CONFIG.domain}/ueber-uns` },
  ],
};

/*
 * E-E-A-T: die benannte Person hinter dem Netzwerk.
 *
 * jobTitle sagt "Gründer", nicht "Chef-Techniker" — denn genau das ist der
 * Unterschied zur niederländischen Seite: er hat das Netzwerk aufgebaut und
 * entscheidet, wer aufgenommen wird; er fährt nicht zu deutschen Fahrzeugen.
 * Die Zertifizierungen bleiben, weil sie echt sind und sich auf die Technik
 * beziehen, mit der gearbeitet wird.
 */
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_CONFIG.domain}/#gruender`,
  name: 'Berkan Acarol',
  jobTitle: 'Gründer, Autoschlüssel-Techniker',
  description:
    'Autoschlüssel-Techniker mit über zehn Jahren Erfahrung in Fahrzeugsicherung und Schlüsselcodierung. Baut das Partnernetzwerk auf und prüft die Fachbetriebe, die aufgenommen werden.',
  worksFor: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
  knowsAbout: [
    'Autoschlüssel anlernen',
    'Transponderschlüssel',
    'Keyless-Go-Systeme',
    'Wegfahrsperre',
    'Zündschloss reparieren',
    'OBD-Diagnose',
    'Fahrzeugsicherung',
  ],
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Zertifizierung',
      name: 'Autel IM608 Pro II',
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Zertifizierung',
      name: 'AVDI Abrites',
    },
  ],
  url: `${SITE_CONFIG.domain}/ueber-uns`,
};

const h2: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem' };
const body: React.CSSProperties = {
  color: 'var(--gray-700)',
  fontSize: '0.92rem',
  lineHeight: 1.6,
  marginBottom: '0.75rem',
};
const imgStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '340px',
  height: '210px',
  objectFit: 'cover',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  display: 'block',
};
const twoCol: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
  gap: '2.5rem',
  marginBottom: '3.5rem',
  alignItems: 'start',
};

export default function UeberUnsPage() {
  const reviewUrl = isReady(SITE_CONFIG.social.google) ? SITE_CONFIG.social.google : null;

  return (
    <>
      <script id="ueber-uns-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="ueber-uns-person-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <main>
        <section
          style={{
            background:
              'linear-gradient(135deg, rgba(7,14,26,0.85) 0%, rgba(10,22,40,0.95) 100%), url("/images/seo/auto_schluessel_hintergrund_service.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '6rem 2rem',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <span className="section-label">ÜBER UNS</span>
            <h1 style={{ color: '#fff', marginBottom: '1rem' }}>
              Ein Netzwerk für Autoschlüssel — kein Callcenter
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              {SITE_CONFIG.fullName} ist ein Verbund selbstständiger Fachbetriebe für
              Autoschlüssel. Wir nehmen Ihre Anfrage auf, nennen den Festpreis und schicken den
              Partnerbetrieb Ihrer Stadt zu Ihrem Fahrzeug — rund um die Uhr, mit
              Werkstatttechnik statt Schlagschlüssel.
            </p>
          </div>
        </section>

        <div className="container" style={{ padding: '4rem 2rem' }}>
          <div style={twoCol}>
            <div>
              <h2 style={{ ...h2, fontSize: '1.6rem', marginBottom: '0.75rem' }}>Wer wir sind</h2>
              <p style={body}>
                {SITE_CONFIG.fullName} wurde von Berkan Acarol aufgebaut, einem
                Autoschlüssel-Techniker mit über zehn Jahren Erfahrung in Fahrzeugsicherung und
                Schlüsselcodierung. Entstanden ist das Ganze aus einer Werkstatt, nicht aus einem
                Vermittlungsportal — und das ist der Unterschied, den man am Telefon hört: wer bei
                uns abnimmt, weiß, was FBS4, FEM/BDC und ein gesperrtes Steuergerät bedeuten, und
                kann deshalb einen Festpreis nennen, statt vor Ort nachzurechnen.
              </p>
              <p style={body}>
                Zu Ihrem Fahrzeug fährt der selbstständige Fachbetrieb Ihrer Stadt, mit eigener
                Diagnosetechnik und eigenem Schlüssellager. Wen wir aufnehmen, entscheidet die
                Werkstatt: eigene Geräte, Nachweis der Arbeit, und ein Preis, der vorher hält.
              </p>
              <p style={body}>
                Wir kommen zu Ihnen — zu Hause, am Arbeitsplatz, in der Tiefgarage oder am
                Straßenrand. Unser Anspruch ist schlicht: ein Preis, der stimmt, ein ehrliches
                Zeitfenster und Arbeit, nach der das Fahrzeug keine Reparatur braucht.
              </p>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Worauf wir uns festlegen</h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '0.88rem', color: 'var(--gray-700)', lineHeight: '1.7' }}>
                <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>{' '}
                  <span><strong>Festpreis vorab:</strong> Sie hören den Preis am Telefon, inklusive 19 % MwSt., und er gilt vor Ort unverändert — ohne Nacht-, Wochenend- oder Feiertagszuschlag.</span>
                </li>
                <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>{' '}
                  <span><strong>Nachweis vor der Arbeit:</strong> Personalausweis und Zulassungsbescheinigung Teil I. Ohne diesen Nachweis wird kein Fahrzeug geöffnet — auch nicht im Notfall.</span>
                </li>
                <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>{' '}
                  <span><strong>Werkstatttechnik:</strong> Diagnosegeräte und CNC-Fräse, keine günstige Nachbautechnik.</span>
                </li>
                <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>{' '}
                  <span><strong>Erreichbarkeit:</strong> rund um die Uhr, sieben Tage in der Woche, auch am Wochenende und an Feiertagen.</span>
                </li>
                <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>{' '}
                  <span><strong>12 Monate Garantie</strong> auf jeden gelieferten Schlüssel und jedes Anlernen, schriftlich.</span>
                </li>
              </ul>
            </div>

            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/team/berkan-acarol-autoschluessel-spezialist.webp"
                alt="Berkan Acarol — Gründer von Autoschlüssel24"
                style={{ ...imgStyle, height: '220px', objectPosition: 'top', marginBottom: '0.75rem' }}
              />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>Berkan Acarol</h3>
              <p style={{ color: 'var(--orange-500)', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                Gründer, Autoschlüssel-Techniker
              </p>
            </div>
          </div>

          {/* Wie das Netzwerk arbeitet */}
          <div style={twoCol}>
            <div>
              <h2 style={h2}>
                Vier Städte, vier Fachbetriebe
                <br />
                📍 {SITE_CONFIG.serviceAreaString}
              </h2>
              <p style={body}>
                Es gibt keine zentrale Halle, von der aus Fahrzeuge quer durch Deutschland fahren.
                In jeder dieser Städte sitzt ein eigener Fachbetrieb mit eigener Werkstatt, eigener
                Diagnosetechnik und eigenem Schlüssellager — deshalb ist der Weg zu Ihrem Fahrzeug
                kurz, und deshalb kennt der Partner die Tiefgaragen und Parkdecks seiner Stadt.
              </p>
              <p style={{ ...body, marginBottom: 0 }}>
                Dass es vier Städte sind und nicht vierzig, ist Absicht. Eine Stadtseite entsteht
                bei uns erst, wenn dort wirklich jemand hinfährt. Fehlt Ihr Ort, heißt das nicht,
                dass niemand kommt — rufen Sie an, und Sie hören es sofort.
              </p>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/seo/auto_schluessel_24stunden_workshop.webp"
                alt="Werkstatt für Autoschlüssel mit Diagnosetechnik und Fräse"
                style={imgStyle}
              />
            </div>
          </div>

          <div style={twoCol}>
            <div>
              <h2 style={h2}>🚐 Die Werkstatt fährt mit</h2>
              <p style={{ ...body, marginBottom: 0 }}>
                Ein Schlüsselproblem passiert selten zu einem passenden Zeitpunkt, und fast nie
                dort, wo eine Werkstatt steht. Darum sind die Fahrzeuge unserer Partner als
                fahrende Werkstätten eingerichtet: CNC-Fräse für das Schlüsselblatt, Diagnosegeräte
                für das Anlernen an der Wegfahrsperre, Lötstation für Feinarbeit an der Platine. Ihr
                Auto muss deshalb nicht abgeschleppt werden — und das ist in der Rechnung meist mehr
                wert als die Arbeit selbst.
              </p>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/seo/schluesseldienst_arbeiten_24stunden.webp"
                alt="Arbeit am Fahrzeug vor Ort, rund um die Uhr"
                style={{ ...imgStyle, objectPosition: 'top' }}
              />
            </div>
          </div>

          <div style={twoCol}>
            <div>
              <h2 style={h2}>🔑 Schlüssel aus dem Lager, nicht aus der Bestellung</h2>
              <p style={{ ...body, marginBottom: 0 }}>
                Der Grund, warum es beim Vertragshändler Tage dauert, ist selten die Arbeit — es ist
                die Bestellung auf Fahrgestellnummer. Unsere Partner führen Schlüssel für die
                gängigen Marken mit: Keyless-Go-Schlüssel, Funkschlüssel, Transponderschlüssel und
                Rohlinge. Deshalb ist der Termin in den meisten Fällen am selben Tag, und deshalb
                kann Ihnen am Telefon schon jemand sagen, ob Ihr Modell dabei ist.
              </p>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/seo/envanter.webp"
                alt="Lager mit Autoschlüsseln und Transpondern"
                style={imgStyle}
              />
            </div>
          </div>

          {/* Technik */}
          <div style={{ marginBottom: '3.5rem' }}>
            <h2 style={h2}>Womit gearbeitet wird</h2>
            <p style={body}>
              Diese Geräte sind der Grund, warum ein Fachbetrieb kann, was ein Schlüsseldienst nicht
              kann. Ein gefräster Rohling startet kein Auto; die Wegfahrsperre muss über die
              OBD-Schnittstelle oder am Steuergerät angelernt werden, und dafür braucht es
              Werkstatttechnik.
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {tools.map((t) => (
                <li
                  key={t}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    color: 'var(--gray-700)',
                  }}
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/*
            * Die Kachelreihe der niederländischen Seite zeigt Google-Score,
            * eine durchschnittliche Reaktionszeit und die Erreichbarkeit. Zwei
            * der drei Zahlen kann diese Domain nicht belegen (siehe Dateikopf),
            * also stehen hier die Aussagen, die ohne Zahl wahr sind.
            */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '1.5rem',
              marginBottom: '4rem',
            }}
          >
            {[
              { num: '24/7', label: 'Erreichbar', sub: 'Auch nachts, am Wochenende und an Feiertagen' },
              { num: 'Festpreis', label: 'Vorab am Telefon', sub: 'Inkl. 19 % MwSt., keine Nachforderung' },
              { num: '12 Mon.', label: 'Garantie', sub: 'Auf Schlüssel und Anlernen, schriftlich' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                  {s.num}
                </div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.9rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="seo-article-block" style={{ marginTop: '2rem', marginBottom: '3.5rem' }}>
            <h2>Warum {SITE_CONFIG.name}?</h2>
            <h3>Fachbetrieb, nicht Aufsperrdienst</h3>
            <p>
              Unsere Partner arbeiten mit aktueller Software für Schlüssel- und Fahrzeugdiagnose.
              Dort, wo ein klassischer Schlüsseldienst aufhört, fängt die eigentliche Arbeit an:
              Steuergeräte auslesen, EEPROM beschreiben, CAN-Bus-Sicherung, Transponder an der
              Wegfahrsperre anlernen. Das ist der Unterschied zwischen einer geöffneten Tür und
              einem Auto, das wieder fährt.
            </p>
            <h3>Kein Callcenter zwischen Ihnen und der Werkstatt</h3>
            <p>
              Wenn Sie anrufen, erreichen Sie jemanden, der die Technik kennt — nicht einen
              Vermittler, der eine Anfrage weiterreicht und den Preis offenlässt.
            </p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><strong>Direkt am Telefon eingeschätzt:</strong> Marke, Modell, Baujahr, Schlüsselart — danach steht der Preis.</li>
              <li><strong>Festpreis statt Spanne:</strong> ein Betrag inklusive MwSt., kein &quot;ab&quot; mit offenem Ende.</li>
              <li><strong>Ehrliches Zeitfenster:</strong> wir nennen, wann der Partner Ihrer Stadt kommen kann, und keine pauschale Minutenzahl, die vier Städte nicht halten.</li>
              <li><strong>Was nicht geht, sagen wir vorher:</strong> Mercedes FBS4 etwa kann nur der Vertragshändler. Das zu sagen kostet uns einen Auftrag und Ihnen eine Anfahrt.</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/kontakt" className="btn btn-primary btn-lg" id="ueber-uns-contact-cta">
              📞 Kontakt aufnehmen
            </Link>
            {/*
              * Erscheint erst mit einem eigenen Unternehmensprofil. Hier stand
              * eine fest eingetragene Google-Place-ID des niederländischen
              * Profils — ein deutscher Kunde hätte damit die niederländische
              * Seite bewertet, und die Bewertung wäre für diese Domain
              * verloren.
              */}
            {reviewUrl && (
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg"
                id="ueber-uns-review-cta"
                style={{
                  background: '#fff',
                  border: '2px solid var(--color-border)',
                  color: 'var(--gray-800)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                ⭐ Google-Bewertung schreiben
              </a>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
