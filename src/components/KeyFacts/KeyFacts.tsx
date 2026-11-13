import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';

/*
 * The two blocks Google's AI Overview actually cites, in one place.
 *
 * Live capture of google.nl for "autosleutel bijmaken" (4.400/mnd): an AI
 * Overview leads the page and answers the cost question outright, with a
 * price table and a document checklist. The five sources it cites
 * (autosleutelbijmaken.nl, Haverkamp Deventer, allianzdirect.nl, Autosleutels
 * Holland, Werkspot) have one thing in common: explicit numbers and an
 * explicit "wat heeft u nodig" list in crawlable text, on a URL that matches
 * the question. Autosleutel24 was in that SERP only as a paid ad.
 *
 * Both halves already existed on exactly one page, /autosleutel-laten-maken,
 * which is why that page sits at position 11 while the pages people actually
 * search for sit at 13-19. So they are extracted here rather than retyped:
 * the prices read from SITE_CONFIG.prices like every other "vanaf" on the
 * site, and the wording of the checklist is the wording the owner already
 * confirmed on the Renault page.
 *
 * The two statements in DOCS_FACTS are the honest ones and the rankable ones
 * at the same time. A kenteken is not a sleutelcode, and a freshly cut blade
 * is not a working key. Competitors blur both; the AI Overview rewards the
 * page that says it plainly, and the owner confirmed both on 2026-11-10.
 */

const cell = { padding: '0.9rem' } as const;
const head = { textAlign: 'left', padding: '0.9rem' } as const;

/*
 * `bare` exists because half the target pages are a full-width stack of
 * sections and the other half (notably /diensten/autosleutel-bijmaken) put
 * their prose in a narrow column inside an existing grid. Wrapping a
 * container inside that column would break the layout, so the caller says
 * which it is rather than the block guessing.
 */
function Wrap({ bare, alt, children }: { bare?: boolean; alt?: boolean; children: React.ReactNode }) {
  if (bare) return <div>{children}</div>;
  return (
    <section className={alt ? 'section-alt' : 'section'}>
      <div className="container" style={{ maxWidth: 860 }}>{children}</div>
    </section>
  );
}

const PRICE_ROWS = [
  { type: 'Transpondersleutel', from: SITE_CONFIG.prices.transponder, included: 'Frezen én inleren op de startonderbreker' },
  { type: 'Klapsleutel met afstandsbediening', from: SITE_CONFIG.prices.klapsleutel, included: 'Frezen, inleren en afstandsbediening koppelen' },
  { type: 'Smart key / keyless', from: SITE_CONFIG.prices.smartKey, included: 'Inleren op de boordcomputer, start-stop getest' },
  { type: 'Alle sleutels kwijt', from: SITE_CONFIG.prices.allKeysLost, included: 'Auto openen, sleutelcode uitlezen, frezen en inleren' },
];

/**
 * The price question, answered in numbers before the reader has to click.
 *
 * `where` puts the city in the heading on the 62 city pages without making
 * them 62 different tables: the prices are national.
 */
