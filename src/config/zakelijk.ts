// ============================================================
// ZAKELIJK — B2B partner segments
//
// Four businesses that all lose money on the same problem, for four different
// reasons. That difference is the page: a garage loses the whole repair job, a
// dealer loses margin at handover, an importer loses days per batch, a rental
// company loses the day-rate. Writing one page for "bedrijven" would say
// nothing to any of them.
//
// WHAT IS DELIBERATELY NOT IN HERE
//
// No volume discounts, no contract terms, no "X garages work with us". Those
// are real commercial decisions the office has not made yet, and a landing page
// is a bad place to invent them. Every page ends in a quote request instead,
// which is honest and is also what generates the enquiry the pages exist for.
// ============================================================

export type ZakelijkSegment = {
  slug: string;
  /** Nav and card label. */
  label: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  h1Top: string;
  h1Accent: string;
  intro: string;
  image: { src: string; alt: string };
  /** The situation they recognise, in their words. */
  painTitle: string;
  pain: string[];
  /** What working with us changes. One claim per line, all defensible. */
  gains: { title: string; text: string }[];
  /** How it actually runs, so nobody has to ask. */
  steps: string[];
  faq: { q: string; a: string }[];
};

export const ZAKELIJK_SEGMENTS: ZakelijkSegment[] = [
  // ── 1. GARAGES ────────────────────────────────────────────
  {
    slug: 'garages',
    label: 'Garages',
    title: 'Autosleutels voor garagebedrijven',
    metaTitle: 'Autosleutel Service voor Garages | Wij Komen naar Uw Werkplaats',
    metaDesc:
      'Klant met een verloren of defecte autosleutel in uw werkplaats? Wij komen naar u toe, maken en coderen de sleutel ter plaatse. Geen investering in apparatuur, u houdt de klus.',
    h1Top: 'Uw klant staat met een sleutelprobleem in de werkplaats.',
    h1Accent: 'Wij komen naar u toe.',
    intro:
      'Sleutelprogrammering vraagt merkspecifieke apparatuur en licenties die voor één klus per maand nooit uit kan. Wij rijden naar uw werkplaats, maken en coderen de sleutel bij de auto, en u gaat verder met de rest van de reparatie.',
    image: {
      src: '/images/seo/auto-slotenmaker-werkplaats-utrecht.webp',
      alt: 'Autosleutel geprogrammeerd in de werkplaats van een garagebedrijf',
    },
    painTitle: 'Herkenbaar?',
    pain: [
      'De auto staat al op de brug, maar de sleutel is kwijt of de transponder wordt niet meer herkend — en u kunt er niets mee.',
      'U stuurt de klant door naar de merkdealer, wacht twee weken op een afspraak en bent de rest van de reparatie ook kwijt.',
      'De sleutelapparatuur die u nodig heeft kost tienduizenden euro’s plus jaarlijkse licenties per merk, voor een handvol klussen per jaar.',
      'De auto bezet ondertussen een brugplaats die u niet kunt verhuren.',
    ],
    gains: [
      {
        title: 'De auto blijft bij u staan',
        text: 'Geen sleepwagen en geen doorverwijzing. Wij komen naar uw werkplaats, dus de auto verlaat uw pand niet en u houdt de rest van de opdracht.',
      },
      {
        title: 'Geen investering in apparatuur',
        text: 'U hoeft geen programmeerapparatuur, licenties of abonnementen aan te schaffen voor werk dat een paar keer per jaar langskomt.',
      },
      {
        title: 'U blijft het aanspreekpunt',
        text: 'Uw klant heeft één contactpersoon: u. Wij factureren aan u, u factureert aan de klant — met uw eigen marge erop.',
      },
      {
        title: 'Alle merken, ook de lastige',
        text: 'Van transponder tot smart key en keyless entry. Wat wij niet kunnen — Mercedes FBS4 vanaf ±2013/2014 — zeggen wij meteen, zodat u uw klant geen valse hoop geeft.',
      },
    ],
    steps: [
      'U belt of appt ons met kenteken en wat er aan de hand is',
      'Wij bevestigen vooraf of het kan, wat het kost en wanneer wij er zijn',
      'Wij komen naar uw werkplaats en maken de sleutel bij de auto',
      'U krijgt één factuur, met zakelijke betaaltermijn',
    ],
    faq: [
      {
        q: 'Moet de auto naar jullie toe?',
        a: 'Nee. Wij werken mobiel en komen naar uw werkplaats. De auto hoeft uw pand niet te verlaten en u hoeft geen vervangend vervoer te regelen.',
      },
      {
        q: 'Praten jullie rechtstreeks met mijn klant?',
        a: 'Alleen als u dat wilt. Standaard bent u het aanspreekpunt: wij factureren aan u en uw klant merkt alleen dat de sleutel geregeld is.',
      },
      {
        q: 'Wat als het merk of bouwjaar niet kan?',
        a: 'Dan horen wij dat vooraf, niet ter plaatse. Mercedes met FBS4 (globaal vanaf 2013/2014) kan alleen de dealer, en bij sommige Volkswagens moet de sleutel besteld worden — reken dan op 2 tot 4 werkdagen.',
      },
    ],
  },

  // ── 2. AUTOBEDRIJVEN / DEALERS ────────────────────────────
  {
    slug: 'autobedrijven',
    label: 'Autobedrijven & dealers',
    title: 'Tweede sleutel voor uw occasions',
    metaTitle: 'Autosleutel Bijmaken voor Autobedrijven | Bij U op de Zaak',
    metaDesc:
      'Occasions met maar één sleutel? Wij maken tweede sleutels bij u op locatie, meerdere auto’s per bezoek. Hogere verkoopprijs, minder discussie bij aflevering.',
    h1Top: 'Een occasion met één sleutel verkoopt moeilijker.',
    h1Accent: 'Wij maken de tweede bij u op de zaak.',
    intro:
      'Inruilers komen binnen met één sleutel. Bij aflevering is dat het eerste waar een koper over onderhandelt — en een ontbrekende sleutel kost aan de onderhandelingstafel doorgaans meer dan het bijmaken ervan. Wij komen naar uw terrein en doen meerdere auto’s in één bezoek.',
    image: {
      src: '/images/seo/autosleutel_voorraad_alle_merken_utrecht_amsterdam.webp',
      alt: 'Voorraad autosleutels voor alle merken, klaar om bij te maken voor autobedrijven',
    },
    painTitle: 'Herkenbaar?',
    pain: [
      'Elke inruiler komt met één sleutel binnen en u weet dat de koper er straks over begint.',
      'Bij aflevering levert u in op de prijs, of u belooft een sleutel die u daarna alsnog moet regelen.',
      'De dealer rekent dealertarief en levert pas na een of twee weken — terwijl de auto had kunnen staan te glimmen op uw plein.',
      'Per auto apart iets regelen kost meer tijd dan het werk zelf.',
    ],
    gains: [
      {
        title: 'Meerdere auto’s in één bezoek',
        text: 'Verzamel de occasions die een tweede sleutel nodig hebben. Wij komen langs en doen ze achter elkaar op uw eigen terrein, in één afspraak.',
      },
      {
        title: 'Sterker bij de aflevering',
        text: 'Twee sleutels bij de auto haalt het onderwerp van tafel voordat de koper erover begint. Geen korting weggeven voor iets wat u had kunnen regelen.',
      },
      {
        title: 'Eén factuur, zakelijke termijn',
        text: 'Geen losse betalingen per auto. U krijgt één factuur voor het hele bezoek, met btw-specificatie voor uw boekhouding.',
      },
      {
        title: 'Ook voor auto’s zonder sleutel',
        text: 'Een inruiler waarvan alle sleutels kwijt zijn lossen wij ter plaatse op — inclusief het wissen van de oude sleutels uit de boordcomputer, zodat u de auto met een schone beveiliging aflevert.',
      },
    ],
    steps: [
      'U geeft door welke kentekens een sleutel nodig hebben',
      'Wij bevestigen per auto of het kan en wat het kost',
      'Wij komen langs en doen alle auto’s in één bezoek',
      'Eén factuur achteraf, met btw-specificatie per voertuig',
    ],
    faq: [
      {
        q: 'Hoeveel auto’s kunnen jullie in één bezoek doen?',
        a: 'Dat hangt af van merk en type sleutel — een standaard transponder is sneller dan een keyless smart key. Geef door hoeveel auto’s het zijn en om welke modellen het gaat, dan plannen wij er de juiste tijd voor in.',
      },
      {
        q: 'Kunnen jullie ook sleutels leveren voor auto’s die nog binnenkomen?',
        a: 'Ja. Veel autobedrijven plannen een vast moment per week of per maand in, zodat nieuwe inruilers meteen meegaan in het volgende bezoek.',
      },
      {
        q: 'Werken jullie met originele of aftermarket sleutels?',
        a: 'Beide, afhankelijk van merk en budget. Wij zeggen vooraf welke wij gebruiken en wat het verschil is; voor sommige modellen is een origineel sleutel de enige werkende optie.',
      },
    ],
  },

  // ── 3. IMPORT / EXPORT ────────────────────────────────────
  {
    slug: 'import-export',
    label: 'Import & export',
    title: 'Sleutels voor import- en exportauto’s',
    metaTitle: 'Autosleutels voor Import & Export | Op Locatie, Meerdere Auto’s',
    metaDesc:
      'Importauto’s met één of geen sleutel? Wij maken en coderen sleutels op uw eigen terrein of in de loods, ook bij volledig sleutelverlies. Alle Europese merken.',
    h1Top: 'Importauto’s komen zelden met twee sleutels binnen.',
    h1Accent: 'Wij regelen ze op uw terrein.',
    intro:
      'Auto’s van veiling of uit het buitenland arriveren vaak met één sleutel, en soms met geen enkele. Wij komen naar uw loods of opslagterrein en maken de sleutels ter plaatse — ook wanneer alle sleutels ontbreken en de auto van nul af aan ingeleerd moet worden.',
    image: {
      src: '/images/seo/autosleutel-bijmaken-equipment.webp',
      alt: 'Diagnoseapparatuur voor het inleren van autosleutels bij import- en exportvoertuigen',
    },
    painTitle: 'Herkenbaar?',
    pain: [
      'Een veilingauto of importvoertuig arriveert met één sleutel, of met helemaal geen sleutel.',
      'Zonder werkende sleutel kunt u de auto niet verplaatsen, niet keuren en niet afleveren.',
      'Een dealer in het land van herkomst benaderen kost dagen en levert zelden een snel antwoord op.',
      'De auto’s staan intussen ruimte in te nemen op uw terrein.',
    ],
    gains: [
      {
        title: 'Wij komen naar de loods',
        text: 'Geen transport van auto’s die niet rijden of niet te openen zijn. Wij werken op uw eigen terrein, ook bij meerdere voertuigen achter elkaar.',
      },
      {
        title: 'Ook bij volledig sleutelverlies',
        text: 'Alle sleutels kwijt is bij importauto’s eerder regel dan uitzondering. Wij openen de auto schadevrij, lezen de code uit en leren een nieuwe sleutel in.',
      },
      {
        title: 'Alle Europese merken',
        text: 'Duitse, Franse, Italiaanse en Aziatische modellen met dealer-niveau apparatuur. Wat niet kan, zeggen wij vooraf — Mercedes FBS4 vanaf ±2013/2014 kan alleen de dealer.',
      },
      {
        title: 'Auto’s sneller doorstromen',
        text: 'Hoe eerder een auto een werkende sleutel heeft, hoe eerder hij gekeurd, verplaatst en verkocht kan worden. Dat is de echte kostenpost, niet de sleutel.',
      },
    ],
    steps: [
      'U stuurt de kentekens of VIN-nummers en aantallen door',
      'Wij bepalen per auto wat nodig is en of iets besteld moet worden',
      'Wij komen langs en doen de auto’s in één bezoek',
      'Eén factuur per bezoek, met specificatie per voertuig',
    ],
    faq: [
      {
        q: 'Wij hebben geen kenteken, alleen een VIN. Kan dat?',
        a: 'Ja. Bij importauto’s werken wij vaak op VIN, zeker als het voertuig nog niet op Nederlands kenteken staat. Stuur het VIN mee, dan weten wij welk sleuteltype en welk systeem erin zit.',
      },
      {
        q: 'Kunnen jullie ook auto’s openen waar geen sleutel van is?',
        a: 'Ja, dat is precies het geval waar wij het vaakst voor komen. Wij openen schadevrij en leren daarna een nieuwe sleutel in; de eventueel nog bestaande oude sleutels wissen wij uit het geheugen.',
      },
      {
        q: 'Hoe snel kunnen jullie komen bij een grotere partij?',
        a: 'Voor één auto rijden wij meestal dezelfde dag. Bij een grotere partij plannen wij een vast moment, zodat wij de juiste sleutels en apparatuur voor die merken meenemen.',
      },
    ],
  },

  // ── 4. WAGENPARK / VERHUUR ────────────────────────────────
  {
    slug: 'wagenpark-en-verhuur',
    label: 'Wagenpark & verhuur',
    title: 'Sleutelservice voor wagenparken en verhuurbedrijven',
    metaTitle: 'Autosleutel Service Wagenpark & Autoverhuur | 24/7 op Locatie',
    metaDesc:
      'Bus, bestelbus of huurauto zonder sleutel staat stil en verdient niets. Wij maken reservesleutels voor uw hele wagenpark en komen 24/7 bij storing of verlies.',
    h1Top: 'Een voertuig zonder sleutel verdient niets.',
    h1Accent: 'Wij houden uw wagenpark rijdend.',
    intro:
      'Bij verhuur en wagenparken is de sleutel zelden de grootste kostenpost — de stilstand is dat. Wij maken vooraf reservesleutels voor uw voertuigen, zodat sleutelverlies een kwestie van minuten is in plaats van een dag uit de verhuur. En als het toch misgaat, komen wij 24/7.',
    image: {
      src: '/images/hero-mobile-van.webp',
      alt: 'Mobiele servicebus voor sleutelservice aan wagenparken en verhuurbedrijven',
    },
    painTitle: 'Herkenbaar?',
    pain: [
      'Een huurder levert in zonder sleutel, of sluit de sleutel op in de auto op een parkeerplaats ver weg.',
      'Het voertuig staat stil en kan niet opnieuw verhuurd worden — elke dag stilstand is gemiste omzet.',
      'Voor bussen, bestelbussen en campers is een sleutel bij de dealer duur en vaak pas na dagen beschikbaar.',
      'U heeft van de helft van het wagenpark maar één sleutel en merkt dat pas op het verkeerde moment.',
    ],
    gains: [
      {
        title: 'Reservesleutels vóórdat het misgaat',
        text: 'Wij maken in één ronde reservesleutels voor uw voertuigen. Raakt er daarna één kwijt, dan is het een sleutel uit de la in plaats van een dag uit de verhuur.',
      },
      {
        title: '24/7 bij spoed',
        text: 'Sleutelverlies houdt zich niet aan kantooruren. Wij rijden ook ’s avonds en in het weekend naar de locatie van het voertuig.',
      },
      {
        title: 'Wij komen naar het voertuig',
        text: 'Bij de vestiging, op de standplaats of bij de huurder langs de weg. Geen berging, geen transport van een auto die niet te openen is.',
      },
      {
        title: 'Ook bussen, bestelbussen en campers',
        text: 'Groter materieel valt bij veel partijen buiten de boot. Wij werken op dezelfde manier aan een bestelbus of touringcar als aan een personenauto.',
      },
    ],
    steps: [
      'Wij nemen samen het wagenpark door: welke voertuigen, welke sleuteltypes',
      'Wij maken in één of enkele bezoeken de ontbrekende reservesleutels',
      'U krijgt een vast nummer voor spoed, 24/7 bereikbaar',
      'Facturatie per bezoek of per periode, in overleg',
    ],
    faq: [
      {
        q: 'Kunnen jullie reservesleutels maken voor ons hele wagenpark?',
        a: 'Ja, en dat is de goedkoopste volgorde. Vooraf sleutels maken kost per voertuig minder dan een spoedoproep achteraf, en het scheelt stilstand op het moment dat het misgaat.',
      },
      {
        q: 'Komen jullie ook naar een huurder toe die onderweg is?',
        a: 'Ja. Wij rijden naar de locatie van het voertuig, ook buiten kantooruren. Geef het kenteken en de locatie door, dan bevestigen wij de aankomsttijd.',
      },
      {
        q: 'Werken jullie met vaste afspraken of per keer?',
        a: 'Allebei komt voor. Sommige bedrijven bellen ons per geval, andere spreken een vaste werkwijze en bereikbaarheid af. Vertel wat u nodig heeft, dan kijken wij wat past.',
      },
    ],
  },
];

export const getZakelijkSegment = (slug: string) =>
  ZAKELIJK_SEGMENTS.find((s) => s.slug === slug);
