import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Prijzen Autosleutel Bijmaken & Programmeren | Autosleutel24',
  },
  description: 'Indicatieve prijzen voor autosleutel bijmaken en programmeren. Exacte prijs altijd vooraf afgesproken. Bespaar 30–50% vs dealer. Bel voor offerte.',
  alternates: {
    canonical: `${SITE_CONFIG.domain}/prijzen`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/prijzen`,
      'x-default': `${SITE_CONFIG.domain}/prijzen`,
    },
  },
};

type PriceItem = 
  | { category: string; service?: never; from?: never; to?: never; note?: never }
  | { category?: never; service: string; from: string; to: string; note: string };

const priceRows: PriceItem[] = [
  { category: 'Autosleutel Bijmaken (Reserve)' },
  { service: 'Standaard transpondersleutel', from: '€ 80', to: '€ 175', note: 'Meeste oudere modellen' },
  { service: 'Klap-/flipsleutel met afstandsbediening', from: '€ 250', to: '€ 349', note: 'VW, Audi, Seat, Skoda, Ford' },
  { service: 'Smart key / Keyless entry', from: '€ 249', to: '€ 399', note: 'BMW, Mercedes, Toyota, Mazda' },
  { service: 'Proximity key met start-stop', from: '€ 299', to: '€ 449', note: 'Premium merken' },
  
  { category: 'Autosleutel Kwijt (Alle sleutels verloren)' },
  { service: 'Standaard transpondersleutel', from: '€ 250', to: '€ 349', note: 'Inclusief programmeren' },
  { service: 'Klap-/flipsleutel met afstandsbediening', from: '€ 249', to: '€ 349', note: 'Inclusief code uitlezen' },
  { service: 'Smart key / Keyless entry', from: '€ 349', to: '€ 499', note: 'Inclusief noodprocedure' },
  { service: 'Proximity key met start-stop', from: '€ 399', to: '€ 549', note: 'Premium systemen' },
  
  { category: 'Auto Openen (Buitengesloten)' },
  { service: 'Standaard auto openen', from: '€ 150', to: '€ 200', note: 'Schadevrij, 5-15 minuten' },
  { service: 'Auto openen + sleutel maken', from: '€ 199', to: '€ 349', note: 'Combinatiekorting' },
  { service: 'Noodopening (keyless systeem)', from: '€ 175', to: '€ 250', note: 'Speciale techniek vereist' },
  
  { category: 'Reparatie & Onderhoud (Sleutel kapot)' },
  { service: 'Behuizing vervangen', from: '€ 45', to: '€ 89', note: 'Nieuw ombouw-setje' },
  { service: 'Batterij vervangen', from: '€ 15', to: '€ 35', note: 'Inclusief test' },
  { service: 'Afstandsbediening herprogrammeren', from: '€ 49', to: '€ 99', note: 'Werkt niet meer' },
  { service: 'Transponder chip vervangen', from: '€ 89', to: '€ 149', note: 'Chip defect' },
  
  { category: 'Contactslot & Stuurslot (Mechanische problemen)' },
  { service: 'Contactslot vervangen (standaard)', from: '€ 249', to: '€ 399', note: 'VW, Audi, Seat, Skoda' },
  { service: 'Contactslot vervangen (premium)', from: '€ 399', to: '€ 599', note: 'Mercedes, BMW' },
  { service: 'Stuurslot reparatie/vervanging', from: '€ 199', to: '€ 349', note: 'ELV/ESL systemen' },
  { service: 'Immobilizer reset', from: '€ 149', to: '€ 299', note: 'Software herstel' }
];

const surcharges = [
  { time: 'Ma t/m Vr  08:00 – 16:00', label: 'Standaard tarief', color: 'var(--color-success)' },
  { time: 'Ma t/m Vr  16:00 – 22:00', label: '+15% avondtoeslag', color: 'var(--orange-500)' },
  { time: 'Ma t/m Vr  22:00 – 08:00', label: '+25% nachttoeslag', color: 'var(--color-danger)' },
  { time: 'Zaterdag  08:00 – 22:00',  label: '+15% weekendtoeslag', color: 'var(--orange-500)' },
  { time: 'Zondag & feestdagen',       label: '+25% toeslag',       color: 'var(--color-danger)' },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Prijzen', item: `${SITE_CONFIG.domain}/prijzen` },
  ],
};

export default function PrijzenPage() {
  return (
    <>
      <Script id="prijzen-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.label}>TARIEVEN</p>
          <h1>Prijsoverzicht — Indicatieve Tarieven</h1>
          <p className={styles.heroSub}>
            Exacte prijs wordt altijd <strong>vóór aanvang</strong> van de werkzaamheden afgesproken. Geen verrassingen achteraf.
            Bespaar gemiddeld 30–50% ten opzichte van de dealer.
          </p>
          <div className={styles.heroCtas}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="prijzen-hero-phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
              Bel voor Exacte Prijs
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="prijzen-hero-wa">WhatsApp Offerte</a>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 2rem', maxWidth: 1000, margin: '0 auto' }}>

        {/* Important disclaimer */}
        <div className={styles.disclaimer}>
          <div className={styles.disclaimerIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <strong>Belangrijke informatie over onze tarieven</strong>
            <ul className={styles.disclaimerList}>
              <li>Onderstaande prijzen zijn <strong>indicatieve startprijzen</strong> — de exacte prijs hangt af van uw merk, model, bouwjaar en type sleutelsysteem.</li>
              <li>Tarieven gelden voor <strong>maandag t/m vrijdag 08:00–16:00</strong>. Buiten deze tijden gelden toeslagen (zie tabel hieronder).</li>
              <li>Alle prijzen zijn exclusief btw.</li>
              <li>De definitieve prijs wordt <strong>altijd vooraf telefonisch afgesproken</strong> — nooit verrassingen achteraf.</li>
            </ul>
          </div>
        </div>

        {/* Main price table */}
        <h2 className={styles.tableTitle}>Indicatieve Prijslijst</h2>
        <div className={styles.tableWrap}>
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th>Dienst</th>
                <th>Vanaf</th>
                <th>Tot</th>
                <th className={styles.noteCol}>Toelichting</th>
              </tr>
            </thead>
            <tbody>
              {priceRows.map((row, i) => (
                row.category ? (
                  <tr key={i} className={styles.categoryRow}>
                    <td colSpan={4}><strong>{row.category}</strong></td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td className={styles.serviceCell}>{row.service}</td>
                    <td className={styles.priceCell}>{row.from}</td>
                    <td className={styles.priceCell}>{row.to}</td>
                    <td className={styles.noteCell}>{row.note}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.tableNote}>* Prijzen zijn exclusief btw en gelden voor diensten binnen Nederland. Exacte prijs na telefonische diagnose.</p>

        {/* Surcharge table */}
        <h2 className={styles.tableTitle} style={{ marginTop: '3rem' }}>Toeslagen buiten kantoortijden</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Wij zijn 24/7 beschikbaar. Buiten de standaard werktijden geldt een toeslag op het basistarief.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th>Tijdstip</th>
                <th>Toeslag</th>
              </tr>
            </thead>
            <tbody>
              {surcharges.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.88rem' }}>{s.time}</td>
                  <td style={{ fontWeight: 700, color: s.color }}>{s.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trust Gallery: Onze Mobiele Werkplaats & Apparatuur */}
        <div className={styles.trustSection}>
          <h2 className={styles.tableTitle}>Onze Mobiele Werkplaats &amp; Apparatuur in Utrecht &amp; Amsterdam</h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Wij werken uitsluitend met gecertificeerde diagnose- en programmeerapparatuur. Onze mobiele servicebussen zijn volledig uitgerust om transpondersleutels, smart keys en contactsloten ter plaatse in Utrecht, Amsterdam en heel Midden-Nederland 100% schadevrij te programmeren.
          </p>
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/images/seo/autosleutel_reparatie_utrecht_amsterdam_mobiel.webp"
                  alt="Monteur repareert de behuizing van een autosleutel op locatie"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className={styles.trustImg}
                />
              </div>
              <div className={styles.trustContent}>
                <h3 className={styles.trustTitle}>Mobiele Sleutelreparatie Ter Plaats</h3>
                <p className={styles.trustDesc}>Directe reparatie van defecte sleutelbehuizingen, transponders en printplaten op locatie in Utrecht en Amsterdam.</p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/images/seo/autosleutel_programmeren_op_locatie_utrecht_amsterdam.webp"
                  alt="Programmeren en inleren van een nieuwe autosleutel in een mobiele servicebus"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className={styles.trustImgTop}
                />
              </div>
              <div className={styles.trustContent}>
                <h3 className={styles.trustTitle}>Programmeren Op Locatie</h3>
                <p className={styles.trustDesc}>Inleren van transpondersleutels en smart keys ter plaatse zonder uw voertuig naar de dealer te hoeven wegslepen.</p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/images/seo/autosleutel_voorraad_alle_merken_utrecht_amsterdam.webp"
                  alt="Voorraad van originele autosleutels en transponders voor diverse automerken"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className={styles.trustImg}
                />
              </div>
              <div className={styles.trustContent}>
                <h3 className={styles.trustTitle}>Originele Voorraad Alle Merken</h3>
                <p className={styles.trustDesc}>Uitgebreide voorraad OEM-sleutels, smart keys en transponderchips voor direct gebruik bij sleutelverlies.</p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustImgWrap}>
                <Image
                  src="/images/seo/professionele_diagnose_apparatuur_utrecht_amsterdam.webp"
                  alt="Professionele diagnose apparatuur (Autel IM608 Pro) voor autosleutel programmering"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className={styles.trustImg}
                />
              </div>
              <div className={styles.trustContent}>
                <h3 className={styles.trustTitle}>Dealer-Niveau Apparatuur</h3>
                <p className={styles.trustDesc}>Geavanceerde diagnoseapparatuur voor veilige toegang tot ECU, CAS, FEM, MQB en EIS systemen.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why cheaper */}
        <div className={styles.whyCard}>
          <h2>Waarom Goedkoper dan de Dealer?</h2>
          <div className={styles.whyGrid}>
            {[
              { title: 'Geen showroomkosten', desc: 'Wij rijden naar u toe — geen huur, geen overheadkosten.' },
              { title: 'Dezelfde tools', desc: 'Autel IM608 Pro II, AVDI, VVDI — dealer-niveau apparatuur.' },
              { title: 'Geen wachttijd', desc: 'Geen 1–2 weken wachten op een dealerfactory sleutel.' },
              { title: 'Vaste prijs vooraf', desc: 'U weet de prijs vóór wij beginnen. Nooit een verrassing.' },
            ].map(item => (
              <div key={item.title} className={styles.whyItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COMPREHENSIVE PRIJZEN SEO GUIDE ARTICLE ── */}
        <div className="seo-article-block" style={{ marginTop: '3.5rem', marginBottom: '3.5rem' }}>
          <h2>Transparante Tarieven voor Autosleutels en Slotenmaker Service op Locatie</h2>
          <p>
            Bij het bijmaken of vervangen van een autosleutel spelen verschillende technische factoren een rol in de prijsopbouw. Waar een eenvoudige reservesleutel zonder afstandsbediening relatief goedkoop is, vereist een moderne Keyless Entry of Keyless Go sleutel (smart key) geavanceerde elektronica en gecertificeerde programmeersoftware. <strong>{SITE_CONFIG.name}</strong> garandeert u altijd vooraf een vaste en transparante all-in prijs, zodat u nooit wordt geconfronteerd met onverwachte kosten.
          </p>
          <h3>Waarom zijn wij 30% tot 50% goedkoper dan de officiële merkdealer?</h3>
          <p>
            Officiële merkdealers berekenen vaak hoge uurtarieven, logistieke bestel- en administratiekosten én verplichte takel- of wegsleepkosten naar hun showroom. Onze gecertificeerde mobiele slotenmakers komen met een compleet uitgeruste servicebus direct naar uw voertuig toe. Wij snijden de sleutelbaard met CNC-gestuurde snijmachines ter plaatse en leren de transponderchip in via de OBD2-diagnosepoort.
          </p>
          <h3>Verschil in Prijs tussen Mechanische Sleutels, Klapsleutels en Smart Keys</h3>
          <p>
            Een mechanische reservesleutel met transponderchip start uw auto en opent uw deuren handmatig; dit is de voordeligste optie (vanaf €125). Een klapsleutel met afstandsbediening heeft extra RF-elektronica om uw centrale deurvergrendeling op afstand te bedienen (vanaf €150). Keyless Entry en Keyless Go smart keys (zoals bij BMW, Mercedes en Volkswagen) vereisen cryptografische Eeprom- of Bench-programmering en liggen in het luxere segment (vanaf €195).
          </p>
          <h3>Kosten bij All Keys Lost (Alle Sleutels Kwijt) ten opzichte van Reservesleutel</h3>
          <p>
            Wanneer u nog minstens één werkende sleutel heeft, kunnen wij de cryptografische sleuteldata direct klonen of via de OBD2-poort een tweede sleutel toevoegen. Bent u echter alle sleutels kwijt? Dan moeten wij de sleutelcode via het deurslot decoderen en de startonderbreker compleet resetten en opnieuw beveiligen met nieuwe transpondercodes. Hierdoor liggen All Keys Lost tarieven iets hoger dan het bijmaken van een enkele reservesleutel.
          </p>
          <h3>Vergoeding via uw Autoverzekering &amp; 12 Maanden Garantie</h3>
          <p>
            Wanneer u uw autosleutel bent verloren of als deze is gestolen, valt het vervangen van uw sleutelset en het wissen van de oude sleutelcodes vaak onder de dekking van uw WA Extra (Beperkt Casco) of Allrisk autoverzekering. U ontvangt van ons altijd een officiële en gespecificeerde KVK-factuur die u direct kunt indienen bij uw verzekeraar. Bovendien krijgt u op alle geleverde autosleutels 12 maanden schriftelijke garantie.
          </p>
        </div>

        {/* CTA */}
        <div className={styles.cta}>
          <h2>Exacte Prijs Weten?</h2>
          <p>Geef uw automerk, model en bouwjaar door — wij geven direct een vaste prijs.</p>
          <div className={styles.ctaBtns}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.ctaPhone} id="prijzen-cta-phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
              {SITE_CONFIG.phone}
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.ctaWa} id="prijzen-cta-wa">WhatsApp</a>
            <Link href="/contact" className={styles.ctaContact} id="prijzen-cta-form">Offerte formulier</Link>
          </div>
        </div>

      </div>
    </main>
    </>
  );
}
