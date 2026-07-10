import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '@/config/brands';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Kwijt? | 24/7 Mobiele Service | Autosleutel24',
  },
  description: `Autosleutel kwijt? Wij helpen direct. Nieuwe sleutel programmeren aan huis. Alle merken. 24/7. Bel: ${SITE_CONFIG.phone}`,
  keywords: ['autosleutel kwijt','alle sleutels kwijt auto','auto autosleutel kwijt wat te doen','nieuwe autosleutel laten maken','autosleutel kwijt autoslotenmaker'],
  alternates: {
    canonical: `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/autosleutel-kwijt`,
      'x-default': `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    },
  },
};

const faqItems = [
  { q: 'Autosleutel kwijt, wat te doen?', a: 'Wanneer u uw autosleutel kwijt bent, controleer dan eerst of u de auto met een reserve-sleutel kunt openen. Is er geen reserve-sleutel beschikbaar? Neem dan direct contact op met Autosleutel24. Onze mobiele monteurs komen direct naar u toe, openen de auto 100% schadevrij, en maken ter plekke een nieuwe autosleutel met afstandsbediening klaar.' },
  { q: 'Wat te doen als je autosleutel is kwijt?', a: 'Als uw autosleutel kwijt is, dient u uw auto op een veilige plek te laten staan. Neem contact op met een mobiele autoslotenmaker zoals Autosleutel24 om de verloren sleutel uit de computer van de auto te laten wissen. Dit voorkomt dat onbevoegden met de gevonden sleutel uw auto kunnen stelen.' },
  { q: 'Autosleutel verloren, welke diensten bieden vervanging aan?', a: 'Bij het verliezen van een autosleutel bieden de merkdealer en een gespecialiseerde mobiele autoslotenmaker (zoals Autosleutel24) vervanging aan. Waar u bij de dealer de auto moet laten wegslepen en vaak dagen moet wachten op de sleutel, regelt Autosleutel24 de vervanging direct ter plaatse op locatie in heel Nederland binnen één dag.' },
  { q: 'Stappenplan autosleutel verloren?', a: 'Volg dit stappenplan bij het verliezen van een autosleutel: 1. Controleer of de auto op slot zit en veilig geparkeerd staat. 2. Verzamel de autogegevens (merk, model, bouwjaar, kenteken). 3. Neem contact op met Autosleutel24 via telefoon of WhatsApp. 4. De monteur komt naar u toe, opent de auto schadevrij en leest de startonderbreker uit. 5. De verloren sleutel wordt geblokkeerd en de nieuwe sleutel wordt ingeleerd.' },
  { q: 'Hoe snel kan een autosleutel worden bijgemaakt?', a: 'Bij Autosleutel24 kan een nieuwe autosleutel meestal binnen 30 tot 60 minuten ter plekke worden bijgemaakt en geprogrammeerd. U hoeft dus niet dagen te wachten zoals bij de officiële merkdealer.' },
  { q: 'Kosten nieuwe autosleutel laten maken?', a: 'De kosten voor het laten maken van een nieuwe autosleutel variëren gemiddeld van €95 tot €250, afhankelijk van het automerk, bouwjaar en of het een transpondersleutel, klapsleutel of smart key betreft. Autosleutel24 biedt deze service tot wel 60% goedkoper aan dan de dealer.' },
  { q: 'Waar vind ik een autosleutelmaker in mijn buurt?', a: 'U vindt een mobiele autosleutelmaker in uw buurt bij Autosleutel24. Wij rijden door heel Nederland, waaronder Utrecht, Amsterdam, Rotterdam, Den Haag, Almere, Amersfoort en omliggende regio\'s. Onze monteurs komen rechtstreeks naar uw locatie toe.' },
  { q: 'Waar kan ik een autosleutel laten bijmaken?', a: 'U kunt een autosleutel laten bijmaken bij een gespecialiseerde mobiele slotenmaker (zoals Autosleutel24) of bij de merkdealer. Een mobiele sleutelmaker is de meest comfortabele optie, omdat de sleutel direct bij uw huis of werklocatie wordt ingeleerd.' },
  { q: 'Kosten voor het bijmaken van een autosleutel zonder reserve?', a: 'Als u al uw autosleutels kwijt bent en geen reserve-sleutel heeft, starten de kosten bij Autosleutel24 vanaf €190. De slotenmaker moet in dit geval eerst het deurslot decoderen en de startonderbreker (EEPROM/OBD) programmeren.' },
  { q: 'Spoedservice voor verloren autosleutel?', a: 'Ja, Autosleutel24 biedt een 24/7 spoedservice voor verloren autosleutels. Bij spoedgevallen of wanneer u buitengesloten staat, streven onze monteurs ernaar om binnen 30 tot 45 minuten bij u ter plaatse te zijn.' },
  { q: 'Kan een autosleutel met afstandsbediening zonder originele sleutel worden gemaakt?', a: 'Ja, dat is mogelijk. Onze specialisten kunnen de unieke mechanische insnijding bepalen door de cilinder van de autodeur te decoderen. De transponder en de afstandsbediening programmeren we vervolgens rechtstreeks via de OBD2-diagnosepoort in de boordcomputer.' },
  { q: 'Auto openen zonder sleutel door professional?', a: 'Ja, Autosleutel24 opent uw auto 100% schadevrij zonder sleutel. Wij gebruiken professionele Lishi-decoders om de slotcilinder mechanisch te openen, waardoor de deuren, lak en lakrubbers volledig onbeschadigd blijven.' },
  { q: 'Autosleutel kwijt, kan de dealer een nieuwe maken?', a: 'Ja, de dealer kan een nieuwe maken, maar dit vereist dat u de auto op eigen kosten naar de dealer laat slepen. Daarnaast moet u vaak 3 tot 10 werkdagen wachten totdat de sleutel uit de fabriek geleverd en ingeleerd is.' },
  { q: 'Vervangende autosleutel bestellen online?', a: 'U kunt online een sleutelbehuizing bestellen, maar een werkende transpondersleutel met elektronica kan niet simpelweg online besteld worden. De sleutel moet namelijk fysiek in de auto worden geprogrammeerd met professionele OBD-apparatuur om te kunnen starten.' },
  { q: 'Hoe werkt autosleutel programmeren na verlies?', a: 'Bij het programmeren sluit de monteur een programmeercomputer aan op de OBD-poort van de auto. Hiermee worden de oude sleutelcodes uit de startonderbreker (immobilizer) gewist en worden de transponderchip en de afstandsbediening van de nieuwe sleutel gekoppeld.' },
  { q: 'Hoe lang duurt het om een nieuwe autosleutel te krijgen?', a: 'Bij de dealer duurt dit meestal 3 tot 10 werkdagen. Bij Autosleutel24 krijgt u uw nieuwe autosleutel dezelfde dag nog. Binnen 45 tot 60 minuten nadat de monteur op uw locatie is gearriveerd, kunt u weer rijden.' },
  { q: 'Is autosleutel kwijt gedekt door verzekering?', a: 'Ja, bij een WA+ (beperkt casco) of All-Risk verzekering is het verlies of diefstal van autosleutels vaak gedekt. U ontvangt van Autosleutel24 een officiële, gespecificeerde factuur die u rechtstreeks bij uw verzekeraar kunt indienen.' },
  { q: 'Welke bedrijven bieden 24/7 autosleutelservice?', a: 'Autosleutel24 biedt een 24/7 mobiele autosleutelservice in heel Nederland. U kunt ons dag en nacht telefonisch of via WhatsApp bereiken voor directe hulp bij buitensluiting of sleutelverlies.' },
  { q: 'Wat zijn de opties bij alle autosleutels kwijt?', a: 'Als u alle autosleutels kwijt bent, zijn er twee opties: 1. De auto naar de dealer laten slepen voor een duur en langdurig traject. 2. Autosleutel24 inschakelen. Wij komen naar u toe, openen de auto, slijpen een nieuwe sleutelbaard en programmeren de transponder ter plekke.' },
  { q: 'Hoe vind ik een goedkope autosleutelmaker?', a: 'U vindt een goedkope autosleutelmaker door te kiezen voor een onafhankelijke mobiele autosleutelspecialist zoals Autosleutel24. Wij hanteren vaste tarieven vooraf en zijn tot wel 60% goedkoper dan de officiële merkdealer omdat we geen sleepkosten en dure dealer-overhead doorberekenen.' },
  { q: 'Advies bij verlies van autosleutel met startonderbreker?', a: 'Bij verlies van een sleutel met startonderbreker is het belangrijk om de verloren sleutel direct uit de autocomputer te laten programmeren. Onze monteurs kunnen dit direct op locatie voor u doen, zodat de verloren sleutel de auto niet meer kan starten.' },
  { q: 'Kan ik een autosleutel online bestellen en laten programmeren?', a: 'Ja, u kunt online een universele sleutel kopen, maar veel onafhankelijke sleutelmakers kunnen deze niet programmeren vanwege compatibiliteitsproblemen met de transponderchips. Het is veiliger en sneller om direct een complete sleutel inclusief programmering bij Autosleutel24 af te nemen.' },
  { q: 'Autosleutel laten programmeren na verlies?', a: 'Autosleutel laten programmeren na verlies gebeurt direct op uw locatie. De monteur genereert een nieuwe transpondercode, schrijft deze via OBD2-diagnose-apparatuur in het geheugen van de startonderbreker, en synchroniseert de afstandsbediening.' },
  { q: 'Autosleutel kwijt, wat kost het vervangen door een universele sleutel?', a: 'Het vervangen van uw verloren sleutel door een universele OEM-kwaliteit sleutel kost bij Autosleutel24 gemiddeld tussen de €95 en €175, inclusief het slijpen van de sleutelbaard en het programmeren van de transponder. Dit is de meest voordelige en snelle oplossing.' }
];

const steps = [
  { n:'1', title:'Controleer grondig', desc:'Check jaszakken, tassen, thuis, werk. Check of u een reserve sleutel heeft.' },
  { n:'2', title:'Bel uw verzekeraar', desc:'Check uw polis — veel All Risk verzekeringen dekken sleutelverlies. Wij geven een verzekeringsklare factuur.' },
  { n:'3', title:'Bel ons direct', desc:`Wij zijn 24/7 bereikbaar. Geef uw automerk, model en locatie door. Wij geven direct een vaste prijs.` },
  { n:'4', title:'Wij komen naar u toe', desc:'Onze uitgeruste bus rijdt naar uw locatie. Gemiddeld 30–60 minuten. Geen sleepkosten.' },
  { n:'5', title:'Nieuwe sleutel klaar', desc:'Wij programmeren de nieuwe sleutel ter plaatse. Oud gestolen sleutel wordt uitgeschakeld. U rijdt weg.' },
];

const brandPrices = BRANDS.filter(b => b.priority === 'P1').slice(0, 8);

const schema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqItems.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Autosleutel Kwijt', item: `${SITE_CONFIG.domain}/autosleutel-kwijt` },
  ],
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Wat te doen als u uw autosleutel kwijt bent',
  description: 'Volg dit 5-stappenplan om direct hulp te krijgen bij verloren of gestolen autosleutels.',
  step: steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.desc,
  })),
};

export default function AutosleutelKwijt() {
  return (
    <>
      <Script id="akl-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id="akl-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="akl-howto-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <main>
        {/* EMERGENCY HERO — CTA absolute top priority */}
        <section style={{ background:'var(--color-danger)', padding:'2rem', textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'0.875rem', fontWeight:600, margin:'0 0 0.5rem' }}>
            NOODGEVAL — DIRECTE HULP BESCHIKBAAR
          </p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} id="akl-emergency-phone"
            style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'#fff', color:'var(--color-danger)', padding:'1rem 2.5rem', borderRadius:'4px', fontWeight:700, fontSize:'1.3rem', textDecoration:'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            Bel Nu: {SITE_CONFIG.phone}
          </a>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.875rem', marginTop:'0.75rem', marginBottom:0 }}>
            Gemiddeld {SITE_CONFIG.responseTime} · 24/7 · Alle merken
          </p>
        </section>

        {/* Hero */}
        <section style={{ background:'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding:'3rem 2rem' }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <h1 style={{ color:'#fff', fontSize:'clamp(1.6rem, 3.5vw, 2.4rem)', marginBottom:'1rem' }}>
              Autosleutel Kwijt? Direct Hulp — 24/7 Mobiele Service
            </h1>
            <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'1rem', lineHeight:1.7, marginBottom:'1.5rem', maxWidth:680 }}>
              Autosleutel kwijt? Wij programmeren een nieuwe sleutel ter plaatse — thuis, op het werk, of langs de weg.
              Alle merken. Gestolen sleutel wordt uitgeschakeld. Verzekeringsklare factuur.
            </p>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id="akl-hero-phone">{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', background:'#25d366', color:'#fff', padding:'0.85rem 1.5rem', borderRadius:'4px', fontWeight:700, textDecoration:'none', fontSize:'1rem' }} id="akl-hero-wa">WhatsApp</a>
            </div>
          </div>
        </section>

        {/* 5 steps HowTo */}
        <section style={{ padding:'3.5rem 0' }}>
          <div className="container">
            <h2>Wat Te Doen Als Je Autosleutel Kwijt Is (5 Stappen)</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap:'1rem', marginTop:'1.5rem' }}>
              {steps.map(s => (
                <div key={s.n} style={{ display:'flex', gap:'1rem', padding:'1.25rem', background:'#fff', border:'1px solid var(--gray-200)', borderRadius:'6px', alignItems:'flex-start' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:s.n==='3'?'var(--color-danger)':'var(--navy-800)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0 }}>{s.n}</div>
                  <div>
                    <strong style={{ display:'block', fontSize:'0.95rem', marginBottom:'0.25rem', color:'var(--gray-900)' }}>{s.title}</strong>
                    <span style={{ fontSize:'0.85rem', color:'var(--gray-500)', lineHeight:1.55 }}>{s.desc}</span>
                    {s.n === '3' && (
                      <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display:'inline-block', marginTop:'0.5rem', background:'var(--color-danger)', color:'#fff', padding:'0.4rem 0.875rem', borderRadius:'3px', fontWeight:700, fontSize:'0.85rem', textDecoration:'none' }} id="akl-step3-phone">
                        Bel Nu: {SITE_CONFIG.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing by brand */}
        <section style={{ padding:'3.5rem 0', background:'var(--gray-50)' }}>
          <div className="container">
            <h2>Kosten Nieuwe Sleutel Per Merk</h2>
            <p>Indicatieve prijzen. Exacte prijs na telefonische diagnose. Altijd vaste prijs vóór aanvang.</p>
            <div style={{ overflowX:'auto', borderRadius:'6px', overflow:'hidden', boxShadow:'var(--shadow-md)', marginTop:'1.5rem' }}>
              <table className="price-table">
                <thead><tr><th>Merk</th><th>Systeem</th><th>AKL Startprijs</th><th>Dealer Schatting</th></tr></thead>
                <tbody>
                  {brandPrices.map(b => (
                    <tr key={b.slug}>
                      <td><Link href={`/merken/${b.nameSlug}-autosleutel-bijmaken`} style={{ fontWeight:600, color:'var(--navy-600)' }}>{b.name}</Link></td>
                      <td style={{ fontSize:'0.82rem', color:'var(--gray-400)' }}>{b.system.split('/')[0]}</td>
                      <td className="price-col">Bel voor prijs</td>
                      <td style={{ color:'var(--gray-400)', fontSize:'0.85rem' }}>+40–60%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding:'3.5rem 0' }}>
          <div className="container" style={{ maxWidth:900 }}>
            <h2>Veelgestelde Vragen — Autosleutel Kwijt</h2>
            {faqItems.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">
                  {f.q}
                  <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <p className="faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom emergency CTA */}
        <section style={{ background:'var(--color-danger)', padding:'3rem 2rem', textAlign:'center' }}>
          <h2 style={{ color:'#fff', marginBottom:'0.5rem' }}>Autosleutel Kwijt? Bel Direct</h2>
          <p style={{ color:'rgba(255,255,255,0.8)', marginBottom:'1.5rem' }}>Wij zijn 24/7 bereikbaar. Gemiddeld {SITE_CONFIG.responseTime} bij u ter plaatse.</p>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background:'#fff', color:'var(--color-danger)', padding:'1rem 2.5rem', borderRadius:'4px', fontWeight:700, fontSize:'1.1rem', textDecoration:'none', display:'inline-flex', alignItems:'center' }} id="akl-bottom-phone">
              {SITE_CONFIG.phone}
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ background:'#25d366', color:'#fff', padding:'1rem 2rem', borderRadius:'4px', fontWeight:700, fontSize:'1rem', textDecoration:'none', display:'inline-flex', alignItems:'center' }} id="akl-bottom-wa">
              WhatsApp
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
