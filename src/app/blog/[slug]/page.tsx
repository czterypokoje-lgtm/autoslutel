import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { BLOG_POSTS } from '@/config/services';
import { SITE_CONFIG } from '@/config/site.config';
import { BLOG_CONTENT } from '@/config/blog_content';

// ── Individual Google Reviews for Review schema (star rich results) ──
// Source: real Google Business Profile reviews
const REVIEW_SCHEMA_DATA = [
  {
    author: 'Yuri Sharapa',
    datePublished: '2024-06-15',
    reviewBody: 'Yesterday I slammed the door in the evening and left the key inside. I called Autosleutel24 and within 30 minutes someone was there. Very professional! Great service, highly recommended.',
    ratingValue: 5,
  },
  {
    author: 'Aicha Kone',
    datePublished: '2024-07-02',
    reviewBody: 'Thank you for your good service. I called them for my car lock. Their service is so fast, I am really impressed. Very professional and affordable.',
    ratingValue: 5,
  },
  {
    author: 'Lisa van den Bor',
    datePublished: '2024-08-20',
    reviewBody: 'Sleutel aan de binnenkant van de deur laten zitten, stom! Ze stonden gelukkig zelfs op zondag binnen 20 minuten voor de deur en maakten onze deur 100% schadevrij open. Aanrader!',
    ratingValue: 5,
  },
];

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | ${SITE_CONFIG.name}`,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: {
      canonical: `${SITE_CONFIG.domain}/blog/${slug}`,
      languages: {
        'nl-NL': `${SITE_CONFIG.domain}/blog/${slug}`,
        'x-default': `${SITE_CONFIG.domain}/blog/${slug}`,
      },
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const postContent = BLOG_CONTENT[slug];

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${SITE_CONFIG.domain}/blog/${slug}#blogposting`,
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishDate,
    dateModified: post.publishDate,
    inLanguage: 'nl-NL',
    mainEntityOfPage: `${SITE_CONFIG.domain}/blog/${slug}`,
    // ── E-E-A-T: Named Person author instead of anonymous Organization ──
    author: {
      '@type': 'Person',
      '@id': `${SITE_CONFIG.domain}/#specialist`,
      name: 'Berkan Acarol',
      jobTitle: 'Eigenaar & Autosleutelspecialist',
      url: `${SITE_CONFIG.domain}/over-ons`,
      worksFor: {
        '@type': 'LocalBusiness',
        name: SITE_CONFIG.fullName,
        url: SITE_CONFIG.domain,
      },
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      url: SITE_CONFIG.domain,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.domain}/logo.png`,
      },
    },
    image: `${SITE_CONFIG.domain}/og-image.jpg`,
    // ── Individual reviews for star rich results ──
    review: REVIEW_SCHEMA_DATA.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.datePublished,
      reviewBody: r.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.ratingValue,
        bestRating: 5,
        worstRating: 1,
      },
      itemReviewed: {
        '@id': `${SITE_CONFIG.domain}/#localbusiness`,
      },
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.9,
      reviewCount: 247,
      bestRating: 5,
      worstRating: 1,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_CONFIG.domain}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_CONFIG.domain}/blog/${slug}` },
    ],
  };

  let faqSchema: any = null;
  if (slug === 'autosleutel-bijmaken-zonder-origineel') {
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Kan ik een autosleutel bijmaken zonder origineel?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ja, dat kan zeker. Een mobiele autosleutelspecialist kan op locatie een nieuwe sleutel frezen en programmeren via de OBD-poort of direct op de ECU van de auto, zelfs als alle sleutels kwijt zijn.',
          },
        },
        {
          '@type': 'Question',
          name: 'Welke gegevens heeft de sleutelmaker nodig?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Om een sleutel te maken zonder origineel zijn het merk, model, bouwjaar, het identificatienummer (VIN/chassisnummer) van de auto en een geldig legitimatiebewijs en eigendomsbewijs vereist.',
          },
        },
        {
          '@type': 'Question',
          name: 'Hoeveel kost het om een autosleutel bij te maken zonder origineel?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'De kosten variëren van €180 voor standaard transponder sleutels tot €350 tot €650 voor complexe smart keys (bijvoorbeeld BMW, Mercedes, Tesla). Dit is inclusief programmeren en slijpen ter plaatse.',
          },
        },
        {
          '@type': 'Question',
          name: 'Hoe lang duurt het inlezen en maken van de sleutel?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Gemiddeld duurt het proces ter plaatse 30 tot 60 minuten. Bij complexere startonderbrekersystemen (zoals CAS4/FEM bij BMW of FBS4 bij Mercedes) kan het tot 2 uur duren.',
          },
        },
        {
          '@type': 'Question',
          name: 'Kan de dealer ook een sleutel maken zonder origineel?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ja, maar de dealer moet de auto vaak weggesleept hebben naar de werkplaats en bestelt de sleutel bij de fabriek, wat 3 tot 14 dagen wachttijd en hoge sleepkosten met zich meebrengt.',
          },
        },
      ],
    };
  }

  return (
    <>
      <Script id={`blog-post-schema-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      <Script id={`blog-post-bc-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <Script id={`blog-post-faq-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link href="/blog" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textDecoration: 'none' }}>← Terug naar Blog</Link>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '1rem 0' }}>
            <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              {post.readTime} lezen
            </span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
              {new Date(post.publishDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: 1.2, marginBottom: '1rem' }}>{post.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: 1.7 }}>{post.excerpt}</p>

          {/* ── Author byline — E-E-A-T trust signal ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '1.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <img
              src="/images/team/berkan-acarol-autosleutelspecialist-utrecht.webp"
              alt="Berkan Acarol — Eigenaar &amp; Autosleutelspecialist Autosleutel24 Utrecht"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: 'top',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Berkan Acarol</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem' }}>Eigenaar &amp; Autosleutelspecialist · 10+ jaar ervaring</div>
            </div>
            <Link
              href="/over-ons"
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Meer over ons →
            </Link>
          </div>
        </div>
      </section>

      <div className="blog-content" style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 2rem' }}>
        {postContent ? (
          postContent
        ) : (
          <>
            <h2>Wat U Moet Weten</h2>
            <p>{post.excerpt} In dit artikel gaan wij dieper in op dit onderwerp en geven wij u praktische tips.</p>
          </>
        )}

        <div style={{ background: 'var(--color-primary)', borderRadius: '12px', padding: '2rem', marginTop: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Hulp Nodig?</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>Onze specialisten staan 24/7 voor u klaar.</p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background: '#fff', color: 'var(--color-primary)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            📞 {SITE_CONFIG.phone}
          </a>
        </div>
      </div>
    </main>
    </>
  );
}
