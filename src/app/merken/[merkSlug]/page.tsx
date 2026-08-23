import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import Script from 'next/script';
import fs from 'fs';
import path from 'path';
import { BRANDS } from '@/config/brands';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard from '@/components/GoogleReviewCard/GoogleReviewCard';
import { generateContextualReviews } from '@/utils/reviews';
import FaqSection from '@/components/FaqSection/FaqSection';
import { getFaqForBrand } from '@/config/faq';
import { getBaseLocalBusinessSchema } from '@/utils/schema';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import HowItWorks from '@/components/HowItWorks/HowItWorks';

export async function generateStaticParams() {
  return BRANDS.map(b => ({ merkSlug: `${b.nameSlug}-autosleutel-bijmaken` }));
}

export async function generateMetadata(props: { params: Promise<{ merkSlug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const merkSlug = params.merkSlug;
  const decodedSlug = decodeURIComponent(merkSlug).toLowerCase();
  
  const brand = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedSlug === `${base}-autosleutel-bijmaken` || decodedSlug === base;
  });

  if (!brand) return {};
  
  // Always use the long SEO slug for the canonical URL
  const pageUrl = `${SITE_CONFIG.domain}/merken/${brand.nameSlug.toLowerCase()}-autosleutel-bijmaken`;
  return {
    title: {
      absolute: brand.customMetaTitle || `${brand.name} Autosleutel Bijmaken | Alle Modellen & Bouwjaren`,
    },
    description: `${brand.name} autosleutel bijmaken & programmeren op locatie. Volledig A–Z modellenoverzicht (${brand.system}). Tot 50% goedkoper dan de ${brand.name} dealer. Bel direct: ${SITE_CONFIG.phone}`,
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
      title: `${brand.name} Autosleutel Bijmaken & Programmeren | Alle Modellen & Bouwjaren`,
      description: `${brand.name} autosleutel bijmaken & inleren op locatie. Goedkoper dan de dealer. Zelfde dag klaar met 12 maanden garantie. Bel direct!`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${brand.name} reservesleutel bijmaken — Autosleutel24` }],
    },
  };
}

export default async function BrandPage(props: { params: Promise<{ merkSlug: string }> }) {
  const params = await props.params;
  const merkSlug = params.merkSlug;
  const decodedSlug = decodeURIComponent(merkSlug).toLowerCase();

  const brand = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedSlug === `${base}-autosleutel-bijmaken` || decodedSlug === base;
  });

  if (!brand) notFound();

  // Redirect short slugs (e.g. /merken/audi) to the long SEO slug (e.g. /merken/audi-autosleutel-bijmaken)
  if (decodedSlug === brand.nameSlug.toLowerCase()) {
    permanentRedirect(`/merken/${brand.nameSlug.toLowerCase()}-autosleutel-bijmaken`);
  }

  // Load recent work images
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'merken');
  let recentWorkImages: string[] = [];
  try {
    const files = fs.readdirSync(imagesDir);
    recentWorkImages = files.filter(f => f.toLowerCase().startsWith(brand.nameSlug.toLowerCase() + '-'));
  } catch (e) {
    // ignore
  }

  // alphabetGroups logic removed because it is no longer used in the new UI layout.

  // Check if a specific car photo exists for this brand
  const carPhotoPathLocal = path.join(process.cwd(), 'public', 'images', 'cars', `${brand.slug}.jpg`);
  const hasCarPhoto = fs.existsSync(carPhotoPathLocal);
  const carPhotoSrc = hasCarPhoto ? `/images/cars/${brand.slug}.jpg` : `/images/merken/bmw_car_placeholder.jpg`;

  const schema = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: `${brand.name} Autosleutel Bijmaken — Autosleutel Specialist`,
    description: `Professionele autosleutel bijmaken & programmeren voor alle ${brand.name} modellen (${brand.system}). Autosleutel Specialist mobiele service op locatie.`,
    provider: getBaseLocalBusinessSchema(),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Merken', item: `${SITE_CONFIG.domain}/merken` },
      { '@type': 'ListItem', position: 3, name: brand.name, item: `${SITE_CONFIG.domain}/merken/${merkSlug}` },
    ],
  };

  return (
    <>
      <Script id={`brand-schema-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`brand-breadcrumb-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* ── HERO SECTION ── */}
        <section style={{ position: 'relative', padding: '4rem 2rem 3.5rem', overflow: 'hidden' }}>
          {/* SEO Optimized Background Image */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -2 }}>
            <Image
              src={`/images/merken-hero/${brand.slug}-autosleutel-bijmaken.webp`}
              alt={`${brand.name} autosleutel bijmaken en programmeren`}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority
              quality={60}
            />
          </div>
          {/* Gradient Overlay for Text Readability */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: 'linear-gradient(160deg, rgba(15,23,42,0.65), rgba(15,23,42,0.85))' }} />
          
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 500px' }}>
              <nav style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                <Link href="/" style={{ color: 'rgba(255,255,255,0.55)' }}>Home</Link> /
                <Link href="/merken" style={{ color: 'rgba(255,255,255,0.55)' }}>Merken</Link> /
                <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{brand.name}</span>
              </nav>

              <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.2rem' }}>
                {brand.customH1 || <>{brand.name} Autosleutel Bijmaken &amp; Programmeren</>} <br />
                <span style={{ color: 'var(--orange-400)' }}>Alle Modellen &amp; Bouwjaren • Mobiel Ter Plaatse</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.08rem', lineHeight: 1.7, marginBottom: '2.2rem' }}>
                Bent u uw {brand.name} autosleutel kwijt, is de sleutel afgebroken of reageert de Smart Key afstandsbediening niet meer?
                Wij komen met onze volledig uitgeruste mobiele werkplaats naar u toe en programmeren direct een originele dealer-sleutel in de boordcomputer.
                <strong> 30% tot 50% goedkoper dan de {brand.name}-dealer</strong>, zonder wegsleepkosten!
              </p>

            </div>
            <div style={{ flex: '1 1 400px', maxWidth: '450px', width: '100%', margin: '0 auto' }}>
              <LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" initialBrand={brand.name} />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <HowItWorks brandName={brand.name} />

        {/* ── DIENSTEN SECTION ── */}
        <section style={{ padding: '4.5rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              Onze Diensten voor {brand.name}
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginBottom: '3rem', maxWidth: 560, margin: '0 auto 3rem' }}>
              Wij specialiseren ons in alle autosleutel services voor {brand.name} — snel, mobiel en goedkoper dan de dealer.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>

              {/* Card 1: Bijmaken */}
              <Link href="/diensten/autosleutel-bijmaken" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem 2rem 2rem', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} id={`brand-dienst-bijmaken-${brand.slug}`}>
                <div style={{ width: '100%', height: '160px', position: 'relative', marginBottom: '1.75rem' }}>
                  <Image src="/images/service_bijmaken.png" alt={`${brand.name} autosleutel bijmaken`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>
                  {brand.name} Autosleutel Bijmaken
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, flex: 1 }}>
                  Extra of reserve {brand.name} sleutel nodig? Wij frezen en programmeren een nieuwe sleutel direct bij u op locatie, vaak de helft goedkoper dan de {brand.name}-dealer.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '1rem' }}>Vanaf €149,- ex</span>
                  <span style={{ color: 'var(--navy-700)', fontWeight: 600, fontSize: '0.9rem' }}>Lees meer &rarr;</span>
                </div>
              </Link>

              {/* Card 2: Kwijt */}
              <Link href="/diensten/alle-sleutels-kwijt-auto" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem 2rem 2rem', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} id={`brand-dienst-kwijt-${brand.slug}`}>
                <div style={{ width: '100%', height: '160px', position: 'relative', marginBottom: '1.75rem' }}>
                  <Image src="/images/service_kwijt.png" alt={`${brand.name} autosleutels kwijt`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>
                  {brand.name} Autosleutels Kwijt
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, flex: 1 }}>
                  Alle {brand.name} sleutels kwijt? Wij komen direct naar u toe, openen de auto schadevrij, frezen een nieuwe sleutel en leren hem in de {brand.name} boordcomputer.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '1rem' }}>Vanaf €299,- ex</span>
                  <span style={{ color: 'var(--navy-700)', fontWeight: 600, fontSize: '0.9rem' }}>Lees meer &rarr;</span>
                </div>
              </Link>

              {/* Card 3: Openen */}
              <Link href="/diensten/auto-openen-zonder-sleutel" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem 2rem 2rem', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} id={`brand-dienst-openen-${brand.slug}`}>
                <div style={{ width: '100%', height: '160px', position: 'relative', marginBottom: '1.75rem' }}>
                  <Image src="/images/service_openen.png" alt={`${brand.name} autodeur openen`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>
                  {brand.name} Autodeur Openen
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, flex: 1 }}>
                  Sleutel in de {brand.name} laten liggen? Wij openen uw auto 100% schadevrij met professioneel gereedschap, zonder krassen of beschadigingen.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '1rem' }}>Vanaf €149,- ex</span>
                  <span style={{ color: 'var(--navy-700)', fontWeight: 600, fontSize: '0.9rem' }}>Lees meer &rarr;</span>
                </div>
              </Link>

              {/* Card 4: Contactslot Vervangen */}
              <Link href="/diensten" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem 2rem 2rem', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} id={`brand-dienst-contactslot-${brand.slug}`}>
                <div style={{ width: '100%', height: '160px', position: 'relative', marginBottom: '1.75rem' }}>
                  <Image src="/images/service_contactslot.png" alt={`${brand.name} contactslot vervangen`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>
                  {brand.name} Contactslot Vervangen
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, flex: 1 }}>
                  {brand.name} contactslot defect of beschadigd? Wij vervangen het contactslot en programmeren de nieuwe sleutel direct ter plaatse, zonder uw auto naar de garage te slepen.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '1rem' }}>Vanaf €299,- ex</span>
                  <span style={{ color: 'var(--navy-700)', fontWeight: 600, fontSize: '0.9rem' }}>Lees meer &rarr;</span>
                </div>
              </Link>

              {/* Card 5: Webshop (HIDDEN FOR NOW) */}
              {/* <Link href={`/webshop/merk/${brand.slug}`} style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem 2rem 2rem', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} id={`brand-dienst-webshop-${brand.slug}`}>
                <div style={{ width: '100%', height: '160px', position: 'relative', marginBottom: '1.75rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '3rem' }}>🛒</span>
                </div>
                <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>
                  {brand.name} Webshop
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, flex: 1 }}>
                  Op zoek naar losse {brand.name} batterijen, lege behuizingen of accessoires? Bestel ze direct en voordelig in onze webshop.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '1rem' }}>Vanaf €4,95</span>
                  <span style={{ color: 'var(--navy-700)', fontWeight: 600, fontSize: '0.9rem' }}>Shop Nu &rarr;</span>
                </div>
              </Link> */}

            </div>
          </div>
        </section>

        {/* ── RECENT WERK GALLERY ── */}
        {recentWorkImages.length > 0 && (
          <section style={{ padding: '4.5rem 0', background: '#ffffff' }}>
            <div className="container">
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--orange-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recente Projecten</span>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                  Recent Werk: {brand.name} Autosleutels
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                {recentWorkImages.slice(0, 3).map((img, idx) => (
                  <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative', aspectRatio: '4/3', backgroundColor: '#f1f5f9' }}>
                    <Image 
                      src={`/images/merken/${img}`} 
                      alt={`${brand.name} autosleutel bijmaken`} 
                      fill 
                      style={{ objectFit: 'contain' }} 
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── TIMPSON STYLE 'WHY CHOOSE US' SECTION ── */}
        <section style={{ padding: '4.5rem 0', background: '#ffffff' }}>
          <div className="container" style={{ maxWidth: 1200 }}>
            
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: '#0f172a', marginBottom: '3.5rem', textAlign: 'center' }}>
              Waarom kiezen voor onze {brand.name} autosleutel service?
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
              
              {/* Column 1: Affordable */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '5/4', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '1.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/why_choose_us_1.jpg" alt="Betaalbaar pinapparaat" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Betaalbaar</h3>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                  Onze {brand.name} reservesleutels zijn tot 50% goedkoper dan bij de officiële merkdealers.
                </p>
              </div>

              {/* Column 2: Convenient */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '5/4', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '1.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/why_choose_us_2.png" alt="Sleutel programmeren op locatie" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Gemakkelijk</h3>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                  Krijg snel en eenvoudig uw nieuwe {brand.name} autosleutel op locatie door heel Nederland.
                </p>
              </div>

              {/* Column 3: Quality */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '5/4', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '1.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/why_choose_us_3.png" alt="Sleutel werkplaats" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Kwaliteit</h3>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                  Onze monteurs frezen nauwkeurige {brand.name} sleutels en leren deze vakkundig in op uw voertuig.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ── TIMPSON STYLE MODELS SECTION (BRANDED COLORS & ALL MODELS) ── */}
        <section id="modellen" style={{ padding: '4.5rem 0', background: '#f8fafc' }}>
          <div className="container" style={{ maxWidth: 1200 }}>
            
            <style dangerouslySetInnerHTML={{__html: `
              .timpson-section-wrap {
                display: flex;
                gap: 4rem;
                align-items: center;
                background: #ffffff;
                border-radius: 16px;
                padding: 3.5rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.03);
              }
              .model-link-hover:hover {
                text-decoration: underline !important;
                color: var(--orange-500) !important;
              }
              .models-list {
                color: #475569;
                font-size: 1.05rem;
                line-height: 2;
                padding-left: 1.5rem;
                margin-bottom: 1.5rem;
                font-weight: 600;
                list-style-type: disc;
                column-count: 2;
                column-gap: 2rem;
              }
              @media (max-width: 900px) {
                .timpson-section-wrap {
                  flex-direction: column;
                  padding: 2rem;
                  gap: 2rem;
                }
                .models-list {
                  column-count: 1;
                }
              }
            `}} />

            <div className="timpson-section-wrap">
              <div style={{ flex: '1 1 500px' }}>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                  Nieuwe {brand.name} sleutels voor de populairste modellen
                </h2>
                
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Het vervangen van uw {brand.name} sleutel gaat altijd snel en eenvoudig bij Autosleutel24. Onze ervaren monteurs kunnen {brand.name} sleutels frezen, inleren en repareren op locatie door heel Nederland.
                </p>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Wij leveren snelle en betaalbare {brand.name} reservesleutels voor alle modellen, waaronder:
                </p>

                <ul className="models-list">
                  {brand.models?.map(m => (
                    <li key={m.slug} style={{ breakInside: 'avoid' }}>
                      <Link href={`/merken/${brand.nameSlug.toLowerCase()}-autosleutel-bijmaken/${m.slug}-sleutel-bijmaken`} style={{ color: '#1e293b', textDecoration: 'none' }} className="model-link-hover">
                        {brand.name} {m.name} sleutels
                      </Link>
                    </li>
                  ))}
                  {brand.specialIntents?.map(intent => (
                    <li key={intent.slug} style={{ breakInside: 'avoid' }}>
                      <Link href={`/merken/${brand.nameSlug.toLowerCase()}-autosleutel-bijmaken/${intent.slug}`} style={{ color: 'var(--orange-600)', textDecoration: 'none' }} className="model-link-hover">
                        {intent.name}
                      </Link>
                    </li>
                  ))}
                  {(!brand.models || brand.models.length === 0) && (
                    <li>Alle {brand.name} modellen ondersteund</li>
                  )}
                </ul>
              </div>

              <div style={{ flex: '1 1 450px', position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={carPhotoSrc} alt={`${brand.name} car`} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
              </div>
            </div>

            {/* Bottom: Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#fff7ed', border: '2px solid #fb923c', color: '#ea580c', padding: '1rem 2rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem', minWidth: '250px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Bel Nu: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f0fdf4', border: '2px solid #6ee7b7', color: '#16a34a', padding: '1rem 2rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem', minWidth: '250px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp
              </a>
            </div>

          </div>
        </section>

        {/* ── AUTOSLEUTEL VOORBEELDEN (ANTI-THIN CONTENT) ── */}
        <section style={{ padding: '3.5rem 0 1.5rem', background: '#ffffff' }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            {(() => {
              const key1Path = path.join(process.cwd(), 'public', 'images', 'keys', `${brand.slug}-autosleutel-bijmaken-1.webp`);
              const key2Path = path.join(process.cwd(), 'public', 'images', 'keys', `${brand.slug}-autosleutel-bijmaken-2.webp`);
              
              const hasKey1 = fs.existsSync(key1Path);
              const hasKey2 = fs.existsSync(key2Path);

              if (!hasKey1 && !hasKey2) return null;

              return (
                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 400px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                      Voorbeeld {brand.name} Autosleutels
                    </h2>
                    <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                      Om u een goed beeld te geven van de kwaliteit die wij leveren, ziet u hiernaast voorbeelden van originele {brand.name} sleutels die wij recent hebben bijgemaakt. Wij leveren altijd sleutels van de hoogste kwaliteit, inclusief alle benodigde elektronica (zoals de transponderchip voor de startonderbreker en de afstandsbediening voor de centrale deurvergrendeling).
                    </p>
                    <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7 }}>
                      Elke sleutel wordt op locatie mechanisch gefreesd en direct elektronisch ingeleerd in de boordcomputer van uw {brand.name}. Zo bent u verzekerd van een perfect werkende reservesleutel of nieuwe hoofdsleutel met 12 maanden volledige garantie.
                    </p>
                  </div>
                  <div style={{ flex: '1 1 350px', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    {hasKey1 && (
                      <div style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/images/keys/${brand.slug}-autosleutel-bijmaken-1.webp`} alt={`${brand.name} sleutel bijmaken voorbeeld 1`} style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'contain', mixBlendMode: 'multiply' }} loading="lazy" />
                      </div>
                    )}
                    {hasKey2 && (
                      <div style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/images/keys/${brand.slug}-autosleutel-bijmaken-2.webp`} alt={`${brand.name} sleutel bijmaken voorbeeld 2`} style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'contain', mixBlendMode: 'multiply' }} loading="lazy" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ── TECHNICAL & SYSTEM DEEP DIVE (SEO RICH TEXT) ── */}
        <section style={{ padding: '4.5rem 0', background: '#ffffff' }}>
          <div className="container">
            <div className="seo-article-block" style={{ marginTop: 0 }}>
              <h2>{brand.name} Sleutel Bijmaken en Inleren ({brand.system})</h2>
              <p>
                Wilt u een <strong>{brand.name} sleutel laten maken</strong>? Dat regelen wij graag voor u! Moderne auto&apos;s zoals de {brand.name} hebben een slimme beveiliging met een transponderchip (zoals <strong>{brand.system}</strong>). U kunt de auto alleen starten met een officieel ingeleerde sleutel. Wij kunnen direct een nieuwe <strong>{brand.name} sleutel bijmaken</strong> en deze veilig in de computer van uw auto inleren. Zo kunt u weer met een gerust hart de weg op. U kunt bij ons ook uw kapotte sleutel laten repareren.
              </p>

              <h3>1. Hoe werkt het inleren van een {brand.name} transponder of Smart Key?</h3>
              <p>
                Elke {brand.name} autosleutel bevat een miniatuur transponderchip die een unieke, digitaal versleutelde code uitzendt naar de immobiliser-unit of body control module van de auto. Wanneer u de sleutel in het contactslot steekt of op de startknop drukt, verifieert het systeem deze code binnen enkele milliseconden. Komt de code niet overeen, dan wordt de brandstoftoevoer en ontsteking direct geblokkeerd.
              </p>
              <p>
                Onze monteurs sluiten op locatie een professionele OBD2-programmer aan op uw {brand.name}. Wij synchroniseren de cryptografische sleutelsessies rechtstreeks met de fabrieksbeveiliging. Hierdoor functioneert uw nieuwe reservesleutel of Keyless Go afstandsbediening exact zoals een sleutel die rechtstreeks uit de fabriek komt.
              </p>

              <h3>2. Wat te doen bij &quot;All Keys Lost&quot; (Alle {brand.name} Sleutels Kwijt)?</h3>
              <p>
                Bent u onderweg of thuis al uw {brand.name} autosleutels kwijtgeraakt? Bij een merkdealer bent u dan vaak genoodzaakt om uw auto te laten wegslepen en soms complete slotensets of regelapparaten te laten vervangen—een traject dat honderden euro&apos;s extra kost en weken kan duren.
              </p>
              <p>
                Dankzij onze gespecialiseerde mobiele noodservice lossen wij een &apos;All Keys Lost&apos; situatie ter plaatse voor u op:
              </p>
              <ul>
                <li><strong>100% Schadevrij Openen:</strong> Met precisie Lishi 2-in-1 lock decoders openen wij het portierslot van uw {brand.name} zonder enige schade aan lak, rubber of cilinder.</li>
                <li><strong>Mechanisch CNC-Frezen:</strong> Aan de hand van de slotcode snijdt onze mobiele computergestuurde freesmachine direct een gloednieuwe sleutelbaard.</li>
                <li><strong>Elektronische Herprogrammering:</strong> Wij programmeren de nieuwe sleutel in en wissen tegelijkertijd alle verloren of gestolen sleutels uit de computer, zodat onbevoegden uw auto niet meer kunnen starten.</li>
              </ul>

              <h3>3. Dealer vs. Autosleutel24: Transparante Prijsvergelijking</h3>
              <p>
                Veel autobezitters schrikken van de tarieven die officiële merkdealers rekenen voor een nieuwe {brand.name} sleutel. Door onze efficiënte mobiele werkwijze zonder logge showrooms bieden wij u niet alleen snelheid, maar ook een fors financieel voordeel:
              </p>
              <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '0.85rem' }}>Service Onderdeel</th>
                      <th style={{ padding: '0.85rem' }}>Officiële {brand.name} Dealer</th>
                      <th style={{ padding: '0.85rem', color: '#ea580c' }}>Autosleutel24 (Mobiel)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.85rem', fontWeight: 600 }}>Wachttijd</td>
                      <td style={{ padding: '0.85rem' }}>Gemiddeld 5 tot 14 werkdagen</td>
                      <td style={{ padding: '0.85rem', fontWeight: 700, color: '#059669' }}>Zelfde dag klaar op locatie</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.85rem', fontWeight: 600 }}>Sleepkosten bij sleutel kwijt</td>
                      <td style={{ padding: '0.85rem' }}>€150 – €300 (wegslepen verplicht)</td>
                      <td style={{ padding: '0.85rem', fontWeight: 700, color: '#059669' }}>€0 — Wij komen naar uw auto</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.85rem', fontWeight: 600 }}>Prijsniveau Reservesleutel</td>
                      <td style={{ padding: '0.85rem' }}>Hoog dealer-tarief</td>
                      <td style={{ padding: '0.85rem', fontWeight: 700, color: '#059669' }}>Tot 50% voordeliger</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.85rem', fontWeight: 600 }}>Garantie op sleutel &amp; chip</td>
                      <td style={{ padding: '0.85rem' }}>Standaard fabrieksgarantie</td>
                      <td style={{ padding: '0.85rem', fontWeight: 700, color: '#059669' }}>12 maanden schriftelijke garantie</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {brand.customSeoBlurb && (
                <>
                  <h3>Populaire {brand.name} Modellen die Wij Bedienen</h3>
                  <p>{brand.customSeoBlurb}</p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION (SEO & AI OPTIMIZED) ── */}
        <FaqSection 
          customFaqs={[
            ...(brand.customFaqs || []).map(f => ({ question: f.q, answer: f.a })),
            ...getFaqForBrand(brand.name).map(f => ({ question: f.q, answer: f.a }))
          ]}
          brandName={brand.name} 
        />

        {/* ── GOOGLE KLANTENBEOORDELINGEN ── */}
        <section style={{ padding: '4rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h2 className="text-center" style={{ marginBottom: '0.5rem' }}>Wat Klanten Zeggen over Onze {brand.name} Service</h2>
            <p className="text-center" style={{ color: 'var(--gray-600)', marginBottom: '2.5rem' }}>Beoordeeld met {SITE_CONFIG.rating} / 5.0 op basis van honderden tevreden automobilisten</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
              {generateContextualReviews(brand.name, 'brand').map((r, idx) => (
                <GoogleReviewCard key={idx} review={r} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA CONTACT BANNER ── */}
        <section style={{ padding: '4.5rem 0', background: 'var(--navy-900)', color: '#fff', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem' }}>
              Direct een Nieuwe {brand.name} Autosleutel Nodig?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.7 }}>
              Neem direct contact op met onze spoeddienst of stuur een foto van uw sleutel via WhatsApp.
              Binnen 1 minuut ontvangt u een vrijblijvende, vaste prijsopgave inclusief programmeren op locatie.
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
