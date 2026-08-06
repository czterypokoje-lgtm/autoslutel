import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: 'Over Ons | Autosleutel24: Gecertificeerd Autosleutel Specialist',
  },
  description: `Maak kennis met Autosleutel24. Onder leiding van Berkan Acarol bieden wij professionele, mobiele autosleutelservice in de gehele Randstad en Midden-Nederland.`,
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
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Over Autosleutel24: Uw Mobiele Autosleutelspecialist</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', lineHeight: 1.7 }}>
            Wij zijn uw betrouwbare, mobiele autosleutelspecialist. Met geavanceerde apparatuur en jarenlange ervaring lossen wij elk autosleutelprobleem op. Wij doen dit direct ter plaatse, 24/7 en voor een eerlijke, vaste prijs.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>


        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2.5rem', marginBottom: '3.5rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>Wie Zijn Wij?</h2>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>Autosleutel24 wordt geleid door Berkan Acarol. Hij is een gecertificeerd expert in voertuigbeveiliging en autosleutelcodering. Samen met een hecht team van ervaren mobiele monteurs helpen wij dagelijks particulieren, wagenparkbeheerders en garagebedrijven.</p>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>Wij komen altijd naar u toe. Of u nu thuis bent, op het werk, of gestrand langs de snelweg.</p>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1rem' }}>Onze focus is simpel: Eerlijke prijzen, snelle reactietijden en technisch perfect werk. Geen vage verhalen, gewoon direct uw probleem oplossen.</p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Onze Kernwaarden</h3>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '0.88rem', color: 'var(--gray-700)', lineHeight: '1.7' }}>
              <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Transparantie:</strong> U krijgt altijd vooraf een vaste prijs. Geen verrassingen achteraf.</span></li>
              <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Betrouwbaarheid:</strong> Wij zijn KvK-geregistreerd, volledig verzekerd en leveren werk met standaard 12 maanden garantie.</span></li>
              <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Kwaliteit:</strong> Wij gebruiken uitsluitend professionele (OEM) apparatuur, geen goedkope imitatie.</span></li>
              <li style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Bereikbaarheid:</strong> Wij staan 24 uur per dag, 7 dagen per week voor u klaar, ook in het weekend en op feestdagen.</span></li>
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem' }}>Onze Werkplaats &amp; Mobiele Service<br/>📍 Hoofdkantoor in Utrecht, Actief in de Hele Randstad</h2>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>Onze fysieke werkplaats en het magazijn zijn gevestigd in Utrecht. Vanuit deze centrale locatie sturen wij onze mobiele servicebussen aan.</p>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>Wij rijden dagelijks uit naar klanten in de hele Randstad en Midden-Nederland. Zo helpen wij snel en op locatie in onder andere Amsterdam, Rotterdam, Den Haag, Amersfoort, Almere en het Gooi.</p>
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem' }}>🚐 Volledig Uitgeruste Servicebussen</h2>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>Problemen met autosleutels gebeuren vaak op ongelegen momenten. Daarom hebben wij onze bussen ingericht als rijdende werkplaatsen. Wij frezen sleutels direct op locatie met CNC-gestuurde machines en hebben soldeerstations voor precisiewerk bij ons. U hoeft uw auto dus nooit duur te laten wegslepen naar een dealer.</p>
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem' }}>🔑 Grote Voorraad Originele Sleutels</h2>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>Om u zo snel mogelijk weer op weg te helpen, hebben wij een enorme voorraad originele en aftermarket autosleutels. Van moderne Keyless Go smart keys tot traditionele sleutels met een transponder; voor 99% van alle automerken hebben wij direct de juiste oplossing op voorraad.</p>
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
            { num: '4.9★', label: 'Google Score', sub: 'Meer dan 247 klantbeoordelingen' },
            { num: '34 min', label: 'Gemiddelde reactietijd', sub: 'Op locatie' },
            { num: '24/7', label: 'Bereikbaar', sub: 'Voor spoedgevallen in de gehele regio' },
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
          <h2>Waarom Kiezen Voor Autosleutel24?</h2>
          <h3>Echte Expertise, Geen Standaard Garage</h3>
          <p>
            Berkan Acarol en zijn team werken altijd met de nieuwste software voor sleutel- en voertuigdiagnose. Waar een standaard garage stopt, gaan wij verder. Wij zijn gespecialiseerd in complexe voertuigelektronica, het lezen van EEPROM, CAN-bus beveiliging en het inleren van transponderchips op fabrieksniveau.
          </p>
          <h3>Geen Tussenpersonen of Dure Callcenters</h3>
          <p>
            Wanneer u ons noodnummer belt, krijgt u geen callcenter aan de lijn, maar direct een deskundige monteur.
          </p>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li><strong>Direct Contact:</strong> Wij schatten uw situatie direct aan de telefoon in.</li>
            <li><strong>Heldere Prijs:</strong> U krijgt vooraf een duidelijke all-in prijsopgave.</li>
            <li><strong>Snel Ter Plaatse:</strong> Wij plannen de dichtstbijzijnde monteur in. Vaak zijn we al binnen 30 tot 45 minuten bij u op locatie.</li>
          </ul>
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
