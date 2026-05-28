import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '../config/brands';

export const metadata: Metadata = {
  title: 'Autosleutel Expert | Mobiele Autoslotenmaker | Alle Merken | 24/7',
  description: 'Professionele mobiele autosleutelprogrammering voor alle merken in Nederland en België. Zelfde dag. Goedkoper dan dealer. Bel: 06-XX XX XX XX',
  alternates: { canonical: SITE_CONFIG.domain },
};

const services = [
  { title: 'Sleutel Bijmaken', desc: 'Reserve sleutel laten programmeren voor alle merken en modellen.', href: '/diensten/sleutel-bijmaken' },
  { title: 'Transponder Programmeren', desc: 'Chip-sleutels en transponders voor alle systemen ter plaatse.', href: '/diensten/transponder-sleutel-programmeren' },
  { title: 'Smart Key / Keyless', desc: 'Proximity keys, comfort access en keyless entry systemen.', href: '/diensten/smart-key-programmeren' },
  { title: 'Contact Reparatie', desc: 'Contactslot defect of beschadigd? Wij repareren of vervangen.', href: '/diensten/contact-reparatie' },
  { title: 'Auto Openen', desc: 'Sleutels in auto vergeten of auto op slot? Schadevrij openen.', href: '/auto-op-slot' },
  { title: 'Alarm Programmeren', desc: 'Autoalarm installatie, programmering en storingsoplossing.', href: '/diensten/alarm-programmeren' },
];

const galleryItems = [
  { title: 'Bus en gereedschappen', src: '/hero-auto.png' },
  { title: 'Sleutel Programmering', src: '/gallery/1.png' },
  { title: 'Gereedschappen', src: '/gallery/2.png' },
  { title: 'Mercedes EIS bench', src: '/gallery/2.png' },
  { title: 'VW Golf 8 SFD', src: '/gallery/1.png' },
  { title: 'Toyota bypass kabel', src: '/gallery/2.png' },
  { title: 'Voor/na sleutel', src: '/gallery/1.png' },
  { title: 'Klantmoment', src: '/hero-auto.png' },
];

