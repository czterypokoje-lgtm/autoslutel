// ============================================================
// FAQ CONFIG — Autosleutel24
// Powers FAQPage schema on all service, city, and static pages
// Built from SEMrush keyword research: autosleutel bijmaken,
// autosleutel kwijt, transponder programmeren, smart key, etc.
// ============================================================

export type FaqItem = { q: string; a: string };

// ── GLOBAL FAQs (used on homepage, FAQ page, and as fallback) ──
export const FAQ_GLOBAL: FaqItem[] = [
  {
    q: 'Wat kost het gemiddeld om een autosleutel bij te laten maken in Nederland?',
    a: 'Gemiddeld kost het bijmaken van een autosleutel in Nederland tussen de €89 en €350. De exacte prijs is afhankelijk van uw merk, bouwjaar en type sleutel (gewone transpondersleutel, klapsleutel of smart key). Omdat wij als mobiele sleutelmaker geen dure showroom hebben, zijn we vaak tot wel 50% goedkoper dan uw merkdealer. U krijgt bij Autosleutel24 altijd vooraf een vaste prijsopgave zonder verborgen kosten.',
  },
  {
    q: 'Hoe snel kunt u bij mij zijn?',
    a: 'In Utrecht zijn we gemiddeld binnen 15–30 minuten ter plaatse. In Amsterdam, Almere en Amersfoort 30–60 minuten. Wij zijn 24 uur per dag, 7 dagen per week beschikbaar — ook op zondag en feestdagen.',
  },
  {
    q: 'Wat moet ik doen als ik mijn autosleutel kwijt ben?',
    a: 'Blijf rustig en bel direct de mobiele service van Autosleutel24 (06 11 75 12 31). Wij komen direct naar uw locatie met onze servicebus. U hoeft uw auto niet te laten wegslepen naar een dealer. Wij lezen de slotcilinder of boordcomputer uit, snijden ter plekke een nieuw sleutelblad en programmeren de startonderbreker. De oude, verloren sleutel wissen we direct uit het systeem voor uw veiligheid.',
  },
  {
    q: 'Kunnen jullie ook een reservesleutel bijmaken zonder het origineel?',
    a: 'Ja. Ook als u alle sleutels kwijt bent kunnen wij een nieuwe sleutel maken via OBD-uitlezing of door de slotcilinder te decoderen. Dit is onze AKL-service (All Keys Lost). Dit is ook mogelijk voor nieuwere modellen met remote/smart key.',
  },
  {
    q: 'Zijn jullie goedkoper dan de dealer?',
    a: 'In de meeste gevallen zijn wij 40–60% goedkoper dan de officiële dealer. Dealers rekenen vaak extra voor inleren, programmeren en administratie. Wij bieden een transparante vaste prijs inclusief alles.',
  },
  {
    q: 'Werken jullie ook \'s nachts en in het weekend?',
    a: 'Ja, wij zijn 24/7 beschikbaar — ook op zaterdag, zondag en feestdagen. Spoedtarieven zijn dezelfde als reguliere tarieven.',
  },
  {
    q: 'Welke automerken ondersteunen jullie?',
    a: 'Wij werken met alle gangbare merken: BMW, Mercedes-Benz, Volkswagen, Audi, Toyota, Ford, Opel, Renault, Peugeot, Citroën, Kia, Hyundai, Volvo, Skoda, Nissan, Jeep, Porsche, Seat, Fiat, Honda en meer. Inclusief elektrische voertuigen (EV).',
  },
  {
    q: 'Hoe kan ik een transpondersleutel programmeren zonder naar de dealer te gaan?',
    a: 'U kunt een transpondersleutel niet zelf programmeren zonder gespecialiseerde OBD-uitleesapparatuur (zoals Autel of Xhorse). Gelukkig hoeft u niet naar de dealer! Autosleutel24 komt als mobiele specialist met dealer-niveau diagnoseapparatuur naar u toe. Wij programmeren de transponderchip binnen enkele minuten veilig in via de OBD2-poort van uw auto, direct op uw eigen oprit of werkplek.',
  },
  {
    q: 'Wat kan ik doen als mijn keyless entry sleutel niet meer werkt?',
    a: 'Controleer allereerst de batterij (vaak een CR2032 of CR2025 knoopcel) en vervang deze indien nodig. Werkt de keyless entry (smart key) nog steeds niet? Dan kan de sleutel zijn synchronisatie verloren hebben of is de chip defect. Houd de sleutel strak tegen de startknop (of noodantenne) om de auto alsnog mechanisch of via NCF te starten. Bel ons vervolgens direct: wij repareren of vervangen uw smart key ter plaatse.',
  },
  {
    q: 'Hebben jullie een KVK-nummer?',
    a: 'Ja. Autosleutel24 is ingeschreven bij de Kamer van Koophandel onder nummer 81726354. BTW-nummer: NL817263540B01. Na iedere service ontvangt u een officiële factuur — handig voor de verzekeringsmaatschappij.',
  },
  {
    q: 'Kan ik mijn auto openen als de accu leeg is?',
    a: 'Ja. Vrijwel alle moderne auto\'s hebben een mechanisch noodslot in de deurgreep achter een plaatje. Wij kunnen uw auto ook openen als de accu volledig leeg is — zonder de auto te beschadigen.',
  },
  {
    q: 'Wat is het verschil tussen een klapsleutel en een normale sleutel?',
    a: 'Een klapsleutel (flip key) heeft een mechanische sleutelbaar die inklapt in de behuizing. De sleutel bevat een transponder of remote-functie. Wij kunnen het sleutelblad vervangen, de transponder programmeren en het remote-gedeelte inleren op uw auto.',
  },
  {
    q: 'Hoe werkt het bijmaken van een autosleutel?',
    a: 'Als u nog een werkende autosleutel heeft, lezen wij de transponderchip uit en kopiëren we deze data naar een nieuwe chip. Daarna frezen we met een computergestuurde CNC-machine de sleutelbaard nauwkeurig na. Dit proces duurt doorgaans 20 tot 30 minuten per sleutel op uw locatie.',
  },
  {
    q: 'Autosleutel verloren, welke diensten bieden vervanging aan?',
    a: 'Wanneer u uw autosleutel bent verloren, bieden wij als gespecialiseerde mobiele slotenmaker een complete All Keys Lost (AKL) vervangingsdienst aan. Wij komen naar uw locatie, openen de auto schadevrij, frezen een nieuwe sleutel op basis van de slotcilinder, en programmeren de transponder of smart key in de boordcomputer. Dit is aanzienlijk sneller en goedkoper dan uw auto naar de merkdealer laten wegslepen.',
  },
  {
    q: 'Stappenplan autosleutel verloren?',
    a: '1. Blijf rustig en zoek op voor de hand liggende plekken. 2. Controleer of de sleutel niet per ongeluk in de auto ligt. 3. Zoek de reservesleutel. 4. Geen reservesleutel? Zoek uw kentekenbewijs en legitimatie op. 5. Bel Autosleutel24 (06 11 75 12 31). Wij komen direct naar u toe om op locatie een nieuwe sleutel te maken en in te leren.',
  },
  {
    q: 'Waar vind ik een autosleutelmaker in mijn buurt?',
    a: 'Autosleutel24 is dé mobiele autosleutelmaker in Midden-Nederland. Omdat wij werken vanuit een volledig uitgeruste servicebus, brengen wij de werkplaats naar u toe in Utrecht, Amsterdam, Almere, Amersfoort en omstreken. U hoeft dus niet op zoek naar een fysieke winkel in uw buurt; wij komen direct naar uw auto.',
  },
  {
    q: 'Kosten voor het bijmaken van een autosleutel zonder reserve?',
    a: 'Het bijmaken van een autosleutel zonder originele reserve (All Keys Lost) kost meer dan een simpele kopie, omdat we het slot moeten decoderen. De kosten starten rond de €150 voor mechanische sleutels en kunnen oplopen voor moderne smart keys. Bij Autosleutel24 betaalt u echter altijd een vaste, transparante prijs die tot wel 50% lager ligt dan bij de autodealer, zonder extra sleepkosten.',
  },
  {
    q: 'Kan een autosleutel met afstandsbediening zonder originele sleutel worden gemaakt?',
    a: 'Ja, absoluut. Met onze geavanceerde OBD2-diagnoseapparatuur kunnen wij een geheel nieuwe autosleutel met afstandsbediening (en transponder) inleren in de boordcomputer van uw auto, zelfs als u de originele sleutel niet meer heeft. De oude, verloren afstandsbediening wissen wij direct uit het systeem ter preventie van diefstal.',
  },
  {
    q: 'Auto openen zonder sleutel door professional?',
    a: 'Heeft u uw sleutel in de auto laten liggen? Autosleutel24 is gespecialiseerd in het 100% schadevrij openen van auto\'s. Wij gebruiken hiervoor professionele technieken zoals air wedges en Lishi lock picks. Hiermee manipuleren we het slot zonder de lak, ramen of rubbers te beschadigen. Probeer dit nooit zelf met een kledinghanger, dit leidt vrijwel altijd tot dure schade.',
  },
  {
    q: 'Autosleutel kwijt, kan de dealer een nieuwe maken?',
    a: 'Ja, de merkdealer kan een nieuwe sleutel maken, maar dit brengt nadelen met zich mee. U moet uw auto op eigen kosten naar de dealer laten slepen, en het bestellen van een sleutel bij de fabriek duurt vaak 1 tot 2 weken. Autosleutel24 biedt een sneller en goedkoper alternatief: wij maken en programmeren de sleutel direct bij u op locatie, terwijl u wacht.',
  },
  {
    q: 'Vervangende autosleutel bestellen online?',
    a: 'U kunt online lege sleutelbehuizingen bestellen, maar het online bestellen van een volledig werkende transpondersleutel is onmogelijk. Een sleutel moet namelijk fysiek worden ingeleerd op de unieke startonderbreker van uw auto via de OBD-poort. Autosleutel24 levert originele OEM-kwaliteit sleutels en verzorgt de volledige programmering bij u thuis.',
  },
  {
    q: 'Hoe werkt autosleutel programmeren na verlies?',
    a: 'Na het verlies van uw sleutels sluiten wij onze diagnoseapparatuur aan op de OBD2-poort van uw auto. We communiceren met de ECU (boordcomputer) om veiligheidscodes te verifiëren. Vervolgens schrijven we de unieke digitale code van de nieuwe transponderchip in het geheugen van de auto. Als laatste stap wissen we de verloren sleutel uit het systeem, zodat deze de auto niet meer kan starten.',
  },
  {
    q: 'Is autosleutel kwijt gedekt door verzekering?',
    a: 'Dit hangt af van uw polis. Bij een WA+ Beperkt Casco of All-Risk verzekering worden de kosten voor het vervangen van verloren of gestolen autosleutels (en soms het vervangen van de sloten) vaak gedekt door de verzekeraar. Controleer uw polisvoorwaarden. Wij voorzien u altijd van een officiële factuur die u kunt indienen bij uw verzekeringsmaatschappij.',
  },
  {
    q: 'Wat zijn de opties bij alle autosleutels kwijt?',
    a: 'Bij verlies van alle sleutels heeft u twee opties: 1) De auto laten wegslepen naar de dealer, wat duur is en weken duurt. 2) Een mobiele slotenmaker zoals Autosleutel24 inschakelen. Wij komen direct naar u toe, openen de auto, frezen een nieuwe sleutel op basis van het slot en programmeren deze direct in. Dit is de snelste en meest voordelige optie.',
  },
  {
    q: 'Hoe vind ik een goedkope autosleutelmaker?',
    a: 'Kies voor een onafhankelijke, mobiele specialist in plaats van de officiële autodealer. Omdat mobiele autosleutelmakers zoals Autosleutel24 geen duur pand of showroom hebben, liggen de overheadkosten veel lager. Wij kopen direct in en berekenen dit voordeel door aan de klant, waardoor we vaak de goedkoopste en snelste optie in de regio zijn.',
  },
  {
    q: 'Kan ik een autosleutel online bestellen en laten programmeren?',
    a: 'Het zelf online bestellen van een sleutel (via AliExpress of eBay) wordt afgeraden, omdat deze vaak van slechte kwaliteit zijn of niet de juiste chip bevatten voor uw specifieke model. Wij kunnen door de klant aangeleverde sleutels soms programmeren, maar geven hier geen garantie op. Wij raden aan om onze hoogwaardige OEM-sleutels te gebruiken inclusief garantie en inleren.',
  },
  {
    q: 'Autosleutel kwijt, wat kost het vervangen door een universele sleutel?',
    a: 'Een volledig "universele" autosleutel bestaat niet voor moderne auto\'s, omdat elke auto een unieke cryptografische startonderbreker heeft. Wel gebruiken wij hoogwaardige aftermarket (OEM-kwaliteit) sleutels die we specifiek voor uw auto programmeren. Dit kost, afhankelijk van het model en type (transponder of smart key), tussen de €150 en €350 in een situatie waarbij alle sleutels kwijt zijn.',
  },
  {
    q: 'Hoelang duurt het bijmaken van een autosleutel?',
    a: 'Voor een standaard transponder sleutel duurt het 20–45 minuten ter plaatse. Smart keys en keyless entry systemen kunnen 45–90 minuten duren. Wij beginnen pas als u akkoord gaat met de vaste prijs.',
  },
  {
    q: 'Zijn jullie ook beschikbaar buiten Utrecht?',
    a: 'Ja, wij bedienen heel Nederland. Vaste servicegebieden: Utrecht, Amsterdam, Almere, Amersfoort, Hilversum, Bussum, Naarden, Zeist, Houten, Nieuwegein, Woerden, Amstelveen en meer dan 40 andere steden.',
  },
  {
    q: 'Geven jullie garantie op uw werk?',
    a: 'Ja, wij geven 12 maanden garantie op alle sleutels en programmeerwerkzaamheden. Als uw sleutel binnen een jaar niet meer werkt door een fout van ons, lossen we het gratis op.',
  },
];

