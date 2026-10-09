import Link from 'next/link';
import { SITE, isReady } from '@/config/site';
import { STAEDTE } from '@/config/staedte';
import { LEISTUNGEN, FAQ, abPreis } from '@/config/leistungen';
import Faq from '@/components/Faq';
import { JsonLd, faqSchema } from '@/lib/schema';

/**
 * Startseite.
 *
 * Die Reihenfolge ist gegen das Problem geschrieben, das diese Branche in
 * Deutschland hat: Festpreis zuerst, Geschwindigkeit danach. Ein deutscher
 * Suchender prüft bei einem Schlüsseldienst erst, ob er am Ende mehr zahlt als
 * abgesprochen — darum steht "Preis vorher, und er bleibt" ganz oben und nicht
 * "in 30 Minuten da".
 */
export default function Home() {
  return (
    <>
      <JsonLd data={faqSchema(FAQ)} />

      <section className="hero">
        <div className="wrap">
          <h1>Autoschlüssel nachmachen — der Partner kommt zu Ihrem Fahrzeug</h1>
          <p className="lede">
            Schlüssel verloren, abgebrochen oder nur noch einer da? Unsere Partnerbetriebe
            in Berlin, Hamburg, München und Frankfurt am Main fräsen und programmieren
            vor Ort — an der Straße, in der Tiefgarage oder auf dem Betriebshof.
          </p>
          <ul className="facts">
            <li>Festpreis am Telefon, vor der Anfahrt</li>
            <li>Alle Preise inkl. 19 % MwSt.</li>
            <li>Keine Anfahrts-, Nacht- oder Wochenendzuschläge</li>
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
            <Link className="btn btn-ghost" href="/preise" style={{ color: 'var(--frost)' }}>
              Preise ansehen
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Was wir machen</h2>
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

      <section className="section section-alt">
        <div className="wrap">
          <h2>Wo wir sind</h2>
          <p className="lede">
            In diesen vier Städten steht ein Partnerbetrieb, der zu Ihnen herauskommt.
            Mehr Städte kommen dazu, sobald dort ein Partner ist — wir führen keine
            Stadt auf, in die niemand fährt.
          </p>
          <div className="grid">
            {STAEDTE.map((s) => (
              <article className="card" key={s.slug}>
                <h3>{s.stadt}</h3>
                <p>{s.typischerAuftrag}</p>
                <Link href={`/staedte/${s.slug}`}>Autoschlüssel in {s.stadt} →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Häufige Fragen</h2>
          <div className="prose">
            <Faq items={FAQ} />
          </div>
        </div>
      </section>
    </>
  );
}
