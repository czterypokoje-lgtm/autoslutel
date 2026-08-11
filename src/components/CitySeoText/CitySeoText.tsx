import React from 'react';
import { SITE_CONFIG } from '@/config/site.config';

function getStableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const introTemplates = [
  (city: string, travel: string) => `Welkom bij ${SITE_CONFIG.name}, uw betrouwbare partner voor alles rondom autosleutels in ${city} en omstreken. Heeft u een probleem met uw sleutel, afstandsbediening of slot? Onze specialisten staan 24/7 voor u klaar en zijn vaak al binnen ${travel} ter plaatse om u weer op weg te helpen. Wij werken volledig mobiel en beschikken over de meest geavanceerde apparatuur.`,
  (city: string, travel: string) => `Heeft u met spoed een nieuwe autosleutel nodig in ${city}? Of krijgt u uw auto niet meer open? ${SITE_CONFIG.name} biedt een unieke, volledig mobiele slotenmakerservice. Binnen gemiddeld ${travel} is onze monteur bij u in ${city} gearriveerd. Wij garanderen een schadevrije opening en kunnen vrijwel elke sleutel ter plekke voor u bijmaken en inleren.`,
  (city: string, travel: string) => `In ${city} en de wijde regio eromheen is ${SITE_CONFIG.name} dé specialist op het gebied van autosleutels en autobeveiliging. U hoeft uw voertuig niet naar een dure dealer te slepen als u al uw sleutels kwijt bent. Wij komen naar u toe. Met een gemiddelde aanrijtijd van slechts ${travel} lossen wij uw probleem direct naast de auto op.`
];

const bodyTemplates1 = [
  (city: string) => `Onze mobiele werkplaatsen rijden dagelijks door ${city}. Ze zijn uitgerust met computergestuurde CNC-freesmachines en de modernste OBD-uitleesapparatuur. Hierdoor kunnen we niet alleen traditionele transpondersleutels, maar ook geavanceerde Smart Keys en Keyless Go-systemen moeiteloos programmeren. Of u nu op uw oprit staat, op uw werk of langs een drukke weg in ${city}, onze service gaat altijd door.`,
  (city: string) => `Waar traditionele garages in ${city} vaak een wachttijd van weken hebben voor het bestellen van een originele autosleutel, doen wij dit direct uit voorraad. Onze monteurs in ${city} hebben toegang tot software van meer dan 38 automerken. Dit betekent dat wij de boordcomputer kunnen uitlezen, oude en verloren sleutels veilig uit het geheugen kunnen blokkeren, en ter plekke een compleet nieuwe sleutel voor u maken.`,
  (city: string) => `Het verliezen van uw laatste autosleutel (All Keys Lost) in ${city} is een stressvolle gebeurtenis. Wij nemen deze zorg volledig uit handen. Omdat wij niet werken met wegsleepdiensten of dure tussenpersonen, bent u bij ons tot wel 50% voordeliger uit. Onze ervaren technici zijn getraind om veilig de immobiliser of ECU van uw voertuig te bereiken, zelfs als de deuren geblokkeerd zijn met zogenaamde deadlocks.`
];

const bodyTemplates2 = [
  (city: string) => `Daarnaast zijn wij gespecialiseerd in het schadevrij openen van voertuigen. Mocht u per ongeluk uw sleutels in de kofferbak of op de passagiersstoel hebben laten liggen, dan openen wij uw deuren met speciale Lishi decoders. Dit lockpick-gereedschap zorgt ervoor dat uw slot volledig intact blijft. Inwoner of bezoeker van ${city}, wij helpen u veilig uw voertuig weer in.`,
  (city: string) => `Ook voor reparaties aan bestaande sleutels bent u in ${city} aan het juiste adres. Zijn de drukknoppen lam, de behuizing gebroken, of is de batterij gewoon aan vervanging toe? Wij voeren microsoldeerwerk uit op locatie. Hierdoor bespaart u de kosten van een geheel nieuwe sleutel en wordt de levensduur van uw huidige afstandsbediening aanzienlijk verlengd. We gebruiken hiervoor enkel hoogwaardige OEM-componenten.`,
  (city: string) => `Transparantie en veiligheid staan bij ons voorop. Voordat we in ${city} aan uw auto beginnen, controleren wij altijd de identiteit en de eigendomspapieren om misbruik te voorkomen. U krijgt bovendien van tevoren een exacte prijsopgave, zodat u nooit voor verrassingen komt te staan. Met een officiële, verzekeringsklare factuur en 12 maanden schriftelijke garantie op ons werk, bent u verzekerd van absolute topkwaliteit.`
];

interface CitySeoTextProps {
  cityName: string;
  travelTime: string;
}

export default function CitySeoText({ cityName, travelTime }: CitySeoTextProps) {
  const hash = getStableHash(cityName);
  
  const intro = introTemplates[hash % introTemplates.length];
  const body1 = bodyTemplates1[(hash + 1) % bodyTemplates1.length];
  const body2 = bodyTemplates2[(hash + 2) % bodyTemplates2.length];

  return (
    <div className="seo-article-block">
      <h2>Compleet Verzorgde Autosleutelservice in {cityName}</h2>
      <p>{intro(cityName, travelTime)}</p>
      
      <h3>Moderne Apparatuur, Direct uit Voorraad</h3>
      <p>{body1(cityName)}</p>
      
      <h3>Schadevrij Openen en Vakkundige Reparaties</h3>
      <p>{body2(cityName)}</p>
      
      <h3>Kies voor Zekerheid in {cityName}</h3>
      <p>
        Wacht niet langer als uw sleutel kuren vertoont of als u een extra exemplaar nodig heeft. 
        Onze lokale dekking in <strong>{cityName}</strong> garandeert snelle responstijden en 
        professioneel vakmanschap. Bel direct <strong>{SITE_CONFIG.phone}</strong> voor een 
        vrijblijvende prijsopgave of om meteen een spoedmonteur in te schakelen. 
        Uw mobiliteit is onze prioriteit.
      </p>
    </div>
  );
}
