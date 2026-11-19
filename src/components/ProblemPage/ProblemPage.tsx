import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BIZ_ID } from '@/utils/schema';
import { getProblemPage, problemHref, PROBLEM_PAGES, type ProblemPage as Problem } from '@/config/problemPages';
import SplitHero from '@/components/SplitHero/SplitHero';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import styles from './ProblemPage.module.css';

/*
 * One page per customer problem: what to do now, what we do and do not do,
 * what to have at hand, how to get help, and the five questions people ask.
 *
 * Built from the same parts as the other landing pages (SplitHero, the
 * LeadCaptureForm, the global section/faq/seo-hub classes) so it looks like
 * the rest of the site. Two things it deliberately does NOT reuse:
 *   - HeroQuickFacts, because it always prints the arrival time and "vaste
 *     prijs vooraf", neither of which the owner has confirmed;
 *   - VehicleWizard, because it shows a "vanaf" price.
 * The content lives in src/config/problemPages.ts.
 */

const url = (page: Problem) => `${SITE_CONFIG.domain}${problemHref(page)}`;

export function problemPageMetadata(slug: string): Metadata {
  const page = getProblemPage(slug);
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDesc,
    alternates: {
      canonical: url(page),
      languages: { 'nl-NL': url(page), 'x-default': url(page) },
    },
    openGraph: {
      type: 'website',
      url: url(page),
      title: page.metaTitle,
      description: page.metaDesc,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${page.name} — Autosleutel24` }],
    },
  };
}

/* JSON-LD must not be able to close its own <script> tag. */
function jsonLd(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}

function schemaFor(page: Problem) {
  const pageUrl = url(page);
  const trail = [
    { name: 'Home', item: SITE_CONFIG.domain },
    ...(page.parent ? [{ name: page.parent.label, item: `${SITE_CONFIG.domain}${page.parent.href}` }] : []),
    { name: page.name, item: pageUrl },
  ];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, ...t })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: page.serviceName,
      serviceType: page.serviceType,
      description: page.lead,
      url: pageUrl,
      provider: { '@id': BIZ_ID },
      // The page says "ongeveer 75 km rond Bussum"; this is that circle.
      areaServed: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: Number(SITE_CONFIG.serviceArea.lat),
          longitude: Number(SITE_CONFIG.serviceArea.lng),
        },
        geoRadius: Number(SITE_CONFIG.serviceArea.radiusMeters),
      },
      availableChannel: {
        '@type': 'ServiceChannel',
        // schema.org types servicePhone as a ContactPoint, not a bare string.
        servicePhone: { '@type': 'ContactPoint', telephone: SITE_CONFIG.phoneTel, contactType: 'customer service' },
        serviceUrl: pageUrl,
      },
    },
  ];
}

export default function ProblemPage({ slug }: { slug: string }) {
  const page = getProblemPage(slug);
  const others = PROBLEM_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <div>
      {schemaFor(page).map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={jsonLd(s)} />
      ))}

      <SplitHero
        crumbs={[
          { label: 'Home', href: '/' },
          ...(page.parent ? [page.parent] : []),
          { label: page.name },
        ]}
        titleTop={page.titleTop}
        titleAccent={page.titleAccent}
        lead={page.lead}
        facts={
          <ul className={styles.facts}>
            <li>24/7 bereikbaar</li>
            <li>Wij komen naar de auto toe</li>
            <li>Prijs voor uw auto, incl. voorrijden en btw</li>
          </ul>
        }
        image={page.image}
      >
        <div id="formulier">
          <LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />
        </div>
      </SplitHero>

      {/* 1. What to do right now */}
      <section className="section">
        <div className={`container ${styles.narrow}`}>
          <h2 className={styles.sectionTitle}>Wat u nu doet</h2>
          {page.safety && (
            <p className={styles.safety} role="note">
              <strong>Eerst veilig.</strong> {page.safety}
            </p>
          )}
          <ol className={styles.steps}>
            {page.now.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {i + 1}
                </span>
                <span>
                  <strong className={styles.stepTitle}>{s.title}</strong>
                  <span className={styles.muted}>{s.desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 2. Which case is it */}
      <section className="section-alt">
        <div className={`container ${styles.narrow}`}>
          <h2 className={styles.sectionTitle}>{page.casesTitle}</h2>
          <div className={styles.cases}>
            {page.cases.map((c) => (
              <article key={c.title} className={styles.case}>
                <h3>{c.title}</h3>
                <p className={styles.muted}>{c.desc}</p>
                {c.link && (
                  <Link href={c.link.href} className={styles.link}>
                    {`${c.link.label} →`}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. What we do and do not do */}
      <section className="section">
        <div className={`container ${styles.narrow}`}>
          <h2 className={styles.sectionTitle}>Wat wij doen, en wat niet</h2>
          <div className={styles.twoCols}>
            <div>
              <h3 className={styles.listTitle}>Dit doen wij</h3>
              <ul className={styles.list}>
                {page.included.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={styles.listTitle}>Dit valt erbuiten</h3>
              <ul className={styles.list}>
                {page.notIncluded.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. What to have at hand */}
      <section className="section-alt">
        <div className={`container ${styles.narrow}`}>
          <h2 className={styles.sectionTitle}>Dit heeft u bij de hand</h2>
          <p className={styles.intro}>
            Zonder bewijs dat de auto van u is, maken wij geen sleutel en werken wij niet aan het slot, ook niet met
            spoed. Is de auto van iemand anders, dan moet de eigenaar of iemand met een machtiging dat kunnen laten zien.
          </p>
          <div className={styles.twoCols}>
            <div>
              <h3 className={styles.listTitle}>Voor de monteur</h3>
              <ul className={styles.list}>
                <li>Uw legitimatie: paspoort, identiteitskaart of rijbewijs</li>
                <li>Het kentekenbewijs van de auto</li>
                <li>Alle sleutels en stukken die u nog heeft</li>
              </ul>
            </div>
            <div>
              <h3 className={styles.listTitle}>Als u belt of appt</h3>
              <ul className={styles.list}>
                <li>Merk, model en bouwjaar</li>
                <li>Of u nog een sleutel heeft die werkt</li>
                <li>Of de auto keyless is (starten met een knop)</li>
                <li>De postcode of het adres waar de auto staat</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How to get help */}
      <section className="section">
        <div className={`container ${styles.narrow}`}>
          <h2 className={styles.sectionTitle}>Zo krijgt u hulp en een prijs</h2>
          <p className={styles.intro}>
            Bel of app ons, of vul het formulier in. Wij zijn 24 uur per dag, 7 dagen per week bereikbaar en werken
            vanuit Bussum in een straal van ongeveer 75 km. Met merk, model en bouwjaar krijgt u een prijs voor uw auto,
            inclusief voorrijden en btw. Hebben wij voor uw auto geen prijs paraat, dan belt een collega u terug met een
            prijs. Welke tijden er vrij zijn, hoort u in hetzelfde gesprek.
          </p>
          <div className={styles.contact}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnCall} id={`probleem-${page.slug}-bel`}>
              Bel {SITE_CONFIG.phone}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnWa}
              id={`probleem-${page.slug}-whatsapp`}
            >
              WhatsApp
            </a>
            <a href="#formulier" className={styles.btnForm}>
              Formulier invullen
            </a>
          </div>
        </div>
      </section>

      {/* 6. The five questions */}
      <section className="section-alt">
        <div className={`container ${styles.narrow}`}>
          <h2 className={styles.sectionTitle}>Veelgestelde vragen</h2>
          {page.faq.map((f) => (
            <details key={f.q} className="faq-item">
              <summary className="faq-question">
                {f.q}
                <svg
                  className="faq-chevron"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <p className="faq-answer">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 7. Where to go next */}
      <section className="section">
        <div className="container">
          <div className="seo-hub-box">
            <div className="seo-hub-grid">
              <div>
                <div className="seo-hub-title">Verder lezen</div>
                <div className="seo-hub-col">
                  {page.related.map((l) => (
                    <Link key={l.href} href={l.href} className="seo-hub-link">
                      {`${l.label} →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">Ander probleem met uw sleutel?</div>
                <div className="seo-hub-col">
                  <Link href="/autosleutel-kwijt" className="seo-hub-link">
                    Autosleutel kwijt →
                  </Link>
                  <Link href="/autosleutel-gestolen" className="seo-hub-link">
                    Autosleutel gestolen →
                  </Link>
                  {others.map((p) => (
                    <Link key={p.slug} href={problemHref(p)} className="seo-hub-link">
                      {`${p.name} →`}
                    </Link>
                  ))}
                  <Link href="/diensten/auto-openen-zonder-sleutel" className="seo-hub-link">
                    Buitengesloten, sleutel in de auto →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
