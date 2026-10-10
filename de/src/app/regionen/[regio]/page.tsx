import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '@/config/site.config';
import { preisAb } from '@/config/leistungen';
import { ARRIVAL } from '@/config/arrival';
import { CITIES } from '@/config/cities';
import { SERVICE_REGIONS } from '@/config/regions';
import { isNoindexCity } from '@/config/thinPages';
import { clampMeta } from '@/lib/meta';
import { breadcrumbSchema, getBaseLocalBusinessSchema } from '@/utils/schema';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import InstantServiceMap from '@/components/InstantServiceMap';

/*
 * Eine Seite je Region, in der ein Partner steht.
 *
 * Wer in Nürnberg "autoschlüssel nachmachen bayern" sucht, oder ein
 * Fuhrparkleiter in Wiesbaden "autoschlüssel hessen", soll auf einer Seite
 * landen, die von seiner Region handelt und die Orte nennt, die er kennt —
 * nicht auf einer Seite über Deutschland und nicht auf einer einzelnen Stadt.
 * Diese Seiten sind das Scharnier zwischen beidem.
 *
 * Sie sind KEINE Vorlage mit ausgetauschtem Regionsnamen. Was je Seite anders
 * ist, kommt aus den Stadtdatensätzen (Stadtteile, lokale Besonderheit,
 * typischer Auftrag) und daraus, welche Städte wirklich in dieser Region
 * liegen. Fehlt eine Angabe, zeigt der Abschnitt einfach die Städte; es wird
 * nichts erfunden, um ihn zu füllen.
 *
 * WAS GEGENÜBER DER NIEDERLÄNDISCHEN FASSUNG FEHLT: die Randstad.
 *
 * Dort gibt es dafür einen eigenen Abschnitt, weil "Randstad" das Wort ist,
 * mit dem Menschen in vier Provinzen beschreiben, wo sie wohnen. Für Berlin,
 * Hamburg, Bayern und Hessen gibt es kein solches Wort — die vier liegen in
 * vier Bundesländern und haben außer uns nichts gemeinsam. Einen Abschnitt zu
 * erfinden, der sie zusammenfasst, hieße eine Nähe zu behaupten, die es nicht
 * gibt, und vier Seiten einander ähnlicher zu machen, als sie sein sollten.
 *
 * Eine Region hier heißt außerdem nicht, dass das ganze Bundesland bedient
 * wird: München hat einen Partner, Nürnberg nicht. Siehe config/regions.ts.
 */

export function generateStaticParams() {
  return SERVICE_REGIONS.map((r) => ({ regio: r.slug }));
}

const citiesIn = (name: string) =>
  CITIES.filter((c) => c.region === name && !isNoindexCity(c.slug)).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1;
    return a.city.localeCompare(b.city, 'de');
  });

export async function generateMetadata(props: { params: Promise<{ regio: string }> }): Promise<Metadata> {
  const { regio } = await props.params;
  const region = SERVICE_REGIONS.find((r) => r.slug === regio);
  if (!region) return {};
  const metaCities = citiesIn(region.name);
  const towns = metaCities.slice(0, 3).map((c) => c.city).join(', ');
  const url = `${SITE_CONFIG.domain}/regionen/${region.slug}`;
  /*
   * Berlin und Hamburg sind Stadt UND Bundesland, und /staedte/berlin besitzt
   * schon den Titel "Autoschlüssel nachmachen Berlin | …". Die Regionsseite
   * darf ihn nicht wiederholen, sonst konkurrieren zwei eigene Seiten um
   * dieselbe Anfrage — genau der Fehler, den die niederländische Fassung für
   * Utrecht einmal gemacht hat. Bei einem Stadtstaat führt der Titel deshalb
   * mit "Region".
   */
  const isCityState = metaCities.some((c) => c.city === region.name);
  const title = isCityState
    ? `Autoschlüssel Region ${region.name} | vor Ort, 24/7`
    : `Autoschlüssel nachmachen ${region.name} | vor Ort, 24/7`;
  return {
    title: { absolute: title },
    description: clampMeta(
      `Autoschlüssel verloren, defekt oder nachmachen in ${region.name}? Unser Partner kommt zu Ihrem Fahrzeug in ${towns} und Umgebung. Festpreis vorab inkl. MwSt., 24/7.`
    ),
    alternates: { canonical: url, languages: { 'de-DE': url } },
    openGraph: {
      type: 'website',
      url,
      title,
      description: `Mobiler Autoschlüssel-Service in ${region.name}: verloren, defekt oder nachmachen — vor Ort.`,
    },
  };
}

