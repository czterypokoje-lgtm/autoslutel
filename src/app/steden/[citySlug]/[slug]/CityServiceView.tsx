import Link from 'next/link';
import Script from 'next/script';
import { DIENSTEN, type Service } from '@/config/diensten';
import { getRelatedBlogPosts } from '@/config/services';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { CITIES, type City } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import styles from './service.module.css';

// ── Types ──────────────────────────────────────────────────────────────────
interface CityDetail {
  postcodes: string;
  neighborhoods: string[];
  landmarks: string[];
  highway: string;
}

interface PillarDetail {
  name: string;
  chips: string;
  equipment: string;
  method: string;
  keywords: string[];
}

// ── City details mapping (39 cities) ───────────────────────────────────────
const CITY_DETAILS_MAP: Record<string, CityDetail> = {
  'utrecht': {
    postcodes: '3511 t/m 3585',
    neighborhoods: ['Lombok', 'Overvecht', 'Ondiep', 'Wittevrouwen'],
    landmarks: ['Hoog Catharijne', 'de Domtoren', 'de Jaarbeurs'],
    highway: 'A2'
  },
  'utrecht-centrum': {
    postcodes: '3511 t/m 3512',
    neighborhoods: ['Wijk C', 'het Museumkwartier', 'de Breedstraatbuurt', 'de Neude-Janskerkhofbuurt'],
    landmarks: ['de Springweg parkeergarage', 'de Neude', 'Vredenburg'],
    highway: 'de Utrechtse Singels'
  },
  'utrecht-zuid': {
    postcodes: '3521 t/m 3528',
    neighborhoods: ['Lunetten', 'Hoograven', 'Tolsteeg', 'de Rivierenwijk'],
    landmarks: ['P+R Westraven', 'Winkelcentrum Hart van Hoograven', 'het Beatrixpark'],
    highway: 'A12'
  },
  'amsterdam': {
    postcodes: '1011 t/m 1109',
    neighborhoods: ['de Jordaan', 'De Pijp', 'Oud-West', 'Amsterdam-Noord'],
    landmarks: ['de Johan Cruijff ArenA', 'de Dam', 'het Museumplein'],
    highway: 'A10'
  },
  'amsterdam-centrum': {
    postcodes: '1011 t/m 1018',
    neighborhoods: ['de Grachtengordel', 'de Haarlemmerbuurt', 'de Jodenbuurt', 'de Wallen'],
    landmarks: ['de Prinsengracht', 'Q-Park Kalverstraat', 'het Waterlooplein'],
    highway: 'de Centrumgrachten'
  },
  'amsterdam-zuid': {
    postcodes: '1071 t/m 1083',
    neighborhoods: ['Buitenveldert', 'Oud-Zuid', 'de Zuidas', 'de Rivierenbuurt'],
    landmarks: ['het WTC Amsterdam', 'Gelderlandplein', 'het Olympisch Stadion'],
    highway: 'A10 ring'
  },
  'amersfoort': {
    postcodes: '3811 t/m 3829',
    neighborhoods: ['Vathorst', 'Schothorst', 'het Soesterkwartier', 'Liendert'],
    landmarks: ['het Eemplein', 'de Koppelpoort', 'Winkelcentrum Emiclaer'],
    highway: 'A1'
  },
  'almere': {
    postcodes: '1301 t/m 1363',
    neighborhoods: ['Almere Stad', 'Almere Buiten', 'Almere Haven', 'Almere Poort'],
    landmarks: ['het Stadshart Almere', 'het Weerwater', 'Almere Centrum station'],
    highway: 'A6'
  },
  'ede': {
    postcodes: '6711 t/m 6718',
    neighborhoods: ['Veldhuizen', 'Kernhem', 'de Rietkampen', 'Ede-Oost'],
    landmarks: ['Winkelcentrum Bellestein', 'Ede Centrum station', 'de Edese Heide'],
    highway: 'A12'
  },
  'niewegein': {
    postcodes: '3431 t/m 3439',
    neighborhoods: ['Batau-Noord', 'Fokkesteeg', 'Zuilenstein', 'Vreeswijk'],
    landmarks: ['Cityplaza', 'de Kom', 'P+R Westraven'],
    highway: 'A2'
  },
  'veenendaal': {
    postcodes: '3901 t/m 3907',
    neighborhoods: ['Veenendaal-West', 'Petenbos', 'Dragonder', 'Veenendaal-Zuid'],
    landmarks: ['Winkelcentrum Corridor', 'het Ritmeesterpark', 'station Veenendaal-De Klomp'],
    highway: 'A12'
  },
  'zeist': {
    postcodes: '3701 t/m 3709',
    neighborhoods: ['Zeist-West', 'Kerckebosch', 'Zeist-Centrum', 'Huis ter Heide'],
    landmarks: ['Slot Zeist', 'Winkelcentrum Belcour', 'Utrecht Science Park'],
    highway: 'A28'
  },
  'houten': {
    postcodes: '3991 t/m 3997',
    neighborhoods: ['Houten-Noord', 'Houten-Zuid', 'Schonauwen', 'De Borchen'],
    landmarks: ['Winkelcentrum Het Rond', 'station Castellum', 'het Oude Dorp'],
    highway: 'A27'
  },
  'soest': {
    postcodes: '3761 t/m 3769',
    neighborhoods: ['Soestdijk', 'Overhees', 'Smitsveen', 'Soest-Zuid'],
    landmarks: ['Paleis Soestdijk', 'Winkelcentrum Overhees', 'station Soestdijk'],
    highway: 'A1'
  },
  'hilversum': {
    postcodes: '1211 t/m 1223',
    neighborhoods: ['de Gooische Es', 'Kerkelanden', 'Hilversum-Oost', 'Trompenberg'],
    landmarks: ['Winkelcentrum Hilvertshof', 'het Media Park', 'station Hilversum'],
    highway: 'A27'
  },
  'gouda': {
    postcodes: '2801 t/m 2809',
    neighborhoods: ['Goverwelle', 'Bloemendaal', 'Korte Akkeren', 'Plaswijck'],
    landmarks: ['de Goudse Markt', 'Winkelcentrum Bloemendaal', 'station Gouda'],
    highway: 'A12'
  },
  'woerden': {
    postcodes: '3441 t/m 3449',
    neighborhoods: ['Snel en Polanen', 'het Schilderskwartier', 'Molenvliet', 'Woerden-Midden'],
    landmarks: ['Kasteel Woerden', 'Winkelcentrum Snel & Polanen', 'station Woerden'],
    highway: 'A12'
  },
  'de-bilt': {
    postcodes: '3731 t/m 3732',
    neighborhoods: ['Weltevreden', 'De Bilt-West', 'Brandenburg', 'de Bilt-Oost'],
    landmarks: ['de Hesselaan', 'KNMI hoofdkantoor parking', 'het Utrechts Landschap'],
    highway: 'A28'
  },
  'maarssen': {
    postcodes: '3601 t/m 3608',
    neighborhoods: ['Maarssen-Broek', 'Kamelenspoor', 'Zandweg-Oostwaard', 'Maarssen-Dorp'],
    landmarks: ['Winkelcentrum Bisonspoor', 'de Vechtstreek', 'station Maarssen'],
    highway: 'A2'
  },
  'culemborg': {
    postcodes: '4101 t/m 4107',
    neighborhoods: ['Parijsch', 'Terweijde', 'Voorkoop', 'Culemborg-Oost'],
    landmarks: ['Winkelcentrum Parijsch', 'de Veerboot Lek', 'station Culemborg'],
    highway: 'A2'
  },
  'leusden': {
    postcodes: '3831 t/m 3834',
    neighborhoods: ['Leusden-Zuid', 'Hamersveld', 'Alandsbeek', 'de Tabaksteeg'],
    landmarks: ['Winkelcentrum De Hamershof', 'het AFAS Software hoofdkantoor', 'de Leusderheide'],
    highway: 'A28'
  },
  'baarn': {
    postcodes: '3741 t/m 3744',
    neighborhoods: ['de Schilderswijk', 'Baarn-Centrum', 'Eemdal', 'Oosterhei'],
    landmarks: ['Kasteel Groeneveld', 'de Brink Baarn', 'station Baarn'],
    highway: 'A1'
  },
  'wijk-bij-duurstede': {
    postcodes: '3961 t/m 3962',
    neighborhoods: ['De Horden', 'Frankhof', 'Wijk-Centrum', 'Noorderwaard'],
    landmarks: ['Kasteel Duurstede', 'de Markt', 'de Haven van Wijk'],
    highway: 'N229'
  },
  'ijsselstein': {
    postcodes: '3401 t/m 3404',
    neighborhoods: ['Zenderpark', 'Achterveld', 'IJsselveld', 'IJsselstein-Centrum'],
    landmarks: ['Winkelcentrum Clinckhoeff', 'de Kasteeltoren', 'de Basiliek'],
    highway: 'A2'
  },
  'vianen': {
    postcodes: '4131 t/m 4133',
    neighborhoods: ['Hagestein', 'De Hagen', 'de Monnikenhof', 'Vianen-Centrum'],
    landmarks: ['de Lekpoort', 'Winkelcentrum Vianen', 'P+R Vianen'],
    highway: 'A2'
  },
  'bunnik': {
    postcodes: '3981 t/m 3985',
    neighborhoods: ['Bunnik-West', 'Odijk', 'Werkhoven', 'Bunnik-Oost'],
    landmarks: ['de Kromme Rijn', 'station Bunnik', 'Kasteel Rhijnauwen'],
    highway: 'A12'
  },
  'oudewater': {
    postcodes: '3421',
    neighborhoods: ['Brede Dijk', 'Oudewater-Centrum', 'Noorthely', 'de Marktzijde'],
    landmarks: ['de Heksenwaag', 'de Markt Oudewater', 'de Vlist'],
    highway: 'N228'
  },
  'montfoort': {
    postcodes: '3417',
    neighborhoods: ['Montfoort-Centrum', 'het Keizerrijk', 'Tabakshof', 'de Vlasakker'],
    landmarks: ['Kasteel Montfoort', 'de Parklaan', 'de Hollandse IJssel'],
    highway: 'N228'
  },
  'lopik': {
    postcodes: '3411',
    neighborhoods: ['Lopik-Dorp', 'Cabauw', 'Benschop', 'Polsbroek'],
    landmarks: ['de Lopikerwaard', 'de Zendmast Lopik', 'het dorpsplein'],
    highway: 'N210'
  },
  'breukelen': {
    postcodes: '3621',
    neighborhoods: ['Breukelen-Noord', 'Nijenrode', 'Broeckland', 'Breukelen-Zuid'],
    landmarks: ['Kasteel Nijenrode', 'station Breukelen', 'de Vechtbrug'],
    highway: 'A2'
  },
  'abcoude': {
    postcodes: '1391',
    neighborhoods: ['Abcoude-Dorp', 'Meerland', 'de Osterbuurt', 'Abcoude-Zuid'],
    landmarks: ['het Fort bij Abcoude', 'het Meerbad', 'de Angstel'],
    highway: 'A2'
  },
  'mijdrecht': {
    postcodes: '3641 t/m 3642',
    neighborhoods: ['Mijdrecht-Dorp', 'Hofland-Zuid', 'Twistvlied', 'Molenland'],
    landmarks: ['Winkelcentrum De Passage', 'het Wickelhofpark', 'de Ringvaart'],
    highway: 'N201'
  },
  'vinkeveen': {
    postcodes: '3645',
    neighborhoods: ['de Vinkeveense Plassen', 'Zuiderwaard', 'de Groenlandsekade', 'Winkeldijk'],
    landmarks: ['de jachthaven Vinkeveen', 'de Groenlandsekade parking', 'de Plassen'],
    highway: 'A2'
  },
  'gooise-meren': {
    postcodes: '1401 t/m 1406',
    neighborhoods: ['Naarden-Vesting', 'Bussum-Zuid', 'Muiden', 'Muiderberg'],
    landmarks: ['het Muiderslot', 'het Naarden Vestingmuseum', 'station Naarden-Bussum'],
    highway: 'A1'
  },
  'amstelveen': {
    postcodes: '1181 t/m 1189',
    neighborhoods: ['het Stadshart', 'Elsrijk', 'het Keizer Karelpark', 'Westwijk'],
    landmarks: ['Stadshart Amstelveen', 'het Amsterdamse Bos', 'het Cobra Museum'],
    highway: 'A9'
  },
  'diemen': {
    postcodes: '1111 t/m 1113',
    neighborhoods: ['Diemen-Zuid', 'Diemen-Noord', 'Diemen-Centrum', 'de Ruys de Beerenbrouckstraat'],
    landmarks: ['Winkelcentrum Diemerplein', 'station Diemen', 'het Diemerbos'],
    highway: 'A10'
  },
  'alphen-aan-den-rijn': {
    postcodes: '2401 t/m 2409',
    neighborhoods: ['Kerk en Zanen', 'Ridderveld', 'Alphen-Centrum', 'Oudshoorn'],
    landmarks: ['Winkelcentrum de Atlas', 'Avifauna', 'station Alphen aan den Rijn'],
    highway: 'N11'
  },
  'barneveld': {
    postcodes: '3771 t/m 3776',
    neighborhoods: ['Norschoten', 'Veller', 'Barneveld-Centrum', 'de Rootselaar-Oost'],
    landmarks: ['het Schaffelaartheater', 'station Barneveld-Centrum', 'Kasteel de Schaffelaar'],
    highway: 'A1'
  },
  'nijkerk': {
    postcodes: '3861 t/m 3864',
    neighborhoods: ['Corlaer', 'Nijkerk-Centrum', 'Paasbos', 'de Hazeveld'],
    landmarks: ['Winkelcentrum Paasbos', 'de Haven van Nijkerk', 'de Grote Kerk'],
    highway: 'A28'
  }
};

