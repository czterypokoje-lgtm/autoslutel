import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/utils/schema';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ZAKELIJK_SEGMENTS, getZakelijkSegment } from '@/config/geschaeftskunden';
import { SITE_CONFIG } from '@/config/site.config';
import B2BForm from '@/components/B2BForm/B2BForm';
import styles from './page.module.css';

export function generateStaticParams() {
  return ZAKELIJK_SEGMENTS.map((s) => ({ segment: s.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ segment: string }>;
}): Promise<Metadata> {
  const { segment } = await props.params;
  const s = getZakelijkSegment(segment);
  if (!s) return {};
  return {
    title: s.metaTitle,
    description: s.metaDesc,
    alternates: { canonical: `${SITE_CONFIG.domain}/geschaeftskunden/${s.slug}` },
  };
}

export default async function GeschaeftskundenSegmentPage(props: {
  params: Promise<{ segment: string }>;
}) {
  const { segment } = await props.params;
  const s = getZakelijkSegment(segment);
  if (!s) notFound();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: s.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        id={`bc-geschaeftskunden-${s.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Geschäftskunden', path: '/geschaeftskunden' },
              { name: s.label, path: `/geschaeftskunden/${s.slug}` },
            ])
          ),
        }}
      />
      <main>
        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div>
              <nav className={styles.crumbs} aria-label="Breadcrumb">
                <Link href="/">Home</Link> <span>/</span>{' '}
                <Link href="/geschaeftskunden">Geschäftskunden</Link> <span>/</span>{' '}
                <span>{s.label}</span>
              </nav>
              <h1>
                {s.h1Top}
                <br />
                <span className={styles.accent}>{s.h1Accent}</span>
              </h1>
              <p className={styles.lead}>{s.intro}</p>
              <div className={styles.heroCtas}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone}>
                  {SITE_CONFIG.phone} anrufen
                </a>
                <a href="#angebot" className={styles.btnOutline}>
                  Angebot anfordern
                </a>
              </div>
            </div>
            <div className={styles.heroImage}>
              <Image
                src={s.image.src}
                alt={s.image.alt}
                width={800}
                height={560}
                priority
                quality={80}
                sizes="(max-width: 992px) 100vw, 45vw"
              />
            </div>
          </div>
        </section>

        {/* ── PAIN ── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2>{s.painTitle}</h2>
            <ul className={styles.painList}>
              {s.pain.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── GAINS ── */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <h2>Was Sie davon haben</h2>
            <div className={styles.gainGrid}>
              {s.gains.map((g) => (
                <div key={g.title} className={styles.gain}>
                  <h3>{g.title}</h3>
                  <p>{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2>So läuft es ab</h2>
            <ol className={styles.steps}>
              {s.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FORM ── */}
        <section id="angebot" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.formWrap}>
            <div>
              <h2>Machen wir es konkret</h2>
              <p className={styles.formLead}>
                Sagen Sie uns, um wie viele Fahrzeuge es geht und um welche
                Marken. Sie erhalten innerhalb eines Werktags einen Preis und
                einen Vorschlag zum Ablauf — oder gleich ein ehrliches
                &ldquo;das können wir nicht&rdquo;, wenn das die Antwort ist.
              </p>
              <p className={styles.formLead}>
                Lieber gleich jemanden sprechen?{' '}
                <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a>,
                {' '}{SITE_CONFIG.hoursShort}.
              </p>
            </div>
            <B2BForm segment={s.slug} segmentLabel={s.label} />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2>Häufige Fragen</h2>
            <div className={styles.faq}>
              {s.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── OTHER SEGMENTS ── */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <h2>Auch interessant</h2>
            <div className={styles.otherGrid}>
              {ZAKELIJK_SEGMENTS.filter((o) => o.slug !== s.slug).map((o) => (
                <Link key={o.slug} href={`/geschaeftskunden/${o.slug}`} className={styles.otherCard}>
                  <strong>{o.label}</strong>
                  <span>{o.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
