export interface Service {
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  price: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  color: string;
  excerpt: string;
}

export const SERVICES: Service[] = [
  {
    slug: 'autosleutel-bijmaken-utrecht',
    title: 'Autosleutel Bijmaken',
    shortTitle: 'Bijmaken',
    icon: '🗝️',
    price: 'Vanaf €180',
    metaTitle: 'Autosleutel Bijmaken Utrecht | Alle Merken | Mobiel & Ter Plaatse',
    metaDescription: 'Professioneel autosleutel bijmaken in Utrecht. Alle merken, alle modellen. Transponder sleutels, smart keys, keyless entry. Wij komen naar u toe. 30-60 min.',
    keywords: ['autosleutel bijmaken utrecht', 'autosleutel vervangen', 'reserve autosleutel', 'transponder sleutel programmeren'],
    h1: 'Autosleutel Bijmaken Utrecht — Mobiel & Ter Plaatse',
    color: '#0f62fe',
    excerpt: 'Reserve autosleutel nodig of autosleutel kwijt? Wij programmeren alle sleuteltypes ter plaatse — geen sleepkosten.',
  },
  {
    slug: 'alle-sleutels-kwijt-auto',
    title: 'Alle Sleutels Kwijt',
    shortTitle: 'AKL Spoed',
    icon: '🚨',
    price: 'Spoed AKL',
    metaTitle: 'Alle Sleutels Kwijt? | Spoed Autosleutel Service Utrecht | 24/7',
    metaDescription: 'Alle autosleutels kwijt? Spoed mobiele service in Utrecht. BMW, Mercedes, Audi, VW, Toyota. Geen sleepkosten nodig. Wij maken sleutels ter plaatse. 30 min. 24/7.',
    keywords: ['alle sleutels kwijt auto', 'autosleutel kwijt utrecht', 'spoed autosleutel', 'geen reserve sleutel auto'],
    h1: 'Alle Sleutels Kwijt? Wij Komen naar U Toe — Spoed Service',
    color: '#da1e28',
    excerpt: '24/7 spoed service bij verlies van alle autosleutels. BMW, Mercedes, VW, Toyota — alle merken opgelost.',
  },
  {
    slug: 'bmw-sleutel-bijmaken-utrecht',
    title: 'BMW Sleutel Specialist',
    shortTitle: 'BMW',
    icon: '🔵',
    price: 'Vanaf €220',
    metaTitle: 'BMW Autosleutel Bijmaken Utrecht | FEM/BDC/CAS | ECU-Niveau',
    metaDescription: 'BMW sleutel programmering specialist in Utrecht. E/F/G chassis, CAS3/4, FEM/BDC, BDC2. Dealer alternatief. Bench EEPROM, ISN extractie. Service op dezelfde dag.',
    keywords: ['BMW autosleutel bijmaken utrecht', 'BMW FEM sleutel', 'BMW BDC sleutel', 'BMW CAS4 sleutel', 'BMW alle sleutels kwijt'],
    h1: 'BMW Autosleutel Bijmaken Utrecht — FEM/BDC/CAS Specialist',
    color: '#1d4ed8',
    excerpt: 'Specialist in BMW E/F/G chassis sleutelprogrammering. CAS3, CAS4, FEM/BDC — dealer-niveau zonder dealer-prijs.',
  },
  {
    slug: 'mercedes-sleutel-vervangen-utrecht',
    title: 'Mercedes Sleutel Specialist',
    shortTitle: 'Mercedes',
    icon: '⭐',
    price: 'Vanaf €250',
    metaTitle: 'Mercedes Sleutel Vervangen Utrecht | FBS3/FBS4 | Mobiel',
    metaDescription: 'Mercedes sleutel vervangen in Utrecht. FBS3 AKL, FBS4 oplossingen, EIS/ELV reparatie. G-Box 3, AVDI. Telefoon-als-sleutel tijdelijk. Mobiele service.',
    keywords: ['Mercedes sleutel vervangen utrecht', 'Mercedes FBS3 sleutel', 'Mercedes EIS reparatie', 'Mercedes autosleutel kwijt'],
    h1: 'Mercedes Sleutel Vervangen Utrecht — FBS3/FBS4 Specialist',
    color: '#4b5563',
    excerpt: 'FBS3 wachtwoord berekening, EIS/ELV reparatie, FBS4 oplossingen. De Mercedes specialist die dealers niet kunnen evenaren.',
  },
  {
    slug: 'vw-audi-sleutel-bijmaken-utrecht',
    title: 'VW & Audi Sleutel Specialist',
    shortTitle: 'VW/Audi',
    icon: '🔧',
    price: 'Vanaf €180',
    metaTitle: 'VW/Audi Autosleutel Bijmaken Utrecht | MQB/SFD/MLB Unlock',
    metaDescription: 'VW/Audi sleutel programmering in Utrecht. MQB/MQB48, SFD unlock, MLB platform. Golf 8, ID.3, A3, A4, Q5, Porsche. Dealer-niveau zonder dealer wachtrij.',
    keywords: ['VW autosleutel bijmaken utrecht', 'Audi sleutel programmeren', 'VW Golf 8 sleutel', 'SFD unlock', 'MQB48 sleutel'],
    h1: 'VW/Audi Autosleutel Bijmaken — MQB48, SFD, MLB Specialist',
    color: '#1565c0',
    excerpt: 'MQB48, SFD unlock, MLB platform — de meest complexe VAG systemen zijn geen probleem voor ons team.',
  },
  {
    slug: 'toyota-sleutel-vervangen-utrecht',
    title: 'Toyota & Lexus Sleutel Specialist',
    shortTitle: 'Toyota/Lexus',
    icon: '🔴',
    price: 'Vanaf €200',
    metaTitle: 'Toyota/Lexus Sleutel Vervangen Utrecht | Hybride AKL | Bypass',
    metaDescription: 'Toyota/Lexus sleutel vervangen in Utrecht. 2019+ AKL bypass kabel, hybride systemen, smart key. Lonsdor K518 specialist. Mobiele service op dezelfde dag.',
    keywords: ['Toyota sleutel vervangen utrecht', 'Lexus sleutel vervangen', 'Toyota hybride sleutel', 'Toyota AKL bypass'],
    h1: 'Toyota & Lexus Sleutel Vervangen — 2019+ AKL Specialist',
    color: '#dc2626',
    excerpt: '2019+ Toyota vereist speciale 30-PIN bypass kabel. Wij hebben de tools en kennis voor hybride sleutelprogrammering.',
  },
  {
    slug: 'volvo-sleutel-programmeren-utrecht',
    title: 'Volvo Sleutel Specialist',
    shortTitle: 'Volvo',
    icon: '🛡️',
    price: 'Vanaf €220',
    metaTitle: 'Volvo Sleutel Programmeren Utrecht | SPA/CMA Platform | Mobiel',
    metaDescription: 'Volvo sleutel programmeren in Utrecht. P2/P3/SPA/CMA platform. Lonsdor veilige methode. XC60, XC90, V40, S60, V60. Service op dezelfde dag. Bel nu.',
    keywords: ['Volvo sleutel programmeren utrecht', 'Volvo autosleutel bijmaken', 'Volvo SPA sleutel', 'Volvo XC60 sleutel'],
    h1: 'Volvo Sleutel Programmeren Utrecht — SPA/CMA Specialist',
    color: '#1e3a5f',
    excerpt: 'P2, P3, SPA en CMA platform — veilige Lonsdor methode zonder brick-risico voor uw Volvo.',
  },
  {
    slug: 'ecu-clonen-component-protection',
    title: 'ECU Clonen & CP Verwijdering',
    shortTitle: 'ECU/CP',
    icon: '💻',
    price: 'Vanaf €200',
    metaTitle: 'ECU Clonen & Component Protection Verwijderen | Hersenchirurg Niveau',
    metaDescription: 'Gebruikte ECU/BCM adaptatie, component protection verwijdering, ISN extractie. BMW, Mercedes, VW/Audi. Wat dealers niet kunnen, wij wel. Utrecht & regio.',
    keywords: ['ECU clonen utrecht', 'component protection verwijderen', 'ISN extractie BMW', 'CP verwijderen VW'],
    h1: 'ECU Clonen & Component Protection Verwijderen — Elite Service',
    color: '#7c3aed',
    excerpt: 'Waterschade, ongeval, gebruikte modules — wij redden uw auto waar dealers stoppen. ISN extractie, ECU klonen, CP verwijdering.',
  },
  {
    slug: 'ghost-immobiliser-installeren',
    title: 'Ghost Immobiliser Installatie',
    shortTitle: 'Ghost',
    icon: '👻',
    price: 'Vanaf €399',
    metaTitle: 'Ghost Immobiliser Installeren Utrecht | CAN Bus Beveiliging',
    metaDescription: 'Ghost immobiliser installatie in Utrecht. CAN bus bescherming tegen sleutel klonen & relay attacks. BMW, Mercedes, Audi, VW, Toyota. Verzekering goedgekeurd.',
    keywords: ['ghost immobiliser utrecht', 'CAN bus immobilizer', 'relay attack bescherming', 'auto beveiliging utrecht'],
    h1: 'Ghost Immobiliser Installatie — Ultieme CAN Bus Bescherming',
    color: '#059669',
    excerpt: 'TASSA gecertificeerd, ondetecteerbaar voor dieven, verzekering goedgekeurd. De beste anti-diefstal oplossing voor uw auto.',
  },
  {
    slug: 'bedrijfswagen-sleutel-beheer',
    title: 'Bedrijfswagen Sleutel Beheer',
    shortTitle: 'B2B/Fleet',
    icon: '🚐',
    price: 'Vanaf €90/klus',
    metaTitle: 'Bedrijfswagen Sleutel Beheer | B2B Auto Sleutel Service | Utrecht',
    metaDescription: 'Bedrijfswagen sleutel beheer voor bedrijven in Utrecht & omgeving. Prioriteit service, digitale sleutels, bulk prijzen. Fleet contracten. Vraag offerte aan.',
    keywords: ['bedrijfswagen sleutel beheer', 'zakelijk auto sleutel service', 'fleet sleutel vervanging', 'car sharing sleutel beheer'],
    h1: 'Bedrijfswagen Sleutel Beheer — Verminder Downtime, Bespaar Kosten',
    color: '#0891b2',
    excerpt: 'Prioriteit service, reserve sleutel programma, digitale sleutels via MoboKey. B2B oplossingen voor fleets van alle groottes.',
  },
];

