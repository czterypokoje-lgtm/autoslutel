import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Over Ons — Ahmed, Autosleutelspecialist Utrecht | ${SITE_CONFIG.name}`,
  description: `Ontmoet Ahmed, gecertificeerd autosleutelspecialist met 10+ jaar ervaring. Autosleutel24 Utrecht — dealer-niveau programmering, alle merken. KVK geregistreerd, verzekerd, 24/7 beschikbaar.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/over-ons`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/over-ons`,
      'x-default': `${SITE_CONFIG.domain}/over-ons`,
    },
  },
};

const tools = ['Autel IM608 Pro II', 'VVDI BIMTool Pro', 'Yanhua Mini ACDP', 'FC-200 / Hextag', 'AVDI Abrites', 'Lonsdor K518', 'Xhorse Key Tool Plus', 'BMW ICOM NEXT + ISTA', 'Magic Motorsport FLEX', 'Dolphin XP005L CNC'];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Over Ons', item: `${SITE_CONFIG.domain}/over-ons` },
  ],
};

// E-E-A-T: Named specialist schema — critical for Google trust signals
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_CONFIG.domain}/#specialist`,
  name: 'Ahmed',
  jobTitle: 'Gecertificeerd Autosleutelspecialist',
  description: 'Gecertificeerd autosleutelspecialist met meer dan 10 jaar ervaring in voertuigbeveiliging en autosleutelcodering. Specialist in transponder programmering, smart key systemen en contactslot reparatie voor alle automerken.',
  worksFor: {
    '@id': `${SITE_CONFIG.domain}/#localbusiness`,
  },
  knowsAbout: [
    'Autosleutel programmering',
    'Transponder sleutels',
    'Smart Key systemen',
    'Immobilizer bypass',
    'Contactslot reparatie',
    'OBD2 diagnose',
    'Voertuigbeveiliging',
  ],
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Certificering',
      name: 'Autel IM608 Pro II Gecertificeerd',
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Certificering',
      name: 'AVDI Abrites Gecertificeerd Technicus',
    },
  ],
  url: `${SITE_CONFIG.domain}/over-ons`,
};

