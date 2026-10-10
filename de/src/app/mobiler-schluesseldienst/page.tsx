import type { Metadata } from 'next';
import { getBaseLocalBusinessSchema, serviceRegionNodes } from '@/utils/schema';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import { preisAb } from '@/config/leistungen';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/leistungen';
import { CITIES } from '@/config/cities';

/*
 * Eine Seite darüber, WER wir sind — nicht darüber, was wir machen.
 *
 * Jede andere Seite antwortet auf eine Aufgabe: nachmachen, verloren, öffnen.
 * Diese antwortet auf eine andere Art von Suche. Wer "mobiler schlüsseldienst"
 * oder "autoschlüsseldienst" tippt, sucht einen BETRIEB, den er anrufen kann,
 * und hat sein Problem noch nicht benannt. Ihn auf einer Leistungsseite zu
 * landen, verlangt eine Selbstdiagnose, bevor man den Anruf verdient hat.
 *
 * Und sie klärt ein Wort, das in Deutschland belastet ist.
 *
 * "Schlüsseldienst" ist hier nicht neutral: Verbraucherzentralen und der ADAC
 * warnen seit Jahren vor Aufsperrdiensten, die am Telefon 80 Euro nennen und
 * vor der Tür 500 verlangen, und genau diese Erfahrung bringt ein deutscher
 * Suchender mit, wenn er auf diese Seite kommt. Das ist der Grund, warum der
 * Festpreis auf dieser Seite nicht ein Verkaufsargument unter anderen ist,
 * sondern der erste Absatz — und warum hier steht, was uns von einem
 * Aufsperrdienst unterscheidet, statt denselben Begriff nur zu belegen.
 *
 * Auf der niederländischen Seite ist dieselbe Suche (sleutelmaker,
 * slotenmaker, sleutelservice) 708 Impressionen wert. Dort ist das Wort
 * harmlos; hier ist es die halbe Arbeit der Seite.
 */

