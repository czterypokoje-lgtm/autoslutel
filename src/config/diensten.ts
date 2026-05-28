// ============================================================
// DIENSTEN CONFIG — Service pages
// ============================================================
export type Service = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  h1: string;
  intro: string;
  system?: string;
  priceFrom?: string;
  duration?: string;
  steps: string[];
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
};

export const DIENSTEN: Service[] = [
  {
    slug: 'sleutel-bijmaken',
    title: 'Sleutel Bijmaken',
    metaTitle: 'Autosleutel Bijmaken | Reserve Sleutel Programmeren | Alle Merken | Mobiel',
    metaDesc: 'Autosleutel bijmaken aan huis. Reserve sleutel programmeren voor alle merken en modellen. Goedkoper dan dealer. Bel: 06-XX XX XX XX',
    h1: 'Autosleutel Bijmaken — Reserve Sleutel Ter Plaatse Geprogrammeerd',
    intro: 'Een reserve sleutel is de beste verzekering tegen een onbereikbare auto. Wij maken reserve sleutels voor alle merken en modellen aan huis — geen sleepkosten, geen afspraken bij de dealer.',
    priceFrom: 'Prijs op aanvraag (indicatie €95–€250)',
    duration: '45–120 minuten',
    steps: [
      'Bel of WhatsApp ons — geef uw automerk, model en bouwjaar door',
      'Wij rijden naar uw locatie (huis, werk, parkeerplaats)',
      'Wij lezen het bestaande sleutelsysteem uit met professionele tools',
      'Nieuwe sleutel wordt gesneden én geprogrammeerd',
      'Test: alle deuren, motor start, afstandsbediening werkt',
      'Verzekeringsklare factuur meegegeven',
    ],
    faq: [
      { q: 'Kan ik een sleutel bijmaken zonder de originele sleutel?', a: 'In veel gevallen ja. Bij AKL (Alle Sleutels Kwijt) service programmeren wij direct via OBD of bench methode. Bel voor de mogelijkheden voor uw merk.' },
      { q: 'Hoe lang duurt het bijmaken van een sleutel?', a: 'Gemiddeld 45–120 minuten. BMW en Mercedes duren langer vanwege complexere systemen (CAS/EIS). VW/Toyota gaat sneller.' },
      { q: 'Kost een bijgemaakte sleutel minder dan bij de dealer?', a: 'Ja, gemiddeld 30–50% minder. Wij komen bovendien naar u toe — geen sleepkosten of vervoerskosten.' },
    ],
    relatedSlugs: ['transponder-sleutel-programmeren', 'smart-key-programmeren', 'reservesleutel-maken'],
  },
  {
    slug: 'transponder-sleutel-programmeren',
    title: 'Transponder Sleutel Programmeren',
    metaTitle: 'Transponder Sleutel Programmeren | Chip Sleutel | Alle Merken | Mobiel 24/7',
    metaDesc: 'Transponder sleutel programmeren voor alle merken. Chip-sleutels en ID-chips ter plaatse geprogrammeerd. Goedkoper dan dealer. Bel: 06-XX XX XX XX',
    h1: 'Transponder Sleutel Programmeren — Chip Sleutel Ter Plaatse',
    intro: 'De meeste auto\'s vanaf 1995 gebruiken een transponder chip in de sleutel. Zonder correcte programmering start de motor niet. Wij programmeren transponder sleutels voor alle merken en systemen mobiel aan huis.',
    system: 'ID46, ID48, ID4D, PCF7936, PCF7945, PCF7953, Hitag2, Hitag3, Hitag Pro',
    priceFrom: 'Prijs op aanvraag (afhankelijk van chip-type)',
    duration: '30–90 minuten',
    steps: [
      'Diagnose: uitlezen huidige transponder type via OBD of sleutellezer',
      'Juiste transponder chip geselecteerd uit onze voorraad',
      'Chip klonen of nieuw programmeren in het ECU/immo systeem',
      'Sleutel gesneden op maat (indien nodig)',
      'Volledige test: motor start, immobilizer deactiveert correct',
    ],
    faq: [
      { q: 'Wat is het verschil tussen een transponder sleutel en een normale sleutel?', a: 'Een transponder sleutel heeft een RFID chip ingebouwd. De auto controleert of de chip herkend wordt voor de motor mag starten. Zonder chip start de auto niet.' },
      { q: 'Kan een transponder sleutel worden gekloonet?', a: 'Ja, voor veel oudere systemen is klonen mogelijk. Nieuwere encrypted chips (Hitag Pro, DST80) vereisen ECU-programmering. Wij hebben apparatuur voor beide methoden.' },
      { q: 'Mijn sleutel draait maar de auto start niet — is dat de transponder?', a: 'Zeer waarschijnlijk. Controleer of het dashboard immo-lampje brandt. Bel ons — wij diagnosticeren ter plaatse.' },
    ],
    relatedSlugs: ['sleutel-bijmaken', 'smart-key-programmeren', 'contact-reparatie'],
  },
  {
    slug: 'smart-key-programmeren',
    title: 'Smart Key / Keyless Entry Programmeren',
    metaTitle: 'Smart Key Programmeren | Keyless Entry | Comfort Access | Alle Merken | Mobiel',
    metaDesc: 'Smart key en keyless entry sleutels programmeren voor alle merken. Proximity key, comfort access, push-to-start. Mobiel aan huis. Bel: 06-XX XX XX XX',
    h1: 'Smart Key & Keyless Entry Programmeren — Proximity Sleutels',
    intro: 'Moderne auto\'s met push-to-start en keyless entry gebruiken proximity smart keys die speciale programmering vereisen. Wij programmeren alle typen smart keys en keyless entry systemen voor alle merken.',
    system: 'BMW CAS/FEM/BDC, Mercedes KEYLESS-GO, Audi MMI, Toyota Smart Key, Ford PEPS, VW Comfort Access',
    priceFrom: 'Prijs op aanvraag (indicatie €180–€450)',
    duration: '60–150 minuten',
    steps: [
      'OBD uitlezen: huidige smart key systeem en configuratie',
      'Nieuwe proximity key fob besteld of uit voorraad',
      'Programmering via OBD of dealer-niveau tool (AVDI/VVDI)',
      'Comfort access, automatisch vergrendelen, proximity detectie getest',
      'Push-to-start functionaliteit volledig getest',
    ],
    faq: [
      { q: 'Kan mijn gestolen smart key worden uitgeschakeld?', a: 'Ja. Bij AKL service wissen wij alle bestaande sleutels uit het systeem en programmeren nieuwe. De gestolen sleutel wordt 100% onbruikbaar.' },
      { q: 'Werkt een smart key ook als de batterij leeg is?', a: 'Ja, er is een mechanische noodsleutel in de fob verstopt. De start werkt via inductie. Wij leggen dit ook uit bij de service.' },
      { q: 'Mijn push-to-start werkt niet — wat nu?', a: 'Mogelijke oorzaken: lege sleutelbatterij, defecte antenne, of programmeerprobleem. Bel ons — wij diagnosticeren ter plaatse.' },
    ],
    relatedSlugs: ['transponder-sleutel-programmeren', 'sleutel-bijmaken', 'alarm-programmeren'],
  },
  {
    slug: 'reservesleutel-maken',
    title: 'Reservesleutel Laten Maken',
    metaTitle: 'Reservesleutel Auto Laten Maken | Alle Merken | Mobiel Aan Huis | Goedkoop',
    metaDesc: 'Reservesleutel laten maken voor uw auto. Alle merken. Wij komen aan huis. Geen sleepkosten. Goedkoper dan dealer. Bel: 06-XX XX XX XX',
    h1: 'Reservesleutel Laten Maken — Mobiel, Snel, Goedkoper Dan Dealer',
    intro: 'Een reservesleutel is geen luxe maar een noodzaak. Wij maken reservesleutels voor alle merken — van eenvoudige transponder sleutels tot complexe BMW CAS4+ en Mercedes EIS smart keys.',
    priceFrom: 'Prijs op aanvraag',
    duration: '45–120 minuten',
    steps: [
      'Bel voor prijs op maat — geef merk, model en bouwjaar',
      'Wij rijden naar uw locatie met de juiste sleutelbehuizing',
      'Sleutel snijden op maat van uw slot',
      'Transponder/smart key programmering in het ECU',
      'Volledige test alle functies',
    ],
    faq: [
      { q: 'Hoeveel sleutels kan mijn auto onthouden?', a: 'Afhankelijk van het systeem: VW/Audi 8 sleutels, BMW 10 sleutels, Toyota 4–8. Wij controleren het beschikbare aantal bij uw auto.' },
      { q: 'Heeft mijn dealer toestemming nodig?', a: 'Nee. Wij mogen als professional reservesleutels maken voor elk merk — ook zonder dealertoestemming.' },
    ],
    relatedSlugs: ['sleutel-bijmaken', 'transponder-sleutel-programmeren', 'smart-key-programmeren'],
  },
  {
    slug: 'contact-reparatie',
    title: 'Contact / Contactslot Reparatie',
    metaTitle: 'Contactslot Reparatie | Auto Contact Defect | Mobiliseren | Alle Merken | Mobiel',
    metaDesc: 'Contactslot defect of beschadigd? Wij repareren of vervangen het contactslot ter plaatse. Alle merken. 24/7 mobiel. Bel: 06-XX XX XX XX',
    h1: 'Contact Reparatie — Contactslot Defect of Beschadigd?',
    intro: 'Een defect contactslot legt uw auto volledig stil. Wij repareren of vervangen het contactslot (inclusief EIS/ESL bij Mercedes) mobiel aan huis. Geen sleepkosten naar de garage.',
    priceFrom: 'Afhankelijk van diagnose — bel voor prijs',
    duration: '60–240 minuten',
    steps: [
      'Diagnose via OBD: elektrisch of mechanisch contactprobleem',
      'Inschatting reparatie of vervanging noodzakelijk',
      'Contactslot reparatie of vervangen',
      'Hercoderen sleutels aan nieuw contactslot',
      'Volledige mobiliteitest: start, rijden mogelijk',
    ],
    faq: [
      { q: 'Mijn sleutel draait niet in het contact — wat kan dit zijn?', a: 'Mechanische slijtage, stuurwielslot vergrendeld, of beschadiging door inbraakpoging. Bel ons — wij diagnosticeren ter plaatse.' },
      { q: 'Moet mijn auto naar de garage voor contactreparatie?', a: 'Nee. Wij komen naar u toe. Onze bus heeft alle gereedschappen en onderdelen voor de meeste merken.' },
      { q: 'Kan ik na contactvervanging mijn oude sleutels nog gebruiken?', a: 'Ja, wij hercoderen uw bestaande sleutels aan het nieuwe contactslot. Geen nieuwe sleutels nodig.' },
    ],
    relatedSlugs: ['sleutel-bijmaken', 'transponder-sleutel-programmeren', 'alarm-programmeren'],
  },
  {
    slug: 'alarm-programmeren',
    title: 'Autoalarm Programmeren',
    metaTitle: 'Autoalarm Programmeren | Installatie & Storing | Alle Merken | Mobiel 24/7',
    metaDesc: 'Autoalarm programmeren, installeren of storingsoplossing. Ghost immobilizer. Alle merken. Mobiel aan huis. Bel: 06-XX XX XX XX',
    h1: 'Autoalarm Programmeren — Installatie, Storing & Ghost Immobilizer',
    intro: 'Van fabrieksalarm storing tot Ghost immobilizer installatie — wij programmeren en installeren alle typen autoalarmsystemen mobiel aan huis.',
    priceFrom: 'Bel voor prijs op maat',
    duration: '60–180 minuten',
    steps: [
      'Diagnose: fabrieksalarm of aftermarket systeem',
      'Uitlezen storingscodes en systeemconfiguratie',
      'Reparatie, hercodering of nieuwe installatie',
      'Ghost immobilizer: installatie en PIN-code programmering',
      'Volledige test anti-diefstal bescherming',
    ],
    faq: [
      { q: 'Wat is een Ghost immobilizer?', a: 'Een Ghost immobilizer is een onzichtbaar anti-diefstal systeem dat een geheime PIN-code vereist voor de auto kan starten. Niet te vinden door dieven.' },
      { q: 'Mijn alarm slaat continu aan — wat nu?', a: 'Bel ons. Wij kunnen een alarm tijdelijk deactiveren en daarna correct programmeren. 24/7 beschikbaar.' },
      { q: 'Kan ik een aftermarket alarm laten verwijderen?', a: 'Ja. Wij verwijderen aftermarket alarmen professioneel en zorgen dat het voertuig correct reageert op het fabriekssleutelsysteem.' },
    ],
    relatedSlugs: ['smart-key-programmeren', 'transponder-sleutel-programmeren', 'contact-reparatie'],
  },
  {
    slug: 'alle-sleutels-kwijt-auto',
    title: 'Alle Sleutels Kwijt',
    metaTitle: 'Alle Autosleutels Kwijt? | AKL Service | Alle Merken | Mobiel 24/7',
    metaDesc: 'Bent u alle autosleutels kwijt? Wij maken ter plaatse nieuwe sleutels voor elk merk. Geen sleepkosten. 24/7 mobiele hulp. Bel: 06-XX XX XX XX',
    h1: 'Alle Autosleutels Kwijt? — Wij Helpen U Ter Plaatse Terug op Weg',
    intro: 'Het is een nachtmerrie: u bent alle sleutels van uw auto kwijt. De dealer vraagt hoofdprijzen en weken wachttijd. Wij lossen het vandaag nog op. Wij openen uw auto schadevrij en programmeren nieuwe sleutels direct in het ECU.',
    system: 'AKL (All Keys Lost) specialist voor BMW CAS/FEM, Mercedes EIS, VW MQB, Toyota G/H chip',
    priceFrom: 'Prijs op aanvraag (indicatie €250–€650)',
    duration: '90–240 minuten',
    steps: [
      'Identiteitscontrole: wij verifiëren dat u de eigenaar van het voertuig bent',
      'Schadevrije opening: wij openen de deur zonder krassen of schade',
      'Mechanische sleutelcode: wij lezen de mechanische code uit het slot',
      'EEPROM/OBD programmering: wij schrijven nieuwe sleutelgegevens direct in de computer',
      'Synchronisatie: alle systemen worden weer werkend gemaakt',
    ],
    faq: [
      { q: 'Moet mijn auto worden weggesleept?', a: 'Nee. Dat is het grote voordeel van onze mobiele service. Wij doen alles op de locatie waar uw auto staat.' },
      { q: 'Worden de oude (verloren) sleutels geblokkeerd?', a: 'Ja. Bij een AKL service wissen wij alle oude sleutels uit het geheugen van de auto. Als iemand uw oude sleutel vindt, kan hij de auto niet meer starten.' },
    ],
    relatedSlugs: ['sleutel-bijmaken', 'smart-key-programmeren', 'contact-reparatie'],
  },
  {
    slug: 'ecu-clonen-component-protection',
    title: 'ECU Clonen & Component Protection',
    metaTitle: 'ECU Clonen | Component Protection Vrijgeven | Alle Merken | Specialist',
    metaDesc: 'ECU clonen, motormanagement programmeren of component protection vrijgeven. Specialistische service voor alle merken. Bel: 06-XX XX XX XX',
    h1: 'ECU Clonen & Component Protection — Elektronische Specialist',
    intro: 'Heeft u een tweedehands ECU of module gekocht? Wij clonen de gegevens van uw oude module naar de nieuwe, of geven "Component Protection" vrij zodat de module werkt in uw auto.',
    system: 'Bosch, Continental, Magneti Marelli, Delphi, VDO',
    priceFrom: 'Vanaf €150',
    duration: '60–180 minuten',
    steps: [
      'Uitlezen data van de defecte/originele module (Bench of Boot)',
      'Aanpassen van VIN, IMMO data of Kilometerstand indien nodig',
      'Schrijven van data naar de nieuwe/gebruikte module',
      'Online inleren of Component Protection vrijgeven',
      'Volledige systeemdiagnose',
    ],
    faq: [
      { q: 'Wat is Component Protection?', a: 'Dit is een beveiliging van o.a. de VAG-groep (Audi/VW) die voorkomt dat modules uit andere auto\'s zomaar werken. Wij kunnen dit officieel vrijgeven.' },
      { q: 'Kan elke computer worden gekloond?', a: 'Niet elke computer, maar wel ca. 95%. Wij gebruiken professionele tools zoals Autotuner en KESS3.' },
    ],
    relatedSlugs: ['transponder-sleutel-programmeren', 'alarm-programmeren', 'contact-reparatie'],
  },
  {
    slug: 'ghost-immobiliser-installeren',
    title: 'Ghost Immobiliser Installeren',
    metaTitle: 'Ghost Immobiliser Installatie | Onzichtbare Diefstalbeveiliging | 24/7',
    metaDesc: 'Laat een Ghost Immobiliser installeren. De ultieme onzichtbare diefstalbeveiliging. Geen signaal, geen diefstal mogelijk. Bel: 06-XX XX XX XX',
    h1: 'Ghost Immobiliser Installatie — De Ultieme Beveiliging',
    intro: 'De Ghost Immobiliser is een uniek systeem dat via het CAN-bus netwerk van uw auto werkt. De auto start pas na het invoeren van een unieke code via de knoppen op uw stuur of dashboard.',
    system: 'Autowatch Ghost II / CAN-bus security',
    priceFrom: 'Vanaf €499 inclusief montage',
    duration: '120–180 minuten',
    steps: [
      'Onzichtbare installatie in het kabelnetwerk van de auto',
      'Programmering van de unieke PIN-code naar wens van de klant',
      'Uitleg over de Service Mode (voor garagebezoek)',
      'Koppeling met de smartphone app (optioneel)',
      'Certificaat van installatie',
    ],
    faq: [
      { q: 'Kan een dief het systeem vinden?', a: 'Nee. Er zijn geen draden doorgeknipt en het systeem zendt geen radio-signalen uit. Het is onvindbaar voor scanners.' },
      { q: 'Behoud ik mijn fabrieksgarantie?', a: 'Ja, de installatie is non-invasief voor de software van de fabrikant.' },
    ],
    relatedSlugs: ['alarm-programmeren', 'smart-key-programmeren', 'sleutel-bijmaken'],
  },
  {
    slug: 'bedrijfswagen-sleutel-beheer',
    title: 'Bedrijfswagen Sleutel Beheer',
    metaTitle: 'Bedrijfswagen Sleutel Beheer | Wagenpark Sleutelservice | Zakelijk',
    metaDesc: 'Sleutelbeheer voor uw bedrijfswagens. Reservesleutels voor uw hele wagenpark. Snelle service, zakelijke factuur. Bel: 06-XX XX XX XX',
    h1: 'Bedrijfswagen Sleutel Beheer — Voor Ondernemers en Wagenparkbeheerders',
    intro: 'Als uw bedrijfswagen stilstaat, kost dat geld. Wij bieden preventief sleutelbeheer voor wagenparken. Wij maken reservesleutels voor alle bussen en vrachtwagens (Iveco, DAF, MAN, Scania) ter plaatse op uw bedrijf.',
    system: 'Daily, Transporter, Transit, Vivaro, Expert, Boxer, Ducato, XF, TGX, R-Serie',
    priceFrom: 'Zakelijke tarieven op aanvraag',
    duration: 'Op afspraak',
    steps: [
      'Inventarisatie van uw huidige wagenpark',
      'Planning voor het maken van reservesleutels op uw locatie',
      'Programmering van meerdere voertuigen op één dag',
      'Beheer van sleutelcodes voor snelle hulp bij verlies in de toekomst',
      'Verzamelrekening met BTW-specificatie',
    ],
    faq: [
      { q: 'Werkt u ook op zaterdag voor bedrijven?', a: 'Ja. Wij begrijpen dat uw bussen doordeweeks op de weg moeten zijn. Wij kunnen op zaterdag uw hele vloot voorzien van reservesleutels.' },
      { q: 'Biedt u korting bij meerdere voertuigen?', a: 'Zeker. Voor wagenparkbeheerders hanteren wij speciale projecttarieven.' },
    ],
    relatedSlugs: ['sleutel-bijmaken', 'transponder-sleutel-programmeren', 'contact-reparatie'],
  },
];
