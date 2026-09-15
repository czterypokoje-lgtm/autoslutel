import React from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '@/config/services';

/**
 * Reading tips on the webshop home, linking into the blog we actually have.
 *
 * What was here was four invented articles — "Beste reservesleutels voor 2026"
 * and three others — signed by "Mark S.", "Sander V.", "Lisa M." and "Tim B."
 * in a handwriting font, illustrated with placehold.co images and every one of
 * them linked to `href="#"`. The people do not exist, the articles do not
 * exist, and the site meanwhile has 26 real posts nobody could reach from
 * here.
 *
 * These are the four that answer what a webshop visitor is weighing up:
 * whether to buy the part, what it costs elsewhere, and what happens after it
 * arrives.
 */
const FEATURED_SLUGS = [
  'autosleutel-batterij-vervangen-stappenplan',
  'autosleutel-kosten-per-merk-2026',
  'autosleutel-bijmaken-zonder-origineel',
  'dealer-vs-mobiele-sleutelmaker',
];

export default function ArticlesSection() {
  const posts = FEATURED_SLUGS
    .map((slug) => BLOG_POSTS.find((p) => p.slug === slug))
    .filter((p): p is (typeof BLOG_POSTS)[number] => Boolean(p));

  if (posts.length === 0) return null;

  return (
    <section style={{ padding: '5rem 0', background: '#f6f4eb' }}>
      <style>{`
        .article-card {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          border: 1px solid #e5e5e5;
          transition: box-shadow 0.2s;
        }
        .article-card:hover { box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08); }
        .article-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          transition: color 0.2s;
        }
        .article-card:hover .article-title { color: #c2410c; }
      `}</style>

      <div className="container">
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, color: '#27272a', marginBottom: '2.5rem' }}>
          Artikelen om u te helpen kiezen
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
            gap: '1.5rem',
          }}
        >
          {posts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.slug} className="article-card">
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 className="article-title">{post.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
                  {post.excerpt}
                </p>
                <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#64748b' }}>
                  {post.readTime} leestijd
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/blog" style={{ color: '#c2410c', fontWeight: 700, textDecoration: 'none' }}>
            Alle artikelen bekijken →
          </Link>
        </div>
      </div>
    </section>
  );
}
