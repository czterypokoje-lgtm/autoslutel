/**
 * German → Dutch for the tool-accessory descriptions.
 *
 * A-Key writes these in German: what the adapter does, which programmer it
 * belongs to, which cars and chips it covers. Throwing that away — which the
 * first pass did — leaves a €272 kit described as "adapter uit het OBDSTAR-
 * programma", and the customer cannot tell whether it does what they need.
 *
 * Word-by-word translation is not an option: 1,194 lines over 2,269 distinct
 * words, and that approach already produced "Werkzeug zur De- en Montage"
 * here once. What this does instead:
 *
 *   1. phrase patterns, longest first — the register is formulaic
 *      ("Unterstützt das Lesen und Schreiben von …", "Kompatibel mit …")
 *   2. a check afterwards: a line that still carries German is *not* shown as
 *      Dutch. It goes under the manufacturer's own text instead, labelled as
 *      German, so nothing is lost and nothing is half-translated.
 *
 * Model names, chip numbers and brands pass through untouched — they are the
 * part a locksmith actually searches for.
 */

/** Longest first: the array order is the replacement order. */
const PHRASES = [
  // openers
  ['Unterstützte Programmiergeräte:', 'Ondersteunde programmeerapparatuur:'],
  ['Unterstützte Kommunikationsprotokolle', 'Ondersteunde communicatieprotocollen'],
  ['Unterstützte Prozessoren:', 'Ondersteunde processors:'],
  ['Unterstützte Fahrzeuge:', 'Ondersteunde voertuigen:'],
  ['Unterstützte Modelle:', 'Ondersteunde modellen:'],
  ['Unterstützte Module einschließlich', 'Ondersteunde modules, waaronder'],
  ['Unterstützte Dashboard-Liste', 'Ondersteunde dashboardlijst'],
  ['Unterstützte Module', 'Ondersteunde modules'],
  ['Unterstützt das Lesen und Schreiben von', 'Ondersteunt het lezen en schrijven van'],
  ['Unterstützt das Lesen und Schreiben bestimmter', 'Ondersteunt het lezen en schrijven van bepaalde'],
  ['Unterstützt das Löten zum Lesen und Schreiben von', 'Ondersteunt solderen voor het lezen en schrijven van'],
  ['Unterstützt die Berechnung des Passworts für', 'Ondersteunt de wachtwoordberekening voor'],
  ['Unterstützt das Hinzufügen von Schlüsseln sowie den', 'Ondersteunt het toevoegen van sleutels en de'],
  ['Unterstützt das Hinzufügen von Schlüsseln', 'Ondersteunt het toevoegen van sleutels'],
  ['Unterstützt eine Vielzahl von', 'Ondersteunt een groot aantal'],
  ['Unterstützt die folgenden', 'Ondersteunt de volgende'],
  ['Unterstützt die', 'Ondersteunt de'],
  ['Unterstützt das', 'Ondersteunt het'],
  ['Unterstützt', 'Ondersteunt'],

  ['Erfordert die Verwendung des', 'Vereist het gebruik van de'],
  ['Erfordert die Verwendung von', 'Vereist het gebruik van'],
  ['Erfordert', 'Vereist'],
  ['Kompatibel mit', 'Compatibel met'],
  ['kompatibel mit', 'compatibel met'],
  ['Produktfunktionen:', 'Productfuncties:'],
  ['Produktfunktionen', 'Productfuncties'],
  ['Funktionen:', 'Functies:'],
  ['Funktionen', 'functies'],
  ['Hinweis:', 'Let op:'],
  ['Lieferumfang:', 'Leveringsomvang:'],
  ['Nicht im Lieferumfang enthalten', 'Niet meegeleverd'],
  ['Im Lieferumfang enthalten', 'Meegeleverd'],
  ['Lieferumfang', 'leveringsomvang'],

  // compounds the first run left standing
  ['Adapter-Komplettset', 'complete adapterset'],
  ['Komplettset', 'complete set'],
  ['dem Auslesen von', 'het uitlezen van'],
  ['Benachrichtigen Sie uns', 'Laat het ons weten'],
  ['Bitte beachten Sie', 'Let op'],
  ['Wenn Sie', 'Als u'],
  ['wenn Sie', 'als u'],
  ['Sie können', 'u kunt'],
  ['Sie müssen', 'u moet'],
  ['Ihrem', 'uw'], ['Ihren', 'uw'], ['Ihre', 'uw'], ['Ihr', 'uw'],
  ['Sie', 'u'],
  ['einem', 'een'], ['einen', 'een'], ['einer', 'een'],
  ['durch', 'door'], ['über', 'over'], ['unter', 'onder'],
  ['nach', 'na'], ['beim', 'bij het'], ['dass', 'dat'],
  ['wenn', 'als'], ['sich', 'zich'], ['bzw.', 'of'],
  ['verfügbar', 'beschikbaar'], ['erhältlich', 'verkrijgbaar'],
  ['benötigt', 'nodig'], ['enthalten', 'inbegrepen'],
  ['weitere', 'verdere'], ['weiteren', 'verdere'],
  ['folgende', 'volgende'], ['folgenden', 'volgende'],
  ['jeweils', 'telkens'], ['bereits', 'reeds'],
  ['möglich', 'mogelijk'], ['notwendig', 'noodzakelijk'],
  ['zusätzlich', 'aanvullend'], ['zusätzliche', 'aanvullende'],
  ['Software', 'software'], ['Update', 'update'], ['Updates', 'updates'],

  // recurring statements
  ['muss separat erworben werden', 'moet apart worden aangeschaft'],
  ['müssen separat erworben werden', 'moeten apart worden aangeschaft'],
  ['separat erhältlich', 'apart verkrijgbaar'],
  ['in Kürze per Update verfügbar', 'binnenkort beschikbaar via een update'],
  ['per Update verfügbar', 'beschikbaar via een update'],
  ['in Entwicklung', 'in ontwikkeling'],
  ['ohne Ausbau von Komponenten', 'zonder demontage van onderdelen'],
  ['ohne Ausbau', 'zonder demontage'],
  ['ohne Löten', 'zonder solderen'],
  ['Kein Löten', 'Geen soldeerwerk'],
  ['sichere Methode', 'veilige methode'],
  ['„Alle Schlüssel verloren“-Szenarien', '"alle sleutels kwijt"-situaties'],
  ['„Alle Schlüssel verloren“', '"alle sleutels kwijt"'],
  ['Alle Schlüssel verloren', 'alle sleutels kwijt'],
  ['Schlüsselprogrammierung', 'sleutelprogrammering'],
  ['Schlüssel hinzufügen', 'sleutel toevoegen'],
  ['Hinzufügen von Schlüsseln', 'toevoegen van sleutels'],
  ['Airbag-Reset', 'airbag-reset'],
  ['Wegfahrsperren-Daten', 'startonderbrekergegevens'],
  ['Wegfahrsperre', 'startonderbreker'],
  ['ab Modelljahr', 'vanaf modeljaar'],
  ['Modelljahr', 'modeljaar'],
  ['wird benötigt', 'is nodig'],
  ['werden benötigt', 'zijn nodig'],
  ['ist erforderlich', 'is vereist'],
  ['sind erforderlich', 'zijn vereist'],
  ['erforderlich', 'vereist'],
  ['Lesen und Schreiben', 'lezen en schrijven'],
  ['Lesen', 'lezen'],
  ['Schreiben', 'schrijven'],
  ['dient dem', 'is bedoeld voor'],
  ['dient zum', 'is bedoeld voor'],
  ['dient zur', 'is bedoeld voor'],
  ['Auslesen von', 'uitlezen van'],
  ['Auslesen', 'uitlezen'],
  ['ausgelesenen Daten', 'uitgelezen gegevens'],
  ['unverschlüsselt', 'onversleuteld'],
  ['verschlüsselter', 'versleutelde'],
  ['Drittanbietern', 'derden'],
  ['verwendet werden', 'worden gebruikt'],
  ['Wird verwendet', 'Wordt gebruikt'],
  ['verwendet', 'gebruikt'],
  ['Verwendung', 'gebruik'],
  ['Fahrzeugkommunikationsprotokollen', 'voertuigcommunicatieprotocollen'],
  ['Kommunikationsprotokolle', 'communicatieprotocollen'],
  ['CAN-Protokolle', 'CAN-protocollen'],
  ['Armaturenbrett', 'instrumentenpaneel'],
  ['Chip-Emulation', 'chip-emulatie'],
  ['Datenerfassung', 'gegevensverzameling'],
  ['Passwortberechnung', 'wachtwoordberekening'],
  ['Berechnung des Passworts', 'berechnung van het wachtwoord'],
  ['Programmiergeräte', 'programmeerapparaten'],
  ['Programmiergerät', 'programmeerapparaat'],
  ['Schlüsselgehäuse', 'sleutelbehuizing'],
  ['Schlüsseln', 'sleutels'],
  ['Schlüssel', 'sleutels'],
  ['Gehäusen', 'behuizingen'],
  ['Gehäuse', 'behuizing'],
  ['Prozessoren', 'processors'],
  ['Fahrzeuge', 'voertuigen'],
  ['Fahrzeug', 'voertuig'],
  ['Modelle', 'modellen'],
  ['Marken', 'merken'],
  ['Daten', 'gegevens'],
  ['Geräten', 'apparaten'],
  ['Geräte', 'apparaten'],
  ['Gerät', 'apparaat'],
  ['Serien', 'series'],
  ['Kabel', 'kabel'],
  ['Werkzeug', 'gereedschap'],
  ['Zubehör', 'accessoire'],
  ['Sockel', 'voet'],
  ['Chip-Sockels', 'chipvoet'],
  ['Löten', 'solderen'],
  ['Lötfrei', 'soldeervrij'],
  ['kontinuierlich', 'doorlopend'],
  ['aktualisiert', 'bijgewerkt'],

  // function words, after every phrase above
  ['einschließlich', 'inclusief'],
  ['darunter', 'waaronder'],
  ['verschiedener', 'verschillende'],
  ['verschiedene', 'verschillende'],
  ['sowie', 'en'],
  ['usw.', 'enz.'],
  ['z. B.', 'bijv.'],
  ['z.B.', 'bijv.'],
  ['u.a.', 'o.a.'],
  ['und', 'en'],
  ['oder', 'of'],
  ['mit', 'met'],
  ['ohne', 'zonder'],
  ['für', 'voor'],
  ['von', 'van'],
  ['bei', 'bij'],
  ['wie', 'zoals'],
  ['nicht', 'niet'],
  ['auch', 'ook'],
  ['alle', 'alle'],
  ['eine', 'een'],
  ['ein', 'een'],
  ['ist', 'is'],
  ['sind', 'zijn'],
  ['kann', 'kan'],
  ['können', 'kunnen'],
  ['wird', 'wordt'],
  ['werden', 'worden'],
  ['liegen', 'zijn'],
  ['vor', 'beschikbaar'],
  ['Der', 'De'],
  ['Die', 'De'],
  ['Das', 'Het'],
  ['der', 'de'],
  ['die', 'de'],
  ['das', 'het'],
  ['den', 'de'],
  ['dem', 'de'],
  ['des', 'van de'],
  ['zum', 'voor'],
  ['zur', 'voor'],
  ['auf', 'op'],
  ['aus', 'uit'],
  ['als', 'als'],
  ['im', 'in'],
];