// ── SERVICE-SPECIFIC FAQs ──
export const FAQ_AUTOSLEUTEL_BIJMAKEN: FaqItem[] = [
  {
    q: 'Hoe maak je een autosleutel bij?',
    a: 'Ons proces: 1) Wij lezen de slotcilinder uit of gebruiken de OBD-poort van uw auto. 2) Wij snijden een nieuw sleutelblad op maat. 3) De transponderchip wordt geprogrammeerd op uw specifieke auto. 4) De sleutel wordt ingeleerd als geautoriseerde sleutel. Dit alles ter plaatse, zonder dat u naar de garage hoeft.',
  },
  {
    q: 'Kan een autosleutel bijgemaakt worden zonder het origineel?',
    a: 'Ja, dit is onze specialiteit. Via OBD-uitlezing of cilinder-decodering kunnen wij altijd een nieuwe sleutel maken — ook als u geen enkel origineel meer heeft (All Keys Lost situatie).',
  },
  {
    q: 'Hoe duur is een reservesleutel laten bijmaken?',
    a: 'Prijzen starten vanaf €89 voor eenvoudige transponder sleutels. Smart keys en keyless sleutels kosten €149–€299. Een vaste prijs wordt altijd vooraf gecommuniceerd. Bel voor een gratis offerte: 06 11 75 12 31.',
  },
];

