import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '@/config/brands';

export const metadata: Metadata = {
  title: 'Autosleutel Kwijt? | Direct Hulp | 24/7 Mobiele Service | Bel Nu',
  description: `Autosleutel kwijt? Wij helpen direct. Nieuwe sleutel programmeren aan huis. Alle merken. 24/7. Bel: ${SITE_CONFIG.phone}`,
  keywords: ['autosleutel kwijt','alle sleutels kwijt auto','auto sleutel kwijt wat te doen','nieuwe autosleutel laten maken','sleutel kwijt autoslotenmaker'],
  alternates: { canonical: `${SITE_CONFIG.domain}/autosleutel-kwijt` },
};

const faqItems = [
  { q: 'Hoe snel kunt u een nieuwe sleutel maken?', a: 'In de meeste gevallen dezelfde dag. Wij zijn gemiddeld binnen 30–60 minuten bij u en de programmering duurt afhankelijk van uw auto 45–180 minuten.' },
  { q: 'Kan mijn gestolen sleutel worden uitgeschakeld?', a: 'Ja! Dit is een van de eerste dingen die wij doen bij AKL service. De originele sleutel wordt uit het systeem gewist zodat deze onbruikbaar is.' },
  { q: 'Vergoedt mijn verzekering het?', a: 'Bij All Risk vaak wel, soms ook bij WA+ met diefstalmodule. Wij geven altijd een gespecificeerde verzekeringsklare factuur.' },
  { q: 'Werkt u zonder reserve sleutel?', a: 'Ja. AKL (Alle Sleutels Kwijt) is onze specialiteit. Voor de meeste merken kunnen wij een nieuwe sleutel maken zonder enig origineel.' },
  { q: 'Wat kost een nieuwe sleutel als alle sleutels kwijt zijn?', a: 'Prijzen starten vanaf €180 voor eenvoudige systemen. BMW, Mercedes en Porsche kosten meer (€350–€650). Altijd vaste prijs afspreken.' },
  { q: 'Kunnen jullie ook komen als ik langs de weg sta?', a: 'Ja. Geef uw locatie door — wij komen ook naar een parkeerplaats, snelwegparkeerplaats of langs de A2/A58.' },
];

const steps = [
  { n:'1', title:'Controleer grondig', desc:'Check jaszakken, tassen, thuis, werk. Check of u een reserve sleutel heeft.' },
  { n:'2', title:'Bel uw verzekeraar', desc:'Check uw polis — veel All Risk verzekeringen dekken sleutelverlies. Wij geven een verzekeringsklare factuur.' },
  { n:'3', title:'Bel ons direct', desc:`Wij zijn 24/7 bereikbaar. Geef uw automerk, model en locatie door. Wij geven direct een vaste prijs.` },
  { n:'4', title:'Wij komen naar u toe', desc:'Onze uitgeruste bus rijdt naar uw locatie. Gemiddeld 30–60 minuten. Geen sleepkosten.' },
  { n:'5', title:'Nieuwe sleutel klaar', desc:'Wij programmeren de nieuwe sleutel ter plaatse. Oud gestolen sleutel wordt uitgeschakeld. U rijdt weg.' },
];

const brandPrices = BRANDS.filter(b => b.priority === 'P1').slice(0, 8);

