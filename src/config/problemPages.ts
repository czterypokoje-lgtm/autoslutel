/*
 * Pages organised by the customer's problem, not by our service name.
 *
 * Somebody whose key stopped working does not search for "transponder
 * programmeren"; they search for what happened to them. Each entry here is
 * one such problem, rendered by src/components/ProblemPage/ProblemPage.tsx
 * at its own top-level URL (src/app/<slug>/page.tsx).
 *
 * Rules for the text, from claw-server docs/marketing/10_agent_knowledge_base.md
 * (the owner's list of what may be said):
 *   - No price, no arrival time, no guarantee, no "alle merken". Where a
 *     customer wants a number, the page says how to get one.
 *   - Confirmed and therefore usable: 24/7 reachable, we come to the car,
 *     about 75 km around Bussum, ID + kentekenbewijs required, the price we
 *     quote includes travel (voorrijden) and btw, an invoice after every job,
 *     towing (sleepkosten) is not included, no price on hand = a colleague
 *     calls back with one.
 *   - Never explain how to open or start a car without its key.
 * Change a claim here only after the owner has confirmed it there.
 */

export interface ProblemLink {
  href: string;
  label: string;
}

export interface ProblemPage {
  slug: string;
  /** URL path when it is not `/${slug}`, e.g. a page that keeps an existing /diensten/ address. */
  path?: string;
  /** Breadcrumb step between Home and this page. */
  parent?: ProblemLink;
  /** Short name, used in breadcrumbs and link lists. */
  name: string;
  metaTitle: string;
  metaDesc: string;
  titleTop: string;
  titleAccent: string;
  lead: string;
  image: { src: string; alt: string };
  /** A safety line shown above the steps when the situation can be dangerous. */
  safety?: string;
  /** What to do in the next ten minutes, in order. */
  now: { title: string; desc: string }[];
  /** Sorting the problem into the case that matches, each with where to go next. */
  casesTitle: string;
  cases: { title: string; desc: string; link?: ProblemLink }[];
  included: string[];
  notIncluded: string[];
  /** The five questions customers ask most, answered on the page and in FAQPage data. */
  faq: { q: string; a: string }[];
  /** Existing pages a visitor on this problem may need next. */
  related: ProblemLink[];
  /** Service pages (DIENSTEN slugs) that point back to this problem page. */
  fromServices: string[];
  /** schema.org Service fields; must describe what the page says. */
  serviceName: string;
  serviceType: string;
}

/* Shared answers: the same facts in the same words on every problem page. */
const PRICE_ANSWER =
  'Dat hangt af van uw auto en van wat er nodig is. Geef merk, model en bouwjaar door en zeg of u nog een sleutel heeft die werkt. U krijgt dan een bedrag voor uw auto, inclusief voorrijden en btw. Hebben wij voor uw auto geen prijs paraat, dan belt een collega u terug met een prijs. Een bedrag op deze pagina noemen wij niet, omdat het per auto verschilt.';

const WHEN_ANSWER =
  'Wij zijn 24 uur per dag, 7 dagen per week bereikbaar. Welke tijden er vrij zijn, hangt af van de monteur bij u in de buurt; die tijden hoort u als u belt, appt of het formulier stuurt. Wij werken vanuit Bussum in een straal van ongeveer 75 km. Staat uw auto verder weg, vraag het ons.';

const DEALER_ANSWER =
  'Nee, wij komen naar de auto toe. Of wij uw auto kunnen helpen, controleren wij aan de hand van merk, model en bouwjaar voordat u een afspraak maakt.';

const COME_TO_CAR = 'Wij komen naar de auto toe: thuis, op het werk of waar hij staat.';
const NO_TOWING = 'Wegslepen van de auto: sleepkosten zitten niet in onze prijs.';
const NO_PROOF = 'Werk zonder bewijs dat de auto van u is. Ook niet met spoed.';
const NO_TIME = 'Een vaste aankomsttijd op deze pagina. Welke tijd kan, hoort u als u contact opneemt.';
const PRICE_INCLUDES = 'In de prijs die wij noemen zit het voorrijden, het maken en inleren van de sleutel en de btw.';