function getCityDetails(city: City): CityDetail {
  const custom = CITY_DETAILS_MAP[city.slug];
  if (custom) return custom;
  return {
    postcodes: '3500 t/m 3900',
    neighborhoods: ['het centrum', 'de omliggende wijken', 'de woongebieden', 'de randweg-zones'],
    landmarks: ['het treinstation', 'de centrale parkeergarage', 'het stadhuis'],
    highway: city.region === 'Noord-Holland' ? 'A10' : 'A12'
  };
}

// ── Pillar details mapping (6 pillars) ─────────────────────────────────────
const PILLAR_DETAILS: Record<string, PillarDetail> = {
  'autodeur-openen': {
    name: 'Autodeur Openen',
    chips: 'bypass tools en mechanische decodering van de cilinder',
    equipment: 'Lishi HU66, HU92, HU101, HU162T decoders, over-the-shoulder tools en air wedges',
    method: '100% schadevrije mechanische lockpicking via de cilinder. Er worden geen ruiten ingeslagen of deurstijlen verbogen.',
    keywords: ['autodeur openen zonder sleutel', 'auto schadevrij openen', 'sleutel in auto laten liggen', 'kofferbak schadevrij openen', 'sleutel afgebroken in slot'],
  },
  'sleutel-bijmaken': {
    name: 'Autosleutel Bijmaken',
    chips: 'Megamos ID48, PCF7936, Hitag Pro en DST-AES transponder chips',
    equipment: 'Autel IM608 Pro, Lonsdor K518, Xhorse VVDI Key Tool Plus en Condor XC-Mini CNC sleutelsnijmachine',
    method: 'OBD2 diagnostic port inleren en CNC key cutting voor een perfect passend profiel.',
    keywords: ['autosleutel bijmaken', 'reservesleutel auto maken', 'transponder programmeren', 'smart key inleren', 'autosleutel met afstandsbediening'],
  },
  'autosleutel-kwijt': {
    name: 'Autosleutel Kwijt',
    chips: 'EEPROM data writing, MCU reading en immobilizer synchronisatie',
    equipment: 'XP400 Pro programmer, VVDI Prog, Lonsdor K518 en Autel IM608 Pro OBD sleutel-schrijver',
    method: 'direct uitlezen van de eeprom of MCU op de startmodule (zoals CAS/FEM/EIS) om sleutelcodes te berekenen en de boordcomputer te herprogrammeren.',
    keywords: ['alle autosleutels kwijt', 'autosleutel verloren', 'autosleutel diefstal blokkeren', 'sleutelmaker op locatie', 'noodopening auto'],
  },
  'batterij-vervangen': {
    name: 'Batterij Vervangen',
    chips: 'Lithium knoopcellen (Panasonic, Duracell en Varta CR2032, CR2025, CR2450, CR1620, CR1616)',
    equipment: 'RF frequentietesters, digitale spanningstesters en precisie plectrum openers',
    method: 'handmatige demontage van de behuizing met specialistische tools om breuken te voorkomen, inclusief her-synchronisatie na batterijwissel.',
    keywords: ['autosleutel batterij vervangen', 'sleutelbatterij bijna leeg', 'Panasonic CR2032 knoopcel', 'Duracell autosleutel batterij', 'Varta knoopcellen'],
  },
  'autosleutels-repareren': {
    name: 'Autosleutels Repareren',
    chips: 'SMD tactile switches, transponder spoelen (coils) en contactslot emulators',
    equipment: 'SMD soldeerstation, hete lucht rework station, microscoop en frequentietesters',
    method: 'ultrasone reiniging van printplaten bij waterschade en microsolderen van defecte contacten, knoppen en transponderspoelen onder de microscoop.',
    keywords: ['autosleutel reparatie', 'sleutelbehuizing vervangen', 'knoppen repareren autosleutel', 'contactslot repareren', 'Mercedes EIS ELV reparatie'],
  },
};

