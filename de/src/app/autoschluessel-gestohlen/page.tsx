import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import { preisAb } from '@/config/leistungen';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/leistungen';
import { CITIES } from '@/config/cities';

/*
 * Gestohlen ist nicht dieselbe Arbeit wie verloren — darum ist das keine
 * Unterseite von /autoschluessel-verloren.
 *
 * Wer einen Schlüssel verliert, hat ihn nicht mehr. Wer bestohlen wird, hat
 * ihn nicht mehr, aber jemand anders hat ihn — und weiß bei einer gestohlenen
 * Tasche oder einem Wohnungseinbruch oft auch, zu welchem Auto er gehört und
 * wo das Auto steht. Alles auf dieser Seite folgt aus diesem einen
 * Unterschied: die Anzeige, die der Versicherer verlangt, das Löschen des
 * gestohlenen Schlüssels aus der Wegfahrsperre als Zweck des Termins und
 * nicht als Beigabe, und der Umstand, dass ein Keyless-Fahrzeug gefahren
 * werden kann, ohne dass der Schlüssel die Wohnung verlässt.
 *
 * Auf der niederländischen Seite kommt diese Suchanfrage auf 612 Impressionen
 * bei durchschnittlich Position 50 — gegen einen Blogartikel, der die Frage
 * beantwortet und nichts verkauft.
 */