export const FAQ_TRANSPONDER: FaqItem[] = [
  {
    q: 'Wat is een transponder sleutel programmeren?',
    a: 'Transponder programmeren betekent dat de unieke code van de chip in uw nieuwe sleutel wordt gekoppeld aan de immobiliser van uw auto. Zonder deze koppeling start de motor niet. Wij doen dit via de OBD-poort of via pin-code berekening — afhankelijk van uw auto.',
  },
  {
    q: 'Hoeveel transponders kan mijn auto onthouden?',
    a: 'De meeste auto\'s kunnen 2–8 transponders opslaan. BMW\'s en Mercedes\'s ondersteunen vaak tot 10. Wij controleren altijd de huidige configuratie en registreren uw nieuwe sleutel op de juiste manier.',
  },
  {
    q: 'Kan ik een transponder sleutel zelf programmeren?',
    a: 'Nee, voor de meeste moderne auto\'s heeft u speciale apparatuur nodig (AUTEL, Xhorse VVDI, Autocom). DIY-oplossingen werken alleen voor oudere auto\'s van vóór 2005. Wij beschikken over professionele apparatuur voor alle merken en modellen.',
  },
];

export const FAQ_SMART_KEY: FaqItem[] = [
  {
    q: 'Wat kost een Smart Key bijmaken?',
    a: 'Smart keys kosten meer dan gewone sleutels vanwege de complexere electronica en de programmeerprocessen. Prijzen: €149–€299 afhankelijk van merk en model. BMW Smart Keys zijn gemiddeld €199, Mercedes €229, VW/Audi €179.',
  },
  {
    q: 'Hoe lang is de batterij van een Smart Key?',
    a: 'Gemiddeld 1–3 jaar bij normaal gebruik. Wij vervangen ook de batterij in uw Smart Key. Kosten: €15–€25 voor de batterijwissel inclusief functietest.',
  },
];