export const PROBLEM_PAGES: ProblemPage[] = [
  /*
   * Spare key. One page instead of four: /autosleutel-laten-maken,
   * /autosleutel-kopieren and /diensten/reservesleutel-maken now 301 here
   * (next.config.ts). /autosleutel-bijmaken-in-de-buurt stays: it is the
   * nearest-city finder, a "where" page rather than a "what" page.
   *
   * Search Console, last 28 days to 12 Nov 2026: these pages shared hundreds
   * of queries between them and all sat at average position 60-90, while the
   * homepage ranks for the head terms ("autosleutel bijmaken" 856
   * impressions at 15.5, "auto sleutel laten maken" 231 at 8.2). This page
   * keeps the address the menu already links to.
   */
  {
    slug: 'autosleutel-bijmaken',
    path: '/diensten/autosleutel-bijmaken',
    parent: { href: '/diensten', label: 'Diensten' },
    name: 'Autosleutel bijmaken',
    metaTitle: 'Autosleutel Bijmaken of Reservesleutel Laten Maken',
    metaDesc:
      'Nog maar één autosleutel? Laat op locatie een reservesleutel bijmaken: frezen en inleren op uw auto. Wat u nodig heeft en hoe u een prijs voor uw auto krijgt.',
    titleTop: 'Autosleutel bijmaken?',
    titleAccent: 'Laat een reserve maken zolang u er nog één heeft',
    lead:
      'Heeft u nog een sleutel die werkt, dan maken wij er een bij: wij komen naar de auto, maken de nieuwe sleutel en leren hem in op uw auto. Raakt u ook die laatste sleutel kwijt, dan wordt het een ander werk.',
    image: {
      src: '/images/seo/auto-slotenmaker-audi-inleren-amersfoort.webp',
      alt: 'Originele autosleutel naast een nieuw gemaakte reservesleutel',
    },
    now: [
      {
        title: 'Controleer of uw sleutel nog goed werkt',
        desc: 'Start de auto ermee en probeer de knoppen. Doet hij het niet (goed) meer, kijk dan hieronder welk geval bij u past.',
      },
      {
        title: 'Zoek uw papieren',
        desc: 'Uw legitimatie en het kentekenbewijs van de auto. Zonder die twee maakt de monteur geen sleutel.',
      },
      {
        title: 'Noteer merk, model en bouwjaar',
        desc: 'En of de auto keyless is (starten met een knop). Meer hoeven wij niet te weten voor een prijs.',
      },
      {
        title: 'Neem contact op',
        desc: 'Bel, app of vul het formulier in. U krijgt een prijs voor uw auto, inclusief voorrijden en btw, en hoort welke tijden er vrij zijn.',
      },
    ],
    casesTitle: 'Welk geval past bij u?',
    cases: [
      {
        title: 'U heeft één sleutel die goed werkt',
        desc: 'Dan is het bijmaken: wij maken een tweede sleutel en leren die in op uw auto.',
      },
      {
        title: 'Uw enige sleutel is half kapot',
        desc: 'Werkt hij nog in het contact, dan kan er nog een bijgemaakt worden. Werkt hij niet meer, dan is het voor ons hetzelfde werk als alle sleutels kwijt.',
        link: { href: '/autosleutel-afgebroken', label: 'Autosleutel afgebroken of kapot' },
      },
      {
        title: 'U wilt alleen de sleutel zelf bestellen',
        desc: 'In onze webshop zoekt u een sleutel op kenteken. Of die daarna nog ingeleerd moet worden, verschilt per auto; vraag het ons gerust.',
        link: { href: '/webshop', label: 'Naar de webshop' },
      },
      {
        title: 'U heeft geen sleutel meer die werkt',
        desc: 'Dan is het geen bijmaken meer, maar alle sleutels kwijt.',
        link: { href: '/autosleutel-kwijt', label: 'Autosleutel kwijt' },
      },
    ],
    included: [
      COME_TO_CAR,
      'Een nieuwe sleutel maken (frezen) en inleren op uw auto.',
      PRICE_INCLUDES,
      'Na de klus krijgt u een factuur.',
    ],
    notIncluded: [
      NO_PROOF,
      'Een prijs voordat wij weten om welke auto het gaat.',
      'Uitleg hoe u zelf een sleutel inleert: bij de meeste auto’s is daar speciaal gereedschap voor nodig.',
      NO_TIME,
    ],
    faq: [
      { q: 'Wat kost een reservesleutel?', a: PRICE_ANSWER },
      {
        q: 'Kan ik zomaar een autosleutel laten bijmaken?',
        a: 'Als de auto van u is wel. De monteur vraagt uw legitimatie en het kentekenbewijs. Is de auto van iemand anders, dan moet de eigenaar of iemand met een machtiging dat kunnen laten zien. Zonder dat bewijs maken wij geen sleutel.',
      },
      {
        q: 'Kan een sleutel gemaakt worden zonder de originele sleutel?',
        a: 'Ja, maar dat is ander werk dan bijmaken: dan zijn alle sleutels kwijt en wordt de nieuwe sleutel zonder voorbeeld gemaakt en ingeleerd. Kijk daarvoor bij autosleutel kwijt.',
      },
      {
        q: 'Kan ik een autosleutel zelf kopiëren of programmeren?',
        a: 'Voor de meeste auto’s is speciaal gereedschap nodig om een sleutel in te leren. Wilt u alleen het onderdeel, dan zoekt u in onze webshop een sleutel op kenteken; of die daarna nog ingeleerd moet worden, verschilt per auto.',
      },
      { q: 'Waar en wanneer kan de sleutel gemaakt worden?', a: `${COME_TO_CAR} ${WHEN_ANSWER}` },
    ],
    related: [
      { href: '/diensten/transponder-programmeren', label: 'Transponder programmeren' },
      { href: '/diensten/afstandsbediening-bijmaken', label: 'Afstandsbediening bijmaken' },
      { href: '/diensten/smart-key-programmeren', label: 'Smart key / keyless programmeren' },
      { href: '/autosleutel-bestellen-op-kenteken', label: 'Autosleutel op kenteken' },
      { href: '/merken', label: 'Sleutel bijmaken per automerk' },
    ],
    fromServices: ['transponder-programmeren', 'afstandsbediening-bijmaken', 'smart-key-programmeren'],
    serviceName: 'Autosleutel bijmaken op locatie',
    serviceType: 'Reservesleutel maken en inleren op locatie',
  },
  {
    slug: 'autosleutel-werkt-niet',
    name: 'Autosleutel werkt niet',
    metaTitle: 'Autosleutel Werkt Niet of Niet Herkend? Wat U Nu Doet',
    metaDesc:
      'Gaat de auto niet open met de knop, of start hij niet omdat de sleutel niet herkend wordt? Zo ziet u wat er mis is, wat u zelf probeert en hoe wij helpen.',
    titleTop: 'Autosleutel werkt niet meer?',
    titleAccent: 'Kijk eerst wát er niet werkt',
    lead:
      'Het zijn twee verschillende storingen: de knoppen openen de deuren niet meer, of de auto herkent de sleutel niet en start niet. Hieronder ziet u hoe u ze uit elkaar houdt, wat u zelf kunt proberen en wanneer u ons belt.',
    image: {
      src: '/images/seo/reserve_autosleutel_transponder_programmeren_utrecht.webp',
      alt: 'Monteur van Autosleutel24 leert een transpondersleutel in op de auto',
    },
    now: [
      {
        title: 'Probeer uw reservesleutel',
        desc: 'Werkt die wel, dan zit het probleem in de eerste sleutel en niet in de auto. Dat scheelt zoeken.',
      },
      {
        title: 'Kijk wat er niet werkt',
        desc: 'Gaan de deuren niet open of dicht met de knop? Dan is het de afstandsbediening. Start de auto niet, of brandt er een lampje met een sleutel of slot op het dashboard? Dan herkent de auto de sleutel niet.',
      },
      {
        title: 'Knoppen doen niets: vervang de batterij',
        desc: 'Een lege batterij is de bekendste oorzaak. Het type staat meestal in het instructieboekje van de auto of op de batterij zelf. Heeft uw sleutel een losse metalen noodsleutel, dan opent die het portier intussen met de hand.',
      },
      {
        title: 'Auto start niet: de batterij helpt meestal niet',
        desc: 'De chip waarmee de auto de sleutel herkent heeft geen batterij nodig. Heeft u een keyless auto (starten met een knop), kijk dan in het instructieboekje wat de noodprocedure voor uw model is.',
      },
      {
        title: 'Lost dat het niet op? Neem contact op',
        desc: 'Bel of app ons met merk, model en bouwjaar, en zeg of u nog een sleutel heeft die wel werkt.',
      },
    ],
    casesTitle: 'Welke storing heeft u?',
    cases: [
      {
        title: 'De knoppen werken niet, de auto start wel',
        desc: 'Nieuwe batterij geprobeerd en nog steeds niets? Dan kan de afstandsbediening opnieuw ingeleerd moeten worden, of zijn de knoppen of de print kapot.',
        link: { href: '/diensten/afstandsbediening-bijmaken', label: 'Afstandsbediening bijmaken of inleren' },
      },
      {
        title: 'De auto herkent de sleutel niet en start niet',
        desc: 'Werkt de reservesleutel wel, dan moet de kapotte sleutel vervangen of opnieuw ingeleerd worden. Werkt geen enkele sleutel meer, dan is het voor ons hetzelfde werk als alle sleutels kwijt.',
        link: { href: '/autosleutel-kwijt', label: 'Autosleutel kwijt of geen werkende sleutel meer' },
      },
      {
        title: 'Het werkt niet meer sinds de batterij vervangen is',
        desc: 'Bij sommige auto’s moet de sleutel na een batterijwissel opnieuw herkend worden. Kijk in het instructieboekje; staat het daar niet in, neem dan contact op.',
      },
    ],
    included: [
      COME_TO_CAR,
      'De monteur kijkt bij de auto wat er nodig is.',
      'Een nieuwe sleutel maken en inleren op uw auto, of uw sleutel opnieuw inleren.',
      PRICE_INCLUDES,
      'Na de klus krijgt u een factuur.',
    ],
    notIncluded: [
      'Alleen een batterij nodig? Die kunt u meestal zelf vervangen; daar hoeft geen monteur voor te komen.',
      NO_TOWING,
      NO_PROOF,
      NO_TIME,
    ],
    faq: [
      {
        q: 'Waarom herkent mijn auto mijn sleutel niet?',
        a: 'De bekendste oorzaken zijn een lege batterij (bij keyless auto’s), een beschadigde chip in de sleutel, of een sleutel die na een kopie of batterijwissel niet (goed) is ingeleerd. Probeer eerst uw reservesleutel: werkt die wel, dan ligt het aan de eerste sleutel. Wat er precies mis is, ziet de monteur bij de auto.',
      },
      {
        q: 'Helpt een nieuwe batterij?',
        a: 'Als de knoppen niets meer doen, vaak wel. Start de auto niet terwijl de deuren wel opengaan, dan meestal niet: de chip die de auto herkent werkt zonder batterij.',
      },
      { q: 'Wat kost het?', a: PRICE_ANSWER },
      { q: 'Moet ik naar de dealer?', a: DEALER_ANSWER },
      { q: 'Wanneer kan er iemand komen?', a: WHEN_ANSWER },
    ],
    related: [
      { href: '/diensten/batterij-vervangen', label: 'Batterij autosleutel vervangen' },
      { href: '/diensten/transponder-programmeren', label: 'Transponder programmeren' },
      { href: '/diensten/smart-key-programmeren', label: 'Smart key / keyless programmeren' },
      { href: '/diensten/afstandsbediening-bijmaken', label: 'Afstandsbediening bijmaken' },
      { href: '/autosleutel-kwijt', label: 'Autosleutel kwijt' },
    ],
    fromServices: [
      'batterij-vervangen',
      'afstandsbediening-bijmaken',
      'transponder-programmeren',
      'smart-key-programmeren',
      'knoppen-repareren',
    ],
    serviceName: 'Hulp als de autosleutel niet werkt of niet herkend wordt',
    serviceType: 'Autosleutel inleren of vervangen op locatie',
  },
  {
    slug: 'autosleutel-afgebroken',
    name: 'Autosleutel afgebroken',
    metaTitle: 'Autosleutel Afgebroken of Kapot? Wat U Nu Doet',
    metaDesc:
      'Autosleutel afgebroken, behuizing gebarsten of knoppen kapot? Wat u nu doet, welke stukken u bewaart en hoe u op locatie een gerepareerde of nieuwe sleutel krijgt.',
    titleTop: 'Autosleutel afgebroken of kapot?',
    titleAccent: 'Bewaar alle stukken en neem contact op',
    lead:
      'Een afgebroken sleutel is vaak te herstellen of te vervangen zonder dealer. Wat er nodig is, hangt af van wát er gebroken is: het metalen deel, de behuizing met de knoppen, of de sleutel helemaal.',
    image: {
      src: '/images/seo/autosleutel_reparatie_hero.webp',
      alt: 'Kapotte autosleutel op de werkbank, klaar voor reparatie',
    },
    now: [
      {
        title: 'Bewaar alle stukken',
        desc: 'Ook het deel met de knoppen: daarin zit meestal de chip waarmee de auto de sleutel herkent. Gooi niets weg voordat de monteur het gezien heeft.',
      },
      {
        title: 'Zit er een stuk in het slot? Laat het zitten',
        desc: 'Niet peuteren met een schroevendraaier, mes of lijm, en de sleutel niet verder induwen. Daarmee raakt het slot beschadigd en wordt het werk groter.',
      },
      {
        title: 'Pak uw reservesleutel als u die heeft',
        desc: 'Dan kunt u verder rijden en is het een kwestie van een nieuwe sleutel laten maken.',
      },
      {
        title: 'Maak een foto en neem contact op',
        desc: 'Stuur via WhatsApp een foto van de stukken, met merk, model en bouwjaar. Dan zien wij welk werk het is.',
      },
    ],
    casesTitle: 'Wat is er gebroken?',
    cases: [
      {
        title: 'Het metalen deel (de baard) is afgebroken',
        desc: 'Is de rest van de sleutel heel, dan kan er vaak een nieuwe baard of een nieuwe sleutel gemaakt worden die op uw auto wordt ingeleerd.',
      },
      {
        title: 'De behuizing is gebarsten of de knoppen zijn kapot',
        desc: 'Werkt de sleutel nog in het contact, dan is het meestal een reparatie: de binnenkant gaat over in een nieuwe behuizing.',
        link: { href: '/diensten/autosleutels-repareren', label: 'Autosleutel repareren' },
      },
      {
        title: 'Er zit een stuk in het deurslot of contactslot',
        desc: 'Dan moet eerst het stuk eruit. Lees wat u wel en niet doet.',
        link: { href: '/diensten/sleutel-afgebroken-in-slot', label: 'Sleutel afgebroken in slot' },
      },
      {
        title: 'De sleutel werkt helemaal niet meer en er is geen andere',
        desc: 'Dan is het voor ons hetzelfde werk als alle sleutels kwijt.',
        link: { href: '/autosleutel-kwijt', label: 'Autosleutel kwijt of geen werkende sleutel meer' },
      },
    ],
    included: [
      COME_TO_CAR,
      'De monteur bekijkt de stukken en zegt wat er kan: repareren of een nieuwe sleutel.',
      'Een nieuwe sleutel maken (frezen) en inleren op uw auto, als dat nodig is.',
      PRICE_INCLUDES,
      'Na de klus krijgt u een factuur, die u bij uw verzekering kunt indienen.',
    ],
    notIncluded: [
      NO_TOWING,
      NO_PROOF,
      'Een prijs voordat wij weten om welke auto en welk werk het gaat.',
      NO_TIME,
    ],
    faq: [
      {
        q: 'Kan een afgebroken autosleutel gerepareerd worden?',
        a: 'Vaak wel, als de chip in de sleutel heel is: dan krijgt de sleutel een nieuwe baard of een nieuwe behuizing. Of het bij uw sleutel kan, ziet de monteur aan de stukken. Stuur gerust eerst een foto via WhatsApp.',
      },
      {
        q: 'Hoe krijg ik een afgebroken sleutel uit het slot?',
        a: 'Liever niet zelf. Met een schroevendraaier, mes of lijm duwt u het stuk vaak verder naar binnen en beschadigt u het slot. Laat het zitten en neem contact op; de monteur haalt het eruit.',
      },
      {
        q: 'Wordt een afgebroken sleutel vergoed door mijn verzekering?',
        a: 'Dat hangt af van uw polis; vraag het na bij uw verzekeraar. U krijgt van ons na de klus een factuur die u kunt indienen.',
      },
      { q: 'Wat kost het?', a: PRICE_ANSWER },
      { q: 'Moet ik naar de dealer?', a: DEALER_ANSWER },
    ],
    related: [
      { href: '/diensten/autosleutels-repareren', label: 'Autosleutel repareren' },
      { href: '/diensten/behuizing-vervangen', label: 'Behuizing vervangen' },
      { href: '/diensten/sleutel-afgebroken-in-slot', label: 'Sleutel afgebroken in slot' },
      { href: '/diensten/autosleutel-bijmaken', label: 'Autosleutel bijmaken' },
      { href: '/autosleutel-kwijt', label: 'Autosleutel kwijt' },
    ],
    fromServices: ['sleutel-afgebroken-in-slot', 'autosleutels-repareren', 'behuizing-vervangen', 'knoppen-repareren'],
    serviceName: 'Hulp bij een afgebroken of kapotte autosleutel',
    serviceType: 'Autosleutel repareren of vervangen op locatie',
  },
  {
    slug: 'contactslot-draait-niet',
    name: 'Contactslot draait niet',
    metaTitle: 'Sleutel Draait Niet in het Contactslot? Wat U Nu Doet',
    metaDesc:
      'Draait de sleutel niet in het contactslot of zit hij vast? Wat u eerst probeert, wat u beter niet doet en hoe u op locatie hulp krijgt bij een kapot contactslot.',
    titleTop: 'Sleutel draait niet in het contactslot?',
    titleAccent: 'Eerst dit proberen, niet forceren',
    lead:
      'Vaak zit alleen het stuurslot vast, of is de sleutel versleten. Soms is het contactslot zelf kapot. Hieronder ziet u wat u eerst probeert en wanneer u ons belt.',
    image: {
      src: '/images/seo/auto-slotenmaker-volkswagen-golf-almere.webp',
      alt: 'Monteur van Autosleutel24 aan het werk bij een Volkswagen Golf',
    },
    safety:
      'Staat u langs de snelweg of op een andere gevaarlijke plek? Ga eerst ergens veilig staan. Bij gevaar belt u 112.',
    now: [
      {
        title: 'Beweeg het stuur heen en weer',
        desc: 'Draai de sleutel zachtjes terwijl u het stuur een stukje naar links en rechts beweegt. Vaak zit het stuurslot vast en houdt dat de sleutel tegen.',
      },
      {
        title: 'Probeer uw reservesleutel',
        desc: 'Draait die wel, dan is de eerste sleutel versleten of verbogen en niet het slot.',
      },
      {
        title: 'Niet forceren',
        desc: 'Geen tang, geen kracht. Dan breekt de sleutel af in het slot en wordt het werk groter.',
      },
      {
        title: 'Neem contact op',
        desc: 'Bel of app ons met merk, model en bouwjaar, en vertel wat er gebeurt: draait hij niet, zit hij vast of komt hij er niet uit.',
      },
    ],
    casesTitle: 'Wat kan het zijn?',
    cases: [
      {
        title: 'Het stuurslot zit vast',
        desc: 'Lost meestal op met het stuur heen en weer bewegen terwijl u de sleutel draait. Lukt dat niet, neem contact op.',
      },
      {
        title: 'De sleutel is versleten',
        desc: 'Werkt de reservesleutel wel, dan heeft u een nieuwe sleutel nodig in plaats van een nieuw slot.',
        link: { href: '/diensten/autosleutel-bijmaken', label: 'Autosleutel bijmaken' },
      },
      {
        title: 'Het contactslot is kapot',
        desc: 'Draait geen enkele sleutel, dan moet het slot gerepareerd of vervangen worden.',
        link: { href: '/diensten/contactslot-auto-vervangen', label: 'Contactslot vervangen' },
      },
      {
        title: 'Er is een stuk sleutel in het slot afgebroken',
        desc: 'Laat het zitten en duw niet verder.',
        link: { href: '/diensten/sleutel-afgebroken-in-slot', label: 'Sleutel afgebroken in slot' },
      },
    ],
    included: [
      COME_TO_CAR,
      'De monteur kijkt bij de auto of het aan de sleutel, het stuurslot of het contactslot ligt.',
      'Repareren of vervangen van het contactslot, of een nieuwe sleutel als de sleutel versleten is.',
      'U krijgt eerst een prijs voor uw auto, inclusief voorrijden en btw. Pas daarna maakt u een afspraak.',
      'Na de klus krijgt u een factuur.',
    ],
    notIncluded: [
      NO_TOWING,
      'Of het probleem in het slot zit of in de elektronica erachter, ziet de monteur pas bij de auto. Wat er dan kan, hoort u van hem.',
      NO_PROOF,
      NO_TIME,
    ],
    faq: [
      {
        q: 'Waarom draait mijn sleutel niet in het contactslot?',
        a: 'De drie bekendste oorzaken: het stuurslot zit vast, de sleutel is versleten, of het contactslot zelf is versleten of kapot. Beweeg eerst het stuur heen en weer terwijl u zachtjes draait, en probeer de reservesleutel.',
      },
      {
        q: 'Hoe weet ik of het contactslot kapot is?',
        a: 'Als ook de reservesleutel niet draait terwijl het stuur vrij beweegt, ligt het waarschijnlijk aan het slot. Hapert de sleutel al langer of moet u hem heen en weer wiebelen om te starten, dan is dat vaak een eerste teken.',
      },
      { q: 'Wat kost een nieuw contactslot?', a: PRICE_ANSWER },
      {
        q: 'Kan het contactslot op locatie vervangen worden?',
        a: 'Wij komen naar de auto toe. Of het slot bij uw auto ter plaatse gerepareerd of vervangen kan worden, hangt af van het model; dat hoort u als u merk, model en bouwjaar doorgeeft.',
      },
      { q: 'Wanneer kan er iemand komen?', a: WHEN_ANSWER },
    ],
    related: [
      { href: '/diensten/contactslot-auto-vervangen', label: 'Contactslot vervangen' },
      { href: '/diensten/sleutel-afgebroken-in-slot', label: 'Sleutel afgebroken in slot' },
      { href: '/diensten/autosleutel-bijmaken', label: 'Autosleutel bijmaken' },
      { href: '/autosleutel-afgebroken', label: 'Autosleutel afgebroken of kapot' },
    ],
    fromServices: ['contactslot-auto-vervangen'],
    serviceName: 'Hulp als de sleutel niet draait in het contactslot',
    serviceType: 'Contactslot repareren of vervangen op locatie',
  },
];

/** Where a problem page lives. */
export function problemHref(page: ProblemPage): string {
  return page.path ?? `/${page.slug}`;
}

export function getProblemPage(slug: string): ProblemPage {
  const page = PROBLEM_PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown problem page: ${slug}`);
  return page;
}

/** Problem pages that a given service page should point to. */
export function problemPagesForService(serviceSlug: string): ProblemPage[] {
  return PROBLEM_PAGES.filter((p) => p.fromServices.includes(serviceSlug));
}
