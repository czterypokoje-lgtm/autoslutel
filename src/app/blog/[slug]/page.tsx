import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BLOG_POSTS } from '@/config/services';
import { SITE_CONFIG } from '@/config/site.config';

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
    alternates: { canonical: `${SITE_CONFIG.domain}/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
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
        </div>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '1rem 1.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: '#856404' }}>
          📝 <strong>Tip:</strong> Voeg hier de volledige blog content toe. Gebruik H2/H3 koppen, afbeeldingen, en interne links naar dienst-pagina&apos;s voor maximale SEO waarde.
        </div>

        <h2>Wat U Moet Weten</h2>
        <p>{post.excerpt} In dit artikel gaan wij dieper in op dit onderwerp en geven wij u praktische tips.</p>

        <h2>Veelgestelde Vragen Over Dit Onderwerp</h2>
        <p>Heeft u vragen? Neem contact met ons op via telefoon of WhatsApp.</p>

        <div style={{ background: 'var(--color-primary)', borderRadius: '12px', padding: '2rem', marginTop: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Hulp Nodig?</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>Onze specialisten staan 24/7 voor u klaar.</p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background: '#fff', color: 'var(--color-primary)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            📞 {SITE_CONFIG.phone}
          </a>
        </div>
      </div>
    </main>
  );
}
