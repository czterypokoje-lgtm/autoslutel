import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: 'Contact & 24/7 Spoedhulp | Autosleutel24',
  },
  description: `Neem contact op met ${SITE_CONFIG.fullName}. Bel, WhatsApp, of stuur een bericht. 24/7 bereikbaar. Reactietijd: ${SITE_CONFIG.responseTime}.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/contact`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/contact`,
      'x-default': `${SITE_CONFIG.domain}/contact`,
    },
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_CONFIG.domain}/contact` },
  ],
};

export default function ContactPage() {
  return (
    <>
      <Script id="contact-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">CONTACT</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Neem Contact Op</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          24/7 bereikbaar. Bel direct voor spoed, WhatsApp voor vragen, of vul het formulier in.
        </p>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '3rem', alignItems: 'start' }}>
          {/* Contact Info */}
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Directe Contactopties</h2>

            <a href={`tel:${SITE_CONFIG.phoneTel}`} id="contact-phone-link" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', textDecoration: 'none', marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.15s ease' }}>
              📞 <span>{SITE_CONFIG.phone}</span>
            </a>

            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" id="contact-wa-link" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: '#25d366', color: '#fff', borderRadius: '12px', textDecoration: 'none', marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.15s ease' }}>
              💬 <span>WhatsApp Direct</span>
            </a>

            <a href={`mailto:${SITE_CONFIG.email}`} id="contact-email-link" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: '#fff', color: 'var(--color-primary)', border: '2px solid var(--color-primary)', borderRadius: '12px', textDecoration: 'none', marginBottom: '2rem', fontWeight: 700, fontSize: '1rem', transition: 'all 0.15s ease' }}>
              ✉️ <span>{SITE_CONFIG.email}</span>
            </a>

            <div style={{ background: 'var(--color-bg-alt)', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Bedrijfsgegevens</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>{SITE_CONFIG.fullName}</strong></p>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{SITE_CONFIG.address.city}, {SITE_CONFIG.address.region}</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>KVK: {SITE_CONFIG.kvk}</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>BTW: {SITE_CONFIG.btw}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-success)', fontWeight: 600 }}>🕐 {SITE_CONFIG.hoursShort}</p>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <img 
                src="/autosleutel24-sleutelbijmaken-utrecht.webp" 
                alt="Autosleutel24 professionele werkplaats in Utrecht voor autosleutel bijmaken en programmeren" 
                style={{ width: '100%', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }} 
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'center', fontStyle: 'italic' }}>
                Onze professionele werkplaats in Utrecht voor autosleutel reparatie & programmering.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Offerte Aanvragen</h2>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} id="contact-form">
              {[
                { id: 'name', label: 'Naam', type: 'text', placeholder: 'Uw naam' },
                { id: 'phone', label: 'Telefoonnummer', type: 'tel', placeholder: '06-XXXXXXXX' },
                { id: 'car', label: 'Automerk & Model', type: 'text', placeholder: 'bijv. BMW 3-serie 2019' },
                { id: 'email', label: 'E-mailadres', type: 'email', placeholder: 'uw@email.nl' },
              ].map((field) => (
                <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label htmlFor={field.id} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{field.label}</label>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    required
                    style={{ padding: '0.75rem 1rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label htmlFor="message" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Bericht / Situatie</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Beschrijf uw situatie..."
                  style={{ padding: '0.75rem 1rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical', outline: 'none' }}
                />
              </div>
              <button
                type="submit"
                id="contact-submit"
                style={{ background: 'var(--color-primary)', color: '#fff', padding: '1rem', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                📋 Offerte Aanvragen
              </button>
            </form>
          </div>
        </div>

        {/* ── COMPREHENSIVE CONTACT & SPOEDHULP SEO GUIDE ARTICLE ── */}
        <div className="seo-article-block" style={{ marginTop: '4.5rem', marginBottom: '3rem' }}>
          <h2>Contact en 24/7 Mobiele Slotenmaker Service in Heel Nederland</h2>
          <p>
            Heeft u met spoed een autosleutelspecialist nodig, bent u buitengesloten of wilt u een reservesleutel laten programmeren? Neem dan telefonisch of via WhatsApp contact met ons op. Onze centrale servicecoördinatie stuurt direct de dichtstbijzijnde volledig ingerichte servicebus naar uw locatie toe in heel Nederland — van regio Utrecht en Amsterdam tot Almere, Amersfoort, Hilversum en Het Gooi.
          </p>
          <h3>Welke gegevens hebben wij van u nodig voor een snelle prijsopgave?</h3>
          <p>
            Om u direct een exacte, vaste prijs te kunnen geven en de juiste transponderchip of smart key mee te nemen, vragen wij u om uw automerk, model, bouwjaar en uw huidige locatie of woonplaats door te geven. Heeft u nog een werkende sleutel of bent u alle sleutels kwijt (All Keys Lost)? Wij hebben voor 99% van alle voertuigen de juiste onderdelen en software direct op voorraad.
          </p>
          <h3>Hoe werkt onze mobiele noodservice op locatie?</h3>
          <p>
            Wanneer u belt met onze spoedlijn, schatten wij direct in hoe snel onze monteur bij u kan zijn — gemiddeld binnen 15 tot 30 minuten in regio Midden-Nederland. Onze monteurs beschikken in de servicewagen over CNC-sleutelfreesmachines en professionele OBD2-diagnoseapparatuur om uw nieuwe autosleutel direct ter plaatse te slijpen en digitaal in te leren op de startonderbreker van uw voertuig.
          </p>
          <h3>Betalingsmogelijkheden en Verzekeringsfactuur</h3>
          <p>
            U betaalt pas nadat de nieuwe sleutel volledig is getest op het openen van de deuren en het starten van de motor. U kunt bij onze monteur veilig en contactloos betalen via PIN, iDEAL, creditcard of contant. U ontvangt direct per e-mail of digitaal een officiële gespecificeerde BTW-factuur met 12 maanden schriftelijke garantie. Deze factuur kunt u bovendien indienen bij uw autoverzekering of pechhulpverzekeraar wanneer u gedekt bent voor sleutelverlies of diefstal.
          </p>
          <h3>Zakelijke Klanten, Wagenparkbeheerders en Garagebedrijven</h3>
          <p>
            Bent u autodealer, garagehouder of wagenparkbeheerder en heeft u regelmatig nieuwe transpondersleutels, klapsleutels of keyless smart keys nodig voor uw occasions of bedrijfswagens? Neem dan contact met ons op voor onze zakelijke samenwerkingsvoorwaarden en staffeltarieven op locatie.
          </p>
        </div>

      </div>
    </main>
    </>
  );
}
