import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: `Prijzen Autosleutel Programmeren | Indicatie & Tarieven | ${SITE_CONFIG.name}`,
  description: 'Indicatieve prijzen voor autosleutel bijmaken en programmeren. Exacte prijs altijd vooraf afgesproken. Bespaar 30–50% vs dealer. Bel voor offerte.',
  alternates: {
    canonical: `${SITE_CONFIG.domain}/prijzen`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/prijzen`,
      'x-default': `${SITE_CONFIG.domain}/prijzen`,
    },
  },
};

// All rows: service | from | up to | notes
const priceRows = [
  { service: 'Sleutel bijmaken (reserve)', from: '€ 95', to: '€ 250', note: 'Afhankelijk van chip type & merk' },
  { service: 'Alle sleutels kwijt (AKL)', from: '€ 180', to: '€ 650', note: 'BMW/Porsche/Tesla bovenaan de range' },
  { service: 'Smart key / keyless entry', from: '€ 180', to: '€ 450', note: 'Proximity fob incl. programmering' },
  { service: 'Transponder klonen', from: '€ 75',  to: '€ 180', note: 'ID46, Hitag2, PCF7936/53' },
  { service: 'Contactslot reparatie / EIS', from: '€ 120', to: '€ 400', note: 'Mercedes EIS/ELV apart aanvullend' },
  { service: 'Sleutelbehuizing vervangen', from: '€ 45',  to: '€ 120', note: 'Excl. programmering' },
  { service: 'Afstandsbediening reparatie', from: '€ 35',  to: '€ 95',  note: 'Knop, circuit of chip' },
  { service: 'Ghost immobilizer installatie', from: '€ 349', to: '€ 499', note: 'TASSA gecertificeerd' },
  { service: 'ECU klonen / CP verwijdering', from: '€ 195', to: '€ 595', note: 'Diagnose vereist' },
  { service: 'Autoalarm programmeren', from: '€ 75',  to: '€ 250', note: 'Fabriek of aftermarket' },
  { service: 'Bedrijfswagen / fleet klus', from: '€ 90',  to: '€ 350', note: 'Per voertuig, volumekorting mogelijk' },
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
                <tr key={i}>
                  <td className={styles.serviceCell}>{row.service}</td>
                  <td className={styles.priceCell}>{row.from}</td>
                  <td className={styles.priceCell}>{row.to}</td>
                  <td className={styles.noteCell}>{row.note}</td>
                </tr>
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
                  alt="Autosleutel reparatie en behuizing vervangen op locatie in Utrecht en Amsterdam door gecertificeerde mobiele slotenmaker (GPS Utrecht &amp; Amsterdam)"
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
                  alt="Autosleutel programmeren en inleren op locatie in Utrecht en Amsterdam - werkplaats in mobiele servicebus (GPS Utrecht & Amsterdam)"
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
                  alt="Ruime voorraad originele autosleutels en transponders voor alle merken in Utrecht en Amsterdam servicegebied"
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
                  alt="Dealer-niveau diagnose apparatuur Autel IM608 Pro en AVDI voor autosleutel programmering in Utrecht en Amsterdam"
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