function getPillarKey(serviceSlug: string): string {
  if (['autodeur-openen', 'sleutel-in-auto', 'deur-dichtgevallen', 'kofferbak-openen', 'sleutel-afgebroken-in-slot'].includes(serviceSlug)) {
    return 'autodeur-openen';
  }
  if (['sleutel-bijmaken', 'transponder-programmeren', 'afstandsbediening-bijmaken', 'smart-key-programmeren', 'reservesleutel-maken'].includes(serviceSlug)) {
    return 'sleutel-bijmaken';
  }
  if (['autosleutel-kwijt', 'noodopening-auto', 'alle-sleutels-kwijt-auto'].includes(serviceSlug)) {
    return 'autosleutel-kwijt';
  }
  if (serviceSlug === 'batterij-vervangen') {
    return 'batterij-vervangen';
  }
  if (['autosleutels-repareren', 'behuizing-vervangen', 'knoppen-repareren', 'contactslot-reparatie'].includes(serviceSlug)) {
    return 'autosleutels-repareren';
  }
  return 'sleutel-bijmaken'; // default
}

function getPillarDetails(serviceSlug: string): PillarDetail {
  const key = getPillarKey(serviceSlug);
  return PILLAR_DETAILS[key] || PILLAR_DETAILS['sleutel-bijmaken'];
}

// Helper for stable hashing
function getStableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Unique Content Generators ──────────────────────────────────────────────
function cityUniqueIntro(service: Service, city: City, localDetails: CityDetail): string {
  const hash = getStableHash(city.slug + '-' + service.slug);
  const travelTime = city.travelTime;
  const cityName = city.city;
  const neighborhoods = localDetails.neighborhoods.slice(0, 3).join(', ') + ' en ' + localDetails.neighborhoods[3];
  const highway = localDetails.highway;

  const templates = [
    `Heeft u met spoed een specialist nodig voor ${service.title.toLowerCase()} in ${cityName}? Onze mobiele autosleutelservice is snel ter plaatse. Met een gemiddelde reactietijd van ${travelTime} zijn onze technici direct bij u in ${neighborhoods} en de rest van de gemeente ${cityName}. Via de nabijgelegen ${highway} rijdt onze volledig uitgeruste servicebus direct naar uw locatie om u weer op weg te helpen.`,
    `Voor ${service.title.toLowerCase()} in de regio ${cityName} hoeft u uw auto niet te laten wegslepen naar een dure merkdealer. Wij komen met onze rijdende werkplaats direct naar uw locatie. Of u nu in ${neighborhoods} staat of ergens anders in ${cityName}, wij zijn gemiddeld binnen ${travelTime} ter plaatse. Onze ervaren monteurs lossen het probleem direct schadevrij voor u op.`,
    `Bent u gestrand in ${cityName} en heeft u professionele hulp nodig bij ${service.title.toLowerCase()}? Onze gecertificeerde autosleutelspecialisten bedienen de gehele regio. Dankzij onze strategische routes rondom ${cityName} en de ${highway} garanderen wij een snelle aankomsttijd van gemiddeld ${travelTime}, ook in wijken zoals ${neighborhoods}. Wij bieden snelle en vakkundige hulp ter plaatse.`
  ];
  return templates[hash % templates.length];
}

function generateServiceParagraphs(service: Service, city: City, localDetails: CityDetail, pillar: PillarDetail) {
  const hash = getStableHash(city.slug + '-' + service.slug);
  const travelTime = city.travelTime;
  const cityName = city.city;
  const neighborhoods = localDetails.neighborhoods.slice(0, 3).join(', ') + ' en ' + localDetails.neighborhoods[3];
  const highway = localDetails.highway;
  const landmark = localDetails.landmarks[hash % localDetails.landmarks.length];
  const postcode = localDetails.postcodes;
  const equipment = pillar.equipment;
  const chips = pillar.chips;
  const method = pillar.method;

  let p1 = cityUniqueIntro(service, city, localDetails);
  let p2 = '';
  let p3 = `Bij het uitvoeren van deze service in ${cityName} maken wij uitsluitend gebruik van professionele apparatuur van dealer-niveau. Afhankelijk van uw autotype zetten we programmeertools in zoals ${equipment} en inleren we transponder chips waaronder ${chips}. Onze werkwijze is ${method} Omdat wij 100% overtuigd zijn van de kwaliteit van onze materialen en programmering, ontvangt u standaard 12 maanden garantie op alle geleverde elektronica, transponders en behuizingen.`;
  let p4 = '';

  const pKey = getPillarKey(service.slug);
  if (pKey === 'autodeur-openen') {
    p2 = `Stelt u zich voor: u staat geparkeerd bij ${landmark} in postcodegebied ${postcode} en ontdekt dat uw sleutels nog in de auto liggen, terwijl de deuren in het slot zijn gevallen. Dit is een veelvoorkomend scenario in ${cityName}. In plaats van een ruit in te slaan of schade te veroorzaken aan de lak of rubbers van uw portier, roept u onze hulp in. Onze technicus gebruikt geavanceerde methoden en speciaal gereedschap om uw autodeur schadevrij te openen, zodat u binnen mum van tijd weer bij uw spullen kunt.`;
  } else if (pKey === 'sleutel-bijmaken') {
    p2 = `Het laten bijmaken van een reservesleutel is een verstandige investering om situaties zoals een buitensluiting te voorkomen. Woont of werkt u in de buurt van ${landmark} in ${cityName} (${postcode})? Wij komen gewoon bij u aan huis of op het werk langs. Terwijl u geniet van een kop koffie, snijden en programmeren wij een gloednieuwe sleutel in onze mobiele werkplaats. Dit voorkomt dat u uw auto dayslang kwijt bent bij de dealer en bespaart u aanzienlijk in de kosten.`;
  } else if (pKey === 'autosleutel-kwijt') {
    p2 = `Het verliezen van al uw autosleutels is een stressvolle situatie, zeker als uw voertuig op een drukke locatie staat zoals bij ${landmark} (${postcode}). Dealers adviseren vaak om de auto te laten wegslepen, wat extra kosten en gedoe met zich meebrengt. Onze mobiele service lost dit op locatie in ${cityName} op. Wij openen de auto schadevrij en schrijven direct een nieuwe sleutel in de startonderbreker van de auto, zodat u direct weer kunt rijden.`;
  } else if (pKey === 'batterij-vervangen') {
    p2 = `Als u een waarschuwing krijgt dat uw sleutelbatterij zwak is, is het raadzaam deze direct te vervangen om te voorkomen dat u niet meer kunt starten bij bijvoorbeeld ${landmark} (${postcode}). Voor een vaste prijs van €15 tot €20 komen wij naar u toe in ${cityName} om een hoogwaardige batterij te plaatsen. We testen direct de signaalsterkte en voeren indien nodig een her-synchronisatie uit.`;
  } else if (pKey === 'autosleutels-repareren') {
    p2 = `Een knop die niet meer reageert of een behuizing die kapot is gegaan na een val bij ${landmark} in ${cityName} (${postcode}) hoeft niet direct te betekenen dat u een dure nieuwe sleutel moet kopen. Onze specialisten voeren precisiereparaties en behuizingswissels uit ter plaatse. Dit bespaart u geld en zorgt ervoor dat uw vertrouwde sleutel weer jaren meegaat.`;
  } else {
    p2 = `Met de toenemende autodiefstallen door relay attacks, bijvoorbeeld rondom drukke gebieden zoals ${landmark} (${postcode}), is extra beveiliging cruciaal. Wij installeren de geavanceerde Ghost Immobiliser direct bij u op de oprit in ${cityName}. Dit CAN-bus startonderbrekingssysteem is onzichtbaar voor dieven en zorgt ervoor dat uw auto niet kan worden gestart zonder de juiste PIN-code, zelfs niet als de originele sleutel is gekopieerd.`;
  }

  if (service.slug === 'batterij-vervangen') {
    p4 = `Voor het vervangen van de batterij van uw autosleutel hanteren we een vaste all-in prijs van slechts €15 tot €20, inclusief montage ter plaatse in ${cityName}. Dit is inclusief premium batterijen (Duracell, Panasonic of Varta) en een gratis signaal- en functietest. Na afloop ontvangt u een officiële factuur. Heeft u direct hulp nodig of wilt u uw batterij laten vervangen? Bel ons op ${SITE_CONFIG.phone} of stuur direct een WhatsApp bericht.`;
  } else {
    p4 = `Bij Autosleutel24 hanteren we transparante tarieven die vooraf met u worden afgestemd, zodat u achteraf nooit voor verrassingen komt te staan. Onze service in ${cityName} is gemiddeld 30% tot 50% voordeliger dan de officiële merkdealer, en u bespaart bovonden op sleepkosten omdat wij naar u toe komen. Na afloop ontvangt u een officiële, verzekeringsklare factuur. Heeft u direct ${service.title.toLowerCase()} nodig of wilt u advies? Bel ons direct op ${SITE_CONFIG.phone} of stuur een bericht via WhatsApp om een monteur in ${cityName} in te plannen.`;
  }

  return { p1, p2, p3, p4 };
}

