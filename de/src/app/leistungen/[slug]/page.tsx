import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LEISTUNGEN, findLeistung, abPreis, FAQ } from '@/config/leistungen';
import { STAEDTE } from '@/config/staedte';
import { SITE, isReady } from '@/config/site';
import Faq from '@/components/Faq';
import { JsonLd, serviceSchema, faqSchema, breadcrumbSchema } from '@/lib/schema';

export function generateStaticParams() {
  return LEISTUNGEN.map((l) => ({ slug: l.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const l = findLeistung(slug);
  if (!l) return {};
  return {
    title: `${l.titel} — mobiler Service`,
    description: l.kurz,
    alternates: { canonical: `${SITE.domain}/leistungen/${l.slug}` },
  };
}

export default async function LeistungPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const l = findLeistung(slug);
  if (!l) notFound();

  const preis = abPreis(l);
  const url = `${SITE.domain}/leistungen/${l.slug}`;

  return (
    <>
      <JsonLd
        data={[
          serviceSchema({ name: l.titel, description: l.kurz, url, abPreis: preis }),
          faqSchema(FAQ),
          breadcrumbSchema([
            { name: 'Leistungen', path: '/leistungen' },
            { name: l.titel, path: `/leistungen/${l.slug}` },
          ]),
        ]}
      />

      <section className="hero">
        <div className="wrap">
          <h1>{l.titel}</h1>
          <p className="lede">{l.kurz}</p>
          <ul className="facts">
            {preis && <li>ab {preis} € inkl. MwSt.</li>}
            <li>Dauer vor Ort: {l.dauer}</li>
            <li>Festpreis am Telefon</li>
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
        <div className="wrap prose">
          <h2>Wann Sie das brauchen</h2>
          <ul>
            {l.wann.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {!preis && (
            <p className="notice">
              Den Preis für Ihr Fahrzeug nennen wir am Telefon, bevor jemand losfährt —
              er hängt von Marke, Modell, Baujahr und Schlüsselart ab und bleibt dann
              unverändert.
            </p>
          )}
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <h2>In diesen Städten</h2>
          <p>
            {STAEDTE.map((s, i) => (
              <span key={s.slug}>
                {i > 0 && ' · '}
                <Link href={`/staedte/${s.slug}`}>{s.stadt}</Link>
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap prose">
          <h2>Häufige Fragen</h2>
          <Faq items={FAQ} />
        </div>
      </section>
    </>
  );
}
