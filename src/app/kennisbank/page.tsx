import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Kennisbank | Transpondertechnologie & Programmeren | Autosleutel24',
  },
  description:
    'Dé complete kennisbank over autosleutel programmering, transponderchips (Hitag, Megamos), OBD2 diagnose, Eeprom bench flashing en All-Keys-Lost procedures.',
  alternates: {
    canonical: `${SITE_CONFIG.domain}/kennisbank`,
  },
  openGraph: {
    url: `${SITE_CONFIG.domain}/kennisbank`,
    title: 'Autosleutel Kennisbank & Technische Gids | Autosleutel24',
    description: 'Alles over het inleren, programmeren en frezen van autosleutels en transponderchips.',
  },
};

export default function KennisbankPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Uitgebreide Kennisbank: Autosleutel Programmering, Transpondertechnologie & Mobiele Slotenmaker Service',
    description: 'Technische gids voor transponders, OBD2 programmeerprotocollen, CNC laser frezen en autobeveiliging.',
    author: { '@type': 'Organization', name: SITE_CONFIG.fullName },
    publisher: { '@type': 'Organization', name: SITE_CONFIG.fullName },
    mainEntityOfPage: `${SITE_CONFIG.domain}/kennisbank`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Kennisbank', item: `${SITE_CONFIG.domain}/kennisbank` },
    ],
  };

  return (
    <>
      <Script id="kennisbank-article-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id="kennisbank-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero Section */}
        <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '4.5rem 2rem 4rem', color: '#fff' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <nav style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.6)' }}>Home</Link> / <span style={{ color: '#fff', fontWeight: 600 }}>Kennisbank</span>
            </nav>
            <div style={{ display: 'inline-block', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.35)', color: '#fdba74', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1rem' }}>
              📚 Technische Pillar Guide • Autosleutels &amp; Autobeveiliging
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.25rem' }}>
              Uitgebreide Kennisbank: Autosleutel Programmering &amp; Transpondertechnologie
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1.15rem', lineHeight: 1.7, maxWidth: 820 }}>
              Welkom in onze officiële technische encyclopedie. Hier leest u alles over autobeveiligingssystemen, cryptografische startonderbrekers, Eeprom/Bench programmering en onze mobiele werkwijze op locatie.
            </p>
          </div>
        </section>

        {/* Pillar Content Area */}
        <section style={{ padding: '5rem 0', background: '#ffffff' }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <article style={{ lineHeight: 1.85, color: '#334155', fontSize: '1.05rem' }}>
              
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2rem', marginBottom: '3.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', color: '#0f172a', marginTop: 0, marginBottom: '1rem' }}>Inhoudsopgave</h2>
                <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem', listStyle: 'none', padding: 0, margin: 0 }}>
                  <li><a href="#hoofdstuk-1" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>1. Mobiele Autosleutelservice in Midden-Nederland</a></li>
                  <li><a href="#hoofdstuk-2" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>2. Transponderchips &amp; Startonderbreking</a></li>
                  <li><a href="#hoofdstuk-3" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>3. Dealer vs. Autosleutel24 Slotenmaker</a></li>
                  <li><a href="#hoofdstuk-4" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>4. Procedure bij Volledig Sleutelverlies</a></li>
                  <li><a href="#hoofdstuk-5" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>5. Autosleutel Reparatie &amp; Batterijvervanging</a></li>
                  <li><a href="#hoofdstuk-6" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>6. Schadevergoeding &amp; Autoverzekering</a></li>
                  <li><a href="#hoofdstuk-7" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>7. OBD2 Diagnose &amp; Eeprom Flashing</a></li>
                  <li><a href="#hoofdstuk-8" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>8. CNC-Frezen van Noodsleutels</a></li>
                  <li><a href="#hoofdstuk-9" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>9. Immobiliser Foutcodes (DTC&apos;s)</a></li>
                  <li><a href="#hoofdstuk-10" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>10. Keyless Entry &amp; Relay Attack Voorkomen</a></li>
                  <li><a href="#hoofdstuk-11" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>11. Bedrijfswagens &amp; Fleet Service</a></li>
                  <li><a href="#hoofdstuk-12" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 600 }}>12. Kwaliteitsgarantie &amp; Recycling</a></li>
                </ul>
              </div>

              <section id="hoofdstuk-1" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  1. Mobiele Autosleutelservice in Midden-Nederland &amp; Het Gooi
                </h2>
                <p>
                  Autosleutel24 is dé gespecialiseerde mobiele autosecuriteitsdienst voor het direct ter plaatse bijmaken, programmeren en herstellen van autosleutels. Vanuit onze hoofdlocatie in Utrecht en onze strategische steunpunten bedienen wij een compact, razendsnel werkgebied binnen 30 kilometer rondom Utrecht Centrum en Het Gooi (Bussum, Hilversum, Naarden, Laren, Blaricum, Huizen). Daarnaast zijn onze gecertificeerde monteurs dagelijks actief in Amsterdam, Amstelveen, Diemen, Amersfoort, Almere, Zeist, Breukelen en Nieuwegein. Doordat wij uitsluitend opereren met volledig uitgeruste mobiele servicewagens, hoeft u uw voertuig nooit te laten wegslepen naar een dure merkdealer.
                </p>
                <p>
                  Onze mobiele werkplaatsen zijn voorzien van hightech computergestuurde sleutelfreesmachines en officiële OEM-diagnoseapparatuur. Hierdoor kunnen wij binnen 15 tot 30 minuten na uw oproep op uw locatie aanwezig zijn, of u nu thuis op de oprit staat, op uw werkplek, of gestrand bent op een openbare parkeerplaats langs de snelweg. Wij garanderen een 100% schadevrije werkwijze en leveren direct een geteste sleutel met volledige garantie.
                </p>
              </section>

              <section id="hoofdstuk-2" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  2. Transponderchips, Smart Keys &amp; Cryptografische Startonderbreking
                </h2>
                <p>
                  Moderne personenauto&apos;s en bedrijfswagens zijn sinds eind jaren &apos;90 uitgerust met een elektronische startonderbreker (immobilizer). In de behuizing van uw autosleutel bevindt zich een transponderchip of een geavanceerde smart key module. Wanneer u de sleutel in het contactslot steekt of de startknop indrukt, zendt de ringantenne rond het slot een elektromagnetisch signaal uit. De chip antwoordt met een unieke, versleutelde digitale code (zoals Hitag2, Hitag AES, Megamos Crypto ID48 of Texas Crypto 4D). Alleen wanneer de Motor Management Module (ECU) en de immobilizermodule deze code herkennen, wordt de brandstofpomp en ontsteking vrijgegeven.
                </p>
                <p>
                  Autosleutel24 beschikt over geavanceerde OBD2-programmeersoftware om rechtstreeks te communiceren met complexe beveiligingsmodules, waaronder BMW CAS/FEM/BDC-systemen, Volkswagen/Audi MQB-platforms, Renault Handsfree kaarten en Mercedes-Benz FBS3/FBS4 contactsloten (EZS/EIS). Wij lezen de unieke sleuteldata veilig uit en schrijven nieuwe sleutels direct in het geheugen van uw voertuig.
                </p>
              </section>

              <section id="hoofdstuk-3" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  3. Kostenvoordeel: Dealer versus Autosleutel24 Slotenmaker
                </h2>
                <p>
                  Wanneer u via een officiële merkdealer een nieuwe autosleutel aanvraagt, wordt u vaak geconfronteerd met lange wachttijden van twee tot drie weken omdat de sleutel op chassisnummer (VIN) besteld moet worden vanuit een centraal magazijn in Duitsland of Frankrijk. Bovendien liggen de totale tarieven bij merkdealers gemiddeld tussen de €350,- en €650,-, nog exclusief eventuele wegsleepkosten als u geen werkende sleutel meer heeft.
                </p>
                <p>
                  Bij Autosleutel24 bespaart u tot wel 50% op de totale kosten. Wij hebben sleutels voor meer dan 38 automerken standaard op voorraad in onze servicewagens. Wij slijpen het sleutelblad ter plaatse op maat en leren de transponder en afstandsbediening direct in. U betaalt een eerlijk, vooraf vastgesteld all-in tarief zonder verborgen kosten, inclusief montage, programmering en 12 maanden schriftelijke garantie.
                </p>
              </section>

              <section id="hoofdstuk-4" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  4. Procedure bij Volledig Sleutelverlies (All-Keys-Lost)
                </h2>
                <p>
                  Bent u al uw autosleutels kwijtgeraakt of zijn deze gestolen? Dan is een reguliere kopie niet meer mogelijk en treedt onze All-Keys-Lost noodprocedure in werking. Onze specialist opent uw autodeur allereerst 100% schadevrij met behulp van specialistisch gereedschap zoals Lishi 2-in-1 lockpicks. Met deze precisie-instrumenten kunnen wij de mechanische groeven en dieptes van uw slotcilinder exact uitlezen zonder krassen of braamschade aan het portier.
                </p>
                <p>
                  Vervolgens voeren wij deze mechanische slotcode in onze automatische CNC-sleutelmachine in, die binnen enkele seconden een gloednieuw sleutelblad freest. Daarna sluiten wij onze diagnoseapparatuur aan op de OBD2-poort om de oude, verloren sleutels definitief uit het geheugen van de immobilizer te wissen. Zo bent u ervan verzekerd dat een eventuele vinder of dief uw auto niet meer kan starten.
                </p>
              </section>

              <section id="hoofdstuk-5" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  5. Autosleutel Reparatie &amp; Batterijvervanging op Locatie
                </h2>
                <p>
                  Niet in alle gevallen is een compleet nieuwe sleutel nodig. Werkt uw afstandsbediening slecht, zijn de drukknopjes versleten, is de sleutelbehuizing gebarsten of klapt het sleutelblad niet meer uit? Onze monteurs voeren ook deskundige reparaties uit. Wij solderen losse microswitches op de printplaat opnieuw vast, vervangen beschadigde behuizingen door stevige OEM-kwaliteit sleutelbehuizingen en vernieuwen defecte transponderspoelen.
                </p>
                <p>
                  Daarnaast vervangen wij alle typen sleutelbatterijen, van reguliere CR2032 en CR2025 lithium knoopcellen tot oplaadbare VL2020 accu&apos;s die vastgesoldeerd zitten op de printplaat van onder andere BMW en Ford sleutels. Na reparatie testen wij de zendfrequentie (433 MHz of 868 MHz) met een professionele frequentiemeter.
                </p>
              </section>

              <section id="hoofdstuk-6" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  6. Schadevergoeding &amp; Autoverzekering in Nederland
                </h2>
                <p>
                  In veel situaties wordt het vervangen of bijmaken van een autosleutel na diefstal of verlies (gedeeltelijk) vergoed door uw autoverzekeraar, afhankelijk van uw polisvoorwaarden (Beperkt Casco of All-Risk / Volledig Casco). Verzekeraars stellen bij verlies of diefstal vrijwel altijd als harde eis dat de verloren sleutels elektronisch worden uitgeleerd en dat u een officiële factuur kunt overleggen waarop staat gespecificeerd dat de startonderbreker opnieuw is gecodeerd.
                </p>
                <p>
                  Autosleutel24 is een erkend en volledig gecertificeerd slotenmakersbedrijf. Na afloop van onze werkzaamheden ontvangt u direct een gedetailleerde, officiële BTW-factuur en een digitaal rapport van de herprogrammering. Deze documenten kunt u rechtstreeks indienen bij uw verzekeringsmaatschappij voor een snelle en vlekkeloze schadeafhandeling.
                </p>
              </section>

              <section id="hoofdstuk-7" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  7. OBD2 Diagnose, Eeprom Programmering &amp; Bench Flash Technieken
                </h2>
                <p>
                  Voor het programmeren van autosleutels maken wij gebruik van de meest geavanceerde diagnose- en programmeertools op de markt, zoals Autel MaxiIM IM608 Pro II, Xhorse VVDI Key Tool Plus, Abrites AVDI en OBDStar X300 DP Plus. In 90% van de gevallen kunnen wij nieuwe sleutels direct via de standaard OBD2-diagnosepoort onder het dashboard inleren. Hierbij communiceren wij op fabrieksniveau met de Engine Control Unit (ECU), Body Control Module (BCM) of Instrumentenpaneel om de beveiligingscodes en pincodes veilig uit te lezen.
                </p>
                <p>
                  Bij bepaalde voertuigen waarbij de fabrikant de OBD2-poort heeft beveiligd met een Security Gateway (SGW) of waarbij sprake is van een complexe All-Keys-Lost situatie (zoals bij oudere Volvo CEM-modules of specifieke BMW CAS4+ systemen), passen wij specialistische Eeprom- of Bench-programmering toe. Hierbij lezen wij de geheugenchip van de startonderbrekermodule rechtstreeks uit in onze mobiele werkplaats zonder dat er regelapparaten beschadigd raken.
                </p>
              </section>

              <section id="hoofdstuk-8" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  8. Slijpen en CNC-Frezen van Noodsleutels (Laser Cut &amp; High Security Sleutelbaarden)
                </h2>
                <p>
                  Een autosleutel bestaat niet alleen uit elektronica; het mechanische sleutelblad blijft cruciaal om het contactslot te draaien of om bij een lege autoaccu het portierslot handmatig te openen. Onze mobiele servicewagens zijn uitgerust met computergestuurde CNC-sleutel- en lasermachines van topkwaliteit (zoals de Xhorse Condor XC-Mini en Dolphin II).
                </p>
                <p>
                  Dankzij onze digitale database met fabriekscodes kunnen wij sleutelbaarden frezen met microscopische precisie op basis van het sleutelnummer of door het decoderen van uw bestaande slotcilinder. Of het nu gaat om een conventionele kartelsleutel, een binnenbaansleutel (laser cut key) of een High Security HU66/HU162T profiel voor de VAG-groep: het mechanische snijwerk is altijd inbegrepen en past honderd procent soepel in uw sloten.
                </p>
              </section>

              <section id="hoofdstuk-9" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  9. Veelvoorkomende Foutcodes in de Startonderbreker (Immobiliser DTC&apos;s &amp; Oplossingen)
                </h2>
                <p>
                  Wanneer uw auto niet start en het sleutelsymbool op uw dashboard snel knippert of blijft branden, wijst dit op een storing in de immobiliser. Veelvoorkomende foutcodes die wij dagelijks op locatie diagnosticeren en verhelpen zijn onder meer P1570 (Engine Control Module Disabled door Immobilizer bij Volkswagen/Audi), B1000/B1001 (Elektronisch stuurslot ELV/ESL storing bij Mercedes-Benz) en P1610/P1612 (Lock Mode of NATS communicatiefout bij Nissan en Renault).
                </p>
                <p>
                  Onze monteurs voeren eerst een volledige systeemdiagnose uit om te bepalen of het probleem in de transponderchip van uw sleutel zit, in de leesspoel (ringantenne) rond het contactslot, of in de synchronisatie tussen de sleutel en de motorcomputer. Wij resetten de startblokkering en synchroniseren de rolling codes direct ter plaatse.
                </p>
              </section>

              <section id="hoofdstuk-10" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  10. Keyless Entry &amp; Keyless Go Beveiliging: Relay Attack Voorkomen
                </h2>
                <p>
                  Auto&apos;s met een Keyless Entry of Keyless Go systeem bieden maximaal comfort omdat u de sleutel in uw broekzak of tas kunt houden om de deuren te ontgrendelen en de motor te starten. Helaas zijn deze systemen zonder de juiste maatregelen gevoeliger voor zogenaamde &apos;Relay Attacks&apos;, waarbij autodieven het signaal van uw sleutel binnenshuis opvangen en versterken naar uw auto op de oprit.
                </p>
                <p>
                  Wanneer wij een nieuwe Smart Key voor uw voertuig inleren, leveren wij uitsluitend sleutels met moderne motion-sensor technologie (sleep mode chip) die na 60 seconden stilstand automatisch stopt met het uitzenden van signalen. Bovendien adviseren wij onze klanten en kunnen wij optioneel extra elektronische beveiligingen of OBD-lockers installeren om ongeautoriseerd uitlezen te blokkeren.
                </p>
              </section>

              <section id="hoofdstuk-11" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  11. Bedrijfswagen, Bestelbus &amp; Fleet Sleutelservice op Locatie
                </h2>
                <p>
                  Voor ondernemers, koeriers en wagenparkbeheerders is stilstand van een bedrijfswagen funest voor de dagelijkse bedrijfsvoering. Bent u de sleutel kwijt van uw Mercedes-Benz Sprinter, Volkswagen Transporter, Ford Transit, Renault Master, Opel Vivaro of Peugeot Boxer? Wij begrijpen dat u geen weken kunt wachten op een merkdealer.
                </p>
                <p>
                  Autosleutel24 biedt een speciale zakelijke prioriteitsservice. Wij komen direct naar uw bouwplaats, distributiecentrum of kantoorpand om extra reservesleutels bij te maken of een verloren sleutel te vervangen. Wij leveren robuuste sleutels die bestand zijn tegen intensief commercieel gebruik en kunnen desgewenst meerdere voertuigen binnen één afspraak voorzien van reservesleutels.
                </p>
              </section>

              <section id="hoofdstuk-12" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.7rem', color: '#0f172a', marginBottom: '1rem' }}>
                  12. Kwaliteitsgarantie, CE-Gecertificeerde Transponders &amp; Milieubewustzijn
                </h2>
                <p>
                  Wij doen nooit concessies aan kwaliteit. Al onze sleutelbehuizingen, transponderchips, afstandsbedieningsprintplaten en knoopcelbatterijen voldoen strikt aan de Europese CE- en RoHS-richtlijnen en zijn kwalitatief gelijkwaardig aan of beter dan de originele fabrieksonderdelen. U ontvangt standaard 12 maanden volledige schriftelijke garantie op zowel het mechanische sleutelblad als de elektronische werking van de chip en zender.
                </p>
                <p>
                  Daarnaast werken wij milieubewust: oude en defecte sleutels die wij vervangen worden niet weggegooid, maar vakkundig gerecycled waarbij hoogwaardige edelmetalen en lithiumbatterijen op een verantwoorde manier worden verwerkt via gecertificeerde recyclingpartners in Nederland.
                </p>
              </section>

              {/* Call to action card inside guide */}
              <div style={{ background: 'var(--navy-900)', color: '#fff', padding: '3rem 2rem', borderRadius: '16px', textAlign: 'center', marginTop: '4rem' }}>
                <h3 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '1rem' }}>Direct Hulp Nodig of Vragen over Uw Autosleutel?</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.6 }}>
                  Onze monteurs staan dag en nacht klaar om u op locatie in heel Nederland te helpen met het bijmaken, inleren of programmeren van uw autosleutel.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg">
                    📞 Bel Direct: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wa-btn" style={{ background: '#25d366', color: '#fff', padding: '0.85rem 2rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
                    💬 WhatsApp Direct
                  </a>
                </div>
              </div>

            </article>
          </div>
        </section>
      </main>
    </>
  );
}
