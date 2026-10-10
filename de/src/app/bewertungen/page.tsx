import type { Metadata } from 'next';
import Link from 'next/link';
import GoogleReviewsCta, { REVIEWS } from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { SITE_CONFIG, isReady } from '@/config/site.config';

/*
 * Die Bewertungsseite einer Domain, die noch keine Bewertungen hat.
 *
 * Die niederländische Fassung zeigt hier 5,0 Sterne, acht zitierte
 * Bewertungen und ein AggregateRating mit zehn Stimmen. All das ist dort echt
 * und gehört dorthin. Übernommen wäre es dreifach falsch:
 *
 *  - rating und reviewCount stehen in dieser App auf '0' (siehe
 *    site.config.ts). Ein AggregateRating mit ratingValue "0" und
 *    reviewCount "0" ist nicht nur nutzlos, es ist ungültige Auszeichnung.
 *  - Die zitierten Bewertungen stammen vom niederländischen
 *    Unternehmensprofil. Sie als Bewertungen DIESES Unternehmens auszuzeichnen
 *    ist eine Falschangabe in strukturierten Daten und riskiert eine manuelle
 *    Maßnahme für die ganze Domain.
 *  - In Deutschland kommt § 5 und § 5b UWG hinzu: seit 2022 muss ein Anbieter
 *    offenlegen, ob und wie er sicherstellt, dass veröffentlichte Bewertungen
 *    von echten Kunden stammen. Fremde Bewertungen zu zeigen, wäre damit nicht
 *    nur Google gegenüber ein Problem.
 *
 * Also: solange REVIEWS leer ist, zeigt diese Seite keine Sterne, kein
 * AggregateRating und keine Zitate — sondern sagt, dass diese Seite neu ist
 * und woher die Bewertungen kommen werden. Das ist die eine Aussage, die hier
 * heute wahr ist, und sie kostet weniger als eine erfundene Fünf.
 *
 * Sobald echte deutsche Bewertungen vorliegen: REVIEWS in
 * GoogleReviewsCta.tsx füllen, rating und reviewCount in site.config.ts
 * setzen, und diese Seite schaltet sich von selbst um.
 */

const HAS_REVIEWS = REVIEWS.length > 0 && isReady(SITE_CONFIG.rating) && SITE_CONFIG.rating !== '0';
const GOOGLE_PROFILE = isReady(SITE_CONFIG.social.google) ? SITE_CONFIG.social.google : null;

export const metadata: Metadata = {
  title: {
    absolute: HAS_REVIEWS
      ? `Bewertungen | ${SITE_CONFIG.rating}★ von Kunden | ${SITE_CONFIG.name}`
      : `Kundenbewertungen | ${SITE_CONFIG.name}`,
  },
  description: HAS_REVIEWS
    ? `Echte Kundenbewertungen über ${SITE_CONFIG.fullName}: Schlüssel nachgemacht, Fahrzeug geöffnet, Festpreis gehalten. Nachzulesen in unserem Google-Unternehmensprofil.`
    : `${SITE_CONFIG.fullName} ist in Deutschland neu. Hier erscheinen die Bewertungen unserer Kunden, sobald sie vorliegen — ungefiltert und aus dem Google-Unternehmensprofil.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/bewertungen` },
  /* Eine Bewertungsseite ohne Bewertungen ist eine dünne Seite. Sie bleibt
     erreichbar (die Fußzeile verlinkt sie), aber sie gehört erst in den Index,
     wenn sie etwas zu zeigen hat. */
  ...(HAS_REVIEWS ? {} : { robots: { index: false, follow: true } }),
};

