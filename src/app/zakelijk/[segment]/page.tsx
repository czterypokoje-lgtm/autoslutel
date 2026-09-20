import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ZAKELIJK_SEGMENTS, getZakelijkSegment } from '@/config/zakelijk';
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
    alternates: { canonical: `${SITE_CONFIG.domain}/zakelijk/${s.slug}` },
  };
}

export default async function ZakelijkSegmentPage(props: {
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
      <main>
        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div>
              <nav className={styles.crumbs} aria-label="Breadcrumb">
                <Link href="/">Home</Link> <span>/</span>{' '}
                <Link href="/zakelijk">Zakelijk</Link> <span>/</span>{' '}
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
                  Bel {SITE_CONFIG.phone}
                </a>
                <a href="#voorstel" className={styles.btnOutline}>
                  Voorstel aanvragen
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
            <h2>Wat u eraan heeft</h2>
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
            <h2>Hoe het werkt</h2>
            <ol className={styles.steps}>
              {s.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FORM ── */}
        <section id="voorstel" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.formWrap}>
            <div>
              <h2>Zullen we het concreet maken?</h2>
              <p className={styles.formLead}>
                Vertel ons om hoeveel voertuigen het gaat en welke merken. U
                krijgt binnen één werkdag een prijs en een voorstel voor de
                werkwijze — of meteen een eerlijk &ldquo;dit kunnen wij niet&rdquo;
                als dat het antwoord is.
              </p>
              <p className={styles.formLead}>
                Liever direct iemand spreken?{' '}
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
            <h2>Veelgestelde vragen</h2>
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
            <h2>Ook interessant</h2>
            <div className={styles.otherGrid}>
              {ZAKELIJK_SEGMENTS.filter((o) => o.slug !== s.slug).map((o) => (
                <Link key={o.slug} href={`/zakelijk/${o.slug}`} className={styles.otherCard}>
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