export const BLOG_POSTS = [
  {
    slug: 'alle-sleutels-kwijt-wat-nu-utrecht',
    title: 'Wat te Doen als U Alle Autosleutels Kwijt Bent in Utrecht',
    excerpt: 'Paniek hoeft niet. Volg deze stappen en u rijdt binnen 60 minuten weer.',
    keywords: ['alle sleutels kwijt utrecht', 'autosleutel kwijt wat doen'],
    publishDate: '2026-01-15',
    readTime: '5 min',
  },
  {
    slug: 'autosleutel-kosten-per-merk-2026',
    title: 'Autosleutel Vervangingskosten per Merk 2026',
    excerpt: 'BMW, Mercedes, Audi, VW, Toyota — wat kost een nieuwe autosleutel echt?',
    keywords: ['autosleutel kosten', 'prijs autosleutel per merk 2026'],
    publishDate: '2026-01-22',
    readTime: '7 min',
  },
  {
    slug: 'dealer-vs-slotenmaker-kostenverschil',
    title: 'Dealer vs Slotenmaker: Het Echte Kostenverschil',
    excerpt: 'Zelf onderzoek gedaan: dealer vs mobiele specialist. De cijfers zijn verbluffend.',
    keywords: ['dealer vs slotenmaker kosten', 'autosleutel dealer vergelijking'],
    publishDate: '2026-01-29',
    readTime: '6 min',
  },
  {
    slug: 'verzekering-dekt-autosleutel-vervangen',
    title: 'Wordt Autosleutel Vervanging Vergoed door de Verzekering in NL?',
    excerpt: 'All Risk, WA+, of WA? Wij leggen uit welke polissen vergoeden en hoe u claimt.',
    keywords: ['verzekering dekt autosleutel', 'autosleutel verzekering claim'],
    publishDate: '2026-02-05',
    readTime: '5 min',
  },
  {
    slug: 'sfd-lock-vw-golf-8-uitleg',
    title: 'Wat Is SFD Lock op VW Golf 8? (En Hoe Wij Het Ontgrendelen)',
    excerpt: 'SFD is de reden waarom uw Golf 8 sleutel zo duur is — maar niet bij ons.',
    keywords: ['SFD lock VW Golf 8', 'SFD unlock utrecht'],
    publishDate: '2026-02-12',
    readTime: '8 min',
  },
  {
    slug: 'bmw-bdc2-sleutel-bijmaken-2026',
    title: 'BMW BDC2 Autosleutel Bijmaken: Is Het Mogelijk in 2026?',
    excerpt: 'BDC2 is de moeilijkste BMW. Wij leggen uit wat kan en wat niet.',
    keywords: ['BMW BDC2 autosleutel bijmaken', 'BMW G chassis sleutel'],
    publishDate: '2026-02-19',
    readTime: '6 min',
  },
  {
    slug: 'ghost-immobiliser-utrecht',
    title: 'Ghost Immobiliser: Waarom Elke Keyless Auto in Utrecht Er Een Nodig Heeft',
    excerpt: 'Relay attacks in Utrecht en omgeving nemen toe. Ghost immobiliser is de definitieve oplossing.',
    keywords: ['ghost immobiliser utrecht', 'relay attack bescherming'],
    publishDate: '2026-02-26',
    readTime: '5 min',
  },
  {
    slug: 'faraday-pouch-bescherming-relay-attack',
    title: 'Faraday Pouch: Het €50 Apparaat Dat Uw €30.000 Auto Beschermt',
    excerpt: 'Keyless entry is handig maar gevaarlijk. Faraday pouch + Ghost = maximale bescherming.',
    keywords: ['faraday pouch bescherming', 'relay attack voorkomen'],
    publishDate: '2026-03-05',
    readTime: '4 min',
  },
  {
    slug: 'toyota-hybride-sleutel-vervangen',
    title: 'Toyota Hybride Sleutel Vervangen: Wat Maakt Het Anders',
    excerpt: 'Hybride systemen vereisen extra voorzorgsmaatregelen. Onze specialist legt het uit.',
    keywords: ['Toyota hybride sleutel', 'Prius Corolla sleutel vervangen'],
    publishDate: '2026-03-12',
    readTime: '6 min',
  },
  {
    slug: 'case-study-bmw-besparing',
    title: 'Hoe Wij een BMW Eigenaar €1.200 Bespaarden',
    excerpt: 'Echte casus: BMW X5, alle sleutels kwijt. Dealer: €1.800. Wij: €650. Zelfde dag.',
    keywords: ['BMW besparing casus', 'BMW alle sleutels kwijt utrecht'],
    publishDate: '2026-03-19',
    readTime: '4 min',
  },
  {
    slug: 'autosleutel-batterij-vervangen-stappenplan',
    title: 'Autosleutel Batterij Vervangen: Welke Batterij en Hoe Vervang Je Die?',
    excerpt: 'Is de batterij van uw autosleutel leeg? Lees hier welk type batterij u nodig heeft per model en hoe u deze schadevrij vervangt zonder signaalverlies.',
    keywords: ['autosleutel batterij vervangen', 'CR2032 batterij sleutel', 'sleutelbatterij leeg'],
    publishDate: '2026-03-26',
    readTime: '5 min',
  },
  {
    slug: 'autosleutel-gestolen-wat-te-doen',
    title: 'Autosleutel Gestolen of Auto Gestolen? Direct Actie Stappenplan',
    excerpt: 'Is uw autosleutel gestolen of heeft u het vermoeden van autodiefstal? Lees hier welke stappen u direct moet ondernemen om uw auto te beveiligen en de verzekeringsdekking te garanderen.',
    keywords: ['autosleutel gestolen', 'auto gestolen met sleutel', 'autosleutel deprogrammeren', 'verzekering autosleutel diefstal'],
    publishDate: '2026-04-02',
    readTime: '6 min',
  },
  {
    slug: 'autosleutel-bijmaken-zonder-origineel',
    title: 'Kan ik een Autosleutel Bijmaken zonder Origineel?',
    excerpt: 'Bent u uw enige autosleutel kwijt? Lees hier hoe een mobiele autosleutelspecialist een nieuwe sleutel kan bijmaken en inleren zonder de originele sleutel.',
    keywords: ['autosleutel bijmaken zonder origineel', 'autosleutel namaken zonder sleutel', 'auto openen en sleutel maken'],
    publishDate: '2026-04-09',
    readTime: '6 min',
  },
  {
    slug: 'dealer-vs-mobiele-sleutelmaker',
    title: 'Dealer vs Mobiele Sleutelmaker: Wat is Goedkoper?',
    excerpt: 'Een eerlijke en gedetailleerde prijsvergelijking tussen de merkdealer en een mobiele autosleutelspecialist voor het vervangen van uw autosleutel.',
    keywords: ['dealer vs mobiele sleutelmaker', 'nieuwe autosleutel kosten dealer', 'goedkope autosleutelmaker'],
    publishDate: '2026-04-16',
    readTime: '8 min',
  },
  {
    slug: 'sleutel-kwijt-utrecht-stappenplan',
    title: 'Autosleutel Kwijt in Utrecht: 5 Stappen Directe Hulp',
    excerpt: 'Bent u uw autosleutel verloren in Utrecht? Volg dit directe 5-stappenplan om snel, schadevrij en zonder sleepkosten weer op weg te zijn.',
    keywords: ['autosleutel kwijt utrecht', 'autosleutel kwijt utrecht', 'spoed autosleutel utrecht'],
    publishDate: '2026-04-23',
    readTime: '5 min',
  },
  {
    slug: 'autosleutel-bijmaken-tips-snel-veilig',
    title: 'Autosleutel Bijmaken: Tips voor Snel en Veilig Resultaat',
    excerpt: 'Verlies je vaak je autosleutel? Geen paniek! Ontdek handige tips voor het snel en veilig bijmaken van je autosleutel bij Autosleutel24, zodat je altijd mobiel blijft.',
    keywords: ['autosleutel bijmaken', 'snel autosleutel bijmaken', 'veilig autosleutel bijmaken', 'autosleutel dupliceren'],
    publishDate: '2026-07-08',
    readTime: '7 min',
  },
  {
    slug: 'auto-openen-zonder-sleutel-schadevrij',
    title: 'Auto Openen Zonder Sleutel: 100% Schadevrij',
    excerpt: 'Sleutel in de auto laten liggen? Breek geen ruit in! Ontdek hoe wij uw autodeur schadevrij openen met specialistisch gereedschap.',
    keywords: ['auto openen zonder sleutel', 'sleutel in auto laten liggen', 'autodeur openmaken zonder schade', 'auto slotenmaker'],
    publishDate: '2026-07-09',
    readTime: '5 min',
  },
  {
    slug: 'autosleutel-kwijt-wat-nu-stappenplan',
    title: 'Autosleutel Kwijt? Dit is het Directe Stappenplan',
    excerpt: 'Alle autosleutels kwijt? Raak niet in paniek. Lees precies wat u moet doen en hoe wij op locatie direct een nieuwe sleutel inleren.',
    keywords: ['autosleutel kwijt', 'autosleutel verloren', 'alle autosleutels kwijt', 'reserve autosleutel kwijt'],
    publishDate: '2026-07-10',
    readTime: '6 min',
  },
  {
    slug: 'autosleutel-bijmaken-kosten-prijslijst',
    title: 'Wat zijn de Kosten van een Autosleutel Bijmaken?',
    excerpt: 'Een eerlijke en transparante prijslijst voor het bijmaken van transpondersleutels, klapsleutels en smart keys. Ontdek waarom wij goedkoper zijn dan de dealer.',
    keywords: ['autosleutel bijmaken kosten', 'wat kost een autosleutel', 'autosleutel prijs', 'goedkoop autosleutel bijmaken'],
    publishDate: '2026-07-11',
    readTime: '6 min',
  },
  {
    slug: 'sleutel-bijmaken-auto-mobiele-service',
    title: 'Autosleutel Bijmaken Auto: Snel, Mobiel & Betrouwbaar',
    excerpt: 'Een reserve autosleutel bijmaken voor uw auto was nog nooit zo makkelijk. Onze mobiele werkplaats komt naar u toe voor alle merken en modellen.',
    keywords: ['autosleutel bijmaken auto', 'auto reservesleutel maken', 'mobiele autosleutelmaker', 'autosleutel kopiëren'],
    publishDate: '2026-07-12',
    readTime: '5 min',
  },
];

