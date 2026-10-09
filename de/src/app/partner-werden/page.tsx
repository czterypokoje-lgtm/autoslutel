import type { Metadata } from 'next';
import { SITE, isReady } from '@/config/site';
import { STAEDTE } from '@/config/staedte';
import { JsonLd, breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Partner werden — Aufträge statt Klickkosten',
  description:
    'Sie machen Autoschlüssel und kaufen Ihre Aufträge heute bei Google. Wir bieten dasselbe Geld für einen gebuchten Auftrag zum vereinbarten Preis.',
  alternates: { canonical: `${SITE.domain}/partner-werden` },
};

/**
 * Partnerwerbung — und das ist in Deutschland die Seite, die zuerst ranken muss.
 *
 * Nicht aus Bescheidenheit, sondern weil die Rechnung so aufgeht: ohne Partner
 * in einer Stadt gibt es dort keine Stadtseite, kein Unternehmensprofil und
 * keinen Platz im lokalen Dreierpack. Jeder gewonnene Partner ist also eine
 * Stadt, die überhaupt erst ranken kann. Dazu sind die Suchbegriffe hier
 * ("Schlüsseldienst Partner werden", "Aufträge Autoschlüssel") fast
 * konkurrenzlos, während die Verbraucherbegriffe dieser Branche zu den
 * teuersten in Deutschland gehören.
 *
 * Das Argument ist nicht erfunden: es steht in subscription.ts der
 * niederländischen Seite — jeder selbstständige Autoschlüsseldienst kauft
 * seine Aufträge schon, nur eben bei Google, pro Klick, für einen Fremden mit
 * einem Auto, das vielleicht niemand kann.
 */
export default function PartnerPage() {
  const offen = STAEDTE.map((s) => s.stadt);
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Partner werden', path: '/partner-werden' }])} />

      <section className="hero">
        <div className="wrap">
          <h1>Aufträge, statt Klicks zu kaufen</h1>
          <p className="lede">
            Sie machen Autoschlüssel und kaufen Ihre Aufträge heute bei Google — pro
            Klick, für einen Fremden mit einem Fahrzeug, das Sie vielleicht nicht
            bedienen können. Bei uns ist es dasselbe Geld für einen gebuchten Auftrag
            zum vorher vereinbarten Preis.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Wie es läuft</h2>
          <div className="grid">
            <article className="card">
              <h3>Sie nennen Ihren Preis</h3>
              <p>
                Sie hinterlegen, was ein Auftrag Ihnen wert ist — pro Fahrzeugtyp und
                pro Arbeit. Wir legen unsere Marge darauf und nennen dem Kunden den
                Endpreis. Was Sie bekommen, steht vorher fest.
              </p>
            </article>
            <article className="card">
              <h3>Sie bekommen ein Angebot, keinen Befehl</h3>
              <p>
                Passende Aufträge erscheinen in Ihrer App und über Telegram, mit
                Fahrzeug, Ort und Zeitfenster. Annehmen oder ablehnen — ablehnen kostet
                nichts und wird nicht kommentiert.
              </p>
            </article>
            <article className="card">
              <h3>Sie bleiben Ihr eigener Betrieb</h3>
              <p>
                Eigene Kunden, eigene Zeiten, eigenes Fahrzeug. Sie sind kein
                Angestellter und sollen auch keiner werden — deshalb ist das Angebot
                ein Angebot und keine Zuweisung.
              </p>
            </article>
            <article className="card">
              <h3>Verwaltung inklusive</h3>
              <p>
                Auftragsübersicht, Kalender, Rechnungen und Ihr Guthaben laufen über
                unser System. Auf Deutsch — die Sprache stellen Sie in Ihrem Profil
                selbst ein.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap prose">
          <h2>Was wir von Ihnen erwarten</h2>
          <ul>
            <li>Ein angemeldeter Betrieb mit USt-IdNr. und Betriebshaftpflicht</li>
            <li>Eigene Ausrüstung für Schlüsselfräsen und Programmierung</li>
            <li>Dass Sie sagen, was Sie nicht können — lieber vorher als vor dem Auto</li>
            <li>Dass der am Telefon genannte Festpreis vor Ort gehalten wird</li>
          </ul>
          <p className="notice">
            Ob und wie Ihre Tätigkeit eine Eintragung bei der Handwerkskammer erfordert,
            klären wir gemeinsam vor dem Start — das hängt vom Zuschnitt Ihres Betriebs
            ab, und wir schicken niemanden mit einer ungeprüften Auskunft los.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Wo wir gerade suchen</h2>
          <p className="lede">
            Partner haben wir in {offen.join(', ')}. Gesucht wird überall sonst — am
            dringendsten im Rheinland (Köln, Düsseldorf, Essen, Dortmund), in Stuttgart
            und in Leipzig, weil dort Anfragen hereinkommen, die wir heute nicht
            annehmen können.
          </p>
          <div className="btn-row">
            {isReady(SITE.phone) ? (
              <a className="btn btn-primary" href={`tel:${SITE.phoneTel}`}>
                {SITE.phone} — anrufen
              </a>
            ) : null}
            {isReady(SITE.email) ? (
              <a className="btn btn-ghost" href={`mailto:${SITE.email}?subject=Partner%20werden`}>
                Per E-Mail melden
              </a>
            ) : null}
          </div>
          {!isReady(SITE.phone) && !isReady(SITE.email) && (
            <p className="notice">
              Die deutschen Kontaktdaten werden gerade eingerichtet und erscheinen hier,
              sobald sie stehen.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