export default function BewertungenPage() {
  /*
   * Review- und AggregateRating-Auszeichnung, und zwar NUR auf dieser Seite.
   *
   * Was sie nicht tut: Sterne in die Google-Ergebnisse bringen. Bewertungen,
   * die ein Unternehmen auf seiner eigenen Seite über sich selbst
   * veröffentlicht, nennt Google "self-serving" und schließt sie vom
   * Sterne-Rich-Result aus — darum trägt LocalBusinessSchema.tsx bewusst kein
   * aggregateRating. Der Wert hier ist für Antwortmaschinen, die
   * strukturierte Daten direkt lesen. Die Sterne, die Kunden sehen, kommen aus
   * dem Unternehmensprofil.
   *
   * Zwei Regeln, die die niederländische Fassung sich auferlegt hat und die
   * hier gelten, sobald es Bewertungen gibt:
   *   - Bewertungen, die Google selbst mit "…" abschneidet, werden nicht
   *     zitiert. Ein ausgezeichneter Text, der mitten im Satz endet, gibt
   *     falsch wieder, was jemand geschrieben hat.
   *   - kein datePublished. Die Quelle sagt "vor 2 Wochen" und nicht mehr; ein
   *     daraus abgeleitetes Datum wäre erfunden, und ein erfundenes Datum in
   *     strukturierten Daten ist schlimmer als keines.
   */
  const reviewSchema = HAS_REVIEWS
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${SITE_CONFIG.domain}/#localbusiness`,
        name: SITE_CONFIG.fullName,
        url: SITE_CONFIG.domain,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: SITE_CONFIG.rating,
          reviewCount: SITE_CONFIG.reviewCount,
          bestRating: '5',
          worstRating: '1',
        },
        review: REVIEWS.filter((r) => !r.text.includes('…')).map((r) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.name },
          reviewBody: r.text,
          reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
        })),
      }
    : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Bewertungen', item: `${SITE_CONFIG.domain}/bewertungen` },
    ],
  };

  return (
    <main>
      {reviewSchema && (
        <script
          id="bewertungen-review-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">BEWERTUNGEN</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Kundenbewertungen</h1>
        {HAS_REVIEWS ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#f59e0b' }}>{SITE_CONFIG.rating}</span>
            <div>
              <div style={{ color: '#f59e0b', fontSize: '1.5rem', letterSpacing: '4px' }}>★★★★★</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                {SITE_CONFIG.reviewCount} Bewertungen im Google-Unternehmensprofil
              </div>
            </div>
          </div>
        ) : (
          /*
           * Hier stehen auf der niederländischen Seite "5,0" und fünf gefüllte
           * Sterne. Mit rating '0' wären das eine Null und fünf gefüllte
           * Sterne daneben — die Art Widerspruch, die ein Besucher in einer
           * halben Sekunde sieht.
           */
          <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 620, margin: '1rem auto 0', lineHeight: 1.7 }}>
            In Deutschland fangen wir bei null an. Hier erscheinen die Bewertungen unserer Kunden,
            sobald die ersten Aufträge erledigt sind — aus dem Google-Unternehmensprofil, ungefiltert
            und nachprüfbar. Wir zeigen keine Bewertungen aus einem anderen Land und keine, die wir
            nicht belegen können.
          </p>
        )}
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        {HAS_REVIEWS ? (
          <GoogleReviewsCta />
        ) : (
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Woher die Bewertungen kommen werden</h2>
            <p style={{ color: 'var(--gray-700)', lineHeight: 1.75, marginBottom: '1rem' }}>
              Wir veröffentlichen hier ausschließlich Bewertungen aus unserem
              Google-Unternehmensprofil. Dort kann jeder sie abgeben, der mit uns zu tun hatte, und
              jeder nachlesen, wie viele es sind — wir können sie weder auswählen noch löschen.
              Deshalb steht hier heute nichts statt etwas Zusammengestelltem.
            </p>
            <p style={{ color: 'var(--gray-700)', lineHeight: 1.75, marginBottom: '2rem' }}>
              Bis dahin sind das die Zusagen, an denen Sie uns messen können: der Festpreis, den Sie
              am Telefon hören, gilt am Fahrzeug unverändert; wir arbeiten schadenfrei; und auf
              jeden Schlüssel sowie jedes Anlernen geben wir zwölf Monate schriftliche Garantie.
              Wird eine davon nicht eingehalten, hören wir es gern direkt —{' '}
              <a href={`mailto:${SITE_CONFIG.email}`} style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
                {SITE_CONFIG.email}
              </a>
              .
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/leistungen" className="btn btn-primary btn-lg">
                Unsere Leistungen
              </Link>
              <Link href="/preise" className="btn btn-outline btn-lg">
                Preise ansehen
              </Link>
            </div>
          </div>
        )}

        {/*
          * Der Link erscheint erst mit einem eigenen Unternehmensprofil. Ohne
          * Prüfung stand hier href="__TBD__" — ein Platzhalter als Ziel einer
          * Schaltfläche, die den Besucher um eine Bewertung bittet.
          */}
        {GOOGLE_PROFILE && (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <a href={GOOGLE_PROFILE} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" id="all-google-reviews">
              Bewertung bei Google schreiben →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
