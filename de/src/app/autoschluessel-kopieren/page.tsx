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

/*
 * "Kopieren" liegt dicht genug an "nachmachen", um gefährlich zu sein — darum
 * ist das mit Absicht keine zweite Nachmachen-Seite.
 *
 * Das Wort zählt wegen der Erwartung, die darin steckt: kopieren ist, was ein
 * Schuhmacher für drei Euro macht, während man wartet. Genau diese Erwartung
 * ist der Grund, warum Leute vom Preis eines Autoschlüssels überrascht sind.
 * Diese Seite beantwortet deshalb die Frage hinter dem Wort — was Kopieren bei
 * einem Fahrzeug ab etwa 1998 bringt und was nicht — und gibt die
 * Auftragsabsicht an /leistungen/autoschluessel-nachmachen weiter, statt mit
 * ihr zu konkurrieren.
 *
 * Sollte diese Seite irgendwann für das einfache "autoschlüssel nachmachen"
 * ranken statt für "kopieren", gehört sie in jene Seite hineingefaltet und
 * nicht daneben gehalten.
 */

const PAGE_PATH = '/autoschluessel-kopieren';
const PAGE_URL = `${SITE_CONFIG.domain}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: { absolute: 'Autoschlüssel kopieren: Wann geht das — und wann nicht?' },
  description:
    'Autoschlüssel kopieren? Bei einem Fahrzeug ab etwa 1998 passt die Kopie, startet den Motor aber nicht, solange der Transponder nicht angelernt ist. Was wirklich nötig ist — Festpreis vorab.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'de-DE': PAGE_URL },
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'Autoschlüssel kopieren: Wann geht das — und wann nicht?',
    description:
      'Einen Autoschlüssel zu kopieren ist mehr als das Nachfräsen eines Blechs. Was ein modernes Fahrzeug wirklich braucht.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autoschlüssel kopieren — Autoschlüssel24' }],
  },
};

const faqItems = [
  {
    q: 'Kann ich meinen Autoschlüssel beim Schlüsseldienst im Baumarkt kopieren lassen?',
    a: 'Das Blech ja, den Rest nicht. Eine Schlüsselfräse kopiert das mechanische Profil — damit öffnen Sie die Tür und der Schlüssel passt ins Zündschloss. Bei praktisch jedem Fahrzeug ab 1998 sitzt aber ein Transponder im Schlüsselkopf, der sich bei der Wegfahrsperre melden muss. Der wird beim Fräsen nicht mitkopiert. Ergebnis: der Schlüssel passt, der Motor startet nicht.',
  },
  {
    q: 'Was ist dann der Unterschied zum Nachmachen?',
    a: 'Kopieren betrifft das Metall, Nachmachen das Ganze. Wir fräsen das Schlüsselblatt auf Ihr Schließsystem und lernen den Transponder über die OBD-Schnittstelle an der Wegfahrsperre an. Erst danach kann der neue Schlüssel alles, was Ihr Original kann: öffnen, starten und in der Regel auch die Funkfernbedienung.',
  },
  {
    q: 'Wann genügt reines Kopieren?',
    a: 'Bei Fahrzeugen etwa vor 1998 ohne Wegfahrsperre, und bei einem Zweitschlüssel, den Sie nur zum Öffnen der Tür brauchen — etwa ein Notschlüssel für die Garage. Alles, was starten muss, braucht das Anlernen.',
  },
  {
    q: 'Woran erkenne ich, ob mein Schlüssel einen Transponder hat?',
    a: 'Mit großer Sicherheit hat er einen, wenn das Fahrzeug nach 1998 gebaut wurde, wenn es einen Startknopf hat, oder wenn Tasten zum Ver- und Entriegeln auf dem Schlüssel sitzen. Im Zweifel nennen Sie uns Marke, Modell und Baujahr aus Ihrer Zulassungsbescheinigung Teil I, und wir sagen Ihnen, welche Schlüsselart dazugehört.',
  },
  {
    q: 'Was kostet Kopieren und Anlernen?',
    a: 'Das hängt von der Schlüsselart ab: ein Transponderschlüssel ist die einfachste Arbeit, ein Keyless-Go-Schlüssel die aufwendigste, und ohne jeden funktionierenden Schlüssel müssen die Daten erst aus dem Steuergerät gelesen werden. Sie hören den Festpreis am Telefon, bevor jemand losfährt. Alle Beträge sind Bruttopreise inklusive 19 % MwSt.',
  },
  {
    q: 'Kann ich einen Schlüssel online kaufen und ihn anlernen lassen?',
    a: 'Manchmal. Ein leeres Gehäuse oder einen Rohling in guter Qualität können wir anlernen. Viele günstige Angebote passen aber nicht zum Modell oder enthalten einen Transponder, der sich nicht beschreiben lässt — dann ist das Geld weg und das Auto steht noch. Wir liefern den Schlüssel deshalb lieber mit, mit 12 Monaten Garantie auf Teil und Anlernen.',
  },
];

/*
 * Die Zeilen der Tabelle.
 *
 * preisAb() gibt undefined zurück, solange der Betrag in site.config.ts auf
 * TBD steht — die Zeile zeigt dann "Festpreis vorab". Die niederländische
 * Fassung schrieb die Beträge direkt in den Text und hätte hier "€__TBD__"
 * gezeigt. Zwei Zeilen sagen schon dort "Preis auf Anfrage", weil das Fräsen
 * ohne Anlernen keine eigene Preisposition ist.
 */
const rows: [string, string, string | undefined][] = [
  ['Fahrzeug vor etwa 1998, keine Wegfahrsperre', 'Nur Schlüsselblatt fräsen', undefined],
  ['Notschlüssel, nur zum Öffnen der Tür', 'Nur Schlüsselblatt fräsen', undefined],
  ['Zweitschlüssel, der starten soll', 'Fräsen + Transponder anlernen', preisAb('transponder')],
  ['Klappschlüssel mit Funkfernbedienung', 'Fräsen + Transponder + Funk anlernen', preisAb('klapsleutel')],
  ['Keyless Go / Smart Key', 'Im Keyless-System anlernen', preisAb('smartKey')],
  ['Kein funktionierender Schlüssel mehr', 'Schlüsseldaten aus dem Steuergerät lesen', preisAb('allKeysLost')],
];

export default function AutoschluesselKopieren() {
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
      { '@type': 'ListItem', position: 2, name: 'Autoschlüssel kopieren', item: PAGE_URL },
    ],
  };

  return (
    <div>
      <script id="kop-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="kop-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Autoschlüssel kopieren' }]}
        titleTop="Autoschlüssel kopieren?"
        titleAccent="Das Blech ist der einfache Teil"
        lead="Einen Autoschlüssel zu kopieren klingt nach dem Nachfräsen eines Stücks Metall. Bei einem modernen Fahrzeug ist das höchstens die Hälfte der Arbeit — die andere Hälfte steckt in einem Chip von der Größe eines Reiskorns."
        facts={<HeroQuickFacts price={preisAb('transponder')} />}
        image={{
          src: '/images/seo/autoschluessel_spezialist_background.webp',
          alt: 'Schlüsselwand mit Rohlingen und Transpondergehäusen nach Fahrzeugmarke',
        }}
      >
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />
      <BrandsMarquee />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1rem' }}>Warum Kopieren allein nicht genügt</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Ein Autoschlüssel besteht seit Ende der neunziger Jahre aus zwei Dingen, die unabhängig
            voneinander arbeiten. Das erste ist das Schlüsselblatt: das gefräste Profil, das
            mechanisch ins Schloss passt. Das ist, was eine Schlüsselfräse kopiert, und es kostet
            wenige Euro.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Das zweite ist der Transponder — ein passiver Chip im Schlüsselkopf, ohne eigene
            Batterie. Drehen Sie den Schlüssel, weckt eine Spule rund um das Zündschloss diesen Chip
            und fragt einen Code ab. Stimmt die Antwort nicht, dreht der Anlasser zwar, aber die
            Motorsteuerung gibt weder Kraftstoff noch Zündung frei. Dieser Code liegt in der
            Wegfahrsperre <em>Ihres</em> Fahrzeugs und wird beim Fräsen nirgends mitkopiert.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Deshalb heißt es bei uns nicht kopieren, sondern nachmachen: das Schlüsselblatt wird auf
            Ihr Schließsystem gefräst und der neue Transponder über die OBD-Schnittstelle im
            Steuergerät hinterlegt. Erst dann haben Sie einen zweiten Schlüssel und nicht ein
            zweites Stück Metall.
          </p>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Was in Ihrem Fall nötig ist</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Situation</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Was nötig ist</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Preis</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([situation, work, price]) => (
                  <tr key={situation}>
                    <td style={{ padding: '0.9rem' }}>{situation}</td>
                    <td style={{ padding: '0.9rem' }}>{work}</td>
                    <td style={{ padding: '0.9rem' }}>
                      {price ? <strong>{price}</strong> : 'auf Anfrage'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Alle Beträge sind Bruttopreise {SITE_CONFIG.prices.exVatDisclaimer} und hängen von
            Marke, Modell und Baujahr ab. Den genauen Festpreis hören Sie am Telefon, bevor jemand
            losfährt.{' '}
            <Link href="/preise" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Zur vollständigen Preisübersicht →
            </Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '2rem' }}>Häufige Fragen — Autoschlüssel kopieren</h2>
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
          <p style={{ marginTop: '2rem', color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Sie wissen schon, dass Sie einen funktionierenden Zweitschlüssel brauchen? Preis, Ablauf
            und Garantie stehen auf{' '}
            <Link href="/leistungen/autoschluessel-nachmachen" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Autoschlüssel nachmachen
            </Link>
            . Haben Sie gar keinen Schlüssel mehr, beginnen Sie bei{' '}
            <Link href="/autoschluessel-verloren" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Autoschlüssel verloren
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
