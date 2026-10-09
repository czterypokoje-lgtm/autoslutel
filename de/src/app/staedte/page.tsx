import type { Metadata } from 'next';
import Link from 'next/link';
import { STAEDTE } from '@/config/staedte';
import { SITE } from '@/config/site';
import { JsonLd, breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Städte — Autoschlüssel-Service vor Ort',
  description:
    'Autoschlüssel nachmachen in Berlin, Hamburg, München und Frankfurt am Main. Der Partnerbetrieb kommt zu Ihrem Fahrzeug.',
  alternates: { canonical: `${SITE.domain}/staedte` },
};

export default function StaedtePage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Städte', path: '/staedte' }])} />
      <section className="section">
        <div className="wrap">
          <h1>Autoschlüssel-Service in Ihrer Stadt</h1>
          <p className="lede">
            Vier Städte, in jeder ein eigener Partnerbetrieb. Diese Liste wächst mit dem
            Netzwerk und nicht mit unseren Plänen: eine Seite für eine Stadt, in die
            niemand fährt, hilft niemandem.
          </p>
          <div className="grid">
            {STAEDTE.map((s) => (
              <article className="card" key={s.slug}>
                <h3>{s.stadt}</h3>
                <p>{s.stadtteile.slice(0, 5).join(' · ')} und weitere</p>
                <Link href={`/staedte/${s.slug}`}>Autoschlüssel in {s.stadt} →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
