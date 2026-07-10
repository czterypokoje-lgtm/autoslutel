import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { BRANDS } from '../../../../config/brands';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export async function generateStaticParams() {
  const params: { merkSlug: string; modelSlug: string }[] = [];
  BRANDS.forEach(brand => {
    if (brand.models) {
      brand.models.forEach(model => {
        params.push({ merkSlug: `${brand.nameSlug}-autosleutel-bijmaken`, modelSlug: model.slug });
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
    return decodedBrand === `${base}-autosleutel-bijmaken` || decodedBrand === base;
  });
  
  const model = brand?.models?.find(m => m.slug.toLowerCase() === decodedModel);
  if (!brand || !model) return {};

  const title = {
    absolute: `${brand.name} ${model.name} Sleutel Bijmaken | Autosleutel24`,
  };
  const desc = `${brand.name} ${model.name} autosleutel bijmaken of programmeren. Autosleutel Specialist — bouwjaren ${model.years}. Mobiel aan huis, 24/7 bereikbaar. Goedkoper dan de dealer.`;

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
    return decodedBrand === `${base}-autosleutel-bijmaken` || decodedBrand === base;
  });

  const model = brand?.models?.find(m => m.slug.toLowerCase() === decodedModel);

  if (!brand || !model) notFound();

  const yearList = model.years.split(',').map(y => y.trim());

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${brand.name} ${model.name} Autosleutel Bijmaken`,
    provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel },
    description: `Gespecialiseerde autosleutel service voor de ${brand.name} ${model.name}. Ondersteunt bouwjaren ${model.years}.`,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Kan ik een nieuwe ${brand.name} ${model.name} autosleutel laten bijmaken zonder originele sleutel?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Ja, als u alle sleutels kwijt bent van uw ${brand.name} ${model.name} (All Keys Lost), komen wij direct met onze mobiele servicebus naar uw auto. Via specialistische OBD-diagnose uitleesapparatuur programmeren wij een nieuwe transpondersleutel of smart key ter plaatse in de ECU van uw auto.`
        }
      },
      {
        '@type': 'Question',
        name: `Wat kost het bijmaken van een ${brand.name} ${model.name} autosleutel?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Een standaard transpondersleutel voor de ${brand.name} ${model.name} is al beschikbaar vanaf € 149,-. Een luxe klapsleutel of afstandsbediening kost gemiddeld € 199,- en een Keyless Go / Smart Key € 299,-. Dit is tot 50% goedkoper dan bij de merkdealer en inclusief slijpen en programmeren.`
        }
      },
      {
        '@type': 'Question',
        name: `Hoe lang duurt het programmeren van een ${brand.name} ${model.name} sleutel?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Het slijpen van de sleutelbaard op onze CNC freesmachine en het inleren op het ${brand.system} beveiligingssysteem van uw ${brand.name} ${model.name} duurt gemiddeld 30 tot 45 minuten. U kunt hier gewoon op wachten.`
        }
      },
      {
        '@type': 'Question',
        name: `Krijg ik garantie op mijn nieuwe ${brand.name} ${model.name} sleutel?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Ja, u ontvangt altijd 12 maanden volledige schriftelijke garantie op zowel de elektronische chip, de afstandsbediening als het mechanische sleutelblad.`
        }
      }
    ]
  };

  return (
    <>
      <Script id={`model-schema-${merkSlug}-${modelSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`model-faq-${merkSlug}-${modelSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
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
              {`${brand.name} ${model.name} Autosleutel Bijmaken & Programmeren`} <br />
              <span style={{ color: 'var(--orange-500)', fontSize: '0.7em' }}>Autosleutel Specialist — Mobiel Ter Plaatse</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 780, lineHeight: 1.75, marginBottom: '1.5rem' }}>
              {`Is uw ${brand.name} ${model.name} autosleutel kwijt, gestolen of defect? Of wilt u direct een betrouwbare reservesleutel met afstandsbediening laten inleren? Wij programmeren en frezen nieuwe sleutels ter plaatse voor alle ${brand.name} ${model.name} bouwjaren tussen `}
              <strong>{yearList[0]} en {yearList[yearList.length - 1]}</strong>. Snel, vakkundig en tot 50% goedkoper dan de officiële merkdealer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`model-${merkSlug}-${modelSlug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', background:'#25d366', color:'#fff', padding:'0.85rem 2rem', borderRadius:'4px', fontWeight:700, textDecoration:'none', fontSize:'1rem' }} id={`model-${merkSlug}-${modelSlug}-wa`}>WhatsApp Direct</a>
            </div>
          </div>
        </section>

        {/* Deep Comprehensive SEO Content Section 1: Model Uitleg */}
        <section style={{ padding: '3.5rem 0', borderBottom: '1px solid var(--gray-200)' }}>
          <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--navy-900)', marginBottom: '1rem' }}>
              Alles over het Bijmaken en Inleren van een {brand.name} {model.name} Autosleutel
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--gray-700)', marginBottom: '1.2rem' }}>
              De <strong>{brand.name} {model.name}</strong> is een van de populairste modellen op de Nederlandse wegen. Afhankelijk van het bouwjaar ({model.years}) en de generatie ({model.generations || 'alle generaties'}) maakt dit model gebruik van het geavanceerde <strong>{brand.system}</strong> beveiligingssysteem. Dit houdt in dat elke sleutel is voorzien van een cryptografische transponderchip die continu communiceert met de startonderbreker (immobiliser) en de ECU van uw auto.
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--gray-700)', marginBottom: '1.5rem' }}>
              Wanneer u bij een officiële {brand.name} merkdealer een nieuwe sleutel voor uw {model.name} bestelt, bent u vaak weken aan het wachten op een fabriekssleutel en moet u bovendien uw auto wegslepen naar de garage. Bij <strong>Autosleutel24</strong> werken wij compleet anders: onze mobiele servicewagens zijn uitgerust met originele dealer-diagnoseapparatuur en uiterst nauwkeurige CNC laser-freesmachines. Wij komen naar uw locatie thuis, op uw werk of langs de snelweg en programmeren uw nieuwe sleutel direct in het geheugen van uw auto.
            </p>

            <h3 style={{ fontSize: '1.35rem', color: 'var(--navy-900)', marginTop: '2.5rem', marginBottom: '1rem' }}>
              Welke {brand.name} {model.name} Sleutels Kunnen Wij Bijmaken?
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: 'var(--navy-900)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>1. Klapsleutel met Afstandsbediening</h4>
                <p style={{ color: 'var(--gray-700)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  De meest gekozen sleutel voor de {brand.name} {model.name}. Inclusief centrale deurvergrendeling knoppen, ingebouwde transponderchip en nieuw geslepen sleutelbaard.
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: 'var(--navy-900)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>2. Smart Key / Keyless Go</h4>
                <p style={{ color: 'var(--gray-700)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Heeft uw {brand.name} {model.name} keyless entry of een startknop? Wij programmeren volwaardige smart keys die direct samenwerken met uw proximity antennes.
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: 'var(--navy-900)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>3. Reserve Transpondersleutel</h4>
                <p style={{ color: 'var(--gray-700)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Een degelijke mechanische reservesleutel met chip om de deuren te openen en de motor te starten, ideaal als extra noodsleutel zonder afstandsbediening.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Years Grid for SEO */}
        <section style={{ padding: '3.5rem 0', background: 'var(--gray-50)' }}>
          <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2>Ondersteunde Bouwjaren {brand.name} {model.name}</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)' }}>
              Onze software ondersteunt feilloos alle bouwjaren en generaties van de {brand.name} {model.name}. Klik op uw bouwjaar of neem direct contact op:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 100px), 1fr))', gap: '0.6rem' }}>
              {yearList.map(year => (
                <div key={year} style={{ padding: '0.75rem', background: '#fff', border: '1px solid var(--gray-300)', borderRadius: '6px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-900)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  {year}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Table Section */}
        <section style={{ padding: '3.5rem 0' }}>
          <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
              Kostenoverzicht {brand.name} {model.name} Sleutel Bijmaken
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--gray-700)', marginBottom: '2rem' }}>
              Dankzij onze efficiënte mobiele werkwijze betaalt u nooit te veel. Hieronder vindt u onze richtprijzen voor de {brand.name} {model.name} vergeleken met de officiële merkdealer:
            </p>

            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'var(--navy-900)', color: '#fff' }}>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>Sleuteltype / Dienst {brand.name} {model.name}</th>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>Specificaties</th>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>Onze Prijs</th>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>Dealer Prijs</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)', background: '#fff' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>Standaard transpondersleutel</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-600)' }}>Sleutelblad frezen + startonderbreker chip inleren</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--orange-600)' }}>Vanaf € 149,-</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-500)' }}>€ 220,- +</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>Klapsleutel met afstandsbediening</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-600)' }}>Originele kwaliteit incl. centrale deurvergrendeling</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--orange-600)' }}>Vanaf € 199,-</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-500)' }}>€ 340,- +</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)', background: '#fff' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>Smart Key / Keyless Go sleutel</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-600)' }}>Volledig geprogrammeerd op comfortmodule & ECU</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--orange-600)' }}>Vanaf € 299,-</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-500)' }}>€ 480,- +</td>
                  </tr>
                  <tr style={{ background: 'var(--gray-50)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>Alle sleutels kwijt (All Keys Lost)</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-600)' }}>Schadevrij openen + sleutel frezen op locatie</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--orange-600)' }}>Op aanvraag</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-500)' }}>€ 800,-+ incl. slepen</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Technical Info & Procedure */}
        <section style={{ padding: '3.5rem 0', background: 'var(--gray-50)' }}>
          <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '3rem', alignItems: 'start' }}>
              <div>
                <h2>Stappenplan: Hoe Werkt Onze {brand.name} {model.name} Sleutelservice?</h2>
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  Wij maken het gehele proces voor uw {brand.name} {model.name} zo eenvoudig en snel mogelijk:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <strong style={{ color: 'var(--navy-900)', fontSize: '1.05rem', display: 'block' }}>1. Direct Contact & Kenteken Check</strong>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.95rem' }}>U geeft uw kenteken of bouwjaar door via telefoon of WhatsApp. Wij controleren direct welk transpondertype uw {model.name} nodig heeft.</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--navy-900)', fontSize: '1.05rem', display: 'block' }}>2. Monteur op Locatie</strong>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.95rem' }}>Onze gecertificeerde autoslotenmaker komt naar uw locatie toe, waar in Nederland u zich ook bevindt.</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--navy-900)', fontSize: '1.05rem', display: 'block' }}>3. CNC Slijpen & OBD Programmeren</strong>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.95rem' }}>De sleutelbaard wordt met laserprecisie geslepen en de chip wordt versleuteld ingeleerd via de OBD2-diagnosepoort.</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--navy-900)', fontSize: '1.05rem', display: 'block' }}>4. Testen & 12 Maanden Garantie</strong>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.95rem' }}>Samen controleren we alle portieren en de startmotor. U betaalt pas als alles perfect werkt.</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid var(--gray-200)' }}>
                <h3>Waarom Kiezen Voor Autosleutel24?</h3>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <li>✅ <strong>Geen Sleepkosten</strong>: Wij komen rechtstreeks naar uw {brand.name} {model.name} toe.</li>
                  <li>✅ <strong>Klaar Terwijl U Wacht</strong>: Binnen 30 tot 45 minuten weer veilig op weg.</li>
                  <li>✅ <strong>Originele Dealer Kwaliteit</strong>: Hoogwaardige transponderchips en sleutelbehuizingen.</li>
                  <li>✅ <strong>12 Maanden Garantie</strong>: Schriftelijke garantie op al onze geleverde sleutels.</li>
                  <li>✅ <strong>24/7 Mobiel Bereikbaar</strong>: Ook &apos;s avonds, in het weekend en bij spoedgevallen.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Interactive FAQ Accordions */}
        <section style={{ padding: '3.5rem 0' }}>
          <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--navy-900)', marginBottom: '1.5rem' }}>
              Veelgestelde Vragen over {brand.name} {model.name} Sleutel Bijmaken
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <details style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '1.2rem' }}>
                <summary style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy-900)', cursor: 'pointer' }}>
                  Kan ik een nieuwe {brand.name} {model.name} autosleutel laten bijmaken zonder originele sleutel?
                </summary>
                <p style={{ marginTop: '0.8rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>
                  Ja, als u alle sleutels kwijt bent van uw {brand.name} {model.name} (All Keys Lost), komen wij direct met onze mobiele servicebus naar uw auto. Via specialistische OBD-diagnose uitleesapparatuur programmeren wij een nieuwe transpondersleutel of smart key ter plaatse in de ECU van uw auto.
                </p>
              </details>
              <details style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '1.2rem' }}>
                <summary style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy-900)', cursor: 'pointer' }}>
                  Wat kost het bijmaken van een {brand.name} {model.name} autosleutel?
                </summary>
                <p style={{ marginTop: '0.8rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>
                  Een standaard transpondersleutel voor de {brand.name} {model.name} is al beschikbaar vanaf € 149,-. Een luxe klapsleutel of afstandsbediening kost gemiddeld € 199,- en een Keyless Go / Smart Key € 299,-. Dit is tot 50% goedkoper dan bij de merkdealer en inclusief slijpen en programmeren.
                </p>
              </details>
              <details style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '1.2rem' }}>
                <summary style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy-900)', cursor: 'pointer' }}>
                  Hoe lang duurt het programmeren van een {brand.name} {model.name} sleutel?
                </summary>
                <p style={{ marginTop: '0.8rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>
                  Het slijpen van de sleutelbaard op onze CNC freesmachine en het inleren op het {brand.system} beveiligingssysteem van uw {brand.name} {model.name} duurt gemiddeld 30 tot 45 minuten. U kunt hier gewoon op wachten.
                </p>
              </details>
              <details style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '1.2rem' }}>
                <summary style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy-900)', cursor: 'pointer' }}>
                  Krijg ik garantie op mijn nieuwe {brand.name} {model.name} sleutel?
                </summary>
                <p style={{ marginTop: '0.8rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>
                  Ja, u ontvangt altijd 12 maanden volledige schriftelijke garantie op zowel de elektronische chip, de afstandsbediening als het mechanische sleutelblad.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* Internal Linking Network Section */}
        <section style={{ padding: '3.5rem 0', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)' }}>
          <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--navy-900)', marginBottom: '1.75rem' }}>
              Gerelateerde {brand.name} &amp; Autosleutel Services
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '2.5rem' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Andere {brand.name} Modellen
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {brand.models?.filter(m => m.slug !== model.slug).map(m => (
                    <Link key={m.slug} href={`/merken/${merkSlug}/${m.slug}`} style={{ fontSize: '0.9rem', color: 'var(--navy-700)', textDecoration: 'none', fontWeight: 500 }}>
                      {`${brand.name} ${m.name} Sleutel Bijmaken →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {brand.name} Service in Populaire Steden
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {CITIES.slice(0, 16).map(c => (
                    <Link key={c.slug} href={`/steden/${c.slug}/${brand.nameSlug}-autosleutel-bijmaken`} style={{ fontSize: '0.9rem', color: 'var(--navy-700)', textDecoration: 'none', fontWeight: 500 }}>
                      {`${brand.name} Bijmaken ${c.city} →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Overige Automerken
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {BRANDS.filter(b => b.slug !== brand.slug).slice(0, 14).map(b => (
                    <Link key={b.slug} href={`/merken/${b.nameSlug}-autosleutel-bijmaken`} style={{ fontSize: '0.9rem', color: 'var(--navy-700)', textDecoration: 'none', fontWeight: 500 }}>
                      {`${b.name} Autosleutel Bijmaken →`}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background:'var(--navy-900)', padding:'4rem 2rem', textAlign:'center' }}>
          <h2 style={{ color:'#fff', marginBottom:'0.5rem' }}>Direct een nieuwe sleutel voor uw {brand.name} {model.name}?</h2>
          <p style={{ color:'rgba(255,255,255,0.75)', marginBottom:'2.5rem', maxWidth: 650, margin: '0 auto 2.5rem' }}>
            Onze mobiele werkplaats is volledig uitgerust voor alle {brand.name} {model.name} bouwjaren. Bel direct voor een vaste prijs vooraf.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`model-bottom-${merkSlug}-${modelSlug}-phone`}>{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wa-btn" style={{ background:'#25d366', color:'#fff', padding:'1rem 2.5rem', borderRadius:'6px', fontWeight:700, textDecoration:'none', fontSize:'1.1rem' }} id={`model-bottom-${merkSlug}-${modelSlug}-wa`}>WhatsApp Direct</a>
          </div>
        </section>
      </main>
    </>
  );
}