export const FAQ_AUTO_OP_SLOT: FaqItem[] = [
  {
    q: 'Hoe snel kan mijn auto geopend worden?',
    a: 'Wij zijn in Utrecht gemiddeld binnen 20 minuten ter plaatse. In Amsterdam 30–45 minuten. Het openen van de auto zelf duurt 5–20 minuten, afhankelijk van het model.',
  },
  {
    q: 'Kunt u mijn auto openen zonder schade?',
    a: 'Ja. Wij gebruiken uitsluitend professioneel locksmith-gereedschap: Lishi decoders, air-wedge tools en J-tools. Uw lak, ramen en deursealen blijven 100% intact. Wij werken ook bij auto\'s met extra deadlock-beveiliging.',
  },
  {
    q: 'Hoe kan ik mijn auto openen als ik mijn sleutel binnen heb laten liggen zonder schade te maken?',
    a: 'Probeer het nooit zelf met een kledinghanger of door een ruit in te slaan; de schadekosten (en lakschade) vallen vaak veel hoger uit. Bel een professionele auto slotenmaker. Wij gebruiken speciale Lishi-slotdecoders of pomp-kussentjes (air wedges) om de deuren 100% schadevrij te openen, binnen enkele minuten. Zelfs als het contact aan staat of de sleutel in de kofferbak ligt, krijgen wij hem onbeschadigd open.',
  },
  {
    q: 'Wat als mijn autosleutel in de auto zit en de deur op slot is?',
    a: 'Bel ons direct. Wij openen uw auto mechanisch via de slotcilinder of elektronisch via de OBD-poort. U hoeft de auto niet te laten slepen. Dit is onze meest gevraagde spoeddienst.',
  },
];

