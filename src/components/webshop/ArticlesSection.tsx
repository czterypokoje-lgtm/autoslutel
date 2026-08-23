'use client';
import React from 'react';
import Link from 'next/link';

const articles = [
  {
    title: 'Autosleutel behuizing kopen: waar moet je op letten?',
    desc: 'Met zoveel verschillende behuizingen is het belangrijk om te weten waar u op moet letten, zodat de elektronica perfect past...',
    author: 'Mark S.',
    img: 'https://placehold.co/400x250/e2e8f0/475569?text=Behuizing+Gids'
  },
  {
    title: 'Batterij vervangen gids',
    desc: 'Lukt het niet om de batterij van uw sleutel te vervangen? Bekijk onze stap-voor-stap handleidingen voor elk merk...',
    author: 'Sander V.',
    img: 'https://placehold.co/400x250/e2e8f0/475569?text=Batterij+Gids'
  },
  {
    title: 'Beste reservesleutels voor 2026',
    desc: 'Als u door de bomen het bos niet meer ziet, bekijk dan deze lijst met de beste en meest betrouwbare sleutels van dit jaar...',
    author: 'Lisa M.',
    img: 'https://placehold.co/400x250/e2e8f0/475569?text=Beste+Sleutels'
  },
  {
    title: 'Wanneer moet u de sleutel inleren?',
    desc: 'Onze gids helpt u te bepalen of u alleen de behuizing kunt vervangen, of dat de transponder opnieuw ingeleerd moet worden...',
    author: 'Tim B.',
    img: 'https://placehold.co/400x250/e2e8f0/475569?text=Inleren+Gids'
  }
];

export default function ArticlesSection() {
  return (
    <section style={{ padding: '5rem 0', background: '#f6f4eb', position: 'relative' }}>
      
      {/* Add standard hover styles globally for this component to match the reference */}
      <style>{`
        .article-card {
          background: #fff;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          overflow: hidden;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
        }
        .article-card:hover {
          border-color: #c2410c;
        }
        .article-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          transition: color 0.2s;
        }
        .article-card:hover .article-title {
          color: #c2410c;
        }
      `}</style>

      <div className="container">
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, color: '#27272a', marginBottom: '2.5rem' }}>
          Artikelen & video's om u te helpen kiezen
        </h2>

        <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', overflowX: 'auto', paddingBottom: '1rem' }}>
          {articles.map((article, i) => (
            <Link href="#" key={i} className="article-card" style={{ flex: '1 1 0', minWidth: '250px' }}>
              <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>
                <img 
                  src={article.img} 
                  alt={article.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 className="article-title">{article.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
                  {article.desc}
                </p>
                
                <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>by Autosleutel24's</div>
                  <div style={{ 
                    fontFamily: 'Caveat, "Comic Sans MS", cursive, serif', // Hand-written style font fallback
                    color: '#c2410c', 
                    fontSize: '1.4rem', 
                    fontWeight: 700,
                    marginTop: '0.2rem',
                    transform: 'rotate(-2deg)'
                  }}>
                    {article.author}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {/* Mock Carousel Arrow Right */}
          <button style={{
            position: 'absolute',
            right: '-1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid #c2410c',
            color: '#c2410c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>

        </div>
      </div>
    </section>
  );
}
