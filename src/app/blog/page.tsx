import type { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/config/services';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Blog & Tips | 24/7 Expert | Autosleutel24',
  },
  description: 'Tips, uitleg en cases over autosleutels. Alle sleutels kwijt, kosten per merk, BMW BDC2, SFD unlock, Ghost immobiliser en meer.',
  alternates: { canonical: `${SITE_CONFIG.domain}/blog` },
};

export default function BlogPage() {
  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">BLOG & TIPS</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Autosleutel Tips & Nieuws</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          Alles wat u moet weten over autosleutels, kosten, merken, en beveiliging.
        </p>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              id={`blog-${post.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1.5rem',
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'all 0.25s ease',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {post.readTime} lezen
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {new Date(post.publishDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>{post.title}</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>{post.excerpt}</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: 'auto' }}>Lees meer →</span>
            </Link>
          ))}
        </div>

        {/* ── COMPREHENSIVE BLOG SEO GUIDE ARTICLE ── */}
        <div className="seo-article-block" style={{ marginTop: '3.5rem', marginBottom: '2rem' }}>
          <h2>Expert Kennis en Praktijktips over Autosleutels en Voertuigbeveiliging</h2>
          <p>
            In onze kennisbank publiceren onze gecertificeerde monteurs regelmatig diepgaande artikelen en handleidingen over autobeveiliging, startonderbrekers, batterijvervanging en noodprocedures. Moderne voertuigen maken gebruik van steeds complexere sleutelcodes en encryptieprotocollen. Door goed geïnformeerd te zijn, kunt u dure fouten voorkomen en weet u precies wat u moet doen bij verlies of schade.
          </p>
          <h3>Waarom professionele codering noodzakelijk is</h3>
          <p>
            Veel online aangeboden sleutels en behuizingen van onofficiële webshops missen de juiste transponderchip of hebben niet-compatibele frequentiemodules (315 MHz vs 433 MHz of 868 MHz). Onze artikelen leggen u stap voor stap uit hoe u problemen herkent en waarom geautoriseerde OBD2-inlering essentieel is voor uw garantie en verzekering.
          </p>
        </div>
      </div>
    </main>
  );
}