function cityUniqueFAQ(service: Service, city: City, localDetails: CityDetail, pillar: PillarDetail): { q: string; a: string }[] {
  const cityName = city.city;
  const travelTime = city.travelTime;
  const neighborhoods = localDetails.neighborhoods.slice(0, 3).join(', ') + ' en ' + localDetails.neighborhoods[3];
  const postcodes = localDetails.postcodes;
  const equipment = pillar.equipment;

  let costAnswer = '';
  if (service.slug === 'batterij-vervangen') {
    costAnswer = `Voor het vervangen van de batterij van uw autosleutel hanteren we een vaste all-in prijs van €15 tot €20, inclusief montage ter plaatse in ${cityName}. Dit is aanzienlijk voordeliger dan de merkdealer en voorkomt dat u naar de werkplaats moet rijden.`;
  } else {
    costAnswer = `Voor ${service.title.toLowerCase()} hanteren we scherpe tarieven: ${service.priceFrom ? service.priceFrom.toLowerCase() : 'vanaf €95'}. Dit is gemiddeld 30% tot 50% goedkoper dan de dealer in ${cityName}. Aangezien we met onze rijdende werkplaats naar uw locatie toe komen, bespaart u bovendien volledig op sleepkosten.`;
  }

  return [
    {
      q: `Kan ik een autosleutel bijmaken zonder de originele in ${cityName}?`,
      a: `Ja. Wij hebben apparatuur om een nieuwe sleutel te genereren op basis van het contactslot of het immobilizer systeem ter plaatse in ${cityName}. Dit geldt voor de meeste merken vanaf bouwjaar 1995.`,
    },
    {
      q: `Hoe snel bent u bij mij in ${cityName}?`,
      a: `Onze mobiele autosleutelservice is stand-by in de regio. Gemiddeld zijn we binnen ${travelTime} op uw locatie in ${cityName}, inclusief wijken als ${neighborhoods}. Zodra u telefonisch of via WhatsApp contact met ons opneemt, vertrekt de dichtstbijzijnde technicus direct.`,
    },
    {
      q: `Wat kost ${service.title.toLowerCase()} in ${cityName} en hoe verhoudt dit zich tot de dealer?`,
      a: `${costAnswer} U ontvangt na afloop direct een officiële, verzekeringsklare factuur die u kunt indienen bij uw verzekeraar (indien u WA+ of all-risk verzekerd bent met diefstaldekking).`,
    },
    {
      q: `Welke gebieden en postcodes in ${cityName} bestrijkt u?`,
      a: `Wij bestrijken alle postcodes in de regio en de gemeente ${cityName} (waaronder ${postcodes}). Onze technicus komt naar alle wijken en sub-regio's, waaronder ${localDetails.neighborhoods.join(', ')}.`,
    },
    {
      q: `Wordt mijn auto schadevrij geopend of bewerkt?`,
      a: `Ja, wij garanderen een 100% schadevrije behandeling. Wij maken gebruik van professionele bypass tools en lockpicks (zoals Lishi laser picks) en apparatuur zoals de ${equipment} om uw autodeur schadevrij te openen en sleutels direct via de OBD-poort te programmeren. Er worden geen ruiten ingeslagen of krassen op uw lak achtergelaten.`,
    },
    {
      q: `Krijg ik garantie op de geleverde sleutels en elektronica?`,
      a: `Zeker. Bij Autosleutel24 krijgt u standaard 12 maanden volledige garantie op de werking van de transponder, de printplaat van de afstandsbediening, de behuizing en de uitgevoerde programmering op uw boordcomputer.`,
    },
  ];
}

