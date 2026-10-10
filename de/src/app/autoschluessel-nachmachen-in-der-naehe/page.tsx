import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import { preisAb } from '@/config/leistungen';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import NearestCity from '@/components/NearestCity/NearestCity';
import ServiceAreaMap from '@/components/ServiceAreaMap/ServiceAreaMap';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import { CITIES } from '@/config/cities';

/*
 * Die lokale Suche ohne Stadtnamen.
 *
 * Auf der niederländischen Seite ist "autosleutel bijmaken in de buurt" die
 * lokale Anfrage mit der besten Klickrate im ganzen Export — Position 8,4,
 * ohne dass es je eine Seite dafür gab; sie rankte gegen die Städteübersicht,
 * die "welche Städte" beantwortet statt "sind Sie in meiner Nähe".
 *
 * "in der Nähe" ist die deutsche Entsprechung und trägt dieselbe Absicht.
 * Diese Seite beantwortet sie, wie sie gestellt wird.
 *
 * Nur der Browser weiß, wo der Leser steht, also fragt NearestCity ihn —
 * hinter einer Schaltfläche, weil ein unaufgeforderter Standortdialog
 * reflexhaft weggeklickt wird und nicht zweimal gestellt werden kann. Alles
 * darunter funktioniert auch ohne.
 */

const REGIONS = Array.from(new Set(CITIES.map((c) => c.region))).sort();

const PAGE_PATH = '/autoschluessel-nachmachen-in-der-naehe';
const PAGE_URL = `${SITE_CONFIG.domain}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: { absolute: 'Autoschlüssel nachmachen in der Nähe | wir kommen zu Ihnen' },
  description:
    'Autoschlüssel nachmachen in der Nähe? Unser Partner kommt zu Ihrem Fahrzeug in Berlin, Hamburg, München und Frankfurt und fertigt den Schlüssel vor Ort an. Festpreis vorab.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'de-DE': PAGE_URL },
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'Autoschlüssel nachmachen in der Nähe | wir kommen zu Ihnen',
    description:
      'Autoschlüssel nachmachen in der Nähe? Unser Partner kommt zu Ihrem Fahrzeug und fertigt den Schlüssel vor Ort an. Rund um die Uhr.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autoschlüssel nachmachen in der Nähe — Autoschlüssel24' }],
  },
};

const faqItems = [
  {
    q: 'Woran sehe ich, ob ein Partner in meiner Nähe ist?',
    a: 'Nutzen Sie die Schaltfläche oben, um Ihren Standort freizugeben — dann sehen Sie sofort, welches Einsatzgebiet am nächsten liegt. Funktioniert das nicht, oder steht Ihr Ort nicht in der Liste weiter unten, rufen Sie mit Ihrer Postleitzahl an. Unsere Partner fahren weiter als die Liste reicht, und Sie hören ehrlich, ob und wann jemand kommen kann.',
  },
  {
    q: 'Muss ich in einen Laden kommen?',
    a: 'Nein. Es gibt keinen Laden. Die Werkstatt ist im Fahrzeug: Fräse, Diagnosegeräte und Schlüssellager fahren mit. Der Partner kommt zu Ihrem Auto, wo es auch steht — zu Hause, am Arbeitsplatz, im Parkhaus oder am Straßenrand.',
  },
  {
    q: 'Kostet es mehr, wenn ich weiter weg wohne?',
    a: 'Nein. Die Anfahrt ist im Preis enthalten, und es kommen hinterher keine Kilometer dazu. Sie hören den Festpreis am Telefon, bevor jemand losfährt, als Bruttopreis inklusive 19 % MwSt.',
  },
  {
    q: 'Wie schnell kann jemand da sein?',
    a: 'Das hängt davon ab, wo Sie stehen und wer gerade in Ihrer Region unterwegs ist. Genau deshalb nennen wir hier keine pauschale Minutenzahl: Sie bekommen am Telefon ein Zeitfenster von dem Partner, der zu Ihnen fährt, und keinen Durchschnitt über vier Städte.',
  },
  {
    q: 'Arbeiten Sie auch außerhalb der großen Städte?',
    a: 'Ja. Die Städteseite zeigt, wo ein Partnerbetrieb sitzt, aber diese Betriebe fahren auch in die Gemeinden ringsum. Dass Ihr Ort keine eigene Seite hat, heißt nicht, dass niemand kommt — ein Anruf kostet eine Minute und Sie wissen es sofort.',
  },
];

export default function InDerNaehe() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Autoschlüssel nachmachen in der Nähe', item: PAGE_URL },
    ],
  };

  return (
    <div>
      <script id="buurt-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="buurt-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'In der Nähe' }]}
        titleTop="Autoschlüssel nachmachen in der Nähe?"
        titleAccent="Niemand muss irgendwohin — außer wir"
        lead="Es gibt keinen Laden, zu dem Sie fahren. Die Werkstatt ist im Fahrzeug, und sie kommt zu Ihrem Auto, wo es auch steht."
        facts={<HeroQuickFacts price={preisAb('transponder')} />}
        image={{
          src: '/images/seo/autoschluessel24_autoschluessel-spezialist_vor_ort.webp',
          alt: 'Autoschlüssel-Spezialist mit Servicefahrzeug am Einsatzort',
        }}
      >
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />} />
      </SplitHero>

      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Wer ist in meiner Nähe?</h2>
          <NearestCity />
        </div>
      </section>

      <VerifiedReviewBanner />

      <ServiceAreaMap />

      <section className="section-alt">
        <div className="container">
          <h2 style={{ marginBottom: '0.75rem' }}>Unsere Einsatzgebiete nach Region</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 780 }}>
            Hier stehen die Städte, in denen ein Partnerbetrieb sitzt. Fehlt Ihr Ort, heißt das
            nicht, dass niemand kommt — es heißt, dass es dafür noch keine eigene Seite gibt. Das
            ist Absicht: eine Stadtseite entsteht hier erst, wenn dort wirklich jemand hinfährt.
            Rufen Sie mit Ihrer Postleitzahl an.
          </p>
          {REGIONS.map((region) => (
            <div key={region} style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--gray-900)' }}>{region}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {CITIES.filter((c) => c.region === region).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/staedte/${c.slug}`}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: '#fff',
                      border: '1px solid rgba(15,23,42,0.10)',
                      borderRadius: '999px',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      color: 'var(--gray-700)',
                    }}
                  >
                    {c.city}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '2rem' }}>Häufige Fragen</h2>
          {faqItems.map((f, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-question">
                {f.q}
                <svg className="faq-chevron" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <p className="faq-answer">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