export default function OverOnsPage() {
  return (
    <>
      <Script id="over-ons-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="over-ons-person-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <main>
      <section style={{ 
        background: 'linear-gradient(135deg, rgba(7,14,26,0.85) 0%, rgba(10,22,40,0.95) 100%), url("/images/seo/auto_sleutel_utrecht_achtergrond_service.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '6rem 2rem' 
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span className="section-label">OVER ONS</span>
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>De Autosleutel Specialist van Utrecht</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', lineHeight: 1.7 }}>
            Wij zijn een mobiele autosleutel specialist gevestigd in Utrecht. Met state-of-the-art apparatuur en jarenlange ervaring lossen wij elk sleutelprobleem op — ter plaatse, 24/7, eerlijk geprijsd.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        {/* ── E-E-A-T SPECIALIST CARD — Named expert = Google trust ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          background: 'linear-gradient(135deg, #0d2137 0%, #1a3a5c 100%)',
          borderRadius: '20px',
          padding: '2rem 2.5rem',
          marginBottom: '3rem',
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e8520a, #ff7c38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            flexShrink: 0,
            border: '3px solid rgba(255,255,255,0.2)',
          }}>🔑</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Uw Specialist</div>
            <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>Ahmed</div>
            <div style={{ color: '#e8520a', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Gecertificeerd Autosleutelspecialist • 10+ jaar ervaring</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Autel Gecertificeerd', 'AVDI Gecertificeerd', 'KVK Geregistreerd', 'Volledig Verzekerd', '24/7 Bereikbaar'].map(badge => (
                <span key={badge} style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.85)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>{badge}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', marginBottom: '4rem', alignItems: 'start' }}>
          <div>
            <h2>Wie Zijn Wij?</h2>
            <p>Autosleutel24 Utrecht is opgericht door Ahmed, een gecertificeerd autosleutelspecialist met meer dan 10 jaar ervaring in voertuigbeveiliging en autosleutelcodering. Samen met een hecht team van ervaren mobiele monteurs helpen wij dagelijks autobezitters, wagenparkbeheerders en autobedrijven in heel Midden-Nederland.</p>
            <p>Wij zijn een mobiele dienst gespecialiseerd in autosleutelprogrammering voor alle merken en modellen. Wij komen naar u toe — of u nu thuis bent, op het werk, of gestrand langs de weg.</p>
            <p>Onze focus: eerlijke prijzen, snelle reactie, en technisch excellent werk. Geen vage verhalen — gewoon het probleem oplossen.</p>

            <h3>Onze Waarden</h3>
            <ul>
              <li>✅ <strong>Transparantie</strong> — Vaste prijs afspreken voor start</li>
              <li>✅ <strong>Betrouwbaarheid</strong> — KVK geregistreerd, verzekerd</li>
              <li>✅ <strong>Kwaliteit</strong> — Professionele tools, geen goedkope alternatieven</li>
              <li>✅ <strong>Bereikbaarheid</strong> — 24/7, ook weekend en feestdagen</li>
            </ul>
          </div>

          <div style={{ background: 'var(--color-bg-alt)', padding: '2rem', borderRadius: '16px' }}>
            <h3>Gecertificeerde Tools</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Wij investeren in de beste apparatuur voor dealer-niveau programmering:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {tools.map((tool) => (
                <span key={tool} style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(26, 86, 219, 0.2)' }}>
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Workshop Image Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', marginBottom: '4rem', alignItems: 'center' }}>
          <div>
            <img 
              src="/images/seo/auto_sleutel_utrecht_24uur_workshop.webp" 
              alt="Professionele autosleutel werkplaats en gereedschap in Utrecht voor 24 uur service" 
              style={{ width: '100%', borderRadius: '16px', boxShadow: 'var(--shadow-md)', objectFit: 'cover', aspectRatio: '4/3' }} 
            />
          </div>
          <div>
            <h2>Onze Professionele Werkplaats</h2>
            <p>Bij Autosleutel24 Utrecht geloven we in het leveren van topkwaliteit. Daarom beschikken we naast onze mobiele bussen over een eigen, fysieke werkplaats in Utrecht. Deze is speciaal uitgerust met CNC-gestuurde sleutel-freesmachines, soldeerstations voor fijnmicro-solderen en geavanceerde programmeerapparaten.</p>
            <p>Of het nu gaat om het dupliceren van een reservesleutel, het inlezen van een transponder of het herstellen van een defect printplaatje; in onze werkplaats voeren we alle handelingen met uiterste precisie uit.</p>
          </div>
        </div>



        {/* Mobile Work & Inventory Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', marginBottom: '4rem', alignItems: 'center' }}>
          <div style={{ order: 2 }}>
            <img 
              src="/images/seo/slotenmaker_utrecht_werkzaamheden_24uur.webp" 
              alt="Slotenmaker in Utrecht werkzaamheden op locatie 24 uur service" 
              style={{ width: '100%', borderRadius: '16px', boxShadow: 'var(--shadow-md)', objectFit: 'cover', aspectRatio: '4/3' }} 
            />
          </div>
          <div style={{ order: 1 }}>
            <h2>Service Op Locatie & 24/7 Bereikbaar</h2>
            <p>Problemen met uw autosleutel gebeuren vaak op de meest ongelegen momenten. Met onze volledig uitgeruste mobiele servicebussen komen we direct naar u toe, waar u zich ook bevindt in de regio Utrecht. U hoeft uw auto niet te slepen naar de dealer, wij fixen het op locatie!</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', marginBottom: '4rem', alignItems: 'center' }}>
          <div>
            <img 
              src="/images/seo/slotenmaker_voorraad_utrecht_sleutels.webp" 
              alt="Grote voorraad autosleutels slotenmaker Utrecht" 
              style={{ width: '100%', borderRadius: '16px', boxShadow: 'var(--shadow-md)', objectFit: 'cover', aspectRatio: '4/3' }} 
            />
          </div>
          <div>
            <h2>Grote Voorraad Originele Sleutels</h2>
            <p>Om u zo snel mogelijk weer op weg te helpen, beschikken wij over een enorme voorraad aan originele en aftermarket autosleutels. Van moderne smart keys (keyless go) tot traditionele transpondersleutels, wij hebben de juiste sleutel voor 99% van alle automerken direct op voorraad.</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {[
            { num: '127+', label: 'Tevreden klanten', sub: 'Google beoordeeld' },
            { num: '4.9★', label: 'Google score', sub: 'Gemiddeld' },
            { num: '34 min', label: 'Reactietijd', sub: 'In Utrecht' },
            { num: '24/7', label: 'Bereikbaar', sub: 'Altijd' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '2rem', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>{s.num}</div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.9rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/contact" className="btn btn-primary btn-lg" id="over-ons-contact-cta">
            📞 Neem Contact Op
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}
