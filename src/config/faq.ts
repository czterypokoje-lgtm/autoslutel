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
    q: 'Wat kost het bijmaken van een autosleutel?',
    a: 'De kosten voor het bijmaken van een autosleutel variëren van €89 tot €350, afhankelijk van het merk, model en type sleutel (transponder, smart key, klapsleutel). Wij geven altijd een vaste prijs vóór we beginnen. Geen verrassingen achteraf. Bel 06 11 75 12 31 voor een gratis prijsopgave.',
  },
  {
    q: 'Hoe snel kunt u bij mij zijn?',
    a: 'In Utrecht zijn we gemiddeld binnen 15–30 minuten ter plaatse. In Amsterdam, Almere en Amersfoort 30–60 minuten. Wij zijn 24 uur per dag, 7 dagen per week beschikbaar — ook op zondag en feestdagen.',
  },
  {
    q: 'Mijn autosleutel is kwijt, wat nu?',
    a: 'Bel ons direct op 06 11 75 12 31 of stuur een WhatsApp. Wij komen naar uw locatie en maken ter plaatse een nieuwe autosleutel — inclusief transponder programmeren. U hoeft de auto niet te laten slepen naar de dealer.',
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
    q: 'Wat is een transponder sleutel?',
    a: 'Een transponder sleutel heeft een kleine elektronische chip ingebouwd die communiceert met de startonderbreker van uw auto. Zonder de juiste transpondercode start de motor niet — ook al heeft u de juiste sleutelvorm. Wij programmeren transponders voor alle merken ter plaatse.',
  },
  {
    q: 'Hoe werkt een Smart Key / keyless entry?',
    a: 'Een Smart Key communiceert draadloos met uw auto via radiofrequentie. U hoeft de sleutel niet uit uw zak te halen om de auto te openen of te starten. Wij kunnen Smart Keys bijmaken en programmeren voor Mercedes, BMW, Audi, Volkswagen, Toyota, Kia en meer.',
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