export default function HomePage() {
  return (
    <main>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Mobiele Autoslotenmaker — Heel Nederland & België</p>
            <h1 className={styles.heroTitle}>
              Autosleutel Kwijt of Defect?<br />
              <span className={styles.heroOrange}>Wij Zijn Er Binnen 30–60 Minuten</span>
            </h1>
            <p className={styles.heroLead}>
              Professionele sleutelprogrammering voor alle merken. Geen sleepkosten. 
              Goedkoper dan de dealer. Dealer-niveau apparatuur. 24/7 bereikbaar.
            </p>
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.heroPhoneBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.heroWaBtn}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
            <Link href="/autosleutel-kwijt" className={styles.heroUrgentBtn}>Alle Sleutels Kwijt? →</Link>
            <div className={styles.heroTrust} style={{marginTop: '1.5rem'}}>
              <span className={styles.trustPill}>✓ KVK Geregistreerd</span>
              <span className={styles.trustPill}>✓ 4.9 / 5 Google (247 reviews)</span>
              <span className={styles.trustPill}>✓ Verzekerd & Gecertificeerd</span>
              <span className={styles.trustPill}>✓ 24/7 Bereikbaar</span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroImg}>
              <Image 
                src="/hero-auto.png" 
                alt="Mobiele Autoslotenmaker Service" 
                width={600} 
                height={400} 
                className={styles.heroImgFull}
                style={{objectFit: 'cover', width: '100%', height: '100%'}}
              />
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}><strong>30 min</strong><span>Gem. Reactietijd</span></div>
              <div className={styles.heroStatDiv}></div>
              <div className={styles.heroStat}><strong>247</strong><span>Klanten Geholpen</span></div>
              <div className={styles.heroStatDiv}></div>
              <div className={styles.heroStat}><strong>38</strong><span>Merken</span></div>
              <div className={styles.heroStatDiv}></div>
              <div className={styles.heroStat}><strong>24/7</strong><span>Service</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EMERGENCY STRIP ===== */}
      <section className={styles.emergencyStrip}>
        <div className={styles.emergencyInner}>
          <div className={styles.emergencyItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span><strong>Autosleutel Kwijt?</strong> Direct hulp</span>
          </div>
          <div className={styles.emergencyItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span><strong>Auto Op Slot?</strong> Schadevrij openen</span>
          </div>
          <div className={styles.emergencyItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span><strong>24/7 Spoedhulp</strong> Bel nu</span>
          </div>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.emergencyPhone}>{SITE_CONFIG.phone}</a>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className={styles.services}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className="section-eyebrow">ONZE DIENSTEN</p>
            <h2 className="section-title">Alles voor Uw Autosleutel</h2>
            <p className="section-lead">Ter plaatse geprogrammeerd in onze volledig uitgeruste bus. Geen verborgen kosten.</p>
          </div>
          <div className={styles.servicesGrid}>
            {services.map((s, i) => (
              <Link key={i} href={s.href} className={styles.serviceCard} id={`svc-${i}`}>
                <div className={styles.serviceIconBox}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                    {i === 0 && <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>}
                    {i === 1 && <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>}
                    {i === 2 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}
                    {i === 3 && <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>}
                    {i === 4 && <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>}
                    {i === 5 && <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>}
                  </svg>
                </div>
                <div className={styles.serviceBody}>
                  <h3 className={styles.serviceTitle}>{s.title}</h3>
                  <p className={styles.serviceDesc}>{s.desc}</p>
                </div>
                <span className={styles.serviceArrow}>→</span>
              </Link>
            ))}
          </div>
          <div className={styles.servicesCta}>
            <Link href="/diensten" className="btn btn-navy">Alle diensten bekijken</Link>
          </div>
        </div>
      </section>

      {/* ===== BRANDS ===== */}
      <section className={styles.brandsSection}>
        <div className="container">
          <p className={styles.brandsTitle}>WIJ PROGRAMMEREN ALLE MERKEN</p>
          <div className={styles.brandsList}>
            {BRANDS.slice(0, 24).map(b => (
              <Link key={b.slug} href={`/merken/${b.nameSlug}-sleutel-programmeren`} className={styles.brandTag}>{b.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPARE ===== */}
      <section className={styles.compare}>
        <div className="container">
          <div className={styles.compareGrid}>
            <div>
              <p className="section-eyebrow">WAAROM ONS?</p>
              <h2 className="section-title">Bespaar 30–50% vs Dealer</h2>
              <p>Dealer-niveau apparatuur, transparante prijzen, dezelfde dag service. Wij komen naar u toe.</p>
              <ul className={styles.checkList}>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Goedkoper dan dealer — gegarandeerd</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Geen sleepkosten — wij komen naar u</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Zelfde dag service — ook weekend</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Dealer-niveau tools: Autel, VVDI, AVDI, ACDP</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> 12 maanden garantie</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Verzekeringsklare facturen</li>
              </ul>
              <Link href="/prijzen" className="btn btn-primary">Bekijk alle prijzen</Link>
            </div>
            <div className={styles.compareTableWrap}>
              <table className="price-table">
                <thead>
                  <tr><th>Vergelijking</th><th>Dealer</th><th>Wij ✓</th></tr>
                </thead>
                <tbody>
                  <tr><td>Prijs</td><td>€300–€900</td><td><strong>€150–€500</strong></td></tr>
                  <tr><td>Wachttijd</td><td>3–14 dagen</td><td><strong>Zelfde dag</strong></td></tr>
                  <tr><td>Sleepkosten</td><td>€100–€150</td><td><strong>Geen</strong></td></tr>
                  <tr><td>Locatie</td><td>U rijdt erheen</td><td><strong>Wij komen</strong></td></tr>
                  <tr><td>Openingstijden</td><td>Ma-Vr 8–17</td><td><strong>24/7</strong></td></tr>
                  <tr><td>Garantie</td><td>Ja</td><td><strong>12 maanden</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className={styles.reviews}>
        <div className="container">
          <p className="section-eyebrow">KLANTBEOORDELINGEN</p>
          <h2 className="section-title">Wat Onze Klanten Zeggen</h2>
          <div className={styles.ratingBig}>
            <span className={styles.ratingNum}>4.9</span>
            <div>
              <div className="stars">★★★★★</div>
              <span style={{fontSize: '0.8rem', color: 'var(--gray-500)'}}>247 Google beoordelingen</span>
            </div>
          </div>
          <div className={styles.reviewGrid}>
            {[
              { text: 'Alle BMW sleutels kwijt. Dealer: 2 weken en €1.400. Autosleutel Expert: zelfde dag, €580. Aanrader.', name: 'Mark V.', city: 'Eindhoven', car: 'BMW X5' },
              { text: 'Golf 8 SFD probleem. Geen enkele andere specialist kon het oplossen. Binnen 3 uur gereed.', name: 'Peter D.', city: 'Tilburg', car: 'VW Golf 8' },
              { text: 'Mercedes Sprinter vloot — vaste prijsafspraken, prioriteit service. Perfecte B2B partner.', name: 'R. Jacobs', city: 'Breda', car: 'Mercedes Sprinter' },
            ].map((r, i) => (
              <div key={i} className={styles.reviewCard}>
                <div className="stars">★★★★★</div>
                <p className={styles.reviewText}>"{r.text}"</p>
                <div className={styles.reviewMeta}>
                  <div className={styles.reviewAvatar}>{r.name[0]}</div>
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.city} — {r.car}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GALLERY ===== */}
      <section className="gallery-section">
        <div className="container">
          <p className="section-eyebrow">GALERIJ</p>
          <h2 className="section-title">Ons Werk in Beelden</h2>
          <p className="section-lead">Recente projecten en mobiele service in actie.</p>
          <div className="gallery-grid">
            {galleryItems.map((item, i) => (
              <div key={i} className="gallery-item" style={{position: 'relative'}}>
                <Image 
                  src={item.src} 
                  alt={item.title} 
                  fill 
                  style={{objectFit: 'cover'}}
                />
                <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '0.5rem', color: '#fff', fontSize: '0.7rem', fontWeight: 600}}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2>Autosleutel Probleem? Bel Nu — 24/7</h2>
          <p>Gemiddeld binnen 30–60 minuten bij u. Alle merken. Heel Nederland en België.</p>
          <div className={styles.finalCtaBtns}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg">{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>WhatsApp Direct</a>
          </div>
        </div>
      </section>
    </main>
  );
}
