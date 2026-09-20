import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG } from '@/config/site.config';
import B2BForm from '@/components/B2BForm/B2BForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Autosleutelspecialist Worden | Aansluiten bij Autosleutel24',
  description:
    'Zelfstandig autosleutelspecialist in Noord-Brabant of Limburg? Wij zoeken partners in onder andere Eindhoven en Maastricht. Klussen, CRM en facturatie geregeld.',
  alternates: { canonical: `${SITE_CONFIG.domain}/monteur-worden` },
};

/*
 * The recruitment page.
 *
 * Deliberately vague about money and precise about everything else. What a
 * technician earns and what they pay is a conversation, not a landing page —
 * the tiers exist in the CRM but quoting them here would turn a negotiation
 * into a take-it-or-leave-it, and they are not fixed enough to publish.
 *
 * What the page can be exact about is the thing candidates actually want to
 * know: where the work comes from, what is supplied, and what is expected. All
 * of that is real and already built.
 */
export default function MonteurWorden() {
  const gains = [
    {
      title: 'Klussen komen naar u toe',
      text: 'Wij investeren in vindbaarheid en advertenties. U krijgt aanvragen uit uw eigen regio doorgestuurd en kiest zelf welke u aanneemt.',
    },
    {
      title: 'Geen eigen marketing nodig',
      text: 'Geen website bijhouden, geen advertentiebudget, geen offertes najagen. Dat deel doen wij, u doet het werk waar u goed in bent.',
    },
    {
      title: 'CRM, facturatie en agenda inbegrepen',
      text: 'Uw klussen, foto’s, materiaalgebruik en facturen op één plek. Facturen maakt u met twee klikken; uw administratie loopt mee in plaats van achteraan.',
    },
    {
      title: 'U bepaalt uw eigen uren',
      text: 'U blijft zelfstandig ondernemer. Geen rooster, geen verplichte diensten — u zet uzelf beschikbaar wanneer het u uitkomt.',
    },
    {
      title: 'Collega’s voor de lastige klussen',
      text: 'Een besloten netwerk van specialisten per merk. Loopt u vast op een systeem dat u nog niet kent, dan is er iemand die het wél gedaan heeft.',
    },
    {
      title: 'Wij zeggen eerlijk wat niet kan',
      text: 'Onze site vertelt klanten vooraf welke auto’s wij niet kunnen helpen. U komt dus niet voor een Mercedes FBS4 te staan waar niemand iets mee kan.',
    },
  ];

  const expect = [
    'U werkt als zelfstandige, met eigen KvK-inschrijving en verzekering',
    'U heeft ervaring met sleutelprogrammering en eigen diagnoseapparatuur',
    'U werkt mobiel: bij de klant op locatie, niet vanuit een vaste werkplaats',
    'U reageert snel — spoed is bij dit werk eerder regel dan uitzondering',
  ];

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>{' '}
              <span>Monteur worden</span>
            </nav>
            <p className={styles.eyebrow}>Wij breiden uit</p>
            <h1>
              Autosleutelspecialist in Eindhoven of Maastricht?
              <br />
              <span className={styles.accent}>Wij zoeken u.</span>
            </h1>
            <p className={styles.lead}>
              Wij krijgen aanvragen uit Noord-Brabant en Limburg die wij nu nog
              moeten afwijzen omdat er niemand in de buurt is. Bent u
              zelfstandig autosleutelspecialist in die regio, dan hebben wij werk
              voor u — en de systemen eromheen zijn al gebouwd.
            </p>
            <div className={styles.ctas}>
              <a href="#aanmelden" className={styles.btnPhone}>
                Ik wil kennismaken
              </a>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnOutline}>
                Bel {SITE_CONFIG.phone}
              </a>
            </div>
          </div>
          <div className={styles.heroImage}>
            {/*
              * A specialist in company kit outside the branch, supplied for
              * this page. It recruits better than a workbench does: somebody
              * deciding whether to join looks for the person they would become,
              * not the tool they would hold.
              *
              * (The original pick here was a file whose name promised a
              * workshop and which turned out to be a 1024x139 crop of a badge
              * from this very site. Filenames are not captions — open the
              * image.)
              */}
            <Image
              src="/images/seo/autosleutel24_monteur_worden_specialist_op_locatie.webp"
              alt="Autosleutelspecialist van Autosleutel24 in bedrijfskleding voor de vestiging, met servicebus op de achtergrond"
              width={800}
              height={560}
              priority
              quality={80}
              sizes="(max-width: 992px) 100vw, 45vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Wat u van ons krijgt</h2>
          <div className={styles.grid}>
            {gains.map((g) => (
              <div key={g.title} className={styles.card}>
                <h3>{g.title}</h3>
                <p>{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.alt}`}>
        <div className={styles.container}>
          <h2>Wat wij van u verwachten</h2>
          <ul className={styles.expect}>
            {expect.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className={styles.note}>
            Over de samenwerkingsvorm en de vergoeding praten wij liever
            persoonlijk dan via een webpagina — dat hangt af van uw regio, uw
            apparatuur en hoeveel u wilt werken. Wij zijn er duidelijk over
            tijdens het eerste gesprek, niet pas achteraf.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Waar wij nu vooral zoeken</h2>
          <p className={styles.sub}>
            Aanvragen uit deze regio’s kunnen wij op dit moment niet of moeilijk
            bedienen:
          </p>
          <div className={styles.regions}>
            <span>Eindhoven</span>
            <span>Maastricht</span>
            <span>Tilburg</span>
            <span>Breda</span>
            <span>Den Bosch</span>
            <span>Venlo</span>
            <span>Roermond</span>
            <span>Helmond</span>
          </div>
          <p className={styles.sub}>
            Zit u daar niet tussen maar denkt u dat er in uw regio werk ligt?
            Laat het weten — wij kijken graag mee.
          </p>
        </div>
      </section>

      <section id="aanmelden" className={`${styles.section} ${styles.alt}`}>
        <div className={styles.formWrap}>
          <div>
            <h2>Kennismaken?</h2>
            <p className={styles.sub}>
              Laat uw gegevens achter met uw regio en waar u mee werkt. Wij
              bellen u binnen één werkdag voor een eerlijk gesprek over wat het
              oplevert en wat het kost.
            </p>
            <p className={styles.sub}>
              Liever meteen bellen?{' '}
              <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a>
            </p>
          </div>
          <B2BForm segment="monteur" segmentLabel="Monteur worden" />
        </div>
      </section>
    </main>
  );
}