export function KeyPriceTable({ where, heading, bare }: { where?: string; heading?: string; bare?: boolean }) {
  return (
    <Wrap bare={bare}>
        <h2 style={{ marginBottom: '1rem' }}>
          {heading ?? `Wat kost een autosleutel bijmaken${where ? ` in ${where}` : ''}?`}
        </h2>
        <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
          Een reservesleutel laten bijmaken kost bij ons vanaf €{SITE_CONFIG.prices.transponder},-. Bent u
          alle sleutels kwijt, dan begint het bij €{SITE_CONFIG.prices.allKeysLost},-, omdat de sleutelcode
          dan eerst uit de auto gehaald moet worden. Alle bedragen zijn all-in: frezen, programmeren en
          voorrijden zitten erbij.
        </p>
        <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
          <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr>
                <th style={head}>Type sleutel</th>
                <th style={head}>Prijs vanaf</th>
                <th style={head}>Inbegrepen</th>
              </tr>
            </thead>
            <tbody>
              {PRICE_ROWS.map((r) => (
                <tr key={r.type}>
                  <td style={cell}>{r.type}</td>
                  <td style={cell}><strong>€{r.from},-</strong></td>
                  <td style={cell}>{r.included}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
          Vanafprijzen, afhankelijk van merk, model en bouwjaar. U hoort de exacte prijs telefonisch
          voordat wij vertrekken.{' '}
          <Link href="/prijzen" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
        Bekijk het volledige prijsoverzicht →
      </Link>
    </p>
    </Wrap>
  );
}

const DOCS = [
  'Een geldig legitimatiebewijs: paspoort, ID-kaart of rijbewijs.',
  'Het kentekenbewijs van de auto — de kentekencard of deel 1B.',
  'De auto zelf, op de plek waar de monteur komt. Programmeren gebeurt altijd aan de auto.',
  'Heeft u nog een werkende sleutel? Houd die bij de hand: bijmaken is dan goedkoper dan alle sleutels kwijt.',
  'Staat de auto op naam van een bedrijf of op een andere naam? Neem dan ook een bewijs mee dat u de auto mag gebruiken.',
];

const DOCS_FACTS = [
  {
    q: 'Een kenteken is geen sleutelcode',
    a: 'Met uw kenteken zoeken wij merk, model, bouwjaar en de juiste sleutelbaard en chip op — dat is genoeg om te weten wélke sleutel u nodig heeft. De sleutelcode zelf staat niet in het kentekenregister. Die komt van de codekaart die bij de autopapieren hoort, van de merkdealer (die mag hem op kenteken en chassisnummer opzoeken als u eigenaar bent), of wij decoderen hem ter plaatse uit het slot.',
  },
  {
    q: 'Een gefreesde sleutel is nog geen werkende sleutel',
    a: 'De gefreesde baard opent het portier, maar de motor start pas als de transponder is ingeleerd op de startonderbreker van uw auto. Frezen en programmeren zijn twee aparte handelingen, en het programmeren kan alleen aan de auto zelf. Bij ons zit het allebei in de prijs.',
  },
];

/**
 * The checklist half of the pattern. A real <ul>, not a paragraph: the list
 * is what gets lifted into an answer box, and a sentence is not.
 */
export function WatHeeftUNodig({ where, heading, bare }: { where?: string; heading?: string; bare?: boolean }) {
  return (
    <Wrap bare={bare} alt>
        <h2 style={{ marginBottom: '1rem' }}>
          {heading ?? `Wat heeft u nodig om een autosleutel te laten bijmaken${where ? ` in ${where}` : ''}?`}
        </h2>
        <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
          Om diefstal te voorkomen maken wij alleen een sleutel bij voor de rechtmatige eigenaar. Houd
          daarom het volgende bij de hand:
        </p>
        <ul style={{ color: 'var(--gray-700)', lineHeight: 1.8, marginTop: '1rem', paddingLeft: '1.25rem' }}>
          {DOCS.map((d) => <li key={d} style={{ marginBottom: '0.4rem' }}>{d}</li>)}
        </ul>
        <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>Twee dingen die vaak verward worden</h3>
        <dl style={{ margin: 0 }}>
          {DOCS_FACTS.map((f) => (
            <div key={f.q} style={{ marginBottom: '1.25rem' }}>
              <dt style={{ fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>{f.q}</dt>
              <dd style={{ margin: 0, color: 'var(--gray-600)', lineHeight: 1.7 }}>{f.a}</dd>
            </div>
          ))}
        </dl>
        <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1.25rem' }}>
          Weet u niet welke sleutel u heeft?{' '}
          <Link href="/autosleutel-bestellen-op-kenteken" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
            Stuur uw kenteken door
          </Link>{' '}
          en u krijgt een vaste prijs terug. Bent u alle sleutels kwijt, lees dan{' '}
          <Link href="/autosleutel-kwijt" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
        autosleutel kwijt
      </Link>.
    </p>
    </Wrap>
  );
}

/**
 * The same two facts as FAQPage entries, for the pages that already build a
 * FAQ schema. Kept next to the prose so the two cannot drift apart.
 */
export const KEY_FACTS_FAQ = [
  { q: 'Kan ik een autosleutel laten bijmaken op kenteken?', a: `${DOCS_FACTS[0].a}` },
  { q: 'Is een gefreesde sleutel meteen een werkende sleutel?', a: `${DOCS_FACTS[1].a}` },
  { q: 'Wat moet ik meenemen als de monteur komt?', a: `U heeft nodig: ${DOCS.slice(0, 3).join(' ')}` },
];
