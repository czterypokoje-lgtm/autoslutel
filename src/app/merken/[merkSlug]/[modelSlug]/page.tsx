import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import Script from 'next/script';
import fs from 'fs';
import path from 'path';
import { BRANDS } from '@/config/brands';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard from '@/components/GoogleReviewCard/GoogleReviewCard';
import { generateContextualReviews } from '@/utils/reviews';
import FaqSection from '@/components/FaqSection/FaqSection';
import { getFaqForBrand } from '@/config/faq';
import { getBaseLocalBusinessSchema } from '@/utils/schema';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import HowItWorks from '@/components/HowItWorks/HowItWorks';

export async function generateStaticParams() {
  const params: { merkSlug: string; modelSlug: string }[] = [];

  for (const brand of BRANDS) {
    const merkSlug = `${brand.nameSlug}-autosleutel-bijmaken`;
    
    // Add paths for all standard models
    if (brand.models) {
      for (const model of brand.models) {
        params.push({
          merkSlug,
          modelSlug: `${model.slug}-sleutel-bijmaken`,
        });
      }
    }

    // Add paths for special intents (like contactslot-eis)
    if (brand.specialIntents) {
      for (const intent of brand.specialIntents) {
        params.push({
          merkSlug,
          modelSlug: intent.slug,
        });
      }
    }
  }

  return params;
}

export async function generateMetadata(props: { params: Promise<{ merkSlug: string; modelSlug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const decodedMerkSlug = decodeURIComponent(params.merkSlug).toLowerCase();
  const decodedModelSlug = decodeURIComponent(params.modelSlug).toLowerCase();
  
  const brand = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedMerkSlug === `${base}-autosleutel-bijmaken` || decodedMerkSlug === base;
  });

  if (!brand) return {};

  let targetName = '';
  let metaTitle = '';
  let metaDesc = '';

  const isModel = decodedModelSlug.endsWith('-sleutel-bijmaken');
  const baseModelSlug = isModel ? decodedModelSlug.replace('-sleutel-bijmaken', '') : null;

  const model = brand.models?.find(m => m.slug === baseModelSlug);
  const intent = brand.specialIntents?.find(i => i.slug === decodedModelSlug);

  if (model) {
    targetName = model.name;
    metaTitle = `${brand.name} ${targetName} Sleutel Bijmaken & Programmeren | Autosleutel24`;
    metaDesc = `${brand.name} ${targetName} autosleutel bijmaken of repareren op locatie. Sleutel kwijt of afgebroken? Wij maken direct een nieuwe ${brand.name} ${targetName} sleutel. Bel nu: ${SITE_CONFIG.phone}`;
  } else if (intent) {
    targetName = intent.name;
    metaTitle = `${brand.name} ${targetName} Repareren & Vervangen | Autosleutel24`;
    metaDesc = `Problemen met uw ${brand.name} ${targetName}? Wij verzorgen professionele reparatie en vervanging van ${brand.name} ${targetName} op locatie. Vaste prijs, direct geholpen.`;
  } else {
    return {};
  }
  
  const pageUrl = `${SITE_CONFIG.domain}/merken/${brand.nameSlug.toLowerCase()}-autosleutel-bijmaken/${decodedModelSlug}`;

  return {
    title: { absolute: metaTitle },
    description: metaDesc,
    alternates: {
      canonical: pageUrl,
      languages: {
        'nl-NL': pageUrl,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: metaTitle,
      description: metaDesc,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: metaTitle }],
    },
  };
}

