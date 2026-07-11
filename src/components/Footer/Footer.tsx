import Link from 'next/link';
import styles from './Footer.module.css';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '../../config/brands';

const diensten = [
  ['Autosleutel Bijmaken', '/diensten/autosleutel-bijmaken'],
  ['Transponder Sleutel', '/diensten/transponder-programmeren'],
  ['Smart Key / Keyless', '/diensten/smart-key-programmeren'],
  ['Contactslot Reparatie', '/diensten/contactslot-reparatie'],
  ['Reservesleutel Maken', '/diensten/reservesleutel-maken'],
  ['Autosleutels Repareren', '/diensten/autosleutels-repareren'],
  ['Alle diensten →', '/diensten'],
];

const steden = [
  ['Utrecht (Hoofdlocatie)', '/steden/utrecht'],
  ['Amsterdam', '/steden/amsterdam'],
  ['Amsterdam-Zuid', '/steden/amsterdam-zuid'],
  ['Almere', '/steden/almere'],
  ['Amersfoort', '/steden/amersfoort'],
  ['Hilversum', '/steden/hilversum'],
  ['Bussum', '/steden/bussum'],
  ['Naarden', '/steden/naarden'],
  ['Amstelveen', '/steden/amstelveen'],
  ['Zeist', '/steden/zeist'],
  ['Alle steden & regio\'s →', '/steden'],
];