function generateBulletList(service: Service, city: City, localDetails: CityDetail): { strong: string; text: string }[] {
  const cityName = city.city;
  const pKey = getPillarKey(service.slug);

  if (pKey === 'autodeur-openen') {
    return [
      { strong: 'Sleutel in auto vergeten:', text: `U heeft de sleutels per ongeluk in de auto laten liggen en de deuren zitten op slot.` },
      { strong: 'Deur dichtgevallen:', text: `Het portier is dichtgevallen met de sleutel in het contactslot of op de bijrijdersstoel.` },
      { strong: 'Kofferbak afgesloten:', text: `Uw sleutel ligt in de kofferbak van de auto en deze is automatisch vergrendeld.` },
      { strong: 'Sleutel afgebroken:', text: `De sleutelbaard is afgebroken in het deurslot of contactslot van uw auto.` },
      { strong: 'Geen reservesleutel:', text: `U wilt schadevrije toegang tot uw auto om erger te voorkomen.` }
    ];
  }
  if (pKey === 'sleutel-bijmaken') {
    return [
      { strong: 'Preventie:', text: `U heeft nog maar één werkende sleutel en wilt een reserve om buitensluiting in ${cityName} te voorkomen.` },
      { strong: 'Autosleutel kwijt:', text: `Uw enige sleutel is verloren. Wij maken direct een nieuwe smart key of transponder sleutel ter plaatse.` },
      { strong: 'Sleutel afgebroken:', text: `De sleutel is afgebroken. Wij extraheren de resten en snijden een nieuwe sleutelbaard.` },
      { strong: 'Sleutel gestolen:', text: `Wij programmeren een nieuwe sleutel en deprogrammeren de gestolen sleutel direct.` },
      { strong: 'Reservesleutel:', text: `Een extra sleutel voor uw partner, kinderen of werknemers tegen een gereduceerd tarief.` }
    ];
  }
  if (pKey === 'autosleutel-kwijt') {
    return [
      { strong: 'Alle sleutels kwijt:', text: `U heeft geen enkele werkende sleutel meer. Wij lossen dit op locatie in ${cityName} voor u op.` },
      { strong: 'OBD programmering:', text: `Direct programmeren van een nieuwe transponder op de boordcomputer.` },
      { strong: 'Verloren sleutels blokkeren:', text: `We wissen alle oude sleutels uit de boordcomputer ter voorkoming van diefstal.` },
      { strong: 'CNC frezen ter plaatse:', text: `Het slijpen van een nieuwe fysieke sleutelbaard op basis van uw slotcilinder.` },
      { strong: 'Eigendomscontrole:', text: `Altijd een strikte identiteitscontrole om de veiligheid van uw voertuig te waarborgen.` }
    ];
  }
  if (pKey === 'batterij-vervangen') {
    return [
      { strong: 'Dashboard melding:', text: `Uw auto geeft de melding dat de sleutelbatterij bijna leeg is.` },
      { strong: 'Slecht bereik:', text: `De zender reageert pas van heel dichtbij of na herhaaldelijk drukken.` },
      { strong: 'Preventieve wissel:', text: `Voorkom dat u onverwacht gestrand raakt in ${cityName} met een niet-werkende sleutel.` },
      { strong: 'Signaaltest:', text: `Onze monteur controleert de zendfrequentie en signaalsterkte voor en na de wissel.` },
      { strong: 'A-merk batterijen:', text: `Wij gebruiken uitsluitend Panasonic, Duracell en Varta knoopcellen.` }
    ];
  }
  if (pKey === 'autosleutels-repareren') {
    return [
      { strong: 'Knoppen defect:', text: `De drukknoppen reageren niet meer of de soldeereilanden op de printplaat zijn losgelaten.` },
      { strong: 'Behuizing versleten:', text: `De plastic behuizing is gescheurd of de sleutelbaard klapt niet meer uit.` },
      { strong: 'Waterschade:', text: `De sleutel is nat geworden. Wij reinigen de printplaat ultrasoon op locatie.` },
      { strong: 'Contactslot storing:', text: `De sleutel draait niet meer om of het elektronische stuurslot (ELV) reageert niet.` },
      { strong: 'SMD micro-solderen:', text: `Herstel van knoppen en transponderspoelen onder de microscoop.` }
    ];
  }
  return [
    { strong: 'Relay attack preventie:', text: `Bescherm uw keyless entry sleutel tegen signaalverlenging door autodieven.` },
    { strong: 'Ghost Immobiliser:', text: `Professionele CAN-bus startonderbreker die starten voorkomt zonder PIN-code.` },
    { strong: 'Alarm storing:', text: `Uitlezen en oplossen van storingen aan originele of aftermarket alarmsystemen.` },
    { strong: 'SCM certificering:', text: `Inbouw van goedgekeurde beveiligingsklassen conform uw polisvoorwaarden.` },
    { strong: 'Onzichtbare montage:', text: `Geen doorgeknipte draden en volledige integratie in de kabelboom op locatie.` }
  ];
}

function generatePricingTable(service: Service) {
  const pKey = getPillarKey(service.slug);
  if (pKey === 'batterij-vervangen') {
    return {
      headers: ['Batterij Type', 'Sleutel Model', 'Prijs', 'Tijdsduur'],
      rows: [
        ['Lithium CR2032', 'Volkswagen, BMW, Opel, Ford', '€15 - €20', '5 min'],
        ['Lithium CR2025', 'Mercedes, Renault, Peugeot', '€15 - €20', '5 min'],
        ['Lithium CR2450', 'BMW G-serie, Volvo smart keys', '€15 - €20', '5 min'],
        ['Lithium CR1620 / CR1616', 'Toyota, Lexus, Honda keyless', '€15 - €20', '5 min'],
        ['LIR2025 oplaadbare accu', 'BMW E-serie (gesoldeerde accu)', 'Vanaf €49', '20 min']
      ]
    };
  }
  return {
    headers: ['Sleutel Type', 'Merk / Model', 'Prijs', 'Tijdsduur'],
    rows: [
      ['Standaard sleutel (met transponder chip)', 'Oudere auto\'s, basis modellen', '€149 - €249', '15 min'],
      ['Klapsleutel / Flip Key', 'VW, Toyota, Ford, Opel, etc.', '€199 - €349', '20-30 min'],
      ['Smart Key / Keyless', 'Proximity sleutel, Push-to-start', '€299 - €499', '30-45 min'],
      ['Extra reserve sleutel (2e, 3e)', 'Alle merken', '€75 per stuk', '10 min per sleutel']
    ]
  };
}

function generatePricingCallout(service: Service, city: City) {
  if (service.slug === 'batterij-vervangen') {
    return `<strong>Vaste prijsgarantie:</strong> Wij vervangen uw sleutelbatterij op locatie in ${city.city} voor een vaste all-in prijs van €15 tot €20. Dit is inclusief signaal- en frequentietest.`;
  }
  return `<strong>Dealer prijsvergelijking:</strong> Een dealer rekent al snel €250 tot €500 voor een nieuwe sleutel plus inleerkosten. Wij doen dit gemiddeld 30% tot 50% goedkoper direct ter plaatse in ${city.city}, zonder sleepkosten.`;
}

function generateSteps(service: Service, city: City) {
  const pKey = getPillarKey(service.slug);
  if (pKey === 'autodeur-openen') {
    return [
      { title: 'Bel of WhatsApp ons', text: `Geef uw exacte locatie in ${city.city} en uw automodel door. Wij geven u direct een vaste prijs vooraf.` },
      { title: 'Monteur komt naar u toe', text: `Onze mobiele specialist rijdt direct naar u toe en is gemiddeld binnen ${city.travelTime} ter plaatse.` },
      { title: 'Identiteitscontrole & Openen', text: `Na een snelle controle openen we uw autodeur schadevrij met professionele lockpick tools.` },
      { title: 'Betaling & Factuur', text: `U test het slot en rekent ter plaatse af. U ontvangt direct een verzekeringsklare factuur.` }
    ];
  }
  if (pKey === 'autosleutel-kwijt') {
    return [
      { title: 'Meld uw autogegevens', text: `Geef uw locatie in ${city.city}, kenteken en merk door. Wij geven direct een scherpe prijsopgave.` },
      { title: 'Monteur komt ter plaatse', text: `Wij rijden met onze mobiele werkplaats direct naar uw locatie in ${city.city} (binnen ${city.travelTime}).` },
      { title: 'Sleutel maken & programmeren', text: `We openen de auto schadevrij en snijden en inleren een nieuwe transponder ter plaatse.` },
      { title: 'Oude sleutels wissen', text: `Wij wissen de verloren sleutels uit de boordcomputer en leveren uw nieuwe sleutel met 12 maanden garantie.` }
    ];
  }
  if (pKey === 'batterij-vervangen') {
    return [
      { title: 'Neem contact met ons op', text: `Bel of stuur een WhatsApp bericht om een afspraak in te plannen bij u op locatie in ${city.city}.` },
      { title: 'Monteur komt naar u toe', text: `Onze specialist komt binnen de afgesproken tijd naar uw locatie met de juiste batterijen.` },
      { title: 'Vervanging & Signaaltest', text: `We openen de behuizing voorzichtig, plaatsen de nieuwe batterij en meten de signaalsterkte.` },
      { title: 'Testen en Garantie', text: `U test de sleutel op uw auto. U ontvangt 12 maanden garantie op de batterijspanning.` }
    ];
  }
  if (pKey === 'autosleutels-repareren') {
    return [
      { title: 'Leg het probleem uit', text: `Bel of stuur een foto via WhatsApp van uw defecte sleutel om de reparatiemogelijkheden te bespreken.` },
      { title: 'Wij komen naar uw locatie', text: `Onze monteur komt met een mobiele werkplaats naar u toe in ${city.city} (gemiddeld binnen ${city.travelTime}).` },
      { title: 'Microsolderen & Testen', text: `We repareren printplaten, vervangen behuizingen of drukknoppen en meten de sleutel door.` },
      { title: 'Garantie & Oplevering', text: `U test uw herstelde sleutel. Wij leveren deze op met 12 maanden garantie en een factuur.` }
    ];
  }
  return [
    { title: 'Bel of WhatsApp ons', text: `Geef uw automerk, model, bouwjaar en locatie door. Wij geven u direct een prijsindicatie.` },
    { title: 'Monteur komt naar u toe', text: `Wij komen binnen de afgesproken tijd naar u toe in ${city.city} (gemiddeld binnen ${city.travelTime}).` },
    { title: 'Sleutel maken ter plaatse', text: `Wij snijden the sleutelbaard mechanisch en programmeren de transponder via de OBD-poort.` },
    { title: 'Testen en Garantie', text: `U test de nieuwe sleutel op de auto. U krijgt direct 12 maanden garantie en uw factuur.` }
  ];
}

