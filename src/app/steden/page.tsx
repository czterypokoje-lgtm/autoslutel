import type { Metadata } from 'next';
import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Alle Steden | ${SITE_CONFIG.name} | Nederland & België`,
  description: 'Autosleutel Expert bedient heel Nederland en België. Eindhoven, Amsterdam, Rotterdam, Antwerpen, Brussel en 35+ andere steden.',
  alternates: { canonical: `${SITE_CONFIG.domain}/steden` },
};

const groups = [
  { title: 'Noord-Brabant & Limburg', filter: (c: typeof CITIES[0]) => ['Noord-Brabant','Limburg'].includes(c.region) && c.country === 'NL' },
  { title: 'West & Randstad', filter: (c: typeof CITIES[0]) => ['Noord-Holland','Zuid-Holland','Utrecht','Flevoland'].includes(c.region) },
  { title: 'Oost & Noord Nederland', filter: (c: typeof CITIES[0]) => ['Gelderland','Overijssel','Groningen','Friesland'].includes(c.region) },
  { title: 'België — Vlaanderen', filter: (c: typeof CITIES[0]) => c.country === 'BE' && c.lang !== 'FR' },
  { title: 'België — Wallonië & Brussel', filter: (c: typeof CITIES[0]) => c.country === 'BE' && c.lang === 'FR' },
];

export default function Steden() {
  return (
    <main>
      <section style={{ background:'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding:'4rem 2rem', textAlign:'center' }}>
        <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--orange-400)', marginBottom:'0.75rem' }}>SERVICEDEKKING</p>
        <h1 style={{ color:'#fff', marginBottom:'1rem' }}>Alle Steden — {CITIES.length} Locaties</h1>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'1rem', maxWidth:580, margin:'0 auto' }}>
          Mobiele autosleutel service door heel Nederland en België. Klik op uw stad voor reactietijden en specifieke info.
        </p>
      </section>

      <div className="container" style={{ padding:'3.5rem 2rem' }}>
        {groups.map(g => {
          const cities = CITIES.filter(g.filter);
          if (!cities.length) return null;
          return (
            <div key={g.title} style={{ marginBottom:'3rem' }}>
              <h2 style={{ fontSize:'1.15rem', fontWeight:700, paddingBottom:'0.75rem', marginBottom:'1rem', borderBottom:'2px solid var(--gray-200)' }}>{g.title}</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'0.75rem' }}>
                {cities.map(c => (
                  <Link key={c.slug} href={`/steden/${c.slug}`} id={`stad-${c.slug}`}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1rem', background:'#fff', border:'1px solid var(--gray-200)', borderRadius:'4px', textDecoration:'none', fontWeight:600, color:'var(--gray-800)', fontSize:'0.9rem', transition:'all 0.15s' }}>
                    <span>{c.city}</span>
                    <span style={{ fontSize:'0.75rem', color:'var(--orange-500)', fontWeight:600 }}>{c.travelTime}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