export default async function RegionPage(props: { params: Promise<{ regio: string }> }) {
  const { regio } = await props.params;
  const region = SERVICE_REGIONS.find((r) => r.slug === regio);
  if (!region) notFound();

  const cities = citiesIn(region.name);
  const top = cities.slice(0, 3).map((c) => c.city);
  const brands = [...new Set(cities.flatMap((c) => c.popularBrands ?? []))].slice(0, 5);
  const others = SERVICE_REGIONS.filter((r) => r.slug !== region.slug);
  const link = { color: 'var(--orange-600)', fontWeight: 600 } as const;

  const faq = [
    {
      q: `Kommen Sie auch nach ${top.join(', ')} und in die Umgebung?`,
      a: `Ja. Unser Partner kommt ${ARRIVAL} zu Ihrem Fahrzeug, Tag und Nacht. Nennen Sie Ihren Standort am Telefon oder per WhatsApp, und Sie hören sofort, wann jemand bei Ihnen sein kann. Eine pauschale Minutenangabe nennen wir nicht — sie fällt je Ort und Tageszeit anders aus.`,
    },
    {
      q: `Was kostet ein Autoschlüssel in ${region.name}?`,
      a: 'Das hängt von Marke, Modell, Baujahr und Schlüsselart ab: ein Transponderschlüssel ist die einfachste Arbeit, ein Keyless-Go-Schlüssel die aufwendigste, und ohne vorhandenes Original müssen die Schlüsseldaten erst aus dem Steuergerät gelesen werden. Sie hören den Festpreis am Telefon, bevor jemand losfährt — als Bruttopreis inklusive 19 % MwSt.',
    },
    {
      q: `Ich habe meinen Autoschlüssel in ${region.name} verloren. Muss das Fahrzeug zum Händler?`,
      a: 'Nein. Wir öffnen das Fahrzeug schadenfrei, wenn es verschlossen ist, lesen die Schlüsseldaten aus dem Steuergerät und fertigen vor Ort einen neuen Schlüssel an. Abschleppen zum Vertragshändler ist nicht nötig.',
    },
    {
      q: `Für welche Marken kommen Sie nach ${region.name}?`,
      a: `Für alle gängigen Marken${brands.length ? `, in ${region.name} vor allem ${brands.join(', ')}` : ''}. Nennen Sie uns Marke, Modell und Baujahr aus Ihrer Zulassungsbescheinigung Teil I — anders als in den Niederlanden gibt es in Deutschland kein öffentliches Register, das uns das zu einem Kennzeichen beantworten könnte.`,
    },
  ];

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_CONFIG.domain}/regionen/${region.slug}#service`,
    name: `Autoschlüssel nachmachen und Notdienst in ${region.name}`,
    serviceType: 'Autoschlüssel nachmachen, Autoschlüssel verloren, Auto öffnen',
    url: `${SITE_CONFIG.domain}/regionen/${region.slug}`,
    provider: getBaseLocalBusinessSchema(),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: region.name,
      containsPlace: cities.map((c) => ({
        '@type': 'City',
        name: c.city,
        url: `${SITE_CONFIG.domain}/staedte/${c.slug}`,
        geo: { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lng },
      })),
    },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const crumbs = breadcrumbSchema([
    { name: 'Einsatzgebiet', path: '/staedte' },
    { name: region.name, path: `/regionen/${region.slug}` },
  ]);

  return (
    <div>
      <script id={`regio-service-${region.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script id={`regio-faq-${region.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id={`regio-bc-${region.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Einsatzgebiet', href: '/staedte' }, { label: region.name }]}
        titleTop={`Autoschlüssel nachmachen in ${region.label}`}
        titleAccent="Festpreis vorab, vor Ort erledigt"
        lead={`${region.intro} Schlüssel verloren, defekt oder einen Zweitschlüssel nötig? Unser Partner kommt zu Ihrem Fahrzeug.`}
        facts={<HeroQuickFacts price={preisAb('transponder')} />}
        image={{
          src: '/images/seo/autoschluessel24_autoschluessel-spezialist_vor_ort.webp',
          alt: 'Autoschlüssel-Spezialist in Arbeitskleidung am Fahrzeug, Servicefahrzeug im Hintergrund',
        }}
      >
        <LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />
      </SplitHero>

      <VerifiedReviewBanner />

      <section style={{ maxWidth: 1100, margin: '2rem auto 0', padding: '0 1.25rem' }} aria-label={`Karte unseres Einsatzgebiets, auch in ${region.name}`}>
        <h2 style={{ marginBottom: '1rem' }}>Unser Einsatzgebiet, auch in {region.name}</h2>
        <InstantServiceMap />
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <h2 style={{ marginBottom: '1rem' }}>Städte in {region.name}, in die wir kommen</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Wählen Sie Ihre Stadt für die Stadtteile, den Ablauf und den Preis. Fehlt Ihr Ort,
            rufen Sie einfach an: unsere Partner fahren auch in die Gemeinden ringsum.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {cities.map((c) => (
              <li key={c.slug} style={{ border: '1px solid var(--gray-200)', borderRadius: 10, padding: '1rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                  <Link href={`/staedte/${c.slug}`} style={link}>{c.city}</Link>
                </h3>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  {c.subAreas.slice(0, 4).join(', ')}
                </p>
                {c.localFact ? (
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem', lineHeight: 1.55, marginTop: '0.4rem' }}>
                    {c.localFact.split('. ')[0].replace(/\.$/, '')}.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1rem' }}>Was Sie in {region.name} erwarten können</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Situation</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Preis (inkl. MwSt.)</th>
                </tr>
              </thead>
              <tbody>
                {/* Betrag aus der Konfiguration, oder "Festpreis vorab" — nie ein
                    Platzhalter. Siehe preisAb in config/leistungen.ts. */}
                {([
                  ['Zweitschlüssel (Transponder)', preisAb('transponder')],
                  ['Klappschlüssel mit Funkfernbedienung', preisAb('klapsleutel')],
                  ['Keyless Go / Smart Key', preisAb('smartKey')],
                  ['Alle Schlüssel verloren', preisAb('allKeysLost')],
                ] as [string, string | undefined][]).map(([label, price]) => (
                  <tr key={label}>
                    <td style={{ padding: '0.9rem' }}>{label}</td>
                    <td style={{ padding: '0.9rem' }}><strong>{price ?? 'Festpreis vorab'}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Bruttopreise {SITE_CONFIG.prices.exVatDisclaimer}, mit 12 Monaten Garantie auf Schlüssel
            und Anlernen. Den genauen Festpreis hören Sie am Telefon, bevor jemand losfährt.{' '}
            <Link href="/preise" style={link}>Alle Preise ansehen →</Link>
          </p>
        </div>
      </section>

      {/*
        * Hier steht auf der niederländischen Seite der Randstad-Abschnitt.
        * Er fehlt hier mit Absicht — die Begründung steht oben im Dateikopf:
        * für Berlin, Hamburg, Bayern und Hessen gibt es kein gemeinsames Wort,
        * und eines zu erfinden hieße eine Nähe zu behaupten, die es nicht gibt.
        */}

      <section className="section">

        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '2rem' }}>Häufige Fragen: Autoschlüssel in {region.name}</h2>
          {faq.map((f, i) => (
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
          <p style={{ marginTop: '2rem', color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Alles zu einem verlorenen Schlüssel steht auf{' '}
            <Link href="/autoschluessel-verloren" style={link}>Autoschlüssel verloren</Link>, der Ablauf für einen Zweitschlüssel auf{' '}
            <Link href="/leistungen/autoschluessel-nachmachen" style={link}>Autoschlüssel nachmachen</Link>. Andere Regionen:{' '}
            {others.map((r, i) => (
              <span key={r.slug}>
                <Link href={`/regionen/${r.slug}`} style={link}>{r.name}</Link>
                {i < others.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  );
}
