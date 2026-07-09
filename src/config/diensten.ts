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
  // ── 1. AUTODEUR OPENEN ─────────────────────────────────────
  {
    slug: 'autodeur-openen',
    title: 'Autodeur Openen',
    metaTitle: 'Autodeur Openen Zonder Sleutel | Schadevrij & 24/7 Mobiel',
    metaDesc: 'Autodeur openen zonder sleutel? Wij openen uw auto 100% schadevrij op locatie. Gemiddeld binnen 30 min ter plaatse in Utrecht & Amsterdam. Bel direct!',
    h1: 'Autodeur Openen Zonder Sleutel — Mobiel & Schadevrij ter Plaatse',
    intro: 'Heeft u uw autosleutels in de auto laten liggen of is de deur dichtgevallen? Wij openen uw autodeur 100% schadevrij. Met onze mobiele service zijn we gemiddeld binnen 30 minuten op uw locatie in de regio Utrecht en Amsterdam.',
    system: 'Lishi Lock Decoders / Over-the-shoulder tools',
    priceFrom: 'Vanaf €95',
    duration: '15–30 minuten',
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
    intro: 'Het overkomt de beste: u stapt uit, de deuren vallen in het slot, en uw autosleutel ligt nog op de stoel of in het contactslot. Geen paniek. Onze specialisten openen uw auto ter plaatse zonder enige vorm van schade.',
    system: 'Lishi HU66, HU92, HU101, HU162T Decoders',
    priceFrom: 'Vanaf €95',
    duration: '15–30 minuten',
    steps: [
      'Bel direct en leg de situatie uit',
      'Onze mobiele bus komt direct naar uw locatie in Utrecht of Amsterdam',
      'Wij decoderen de slotcilinder om de auto elektronisch te ontgrendelen',
      'U heeft uw sleutel weer terug zonder sleepkosten of dealer-tarieven'
    ],
    faq: [
      { q: 'Hoe opent u een auto met de sleutel er nog in?', a: 'Wij maken gebruik van mechanische decoders (Lishi) die de slotplaatjes in de cilinder één voor één uitlijnen, alsof de originele sleutel wordt omgedraaid. Dit voorkomt dat we ramen hoeven in te slaan of deurrubbers beschadigen.' },
      { q: 'Werkt dit ook als de accu van de auto leeg is?', a: 'Ja. Zelfs bij een lege accu kunnen wij de auto mechanisch openen via de noodcilinder in de handgreep.' }
    ],
    relatedSlugs: ['autodeur-openen', 'deur-dichtgevallen', 'kofferbak-openen', 'noodopening-auto']
  },
  {
    slug: 'deur-dichtgevallen',
    title: 'Deur Dichtgevallen',
    metaTitle: 'Autodeur Dichtgevallen met Sleutel erin? | Snel Geopend | 24/7',
    metaDesc: 'Deur van de auto dichtgevallen en de sleutel ligt binnen? Onze mobiele locksmith opent uw deur schadevrij. 24/7 Utrecht & Amsterdam.',
    h1: 'Autodeur Dichtgevallen met Sleutel erin? — Direct Geopend',
    intro: 'Als uw autodeur is dichtgevallen met de sleutel erin en de auto automatisch op slot is gegaan, wilt u snel weer toegang. Onze mobiele slotenmakers zijn 24 uur per dag stand-by om uw autodeur schadevrij te openen.',
    system: 'Professional Locksmith Bypass Tools',
    priceFrom: 'Vanaf €95',
    duration: '15–30 minuten',
    steps: [
      'Bel ons storingsnummer voor directe hulp',
      'We sturen de dichtstbijzijnde monteur naar u toe',
      'Schadevrije opening via de deurgreep of slotcilinder',
      'U kunt uw weg direct vervolgen'
    ],
    faq: [
      { q: 'Waarom gaat een auto zomaar op slot als de deur dichtvalt?', a: 'Veel moderne auto\'s hebben een automatische vergrendelingsfunctie (auto-relock) die geactiveerd wordt na een bepaalde tijd of als de sleutel buiten het bereik van de startonderbreker-antenne ligt.' },
      { q: 'Moet ik mijn deurslot achteraf vervangen?', a: 'Nee, onze technieken laten het deurslot en de elektronica volledig intact. U kunt uw bestaande sleutels gewoon blijven gebruiken.' }
    ],
    relatedSlugs: ['autodeur-openen', 'sleutel-in-auto', 'kofferbak-openen', 'sleutel-afgebroken-in-slot']
  },
  {
    slug: 'kofferbak-openen',
    title: 'Kofferbak Openen',
    metaTitle: 'Sleutel in Kofferbak Laten Liggen? | Schadevrij Openen | 24/7',
    metaDesc: 'Autosleutel in de kofferbak laten liggen en de auto zit op slot? Wij openen uw kofferbak 100% schadevrij op locatie. Bel nu voor spoedhulp!',
    h1: 'Kofferbak Openen Zonder Sleutel — Snel & Schadevrij ter Plaatse',
    intro: 'Sleutel in de kofferbak laten liggen en zit de auto op slot? Kofferbakken hebben vaak een complexer mechanisme met een dubbele vergrendeling (deadlock). Wij beschikken over de juiste tools om uw kofferbak schadevrij te openen via de slotcilinder of door de boardcomputer elektronisch aan te sturen.',
    system: 'Lishi Laser Picks & OBD electronic triggers',
    priceFrom: 'Vanaf €95',
    duration: '20–45 minuten',
    steps: [
      'U belt ons en meldt dat de sleutel in de kofferbak ligt',
      'Onze specialist komt ter plaatse en inspecteert het voertuig',
      'De auto wordt via het portierslot of de kofferbakcilinder geopend',
      'U heeft uw sleutel direct weer in handen'
    ],
    faq: [
      { q: 'Waarom is een kofferbak openen moeilijker dan een portier?', a: 'Bij veel auto\'s (vooral sedans en premium merken zoals BMW of Audi) schakelt de centrale vergrendelingsknop op het dashboard uit als de auto op slot zit. Hierdoor moeten we de kofferbak mechanisch manipuleren of de module direct via de OBD-poort triggeren.' },
      { q: 'Kan de kofferbak open zonder schade aan de lak of het slot?', a: 'Ja, 100% gegarandeerd. We gebruiken laser lockpicks die de lak en cilinder absoluut niet beschadigen.' }
    ],
    relatedSlugs: ['autodeur-openen', 'sleutel-in-auto', 'deur-dichtgevallen', 'sleutel-afgebroken-in-slot']
  },
  {
    slug: 'sleutel-afgebroken-in-slot',
    title: 'Sleutel Afgebroken in Slot',
    metaTitle: 'Autosleutel Afgebroken in Slot of Contact? | Verwijderen & Nieuwe Sleutel',
    metaDesc: 'Autosleutel afgebroken in het deurslot of contactslot? Wij halen de afgebroken sleutel schadevrij uit het slot en maken direct een nieuwe sleutel ter plaatse.',
    h1: 'Autosleutel Afgebroken in Slot of Contactslot? — Wij Lossen Het Op',
    intro: 'Is uw autosleutel afgebroken in het deurslot of contactslot? Probeer het afgebroken deel er niet zelf uit te peuteren, dit kan de interne plaatjes beschadigen. Onze monteurs halen de sleutel schadevrij uit de cilinder en snijden direct een nieuwe autosleutel op locatie.',
    system: 'Professional Key Extractors & CNC Computerized Key Cutters',
    priceFrom: 'Vanaf €120',
    duration: '30–60 minuten',
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
    relatedSlugs: ['autodeur-openen', 'sleutel-bijmaken', 'contactslot-reparatie', 'autosleutels-repareren']
  },

  // ── 2. AUTOSLEUTEL BIJMAKEN ───────────────────────────────
  {
    slug: 'sleutel-bijmaken',
    title: 'Autosleutel Bijmaken',
    metaTitle: 'Autosleutel Bijmaken | Reserve Autosleutel Namaken | 12 Mnd Garantie',
    metaDesc: 'Autosleutel bijmaken op locatie? Reserve sleutel programmeren voor alle merken. Goedkoper dan de dealer, direct klaar met 12 maanden garantie. Bel nu!',
    h1: 'Autosleutel Bijmaken & Programmeren — Mobiele Service op Locatie',
    intro: 'Wilt u een reservesleutel laten maken om te voorkomen dat u ooit buitengesloten raakt? Wij maken en programmeren reservesleutels voor alle merken en modellen direct aan huis of op uw werk. U krijgt standaard 12 maanden garantie op de elektronica en de transponder chip.',
    system: 'AVDI, Lonsdor K518, VVDI, Autel IM608 Pro',
    priceFrom: 'Vanaf €149',
    duration: '30–60 minuten',
    steps: [
      'Geef uw merk, model en bouwjaar door via telefoon of WhatsApp',
      'Wij plannen een moment in dat u uitkomt op uw locatie',
      'We snijden de sleutelbaard op maat met een CNC-computergestuurde machine',
      'We programmeren de transponder en afstandsbediening via de OBD-diagnosepoort',
      'Volledige test van alle functies (deuren, kofferbak, motor starten)'
    ],
    faq: [
      { q: 'Wat kost een autosleutel bijmaken bij jullie?', a: 'Een standaard transpondersleutel begint bij €149. Een klapsleutel met afstandsbediening kost gemiddeld €199 tot €349. Een Smart Key is beschikbaar vanaf €299. Dit is gemiddeld 30% tot 50% goedkoper dan de officiële dealer.' },
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
    intro: 'De transponder is een kleine microchip in uw autosleutel die communiceert met de startonderbreker (immobilizer) van uw auto. Zonder correcte transponder start de motor niet. Wij programmeren en schrijven transponderchips rechtstreeks in de boordcomputer van uw voertuig.',
    system: 'Megamos ID48, NXP PCF7935 / PCF7936 / PCF7945 / PCF7953, Hitag 2 / 3 / Pro, DST40 / DST80 / DST-AES',
    priceFrom: 'Vanaf €95',
    duration: '30–60 minuten',
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
    relatedSlugs: ['sleutel-bijmaken', 'smart-key-programmeren', 'afstandsbediening-bijmaken', 'contactslot-reparatie']
  },
  {
    slug: 'afstandsbediening-bijmaken',
    title: 'Afstandsbediening Bijmaken',
    metaTitle: 'Autosleutel met Afstandsbediening Bijmaken | OEM Kwaliteit | 24/7',
    metaDesc: 'Nieuwe afstandsbediening voor uw auto nodig? Wij programmeren afstandsbedieningen op locatie. Centrale vergrendeling, OEM chips, 12 mnd garantie.',
    h1: 'Autosleutel met Afstandsbediening Bijmaken & Synchroniseren',
    intro: 'Wilt u een sleutel met werkende knoppen voor centrale vergrendeling? Wij programmeren autosleutels met afstandsbediening voor vrijwel alle merken. We gebruiken uitsluitend hoogwaardige OEM-kwaliteit printplaten en chips met ASK of FSK modulatie.',
    system: 'ASK / FSK Rolling Code, NXP PCF7946 / PCF7961, Hitag2, 315MHz / 433MHz / 868MHz',
    priceFrom: 'Vanaf €120',
    duration: '30–60 minuten',
    steps: [
      'Sleutelbaard mechanisch slijpen op basis van uw slot',
      'De printplaat van de afstandsbediening synchroniseren met de BCM (Body Control Module)',
      'Centrale vergrendeling en eventuele kofferbak/alarm-knoppen configureren',
      'Signaalsterkte en rolling code beveiliging testen'
    ],
    faq: [
      { q: 'Waarom werkt de afstandsbediening soms niet na het vervangen van de batterij?', a: 'Sommige autosleutels verliezen hun synchronisatie als de batterij te lang leeg is geweest. Wij kunnen de afstandsbediening via een speciale procedure opnieuw inleren op uw auto.' },
      { q: 'Zijn de afstandsbedieningen die u levert origineel?', a: 'Wij leveren zowel originele OEM-sleutels als kwalitatieve aftermarket alternatieven die identiek functioneren. U heeft altijd de keuze en krijgt 12 maanden garantie.' }
    ],
    relatedSlugs: ['sleutel-bijmaken', 'smart-key-programmeren', 'transponder-programmeren', 'batterij-vervangen']
  },
  {
    slug: 'smart-key-programmeren',
    title: 'Smart Key / Keyless Entry Programmeren',
    metaTitle: 'Smart Key Programmeren | Keyless Go & Proximity Sleutels',
    metaDesc: 'Keyless entry & smart keys programmeren op locatie. Specialist in BMW CAS4/FEM/BDC, VAG MQB, Mercedes FBS3/FBS4. 12 maanden garantie. Bel!',
    h1: 'Smart Key & Keyless Entry Programmeren — Proximity Specialist',
    intro: 'Moderne voertuigen met een startknop maken gebruik van "Smart Keys" of "Proximity Keys" die communiceren via antennes in het interieur. Het inleren hiervan vereist gespecialiseerde programmeerapparatuur op dealer-niveau. Wij programmeren smart keys voor alle merken, inclusief Mercedes FBS3/FBS4 en BMW FEM/BDC.',
    system: 'BMW CAS4+ / FEM / BDC / BDC2, Mercedes-Benz FBS3 / FBS4 / EIS / ELV, VAG MQB / MQB48 / MLB / SFD, JLR KVM / RFA / BCM',
    priceFrom: 'Vanaf €180',
    duration: '45–90 minuten',
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
    relatedSlugs: ['sleutel-bijmaken', 'transponder-programmeren', 'afstandsbediening-bijmaken', 'ghost-immobiliser']
  },
  {
    slug: 'reservesleutel-maken',
    title: 'Reservesleutel Laten Maken',
    metaTitle: 'Reservesleutel Auto Laten Maken | 12 Maanden Garantie | Mobiel',
    metaDesc: 'Extra reservesleutel voor uw auto laten maken? Wij programmeren reservesleutels voor alle merken op locatie. Goedkoper dan dealer. Bel nu!',
    h1: 'Reservesleutel Auto Laten Maken — Voorkom Hoge Sleepkosten',
    intro: 'Als u nog maar één autosleutel heeft, loopt u een groot risico. Bij verlies van uw laatste sleutel (All Keys Lost) zijn de kosten voor opening en programmering vele malen hoger. Laat daarom tijdig een reservesleutel maken. Wij komen bij u op locatie in Utrecht of Amsterdam, zodat u geen tijd verliest.',
    system: 'Transponder Cloners / OBD programming tools',
    priceFrom: 'Vanaf €95',
    duration: '30–60 minuten',
    steps: [
      'U kiest of u een eenvoudige reservesleutel (zonder knoppen) of een afstandsbediening wilt',
      'We slijpen de mechanische sleutel op basis van uw huidige sleutel',
      'We klonen de transponder chip of schrijven deze in via de OBD-poort',
      'De nieuwe sleutel wordt direct op werking getest'
    ],
    faq: [
      { q: 'Kan ik ook een eenvoudige reservesleutel zonder knoppen krijgen?', a: 'Ja, dat is een uitstekende budgetoptie. Deze sleutel kan de deuren mechanisch openen en bevat de juiste transponder chip om de motor te starten. Dit kan al vanaf €95.' },
      { q: 'Hoe lang duurt het maken van een reservesleutel?', a: 'Binnen 30 tot 60 minuten is uw nieuwe reservesleutel klaar en volledig geprogrammeerd.' }
    ],
    relatedSlugs: ['sleutel-bijmaken', 'transponder-programmeren', 'afstandsbediening-bijmaken', 'smart-key-programmeren']
  },

  // ── 3. AUTOSLEUTEL KWIJT ──────────────────────────────────
  {
    slug: 'autosleutel-kwijt',
    title: 'Autosleutel Kwijt',
    metaTitle: 'Autosleutel Kwijt of Verloren? | Direct Nieuwe Sleutel op Locatie',
    metaDesc: 'Autosleutel kwijt, verloren of gestolen? Onze mobiele autosleutelservice komt direct naar u toe in Utrecht & Amsterdam. 24/7 spoedhulp. Bel nu!',
    h1: 'Autosleutel Kwijt of Verloren? — Wij Helpen U Direct Weer op Weg',
    intro: 'Bent u uw autosleutel verloren, is deze gestolen of in het water gevallen? Onze mobiele autosleutelservice helpt u direct ter plaatse. Wij openen uw auto schadevrij, wissen de oude sleutels uit het geheugen (tegen diefstal) en programmeren direct een nieuwe set sleutels.',
    system: 'EEPROM / MCU programmering & OBD software keys',
    priceFrom: 'Vanaf €190',
    duration: '45–120 minuten',
    steps: [
      'Bel direct en vermeld uw locatie en het automodel',
      'Onze bus met mobiele programmeer- en snijapparatuur komt naar u toe',
      'Wij openen de autodeur 100% schadevrij',
      'De verloren sleutel wordt elektronisch geblokkeerd',
      'Een nieuwe transpondersleutel of smart key wordt geprogrammeerd'
    ],
    faq: [
      { q: 'Autosleutel kwijt, wat te doen?', a: 'Wanneer u uw autosleutel kwijt bent, controleer dan eerst of u de auto met een reserve-sleutel kunt openen. Is er geen reserve-sleutel beschikbaar? Neem dan direct contact op met Autosleutel24. Onze mobiele monteurs komen direct naar u toe, openen de auto 100% schadevrij, en maken ter plekke een nieuwe autosleutel met afstandsbediening klaar.' },
      { q: 'Wat te doen als je autosleutel is kwijt?', a: 'Als uw autosleutel kwijt is, dient u uw auto op een veilige plek te laten staan. Neem contact op met een mobiele autoslotenmaker zoals Autosleutel24 om de verloren sleutel uit de computer van de auto te laten wissen. Dit voorkomt dat onbevoegden met de gevonden sleutel uw auto kunnen stelen.' },
      { q: 'Autosleutel verloren, welke diensten bieden vervanging aan?', a: 'Bij het verliezen van een autosleutel bieden de merkdealer en een gespecialiseerde mobiele autoslotenmaker (zoals Autosleutel24) vervanging aan. Waar u bij de dealer de auto moet laten wegslepen en vaak dagen moet wachten op de sleutel, regelt Autosleutel24 de vervanging direct ter plaatse op locatie in heel Nederland binnen één dag.' },
      { q: 'Stappenplan autosleutel verloren?', a: 'Volg dit stappenplan bij het verliezen van een autosleutel: 1. Controleer of de auto op slot zit en veilig geparkeerd staat. 2. Verzamel de autogegevens (merk, model, bouwjaar, kenteken). 3. Neem contact op met Autosleutel24 via telefoon of WhatsApp. 4. De monteur komt naar u toe, opent de auto schadevrij en leest de startonderbreker uit. 5. De verloren sleutel wordt geblokkeerd en de nieuwe sleutel wordt ingeleerd.' },
      { q: 'Hoe snel kan een autosleutel worden bijgemaakt?', a: 'Bij Autosleutel24 kan een nieuwe autosleutel meestal binnen 30 tot 60 minuten ter plekke worden bijgemaakt en geprogrammeerd. U hoeft dus niet dagen te wachten zoals bij de officiële merkdealer.' },
      { q: 'Kosten nieuwe autosleutel laten maken?', a: 'De kosten voor het laten maken van een nieuwe autosleutel variëren gemiddeld van €95 tot €250, afhankelijk van het automerk, bouwjaar en of het een transpondersleutel, klapsleutel of smart key betreft. Autosleutel24 biedt deze service tot wel 60% goedkoper aan dan de dealer.' },
      { q: 'Waar vind ik een autosleutelmaker in mijn buurt?', a: 'U vindt een mobiele autosleutelmaker in uw buurt bij Autosleutel24. Wij rijden door heel Nederland, waaronder Utrecht, Amsterdam, Rotterdam, Den Haag, Almere, Amersfoort en omliggende regio\'s. Onze monteurs komen rechtstreeks naar uw locatie toe.' },
      { q: 'Waar kan ik een autosleutel laten bijmaken?', a: 'U kunt een autosleutel laten bijmaken bij een gespecialiseerde mobiele slotenmaker (zoals Autosleutel24) of bij de merkdealer. Een mobiele sleutelmaker is de meest comfortabele optie, omdat de sleutel direct bij uw huis of werklocatie wordt ingeleerd.' },
      { q: 'Kosten voor het bijmaken van een autosleutel zonder reserve?', a: 'Als u al uw autosleutels kwijt bent en geen reserve-sleutel heeft, starten de kosten bij Autosleutel24 vanaf €190. De slotenmaker moet in dit geval eerst het deurslot decoderen en de startonderbreker (EEPROM/OBD) programmeren.' },
      { q: 'Spoedservice voor verloren autosleutel?', a: 'Ja, Autosleutel24 biedt een 24/7 spoedservice voor verloren autosleutels. Bij spoedgevallen of wanneer u buitengesloten staat, streven onze monteurs ernaar om binnen 30 tot 45 minuten bij u ter plaatse te zijn.' },
      { q: 'Kan een autosleutel met afstandsbediening zonder originele sleutel worden gemaakt?', a: 'Ja, dat is mogelijk. Onze specialisten kunnen de unieke mechanische insnijding bepalen door de cilinder van de autodeur te decoderen. De transponder en de afstandsbediening programmeren we vervolgens rechtstreeks via de OBD2-diagnosepoort in de boordcomputer.' },
      { q: 'Auto openen zonder sleutel door professional?', a: 'Ja, Autosleutel24 opent uw auto 100% schadevrij zonder sleutel. Wij gebruiken professionele Lishi-decoders om de slotcilinder mechanisch te openen, waardoor de deuren, lak en lakrubbers volledig onbeschadigd blijven.' },
      { q: 'Autosleutel kwijt, kan de dealer een nieuwe maken?', a: 'Ja, de dealer kan een nieuwe maken, maar dit vereist dat u de auto op eigen kosten naar de dealer laat slepen. Daarnaast moet u vaak 3 tot 10 werkdagen wachten totdat de sleutel uit de fabriek geleverd en ingeleerd is.' },
      { q: 'Vervangende autosleutel bestellen online?', a: 'U kunt online een sleutelbehuizing bestellen, maar een werkende transpondersleutel met elektronica kan niet simpelweg online besteld worden. De sleutel moet namelijk fysiek in de auto worden geprogrammeerd met professionele OBD-apparatuur om te kunnen starten.' },
      { q: 'Hoe werkt autosleutel programmeren na verlies?', a: 'Bij het programmeren sluit de monteur een programmeercomputer aan op de OBD-poort van de auto. Hiermee worden de oude sleutelcodes uit de startonderbreker (immobilizer) gewist en worden de transponderchip en de afstandsbediening van de nieuwe sleutel gekoppeld.' },
      { q: 'Hoe lang duurt het om een nieuwe autosleutel te krijgen?', a: 'Bij de dealer duurt dit meestal 3 tot 10 werkdagen. Bij Autosleutel24 krijgt u uw nieuwe autosleutel dezelfde dag nog. Binnen 45 tot 60 minuten nadat de monteur op uw locatie is gearriveerd, kunt u weer rijden.' },
      { q: 'Is autosleutel kwijt gedekt door verzekering?', a: 'Ja, bij een WA+ (beperkt casco) of All-Risk verzekering is het verlies of diefstal van autosleutels vaak gedekt. U ontvangt van Autosleutel24 een officiële, gespecificeerde factuur die u rechtstreeks bij uw verzekeraar kunt indienen.' },
      { q: 'Welke bedrijven bieden 24/7 autosleutelservice?', a: 'Autosleutel24 biedt een 24/7 mobiele autosleutelservice in heel Nederland. U kunt ons dag en nacht telefonisch of via WhatsApp bereiken voor directe hulp bij buitensluiting of sleutelverlies.' },
      { q: 'Wat zijn de opties bij alle autosleutels kwijt?', a: 'Als u alle autosleutels kwijt bent, zijn er twee opties: 1. De auto naar de dealer laten slepen voor een duur en langdurig traject. 2. Autosleutel24 inschakelen. Wij komen naar u toe, openen de auto, slijpen een nieuwe sleutelbaard en programmeren de transponder ter plekke.' },
      { q: 'Hoe vind ik een goedkope autosleutelmaker?', a: 'U vindt een goedkope autosleutelmaker door te kiezen voor een onafhankelijke mobiele autosleutelspecialist zoals Autosleutel24. Wij hanteren vaste tarieven vooraf en zijn tot wel 60% goedkoper dan de officiële merkdealer omdat we geen sleepkosten en dure dealer-overhead doorberekenen.' },
      { q: 'Advies bij verlies van autosleutel met startonderbreker?', a: 'Bij verlies van een sleutel met startonderbreker is het belangrijk om de verloren sleutel direct uit de autocomputer te laten programmeren. Onze monteurs kunnen dit direct op locatie voor u doen, zodat de verloren sleutel de auto niet meer kan starten.' },
      { q: 'Kan ik een autosleutel online bestellen en laten programmeren?', a: 'Ja, u kunt online een universele sleutel kopen, maar veel onafhankelijke sleutelmakers kunnen deze niet programmeren vanwege compatibiliteitsproblemen met de transponderchips. Het is veiliger en sneller om direct een complete sleutel inclusief programmering bij Autosleutel24 af te nemen.' },
      { q: 'Autosleutel laten programmeren na verlies?', a: 'Autosleutel laten programmeren na verlies gebeurt direct op uw locatie. De monteur genereert een nieuwe transpondercode, schrijft deze via OBD2-diagnose-apparatuur in het geheugen van de startonderbreker, en synchroniseert de afstandsbediening.' },
      { q: 'Autosleutel kwijt, wat kost het vervangen door een universele sleutel?', a: 'Het vervangen van uw verloren sleutel door een universele OEM-kwaliteit sleutel kost bij Autosleutel24 gemiddeld tussen de €95 en €175, inclusief het slijpen van de sleutelbaard en het programmeren van de transponder. Dit is de meest voordelige en snelle oplossing.' }
    ],
    relatedSlugs: ['noodopening-auto', 'alle-sleutels-kwijt-auto', 'autodeur-openen', 'sleutel-bijmaken']
  },
  {
    slug: 'noodopening-auto',
    title: 'Noodopening',
    metaTitle: 'Noodopening Auto | Snel & Schadevrij Geopend | 24/7 Spoed',
    metaDesc: 'Noodopening van uw auto nodig? Binnen 30 min ter plaatse in Utrecht en Amsterdam. 100% schadevrij geopend door experts. Bel direct!',
    h1: 'Noodopening Auto — Snel & Schadevrij Binnen 30 Minuten',
    intro: 'Zit uw huisdier of kind in de auto en zijn de deuren dichtgevallen? Of heeft u met spoed toegang nodig tot uw voertuig omdat de sleutels binnen liggen? Wij voeren direct een noodopening uit. We zijn 24/7 bereikbaar en garanderen een 100% schadevrije opening.',
    system: 'Deadlock bypass tools & Laser Decoders',
    priceFrom: 'Vanaf €95',
    duration: '15–30 minuten',
    steps: [
      'U belt onze spoedlijn (directe prioriteit)',
      'De dichtstbijzijnde mobiele bus rijdt met zwaailicht/spoed naar u toe',
      'Het portierslot wordt mechanisch gedecoreerd en geopend binnen enkele minuten',
      'Direct toegang tot de auto'
    ],
    faq: [
      { q: 'Kunnen jullie ook auto\'s openen die op "deadlock" staan?', a: 'Ja. Deadlock betekent dat de deurgrepen aan de binnenkant elektronisch zijn uitgeschakeld. Wij openen deze voertuigen via de mechanische slotcilinder met Lishi decoders, waardoor de auto denkt dat de originele sleutel wordt gebruikt.' },
      { q: 'Hoe snel bent u bij mij bij een noodgeval?', a: 'Bij noodgevallen (zoals een kind of dier in de auto) geven wij absolute prioriteit en zijn we meestal binnen 15 tot 20 minuten op locatie.' }
    ],
    relatedSlugs: ['autodeur-openen', 'sleutel-in-auto', 'deur-dichtgevallen', 'autosleutel-kwijt']
  },
  {
    slug: 'alle-sleutels-kwijt-auto',
    title: 'Alle Sleutels Kwijt (AKL)',
    metaTitle: 'Alle Autosleutels Kwijt? | AKL Specialist op Locatie | 24/7',
    metaDesc: 'Alle autosleutels kwijt? Laat uw auto niet wegslepen naar de dealer! Wij maken nieuwe sleutels ter plaatse op locatie. Inclusief programmering. Bel nu!',
    h1: 'Alle Autosleutels Kwijt? — Mobiele Sleutelmaker ter Plaatse',
    intro: 'Het is de ultieme nachtmerrie: u bent alle sleutels van uw auto kwijt (All Keys Lost). De dealer vraagt hoofdprijzen en u moet vaak weken wachten op een sleutel uit de fabriek. Wij lossen dit vandaag nog op locatie op. Onze bussen bevatten alle benodigde EEPROM-programmeertools en sleutel-CNC-machines om uw auto ter plaatse te programmeren.',
    system: 'All Keys Lost (AKL) bypass software, EEPROM programmering, MCU data reading, OBD key writing',
    priceFrom: 'Vanaf €250',
    duration: '60–180 minuten',
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
    relatedSlugs: ['autosleutel-kwijt', 'sleutel-bijmaken', 'smart-key-programmeren', 'contactslot-reparatie']
  },

  // ── 4. BATTERIJ VERVANGEN ─────────────────────────────────
  {
    slug: 'batterij-vervangen',
    title: 'Batterij Vervangen',
    metaTitle: 'Batterij Autosleutel Vervangen | Vaste Prijs €15–€20 | Mobiel',
    metaDesc: 'Autosleutel batterij leeg? Wij vervangen uw autosleutel batterij op locatie voor een vaste prijs van €15 tot €20. Varta, Panasonic, Duracell. Bel!',
    h1: 'Batterij Autosleutel Vervangen — Vaste Prijs op Locatie',
    intro: 'Krijgt u de melding "Sleutelbatterij bijna leeg" op uw dashboard, of reageert de auto pas na meerdere keren drukken? Voorkom dat de sleutel er plotseling mee ophoudt. Wij vervangen uw sleutelbatterij op locatie met A-merk knoopcellen (Duracell, Panasonic of Varta) voor een vaste, all-in prijs van €15 tot €20.',
    system: 'Knoopcellen: CR2032, CR2025, CR1620, CR1616, CR2450 (Duracell, Panasonic, Varta)',
    priceFrom: 'Vaste prijs €15 - €20',
    duration: '5–10 minuten',
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
    intro: 'Heeft uw autosleutel waterschade opgelopen, zijn de drukknoppen lam, of start de auto niet meer doordat de spoel op de printplaat beschadigd is? Een nieuwe sleutel is niet altijd nodig. Wij repareren uw autosleutel vakkundig met precisie soldeerwerk, wat u tot 70% van de kosten van een nieuwe sleutel bespaart.',
    system: 'Micro-soldering, SMD tactile switch replacements, Transponder coil repair',
    priceFrom: 'Vanaf €49',
    duration: '20–45 minuten',
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
    relatedSlugs: ['behuizing-vervangen', 'knoppen-repareren', 'contactslot-reparatie', 'batterij-vervangen']
  },
  {
    slug: 'behuizing-vervangen',
    title: 'Behuizing Vervangen',
    metaTitle: 'Sleutelbehuizing Vervangen Auto | Nieuwe Sleutelbehuizing',
    metaDesc: 'Autosleutel behuizing kapot of versleten? Wij vervangen uw sleutelbehuizing ter plaatse door een nieuw, stevig exemplaar van OEM kwaliteit.',
    h1: 'Sleutelbehuizing Vervangen — Geef Uw Sleutel een Tweede Leven',
    intro: 'Is de plastic behuizing van uw sleutel gescheurd, zijn de rubberen knoppen doorgedrukt of klapt het ijzeren gedeelte niet meer goed uit? Wij vervangen uw sleutelbehuizing ter plaatse door een nieuw OEM-kwaliteit exemplaar. De elektronica en de transponder chip worden voorzichtig overgezet, waardoor uw sleutel weer als nieuw functioneert.',
    system: 'OEM replacement key shells (folding / smart keys)',
    priceFrom: 'Vanaf €49',
    duration: '15–30 minuten',
    steps: [
      'De oude behuizing wordt voorzichtig opengemaakt (soms opengefreesd bij gelijmde types)',
      'De kwetsbare printplaat en transponder chip worden schadevrij verwijderd',
      'De interne componenten worden schoongemaakt en gecontroleerd',
      'Alles wordt overgezet naar de nieuwe behuizing',
      'De sleutelbaard wordt overgezet of nieuw gesneden'
    ],
    faq: [
      { q: 'Waarom moet een gelijmde sleutel (zoals Ford of Opel) opengefreesd worden?', a: 'Fabriekssleutels van o.a. Ford en Opel zijn ultrasoon dichtgelijmd om waterdicht te zijn. Om de printplaat te kunnen redden, moeten we de oude behuizing met precisiegereedschap opensnijden. Wij hebben hier speciale mallen voor.' },
      { q: 'Start mijn auto nog steeds na het overzetten van de behuizing?', a: 'Ja. Omdat we de originele transponder chip (die gekoppeld is aan uw startonderbreker) meeverhuizen naar de nieuwe behuizing, blijft de sleutel gewoon starten.' }
    ],
    relatedSlugs: ['autosleutels-repareren', 'knoppen-repareren', 'batterij-vervangen', 'sleutel-bijmaken']
  },
  {
    slug: 'knoppen-repareren',
    title: 'Knoppen Repareren',
    metaTitle: 'Autosleutel Drukknoppen Repareren | Switches Solderen | Utrecht',
    metaDesc: 'Werken de knoppen van uw autosleutel niet meer? Wij solderen nieuwe micro-switches op de printplaat. Snel klaar op locatie. Bel nu!',
    h1: 'Autosleutel Drukknoppen Repareren — SMD Micro-Switches Solderen',
    intro: 'Reageert de auto niet meer op de knopjes van uw sleutel, hoewel de batterij wel vol is en het LED-lampje misschien wel knippert? Vaak zijn de micro-switches op de printplaat lam, afgebroken of versleten. Wij solderen nieuwe switches op de printplaat met professionele SMD-soldeertechnieken.',
    system: 'SMD Micro-soldering / PCB Switch replacement',
    priceFrom: 'Vanaf €49',
    duration: '20–40 minuten',
    steps: [
      'We demonteren de sleutel en inspecteren de printplaat onder een microscoop',
      'De defecte knopjes worden voorzichtig losgesoldeerd',
      'Er worden nieuwe, originele micro-switches op de printplaat gesoldeerd',
      'We testen de signaaloverdracht en monteren de sleutel weer'
    ],
    faq: [
      { q: 'Wat is een micro-switch?', a: 'Een micro-switch is het kleine elektronische knopje op de printplaat dat contact maakt als u op de buitenkant van de sleutel drukt. Door intensief gebruik slijten de interne metalen contacten of breken de soldeereilandjes los.' },
      { q: 'Kan elk type knopje worden vervangen?', a: 'Ja, wij hebben vrijwel alle typen SMD-schakelaars voor alle automerken op voorraad in onze mobiele bussen.' }
    ],
    relatedSlugs: ['autosleutels-repareren', 'behuizing-vervangen', 'batterij-vervangen', 'afstandsbediening-bijmaken']
  },
  {
    slug: 'contactslot-reparatie',
    title: 'Contactslot Reparatie',
    metaTitle: 'Contactslot Reparatie of Vervangen | Mercedes EIS/ELV Specialist',
    metaDesc: 'Contactslot defect of draait de sleutel niet om? Wij repareren contactsloten en stuurkolomsloten ter plaatse. Mercedes EIS/ELV specialist. Bel!',
    h1: 'Contactslot Reparatie & Vervanging — Direct ter Plaatse',
    intro: 'Draait uw autosleutel niet meer om in het contactslot, of start de auto elektrisch niet meer nadat u de sleutel omdraait? Een defect contactslot (mechanisch of elektronisch) legt uw auto volledig stil. Wij repareren of vervangen uw contactslot direct op locatie. We zijn tevens gespecialiseerd in Mercedes EIS (Elektronisch Ontstekingsslot) en ELV (Elektronisch Stuurslot) reparatie.',
    system: 'Mercedes EIS / ELV / ESL systemen, BMW CAS/Immo synchronisatie, mechanical ignition locks',
    priceFrom: 'Vanaf €150',
    duration: '45–120 minuten',
    steps: [
      'Mechanische en elektrische diagnose van het contactslot',
      'Demonteren van de stuurkolom of het dashboardpaneel',
      'Repareren van de interne cilinderplaatjes of het vervangen van de elektronische spoel',
      'Hercoderen van de bestaande autosleutels aan het nieuwe slot (zo nodig)',
      'Uitgebreide starttest en systeemdiagnose'
    ],
    faq: [
      { q: 'Mijn Mercedes sleutel klikt niet en stuurslot ontgrendelt niet, wat nu?', a: 'Dit is een bekend probleem bij Mercedes (W204, W212, etc.) en duidt bijna altijd op een defect ELV (elektronisch stuurslot) of EIS module. Dealers vervangen de hele stuurkolom voor ca. €1.200. Wij repareren de module ter plaatse of programmeren een emulator voor een fractie van die prijs.' },
      { q: 'Moet ik na contactslot-reparatie een andere sleutel gebruiken?', a: 'Nee. Wij bouwen het nieuwe mechanische slot zo om dat het perfect past op de code van uw huidige deursleutels. U behoudt dus gewoon één sleutel voor de hele auto.' }
    ],
    relatedSlugs: ['autosleutels-repareren', 'sleutel-afgebroken-in-slot', 'transponder-programmeren', 'alle-sleutels-kwijt-auto']
  },

  // ── 6. AUTO BEVEILIGING ───────────────────────────────────
  {
    slug: 'auto-beveiliging',
    title: 'Auto Beveiliging',
    metaTitle: 'Auto Beveiliging | Autoalarm & Ghost Immobiliser Utrecht',
    metaDesc: 'Beveilig uw auto tegen relay attacks en sleutelklonen. Wij installeren autoalarmen en Ghost Immobilisers op locatie. 12 mnd garantie. Bel direct!',
    h1: 'Auto Beveiliging — Bescherm Uw Auto Tegen Moderne Diefstal',
    intro: 'Moderne autodieven maken gebruik van signaalversterkers (relay attacks) en OBD-keyprogrammers om auto\'s binnen enkele seconden geluidloos mee te nemen. Wij beveiligen uw auto met gecertificeerde CAN-bus startonderbrekers (zoals de Ghost Immobiliser) en alarmsystemen, zodat uw voertuig maximaal beschermd is.',
    system: 'Autowatch Ghost II CAN-bus, SCM goedgekeurde klasse 3/4/5 alarmen',
    priceFrom: 'Vanaf €299',
    duration: '60–180 minuten',
    steps: [
      'Analyse van de kwetsbaarheden van uw specifieke autotype',
      'Professionele en onzichtbare inbouw van het beveiligingssysteem',
      'Programmering van de CAN-bus software en PIN-codes',
      'Demonstratie van het systeem aan de klant'
    ],
    faq: [
      { q: 'Wat is een relay attack?', a: 'Bij een relay attack vangen dieven het signaal van uw keyless sleutel op (bijvoorbeeld terwijl deze in uw gang ligt) en sturen dit door naar een ontvanger bij uw auto. De auto denkt dat de sleutel dichtbij is, opent en start. Een extra startbeveiliging voorkomt dit.' },
      { q: 'Is auto beveiliging op locatie in te bouwen?', a: 'Ja. Onze monteurs bouwen alarmsystemen en startonderbrekers professioneel in bij u op de oprit of in uw garage.' }
    ],
    relatedSlugs: ['ghost-immobiliser', 'autoalarm-programmeren', 'smart-key-programmeren']
  },
  {
    slug: 'autoalarm-programmeren',
    title: 'Autoalarm Programmeren',
    metaTitle: 'Autoalarm Programmeren | Alarm Storing Oplossen Utrecht',
    metaDesc: 'Autoalarm storing of programmeren? Wij lezen uw alarmmodule uit en deactiveren of configureren alarmsystemen op locatie. 24/7 storingsdienst.',
    h1: 'Autoalarm Programmeren & Storingshulp op Locatie',
    intro: 'Heeft u last van een alarmstoring waarbij de sirene continu loeit, of wilt u een fabrieksalarm (SCM klasse 3/4) programmeren of uitschakelen? Wij kunnen via OBD-diagnose uw alarmmodule uitlezen, foutcodes wissen of alarmsystemen correct configureren.',
    system: 'SCM Klasse 3/4/5, Clifford, Defa, Cobra alarmen, OBD diagnostic scanners',
    priceFrom: 'Vanaf €120',
    duration: '30–90 minuten',
    steps: [
      'Uitlezen van de alarmfouten via de boordcomputer (OBD)',
      'Opsporen van defecte sensoren of kabelbreuken',
      'Herprogrammeren of tijdelijk deactiveren van de alarmmodule',
      'Testen van de hellingshoek-, interieur- en deursensoren'
    ],
    faq: [
      { q: 'Kan een af fabriek alarm tijdelijk worden uitgeschakeld?', a: 'Ja. Als het alarm door een storing blijft afgaan, kunnen wij de module elektronisch deactiveren via de software, zodat u in ieder geval rustig kunt rijden en slapen.' },
      { q: 'Ondersteunt u aftermarket alarmen?', a: 'Ja, wij kunnen storingen diagnosticeren in zowel originele fabriekssystemen als naderhand ingebouwde systemen (Cobra, Clifford, Defa).' }
    ],
    relatedSlugs: ['auto-beveiliging', 'ghost-immobiliser', 'smart-key-programmeren']
  },
  {
    slug: 'ghost-immobiliser',
    title: 'Ghost Immobiliser',
    metaTitle: 'Ghost Immobiliser Installeren | CAN-Bus Startonderbreker',
    metaDesc: 'Laat een Ghost Immobiliser installeren. Ultieme onzichtbare startbeveiliging via CAN-bus. Beveiligd tegen keyless-cloning. Bel voor info!',
    h1: 'Ghost Immobiliser Installatie — De Ultieme Onzichtbare Startbeveiliging',
    intro: 'De Autowatch Ghost Immobiliser is de meest effectieve beveiliging tegen moderne autodiefstal. Het is een minuscuul apparaatje dat onzichtbaar in de bekabeling van uw auto wordt weggewerkt. Het startonderbrekingssysteem werkt via het CAN-bus netwerk: de auto start pas nadat u een persoonlijke PIN-code invoert via de bestaande knoppen op uw stuur of dashboard (bijv. volumeknoppen of cruisecontrol).',
    system: 'Autowatch Ghost II CAN-bus Protection system',
    priceFrom: 'Vanaf €499 inclusief montage',
    duration: '90–150 minuten',
    steps: [
      'Het systeem wordt onzichtbaar ingebouwd in het CAN-bus netwerk van de auto',
      'We programmeren de door u gewenste unieke knoppencombinatie (PIN-code)',
      'We leggen uit hoe de Service/Valet-modus werkt (voor garagebezoeken)',
      'U ontvangt de unieke noodcodekaart'
    ],
    faq: [
      { q: 'Kan een dief de Ghost Immobiliser vinden of omzeilen?', a: 'Nee. Omdat het apparaatje geen radiosignalen (zoals RF of Bluetooth) uitzendt en geen klikgeluiden maakt, is het onvindbaar voor signaalscanners. Zelfs als een dief uw sleutel heeft gekloond of de OBD-poort hackt, zal de motor weigeren te starten.' },
      { q: 'Behoud ik mijn fabrieksgarantie na installatie?', a: 'Ja. De Ghost Immobiliser maakt geen fysieke wijzigingen in de originele software van het voertuig en er worden geen draden doorgeknipt. Het luistert en communiceert uitsluitend via het CAN-bus netwerk.' },
      { q: 'Hoeveel knoppen kan de PIN-code bevatten?', a: 'De PIN-code kan bestaan uit een combinatie van 4 tot 20 knoppen, waardoor het kraken van de code statistisch onmogelijk is.' }
    ],
    relatedSlugs: ['auto-beveiliging', 'autoalarm-programmeren', 'smart-key-programmeren']
  }
];