export function getRelatedBlogPosts(serviceSlug: string) {
  const mapping: Record<string, string[]> = {
    'autosleutel-bijmaken': [
      'autosleutel-kosten-per-merk-2026',
      'dealer-vs-mobiele-sleutelmaker',
      'autosleutel-bijmaken-zonder-origineel',
      'dealer-vs-slotenmaker-kostenverschil'
    ],
    'reservesleutel-maken': [
      'autosleutel-kosten-per-merk-2026',
      'dealer-vs-mobiele-sleutelmaker',
      'autosleutel-bijmaken-zonder-origineel'
    ],
    'afstandsbediening-bijmaken': [
      'autosleutel-kosten-per-merk-2026',
      'dealer-vs-mobiele-sleutelmaker',
      'autosleutel-bijmaken-zonder-origineel'
    ],
    'transponder-programmeren': [
      'autosleutel-kosten-per-merk-2026',
      'sfd-lock-vw-golf-8-uitleg',
      'bmw-bdc2-sleutel-bijmaken-2026'
    ],
    'smart-key-programmeren': [
      'autosleutel-kosten-per-merk-2026',
      'bmw-bdc2-sleutel-bijmaken-2026',
      'toyota-hybride-sleutel-vervangen'
    ],
    'autosleutel-kwijt': [
      'alle-sleutels-kwijt-wat-nu-utrecht',
      'sleutel-kwijt-utrecht-stappenplan',
      'autosleutel-bijmaken-zonder-origineel',
      'autosleutel-gestolen-wat-te-doen'
    ],
    'alle-sleutels-kwijt-auto': [
      'alle-sleutels-kwijt-wat-nu-utrecht',
      'sleutel-kwijt-utrecht-stappenplan',
      'autosleutel-bijmaken-zonder-origineel',
      'case-study-bmw-besparing'
    ],
    'ghost-immobiliser': [
      'ghost-immobiliser-utrecht',
      'faraday-pouch-bescherming-relay-attack'
    ],
    'auto-beveiliging': [
      'ghost-immobiliser-utrecht',
      'faraday-pouch-bescherming-relay-attack'
    ],
    'batterij-vervangen': [
      'autosleutel-batterij-vervangen-stappenplan'
    ],
    'autosleutels-repareren': [
      'autosleutel-batterij-vervangen-stappenplan',
      'verzekering-dekt-autosleutel-vervangen'
    ],
    'behuizing-vervangen': [
      'autosleutel-batterij-vervangen-stappenplan'
    ],
    'knoppen-repareren': [
      'autosleutel-batterij-vervangen-stappenplan'
    ]
  };

  const slugs = mapping[serviceSlug];
  if (slugs) {
    return BLOG_POSTS.filter(post => slugs.includes(post.slug));
  }

  // Fallback to general helpful articles
  return BLOG_POSTS.filter(post => 
    ['autosleutel-kosten-per-merk-2026', 'dealer-vs-mobiele-sleutelmaker', 'verzekering-dekt-autosleutel-vervangen'].includes(post.slug)
  );
}
