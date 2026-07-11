import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: '24/7 Spoedhulp Autosleutel | Mobiel & Snel | Autosleutel24',
  },
  description: `Autosleutel spoed? 24/7 mobiele hulp aan huis. Alle merken. Gemiddeld ${SITE_CONFIG.responseTime} reactietijd. Bel: ${SITE_CONFIG.phone}`,
  keywords: ['spoedhulp autosleutel', '24 uur slotenmaker auto', 'autoslotenmaker spoed', 'nacht slotenmaker auto', 'weekend autosleutel'],
  alternates: {
    canonical: `${SITE_CONFIG.domain}/spoedhulp-autosleutel`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/spoedhulp-autosleutel`,
      'x-default': `${SITE_CONFIG.domain}/spoedhulp-autosleutel`,
    },
  },
};

const urgentServices = [
  { title: 'Autosleutel Kwijt', desc: 'Nieuwe sleutel programmeren, ook alle sleutels kwijt (AKL).', href: '/autosleutel-kwijt' },
  { title: 'Auto Op Slot', desc: 'Sleutels vergeten in de auto? Schadevrij openen.', href: '/auto-op-slot' },
  { title: 'Sleutel Gestolen', desc: 'Gestolen sleutel uitschakelen, nieuwe sleutel programmeren.', href: '/autosleutel-kwijt' },
  { title: 'Contactslot Defect', desc: 'Auto start niet? Contactslot gerepareerd ter plaatse.', href: '/diensten/contactslot-reparatie' },
  { title: 'Autosleutel Defect', desc: 'Afstandsbediening of behuizing kapot? Direct hersteld.', href: '/diensten/autosleutels-repareren' },
  { title: 'Sleutel Niet Herkend', desc: 'Auto herkent sleutel niet? Immo probleem opgelost.', href: '/diensten/transponder-programmeren' },
];

const schema = {
  '@context': 'https://schema.org', '@type': 'Service',
  name: '24/7 Spoedhulp Autosleutel',
  provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel },
  availableChannel: { '@type': 'ServiceChannel', serviceUrl: `${SITE_CONFIG.domain}/spoedhulp-autosleutel`, availableLanguage: ['Dutch'] },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '00:00', closes: '23:59' }],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Spoedhulp', item: `${SITE_CONFIG.domain}/spoedhulp-autosleutel` },
  ],
};

export default function SpoedhulpPage() {
  return (
    <>
      <Script id="spoed-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id="spoed-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Emergency strip */}
        <section style={{ background: 'var(--color-danger)', padding: '1.75rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>24/7 SPOEDHULP — WIJ ZIJN NU BESCHIKBAAR</p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} id="spoed-emergency-phone"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: 'var(--color-danger)', padding: '0.9rem 2.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '1.3rem', textDecoration: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            Bel Nu: {SITE_CONFIG.phone}
          </a>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.75rem', marginBottom: 0 }}>
            Reactietijd: {SITE_CONFIG.responseTime} · 24/7 · Alle merken · Heel Nederland
          </p>
        </section>

        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', marginBottom: '1rem' }}>
              24/7 Spoedhulp Autosleutel — Direct Mobiel Aan Huis
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 680 }}>
              Autosleutel spoedgeval? Wij zijn 24 uur per dag, 7 dagen per week beschikbaar — ook midden in de nacht, weekenden en feestdagen.
              Gemiddeld {SITE_CONFIG.responseTime} bij u ter plaatse met alle benodigde apparatuur.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id="spoed-hero-phone">{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#25d366', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '4px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }} id="spoed-hero-wa">WhatsApp Spoed</a>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[['24/7','Beschikbaar'], [SITE_CONFIG.responseTime,'Reactietijd'], ['38 merken','Alle systemen'], ['+25%','Toeslag avond/weekend']].map(([val, label]) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--orange-400)', lineHeight: 1 }}>{val}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.2rem' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Urgent services */}
        <section style={{ padding: '3.5rem 0' }}>
          <div className="container">
            <h2>Spoedproblemen die Wij Direct Oplossen</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {urgentServices.map(s => (
                <Link key={s.href} href={s.href} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.25rem', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.15s' }} id={`spoed-svc-${s.href.replace(/\//g,'-')}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger)', flexShrink: 0 }} />
                    <strong style={{ fontSize: '0.95rem', color: 'var(--gray-900)' }}>{s.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: 0, lineHeight: 1.5, paddingLeft: '1.25rem' }}>{s.desc}</p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--orange-500)', fontWeight: 600, paddingLeft: '1.25rem', marginTop: '0.25rem' }}>Direct hulp →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing note */}
        <section style={{ padding: '3.5rem 0', background: 'var(--gray-50)' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <h2>Spoedtarieven — Transparant en Eerlijk</h2>
            <div style={{ overflowX: 'auto', borderRadius: '6px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', marginTop: '1.5rem' }}>
              <table className="price-table">
                <thead><tr><th>Tijdstip</th><th>Toeslag</th><th>Beschikbaarheid</th></tr></thead>
                <tbody>
                  <tr><td><strong>Maandag t/m Vrijdag 08:00–16:00</strong></td><td className="price-col">Geen toeslag</td><td>Standaard tarief</td></tr>
                  <tr><td><strong>Maandag t/m Vrijdag 16:00–22:00</strong></td><td className="price-col">+15%</td><td>Avondtoeslag</td></tr>
                  <tr><td><strong>Maandag t/m Vrijdag 22:00–08:00</strong></td><td className="price-col">+25%</td><td>Nachttoeslag</td></tr>
                  <tr><td><strong>Weekend (Za/Zo)</strong></td><td className="price-col">+15% / +25%</td><td>Weekendtoeslag</td></tr>
                  <tr><td><strong>Feestdagen</strong></td><td className="price-col">+25%</td><td>Beschikbaar</td></tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
              Altijd vaste prijs afgesproken vóór aanvang. Geen verborgen kosten.
            </p>
          </div>
        </section>

        {/* ── COMPREHENSIVE SPOEDHULP SEO GUIDE ARTICLE ── */}
        <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
          <div className="container">
            <div className="seo-article-block" style={{ marginTop: 0 }}>
              <h2>24/7 Noodhulp bij Autosleutels en Sloten in Midden-Nederland</h2>
              <p>
                Niets is zo frustrerend als midden in de nacht, tijdens een regenbuis of vlak voor een belangrijke afspraak voor een afgesloten auto te staan. Of u nu de autosleutel per ongeluk in de kofferbak heeft laten liggen, de sleutel is afgebroken in het contactslot, of u het slachtoffer bent geworden van diefstal: <strong>{SITE_CONFIG.name}</strong> biedt 24 uur per dag en 365 dagen per jaar directe spoedhulp.
              </p>
              <h3>Snelste Reactietijd in Regio Utrecht &amp; Amsterdam</h3>
              <p>
                Dankzij onze centrale ligging en meerdere mobiele servicebussen zijn wij gemiddeld binnen 30 minuten bij u op locatie in Utrecht, Amsterdam, Amersfoort, Hilversum en Almere. Onze bussen beschikken over autonome stroomvoorziening, hightech sleutelmachines en diagnosecomputers om direct ter plekke te frezen, te openen en te inleren.
              </p>
              <h3>100% Schadevrij Auto Openen bij Buitensluiting</h3>
              <p>
                Wanneer uw sleutel nog in de auto ligt of in het contactslot steekt terwijl de deuren in het slot zijn gevallen, openen wij uw autodeur gegarandeerd 100% schadevrij. Wij gebruiken gespecialiseerde Lishi-lockpicks waarmee wij het cilinderslot via de sleutelgatpinnen manipuleren en openen. Hierbij wordt geen druk op uw raamrubbers of lak uitgeoefend, en blijft uw slotmechanisme in originele topstaat.
              </p>
              <h3>Wat gebeurt er als uw autosleutel is gestolen?</h3>
              <p>
                Bij diefstal of verlies van uw autosleutel is snel handelen cruciaal voor de veiligheid van uw voertuig. Onze specialist wist via de OBD2-diagnosepoort direct de verloren of gestolen sleutelcode uit de immobilizer (startonderbreker) en de BCM-module. Hierdoor kan een eventuele vinder of dief de auto niet meer starten. Vervolgens leren wij direct één of meerdere nieuwe sleutels met een nieuwe beveiligingscode in.
              </p>
              <h3>Garantie, Tarieven en Vergoeding door Verzekeraars</h3>
              <p>
                Al onze spoedreparaties en nieuwe transpondersleutels worden geleverd met 100% werkinggarantie en 12 maanden schriftelijke garantie op de elektronica en behuizing. U ontvangt ter plaatse een officiële BTW-factuur waarmee u, afhankelijk van uw autoverzekering (beperkt casco of allrisk) of pechhulpverzekering, de gemaakte kosten voor sleutelvervanging of noodopening kunt declareren.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ background: 'var(--color-danger)', padding: '3rem 2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Spoed? Bel Direct — 24/7</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>Wij zijn nu beschikbaar. Gemiddeld {SITE_CONFIG.responseTime} bij u.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background: '#fff', color: 'var(--color-danger)', padding: '1rem 2.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }} id="spoed-bottom-phone">{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ background: '#25d366', color: '#fff', padding: '1rem 2rem', borderRadius: '4px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }} id="spoed-bottom-wa">WhatsApp</a>
          </div>
        </section>
      </main>
    </>
  );
}