const PAGE_PATH = '/mobiler-schluesseldienst';
const PAGE_URL = `${SITE_CONFIG.domain}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: { absolute: 'Mobiler Autoschlüsseldienst | wir kommen zum Fahrzeug' },
  description:
    'Mobiler Schlüsseldienst für Ihr Auto: Festpreis am Telefon, kein Aufschlag vor Ort. Unser Partner öffnet schadenfrei und fertigt Schlüssel direkt am Fahrzeug an — 24/7.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'de-DE': PAGE_URL },
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'Mobiler Autoschlüsseldienst | wir kommen zum Fahrzeug',
    description:
      'Mobiler Schlüsseldienst für Autos: schadenfrei öffnen, Schlüssel vor Ort fräsen und anlernen. Festpreis vorab, rund um die Uhr.',
  },
};

const faqItems = [
  {
    q: 'Was unterscheidet Sie von einem gewöhnlichen Schlüsseldienst?',
    a: 'Zwei Dinge. Erstens der Preis: Sie hören einen Festpreis am Telefon, und der gilt auch vor Ort — kein Zuschlag für Nacht, Wochenende oder Feiertag, keine Nachforderung, wenn die Tür offen ist. Genau davor warnen Verbraucherzentralen bei Aufsperrdiensten, und es ist der Grund, warum wir den Preis vor der Anfahrt nennen. Zweitens die Technik: ein klassischer Schlüsseldienst öffnet Türen und fräst Schlüssel. Bei einem Fahrzeug ab 1998 genügt das nicht, weil der Transponder an der Wegfahrsperre angelernt werden muss — sonst passt der Schlüssel, aber der Motor startet nicht.',
  },
  {
    q: 'Schlüsseldienst, Aufsperrdienst oder Autoschlüssel-Fachbetrieb — was brauche ich?',
    a: 'Im Sprachgebrauch wird das durcheinander verwendet, und das ist in Ordnung: Sie suchen jemanden, der das Problem löst, keine Berufsbezeichnung. Der Unterschied in der Sache: ein Schlüsseldienst arbeitet vor allem an Haus- und Gewerbeschlössern. Ein Aufsperrdienst öffnet. Bei einem modernen Auto kommt das Dritte hinzu — die Fahrzeugelektronik. Darauf sind unsere Partner ausgerichtet.',
  },
  {
    q: 'Was heißt "mobil" genau?',
    a: 'Dass es keinen Laden gibt, zu dem Sie fahren müssen. Die Werkstatt ist im Fahrzeug: Fräse, Diagnosegeräte, Schlüssellager und die Software für das Anlernen. Der Partner fährt zu Ihrem Auto — nach Hause, zur Arbeit, in die Tiefgarage oder an den Straßenrand — und arbeitet dort. Ihr Fahrzeug muss nicht abgeschleppt werden, und das spart in der Regel mehr, als der Auftrag selbst kostet.',
  },
  {
    q: 'Können Sie auch einfach einen Schlüssel kopieren?',
    a: 'Ja, aber bei fast jedem Fahrzeug ab 1998 genügt Kopieren allein nicht. Das Schlüsselblatt passt dann in die Tür, aber ohne den richtigen Transpondercode startet der Motor nicht. Wir fräsen und lernen an, damit Sie einen Schlüssel bekommen, der alles kann, was Ihr Original kann.',
  },
  {
    q: 'Wo arbeiten Sie?',
    a: `Über ein Netzwerk selbstständiger Fachbetriebe in ${SITE_CONFIG.serviceAreaString}. Rufen Sie mit Ihrer Postleitzahl an, und Sie hören sofort, wer Ihre Region abdeckt und wann er bei Ihnen sein kann. Auf der Städteseite steht, wo heute ein Partner sitzt — und nur dort, wo wirklich einer hinfährt.`,
  },
  {
    q: 'Sind Sie auch nachts und am Wochenende erreichbar?',
    a: 'Ja, rund um die Uhr, sieben Tage in der Woche, auch an Feiertagen. Und das ist der Punkt, auf den es bei einem Schlüsseldienst ankommt: der Preis, den Sie am Telefon hören, gilt unabhängig von der Uhrzeit. Ein Nacht- oder Wochenendzuschlag, der erst vor Ort auftaucht, ist bei uns nicht vorgesehen.',
  },
  {
    q: 'Was kostet es, einen mobilen Schlüsseldienst kommen zu lassen?',
    a: 'Die Anfahrt ist im Preis enthalten — eine getrennte Anfahrtspauschale gibt es nicht. Was der Auftrag kostet, hängt davon ab, was zu tun ist: ein Fahrzeug schadenfrei öffnen ist die kleinste Arbeit, ein Schlüssel ohne vorhandenes Original die größte. Sie hören den genauen Festpreis am Telefon, bevor jemand losfährt; sagen Sie nein, zahlen Sie nichts. Alle Beträge sind Bruttopreise inklusive 19 % MwSt.',
  },
];

export default function MobilerSchluesseldienst() {
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
      { '@type': 'ListItem', position: 2, name: 'Mobiler Autoschlüsseldienst', item: PAGE_URL },
    ],
  };
  /*
   * Eine Leistung des Unternehmens, die auf es verweist. Auf der
   * niederländischen Seite stand hier einmal ein zweiter Locksmith-Knoten
   * (mit eigener "#locksmith"-@id und nur einem parentOrganization-Link),
   * sodass die Seite zwei Betriebe beschrieb. Das Unternehmen, seine sameAs
   * und sein Unternehmensprofil stehen an einer Stelle im Root-Layout; diese
   * Seite sagt nur, um welche Leistung es geht.
   */
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${PAGE_URL}#service`,
    name: 'Mobiler Autoschlüsseldienst',
    serviceType: 'Mobiler Schlüsseldienst für Fahrzeuge, Auto öffnen, Autoschlüssel nachmachen und anlernen',
    description:
      'Mobiler Autoschlüsseldienst: unser Partner kommt zum Fahrzeug, öffnet schadenfrei und fräst und lernt Schlüssel vor Ort an. Festpreis vorab, inkl. MwSt.',
    url: PAGE_URL,
    provider: getBaseLocalBusinessSchema(),
    areaServed: serviceRegionNodes(),
  };

  return (
    <div>
      <script id="sm-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="sm-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="sm-biz" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Mobiler Autoschlüsseldienst' }]}
        titleTop="Mobiler Schlüsseldienst für Ihr Auto"
        titleAccent="Festpreis am Telefon — und der gilt auch vor Ort"
        lead="Sie suchen einen Schlüsseldienst für Ihr Fahrzeug? Die Werkstatt unserer Partner ist im Auto: Fräsen, Anlernen und schadenfreies Öffnen passieren bei Ihrem Fahrzeug, nicht hinter einem Ladentisch."
        facts={<HeroQuickFacts price={preisAb('transponder')} />}
        image={{
          src: '/images/seo/autoschluessel24_autoschluessel-spezialist_vor_ort.webp',
          alt: 'Autoschlüssel-Spezialist in Arbeitskleidung am Fahrzeug, Servicefahrzeug im Hintergrund',
        }}
      >
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '1rem' }}>Der Preis, den Sie hören, ist der Preis, den Sie zahlen</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Wer in Deutschland &quot;Schlüsseldienst&quot; sucht, hat meistens schon von dem anderen Fall
            gehört: 80 Euro am Telefon, 500 vor der Tür, eine Rechnung mit Zuschlägen, von denen
            vorher niemand sprach. Verbraucherzentralen und der ADAC warnen davor seit Jahren, und
            es ist der Grund, warum dieser Absatz vor allem anderen steht.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Bei uns nennen wir den Festpreis am Telefon, bevor jemand losfährt, und er gilt vor Ort
            unverändert — unabhängig von Uhrzeit, Wochentag und Feiertag. Die Anfahrt ist darin
            enthalten. Sagen Sie nach dem Preis nein, zahlen Sie nichts. Alle Beträge sind
            Bruttopreise inklusive 19 % MwSt., wie es die Preisangabenverordnung gegenüber
            Verbrauchern verlangt.
          </p>
          <h2 style={{ marginBottom: '1rem', marginTop: '2.5rem' }}>Schlüsseldienst, Aufsperrdienst oder Fachbetrieb?</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Die drei Begriffe werden durcheinander verwendet, und das ist in Ordnung — Sie suchen
            jemanden, der das Problem löst, keine Berufsbezeichnung. In der Sache gibt es aber
            einen Unterschied. Ein Schlüsseldienst arbeitet vor allem an Haus- und
            Gewerbeschlössern. Ein Aufsperrdienst öffnet. Bei einem modernen Auto genügt beides
            zusammen nicht: der Schlüssel muss <em>elektronisch</em> zum Fahrzeug gehören, sonst
            geht die Tür auf, aber der Motor startet nicht.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Dieses Dritte — den Transponder an der Wegfahrsperre anlernen — ist das, worauf unsere
            Partner ausgerichtet sind. Dafür braucht es Fahrzeugdiagnose, nicht einen
            Schlagschlüssel, und es ist der Unterschied zwischen einer geöffneten Tür und einem
            Auto, das wieder fährt.
          </p>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Weswegen bei uns angerufen wird</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {DIENSTEN.filter((d) => !REDIRECTED_SERVICE_SLUGS.has(d.slug))
              .slice(0, 8)
              .map((d) => (
                <Link
                  key={d.slug}
                  href={`/leistungen/${d.slug}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.9rem 1.1rem',
                    background: '#fff',
                    border: '1px solid rgba(15,23,42,0.10)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'var(--gray-800)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{d.title}</span>
                  <span style={{ color: 'var(--orange-600)', whiteSpace: 'nowrap' }}>
                    {d.priceFrom ?? 'Ansehen'} →
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '2rem' }}>Häufige Fragen</h2>
          {faqItems.map((f, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-question">
                {f.q}
                <svg
                  className="faq-chevron"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <p className="faq-answer">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section-alt">
        <div className="container">
          <div className="seo-hub-box">
            <div className="seo-hub-grid">
              <div>
                <div className="seo-hub-title">Was wir machen</div>
                <div className="seo-hub-col">
                  {DIENSTEN.filter((d) => !REDIRECTED_SERVICE_SLUGS.has(d.slug)).map((d) => (
                    <Link key={d.slug} href={`/leistungen/${d.slug}`} className="seo-hub-link">
                      {`${d.title} →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">Schlüsseldienst in Ihrer Stadt</div>
                <div className="seo-hub-col">
                  <Link href="/staedte" className="seo-hub-link" style={{ fontWeight: 'bold' }}>
                    Alle Städte ansehen →
                  </Link>
                  {CITIES.filter((c) => c.priority === 'P1')
                    .slice(0, 10)
                    .map((c) => (
                      <Link key={c.slug} href={`/staedte/${c.slug}`} className="seo-hub-link">
                        {`Autoschlüsseldienst ${c.city} →`}
                      </Link>
                    ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">Mehr erfahren</div>
                <div className="seo-hub-col">
                  <Link href="/autoschluessel-verloren" className="seo-hub-link">Autoschlüssel verloren →</Link>
                  <Link href="/autoschluessel-gestohlen" className="seo-hub-link">Autoschlüssel gestohlen →</Link>
                  <Link href="/preise" className="seo-hub-link">Was kostet es? →</Link>
                  <Link href="/ueber-uns" className="seo-hub-link">Wer wir sind →</Link>
                  <Link href="/bewertungen" className="seo-hub-link">Bewertungen →</Link>
                  <Link href="/haeufige-fragen" className="seo-hub-link">Häufige Fragen →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
