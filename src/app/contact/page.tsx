import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/config/site.config';
import ContactForm from '@/components/ContactForm/ContactForm';
import { Phone, Mail, Clock, MapPin, MessageSquareText } from 'lucide-react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Contact & 24/7 Spoedhulp | Autosleutel24',
  },
  description: `Neem contact op met ${SITE_CONFIG.fullName}. Bel of stuur een bericht. 24/7 bereikbaar. Reactietijd: ${SITE_CONFIG.responseTime}.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/contact`,
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
      <Script
        id="breadcrumb-schema-contact"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main style={{ width: '100%', overflowX: 'hidden', background: '#fff' }}>
        
        {/* HERO SECTION */}
        <section style={{
          background: 'linear-gradient(180deg, var(--navy-50) 0%, #ffffff 100%)',
          padding: '6rem 1.5rem 4rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
             <div style={{ display: 'inline-flex', alignItems: 'center', background: '#e0ebf6', color: 'var(--color-primary)', padding: '0.4rem 1.25rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
                Contact Us
             </div>
             <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                Probleem met uw autosleutel?<br/>Wij kunnen helpen!
             </h1>
             <p style={{ fontSize: '1.15rem', color: 'var(--gray-600)', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
                Professionele autoslotenmaker service in Nederland. Duidelijke prijzen, betrouwbaar werk en mobiele hulp wanneer u het nodig heeft. Bel <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>{SITE_CONFIG.phone}</a>.
             </p>
          </div>
        </section>

        {/* MAIN SPLIT SECTION */}
        <section style={{ padding: '5rem 1.5rem', background: '#fff' }}>
          <div className={`container ${styles.splitGrid}`} style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* LEFT COLUMN: FORM */}
            <div className={styles.leftCol}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <MessageSquareText size={32} color="var(--color-primary)" strokeWidth={2} />
                <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.01em' }}>Neem Contact Op</h2>
              </div>
              <p style={{ color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: '2.5rem', fontSize: '1.05rem' }}>
                Autosleutel24 is de professionele autoslotenmaker. Vul het onderstaande formulier in en een van onze vertegenwoordigers helpt u zo snel mogelijk om uw sleutelprobleem op te lossen.
              </p>
              
              <ContactForm />
              
              <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--gray-400)', lineHeight: 1.5 }}>
                * Door dit formulier in te dienen, gaat u ermee akkoord dat wij via e-mail of telefoon contact met u opnemen met betrekking tot uw aanvraag.
              </p>
            </div>

            {/* RIGHT COLUMN: INFO BLOCKS */}
            <div className={styles.rightCol} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* TOP BLUE BLOCK */}
              <div style={{ background: 'var(--color-primary)', color: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 20px 40px rgba(13, 33, 55, 0.15)' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Direct Hulp Nodig?</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2rem', lineHeight: 1.5, fontSize: '1.05rem' }}>
                  Heeft u het nu direct nodig? Bel ons meteen of stuur een e-mail. Onze meldkamer staat 24/7 klaar om u verder te helpen.
                </p>
                <div className={styles.buttonGroup}>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary}>
                    <Phone size={18} strokeWidth={2.5} /> Bel voor Service
                  </a>
                  <a href={`mailto:${SITE_CONFIG.email}`} className={styles.btnOutline}>
                    <Mail size={18} strokeWidth={2.5} /> Stuur een E-mail
                  </a>
                </div>
              </div>

              {/* BOTTOM GRAY BLOCK */}
              <div style={{ background: 'var(--navy-50)', padding: '2.5rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
                  
                  <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', background: '#fff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <Phone size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '1rem', marginBottom: '0.25rem' }}>Telefoonnummer</h4>
                      <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '1rem' }}>{SITE_CONFIG.phone}</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', background: '#fff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <Clock size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '1rem', marginBottom: '0.25rem' }}>Openingstijden</h4>
                      <p style={{ color: 'var(--gray-600)', fontSize: '1rem', lineHeight: 1.5 }}>
                        Maandag – Zondag: 24/7 bereikbaar<br/>
                        <span style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>Nooddienst altijd beschikbaar</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', background: '#fff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <Mail size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '1rem', marginBottom: '0.25rem' }}>E-mailadres</h4>
                      <a href={`mailto:${SITE_CONFIG.email}`} style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '1rem' }}>{SITE_CONFIG.email}</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', background: '#fff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <MapPin size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '1rem', marginBottom: '0.25rem' }}>Werkgebied</h4>
                      <p style={{ color: 'var(--gray-600)', fontSize: '1rem', lineHeight: 1.5 }}>
                        Landelijke dekking in Nederland. Wij komen direct naar u toe.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </section>

      </main>
    </>
  );
}
