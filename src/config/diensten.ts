// ============================================================
// DIENSTEN CONFIG — Service pages
// ============================================================
import { SITE_CONFIG } from '@/config/site.config';
export type Service = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  h1: string;
  intro: string;
  system?: string;
  /**
   * A complete, self-contained answer to the query the page targets, in two or
   * three sentences with the price and the time in them.
   *
   * Rendered as the first block on the page. Large language models and Google's
   * featured snippets both quote a passage that answers the question on its own;
   * marketing copy that builds up to the point does not get quoted. It is also
   * what differentiates these pages from each other — before this, the service
   * pages shared 77–79% of their wording.
   */
  directAnswer?: string;
  priceFrom?: string;
  duration?: string;
  steps: string[];
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
};

export const DIENSTEN: Service[] = [
  // ── 1. AUTODEUR OPENEN ─────────────────────────────────────
  {
    // NOTE: the actual page at /diensten/auto-openen-zonder-sleutel is served by the
    // static route src/app/diensten/auto-openen-zonder-sleutel/page.tsx, which Next.js
    // resolves in preference to the dynamic [slug] route below for the same path.
    // Only `slug`, `title` and `metaDesc` from this entry are ever read (by sitemap.ts,
    // the /diensten index, the homepage services grid, and internal-link sections) —
    // the other fields here are never rendered. Keep them in sync with the static page
    // anyway so this entry stays a faithful reference, but know that editing them will
    // NOT change the live page; edit the static route file instead.
    slug: 'auto-openen-zonder-sleutel',
    title: 'Autodeur Openen',
    metaTitle: 'Autodeur Openen Zonder Sleutel | Schadevrij & 24/7 Mobiel',
    metaDesc: 'Autodeur openen zonder sleutel? Wij openen uw auto 100% schadevrij op locatie. Gemiddeld binnen 30 min ter plaatse in Utrecht & Amsterdam. Bel direct!',
    h1: 'Autodeur Openen Zonder Sleutel — Mobiel & Schadevrij ter Plaatse',
    intro: 'Buitengesloten of sleutel in de auto? Wij openen uw autodeur 100% schadevrij, gemiddeld binnen 30 min ter plaatse.',
    system: 'Lishi Lock Decoders / Over-the-shoulder tools',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.unlock}`,
    duration: '15–30 minuten',
    directAnswer:
      'Een auto openen zonder sleutel kost bij Autosleutel24 vanaf €149 en duurt gemiddeld 15 tot 30 minuten. Wij openen 100% schadevrij met professioneel gereedschap — het slot, de ruit en de elektronica blijven intact. Een monteur is doorgaans binnen 30 tot 60 minuten bij u ter plaatse, 24 uur per dag.',
    steps: [
      'U neemt contact op via telefoon of WhatsApp en geeft uw locatie en automodel door',
      'Onze mobiele specialist rijdt direct naar uw locatie',
      'Identiteitscontrole: we controleren of u de rechtmatige eigenaar bent',
      'De autodeur wordt schadevrij geopend met speciaal locksmith gereedschap',
      'U ontvangt direct een officiële, verzekeringsklare factuur'
    ],
    faq: [
      { q: 'Beschadigt u mijn auto bij het openen?', a: 'Nee. Wij gebruiken uitsluitend professioneel lockpick- en decoderegereedschap (zoals Lishi tools) dat speciaal voor uw autotype is ontworpen. Hierdoor openen we uw deur 100% schadevrij, zonder krassen of deuken.' },
      { q: 'Hoe snel kunt u mijn autodeur openen?', a: 'Onze mobiele bussen rijden door de hele regio Utrecht en Amsterdam. We zijn gemiddeld binnen 30 minuten ter plaatse.' },
      { q: 'Kan elke auto schadevrij worden geopend?', a: 'Ja, wij kunnen vrijwel alle automerken en modellen schadevrij openen, inclusief auto\'s met dubbele vergrendeling (deadlock systemen) zoals BMW, Audi en Volkswagen.' }
    ],
    relatedSlugs: ['sleutel-in-auto', 'deur-dichtgevallen', 'kofferbak-openen', 'sleutel-afgebroken-in-slot']
  },
  {
    slug: 'sleutel-in-auto',
    title: 'Sleutel in Auto',
    metaTitle: 'Sleutel in Auto Laten Liggen? | Auto Schadevrij Openen | 24/7 Mobiel',
    metaDesc: 'Autosleutel in de auto laten liggen en deuren op slot? Wij openen uw gesloten auto 100% schadevrij op locatie. 24/7 spoedhulp. Bel nu!',
    h1: 'Sleutel in Auto Laten Liggen? — Wij Openen Uw Auto Schadevrij',
    intro: 'Sleutel in de auto laten liggen? Geen paniek — wij openen uw auto ter plaatse zonder enige schade.',
    system: 'Lishi HU66, HU92, HU101, HU162T Decoders',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.unlock}`,
    duration: '15–30 minuten',
    directAnswer:
      'Ligt uw sleutel in de auto en zit de deur op slot? Wij openen de auto zonder de sleutel te beschadigen, vanaf €149 en meestal binnen 15 tot 30 minuten ter plaatse. Belangrijk: probeer het niet zelf met een draad of wig — bij moderne auto\'s ligt de zijairbag in het portier, en schade daaraan kost al snel meer dan de opening zelf.',
    steps: [
      'Bel direct en leg de situatie uit',
      'Onze mobiele bus komt direct naar uw locatie in Utrecht of Amsterdam',
      'Wij decoderen de slotcilinder om de auto elektronisch te ontgrendelen',
      'U heeft uw sleutel weer terug zonder sleepkosten of dealer-tarieven'
    ],
    faq: [
      { q: 'Hoe opent u een auto met de sleutel er nog in?', a: 'Wij maken gebruik van mechanische decoders (Lishi) die de slotplaatjes in de cilinder één voor één uitlijnen, alsof de originele sleutel wordt omgedraaid. Dit voorkomt dat we ramen hoeven in te slaan of deurrubbers beschadigen.' },
      { q: 'Werkt dit ook als de accu van de auto leeg is?', a: 'Ja. Zelfs bij een lege accu kunnen wij de auto mechanisch openen via de noodcilinder in de handgreep.' },
      { q: 'Mijn kind of hond zit in de auto — wat nu?', a: 'Bel direct 112. Hulpdiensten mogen bij acuut gevaar onmiddellijk handelen en hoeven niet op een slotenmaker te wachten. Bel ons daarna gerust voor het herstel.' },
      { q: 'Kan de auto geopend worden als de motor draait?', a: 'Ja. Een draaiende motor met de sleutel binnen is een veelvoorkomende situatie en verandert de werkwijze niet; wij openen het portier op dezelfde schadevrije manier.' },
      { q: 'Wat als de sleutel in de kofferbak ligt in plaats van voorin?', a: 'Dat vraagt een andere aanpak, omdat de kofferbak vaak geen mechanisch slot meer heeft. Meld het bij het bellen, dan brengt de monteur direct het juiste gereedschap mee.' }
    ],
    relatedSlugs: ['auto-openen-zonder-sleutel', 'deur-dichtgevallen', 'kofferbak-openen', 'noodopening-auto']
  },
  {
    slug: 'deur-dichtgevallen',
    title: 'Deur Dichtgevallen',
    metaTitle: 'Autodeur Dichtgevallen met Sleutel erin? | Snel Geopend | 24/7',
    metaDesc: 'Deur van de auto dichtgevallen en de sleutel ligt binnen? Onze mobiele locksmith opent uw deur schadevrij. 24/7 Utrecht & Amsterdam.',
    h1: 'Autodeur Dichtgevallen met Sleutel erin? — Direct Geopend',
    intro: 'Autodeur dichtgevallen? Onze mobiele slotenmakers zijn 24/7 stand-by en openen uw auto schadevrij.',
    system: 'Professional Locksmith Bypass Tools',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.unlock}`,
    duration: '15–30 minuten',
    directAnswer:
      'Een dichtgevallen autodeur openen wij vanaf €149, gemiddeld binnen 15 tot 30 minuten. Dit gebeurt meestal door de auto-relock functie: veel auto\'s vergrendelen zichzelf automatisch als de sleutel een tijd buiten bereik van de antenne blijft. Uw bestaande sleutels blijven na de opening gewoon werken — het slot hoeft niet vervangen te worden.',
    steps: [
      'Bel ons storingsnummer voor directe hulp',
      'We sturen de dichtstbijzijnde monteur naar u toe',
      'Schadevrije opening via de deurgreep of slotcilinder',
      'U kunt uw weg direct vervolgen'
    ],
    faq: [
      { q: 'Waarom gaat een auto zomaar op slot als de deur dichtvalt?', a: 'Veel moderne auto\'s hebben een automatische vergrendelingsfunctie (auto-relock) die geactiveerd wordt na een bepaalde tijd of als de sleutel buiten het bereik van de startonderbreker-antenne ligt.' },
      { q: 'Moet ik mijn deurslot achteraf vervangen?', a: 'Nee, onze technieken laten het deurslot en de elektronica volledig intact. U kunt uw bestaande sleutels gewoon blijven gebruiken.' },
      { q: 'Kan ik de deur zelf openen met een wig of een draad?', a: 'Wij raden het af. In vrijwel elk modern portier zit een zijairbag met bijbehorende bedrading, en de ruitgeleiding is van kunststof. Schade daaraan loopt snel op tot enkele honderden euro\'s — meer dan de opening zelf kost.' },
      { q: 'Werkt mijn sleutel na de opening nog gewoon?', a: 'Ja. Wij openen mechanisch of via de bestaande elektronica; er wordt niets uit het geheugen gewist en er wordt geen slot vervangen. Al uw sleutels blijven werken zoals daarvoor.' },
      { q: 'Hoe voorkom ik dat dit nog een keer gebeurt?', a: 'De meeste auto\'s laten de auto-relock functie uitschakelen via het instrumentenmenu of door de dealer. Een reservesleutel die u niet in de auto bewaart is echter de goedkoopste verzekering.' }
    ],
    relatedSlugs: ['auto-openen-zonder-sleutel', 'sleutel-in-auto', 'kofferbak-openen', 'sleutel-afgebroken-in-slot']
  },
  {
    slug: 'kofferbak-openen',
    title: 'Kofferbak Openen',
    metaTitle: 'Sleutel in Kofferbak Laten Liggen? | Schadevrij Openen | 24/7',
    metaDesc: 'Autosleutel in de kofferbak laten liggen en de auto zit op slot? Wij openen uw kofferbak 100% schadevrij op locatie. Bel nu voor spoedhulp!',
    h1: 'Kofferbak Openen Zonder Sleutel — Snel & Schadevrij ter Plaatse',
    intro: 'Sleutel in de kofferbak en auto op slot? Wij openen uw kofferbak 100% schadevrij — ook bij deadlock-systemen.',
    system: 'Lishi Laser Picks & OBD electronic triggers',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.unlock}`,
    duration: '20–45 minuten',
    directAnswer:
      'Een geblokkeerde kofferbak openen wij vanaf €149, meestal binnen 20 tot 40 minuten. De kofferbak is technisch lastiger dan een portier: er zit vaak geen mechanisch slot meer op en de vergrendeling loopt volledig via de carrosseriemodule. Wij openen via de achterbank, de noodontgrendeling of het elektronische circuit — zonder de bekleding of het slot te beschadigen.',
    steps: [
      'U belt ons en meldt dat de sleutel in de kofferbak ligt',
      'Onze specialist komt ter plaatse en inspecteert het voertuig',
      'De auto wordt via het portierslot of de kofferbakcilinder geopend',
      'U heeft uw sleutel direct weer in handen'
    ],
    faq: [
      { q: 'Waarom is een kofferbak openen moeilijker dan een portier?', a: 'Bij veel auto\'s (vooral sedans en premium merken zoals BMW of Audi) schakelt de centrale vergrendelingsknop op het dashboard uit als de auto op slot zit. Hierdoor moeten we de kofferbak mechanisch manipuleren of de module direct via de OBD-poort triggeren.' },
      { q: 'Kan de kofferbak open zonder schade aan de lak of het slot?', a: 'Ja, 100% gegarandeerd. We gebruiken laser lockpicks die de lak en cilinder absoluut niet beschadigen.' },
      { q: 'Waarom is de kofferbak duurder of lastiger dan een portier?', a: 'Bij veel moderne auto\'s is het mechanische kofferslot vervallen en loopt de vergrendeling volledig elektronisch via de carrosseriemodule. Er is dus geen cilinder om te manipuleren, waardoor een andere route nodig is.' },
      { q: 'Kan de kofferbak open zonder de achterbank te beschadigen?', a: 'Ja. Waar mogelijk gebruiken wij de noodontgrendeling of de doorlaat achter de achterbank; die is juist voor dit doel gemaakt. De bekleding wordt niet doorgesneden.' },
      { q: 'Mijn kofferbak gaat niet meer open terwijl ik de sleutel wél heb.', a: 'Dan is het meestal het slotmechanisme of de microschakelaar in de klep, niet de sleutel. Wij openen de klep en kunnen het mechanisme in dezelfde afspraak vervangen.' }
    ],
    relatedSlugs: ['auto-openen-zonder-sleutel', 'sleutel-in-auto', 'deur-dichtgevallen', 'sleutel-afgebroken-in-slot']
  },
  {
    slug: 'sleutel-afgebroken-in-slot',
    title: 'Sleutel Afgebroken in Slot',
    metaTitle: 'Autosleutel Afgebroken in Slot of Contact? | Verwijderen & Nieuwe Sleutel',
    metaDesc: 'Autosleutel afgebroken in het deurslot of contactslot? Wij halen de afgebroken sleutel schadevrij uit het slot en maken direct een nieuwe sleutel ter plaatse.',
    h1: 'Autosleutel Afgebroken in Slot of Contactslot? — Wij Lossen Het Op',
    intro: 'Sleutel afgebroken in het slot? Niet zelf peuteren — wij verwijderen het schadevrij en snijden direct een nieuwe sleutel op locatie.',
    system: 'Professional Key Extractors & CNC Computerized Key Cutters',
    priceFrom: 'Vanaf €120',
    duration: '30–60 minuten',
    directAnswer:
      'Een afgebroken sleutel uit het slot verwijderen kost vanaf €149 en duurt 20 tot 45 minuten. Wij trekken het afgebroken deel met extractiegereedschap uit de cilinder, zonder het slot te slopen. Duw het restant nooit verder naar binnen: dan beschadigen de lamellen en moet de complete cilinder vervangen worden, wat de kosten fors verhoogt.',
    steps: [
      'Bel ons en meld dat de sleutel is afgebroken',
      'Wij komen met een mobiele werkplaats naar u toe',
      'Met extractie-tools halen we het afgebroken deel schadevrij uit de cilinder',
      'Op basis van de twee helften snijden we een nieuwe sleutelbaard met onze CNC-machine',
      'De nieuwe sleutel wordt geprogrammeerd en getest'
    ],
    faq: [
      { q: 'Kan een afgebroken sleutel altijd uit het contactslot worden gehaald?', a: 'Ja, in 99% van de gevallen kunnen we het afgebroken deel met speciale extractiesleutels en micro-haken verwijderen zonder het complete contactslot te hoeven vervangen.' },
      { q: 'Krijg ik direct een nieuwe sleutel?', a: 'Ja. Onze mobiele bus is uitgerust met een computergestuurde CNC-sleutelmachine waarmee we de sleutelbaard ter plaatse nauwkeurig namaken.' }
    ],
    relatedSlugs: ['auto-openen-zonder-sleutel', 'sleutel-bijmaken', 'contactslot-auto-vervangen', 'autosleutels-repareren']
  },
  {
    slug: 'alle-sleutels-kwijt-auto',
    title: 'Autosleutel Kwijt',
    metaTitle: 'Alle Autosleutels Kwijt? | AKL Specialist op Locatie | 24/7',
    metaDesc: 'Alle autosleutels kwijt? Laat uw auto niet wegslepen naar de dealer! Wij maken nieuwe sleutels ter plaatse op locatie. Inclusief programmering. Bel nu!',
    h1: 'Alle Autosleutels Kwijt? — Mobiele Sleutelmaker ter Plaatse',
    intro: 'Alle sleutels kwijt? Geen sleeptruck nodig — wij programmeren nieuwe sleutels vandaag nog direct bij uw auto op locatie.',
    system: 'All Keys Lost (AKL) bypass software, EEPROM programmering, MCU data reading, OBD key writing',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.allKeysLost}`,
    duration: '60–180 minuten',
    directAnswer:
      'Alle sleutels kwijt (All Keys Lost) lossen wij ter plaatse op vanaf €299, meestal binnen 60 tot 120 minuten. Wij openen de auto, lezen de sleutelcode uit de boordcomputer, frezen een nieuwe sleutel en leren die in. De verloren sleutels worden daarbij uit het geheugen gewist, zodat er met de oude sleutels niet meer gestart kan worden.',
    steps: [
      'We verifiëren uw identiteit en eigendomspapieren',
      'De auto wordt schadevrij geopend',
      'De mechanische sleutelcode wordt uitgesleuteld of gelezen uit de slotcilinder',
      'De ECU of startmodule (zoals BMW BDC of Mercedes EIS) wordt uitgelezen',
      'Nieuwe transpondersleutels worden direct in het geheugen geschreven',
      'De verloren sleutels worden definitief geblokkeerd'
    ],
    faq: [
      { q: 'Moet de auto worden weggesleept als ik alle sleutels kwijt ben?', a: 'Nee. In tegenstelling tot de dealer (die vaak de auto in hun werkplaats wil hebben) doen wij alles op de plek waar de auto geparkeerd staat. Dit bespaart u dure sleepkosten.' },
      { q: 'Kan dit voor elk automerk?', a: 'Wij kunnen reservesleutels maken bij verlies van alle sleutels voor 98% van de merken op de weg, inclusief complexe VAG MQB48 (VW Golf 8, Audi A3 8Y) en Mercedes FBS3 systemen.' }
    ],
    relatedSlugs: ['autosleutel-kwijt', 'sleutel-bijmaken', 'smart-key-programmeren', 'contactslot-auto-vervangen']
  },


  // ── 2. AUTOSLEUTEL BIJMAKEN ───────────────────────────────
  {
    slug: 'sleutel-bijmaken',
    title: 'Autosleutel Bijmaken',
    metaTitle: 'Autosleutel Bijmaken | Reserve Autosleutel Namaken | 12 Mnd Garantie',
    metaDesc: 'Autosleutel bijmaken op locatie? Reserve sleutel programmeren voor alle merken. Goedkoper dan de dealer, direct klaar met 12 maanden garantie. Bel nu!',
    h1: 'Autosleutel Bijmaken & Programmeren — Mobiele Service op Locatie',
    intro: 'Reservesleutel laten maken? Wij programmeren een nieuwe sleutel op locatie voor alle merken — goedkoper dan de dealer, 12 mnd garantie.',
    system: 'AVDI, Lonsdor K518, VVDI, Autel IM608 Pro',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.transponder}`,
    duration: '30–60 minuten',
    directAnswer:
      'Een autosleutel bijmaken kost bij Autosleutel24 vanaf €149 voor een transpondersleutel en vanaf €249 voor een smart key. Wij komen naar u toe en het werk duurt gemiddeld 30 tot 60 minuten. U hoeft niet naar de dealer en betaalt doorgaans tot 50% minder, met 12 maanden garantie op sleutel en programmering.',
    steps: [
      'Geef uw merk, model en bouwjaar door via telefoon of WhatsApp',
      'Wij plannen een moment in dat u uitkomt op uw locatie',
      'We snijden de sleutelbaard op maat met een CNC-computergestuurde machine',
      'We programmeren de transponder en afstandsbediening via de OBD-diagnosepoort',
      'Volledige test van alle functies (deuren, kofferbak, motor starten)'
    ],
    faq: [
      { q: 'Wat kost een autosleutel bijmaken bij jullie?', a: 'Een standaard transpondersleutel begint bij €149. Een klapsleutel met afstandsbediening kost gemiddeld €199 tot €349. Een Smart Key is beschikbaar vanaf €249. Dit is gemiddeld 30% tot 50% goedkoper dan de officiële dealer.' },
      { q: 'Krijg ik garantie op de nieuwe autosleutel?', a: 'Ja, u ontvangt 12 maanden volledige garantie op de programmering en de elektronische componenten van de sleutel.' },
      { q: 'Moet ik met de auto langskomen?', a: 'Nee. Onze specialist komt met een volledig uitgeruste mobiele werkplaats naar u toe in Utrecht of Amsterdam.' }
    ],
    relatedSlugs: ['transponder-programmeren', 'afstandsbediening-bijmaken', 'smart-key-programmeren', 'reservesleutel-maken']
  },
  {
    slug: 'transponder-programmeren',
    title: 'Transponder Programmeren',
    metaTitle: 'Transponder Sleutel Programmeren | Startonderbreker Chip Inleren',
    metaDesc: 'Transponder sleutel programmeren op locatie. Specialist in Megamos ID48, PCF7936, Hitag Pro & DST-AES chips. 12 maanden garantie. Bel nu!',
    h1: 'Transponder Sleutel Programmeren — Immo & Chip Inleren',
    intro: 'Transponder chip kapot of niet herkend? Wij schrijven de chip direct in de boordcomputer van uw voertuig — motor start gegarandeerd.',
    system: 'Megamos ID48, NXP PCF7935 / PCF7936 / PCF7945 / PCF7953, Hitag 2 / 3 / Pro, DST40 / DST80 / DST-AES',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.unlock}`,
    duration: '30–60 minuten',
    directAnswer:
      'Een transpondersleutel programmeren kost vanaf €149 en duurt 20 tot 40 minuten op locatie. De transponder is de chip in de sleutelkop die met de startonderbreker communiceert; zonder correcte programmering opent de auto wel, maar start hij niet. Wij lezen de startonderbreker via de OBD-poort uit en leren de chip in.',
    steps: [
      'We lezen het startonderbreker-systeem uit met OBD-diagnosetools',
      'De juiste transponderchip (zoals ID48 of PCF7936) wordt geselecteerd',
      'De chip wordt gekoppeld aan de ECU/Immobilizer van uw voertuig',
      'De motorstart wordt gecontroleerd om de startonderbreking te verifiëren'
    ],
    faq: [
      { q: 'Kan een defecte transponder chip worden vervangen?', a: 'Ja. Als uw auto de sleutel niet meer herkent (vaak knippert er dan een sleutellampje op het dashboard), kunnen wij de oude chip deprogrammeren en een nieuwe transponder inlezen.' },
      { q: 'Welke transponder chips ondersteunt u?', a: 'Wij ondersteunen alle gangbare chips waaronder de Megamos ID48 (Audi/VW), NXP Hitag Pro (BMW/Opel), Texas Instruments DST-AES (Toyota) en de PCF7936.' }
    ],
    relatedSlugs: ['sleutel-bijmaken', 'smart-key-programmeren', 'afstandsbediening-bijmaken', 'contactslot-auto-vervangen']
  },
  {
    slug: 'afstandsbediening-bijmaken',
    title: 'Afstandsbediening Bijmaken',
    metaTitle: 'Prijs Autosleutel Bijmaken met Afstandsbediening | Vanaf €120',
    metaDesc: 'Wat is de prijs autosleutel bijmaken met afstandsbediening? Bekijk onze tarieven. Wij programmeren elk type autosleutel op locatie. 12 mnd garantie.',
    h1: 'Wat is de Prijs Autosleutel Bijmaken met Afstandsbediening?',
    intro: 'Afstandsbediening bijmaken of sleutel met knoppen? Wij programmeren ter plaatse voor alle merken — goedkoper dan de dealer.',
    system: 'ASK / FSK Rolling Code, NXP PCF7946 / PCF7961, Hitag2, 315MHz / 433MHz / 868MHz',
    priceFrom: 'Vanaf €120',
    duration: '30–60 minuten',
    directAnswer:
      'Een afstandsbediening bijmaken of vervangen kost vanaf €220 en duurt 20 tot 40 minuten. Werkt uw centrale vergrendeling niet meer terwijl de auto wel start? Dan is meestal alleen het zendgedeelte defect en hoeft de sleutel zelf niet vervangen te worden — dat scheelt aanzienlijk in de kosten.',
    steps: [
      'U vraagt de prijs op voor uw specifieke type autosleutel',
      'Wij snijden de sleutelbaard (mechanische sleutels) op maat',
      'De afstandsbediening wordt gesynchroniseerd met de boordcomputer (BCM)',
      'Centrale vergrendeling en eventuele knoppen worden geconfigureerd en getest'
    ],
    faq: [
      { q: 'Waarom werkt de afstandsbediening soms niet na het vervangen van de batterij?', a: 'Soms verliest een sleutel de synchronisatie als de batterij te lang leeg is geweest. Wij kunnen deze snel weer inleren op uw auto.' },
      { q: 'Zijn de afstandsbedieningen die u levert origineel?', a: 'Wij leveren zowel originele OEM-sleutels als hoge kwaliteit aftermarket alternatieven. U heeft de keuze en krijgt altijd 12 maanden garantie.' }
    ],
    relatedSlugs: ['sleutel-bijmaken', 'smart-key-programmeren', 'transponder-programmeren', 'batterij-vervangen']
  },
  {
    slug: 'smart-key-programmeren',
    title: 'Smart Key / Keyless Entry Programmeren',
    metaTitle: 'Smart Key Programmeren | Keyless Go & Proximity Sleutels',
    metaDesc: 'Keyless entry & smart keys programmeren op locatie. Specialist in BMW CAS4/FEM/BDC, VAG MQB, Mercedes FBS3/FBS4. 12 maanden garantie. Bel!',
    h1: 'Smart Key & Keyless Entry Programmeren — Proximity Specialist',
    intro: 'Smart key of keyless entry programmeren? Wij werken met dealer-niveau apparatuur voor BMW, Mercedes en VAG op locatie.',
    system: 'BMW CAS4+ / FEM / BDC / BDC2, Mercedes-Benz FBS3 / FBS4 / EIS / ELV, VAG MQB / MQB48 / MLB / SFD, JLR KVM / RFA / BCM',
    priceFrom: 'Vanaf €180',
    duration: '45–90 minuten',
    directAnswer:
      'Een smart key of keyless-entry sleutel programmeren kost vanaf €249 en duurt 30 tot 60 minuten. Bij keyless systemen wisselen sleutel en auto een rollende code uit, wat zwaardere apparatuur vereist dan bij een gewone transponder. Wij programmeren op locatie en wissen daarbij desgewenst verloren sleutels uit het geheugen.',
    steps: [
      'OBD diagnostics verbinding opzetten met de startcomputer',
      'Bestaande sleutels controleren en synchroniseren',
      'Proximity transponder inleren via de ringantenne',
      'Keyless-Go (starten zonder sleutel in de lader) en Keyless Entry testen'
    ],
    faq: [
      { q: 'Wat is het verschil tussen FBS3 en FBS4 bij Mercedes?', a: 'FBS3 is de oudere generatie (inleersleutels via infrarood). FBS4 is de nieuwste generatie (2014+). Wij hebben speciale hardware (zoals G-Box 3 en AVDI) om ook complexe FBS3-systemen en specifieke FBS4-sleutels succesvol te programmeren.' },
      { q: 'Kan een verloren Keyless sleutel worden misbruikt?', a: 'Nee. Bij het inleren van de nieuwe smart key wissen wij de verloren of gestolen sleutel direct uit het geheugen van het voertuig. De verloren sleutel kan de auto dan niet meer openen of starten.' }
    ],
    relatedSlugs: ['sleutel-bijmaken', 'transponder-programmeren', 'afstandsbediening-bijmaken']
  },
  {
    slug: 'reservesleutel-maken',
    title: 'Reservesleutel Laten Maken',
    metaTitle: 'Reservesleutel Auto Laten Maken | 12 Maanden Garantie | Mobiel',
    metaDesc: 'Extra reservesleutel voor uw auto laten maken? Wij programmeren reservesleutels voor alle merken op locatie. Goedkoper dan dealer. Bel nu!',
    h1: 'Reservesleutel Auto Laten Maken — Voorkom Hoge Sleepkosten',
    intro: 'Nog maar één sleutel? Wij komen naar u toe en maken direct een reservesleutel — bescherm uzelf tegen dure All Keys Lost situaties.',
    system: 'Transponder Cloners / OBD programming tools',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.unlock}`,
    duration: '30–60 minuten',
    directAnswer:
      'Een reservesleutel laten maken kost vanaf €149 en duurt 30 tot 60 minuten bij u op locatie. Zolang u nog één werkende sleutel heeft is dit de goedkoopste route. Bent u álle sleutels kwijt, dan is een All Keys Lost procedure nodig en liggen de kosten vanaf €299 — een tweede sleutel op tijd laten maken scheelt dus honderden euro\'s.',
    steps: [
      'U kiest of u een eenvoudige reservesleutel (zonder knoppen) of een afstandsbediening wilt',
      'We slijpen de mechanische sleutel op basis van uw huidige sleutel',
      'We klonen de transponder chip of schrijven deze in via de OBD-poort',
      'De nieuwe sleutel wordt direct op werking getest'
    ],
    faq: [
      { q: 'Kan ik ook een eenvoudige reservesleutel zonder knoppen krijgen?', a: 'Ja, dat is een uitstekende budgetoptie. Deze sleutel kan de deuren mechanisch openen en bevat de juiste transponder chip om de motor te starten. Dit kan al vanaf €149.' },
      { q: 'Hoe lang duurt het maken van een reservesleutel?', a: 'Binnen 30 tot 60 minuten is uw nieuwe reservesleutel klaar en volledig geprogrammeerd.' }
    ],
    relatedSlugs: ['sleutel-bijmaken', 'transponder-programmeren', 'afstandsbediening-bijmaken', 'smart-key-programmeren']
  },

  {
    slug: 'noodopening-auto',
    title: 'Noodopening',
    metaTitle: 'Noodopening Auto | Snel & Schadevrij Geopend | 24/7 Spoed',
    metaDesc: 'Noodopening van uw auto nodig? Binnen 30 min ter plaatse in Utrecht en Amsterdam. 100% schadevrij geopend door experts. Bel direct!',
    h1: 'Noodopening Auto — Snel & Schadevrij Binnen 30 Minuten',
    intro: 'Kind of huisdier in de auto? Noodgeval? Wij voeren 24/7 een 100% schadevrije noodopening uit — gemiddeld binnen 15–20 min.',
    system: 'Deadlock bypass tools & Laser Decoders',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.unlock}`,
    duration: '15–30 minuten',
    directAnswer:
      'Een noodopening is de spoedvariant: wij rijden met voorrang naar u toe en openen de auto vanaf €149, meestal binnen 30 tot 60 minuten na uw telefoontje. Staat er een kind of huisdier in de auto, bel dan eerst 112 — de hulpdiensten mogen dan direct handelen; voor alle andere situaties zijn wij 24 uur per dag bereikbaar.',
    steps: [
      'U belt onze spoedlijn (directe prioriteit)',
      'De dichtstbijzijnde mobiele bus rijdt met zwaailicht/spoed naar u toe',
      'Het portierslot wordt mechanisch gedecoreerd en geopend binnen enkele minuten',
      'Direct toegang tot de auto'
    ],
    faq: [
      { q: 'Kunnen jullie ook auto\'s openen die op "deadlock" staan?', a: 'Ja. Deadlock betekent dat de deurgrepen aan de binnenkant elektronisch zijn uitgeschakeld. Wij openen deze voertuigen via de mechanische slotcilinder met Lishi decoders, waardoor de auto denkt dat de originele sleutel wordt gebruikt.' },
      { q: 'Hoe snel bent u bij mij bij een noodgeval?', a: 'Bij noodgevallen (zoals een kind of dier in de auto) geven wij absolute prioriteit en zijn we meestal binnen 15 tot 20 minuten op locatie.' },
      { q: 'Wat is het verschil met een gewone opening?', a: 'Alleen de prioriteit. Bij een noodopening rijdt de dichtstbijzijnde monteur direct naar u toe in plaats van op volgorde van planning; de techniek en het tarief voor de opening zijn hetzelfde.' },
      { q: 'Komen jullie ook \'s nachts en in het weekend?', a: 'Ja, wij zijn 24 uur per dag en zeven dagen per week bereikbaar voor spoed. Buiten kantoortijden geldt wel een toeslag; die hoort u vooraf aan de telefoon.' },
      { q: 'Komen jullie ook naar een parkeergarage of de snelweg?', a: 'Ja. Wij werken dagelijks in parkeergarages en rijden ook naar auto\'s die langs de weg zijn gestrand. Geef bij het bellen de verdieping of het hectometerpaal door.' }
    ],
    relatedSlugs: ['auto-openen-zonder-sleutel', 'sleutel-in-auto', 'deur-dichtgevallen', 'autosleutel-kwijt']
  },

  // ── 4. BATTERIJ VERVANGEN ─────────────────────────────────
  {
    slug: 'batterij-vervangen',
    title: 'Batterij Vervangen',
    metaTitle: 'Batterij Autosleutel Vervangen | Vaste Prijs €15–€20 | Mobiel',
    metaDesc: 'Autosleutel batterij leeg? Wij vervangen uw autosleutel batterij op locatie voor een vaste prijs van €15 tot €20. Varta, Panasonic, Duracell. Bel!',
    h1: 'Batterij Autosleutel Vervangen — Vaste Prijs op Locatie',
    intro: 'Sleutelbatterij leeg of reageert traag? Wij vervangen hem op locatie met A-merk batterij voor een vaste prijs van €15–20.',
    system: 'Knoopcellen: CR2032, CR2025, CR1620, CR1616, CR2450 (Duracell, Panasonic, Varta)',
    priceFrom: 'Vaste prijs €15 - €20',
    duration: '5–10 minuten',
    directAnswer:
      'Een autosleutelbatterij vervangen kost €15 tot €20 en is in vijf minuten klaar. Symptomen zijn een kleiner wordend bereik en een sleutel die alleen nog vlak bij de deur reageert. Bij de meeste sleutels blijft de programmering bij het wisselen gewoon behouden.',
    steps: [
      'Onze monteur controleert de signaalsterkte van de sleutel',
      'De behuizing wordt voorzichtig geopend zonder beschadigingen',
      'De oude knoopcel wordt verwijderd en de contactpunten gereinigd',
      'Een nieuwe, originele A-merk batterij (bijv. Panasonic CR2032) wordt geplaatst',
      'De sleutel wordt opnieuw getest op werking en signaalsterkte'
    ],
    faq: [
      { q: 'Welke batterij zit er in mijn autosleutel?', a: 'De meeste autosleutels gebruiken een CR2032 of CR2025 lithium batterij. Sommige Japanse merken (Toyota/Lexus) gebruiken de kleinere CR1620 of CR1616, terwijl nieuwere smart keys (BMW G-serie) de extra dikke CR2450 vereisen. Wij hebben alle maten op voorraad.' },
      { q: 'Verliest mijn sleutel de code als de batterij eruit is?', a: 'Bij een snelle batterijwissel blijft de code gewoon bewaard. Als de batterij echter dagenlang leeg is geweest, kan synchronisatie nodig zijn. Onze monteur voert dit direct gratis uit bij de wissel.' },
      { q: 'Waarom mag ik geen goedkope batterij gebruiken?', a: 'Goedkope batterijen (zoals van budgetwinkels) verliezen snel hun spanning en kunnen gaan lekken, wat de printplaat van uw dure sleutel permanent kan beschadigen. Wij gebruiken uitsluitend Varta, Panasonic en Duracell.' }
    ],
    relatedSlugs: ['afstandsbediening-bijmaken', 'smart-key-programmeren', 'autosleutels-repareren', 'behuizing-vervangen']
  },

  // ── 5. AUTOSLEUTEL REPARATIE ──────────────────────────────
  {
    slug: 'autosleutels-repareren',
    title: 'Autosleutels Repareren',
    metaTitle: 'Autosleutels Repareren | Behuizing & Knoppen Solderen | Utrecht',
    metaDesc: 'Autosleutel kapot? Wij repareren uw autosleutel op locatie in Utrecht en omstreken. Nieuwe behuizing, knoppen solderen, batterij vervangen. Bel direct!',
    h1: 'Autosleutels Repareren — Bespaar op een Nieuwe Autosleutel',
    intro: 'Waterschade, lamme knoppen of transponder defect? Wij repareren uw sleutel op locatie — bespaar tot 70% t.o.v. een nieuwe sleutel.',
    system: 'Micro-soldering, SMD tactile switch replacements, Transponder coil repair',
    priceFrom: 'Vanaf €49',
    duration: '20–45 minuten',
    directAnswer:
      'Een autosleutel repareren kost vanaf €35 en duurt meestal 20 tot 45 minuten — bijna altijd goedkoper dan een nieuwe sleutel. Losse knoppen, een gebroken behuizing of een versleten sleutelbaard zijn te herstellen met behoud van de originele elektronica, zodat er niets opnieuw geprogrammeerd hoeft te worden.',
    steps: [
      'We meten de printplaat door om de exacte storing te vinden',
      'Defecte micro-switches of spoelen worden gedesoldeerd',
      'Nieuwe componenten worden onder de microscoop gesoldeerd',
      'De sleutel wordt getest met een RF-frequentietester',
      'Optioneel plaatsen we de printplaat in een nieuwe behuizing'
    ],
    faq: [
      { q: 'Hoe kan ik een kapotte autosleutel zelf repareren?', a: 'U kunt een kapotte autosleutel zelf repareren door de batterij te vervangen of de behuizing te vernieuwen. Voor complexere problemen zoals defecte knoppen op de printplaat, startproblemen of transponder-defecten is professioneel soldeerwerk vereist. Zelf solderen zonder microscoop en juiste SMD-switches kan de sleutel definitief onbruikbaar maken. Autosleutel24 repareert dit snel en schadevrij op locatie.' },
      { q: 'Wat te doen als je autosleutel niet meer reageert?', a: 'Als uw autosleutel niet reageert, vervang dan eerst de batterij (meestal CR2032). Werkt de sleutel daarna nog niet, controleer dan of de reserve-sleutel de auto wel opent. Reageert de auto op geen van beide sleutels, dan ligt het probleem vaak bij de accu van het voertuig of de ontvanger-module. Autosleutel24 kan ter plekke de zendfrequentie meten en de storing oplossen.' },
      { q: 'Wat kost het om een autosleutel te laten repareren?', a: 'De kosten om een autosleutel te laten repareren variëren van €49 tot €85 bij Autosleutel24, afhankelijk van het type defect (zoals losse knopjes solderen of printplaat-corrosie). Dit bespaart u tot wel 70% in vergelijking met het aanschaffen en inleren van een volledig nieuwe sleutel bij de dealer.' },
      { q: 'Kosten reparatie autosleutel behuizing.', a: 'Het vervangen of repareren van een kapotte autosleutel behuizing kost bij Autosleutel24 gemiddeld €49. Onze mobiele monteurs zetten de originele printplaat en transponderchip schadevrij over naar een nieuwe, stevige OEM-kwaliteit sleutelbehuizing, zodat uw sleutel direct weer start en functioneert.' },
      { q: 'Welke merken autosleutels zijn makkelijk te repareren?', a: 'Merken zoals Volkswagen, Peugeot, Citroën, Renault en Opel zijn relatief makkelijk te repareren wat betreft behuizing en knoppen. Ultrasoon dichtgelijmde sleutels (bijvoorbeeld van Ford of BMW) vereisen speciaal gereedschap om de behuizing open te frezen zonder de printplaat te raken, een specialisme van Autosleutel24.' },
      { q: 'Waarom werkt mijn autosleutel afstandsbediening niet?', a: 'De meest voorkomende redenen waarom een autosleutel afstandsbediening niet werkt zijn een lege knoopcelbatterij, kapotte drukschakelaars (micro-switches) op de printplaat, waterschade, of een verstoorde synchronisatie tussen de sleutel en de startonderbreker van het voertuig.' },
      { q: 'Welke tools heb ik nodig om een autosleutel thuis te repareren?', a: 'Om thuis een autosleutel te repareren heeft u precisieschroevendraaiers nodig om de behuizing te openen. Voor printplaatreparaties zijn een SMD-soldeerbout met dunne stift, soldeertin, vloeimiddel (flux), een pincet en bij voorkeur een microscoop vereist. Zonder deze professionele tools riskeert u permanente schade aan de transponderchip.' },
      { q: 'Zelf autosleutel repareren stappenplan.', a: 'Volg dit stappenplan voor het zelf repareren van uw autosleutel: 1. Open de behuizing voorzichtig met een platte schroevendraaier. 2. Vervang de batterij en test de zendfrequentie. 3. Inspecteer de printplaat op losse soldeerverbindingen of corrosie. 4. Reinig corrosie met isopropanol (alcohol). 5. Zet de printplaat en transponderchip over in een nieuwe behuizing.' },
      { q: 'Autosleutel batterij vervangen instructies.', a: 'Voor het vervangen van uw autosleutel batterij schuift u de mechanische noodsleutel eruit (indien aanwezig), wrikt u de behuizing voorzichtig open langs de naad met een kunststof tool, en vervangt u de oude batterij door een nieuwe van het type CR2032 of CR2016. Let hierbij goed op de plus- (+) en minpool.' },
      { q: 'Waar vind ik een autosleutel reparatieservice bij mij in de buurt?', a: 'U vindt een professionele mobiele autosleutel reparatieservice bij Autosleutel24. Wij zijn actief in heel Utrecht, Amsterdam, Almere, Amersfoort en de gehele Randstad. Onze monteurs komen met een mobiele werkplaats direct naar uw huis of werklocatie toe om uw sleutel ter plekke te repareren of te dupliceren.' }
    ],
    relatedSlugs: ['behuizing-vervangen', 'knoppen-repareren', 'contactslot-auto-vervangen', 'batterij-vervangen']
  },
  {
    slug: 'behuizing-vervangen',
    title: 'Behuizing Vervangen',
    metaTitle: 'Sleutelbehuizing Vervangen Auto | Nieuwe Sleutelbehuizing',
    metaDesc: 'Autosleutel behuizing kapot of versleten? Wij vervangen uw sleutelbehuizing ter plaatse door een nieuw, stevig exemplaar van OEM kwaliteit.',
    h1: 'Sleutelbehuizing Vervangen — Geef Uw Sleutel een Tweede Leven',
    intro: 'Sleutelbehuizing gescheurd of knoppen doorgedrukt? Wij zetten uw elektronica schadevrij over in een nieuwe OEM-behuizing op locatie.',
    system: 'OEM replacement key shells (folding / smart keys)',
    priceFrom: 'Vanaf €49',
    duration: '15–30 minuten',
    directAnswer:
      'Een sleutelbehuizing vervangen kost vanaf €35 en duurt 20 tot 30 minuten. Wij zetten de originele printplaat, transponder en sleutelbaard over in een nieuwe kast. Omdat de elektronica dezelfde blijft, is opnieuw programmeren niet nodig en blijft de sleutel direct werken.',
    steps: [
      'De oude behuizing wordt voorzichtig opengemaakt (soms opengefreesd bij gelijmde types)',
      'De kwetsbare printplaat en transponder chip worden schadevrij verwijderd',
      'De interne componenten worden schoongemaakt en gecontroleerd',
      'Alles wordt overgezet naar de nieuwe behuizing',
      'De sleutelbaard wordt overgezet of nieuw gesneden'
    ],
    faq: [
      { q: 'Waarom moet een gelijmde sleutel (zoals Ford of Opel) opengefreesd worden?', a: 'Fabriekssleutels van o.a. Ford en Opel zijn ultrasoon dichtgelijmd om waterdicht te zijn. Om de printplaat te kunnen redden, moeten we de oude behuizing met precisiegereedschap opensnijden. Wij hebben hier speciale mallen voor.' },
      { q: 'Start mijn auto nog steeds na het overzetten van de behuizing?', a: 'Ja. Omdat we de originele transponder chip (die gekoppeld is aan uw startonderbreker) meeverhuizen naar de nieuwe behuizing, blijft de sleutel gewoon starten.' },
      { q: 'Moet de sleutel opnieuw geprogrammeerd worden na een nieuwe behuizing?', a: 'Nee. De transponder en de printplaat gaan ongewijzigd mee naar de nieuwe kast, dus de auto herkent de sleutel gewoon. Programmeren is alleen nodig bij een volledig nieuwe sleutel.' },
      { q: 'Kan de originele sleutelbaard hergebruikt worden?', a: 'In vrijwel alle gevallen wel. De baard is los te nemen en past in de nieuwe behuizing. Is hij verbogen of versleten, dan frezen wij ter plaatse een nieuwe.' }
    ],
    relatedSlugs: ['autosleutels-repareren', 'knoppen-repareren', 'batterij-vervangen', 'sleutel-bijmaken']
  },
  {
    slug: 'knoppen-repareren',
    title: 'Knoppen Repareren',
    metaTitle: 'Autosleutel Drukknoppen Repareren | Switches Solderen | Utrecht',
    metaDesc: 'Werken de knoppen van uw autosleutel niet meer? Wij solderen nieuwe micro-switches op de printplaat. Snel klaar op locatie. Bel nu!',
    h1: 'Autosleutel Drukknoppen Repareren — SMD Micro-Switches Solderen',
    intro: 'Sleutelknoppen reageren niet meer? Wij solderen nieuwe micro-switches op de printplaat — snel klaar op locatie.',
    system: 'SMD Micro-soldering / PCB Switch replacement',
    priceFrom: 'Vanaf €49',
    duration: '20–40 minuten',
    directAnswer:
      'Kapotte sleutelknoppen repareren kost vanaf €35 en duurt 20 tot 30 minuten. Meestal is niet de elektronica stuk maar het rubberen matje of het contactvlak eronder, versleten door dagelijks gebruik. Vervanging van dat onderdeel is fors goedkoper dan een complete nieuwe afstandsbediening.',
    steps: [
      'We demonteren de sleutel en inspecteren de printplaat onder een microscoop',
      'De defecte knopjes worden voorzichtig losgesoldeerd',
      'Er worden nieuwe, originele micro-switches op de printplaat gesoldeerd',
      'We testen de signaaloverdracht en monteren de sleutel weer'
    ],
    faq: [
      { q: 'Wat is een micro-switch?', a: 'Een micro-switch is het kleine elektronische knopje op de printplaat dat contact maakt als u op de buitenkant van de sleutel drukt. Door intensief gebruik slijten de interne metalen contacten of breken de soldeereilandjes los.' },
      { q: 'Kan elk type knopje worden vervangen?', a: 'Ja, wij hebben vrijwel alle typen SMD-schakelaars voor alle automerken op voorraad in onze mobiele bussen.' },
      { q: 'Is repareren goedkoper dan een nieuwe afstandsbediening?', a: 'Vrijwel altijd. Een reparatie begint bij €35, terwijl een nieuwe afstandsbediening inclusief programmeren vanaf €220 kost. Alleen bij waterschade aan de print is vervanging voordeliger.' },
      { q: 'De knop klikt wel maar de auto reageert niet — is dat hetzelfde probleem?', a: 'Niet noodzakelijk. Een voelbare klik zonder reactie wijst eerder op een lege batterij of een defect zendgedeelte. Wij meten dat ter plaatse door voordat we iets vervangen.' }
    ],
    relatedSlugs: ['autosleutels-repareren', 'behuizing-vervangen', 'batterij-vervangen', 'afstandsbediening-bijmaken']
  },
  {
    slug: 'contactslot-auto-vervangen',
    title: 'Auto Contactslot Vervangen',
    metaTitle: 'Auto Contactslot Vervangen of Repareren op Locatie | Autosleutel24',
    metaDesc: 'Auto contactslot defect of sleutel draait niet meer? Blijft uw sleutel zitten in het slot? Wij kunnen uw auto contactslot vervangen of repareren ter plaatse.',
    h1: 'Auto Contactslot Vervangen & Reparatie — Direct ter Plaatse',
    intro: 'Contactslot defect of sleutel draait niet meer? Wij vervangen of repareren uw contactslot ter plaatse — ook Mercedes EIS/ELV specialist.',
    system: 'Mercedes EIS / ELV / ESL systemen, BMW CAS/Immo synchronisatie, mechanical ignition locks',
    priceFrom: `Vanaf €${SITE_CONFIG.prices.ignition}`,
    duration: '45–120 minuten',
    directAnswer:
      'Een contactslot vervangen of repareren kost vanaf €299 en duurt 60 tot 120 minuten. Klemt de sleutel, of draait hij wel maar start de auto niet, dan zijn meestal de lamellen in de cilinder versleten. Wij vervangen de cilinder en passen die aan op uw bestaande sleutel, zodat u niet met twee verschillende sleutels komt te zitten.',
    steps: [
      'Mechanische en elektrische diagnose van het contactslot',
      'Demonteren van de stuurkolom of het dashboardpaneel',
      'Repareren van de interne cilinderplaatjes of het vervangen van de elektronische spoel',
      'Hercoderen van de bestaande autosleutels aan het nieuwe slot (zo nodig)',
      'Uitgebreide starttest en systeemdiagnose'
    ],
    faq: [
      { q: 'Mijn Mercedes sleutel klikt niet en stuurslot ontgrendelt niet, wat nu?', a: 'Dit is een bekend probleem bij Mercedes (W204, W212, etc.) en duidt bijna altijd op een defect ELV (elektronisch stuurslot) of EIS module. Dealers vervangen de hele stuurkolom voor ca. €1.200. Wij repareren de module ter plaatse of programmeren een emulator voor een fractie van die prijs.' },
      { q: 'Moet ik na contactslot-auto-vervangen een andere sleutel gebruiken?', a: 'Nee. Wij bouwen het nieuwe mechanische slot zo om dat het perfect past op de code van uw huidige deursleutels. U behoudt dus gewoon één sleutel voor de hele auto.' }
    ],
    relatedSlugs: ['autosleutels-repareren', 'sleutel-afgebroken-in-slot', 'transponder-programmeren', 'alle-sleutels-kwijt-auto']
  }
];
