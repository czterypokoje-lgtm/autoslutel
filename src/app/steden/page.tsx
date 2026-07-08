import type { Metadata } from 'next';
import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: `Autosleutel Bijmaken per Stad | Alle ${CITIES.length} Locaties Nederland | ${SITE_CONFIG.name}`,
  description: `Mobiele autosleutelspecialist in ${CITIES.length} steden in Nederland. Utrecht, Amsterdam, Almere, Amersfoort, Hilversum, Bussum en meer. Zelfde dag ter plaatse. Bel ${SITE_CONFIG.phone}`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/steden`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/steden`,
      'x-default': `${SITE_CONFIG.domain}/steden`,
    },
  },
  openGraph: {
    url: `${SITE_CONFIG.domain}/steden`,
    title: `Autosleutel Bijmaken in ${CITIES.length} Steden | Heel Nederland`,
    description: `Mobiele autosleutelspecialist in ${CITIES.length} steden. Zelfde dag service. Bel ${SITE_CONFIG.phone}`,
  },
};

const groups = [
  { title: 'Noord-Brabant & Limburg', filter: (c: typeof CITIES[0]) => ['Noord-Brabant','Limburg'].includes(c.region) },
  { title: 'West & Randstad', filter: (c: typeof CITIES[0]) => ['Noord-Holland','Zuid-Holland','Utrecht','Flevoland'].includes(c.region) },
  { title: 'Oost & Noord Nederland', filter: (c: typeof CITIES[0]) => ['Gelderland','Overijssel','Groningen','Friesland'].includes(c.region) },
];

export default function Steden() {
  return (
    <main>
      <section style={{ background:'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding:'4rem 2rem', textAlign:'center' }}>
        <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--orange-400)', marginBottom:'0.75rem' }}>SERVICEDEKKING</p>
        <h1 style={{ color:'#fff', marginBottom:'1rem' }}>Alle Steden — {CITIES.length} Locaties</h1>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'1rem', maxWidth:580, margin:'0 auto' }}>
          Mobiele autosleutel service door heel Nederland. Klik op uw stad voor reactietijden en specifieke info.
        </p>
      </section>

      <div className="container" style={{ padding:'3.5rem 2rem' }}>
        {groups.map(g => {
          const cities = CITIES.filter(g.filter);
          if (!cities.length) return null;
          return (
            <div key={g.title} style={{ marginBottom:'3rem' }}>
              <h2 style={{ fontSize:'1.15rem', fontWeight:700, paddingBottom:'0.75rem', marginBottom:'1rem', borderBottom:'2px solid var(--gray-200)' }}>{g.title}</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Heeft u met spoed een <strong>auto slotenmaker</strong> nodig in de regio <strong>{g.title}</strong>? Autosleutel24 is uw betrouwbare, mobiele specialist. Wij zijn gespecialiseerd in <strong>autosleutels repareren</strong>, een nieuwe <strong>autosleutel bijmaken</strong> op locatie, en <strong>autodeur openen</strong> (bijv. als uw <strong>sleutel in auto</strong> ligt). Of u nu uw <strong>autosleutel kwijt</strong> bent, een <strong>contactslot reparatie</strong> nodig heeft of een extra <strong>reservesleutel</strong> wilt laten maken — wij helpen u direct weer op weg. Bekijk hieronder onze exacte servicegebieden in {g.title}.
              </p>
              <ul className={styles.seoList}>
                {cities.map(c => (
                  <li key={c.slug}>
                    <Link href={`/steden/${c.slug}`} id={`stad-${c.slug}`}>
                      <strong style={{ color: 'var(--orange-500)' }}>{c.city}</strong> — Autosleutel bijmaken binnen {c.travelTime}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  );
}
