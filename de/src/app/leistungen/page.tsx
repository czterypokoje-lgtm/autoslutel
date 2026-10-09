import type { Metadata } from 'next';
import Link from 'next/link';
import { LEISTUNGEN, abPreis } from '@/config/leistungen';
import { SITE } from '@/config/site';
import { JsonLd, breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Leistungen — Autoschlüssel-Service',
  description:
    'Autoschlüssel nachmachen, verlorene Schlüssel ersetzen, Funk- und Keyless-Go-Schlüssel anlernen, Fahrzeuge schadenfrei öffnen, Zündschloss reparieren.',
  alternates: { canonical: `${SITE.domain}/leistungen` },
};

export default function LeistungenPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Leistungen', path: '/leistungen' }])} />
      <section className="section">
        <div className="wrap">
          <h1>Leistungen</h1>
          <p className="lede">
            Alles, was am Schlüssel und am Schließsystem vor Ort gemacht werden kann —
            ohne dass das Fahrzeug bewegt werden muss.
          </p>
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
    </>
  );
}