const PAGE_PATH = '/autoschluessel-gestohlen';
const PAGE_URL = `${SITE_CONFIG.domain}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: { absolute: 'Autoschlüssel gestohlen? Sofort sperren und ersetzen' },
  description:
    'Autoschlüssel gestohlen? Solange er in der Wegfahrsperre steht, startet er Ihr Auto. Wir löschen den gestohlenen Schlüssel und fertigen vor Ort einen neuen an — 24/7, Festpreis vorab.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'de-DE': PAGE_URL },
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'Autoschlüssel gestohlen? Sofort sperren und ersetzen',
    description:
      'Wir löschen den gestohlenen Schlüssel aus der Wegfahrsperre und fertigen vor Ort einen neuen an. Rund um die Uhr.',
  },
};

const faqItems = [
  {
    q: 'Mein Autoschlüssel ist gestohlen — was mache ich zuerst?',
    a: 'Stellen Sie das Fahrzeug, wenn möglich, an eine einsehbare Stelle oder hinter ein Tor, und erstatten Sie Anzeige bei der Polizei. Rufen Sie danach uns an: solange der gestohlene Schlüssel in der Wegfahrsperre hinterlegt ist, startet er Ihr Auto — egal, wo er gerade ist. Wir kommen zum Fahrzeug, löschen diesen Schlüssel aus dem Steuergerät und fertigen einen neuen an.',
  },
  {
    q: 'Warum ist die Anzeige wichtig?',
    a: 'Weil Ihr Versicherer bei Diebstahl praktisch immer nach dem Aktenzeichen fragt, und ohne Anzeige eine Meldung schwierig wird. Die Anzeige geht online oder auf der Dienststelle und kostet ein paar Minuten. Von uns erhalten Sie eine Rechnung mit ausgewiesener MwSt. und aufgeführter Leistung, die Sie zusammen mit dem Aktenzeichen einreichen können.',
  },
  {
    q: 'Kann der Täter mein Auto mit dem gestohlenen Schlüssel starten?',
    a: 'Ja — bis zu dem Moment, in dem dieser Schlüssel aus der Wegfahrsperre gelöscht ist. Genau das ist der wichtigste Teil der Arbeit. Einen neuen Schlüssel anfertigen zu lassen, ohne den alten zu sperren, löst das Problem nicht: Sie haben dann einen zweiten Schlüssel neben dem des Täters.',
  },
  {
    q: 'Was kostet es, wenn der Schlüssel gestohlen wurde?',
    a: 'Haben Sie noch einen funktionierenden Zweitschlüssel, ist es eine Sache von Löschen und Anlernen. War der gestohlene Ihr einziger Schlüssel, müssen die Schlüsseldaten erst aus dem Steuergerät gelesen werden, und es ist der aufwendigere Fall "alle Schlüssel verloren". Sie hören den Festpreis am Telefon, bevor jemand losfährt; alle Beträge sind Bruttopreise inklusive 19 % MwSt.',
  },
  {
    q: 'Mein Auto hat Keyless Go — der Schlüssel lag drinnen und es wurde trotzdem geöffnet',
    a: 'Das ist ein Relay-Angriff: zwei Täter mit einem Verstärker fangen das Signal Ihres Schlüssels durch die Wohnungstür ab und spielen es am Fahrzeug wieder ein. Der Schlüssel bleibt dabei in der Wohnung liegen. Bewahren Sie ihn in einer Faraday-Tasche oder einer Blechdose auf, prüfen Sie, ob Ihr Schlüssel eine abschaltbare Funkfunktion hat (viele Hersteller bieten das über eine Tastenkombination), und erwägen Sie eine zusätzliche Wegfahrsperre mit PIN-Eingabe.',
  },
  {
    q: 'Zahlt meine Versicherung einen gestohlenen Autoschlüssel?',
    a: 'Das steht in Ihrer Police, und die Antwort ist häufiger "nein", als man erwartet: die Teilkasko deckt den Diebstahl des Fahrzeugs, den Ersatz eines gestohlenen Schlüssels in der Regel nicht. Manche Versicherer bieten den Schlüsselersatz als Zusatzbaustein an, und wurde der Schlüssel bei einem Wohnungseinbruch entwendet, kann die Hausratversicherung greifen. Fragen Sie Ihren Versicherer, bevor Sie etwas voraussetzen — die Rechnung von uns ist in jedem Fall einreichbar.',
  },
  {
    q: 'Müssen auch die Schlösser getauscht werden?',
    a: 'In den meisten Fällen nicht. Bei Fahrzeugen ab etwa dem Jahr 2000 sitzt die Sicherung in der Elektronik und nicht im Schloss: ist der Schlüssel aus der Wegfahrsperre gelöscht, startet das Auto damit nicht mehr. Nur wenn zusammen mit dem Schlüssel auch Fahrzeugpapiere oder Ihre Adresse entwendet wurden, sollten Sie weiter denken als bis zum Schlüssel.',
  },
  {
    q: 'Wie schnell können Sie da sein?',
    a: 'Wir sind rund um die Uhr erreichbar, auch nachts und am Wochenende. Bei Diebstahl zählt die Zeit zwischen jetzt und dem Moment, in dem der Schlüssel unbrauchbar ist — rufen Sie an, und Sie hören sofort, wann der Partner bei Ihnen sein kann. Eine pauschale Minutenangabe nennen wir nicht, weil sie je Stadt und Tageszeit anders ausfällt.',
  },
];

const steps = [
  { n: '1', title: 'Fahrzeug sichern', desc: 'Wenn möglich hinter ein Tor oder an eine einsehbare Stelle. Nicht weit wegfahren — der Partner kommt zum Fahrzeug.' },
  { n: '2', title: 'Anzeige erstatten', desc: 'Online oder auf der Dienststelle. Ihr Versicherer fragt nach dem Aktenzeichen.' },
  { n: '3', title: 'Anrufen', desc: 'Marke, Modell, Baujahr und Standort nennen. Sie hören den Festpreis und wann jemand da ist.' },
  { n: '4', title: 'Alten Schlüssel löschen, neuen anlernen', desc: 'Der gestohlene Schlüssel wird aus der Wegfahrsperre gelöscht und ein neuer vor Ort angelernt.' },
];

export default function AutoschluesselGestohlen() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${PAGE_URL}#faqpage`,
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
      { '@type': 'ListItem', position: 2, name: 'Autoschlüssel gestohlen', item: PAGE_URL },
    ],
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Autoschlüssel gestohlen — sperren und vor Ort ersetzen',
    serviceType: 'Gestohlenen Autoschlüssel aus der Wegfahrsperre löschen und ersetzen',
    provider: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
    /*
     * Das Einsatzgebiet, nicht das Land.
     *
     * Hier stand { '@type': 'Country', name: 'Nederland' } — auf einer
     * deutschen Domain eine falsche Angabe, und "Deutschland" wäre genauso
     * falsch: vier Partner in vier Städten bedienen kein Land. Die Städte
     * stehen in site.config.ts und sind dieselben, die die
     * LocalBusiness-Auszeichnung nennt.
     */
    areaServed: SITE_CONFIG.areaServedCities.map((c) => ({ '@type': 'City', name: c.name })),
    availableChannel: {
      '@type': 'ServiceChannel',
      servicePhone: SITE_CONFIG.phoneTel,
      serviceUrl: PAGE_URL,
    },
  };

  return (
    <div>
      <script id="gestohlen-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="gestohlen-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="gestohlen-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Autoschlüssel gestohlen' }]}
        titleTop="Autoschlüssel gestohlen?"
        titleAccent="Sperren Sie ihn, bevor jemand anders fährt"
        lead="Bei Diebstahl zählt etwas anderes als bei Verlust: jemand hat Ihren Schlüssel. Unser Partner kommt zu Ihrem Fahrzeug, löscht den gestohlenen Schlüssel aus der Wegfahrsperre und fertigt vor Ort einen neuen an."
        facts={<HeroQuickFacts price={preisAb('allKeysLost')} />}
        image={{
          src: '/images/seo/autoschluessel_spezialist_background.webp',
          alt: 'Schlüsselwand mit Transponderschlüsseln nach Marke in der Werkstatt',
        }}
      >
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />
      <BrandsMarquee />

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '1rem' }}>Was Sie jetzt tun — in vier Schritten</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Der Diebstahl eines Autoschlüssels ist kein Papierkram, der warten kann. Solange der
            Schlüssel im Steuergerät hinterlegt ist, ist er ein funktionierender Schlüssel — wo
            auch immer er sich befindet.
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1.25rem' }}>
            {steps.map((s) => (
              <li
                key={s.n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.25rem 1fr',
                  gap: '1rem',
                  alignItems: 'start',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '50%',
                    background: 'var(--orange-500)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                  }}
                >
                  {s.n}
                </span>
                <span>
                  <strong style={{ display: 'block', color: 'var(--gray-900)' }}>{s.title}</strong>
                  <span style={{ color: 'var(--gray-600)', lineHeight: 1.6 }}>{s.desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '1rem' }}>Gestohlen ist nicht dasselbe wie verloren</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Verlieren Sie einen Schlüssel, hat ihn niemand. Wird er gestohlen, hat ihn jemand — und
            bei einer Tasche, einer Jacke oder einem Wohnungseinbruch oft auch Ihre Adresse oder
            Ihre Fahrzeugpapiere dazu. Deshalb ist das Löschen des alten Schlüssels hier nicht der
            Abschluss, sondern der Zweck des Termins: danach ist das Ding in der fremden Tasche ein
            Stück Plastik.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Haben Sie den Schlüssel schlicht verloren und hat ihn niemand mitgenommen, dann ist{' '}
            <Link href="/autoschluessel-verloren" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Autoschlüssel verloren
            </Link>{' '}
            die passende Seite: dieselbe Technik, weniger Eile. Steht gar kein Schlüssel mehr zur
            Verfügung, beschreibt{' '}
            <Link href="/leistungen/alle-autoschluessel-verloren" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              alle Autoschlüssel verloren
            </Link>{' '}
            den aufwendigeren Fall, bei dem die Schlüsseldaten erst aus dem Steuergerät gelesen
            werden müssen.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '2rem' }}>Häufige Fragen — Autoschlüssel gestohlen</h2>
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
                <div className="seo-hub-title">Andere Leistungen</div>
                <div className="seo-hub-col">
                  {DIENSTEN.filter((d) => !REDIRECTED_SERVICE_SLUGS.has(d.slug)).map((d) => (
                    <Link key={d.slug} href={`/leistungen/${d.slug}`} className="seo-hub-link">
                      {`${d.title} →`}
                    </Link>
                  ))}
                </div>
              </div>
              {/*
                * Die Markenspalte der niederländischen Seite fehlt hier: sie
                * verweist auf /merken/<marke>-autosleutel-bijmaken, und diese
                * App hat keine Markenseiten. Siehe BrandsLogoGrid.
                */}
              <div>
                <div className="seo-hub-title">In Ihrer Stadt</div>
                <div className="seo-hub-col">
                  <Link href="/staedte" className="seo-hub-link" style={{ fontWeight: 'bold' }}>
                    Alle Städte ansehen →
                  </Link>
                  {CITIES.filter((c) => c.priority === 'P1')
                    .slice(0, 8)
                    .map((c) => (
                      <Link key={c.slug} href={`/staedte/${c.slug}`} className="seo-hub-link">
                        {`Autoschlüssel gestohlen ${c.city} →`}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