function generateDynamicReviews(service: Service, city: City, localDetails: CityDetail): { text: string; name: string; city: string; car: string }[] {
  const hash = getStableHash(city.slug + '-' + service.slug);
  const cityName = city.city;
  const serviceTitle = service.title.toLowerCase();

  const templates = [
    {
      text: `Ik had met spoed hulp nodig voor ${serviceTitle} bij mijn auto in ${cityName}. De monteur was er snel, handelde erg professioneel en loste het binnen een half uur op. Uitstekende service!`,
      name: 'Jeroen van Dijk',
      city: cityName,
      car: 'Volkswagen Golf'
    },
    {
      text: `Top service! Goedkoper dan de merkdealer in ${cityName} en ze kwamen gewoon naar mijn werk in de wijk ${localDetails.neighborhoods[hash % localDetails.neighborhoods.length]} om de sleutel te programmeren. Zeker een aanrader.`,
      name: 'Chantal de Groot',
      city: cityName,
      car: 'Peugeot 208'
    },
    {
      text: `Sleutel afgebroken bij ${localDetails.landmarks[hash % localDetails.landmarks.length]} in ${cityName}. Gelukkig kon Autosleutel24 binnen ${city.travelTime} ter plaatse zijn om de deuren schadevrij te openen en de sleutel te maken. Geweldig geholpen!`,
      name: 'Mark van Veen',
      city: cityName,
      car: 'BMW 3-Serie'
    },
    {
      text: `Zeer deskundig en vriendelijk geholpen met ${serviceTitle} voor onze auto in ${cityName}. Snel ter plaatse en een stuk goedkoper dan de dealer. En we kregen direct 12 maanden garantie op de transponder.`,
      name: 'Thomas Visser',
      city: cityName,
      car: 'Audi A4'
    },
    {
      text: `Buitengesloten bij ${localDetails.landmarks[(hash + 1) % localDetails.landmarks.length]} in ${cityName} met de sleutels nog in de kofferbak. Binnen een kwartier schadevrij geopend door de monteur. Bedankt!`,
      name: 'Sandra Bakker',
      city: cityName,
      car: 'Ford Focus'
    },
    {
      text: `Onze reserve smart key was defect geraakt in ${cityName}. Ter plekke ingeleerd en getest. Perfect werkende afstandsbediening met een prima zendbereik. Klasse werk!`,
      name: 'Dennis Hendriks',
      city: cityName,
      car: 'Mercedes C-Klasse'
    }
  ];

  const idx1 = hash % templates.length;
  const idx2 = (hash + 1) % templates.length;
  const idx3 = (hash + 2) % templates.length;

  return [
    templates[idx1],
    templates[idx2],
    templates[idx3]
  ];
}

