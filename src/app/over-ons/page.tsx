import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: 'Over Ons | Berkan Acarol Slotenmaker | Autosleutel24',
  },
  description: `Ontmoet Berkan Acarol, gecertificeerd autosleutelspecialist. Autosleutel24 Utrecht — dealer-niveau programmering, alle merken. KVK geregistreerd, verzekerd, 24/7 beschikbaar.`,
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
  name: 'Berkan Acarol',
  jobTitle: 'Hoofdtechnicus & Autosleutelspecialist',
  description: 'Gecertificeerd autosleutelspecialist met jarenlange ervaring in voertuigbeveiliging en autosleutelcodering. Specialist in transponder programmering, smart key systemen en contactslot reparatie voor alle automerken.',
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


        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2.5rem', marginBottom: '3.5rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>Wie Zijn Wij?</h2>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>Autosleutel24 Utrecht wordt geleid door Berkan Acarol, een gecertificeerd autosleutelspecialist met jarenlange ervaring in voertuigbeveiliging en autosleutelcodering. Samen met een hecht team van ervaren mobiele monteurs helpen wij dagelijks autobezitters, wagenparkbeheerders en autobedrijven in heel Midden-Nederland.</p>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>Wij zijn een mobiele dienst gespecialiseerd in autosleutelprogrammering voor alle merken en modellen. Wij komen naar u toe — of u nu thuis bent, op het werk, of gestrand langs de weg.</p>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1rem' }}>Onze focus: eerlijke prijzen, snelle reactie, en technisch excellent werk. Geen vage verhalen — gewoon het probleem oplossen.</p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Onze Waarden</h3>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '0.88rem', color: 'var(--gray-700)', lineHeight: '1.7' }}>
              <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Transparantie</strong> — Vaste prijs afspreken voor start</span></li>
              <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Betrouwbaarheid</strong> — KVK geregistreerd, verzekerd</span></li>
              <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Kwaliteit</strong> — Professionele tools, geen goedkope alternatieven</span></li>
              <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Bereikbaarheid</strong> — 24/7, ook weekend en feestdagen</span></li>
            </ul>
          </div>

          <div>
            <img
              src="/images/team/berkan-acarol-autosleutelspecialist-utrecht.webp"
              alt="Berkan Acarol — Hoofdtechnicus"
              style={{
                width: '100%',
                maxWidth: '340px',
                height: '220px',
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                display: 'block',
                marginBottom: '0.75rem'
              }}
            />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>Berkan Acarol</h3>
            <p style={{ color: 'var(--orange-500)', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Hoofdtechnicus</p>
          </div>
        </div>

        {/* Workshop Image Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2.5rem', marginBottom: '3.5rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem' }}>Onze Professionele Werkplaats</h2>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>Bij Autosleutel24 Utrecht geloven we in het leveren van topkwaliteit. Daarom beschikken we naast onze mobiele bussen over een eigen, fysieke werkplaats in Utrecht. Deze is speciaal uitgerust met CNC-gestuurde sleutel-freesmachines, soldeerstations voor fijnmicro-solderen en geavanceerde programmeerapparaten.</p>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>Of het nu gaat om het dupliceren van een reservesleutel, het inlezen van een transponder of het herstellen van een defect printplaatje; in onze werkplaats voeren we alle handelingen met uiterste precisie uit.</p>
          </div>
          <div>
            <img 
              src="/images/seo/auto_sleutel_utrecht_24uur_workshop.webp" 
              alt="Professionele autosleutel werkplaats en gereedschap" 
              style={{ width: '100%', maxWidth: '340px', height: '210px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'block' }} 
            />
          </div>
        </div>

        {/* Mobile Work & Inventory Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2.5rem', marginBottom: '3.5rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem' }}>Service Op Locatie &amp; 24/7 Bereikbaar</h2>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>Problemen met uw autosleutel gebeuren vaak op de meest ongelegen momenten. Met onze volledig uitgeruste mobiele servicebussen komen we direct naar u toe, waar u zich ook bevindt in de regio Utrecht. U hoeft uw auto niet te slepen naar de dealer, wij fixen het op locatie!</p>
          </div>
          <div>
            <img 
              src="/images/seo/slotenmaker_utrecht_werkzaamheden_24uur.webp" 
              alt="Werkzaamheden op locatie door monteur" 
              style={{ width: '100%', maxWidth: '340px', height: '210px', objectFit: 'cover', objectPosition: 'top', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'block' }} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2.5rem', marginBottom: '3.5rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem' }}>Grote Voorraad Originele Sleutels</h2>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>Om u zo snel mogelijk weer op weg te helpen, beschikken wij over een enorme voorraad aan originele en aftermarket autosleutels. Van moderne smart keys (keyless go) tot traditionele transpondersleutels, wij hebben de juiste sleutel voor 99% van alle automerken direct op voorraad.</p>
          </div>
          <div>
            <img 
              src="/images/seo/envanter.jpeg" 
              alt="Voorraad originele autosleutels en transponders" 
              style={{ width: '100%', maxWidth: '340px', height: '210px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'block' }} 
            />
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

        {/* ── COMPREHENSIVE OVER ONS SEO GUIDE ARTICLE ── */}
        <div className="seo-article-block" style={{ marginTop: '2rem', marginBottom: '3.5rem' }}>
          <h2>Waarom Onze Slotenmakers en Mobiele Service Koploper in Nederland Zijn</h2>
          <p>
            Bij <strong>{SITE_CONFIG.name}</strong> geloven we in vakmanschap, eerlijke communicatie en snelle hulp. Berkan Acarol en zijn team werken continu met de modernste sleutel- en diagnosesoftware op de markt. Waar veel garages stoppen bij het leveren van standaard mechanische sleutels, zijn wij gespecialiseerd in complexe voertuigelektronica, EEPROM-lezen, CAN-bus beveiligingen en het inleren van transponderchips op fabrieksniveau.
          </p>
          <h3>Geen Tussenpersonen of Callcenters</h3>
          <p>
            Wanneer u ons belt op ons noodnummer, krijgt u direct een deskundige monteur aan de lijn. U hoeft niet te onderhandelen via tussenpersonen of dure callcenters. Wij schatten direct uw situatie in, geven u vooraf een duidelijke all-in prijsopgave en plannen de dichtstbijzijnde mobiele monteur in om binnen 30 tot 45 minuten bij u te zijn.
          </p>
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
