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
        <div className="seo-article-block" style={{ marginTop: '3.5rem', marginBottom: '2.5rem', background: '#f8fafc', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
          <h2>Expert Kennis en Praktijktips over Autosleutels, Transponders en Voertuigbeveiliging</h2>
          <p>
            In onze officiële kennisbank publiceren onze gecertificeerde autoslotenmakers en elektronicameesters regelmatig diepgaande technische gidsen, stappenplannen en handleidingen over voertuigbeveiliging, startonderbrekers, sleutelbatterijen, noodprocedures en OBD-programmering. Moderne personenauto&apos;s en bedrijfswagens maken gebruik van steeds geavanceerdere versleutelde transponderchips (zoals Megamos Crypto, Hitag Pro en Texas Crypto) en complexe Keyless Entry / Keyless Go systemen.
          </p>
          <h3>Waarom professionele codering en OEM-apparatuur noodzakelijk zijn</h3>
          <p>
            Veel online aangeboden sleutels en behuizingen van onofficiële marktplaatsen missen de juiste transponderchip, bevatten inferieure printplaten of gebruiken niet-compatibele frequentiemodules (315 MHz in plaats van de Europese 433 MHz of 868 MHz standaard). Een verkeerde sleutel kan leiden tot permanente blokkering van uw CAS-, FEM- of BSI-module. Onze artikelen leggen u haarfijn uit hoe u vroege symptomen van sleutelslijtage en batterijstoringen herkent en waarom geautoriseerde OBD2-inlering essentieel is om uw fabrieksgarantie te behouden.
          </p>
          <h3>Direct Hulp Nodig bij een Defecte of Verloren Autosleutel?</h3>
          <p>
            Heeft u na het lezen van onze artikelen direct advies of een nieuwe sleutel op locatie nodig? Onze mobiele servicewagens zijn 24 uur per dag, 7 dagen per week operationeel in heel Nederland. Wij garanderen een 100% schadevrije opening en programmeren ter plaatse een nieuwe sleutel met 12 maanden schriftelijke garantie.
          </p>
        </div>
      </div>
    </main>
  );
}
