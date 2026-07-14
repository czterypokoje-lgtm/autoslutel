import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import fs from 'fs';
import path from 'path';
import { BRANDS } from '@/config/brands';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard, { SHARED_GOOGLE_REVIEWS } from '@/components/GoogleReviewCard/GoogleReviewCard';

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
  const pageUrl = `${SITE_CONFIG.domain}/merken/${merkSlug}`;
  return {
    title: {
      absolute: `${brand.name} Autosleutel Bijmaken | Alle Modellen & Bouwjaren | Autosleutel24`,
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

  // Load recent work images
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'merken');
  let recentWorkImages: string[] = [];
  try {
    const files = fs.readdirSync(imagesDir);
    recentWorkImages = files.filter(f => f.toLowerCase().startsWith(brand.nameSlug.toLowerCase() + '-'));
  } catch (e) {
    // ignore
  }

  // Group models alphabetically (A-Z or 0-9)
  const modelsSorted = [...(brand.models || [])].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  const alphabetGroups: Record<string, typeof modelsSorted> = {};
  
  modelsSorted.forEach(m => {
    const firstChar = m.name.charAt(0).toUpperCase();
    const groupKey = /[A-Z]/.test(firstChar) ? firstChar : '0–9';
    if (!alphabetGroups[groupKey]) alphabetGroups[groupKey] = [];
    alphabetGroups[groupKey].push(m);
  });

  const schema = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: `${brand.name} Autosleutel Bijmaken — Autosleutel Specialist`,
    description: `Professionele autosleutel bijmaken & programmeren voor alle ${brand.name} modellen (${brand.system}). Autosleutel Specialist mobiele service op locatie.`,
    provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel },
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
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <nav style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.55)' }}>Home</Link> /
              <Link href="/merken" style={{ color: 'rgba(255,255,255,0.55)' }}>Merken</Link> /
              <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{brand.name}</span>
            </nav>

            <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.2rem' }}>
              {brand.name} Autosleutel Bijmaken &amp; Programmeren <br />
              <span style={{ color: 'var(--orange-400)' }}>Alle Modellen &amp; Bouwjaren • Mobiel Ter Plaatse</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 760, fontSize: '1.08rem', lineHeight: 1.7, marginBottom: '2.2rem' }}>
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

        {/* ── A–Z COMPLETE MODEL CATALOG & YEAR GUIDE ── */}
        <section id="modellen" style={{ padding: '4.5rem 0', background: '#f8fafc' }}>
          <div className="container">
            <div style={{ maxWidth: 900, marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--orange-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>A–Z Modellenoverzicht</span>
              <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem', marginBottom: '0.85rem' }}>
                Alle Ondersteunde {brand.name} Modellen &amp; Bouwjaren
              </h2>
              <p style={{ color: '#475569', fontSize: '1.02rem', lineHeight: 1.7 }}>
                Staat uw voertuig hieronder vermeld? Dan kunnen wij direct op locatie een nieuwe reservesleutel frezen en inleren, of een verloren sleutel wissen uit de startonderbreker. Wij ondersteunen alle bouwjaren, generaties en sleuteltypen (klapsleutel, transponder en Keyless Go).
              </p>
            </div>

            {Object.keys(alphabetGroups).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {Object.keys(alphabetGroups).sort().map(letter => (
                  <div key={letter} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: '#0f172a', color: '#fff', padding: '0.75rem 1.5rem', fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{brand.name} — Groep {letter}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>{alphabetGroups[letter].length} modellen</span>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
                      {alphabetGroups[letter].map(m => (
                        <div key={m.slug} style={{ padding: '1.25rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <strong style={{ fontSize: '1.12rem', color: '#0f172a' }}>{brand.name} {m.name}</strong>
                              <span style={{ background: '#e2e8f0', color: '#334155', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>OEM</span>
                            </div>
                            {m.generations && (
                              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.35rem 0' }}>
                                <strong>Generaties:</strong> {m.generations}
                              </p>
                            )}
                            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 0.8rem 0' }}>
                              <strong>Bouwjaren:</strong> {m.years}
                            </p>
                          </div>
                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>✓ Klapsleutel &amp; Smart Key</span>
                            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" 
                              style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ea580c', textDecoration: 'none' }}>
                              Prijs aanvragen →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#0f172a' }}>Alle {brand.name} Modellen &amp; Bouwjaren Ondersteund</h3>
                <p style={{ color: '#475569', lineHeight: 1.7 }}>
                  Staat uw specifieke {brand.name} model hier niet tussen? Geen zorgen! Wij leveren, frezen en programmeren autosleutels voor <strong>vrijwel elk type {brand.name}</strong> uit de bouwjaren 1998 tot en met 2024. Neem direct contact op via telefoon of WhatsApp en geef uw kenteken of model door voor een directe prijsopgave.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── TECHNICAL & SYSTEM DEEP DIVE (SEO RICH TEXT) ── */}
        <section style={{ padding: '4.5rem 0', background: '#ffffff' }}>
          <div className="container">
            <div className="seo-article-block" style={{ marginTop: 0 }}>
              <h2>Uitgebreide Technische Specificaties: {brand.name} Autosleutels &amp; Startonderbreker ({brand.system})</h2>
              <p>
                Het merk <strong>{brand.name}</strong> staat bekend om zijn betrouwbare engineering en geavanceerde voertuigbeveiliging. Moderne {brand.name} modellen maken gebruik van complexe elektronische startonderbrekers en cryptografische transpondersystemen (zoals <strong>{brand.system}</strong>). Waar traditionele sleutelmakers vaak niet verder komen dan het mechanisch kopiëren van een sleutelbaard, beschikken onze gecertificeerde monteurs over officiële fabriekssoftware en hightech diagnosetools om de sleutel direct in de centrale boordcomputer te programmeren.
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
            </div>
          </div>
        </section>

        {/* ── GOOGLE KLANTENBEOORDELINGEN ── */}
        <section style={{ padding: '4rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h2 className="text-center" style={{ marginBottom: '0.5rem' }}>Wat Klanten Zeggen over Onze {brand.name} Service</h2>
            <p className="text-center" style={{ color: 'var(--gray-600)', marginBottom: '2.5rem' }}>Beoordeeld met 4.9 / 5.0 op basis van honderden tevreden automobilisten</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
              {SHARED_GOOGLE_REVIEWS.slice(0, 3).map((r, idx) => (
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