const spoed = [
  ['Autosleutel Kwijt', '/autosleutel-kwijt'],
  ['Auto Openen Zonder Sleutel', '/diensten/auto-openen-zonder-sleutel'],
  ['24/7 Spoedhulp', '/spoedhulp-autosleutel'],
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          {/* Brand column */}
          <div>
            <div className={styles.footerBrand}>
              <img
                src="/images/logo/autosleutel24-logo-footer-wit-utrecht.webp"
                alt="Autosleutel24.nl Wit Logo — 24/7 Mobiele Autosleutel Slotenmaker Utrecht [GPS: 52.0907° N, 5.1214° E]"
                style={{ height: '42px', width: 'auto', display: 'block' }}
              />
            </div>
            <p className={styles.footerDesc}>Professionele mobiele autosleutelprogrammering voor alle merken. Hoofdlocatie Utrecht, direct actief in Amsterdam-Zuid, Amersfoort, Almere, &apos;t Gooi (Hilversum, Bussum, Naarden) en heel Nederland.</p>
            <div className={styles.footerBadges}>
              <span>KVK: {SITE_CONFIG.kvk}</span>
              <span>BTW: {SITE_CONFIG.btw}</span>
              <span>4.9 ★ Google</span>
              <span>Verzekerd</span>
            </div>
            <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
              <a
                href={SITE_CONFIG.social.marktplaats}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                <img
                  src="/images/seo/marktplaats-autosleutel24-verifieerd.webp"
                  alt="Autosleutel24 op Marktplaats - Geverifieerde verkoper"
                  style={{ height: '60px', width: 'auto', display: 'block', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </a>
            </div>
            <div className={styles.footerContact}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a>
              <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>
              <span className={styles.hours}>24/7 Bereikbaar</span>
            </div>
          </div>

          {/* Diensten */}
          <div>
            <h4 className={styles.colTitle}>Diensten</h4>
            <ul className={styles.linkList}>
              {diensten.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
            </ul>
          </div>

          {/* Merken */}
          <div>
            <h4 className={styles.colTitle}>Merken</h4>
            <ul className={styles.linkList}>
              {BRANDS.filter(b => b.priority === 'P1').map(b => (
                <li key={b.slug}><Link href={`/merken/${b.nameSlug}-autosleutel-bijmaken`}>{b.name}</Link></li>
              ))}
              <li><Link href="/merken">Alle 38 merken →</Link></li>
            </ul>
            <h4 className={styles.colTitle} style={{ marginTop: '1.5rem' }}>Blog &amp; Advies</h4>
            <ul className={styles.linkList}>
              <li><Link href="/blog/autosleutel-batterij-vervangen-stappenplan">Batterij Vervangen</Link></li>
              <li><Link href="/blog/autosleutel-gestolen-wat-te-doen">Sleutel Gestolen?</Link></li>
            </ul>
          </div>

          {/* Steden + Spoed */}
          <div>
            <h4 className={styles.colTitle}>Steden</h4>
            <ul className={styles.linkList}>
              {steden.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
            </ul>
            <h4 className={styles.colTitle} style={{marginTop:'1.5rem'}}>Spoedhulp</h4>
            <ul className={styles.linkList}>
              {spoed.map(([label, href]) => <li key={href}><Link href={href} style={{color:'#f87171'}}>{label}</Link></li>)}
            </ul>
          </div>

          {/* Openingstijden */}
          <div>
            <h4 className={styles.colTitle}>Openingstijden</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
              <tbody>
                {[
                  ['Maandag', '24 uur geopend'],
                  ['Dinsdag', '24 uur geopend'],
                  ['Woensdag', '24 uur geopend'],
                  ['Donderdag', '24 uur geopend'],
                  ['Vrijdag', '24 uur geopend'],
                  ['Zaterdag', '24 uur geopend'],
                  ['Zondag', '24 uur geopend'],
                ].map(([dag, tijd]) => (
                  <tr key={dag} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '0.35rem 0', fontWeight: 500 }}>{dag}</td>
                    <td style={{ padding: '0.35rem 0', textAlign: 'right', color: 'var(--orange-400)', fontWeight: 600 }}>{tijd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── GLOBAL SEO & TECHNICAL KNOWLEDGE BASE (11/10 Text-to-HTML Excellence across all pages) ── */}
        <section style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '2.5rem',
          paddingBottom: '2.5rem',
          marginTop: '2.5rem',
          fontSize: '0.88rem',
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.78)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
              Uitgebreide Kennisbank: Autosleutel Programmering, Transpondertechnologie &amp; Mobiele Slotenmaker Service
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--orange-400)', marginBottom: '0.5rem' }}>
                  1. Mobiele Autosleutelservice in Midden-Nederland &amp; Het Gooi
                </h4>
                <p style={{ marginBottom: '0.85rem' }}>
                  Autosleutel24 is dé gespecialiseerde mobiele autosecuriteitsdienst voor het direct ter plaatse bijmaken, programmeren en herstellen van autosleutels. Vanuit onze hoofdlocatie in Utrecht en onze strategische steunpunten bedienen wij een compact, razendsnel werkgebied binnen 30 kilometer rondom Utrecht Centrum en Het Gooi (Bussum, Hilversum, Naarden, Laren, Blaricum, Huizen). Daarnaast zijn onze gecertificeerde monteurs dagelijks actief in Amsterdam, Amstelveen, Diemen, Amersfoort, Almere, Zeist, Breukelen en Nieuwegein. Doordat wij uitsluitend opereren met volledig uitgeruste mobiele servicewagens, hoeft u uw voertuig nooit te laten wegslepen naar een dure merkdealer.
                </p>
                <p>
                  Onze mobiele werkplaatsen zijn voorzien van hightech computergestuurde sleutelfreesmachines en officiële OEM-diagnoseapparatuur. Hierdoor kunnen wij binnen 15 tot 30 minuten na uw oproep op uw locatie aanwezig zijn, of u nu thuis op de oprit staat, op uw werkplek, of gestrand bent op een openbare parkeerplaats langs de snelweg. Wij garanderen een 100% schadevrije werkwijze en leveren direct een geteste sleutel met volledige garantie.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--orange-400)', marginBottom: '0.5rem' }}>
                  2. Transponderchips, Smart Keys &amp; Cryptografische Startonderbreking
                </h4>
                <p style={{ marginBottom: '0.85rem' }}>
                  Moderne personenauto&apos;s en bedrijfswagens zijn sinds eind jaren &apos;90 uitgerust met een elektronische startonderbreker (immobilizer). In de behuizing van uw autosleutel bevindt zich een transponderchip of een geavanceerde smart key module. Wanneer u de sleutel in het contactslot steekt of de startknop indrukt, zendt de ringantenne rond het slot een elektromagnetisch signaal uit. De chip antwoordt met een unieke, versleutelde digitale code (zoals Hitag2, Hitag AES, Megamos Crypto ID48 of Texas Crypto 4D). Alleen wanneer de Motor Management Module (ECU) en de immobilizermodule deze code herkennen, wordt de brandstofpomp en ontsteking vrijgegeven.
                </p>
                <p>
                  Autosleutel24 beschikt over geavanceerde OBD2-programmeersoftware om rechtstreeks te communiceren met complexe beveiligingsmodules, waaronder BMW CAS/FEM/BDC-systemen, Volkswagen/Audi MQB-platforms, Renault Handsfree kaarten en Mercedes-Benz FBS3/FBS4 contactsloten (EZS/EIS). Wij lezen de unieke sleuteldata veilig uit en schrijven nieuwe sleutels direct in het geheugen van uw voertuig.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--orange-400)', marginBottom: '0.5rem' }}>
                  3. Kostenvoordeel: Dealer versus Autosleutel24 Slotenmaker
                </h4>
                <p style={{ marginBottom: '0.85rem' }}>
                  Wanneer u via een officiële merkdealer een nieuwe autosleutel aanvraagt, wordt u vaak geconfronteerd met lange wachttijden van twee tot drie weken omdat de sleutel op chassisnummer (VIN) besteld moet worden vanuit een centraal magazijn in Duitsland of Frankrijk. Bovendien liggen de totale tarieven bij merkdealers gemiddeld tussen de €350,- en €650,-, nog exclusief eventuele wegsleepkosten als u geen werkende sleutel meer heeft.
                </p>
                <p>
                  Bij Autosleutel24 bespaart u tot wel 50% op de totale kosten. Wij hebben sleutels voor meer dan 38 automerken standaard op voorraad in onze servicewagens. Wij slijpen het sleutelblad ter plaatse op maat en leren de transponder en afstandsbediening direct in. U betaalt een eerlijk, vooraf vastgesteld all-in tarief zonder verborgen kosten, inclusief montage, programmering en 12 maanden schriftelijke garantie.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--orange-400)', marginBottom: '0.5rem' }}>
                  4. Procedure bij Volledig Sleutelverlies (All-Keys-Lost)
                </h4>
                <p style={{ marginBottom: '0.85rem' }}>
                  Bent u al uw autosleutels kwijtgeraakt of zijn deze gestolen? Dan is een reguliere kopie niet meer mogelijk en treedt onze All-Keys-Lost noodprocedure in werking. Onze specialist opent uw autodeur allereerst 100% schadevrij met behulp van specialistisch gereedschap zoals Lishi 2-in-1 lockpicks. Met deze precisie-instrumenten kunnen wij de mechanische groeven en dieptes van uw slotcilinder exact uitlezen zonder krassen of braamschade aan het portier.
                </p>
                <p>
                  Vervolgens voeren wij deze mechanische slotcode in onze automatische CNC-sleutelmachine in, die binnen enkele seconden een gloednieuw sleutelblad freest. Daarna sluiten wij onze diagnoseapparatuur aan op de OBD2-poort om de oude, verloren sleutels definitief uit het geheugen van de immobilizer te wissen. Zo bent u ervan verzekerd dat een eventuele vinder of dief uw auto niet meer kan starten.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--orange-400)', marginBottom: '0.5rem' }}>
                  5. Autosleutel Reparatie &amp; Batterijvervanging op Locatie
                </h4>
                <p style={{ marginBottom: '0.85rem' }}>
                  Niet in alle gevallen is een compleet nieuwe sleutel nodig. Werkt uw afstandsbediening slecht, zijn de drukknopjes versleten, is de sleutelbehuizing gebarsten of klapt het sleutelblad niet meer uit? Onze monteurs voeren ook deskundige reparaties uit. Wij solderen losse microswitches op de printplaat opnieuw vast, vervangen beschadigde behuizingen door stevige OEM-kwaliteit sleutelbehuizingen en vernieuwen defecte transponderspoelen.
                </p>
                <p>
                  Daarnaast vervangen wij alle typen sleutelbatterijen, van reguliere CR2032 en CR2025 lithium knoopcellen tot oplaadbare VL2020 accu&apos;s die vastgesoldeerd zitten op de printplaat van onder andere BMW en Ford sleutels. Na reparatie testen wij de zendfrequentie (433 MHz of 868 MHz) met een professionele frequentiemeter.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--orange-400)', marginBottom: '0.5rem' }}>
                  6. Schadevergoeding &amp; Autoverzekering in Nederland
                </h4>
                <p style={{ marginBottom: '0.85rem' }}>
                  In veel situaties wordt het vervangen of bijmaken van een autosleutel na diefstal of verlies (gedeeltelijk) vergoed door uw autoverzekeraar, afhankelijk van uw polisvoorwaarden (Beperkt Casco of All-Risk / Volledig Casco). Verzekeraars stellen bij verlies of diefstal vrijwel altijd als harde eis dat de verloren sleutels elektronisch worden uitgeleerd en dat u een officiële factuur kunt overleggen waarop staat gespecificeerd dat de startonderbreker opnieuw is gecodeerd.
                </p>
                <p>
                  Autosleutel24 is een erkend en volledig gecertificeerd slotenmakersbedrijf. Na afloop van onze werkzaamheden ontvangt u direct een gedetailleerde, officiële BTW-factuur en een digitaal rapport van de herprogrammering. Deze documenten kunt u rechtstreeks indienen bij uw verzekeringsmaatschappij voor een snelle en vlekkeloze schadeafhandeling.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.bottomBar}>
          <div className={styles.bottomInner}>
            <p>© {year} {SITE_CONFIG.fullName}. Alle rechten voorbehouden.</p>
            <div className={styles.bottomLinks}>
              {/* iubenda Privacy Policy embedded link */}
              <a
                href="https://www.iubenda.com/privacy-policy/c53c352b-ed07-4c5b-b461-8b542ddd3aaf"
                className="iubenda-white iubenda-noiframe iubenda-embed"
                title="Privacy Policy"
                rel="noopener noreferrer"
              >
                Privacybeleid
              </a>
              {/* iubenda Cookie Policy embedded link */}
              <a
                href="https://www.iubenda.com/privacy-policy/c53c352b-ed07-4c5b-b461-8b542ddd3aaf/cookie-policy"
                className="iubenda-white iubenda-noiframe iubenda-embed"
                title="Cookie Policy"
                rel="noopener noreferrer"
              >
                Cookiebeleid
              </a>
              {/* Cookie preferences — lets users manage/withdraw consent (GDPR art. 7) */}
              <button
                type="button"
                className="iubenda-cs-preferences-link"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'inherit',
                }}
              >
                Cookie-instellingen
              </button>
              <Link href="/veelgestelde-vragen">FAQ</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