/** Anything that says a line is still German after the pass. */
const STILL_GERMAN =
  /[äöüß]|\b(der|die|das|den|dem|des|und|für|von|mit|ist|sind|wird|werden|kann|können|nicht|oder|ohne|auch|eine|einer|einem|einen|sich|durch|über|unter|nach|beim|zum|zur|dass|wenn|sowie|bzw|usw|Sie|Ihre|Ihren)\b/i;

/** Replace whole words / phrases only, so model codes survive. */
function applyPhrases(line) {
  let out = line;
  for (const [de, nl] of PHRASES) {
    const escaped = de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // \b does not work before a quote or after a dot, so bound on non-letters.
    const boundary = /^[A-Za-zÄÖÜäöüß]/.test(de) ? '(?<![A-Za-zÄÖÜäöüß])' : '';
    const tail = /[A-Za-zÄÖÜäöüß]$/.test(de) ? '(?![A-Za-zÄÖÜäöüß])' : '';
    out = out.replace(new RegExp(`${boundary}${escaped}${tail}`, 'g'), nl);
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Splits a German description into the lines that translate cleanly and the
 * ones that do not.
 */
export function translateDescription(lines) {
  const dutch = [];
  const german = [];

  for (const line of lines ?? []) {
    const text = line.trim();
    if (!text) continue;

    const translated = applyPhrases(text);
    if (STILL_GERMAN.test(translated)) german.push(text);
    else dutch.push(translated);
  }

  return { dutch, german };
}

/** The facts worth pulling out as their own field. */
export function readFacts(lines) {
  const text = (lines ?? []).join(' ');

  // Translated as well — "X300 Classic G3 und P50" is not Dutch.
  const clean = (value) =>
    value ? applyPhrases(value.trim()).replace(/-Adapters$/, '-adapter') : null;

  const compatible = clean(text.match(/Kompatibel mit ([^.]+)\./i)?.[1]);
  const requires = clean(text.match(/Erfordert die Verwendung (?:des|von) ([^.]+)\./i)?.[1]);

  return { compatible, requires };
}
