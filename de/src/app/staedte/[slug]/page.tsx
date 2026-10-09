import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { STAEDTE, findStadt } from '@/config/staedte';
import { LEISTUNGEN, FAQ, abPreis } from '@/config/leistungen';
import { SITE, isReady } from '@/config/site';
import Faq from '@/components/Faq';
import { JsonLd, serviceSchema, faqSchema, breadcrumbSchema } from '@/lib/schema';

/*
 * Eine Stadt, eine Seite — aber nur für Städte mit einem Partner.
 *
 * generateStaticParams liest STAEDTE, und dort stehen genau die vier. Damit ist
 * die Regel nicht eine Absicht, sondern eine Eigenschaft des Builds: es gibt
 * keine Stadtseite ohne Partner, weil es keine Daten dafür gibt.
 */
export function generateStaticParams() {
  return STAEDTE.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stadt = findStadt(slug);
  if (!stadt) return {};
  const url = `${SITE.domain}/staedte/${stadt.slug}`;
  return {
    title: `Autoschlüssel nachmachen ${stadt.stadt} — mobiler Service`,
    description: `Autoschlüssel nachmachen oder verloren in ${stadt.stadt}? Der Partnerbetrieb kommt zu Ihrem Fahrzeug. Festpreis vorab, inkl. MwSt.`,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: SITE.ogLocale,
      url,
      title: `Autoschlüssel nachmachen ${stadt.stadt}`,
    },
    other: {
      'geo.region': 'DE',
      'geo.placename': `${stadt.stadt}, Deutschland`,
      'geo.position': `${stadt.geo.lat};${stadt.geo.lng}`,
      ICBM: `${stadt.geo.lat}, ${stadt.geo.lng}`,
    },
  };
}

export default async function StadtPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stadt = findStadt(slug);
  if (!stadt) notFound();

  const url = `${SITE.domain}/staedte/${stadt.slug}`;
  const andere = STAEDTE.filter((s) => s.slug !== stadt.slug);

  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            name: `Autoschlüssel nachmachen ${stadt.stadt}`,
            description: `Mobiler Autoschlüssel-Service in ${stadt.stadt}: nachmachen, programmieren, öffnen.`,
            url,
            stadt: stadt.stadt,
          }),
          faqSchema(FAQ),
          breadcrumbSchema([
            { name: 'Städte', path: '/staedte' },
            { name: stadt.stadt, path: `/staedte/${stadt.slug}` },
          ]),
        ]}
      />

      <section className="hero">
        <div className="wrap">
          <h1>Autoschlüssel nachmachen in {stadt.stadt}</h1>
          <p className="lede">{stadt.vorOrt}</p>
          <ul className="facts">
            <li>Festpreis am Telefon, vor der Anfahrt</li>
            <li>Inkl. 19 % MwSt., keine Zuschläge</li>
            <li>{SITE.hoursShort}</li>
          </ul>
          <div className="btn-row">
            {isReady(SITE.phone) ? (
              <a className="btn btn-primary" href={`tel:${SITE.phoneTel}`}>
                {SITE.phone} — jetzt anrufen
              </a>
            ) : (
              <Link className="btn btn-primary" href="/kontakt">
                Kontakt aufnehmen
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Häufigster Auftrag in {stadt.stadt}</h2>
          <p className="lede">{stadt.typischerAuftrag}</p>

          <h2 style={{ marginTop: '2rem' }}>Stadtteile, in die unser Partner fährt</h2>
          <p className="prose">{stadt.stadtteile.join(' · ')}</p>
          <p className="notice">
            Ihr Stadtteil ist nicht dabei? Rufen Sie an — die Liste nennt die Gebiete,
            in denen unser Partner regelmäßig arbeitet, nicht die Grenze seines
            Einsatzgebiets.
          </p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <h2>Leistungen in {stadt.stadt}</h2>
          <div className="grid">
            {LEISTUNGEN.map((l) => {
              const preis = abPreis(l);
              return (
                <article className="card" key={l.slug}>
                  <h3>{l.titel}</h3>
                  {preis && <p className="price-tag">ab {preis} €</p>}
                  <p>{l.kurz}</p>
                  <Link href={`/leistungen/${l.slug}`}>Mehr dazu →</Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Häufige Fragen</h2>
          <div className="prose">
            <Faq items={FAQ} />
          </div>
          <h2 style={{ marginTop: '2rem' }}>Andere Städte</h2>
          <p>
            {andere.map((s, i) => (
              <span key={s.slug}>
                {i > 0 && ' · '}
                <Link href={`/staedte/${s.slug}`}>{s.stadt}</Link>
              </span>
            ))}
          </p>
        </div>
      </section>
    </>
  );
}