const schema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqItems.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function AutosleutelKwijt() {
  return (
    <>
      <Script id="akl-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
        {/* EMERGENCY HERO — CTA absolute top priority */}
        <section style={{ background:'var(--color-danger)', padding:'2rem', textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'0.875rem', fontWeight:600, margin:'0 0 0.5rem' }}>
            NOODGEVAL — DIRECTE HULP BESCHIKBAAR
          </p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} id="akl-emergency-phone"
            style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'#fff', color:'var(--color-danger)', padding:'1rem 2.5rem', borderRadius:'4px', fontWeight:700, fontSize:'1.3rem', textDecoration:'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            Bel Nu: {SITE_CONFIG.phone}
          </a>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.875rem', marginTop:'0.75rem', marginBottom:0 }}>
            Gemiddeld {SITE_CONFIG.responseTime} · 24/7 · Alle merken
          </p>
        </section>

        {/* Hero */}
        <section style={{ background:'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding:'3rem 2rem' }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <h1 style={{ color:'#fff', fontSize:'clamp(1.6rem, 3.5vw, 2.4rem)', marginBottom:'1rem' }}>
              Autosleutel Kwijt? Direct Hulp — 24/7 Mobiele Service
            </h1>
            <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'1rem', lineHeight:1.7, marginBottom:'1.5rem', maxWidth:680 }}>
              Autosleutel kwijt? Wij programmeren een nieuwe sleutel ter plaatse — thuis, op het werk, of langs de weg.
              Alle merken. Gestolen sleutel wordt uitgeschakeld. Verzekeringsklare factuur.
            </p>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id="akl-hero-phone">{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', background:'#25d366', color:'#fff', padding:'0.85rem 1.5rem', borderRadius:'4px', fontWeight:700, textDecoration:'none', fontSize:'1rem' }} id="akl-hero-wa">WhatsApp</a>
            </div>
          </div>
        </section>

        {/* 5 steps HowTo */}
        <section style={{ padding:'3.5rem 0' }}>
          <div className="container">
            <h2>Wat Te Doen Als Je Autosleutel Kwijt Is (5 Stappen)</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem', marginTop:'1.5rem' }}>
              {steps.map(s => (
                <div key={s.n} style={{ display:'flex', gap:'1rem', padding:'1.25rem', background:'#fff', border:'1px solid var(--gray-200)', borderRadius:'6px', alignItems:'flex-start' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:s.n==='3'?'var(--color-danger)':'var(--navy-800)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0 }}>{s.n}</div>
                  <div>
                    <strong style={{ display:'block', fontSize:'0.95rem', marginBottom:'0.25rem', color:'var(--gray-900)' }}>{s.title}</strong>
                    <span style={{ fontSize:'0.85rem', color:'var(--gray-500)', lineHeight:1.55 }}>{s.desc}</span>
                    {s.n === '3' && (
                      <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display:'inline-block', marginTop:'0.5rem', background:'var(--color-danger)', color:'#fff', padding:'0.4rem 0.875rem', borderRadius:'3px', fontWeight:700, fontSize:'0.85rem', textDecoration:'none' }} id="akl-step3-phone">
                        Bel Nu: {SITE_CONFIG.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing by brand */}
        <section style={{ padding:'3.5rem 0', background:'var(--gray-50)' }}>
          <div className="container">
            <h2>Kosten Nieuwe Sleutel Per Merk</h2>
            <p>Indicatieve prijzen. Exacte prijs na telefonische diagnose. Altijd vaste prijs vóór aanvang.</p>
            <div style={{ overflowX:'auto', borderRadius:'6px', overflow:'hidden', boxShadow:'var(--shadow-md)', marginTop:'1.5rem' }}>
              <table className="price-table">
                <thead><tr><th>Merk</th><th>Systeem</th><th>AKL Startprijs</th><th>Dealer Schatting</th></tr></thead>
                <tbody>
                  {brandPrices.map(b => (
                    <tr key={b.slug}>
                      <td><Link href={`/merken/${b.nameSlug}-sleutel-programmeren`} style={{ fontWeight:600, color:'var(--navy-600)' }}>{b.name}</Link></td>
                      <td style={{ fontSize:'0.82rem', color:'var(--gray-400)' }}>{b.system.split('/')[0]}</td>
                      <td className="price-col">Bel voor prijs</td>
                      <td style={{ color:'var(--gray-400)', fontSize:'0.85rem' }}>+40–60%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding:'3.5rem 0' }}>
          <div className="container" style={{ maxWidth:900 }}>
            <h2>Veelgestelde Vragen — Autosleutel Kwijt</h2>
            {faqItems.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">
                  {f.q}
                  <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <p className="faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom emergency CTA */}
        <section style={{ background:'var(--color-danger)', padding:'3rem 2rem', textAlign:'center' }}>
          <h2 style={{ color:'#fff', marginBottom:'0.5rem' }}>Sleutel Kwijt? Bel Direct</h2>
          <p style={{ color:'rgba(255,255,255,0.8)', marginBottom:'1.5rem' }}>Wij zijn 24/7 bereikbaar. Gemiddeld {SITE_CONFIG.responseTime} bij u ter plaatse.</p>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background:'#fff', color:'var(--color-danger)', padding:'1rem 2.5rem', borderRadius:'4px', fontWeight:700, fontSize:'1.1rem', textDecoration:'none', display:'inline-flex', alignItems:'center' }} id="akl-bottom-phone">
              {SITE_CONFIG.phone}
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ background:'#25d366', color:'#fff', padding:'1rem 2rem', borderRadius:'4px', fontWeight:700, fontSize:'1rem', textDecoration:'none', display:'inline-flex', alignItems:'center' }} id="akl-bottom-wa">
              WhatsApp
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
