import type { Metadata } from 'next';
import Link from 'next/link';
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
      absolute: brand.customMetaTitle || `${brand.name} Autosleutel Bijmaken | Alle Modellen & Bouwjaren | Autosleutel24`,
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
        <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '4rem 2rem 3.5rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" style={{ padding: '0.95rem 2rem', fontSize: '1.05rem', fontWeight: 700 }} id={`brand-hero-${brand.slug}-phone`}>
                  📞 Direct Belcontact: {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wa-btn" style={{ background:'#25d366', color:'#fff', padding:'0.95rem 2rem', borderRadius:'8px', fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'0.6rem' }} id={`brand-hero-${brand.slug}-wa`}>
                  💬 WhatsApp uw {brand.name} Kenteken
                </a>
              </div>
            </div>
            <div style={{ flex: '1 1 400px', maxWidth: '450px', width: '100%', margin: '0 auto' }}>
              <LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" initialBrand={brand.name} />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <HowItWorks brandName={brand.name} />

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
                {recentWorkImages.map((img, idx) => (
                  <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/merken/${img}`} alt={`${brand.name} sleutel bijmaken`} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CLEAN 3-COLUMN MODEL LIST (NEW DESIGN) ── */}
        <section id="modellen" style={{ padding: '4.5rem 0', background: '#f8fafc' }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {brand.name} SLEUTELS DIE WIJ BIJMAKEN
              </h2>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              
              <style dangerouslySetInnerHTML={{__html: `
                .modelsFlexWrap {
                  display: flex;
                  gap: 4rem;
                  align-items: flex-start;
                }
                .modelsListCol {
                  flex: 1;
                  column-count: 3;
                  column-gap: 2.5rem;
                  color: #64748b;
                  font-size: 0.95rem;
                  line-height: 1.6;
                }
                .modelsListCol div {
                  margin-bottom: 0.4rem;
                }
                .brandLogoArea {
                  flex: 0 0 200px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }
                .brandActionButtons {
                  display: flex;
                  gap: 1rem;
                  border-top: 1px solid #f1f5f9;
                  padding-top: 2rem;
                }
                @media (max-width: 768px) {
                  .modelsFlexWrap {
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                  }
                  .modelsListCol {
                    column-count: 2;
                    text-align: center;
                  }
                  .brandActionButtons {
                    flex-direction: column;
                  }
                }
                @media (max-width: 480px) {
                  .modelsListCol {
                    column-count: 1;
                    font-size: 1.05rem;
                    line-height: 1.4;
                  }
                  .modelsListCol div {
                    margin-bottom: 0.15rem;
                  }
                }
              `}} />

              <div className="modelsFlexWrap">
                {/* Left: Logo Area */}
                <div className="brandLogoArea">
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                      {(() => {
                        const FALLBACK_LOGOS: Record<string, string> = {
                          'renault': 'https://cdn.simpleicons.org/renault/001E50',
                          'ford': 'https://cdn.simpleicons.org/ford/001E50',
                          'hyundai': 'https://cdn.simpleicons.org/hyundai/001E50',
                          'volkswagen': 'https://cdn.simpleicons.org/volkswagen/001E50',
                          'bmw': 'https://cdn.simpleicons.org/bmw/001E50',
                          'audi': 'https://cdn.simpleicons.org/audi/001E50',
                          'mercedes-benz': 'https://cdn.simpleicons.org/mercedes/001E50',
                          'toyota': 'https://cdn.simpleicons.org/toyota/001E50',
                          'peugeot': 'https://cdn.simpleicons.org/peugeot/001E50',
                          'opel': 'https://cdn.simpleicons.org/opel/001E50',
                          'citroen': 'https://cdn.simpleicons.org/citroen/001E50',
                          'kia': 'https://cdn.simpleicons.org/kia/001E50',
                          'nissan': 'https://cdn.simpleicons.org/nissan/001E50'
                        };

                        let logoUrl: string | null = null;
                        const exts = ['.webp', '.svg', '.png', '.jpg', '.jpeg'];
                        
                        // Check local files first
                        for (const ext of exts) {
                          if (fs.existsSync(path.join(process.cwd(), 'public', 'brands', `${brand.slug}_sleutel_bijmaken${ext}`))) {
                            logoUrl = `/brands/${brand.slug}_sleutel_bijmaken${ext}`; break;
                          }
                          if (fs.existsSync(path.join(process.cwd(), 'public', 'brands', `${brand.slug}-autosleutel-bijmaken${ext}`))) {
                            logoUrl = `/brands/${brand.slug}-autosleutel-bijmaken${ext}`; break;
                          }
                          // Since I copied raw files from desktop, let's also check for exact slug
                          if (fs.existsSync(path.join(process.cwd(), 'public', 'brands', `${brand.slug}${ext}`))) {
                            logoUrl = `/brands/${brand.slug}${ext}`; break;
                          }
                          if (fs.existsSync(path.join(process.cwd(), 'public', 'brands', `${brand.name}${ext}`))) {
                            logoUrl = `/brands/${brand.name}${ext}`; break;
                          }
                        }
                        
                        // Fallback to static mapping
                        if (!logoUrl && FALLBACK_LOGOS[brand.slug]) {
                          logoUrl = FALLBACK_LOGOS[brand.slug];
                        }
                        
                        if (logoUrl) {
                          // eslint-disable-next-line @next/next/no-img-element
                          return <img src={logoUrl} alt={`${brand.name} logo`} style={{ width: '80%', height: '80%', objectFit: 'contain' }} loading="lazy" />;
                        }
                        return <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#cbd5e1' }}>{brand.name.charAt(0)}</span>;
                      })()}
                    </div>
                  </div>
                  <h3 style={{ marginTop: '1.5rem', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {brand.name}
                  </h3>
                </div>

                {/* Right: Models List */}
                <div className="modelsListCol">
                  {brand.models?.map(m => (
                    <div key={m.slug} style={{ breakInside: 'avoid' }}>
                      {m.name}
                    </div>
                  ))}
                  {(!brand.models || brand.models.length === 0) && (
                    <p>Alle modellen ondersteund.</p>
                  )}
                </div>
              </div>

              {/* Bottom: Action Buttons */}
              <div className="brandActionButtons">
                <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#fff7ed', border: '2px solid #fb923c', color: '#ea580c', padding: '1rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Bel Nu: {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f0fdf4', border: '2px solid #6ee7b7', color: '#16a34a', padding: '1rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  WhatsApp
                </a>
              </div>

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
          customFaqs={getFaqForBrand(brand.name).map(f => ({ question: f.q, answer: f.a }))} 
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
