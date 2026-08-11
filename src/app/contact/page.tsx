import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import ContactForm from '@/components/ContactForm/ContactForm';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import HowItWorks from '@/components/HowItWorks/HowItWorks';

export const metadata: Metadata = {
  title: {
    absolute: 'Contact & 24/7 Spoedhulp | Autosleutel24',
  },
  description: `Neem contact op met ${SITE_CONFIG.fullName}. Bel, WhatsApp, of stuur een bericht. 24/7 bereikbaar. Reactietijd: ${SITE_CONFIG.responseTime}.`,
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

const faqItems = [
  {
    q: "Wat als jullie mijn autosleutel niet kunnen bijmaken?",
    a: "Wij bedienen 95%+ van alle automerken in Nederland. Als het ons om technische redenen niet lukt, betaalt u helemaal niets. No cure, no pay."
  },
  {
    q: "Moet ik vooraf betalen?",
    a: "Nee. U betaalt pas na oplevering en als u de sleutel zelf heeft getest. De vaste prijs wordt altijd vooraf afgesproken zodat u weet waar u aan toe bent."
  },
  {
    q: "Komen jullie ook 's nachts?",
    a: "Ja, onze mobiele service is 24/7 beschikbaar, ook in het weekend. En wij rekenen geen bizarre toeslagen voor avond- of nachturen."
  },
  {
    q: "Werkt dit ook zonder originele sleutel?",
    a: "Ja. Zelfs als u alle sleutels kwijt bent (All Keys Lost), decoderen wij uw slot mechanisch en programmeren we een gloednieuwe sleutel direct in op uw contactslot of ECU (boordcomputer)."
  }
];

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ContactPage(props: Props) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === 'string' ? searchParams.q : null;
  
  const defaultH1 = "Autosleutel Bijmaken? Wij Zijn Binnen 30 Minuten Bij U";
  let h1Text = defaultH1;
  if (q) {
    // Capitalize each word from the query to make it look like a natural Title
    const formattedQuery = q.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    h1Text = `${formattedQuery}? Wij Zijn Binnen 30 Minuten Bij U`;
  }

  const steps = [
    { num: "1", title: "Bel of vul in", icon: "📞" },
    { num: "2", title: "Monteur onderweg (gem. 30 min)", icon: "🚐" },
    { num: "3", title: "Sleutel gemaakt op locatie", icon: "🔑" },
    { num: "4", title: "Testen + garantie", icon: "✅" },
  ];

  return (
    <>
      <Script id="contact-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        
        {/* ── HERO & SUBHEADLINE ─────────────────────────────────────── */}
        <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 1.5rem', textAlign: 'center', color: '#fff' }}>
          <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
              {h1Text}
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.85)', marginBottom: '2.5rem', lineHeight: 1.5, maxWidth: '700px', margin: '0 auto 2.5rem' }}>
              Reservesleutel, sleutel kwijt of contactslot defect — onze monteur komt 24/7 naar u toe. 
              <strong> Vaste prijs vooraf, geen sleepkosten.</strong>
            </p>

            <div style={{ marginBottom: '3rem' }}>
              <LeadCaptureForm phone={SITE_CONFIG.phoneTel} />
            </div>

            {/* ── CTAs Side by Side ── */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-primary)', color: '#fff', padding: '1.25rem 2rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)' }}>
                <span>📞 Bel Direct: {SITE_CONFIG.phone}</span>
              </a>
              <a href="#form-section" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#fff', color: 'var(--navy-900)', padding: '1.25rem 2rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', border: '2px solid transparent' }}>
                <span>📝 Gratis Offerte Aanvragen</span>
              </a>
            </div>

            {/* ── Trust Strip ── */}
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ color: 'var(--color-primary)' }}>✓</span> 24/7 Beschikbaar</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ color: 'var(--color-primary)' }}>✓</span> Vaste prijs vanaf €95</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ color: 'var(--color-primary)' }}>✓</span> 12 mnd garantie</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ color: 'var(--color-primary)' }}>✓</span> KVK {SITE_CONFIG.kvk}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ color: 'var(--color-primary)' }}>✓</span> Verzekerd</span>
            </div>
          </div>
        </section>

        {/* 3 steps HowTo (Full Width) */}
        <div style={{ padding: '3.5rem 0', background: '#ffffff', borderBottom: '1px solid var(--color-border)' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
            <HowItWorks variant="default" />
          </div>
        </div>

        <div className="container" style={{ maxWidth: '1100px', padding: '4rem 1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '4rem', alignItems: 'start' }}>
            
            {/* ── LEFT COLUMN: SOCIAL PROOF, PRICING, HOW IT WORKS ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              
              {/* Pricing Table */}
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Tarieven</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontWeight: 600 }}>Geen verrassingen achteraf. Dit betaalt u — punt.</p>
                <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
                  <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse', background: '#fff', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--navy-900)', color: '#fff' }}>
                      <tr>
                        <th style={{ padding: '1rem' }}>Sleutel Type</th>
                        <th style={{ padding: '1rem' }}>Dealer Prijs</th>
                        <th style={{ padding: '1rem', background: 'var(--color-primary)' }}>Onze Prijs</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem' }}>Standaard sleutel</td>
                        <td style={{ padding: '1rem', color: '#64748b', textDecoration: 'line-through' }}>€250 - €350</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>Vanaf €149</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem' }}>Klapsleutel / Flip Key</td>
                        <td style={{ padding: '1rem', color: '#64748b', textDecoration: 'line-through' }}>€350 - €450</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>Vanaf €199</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem' }}>Smart Key / Keyless</td>
                        <td style={{ padding: '1rem', color: '#64748b', textDecoration: 'line-through' }}>€450 - €700</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>Vanaf €299</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '1rem' }}>Extra reserve (2e, 3e)</td>
                        <td style={{ padding: '1rem', color: '#64748b', textDecoration: 'line-through' }}>€200+</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>€75 per stuk</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Social Proof */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.25rem', color: '#fbbf24' }}>★★★★★</div>
                  <span style={{ fontWeight: 700 }}>4.9/5</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>({SITE_CONFIG.reviewCount} Google reviews)</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.1rem' }}>★★★★★</div>
                    <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>&ldquo;Sleutel van mijn Audi A4 kwijt, dealer had 8 dagen wachttijd. Binnen 40 minuten ter plaatse, sleutel werkte direct.&rdquo;</p>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>— Mark D., Utrecht</div>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.1rem' }}>★★★★★</div>
                    <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>&ldquo;Zaterdagavond gebeld, dacht dat er niemand zou opnemen. Binnen 35 minuten stond de monteur voor de deur.&rdquo;</p>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>— Sanne V., Hilversum</div>
                  </div>

                  <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.1rem' }}>★★★★★</div>
                    <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>&ldquo;Eerlijke prijs, geen verrassingen. Precies wat er van tevoren was afgesproken.&rdquo;</p>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>— Thomas B., Almere</div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: FORM & FAQ ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              
              {/* Form Section */}
              <div id="form-section" style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Gratis Offerte Aanvragen</h2>
                <ContactForm />
                {/* We add the microcopy right here via a small wrapper since the form is untouched */}
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '1rem', fontWeight: 500 }}>
                  🕒 Wij bellen u binnen 5 minuten terug — ook &apos;s avonds en in het weekend.
                </p>
              </div>

              {/* FAQ Section */}
              <div style={{ background: 'var(--color-bg-alt)', padding: '2rem', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Veelgestelde Vragen</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {faqItems.map((item, idx) => (
                    <details key={idx} style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <summary style={{ fontWeight: 700, cursor: 'pointer', outline: 'none', color: 'var(--navy-900)' }}>
                        {item.q}
                      </summary>
                      <p style={{ marginTop: '0.75rem', color: 'var(--color-text-primary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ── FINAL CTA BLOCK ────────────────────────────────────────── */}
        <section style={{ background: 'var(--navy-900)', padding: '4rem 1.5rem', textAlign: 'center', color: '#fff' }}>
          <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: '#fff', fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem' }}>Nog Steeds Zonder Sleutel? Wij Staan Al Klaar.</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              24/7 bereikbaar — ook nu. Neem direct contact op voor een vaste prijsopgave en ETA.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-primary)', color: '#fff', padding: '1.25rem 2.5rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)' }}>
                <span>📞 Bel: {SITE_CONFIG.phone}</span>
              </a>
              <a href="#form-section" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: '2px solid rgba(255,255,255,0.2)', color: '#fff', padding: '1.25rem 2.5rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none' }}>
                <span>📝 Offerte Aanvragen</span>
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
