import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BLOG_POSTS } from '@/config/services';
import { SITE_CONFIG } from '@/config/site.config';
import { clampMeta } from '@/lib/meta';
import { BLOG_CONTENT } from '@/config/blog_content';


export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: {
      absolute: post.title,
    },
    description: clampMeta(post.excerpt),
    alternates: {
      canonical: `${SITE_CONFIG.domain}/blog/${slug}`,
      languages: {
        'nl-NL': `${SITE_CONFIG.domain}/blog/${slug}`,
        'x-default': `${SITE_CONFIG.domain}/blog/${slug}`,
      },
    },
    openGraph: {
      type: 'article',
      url: `${SITE_CONFIG.domain}/blog/${slug}`,
      title: `${post.title} | ${SITE_CONFIG.name}`,
      description: clampMeta(post.excerpt),
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: post.title }],
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
      <script id={`blog-post-schema-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      <script id={`blog-post-bc-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script id={`blog-post-faq-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
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
              alt="Berkan Acarol — Eigenaar &amp; Autosleutelspecialist Autosleutel24"
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
            <h2>Alles Over {post.title}</h2>
            <p className="lead" style={{ fontSize: '1.15rem', lineHeight: 1.7, fontWeight: 500, color: 'var(--navy-800)', marginBottom: '1.5rem' }}>
              {post.excerpt}
            </p>
            <h3>1. De Technische Uitdaging bij Moderne Autosleutels</h3>
            <p>
              Moderne autodeuren en contactsloten zijn lang niet meer puur mechanisch beveiligd. Sinds eind jaren negentig is elke autosleutel uitgerust met een RFID-transponderchip die versleutelde gegevens uitwisselt met de startonderbreker (immobiliser) in de auto. Zonder een cryptografisch goedgekeurde code weigert de motorstuurinrichting (ECU) de brandstofpomp en ontsteking te activeren. Wanneer u uw sleutel wilt bijmaken, moet niet alleen de sleutelbaard nauwkeurig worden geslepen, maar moet de transponderchip ook worden geïntegreerd in het beveiligingssysteem van uw auto.
            </p>
            <h3>2. OBD2-Diagnose en Inleren op Fabrieksniveau</h3>
            <p>
              Waar conventionele garages of schoenmakers vaak steken laten vallen bij complexe sleutelcoderingen — zoals BMW CAS4/FEM, Volkswagen MQB, Mercedes FBS3 of Renault Keycard systemen — werkt <strong>{SITE_CONFIG.name}</strong> met professionele diagnoseapparatuur en originele OEM-licenties. Via de OBD2-poort in uw auto communiceren wij rechtstreeks met de boordcomputer om nieuwe sleutelcodes toe te voegen.
            </p>
            <h3>3. Wat te doen bij All Keys Lost (Alle Sleutels Kwijt)?</h3>
            <p>
              Bent u alle sleutels kwijtgeraakt? Bij een merkdealer moet uw auto dan vaak per takelwagen worden weggesleept naar de werkplaats, wat gepaard gaat met hoge sleepkosten en lange wachttijden. Onze mobiele slotenmakers komen 24/7 direct naar uw locatie. Wij openen uw auto 100% schadevrij met speciaal Lishi-gereedschap, decoderen het slotmechanisme om de sleutelsnede te bepalen, frezen een nieuwe sleutelbaard met onze computergestuurde CNC-machine én wissen de verloren sleutels uit het autogeheugen voor uw veiligheid.
            </p>
            <h3>4. Transparante Kosten, Garantie en Verzekering</h3>
            <p>
              Dankzij onze efficiënte mobiele werkwijze bespaart u gemiddeld 30% tot 50% ten opzichte van officiële merkdealers. U ontvangt vooraf altijd een vaste all-in prijsopgave zonder verrassingen achteraf en standaard 12 maanden schriftelijke garantie op al onze geleverde sleutels en reparaties. In veel gevallen wordt het vervangen of bijmaken van een verloren autosleutel bovendien gedekt door uw WA Extra of Allrisk autoverzekering.
            </p>
          </>
        )}

        {/* ── COMPREHENSIVE E-E-A-T TECHNICAL FOOTER GUIDE ── */}
        <div className="seo-article-block" style={{ marginTop: '3.5rem', marginBottom: '2.5rem', padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3>Veelgestelde Vragen over Autosleutel Service op Locatie</h3>
          <p>
            <strong>Hoe snel zijn jullie ter plaatse?</strong> In regio Utrecht, Amsterdam en Midden-Nederland zijn onze mobiele monteurs gemiddeld binnen 30 tot 45 minuten bij uw voertuig.
          </p>
          <p>
            <strong>Wordt mijn auto schadevrij geopend?</strong> Ja, wij maken uitsluitend gebruik van professionele Lishi 2-in-1 lockdecoders. Er komt geen koevoet of breekijzer aan te pas, waardoor uw lak en portierslot 100% intact blijven.
          </p>
          <p>
            <strong>Krijg ik garantie op een nieuwe autosleutel?</strong> Ja, u ontvangt standaard 12 maanden garantie op de elektronica, transponderchip, batterij en behuizing van elke door ons geleverde en geprogrammeerde sleutel.
          </p>
        </div>

        {/* ── RELATED ARTICLES: Fixes 'only one incoming internal link' SEO warning ── */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--navy-900)' }}>Gerelateerde Artikelen</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {(() => {
              // Deterministic rotation based on slug — every post gets a unique set of related articles
              const others = BLOG_POSTS.filter(p => p.slug !== slug);
              const seed = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
              const start = seed % others.length;
              const rotated = [...others.slice(start), ...others.slice(0, start)];
              return rotated.slice(0, 3).map(related => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  style={{
                    display: 'block',
                    padding: '1.5rem',
                    background: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    color: 'inherit',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-800)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {related.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', margin: 0, lineHeight: 1.5 }}>
                    {related.excerpt.substring(0, 80)}...
                  </p>
                  <span style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    Lees verder →
                  </span>
                </Link>
              ));
            })()}
          </div>
        </div>

        <div style={{ background: 'var(--color-primary)', borderRadius: '12px', padding: '2rem', marginTop: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Direct Een Autosleutel Laten Bijmaken of Programmeren?</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>Onze gecertificeerde autosleutelspecialisten staan 24/7 voor u klaar.</p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background: '#fff', color: 'var(--color-primary)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            📞 {SITE_CONFIG.phone}
          </a>
        </div>
      </div>
    </main>
    </>
  );
}
