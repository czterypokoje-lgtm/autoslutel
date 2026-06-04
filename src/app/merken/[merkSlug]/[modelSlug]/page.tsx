import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { BRANDS } from '../../../../config/brands';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export async function generateStaticParams() {
  const params: { merkSlug: string; modelSlug: string }[] = [];
  BRANDS.forEach(brand => {
    if (brand.models) {
      brand.models.forEach(model => {
        params.push({ merkSlug: `${brand.nameSlug}-sleutel-programmeren`, modelSlug: model.slug });
      });
    }
  });
  return params;
}

export async function generateMetadata(props: { params: Promise<{ merkSlug: string; modelSlug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const merkSlug = params.merkSlug;
  const modelSlug = params.modelSlug;
  const decodedBrand = decodeURIComponent(merkSlug).toLowerCase();
  const decodedModel = decodeURIComponent(modelSlug).toLowerCase();

  const brand = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedBrand === `${base}-sleutel-programmeren` || decodedBrand === base;
  });
  
  const model = brand?.models?.find(m => m.slug.toLowerCase() === decodedModel);
  if (!brand || !model) return {};

  const title = `${brand.name} ${model.name} Sleutel Programmeren | Bouwjaren: ${model.years} | ${SITE_CONFIG.name}`;
  const desc = `${brand.name} ${model.name} autosleutel bijmaken of programmeren. Wij ondersteunen bouwjaren ${model.years}. Mobiel aan huis, 24/7 bereikbaar. Goedkoper dan de dealer.`;

  return {
    title, description: desc,
    alternates: { canonical: `${SITE_CONFIG.domain}/merken/${merkSlug}/${modelSlug}` },
  };
}

export default async function ModelPage(props: { params: Promise<{ merkSlug: string; modelSlug: string }> }) {
  const params = await props.params;
  const merkSlug = params.merkSlug;
  const modelSlug = params.modelSlug;
  const decodedBrand = decodeURIComponent(merkSlug).toLowerCase();
  const decodedModel = decodeURIComponent(modelSlug).toLowerCase();

  const brand = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedBrand === `${base}-sleutel-programmeren` || decodedBrand === base;
  });

  const model = brand?.models?.find(m => m.slug.toLowerCase() === decodedModel);

  if (!brand || !model) notFound();

  const yearList = model.years.split(',').map(y => y.trim());

  const schema = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: `${brand.name} ${model.name} Sleutel Programmeren`,
    provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel },
    description: `Gespecialiseerde autosleutel service voor de ${brand.name} ${model.name}. Ondersteunt bouwjaren ${model.years}.`,
  };

  return (
    <>
      <Script id={`model-schema-${merkSlug}-${modelSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '4rem 2rem 3rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <nav style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.45)' }}>Home</Link> /
              <Link href="/merken" style={{ color: 'rgba(255,255,255,0.45)' }}>Merken</Link> /
              <Link href={`/merken/${merkSlug}`} style={{ color: 'rgba(255,255,255,0.45)' }}>{brand.name}</Link> /
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{model.name}</span>
            </nav>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', marginBottom: '1rem' }}>
              {`${brand.name} ${model.name} Sleutel Bijmaken & Programmeren`}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 720, lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {`Is uw ${brand.name} ${model.name} sleutel kwijt, gestolen of defect? Wij programmeren nieuwe sleutels `}
              ter plaatse voor alle bouwjaren tussen <strong>{yearList[0]} en {yearList[yearList.length - 1]}</strong>.
              Snel, vakkundig en tot 50% goedkoper dan de dealer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`model-${merkSlug}-${modelSlug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', background:'#25d366', color:'#fff', padding:'0.85rem 2rem', borderRadius:'4px', fontWeight:700, textDecoration:'none', fontSize:'1rem' }} id={`model-${merkSlug}-${modelSlug}-wa`}>WhatsApp</a>
            </div>
          </div>
        </section>

        {/* Years Grid for SEO */}
        <section style={{ padding: '3.5rem 0' }}>
          <div className="container">
            <h2>Ondersteunde Bouwjaren {brand.name} {model.name}</h2>
            <p style={{ marginBottom: '1.5rem' }}>Wij kunnen sleutels programmeren voor de volgende {brand.name} {model.name} bouwjaren:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
              {yearList.map(year => (
                <div key={year} style={{ padding: '0.75rem', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                  {year}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Info */}
        <section style={{ padding: '3.5rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
              <div>
                <h2>Technische Details {brand.name} {model.name}</h2>
                <p>
                  De {brand.name} {model.name} ({model.generations || 'Alle generaties'}) maakt gebruik van het
                  <strong> {brand.system}</strong> beveiligingssysteem. Wij hebben de specialistische apparatuur
                  om direct in de computer van uw auto te programmeren.
                </p>
                <ul className="check-list">
                  <li>Reserve sleutel bijmaken (terwijl u wacht)</li>
                  <li>Alle sleutels kwijt (AKL) - wij openen en maken nieuwe</li>
                  <li>Afstandsbediening inleren</li>
                  <li>Keyless Entry / Smart Key activatie</li>
                  <li>Transponder chip klonen</li>
                </ul>
              </div>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
                <h3>Waarom voor ons kiezen?</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '1rem' }}>✅ <strong>Geen Sleepkosten</strong>: Wij komen naar uw {brand.name} toe.</li>
                  <li style={{ marginBottom: '1rem' }}>✅ <strong>Klaar terwijl u wacht</strong>: Meestal binnen 45 minuten.</li>
                  <li style={{ marginBottom: '1rem' }}>✅ <strong>Dealer Kwaliteit</strong>: Originele chips en software.</li>
                  <li style={{ marginBottom: '1rem' }}>✅ <strong>24/7 Bereikbaar</strong>: Ook in het weekend en &apos;s nachts.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background:'var(--navy-900)', padding:'4rem 2rem', textAlign:'center' }}>
          <h2 style={{ color:'#fff', marginBottom:'0.5rem' }}>Hulp nodig met uw {brand.name} {model.name} sleutel?</h2>
          <p style={{ color:'rgba(255,255,255,0.65)', marginBottom:'2.5rem' }}>Onze mobiele werkplaats is volledig uitgerust voor de {brand.name} {model.name}.</p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`model-bottom-${merkSlug}-${modelSlug}-phone`}>{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wa-btn" style={{ background:'#25d366', color:'#fff', padding:'1rem 2.5rem', borderRadius:'6px', fontWeight:700, textDecoration:'none', fontSize:'1.1rem' }} id={`model-bottom-${merkSlug}-${modelSlug}-wa`}>WhatsApp Direct</a>
          </div>
        </section>
      </main>
    </>
  );
}
