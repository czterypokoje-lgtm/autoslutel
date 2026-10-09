import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/utils/schema';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import ConsentPreferencesButton from '@/components/ConsentBanner/ConsentPreferencesButton';

export const metadata: Metadata = {
  title: {
    absolute: 'Cookiebeleid | Autosleutel24',
  },
  description:
    'Welke cookies Autosleutel24 gebruikt, waarvoor, hoe lang ze bewaard blijven en hoe u uw toestemming op elk moment wijzigt of intrekt.',
  alternates: { canonical: `${SITE_CONFIG.domain}/cookiebeleid` },
};

/**
 * Replaces the iubenda-hosted cookie policy, which returned 404.
 *
 * The list below describes what the site actually loads. The previous policy
 * claimed only "analytische cookies (Google Analytics 4, geanonimiseerd)"
 * while Google Ads, DoubleClick and Microsoft Clarity session recording were
 * also running — stating that inaccurately is itself a breach.
 */

const CATEGORIES = [
  {
    name: 'Noodzakelijk',
    consent: 'Altijd actief — geen toestemming vereist',
    intro:
      'Nodig om de website te laten werken en om uw cookiekeuze te onthouden. Deze cookies worden niet gebruikt om u te volgen.',
    rows: [
      ['as24_consent', 'Autosleutel24', 'Onthoudt uw cookiekeuze', '6 maanden'],
    ],
  },
  {
    name: 'Statistieken',
    consent: 'Alleen met uw toestemming',
    intro:
      'Helpt ons te begrijpen welke pagina’s werken. Microsoft Clarity maakt daarbij opnames van websessies (muisbewegingen, klikken en scrollgedrag).',
    rows: [
      ['_ga, _ga_*', 'Google Analytics 4', 'Onderscheidt bezoekers en sessies', '2 jaar'],
      ['_clck', 'Microsoft Clarity', 'Koppelt sessies aan één bezoeker', '1 jaar'],
      ['_clsk', 'Microsoft Clarity', 'Bundelt paginaweergaven in één sessie', '1 dag'],
      ['CLID', 'Microsoft Clarity', 'Identificeert het apparaat', '1 jaar'],
    ],
  },
  {
    name: 'Marketing',
    consent: 'Alleen met uw toestemming',
    intro:
      'Meet welke advertentie tot een aanvraag heeft geleid en maakt relevantere advertenties mogelijk.',
    rows: [
      ['_gcl_au', 'Google Ads', 'Meet conversies uit advertenties', '90 dagen'],
      ['IDE, test_cookie', 'Google DoubleClick', 'Advertentiemeting en -targeting', 'max. 1 jaar'],
    ],
  },
  /*
   * ClickGuard is listed on its own and not under "Marketing", because it is
   * the one entry on this page that is not placed on the basis of consent.
   *
   * It runs on art. 6 lid 1 sub f AVG — our interest in not paying for
   * fraudulent clicks on our own ads — and that interest only exists for a
   * visitor who arrived on a paid click, which is the only visitor whose
   * browser loads it (see src/components/Tracking/ClickGuard.tsx). Putting it
   * under "Marketing" would say it waits for the banner, and it does not;
   * putting it under "Noodzakelijk" would say it is not used to recognise a
   * device, and it is. Neither is true, so it gets its own heading.
   *
   * TO CONFIRM WITH CLICKGUARD: the exact cookie name and retention, from
   * their privacy policy or the DPA on the account. They are described
   * functionally below rather than guessed — an invented cookie name on this
   * page would be the same inaccuracy the docstring above warns about.
   */
  {
    name: 'Advertentiefraudepreventie',
    consent: 'Alleen bij bezoek via een advertentie — gerechtvaardigd belang, geen toestemming vereist',
    intro:
      'Wij adverteren op Google en Microsoft en betalen per klik. ClickGuard herkent frauduleuze en geautomatiseerde klikken op die advertenties, zodat wij daar niet voor blijven betalen. Deze cookie wordt uitsluitend geplaatst wanneer u via een advertentie op onze site komt — bezoekt u ons via een gewoon zoekresultaat, een link of rechtstreeks, dan wordt ClickGuard niet geladen en legt het niets over u vast. Er wordt geen profiel van u opgebouwd en de gegevens worden niet gebruikt om u advertenties te tonen.',
    rows: [
      [
        'device-id',
        'ClickGuard',
        'Herkent herhaalde of geautomatiseerde klikken vanaf hetzelfde apparaat',
        'Zie privacybeleid ClickGuard',
      ],
    ],
  },
];

const cell: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid var(--color-border, #e4e9ed)',
  fontSize: '0.875rem',
  verticalAlign: 'top',
  textAlign: 'left',
};

export default function CookiePage() {
  return (
    <main>
      <script id="bc-cookie" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Cookiebeleid', path: '/cookiebeleid' }])) }} />
      <section
        style={{
          background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)',
          padding: '4rem 2rem',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#fff' }}>Cookiebeleid</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Laatste update: {new Date().toLocaleDateString('nl-NL')}
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 2rem', maxWidth: 900 }}>
        <p style={{ lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '2rem' }}>
          Een cookie is een klein tekstbestand dat bij uw bezoek op uw apparaat
          wordt opgeslagen. Cookies voor statistieken en marketing worden pas
          geplaatst nadat u daarvoor toestemming heeft gegeven. Zonder uw
          toestemming plaatsen wij alleen noodzakelijke cookies en — uitsluitend
          wanneer u via een advertentie binnenkomt — de cookie waarmee wij
          advertentiefraude tegengaan. Alle vier de categorieën staan hieronder
          beschreven.
        </p>

        {CATEGORIES.map((cat) => (
          <div key={cat.name} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{cat.name}</h2>
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#0d5f70',
                margin: '0 0 0.6rem',
              }}
            >
              {cat.consent}
            </p>
            <p style={{ lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
              {cat.intro}
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={{ ...cell, fontWeight: 700 }}>Cookie</th>
                    <th style={{ ...cell, fontWeight: 700 }}>Aanbieder</th>
                    <th style={{ ...cell, fontWeight: 700 }}>Doel</th>
                    <th style={{ ...cell, fontWeight: 700 }}>Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.rows.map((r) => (
                    <tr key={r[0]}>
                      <td style={{ ...cell, fontFamily: 'monospace' }}>{r[0]}</td>
                      <td style={cell}>{r[1]}</td>
                      <td style={cell}>{r[2]}</td>
                      <td style={cell}>{r[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div
          style={{
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid var(--color-border, #e4e9ed)',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
            Uw toestemming wijzigen of intrekken
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>
            U kunt uw keuze op elk moment aanpassen. Intrekken is net zo
            eenvoudig als geven en heeft geen gevolgen voor het gebruik van deze
            website. Klik hiervoor op{' '}
            <ConsentPreferencesButton /> — ook onderaan elke pagina te vinden.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
            Doorgifte en vragen
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>
            Google, Microsoft en ClickGuard kunnen gegevens verwerken buiten de
            Europese Economische Ruimte. Meer over hoe wij met persoonsgegevens omgaan
            leest u in ons <Link href="/privacybeleid">privacybeleid</Link>.
            Vragen? Mail naar {SITE_CONFIG.email}. U kunt ook een klacht
            indienen bij de Autoriteit Persoonsgegevens
            (autoriteitpersoonsgegevens.nl).
          </p>
        </div>
      </div>
    </main>
  );
}