// ── Component ──────────────────────────────────────────────────────────────
export function CityServiceView({
  citySlug,
  serviceSlug,
  city,
  service,
}: {
  citySlug: string;
  serviceSlug: string;
  city: City;
  service: Service;
}) {
  const localDetails = getCityDetails(city);
  const pillarDetails = getPillarDetails(serviceSlug);

  const uniqueIntro = cityUniqueIntro(service, city, localDetails);
  const uniqueFAQ = cityUniqueFAQ(service, city, localDetails, pillarDetails);
  const bulletItems = generateBulletList(service, city, localDetails);
  const pricingTableData = generatePricingTable(service);
  const pricingCalloutText = generatePricingCallout(service, city);
  const stepsData = generateSteps(service, city);
  const dynamicReviews = generateDynamicReviews(service, city, localDetails);

  const isOpening = ['autodeur-openen', 'sleutel-in-auto', 'deur-dichtgevallen', 'kofferbak-openen', 'sleutel-afgebroken-in-slot', 'noodopening-auto'].includes(serviceSlug);

  const trustItems = [
    '24/7 Mobiele Service',
    `Binnen ${city.travelTime} in ${city.city}`,
    isOpening ? '100% Schadevrij Openen' : (service.slug === 'batterij-vervangen' ? 'Vaste prijs €15 - €20' : `${service.priceFrom || 'Vanaf €95'}`),
    '12 Maanden Garantie',
    'KVK Geregistreerd',
    'Verzekerd & Gecertificeerd'
  ];

  const popularBrands = [
    { name: 'Volkswagen', slug: 'volkswagen', desc: 'Golf, Polo, Tiguan, Transporter (MQB platform)' },
    { name: 'BMW', slug: 'bmw', desc: '1-serie, 3-serie, 5-serie, X3, X5 (CAS3/CAS4/FEM/BDC)' },
    { name: 'Mercedes-Benz', slug: 'mercedes', desc: 'A-Klasse, C-Klasse, E-Klasse, Sprinter (EIS/ESL, FBS3/FBS4)' },
    { name: 'Audi', slug: 'audi', desc: 'A3, A4, A6, Q5, Q7 (MLB platform)' },
    { name: 'Ford', slug: 'ford', desc: 'Focus, Fiesta, Transit, Kuga (PAT2/PAT3/PAT4)' },
    { name: 'Toyota', slug: 'toyota', desc: 'Corolla, Yaris, RAV4, Land Cruiser (G-chip/H-chip)' },
  ];

  // Related services (exclude current)
  const relatedServices = DIENSTEN.filter(s => s.slug !== serviceSlug).slice(0, 5);

  // === Schema ================================================================
  const locksmithSchema = {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    '@id': `${SITE_CONFIG.domain}/steden/${citySlug}/${serviceSlug}#locksmith`,
    name: `${service.title} ${city.city} — ${SITE_CONFIG.name}`,
    url: `${SITE_CONFIG.domain}/steden/${citySlug}/${serviceSlug}`,
    telephone: SITE_CONFIG.phoneTel,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.city,
      addressRegion: city.region,
      addressCountry: city.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: city.geo.lat, longitude: city.geo.lng },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(SITE_CONFIG.rating),
      reviewCount: parseInt(SITE_CONFIG.reviewCount, 10),
      bestRating: 5,
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: SITE_CONFIG.serviceArea.lat,
        longitude: SITE_CONFIG.serviceArea.lng,
      },
      geoRadius: SITE_CONFIG.serviceArea.radiusMeters,
    },
    parentOrganization: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      url: SITE_CONFIG.domain,
    },
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.title} ${city.city}`,
    provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel, url: SITE_CONFIG.domain },
    areaServed: { '@type': 'City', name: city.city },
    description: `${service.title} in ${city.city}. Mobiel aan huis. ${city.travelTime} reactietijd. ${service.metaDesc}`,
    ...(service.priceFrom && { offers: { '@type': 'Offer', priceCurrency: 'EUR', description: service.priceFrom } }),
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${service.title} in ${city.city}`,
    description: uniqueIntro,
    step: service.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: uniqueFAQ.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Steden', item: `${SITE_CONFIG.domain}/steden` },
      { '@type': 'ListItem', position: 3, name: city.city, item: `${SITE_CONFIG.domain}/steden/${citySlug}` },
      { '@type': 'ListItem', position: 4, name: service.title, item: `${SITE_CONFIG.domain}/steden/${citySlug}/${serviceSlug}` },
    ],
  };

  // ============================================================================
  return (
    <>
      <Script id={`ls-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(locksmithSchema) }} />
      <Script id={`svc-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id={`howto-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <Script id={`faq-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`bc-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main>
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>
              <Link href="/steden">Steden</Link> <span>/</span>
              <Link href={`/steden/${citySlug}`}>{city.city}</Link> <span>/</span>
              <span>{service.title}</span>
            </nav>

            <h1>{service.title} — Mobiel Ter Plaatse in {city.city}</h1>

            <p className={styles.heroLead}>{uniqueIntro}</p>

            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id={`csvc-${citySlug}-${serviceSlug}-phone`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                </svg>
                Bel: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id={`csvc-${citySlug}-${serviceSlug}-wa`}>WhatsApp</a>
              <Link href="/contact" className={styles.btnOutline} id={`csvc-${citySlug}-${serviceSlug}-form`}>Direct Offerte</Link>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ───────────────────────────────────────────── */}
        <div className={styles.trustBar}>
          <div className={styles.trustBarInner}>
            {trustItems.map((item, idx) => (
              <div key={idx} className={styles.trustItem}>
                <span className={styles.trustIcon}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONTENT SECTION ─────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>

                {/* Section 1: Wanneer Heeft U Dienst Nodig */}
                <div>
                  <h2>Wanneer Heeft U {service.title} Nodig?</h2>
                  <p>
                    Of u nu bent buitengesloten, een reservesleutel wilt of uw autosleutel defect is geraakt; bij Autosleutel24 lossen wij dit snel en schadevrij voor u op locatie op.
                  </p>
                  <ul className={styles.bulletList}>
                    {bulletItems.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.strong}</strong> {item.text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Prijzen Tabel of Openingsmethoden & Scenarios */}
                {isOpening ? (
                  <div>
                    <h2>Schadevrije Openingsmethoden in {city.city}</h2>
                    <p>
                      Onze monteurs zijn uitgerust met de modernste gereedschappen om uw autodeur schadevrij te openen. Wij selecteren altijd de meest veilige methode voor uw specifieke voertuig:
                    </p>
                    <div className={styles.tableWrapper} style={{ marginBottom: '2.5rem' }}>
                      <table className={styles.pricingTable}>
                        <thead>
                          <tr>
                            <th>Methode</th>
                            <th>Wanneer Gebruikt</th>
                            <th>Veiligheid</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Air Wedge + Long Reach Tool</strong></td>
                            <td>Standaard bij 95% van de auto's</td>
                            <td>100% schadevrij</td>
                          </tr>
                          <tr>
                            <td><strong>Decoder / Turbo Decoder</strong></td>
                            <td>Slotcode uitlezen bij complexe sloten</td>
                            <td>Geen force, geen beschadiging</td>
                          </tr>
                          <tr>
                            <td><strong>Slim Jim</strong></td>
                            <td>Alleen bij oudere auto's (pre-2000)</td>
                            <td>Vakkundig, geen krassen</td>
                          </tr>
                          <tr>
                            <td><strong>Lishi Pick</strong></td>
                            <td>Bij sleutel afgebroken in slot / lockpicking</td>
                            <td>Extractie en opening zonder boren</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h2>Veelvoorkomende Noodsituaties in {city.city}</h2>
                    <p>
                      Wij lossen dagelijks diverse buitensluitingen op in {city.city}. Hieronder vindt u een overzicht van situaties en onze gemiddelde reactietijd ter plaatse:
                    </p>
                    <div className={styles.tableWrapper}>
                      <table className={styles.pricingTable}>
                        <thead>
                          <tr>
                            <th>Situatie in {city.city}</th>
                            <th>Frequentie</th>
                            <th>Gemiddelde Reactietijd</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Sleutel op stoel, deur dichtgevallen</td>
                            <td>Dagelijks</td>
                            <td>15-20 min</td>
                          </tr>
                          <tr>
                            <td>Sleutel in kofferbak, kofferbak dicht</td>
                            <td>3x per week</td>
                            <td>15-20 min</td>
                          </tr>
                          <tr>
                            <td>Kind(eren) heeft op slot-knopje gedrukt</td>
                            <td>2x per week</td>
                            <td>15-20 min</td>
                          </tr>
                          <tr>
                            <td>Afstandsbediening batterij leeg, deur op slot</td>
                            <td>Wekelijks</td>
                            <td>15-20 min</td>
                          </tr>
                          <tr>
                            <td>Sleutel in contact, motor draait, deur op slot</td>
                            <td>Wekelijks</td>
                            <td>15-20 min</td>
                          </tr>
                          <tr>
                            <td>Twee sleutels in auto, beide deuren op slot</td>
                            <td>Maandelijks</td>
                            <td>15-20 min</td>
                          </tr>
                          <tr>
                            <td>Sleutel afgebroken in slot</td>
                            <td>Wekelijks</td>
                            <td>20-30 min</td>
                          </tr>
                          <tr>
                            <td>Sleutel valt uit broekzak bij uitstappen</td>
                            <td>Dagelijks</td>
                            <td>15-20 min</td>
                          </tr>
                          <tr>
                            <td>Auto sluit automatisch af (comfort access storing)</td>
                            <td>Wekelijks</td>
                            <td>15-20 min</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.callout}>
                      <strong>Schadevrije garantie:</strong> Onze technici openen uw voertuig 100% schadevrij. We maken geen krassen op de lak, verbuigen geen deurstijlen en breken geen ruiten.
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2>Wat Kost {service.title} in {city.city}? — Transparante Prijzen</h2>
                    <div className={styles.tableWrapper}>
                      <table className={styles.pricingTable}>
                        <thead>
                          <tr>
                            {pricingTableData.headers.map((h, i) => (
                              <th key={i}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pricingTableData.rows.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row[0]}</td>
                              <td>{row[1]}</td>
                              <td><strong>{row[2]}</strong></td>
                              <td>{row[3]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.callout} dangerouslySetInnerHTML={{ __html: pricingCalloutText }} />
                  </div>
                )}

                {/* Section 3: Hoe Werkt Het */}
                <div>
                  <h2>Hoe Werkt {service.title} bij Autosleutel24?</h2>
                  <ol className={styles.stepList}>
                    {stepsData.map((step, idx) => (
                      <li key={idx} className={styles.stepItem}>
                        <span className={styles.stepNum}>{idx + 1}</span>
                        <div className={styles.stepText}>
                          <strong>{step.title}</strong>
                          {step.text}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Section 4: Welke Merken Bedienen Wij */}
                <div>
                  <h2>Welke Merken Bedienen Wij in {city.city}?</h2>
                  <p>
                    Wij maken en programmeren autosleutels en smart keys voor alle gangbare merken in {city.city}. Onze mobiele programmeerapparatuur ondersteunt:
                  </p>
                  <ul className={styles.bulletList}>
                    {popularBrands.map(b => (
                      <li key={b.slug}>
                        <Link href={`/steden/${citySlug}/${b.slug}-autosleutel-bijmaken`}>
                          {b.name}
                        </Link>
                        {' '}— {b.desc}
                      </li>
                    ))}
                  </ul>
                  <p>
                    <Link href="/merken" style={{ fontWeight: 700, color: '#f97316' }}>Bekijk alle merken die wij bedienen →</Link>
                  </p>
                </div>

                {/* Section 5: Waar Komen Wij */}
                <div>
                  <h2>Waar Komen Wij voor {service.title}?</h2>
                  <p>
                    Onze mobiele bussen rijden dagelijks door de gehele regio van {city.city}. We komen onder andere op locatie in:
                  </p>
                  <ul className={styles.bulletList}>
                    {localDetails.neighborhoods.map((n) => (
                      <li key={n}>
                        <Link href={`/steden/${citySlug}`}>
                          {n}
                        </Link>
                        {` — Mobiele service ter plaatse binnen ${city.travelTime}`}
                      </li>
                    ))}
                  </ul>
                  <p>
                    <Link href="/steden" style={{ fontWeight: 700, color: '#f97316' }}>Bekijk ons volledige werkgebied →</Link>
                  </p>
                </div>

                {/* Section 6: FAQ Accordion */}
                <div>
                  <h2>Veelgestelde Vragen over {service.title} in {city.city}</h2>
                  {uniqueFAQ.map((f, i) => (
                    <details key={i} className={styles.faqItem}>
                      <summary className={styles.faqQuestion}>
                        {f.q}
                        <span className={styles.faqChevron}>+</span>
                      </summary>
                      <p className={styles.faqAnswer}>
                        {f.a}
                      </p>
                    </details>
                  ))}
                </div>

              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Direct Hulp Nodig?</h3>
                  <p>Bel of WhatsApp ons. Wij zijn 24/7 bereikbaar en gemiddeld binnen {city.travelTime} bij u in {city.city}.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id={`csvc-sidebar-${citySlug}-${serviceSlug}-phone`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                    </svg>
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id={`csvc-sidebar-${citySlug}-${serviceSlug}-wa`}>WhatsApp Direct</a>
                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Vaste prijs vooraf', 'Verzekeringsklare factuur', '12 maanden garantie', '24/7 beschikbaar'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ color: '#22c55e', flexShrink: 0 }} aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.ratingCard}>
                  <div className={styles.ratingStars}>★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;{city.reviewQuote}&rdquo;</p>
                  <span className={styles.ratingMeta}>{city.reviewAuthor} — {city.reviewCar}, {city.city}</span>
                  <span className={styles.ratingCount}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</span>
                </div>
              </aside>

            </div>

            {/* Bottom CTA block */}
            <div className={styles.ctaBlock}>
              <h2>{service.title} Nodig? Bel Direct</h2>
              <p>Onze mobiele specialist staat binnen {city.travelTime} bij u in {city.city}. Vaste prijs, geen verrassingen.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id={`csvc-bottom-phone-${citySlug}`}>Bel: {SITE_CONFIG.phone}</a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id={`csvc-bottom-wa-${citySlug}`}>WhatsApp Direct</a>
              </div>
              <span className={styles.microText}>24/7 beschikbaar — ook &apos;s nachts en in het weekend</span>
            </div>

          </div>
        </section>

        {/* ── RELATED BLOGS SECTION ────────────────────────────────── */}
        {(() => {
          const relatedPosts = getRelatedBlogPosts(service.slug);
          if (!relatedPosts || relatedPosts.length === 0) return null;
          return (
            <section className={styles.relatedBlogsSection}>
              <div className={styles.relatedBlogsContainer}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
                  GERELATEERDE KENNIS &amp; ADVIES IN {city.city.toUpperCase()}
                </p>
                <h2 className={styles.relatedBlogsTitle}>
                  Handige artikelen over {service.title}
                </h2>
                <div className={styles.relatedBlogsGrid}>
                  {relatedPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className={styles.blogPostCard}
                      id={`csvc-related-blog-${post.slug}`}
                    >
                      <div className={styles.blogPostMeta}>
                        <span className={styles.blogPostReadTime}>{post.readTime} lezen</span>
                        <span className={styles.blogPostDate}>
                          {new Date(post.publishDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className={styles.blogPostTitle}>{post.title}</h3>
                      <p className={styles.blogPostExcerpt}>{post.excerpt}</p>
                      <span className={styles.blogPostLink}>Lees artikel →</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* ── COMPREHENSIVE SEO GUIDE ARTICLE BLOCK (High Text-to-HTML Ratio) ── */}
        <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
          <div className={styles.container}>
            <div className="seo-article-block" style={{ marginTop: 0 }}>
              <h2>Alles over {service.title} in {city.city} en Omstreken</h2>
              <p>
                Wanneer u te maken krijgt met een defecte autosleutel, een afgebroken sleutelbaard in het portierslot, of als u buitengesloten bent van uw voertuig in {city.city}, telt elke minuut. Veel traditionele autogarages en officiële merkdealers vereisen dat uw auto naar hun werkplaats wordt gesleept. Dit kost niet alleen kostbare tijd, maar brengt ook aanzienlijke takel- en sleepkosten met zich mee. <strong>{SITE_CONFIG.name}</strong> biedt als erkend mobiele autosleutelspecialist een direct alternatief: wij komen 24 uur per dag, 7 dagen per week naar uw locatie in {city.city} toe.
              </p>
              <h3>Hoe werkt onze mobiele {service.title.toLowerCase()} service in {city.city}?</h3>
              <p>
                Dankzij onze volledig ingerichte servicebussen beschikken onze monteurs over exact dezelfde hightech apparatuur als de officiële dealer. Of uw auto nu geparkeerd staat in het centrum van {city.city}, langs de snelweg, of op uw oprit thuis; wij voeren de werkzaamheden direct ter plekke uit.
              </p>
              <ul>
                <li><strong>Diagnose &amp; Identificatie:</strong> Onze monteur start met een grondige diagnose van het slotmechanisme en leest via de OBD2-diagnosepoort de startonderbreker (immobiliser) uit.</li>
                <li><strong>100% Schadevrije Opening &amp; Bewerking:</strong> Met gespecialiseerd Lishi-precisiegereedschap openen of decoderen wij autodeuren zonder enige sporen of krassen achter te laten.</li>
                <li><strong>Ter Plaatse Frezen &amp; Programmeren:</strong> Nieuwe transponderchips en afstandsbedieningen worden direct gesynchroniseerd met de boordcomputer van uw voertuig.</li>
              </ul>
              <h3>Voordeliger dan de dealer met 12 Maanden Garantie</h3>
              <p>
                Doordat wij efficiënt op locatie werken zonder dure showrooms, bent u bij ons gemiddeld <strong>30% tot 50% voordeliger uit</strong> dan bij de officiële merkdealer in {city.city}. Bovendien krijgt u op al onze sleutels, smart keys en reparaties standaard 12 maanden schriftelijke garantie. Veel verzekeraars vergoeden onze facturen volledig onder uw Beperkt Casco of Allrisk autoverzekering.
              </p>
            </div>
          </div>
        </section>

        {/* ── INTERNAL LINKING NETWORK SECTION (Lean HTML) ── */}
        <section style={{ padding: '3.5rem 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div className={styles.container}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.75rem' }}>
              Meer Slotenmaker &amp; Autosleutel Services in {city.city}
            </h2>
            <div className="seo-hub-grid">
              <div>
                <div className="seo-hub-title">Andere Diensten in {city.city}</div>
                <div className="seo-hub-col">
                  {DIENSTEN.filter(s => s.slug !== service.slug).map(s => (
                    <Link key={s.slug} href={`/steden/${city.slug}/${s.slug}`} className="seo-hub-link">
                      {`${s.title} ${city.city} →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">Populaire Automerken in {city.city}</div>
                <div className="seo-hub-col">
                  {BRANDS.slice(0, 16).map(b => (
                    <Link key={b.slug} href={`/steden/${city.slug}/${b.nameSlug}-autosleutel-bijmaken`} className="seo-hub-link">
                      {`${b.name} Autosleutel Bijmaken ${city.city} →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">{service.title} in Andere Steden</div>
                <div className="seo-hub-col">
                  {CITIES.filter(c => c.slug !== city.slug).slice(0, 16).map(c => (
                    <Link key={c.slug} href={`/steden/${c.slug}/${service.slug}`} className="seo-hub-link">
                      {`${service.title} ${c.city} →`}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── REVIEWS SECTION ────────────────────────────────────── */}
        <section className={styles.reviews}>
          <div className={styles.container}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              KLANTBEOORDELINGEN
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              Wat Klanten Zeggen over {service.title} in {city.city}
            </h2>
            <div className={styles.ratingBig}>
              <span className={styles.ratingNum}>4.9</span>
              <div>
                <div className={styles.ratingStarsReview}>★★★★★</div>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5
                </span>
              </div>
            </div>
            <div className={styles.reviewGrid}>
              {dynamicReviews.map((r, i) => (
                <div key={i} className={styles.reviewCardSection}>
                  <div className={styles.ratingStarsReview}>★★★★★</div>
                  <p className={styles.reviewText}>&quot;{r.text}&quot;</p>
                  <div className={styles.reviewMetaSection}>
                    <div className={styles.reviewAvatar}>{r.name[0]}</div>
                    <div>
                      <strong>{r.name}</strong>
                      <span>{r.city} — {r.car}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