export default async function ModelPage(props: { params: Promise<{ merkSlug: string; modelSlug: string }> }) {
  const params = await props.params;
  const decodedMerkSlug = decodeURIComponent(params.merkSlug).toLowerCase();
  const decodedModelSlug = decodeURIComponent(params.modelSlug).toLowerCase();

  const brand = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedMerkSlug === `${base}-autosleutel-bijmaken` || decodedMerkSlug === base;
  });

  if (!brand) notFound();

  // Handle redirects for exact brand slug without suffix
  if (decodedMerkSlug === brand.nameSlug.toLowerCase()) {
    permanentRedirect(`/merken/${brand.nameSlug.toLowerCase()}-autosleutel-bijmaken/${decodedModelSlug}`);
  }

  const isModel = decodedModelSlug.endsWith('-sleutel-bijmaken');
  const baseModelSlug = isModel ? decodedModelSlug.replace('-sleutel-bijmaken', '') : null;

  const model = brand.models?.find(m => m.slug === baseModelSlug);
  const intent = brand.specialIntents?.find(i => i.slug === decodedModelSlug);

  if (!model && !intent) notFound();

  const targetName = model ? model.name : intent!.name;
  const h1Text = model 
    ? `${brand.name} ${targetName} Autosleutel Bijmaken of Repareren`
    : `${brand.name} ${targetName} Repareren & Vervangen`;
    
  const serviceName = model ? `${brand.name} ${targetName} Autosleutel Bijmaken` : `${brand.name} ${targetName} Reparatie`;

  // Schema for LocalBusiness/Service
  const schema = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: serviceName,
    description: model 
      ? `Professionele autosleutel bijmaken & programmeren voor de ${brand.name} ${targetName}. Autosleutel Specialist mobiele service op locatie.`
      : `Professionele reparatie en vervanging van de ${brand.name} ${targetName} op locatie door Autosleutel24.`,
    provider: getBaseLocalBusinessSchema(),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Merken', item: `${SITE_CONFIG.domain}/merken` },
      { '@type': 'ListItem', position: 3, name: brand.name, item: `${SITE_CONFIG.domain}/merken/${brand.nameSlug}-autosleutel-bijmaken` },
      { '@type': 'ListItem', position: 4, name: targetName, item: `${SITE_CONFIG.domain}/merken/${brand.nameSlug}-autosleutel-bijmaken/${decodedModelSlug}` },
    ],
  };

  return (
    <>
      <Script id={`model-schema-${decodedModelSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`model-breadcrumb-${decodedModelSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* ── HERO SECTION ── */}
        <section style={{ position: 'relative', padding: '4rem 2rem 3.5rem', overflow: 'hidden' }}>
          {/* SEO Optimized Background Image - Fallback to brand hero if model hero doesn't exist */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -2 }}>
            <Image
              src={`/images/merken-hero/${brand.slug}-autosleutel-bijmaken.webp`}
              alt={`${brand.name} ${targetName} autosleutel bijmaken`}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority
              quality={60}
              unoptimized
            />
          </div>
          {/* Gradient Overlay */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: 'linear-gradient(160deg, rgba(15,23,42,0.65), rgba(15,23,42,0.85))' }} />
          
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 500px' }}>
              <nav style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                <Link href="/" style={{ color: 'rgba(255,255,255,0.55)' }}>Home</Link> /
                <Link href="/merken" style={{ color: 'rgba(255,255,255,0.55)' }}>Merken</Link> /
                <Link href={`/merken/${brand.nameSlug}-autosleutel-bijmaken`} style={{ color: 'rgba(255,255,255,0.55)' }}>{brand.name}</Link> /
                <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{targetName}</span>
              </nav>

              <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.2rem' }}>
                {h1Text} <br />
                <span style={{ color: 'var(--orange-400)' }}>Mobiel Ter Plaatse • Zelfde Dag Klaar</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.08rem', lineHeight: 1.7, marginBottom: '2.2rem' }}>
                Heeft u problemen met uw {brand.name} {targetName}? Wij komen met onze volledig uitgeruste mobiele werkplaats naar u toe.
                Wij kunnen ter plaatse een originele sleutel inlezen, programmeren of uw {targetName} repareren.
                <strong> Tot 50% goedkoper dan de dealer</strong>, zonder wegsleepkosten!
              </p>
              <Link href={`/merken/${brand.nameSlug.toLowerCase()}-autosleutel-bijmaken`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#fb923c', textDecoration: 'none', fontWeight: 600, fontSize: '1.05rem' }}>
                &larr; Bekijk alle {brand.name} modellen
              </Link>
            </div>
            <div style={{ flex: '1 1 400px', maxWidth: '450px', width: '100%', margin: '0 auto' }}>
              <LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" initialBrand={brand.name} initialModel={targetName} />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <HowItWorks brandName={`${brand.name} ${targetName}`} />

        {/* ── DIENSTEN SECTION ── */}
        <section style={{ padding: '4.5rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              Onze {targetName} Diensten
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginBottom: '3rem', maxWidth: 560, margin: '0 auto 3rem' }}>
              Wij specialiseren ons in alle services voor de {brand.name} {targetName} — snel, mobiel en voordelig.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
              
              <Link href="/diensten/autosleutel-bijmaken" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem 2rem 2rem', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '100%', height: '160px', position: 'relative', marginBottom: '1.75rem' }}>
                  <Image src="/images/service_bijmaken.png" alt={`${brand.name} ${targetName} sleutel bijmaken`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>
                  Sleutel Bijmaken
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, flex: 1 }}>
                  Nieuwe {brand.name} {targetName} sleutel nodig? Wij frezen en programmeren een nieuwe sleutel direct bij u op locatie.
                </p>
              </Link>

              <Link href="/diensten/alle-sleutels-kwijt-auto" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem 2rem 2rem', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '100%', height: '160px', position: 'relative', marginBottom: '1.75rem' }}>
                  <Image src="/images/service_kwijt.png" alt={`${brand.name} ${targetName} sleutels kwijt`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>
                  Sleutels Kwijt
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, flex: 1 }}>
                  Alle {targetName} sleutels kwijt? Wij openen de auto schadevrij en programmeren direct een nieuwe sleutel.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* ── TECHNICAL & SYSTEM DEEP DIVE (SEO RICH TEXT) ── */}
        <section style={{ padding: '4.5rem 0', background: '#ffffff' }}>
          <div className="container">
            <div className="seo-article-block" style={{ marginTop: 0 }}>
              <h2>{brand.name} {targetName} Sleutel Inleren en Repareren</h2>
              <p>
                Rijdt u in een <strong>{brand.name} {targetName}</strong> en bent u op zoek naar een betrouwbare partij voor het bijmaken of repareren van uw autosleutel? Autosleutel24 is gespecialiseerd in de {brand.name} {targetName}. Doordat deze auto voorzien is van complexe elektronica (zoals <strong>{brand.system}</strong>), vereist het inleren van de sleutel geavanceerde diagnoseapparatuur. Wij hebben de officiële software en hardware om uw {targetName} sleutel veilig en efficiënt in te leren in de boordcomputer, precies zoals de fabrikant dat voorschrijft.
              </p>

              <h3>Mobiele Service voor de {brand.name} {targetName}</h3>
              <p>
                U hoeft uw {brand.name} {targetName} niet naar een dure dealer of garage te slepen. Wij komen met onze volledig uitgeruste servicebus naar u toe—of u nu thuis, op het werk of gestrand langs de weg staat. Wij kunnen:
              </p>
              <ul>
                <li>De auto 100% schadevrij openen als u bent buitengesloten.</li>
                <li>Een nieuwe {targetName} sleutel mechanisch CNC-frezen op locatie.</li>
                <li>De afstandsbediening, transponder of Smart Key chip direct inleren.</li>
                <li>Oude, verloren sleutels uit de startonderbreker wissen voor de veiligheid.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION (SEO & AI OPTIMIZED) ── */}
        <FaqSection 
          customFaqs={getFaqForBrand(brand.name).map(f => ({ question: f.q.replace(brand.name, `${brand.name} ${targetName}`), answer: f.a.replace(brand.name, `${brand.name} ${targetName}`) }))} 
          brandName={`${brand.name} ${targetName}`} 
        />

        {/* ── GOOGLE KLANTENBEOORDELINGEN ── */}
        <section style={{ padding: '4rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h2 className="text-center" style={{ marginBottom: '0.5rem' }}>Wat Klanten Zeggen over Onze {brand.name} Service</h2>
            <p className="text-center" style={{ color: 'var(--gray-600)', marginBottom: '2.5rem' }}>Beoordeeld met {SITE_CONFIG.rating} / 5.0 op basis van honderden tevreden automobilisten</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
              {generateContextualReviews(brand.name, 'brand').slice(0, 3).map((r, idx) => (
                <GoogleReviewCard key={idx} review={r} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA CONTACT BANNER ── */}
        <section style={{ padding: '4.5rem 0', background: 'var(--navy-900)', color: '#fff', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem' }}>
              Problemen met uw {brand.name} {targetName}?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.7 }}>
              Neem direct contact op voor een vrijblijvende, vaste prijsopgave inclusief service op locatie.
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
                📞 Bel Nu: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wa-btn" style={{ background:'#25d366', color:'#fff', padding:'1rem 2.5rem', borderRadius:'8px', fontWeight:700, textDecoration:'none', fontSize: '1.1rem' }}>
                💬 WhatsApp Direct
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