export const FAQ_AKL: FaqItem[] = [
  {
    q: 'Wat moet ik doen als al mijn autosleutels kwijt zijn?',
    a: 'Bel ons direct op 06 11 75 12 31. Wij bieden de AKL-service (All Keys Lost). Stap 1: wij verwijderen alle bestaande sleutels uit het geheugen van uw auto. Stap 2: wij maken een nieuwe sleutel. Stap 3: de nieuwe sleutel wordt als enige geautoriseerde sleutel ingeleerd. U rijdt weer veilig weg.',
  },
  {
    q: 'Is het mogelijk dat iemand met mijn oude (verloren) sleutel mijn auto openkan?',
    a: 'Na de AKL-procedure niet meer. Wij wissen alle oude sleutels uit het systeem. Uw verloren sleutel is daarna onbruikbaar. Dit is ook een veiligheidsadvies: laat altijd de oude sleutels verwijderen als ze gestolen zijn.',
  },
];

// ── CITY-SPECIFIC FAQs (dynamisch gegenereerd op stadspage) ──
export function getFaqForCity(cityName: string): FaqItem[] {
  return [
    {
      q: `Hoe snel bent u in ${cityName}?`,
      a: `In ${cityName} zijn wij gemiddeld binnen 30–60 minuten ter plaatse, 24 uur per dag, 7 dagen per week. Bel 06 11 75 12 31 voor de exacte wachttijd op dit moment.`,
    },
    {
      q: `Maken jullie ook autosleutels bij in ${cityName}?`,
      a: `Ja, wij bieden onze volledige service in ${cityName}: sleutel bijmaken, transponder programmeren, smart key bijmaken, auto openen en contactslot repareren. Dit alles op uw locatie — wij komen naar u toe.`,
    },
    {
      q: `Wat zijn de kosten voor autosleutel service in ${cityName}?`,
      a: `De prijzen zijn gelijk voor heel Nederland. Transponder sleutels vanaf €89, smart keys vanaf €149, auto openen vanaf €95. U ontvangt altijd een vaste prijs vooraf. Geen reiskosten of bijkomende kosten.`,
    },
    {
      q: `Werken jullie ook \'s nachts in ${cityName}?`,
      a: `Ja, ook in ${cityName} zijn wij 24/7 beschikbaar. Spoedopdrachten \'s nachts of in het weekend worden behandeld met dezelfde snelheid en tarief als overdag.`,
    },
  ];
}
