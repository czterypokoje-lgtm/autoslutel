import React from 'react';
import { SITE_CONFIG } from '@/config/site.config';

/*
 * Der Ratgebertext der Stadtseite.
 *
 * Drei Fassungen je Abschnitt, ausgewählt über einen stabilen Hash des
 * Stadtnamens. Das ist nicht Tarnung, sondern das Gegenteil: vier Stadtseiten
 * mit identischem Fließtext sind vier Seiten, von denen Google eine indexiert
 * und drei als Dublette behandelt. Stabil heißt: dieselbe Stadt bekommt bei
 * jedem Build denselben Text — eine zufällige Auswahl würde den Inhalt bei
 * jedem Deploy ändern, und das liest Google als instabile Seite.
 *
 * Nichts hier nennt eine Minute, obwohl die Komponente travelTime bekommt:
 * der Wert ist bei vier Partnern meistens ARRIVAL ("kurzfristig"), und ein
 * Satz, der mit "im Schnitt in kurzfristig" endet, liest sich wie eine
 * maschinelle Übersetzung. Darum wird travelTime nur dort eingesetzt, wo der
 * Satz mit beiden Formen funktioniert.
 */

function getStableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const introTemplates = [
  (city: string) => `Willkommen bei ${SITE_CONFIG.name}, Ihrem Ansprechpartner für alles rund um den Autoschlüssel in ${city} und Umgebung. Schlüssel verloren, Funkfernbedienung ohne Funktion oder Schloss defekt? Unsere Partnerbetriebe sind rund um die Uhr erreichbar und kommen zu Ihrem Fahrzeug — mit eigener Fahrzeugdiagnose und eigenem Schlüssellager, nicht mit einem Abschleppwagen.`,
  (city: string) => `Sie brauchen kurzfristig einen neuen Autoschlüssel in ${city}, oder Ihr Fahrzeug lässt sich nicht mehr öffnen? ${SITE_CONFIG.name} ist ein Netzwerk selbstständiger Fachbetriebe, die vollständig mobil arbeiten. Der Partner Ihrer Stadt öffnet das Fahrzeug schadenfrei und kann nahezu jeden Schlüssel vor Ort fräsen und an der Wegfahrsperre anlernen.`,
  (city: string) => `In ${city} und der Region ist ${SITE_CONFIG.name} auf Autoschlüssel und Fahrzeugelektronik spezialisiert. Sie müssen Ihr Fahrzeug nicht zum Vertragshändler abschleppen lassen, wenn kein Schlüssel mehr existiert — unser Partner kommt dorthin, wo das Auto steht, und löst das Problem neben dem Fahrzeug.`,
];

const bodyTemplates1 = [
  (city: string) => `Die mobilen Werkstätten unserer Partner sind in ${city} täglich unterwegs, mit CNC-Fräse und aktueller OBD-Diagnosetechnik an Bord. Damit lassen sich nicht nur klassische Transponderschlüssel anlernen, sondern auch Funkschlüssel und Keyless-Go-Systeme. Ob das Fahrzeug in der Einfahrt steht, auf dem Firmenparkplatz oder am Straßenrand in ${city}: gearbeitet wird vor Ort.`,
  (city: string) => `Wo beim Vertragshändler in ${city} ein Originalschlüssel erst bestellt werden muss, kommt er bei uns aus dem Lager des Partners. Unsere Partner lesen das Steuergerät aus, sperren verlorene und gestohlene Schlüssel sicher aus der Wegfahrsperre und fertigen einen neuen Schlüssel an — in einem Termin statt in zwei.`,
  (city: string) => `Wenn in ${city} der letzte Schlüssel weg ist, ist das kein Routinefall, sondern der, bei dem die meisten Betriebe passen müssen. Unsere Partner sind dafür ausgerüstet: Zugriff auf Wegfahrsperre und Motorsteuergerät, auch wenn die Türen verriegelt sind und das Fahrzeug keinen Schlüssel mehr kennt. Abschleppen und Händlertermin entfallen damit beide.`,
];

const bodyTemplates2 = [
  (city: string) => `Dazu kommt das schadenfreie Öffnen. Liegt der Schlüssel im Kofferraum oder auf dem Beifahrersitz, öffnen unsere Partner die Tür mit Lishi-Decodern — Spezialwerkzeug, das das Schloss unbeschädigt lässt, statt die Scheibe zu opfern. Ob Sie in ${city} wohnen oder nur dort parken: Sie kommen in Ihr Fahrzeug zurück, ohne Folgeschaden.`,
  (city: string) => `Auch für Reparaturen am vorhandenen Schlüssel sind Sie in ${city} richtig. Tasten ohne Funktion, gerissenes Gehäuse, leere Batterie? Unsere Partner löten vor Ort an der Platine und tauschen das Gehäuse, statt gleich einen neuen Schlüssel zu verkaufen. Das ist in den meisten Fällen die deutlich günstigere Reparatur — und der Schlüssel bleibt der, den Ihr Fahrzeug schon kennt.`,
  (city: string) => `Bevor in ${city} am Fahrzeug gearbeitet wird, prüfen wir Identität und Fahrzeugpapiere. Das ist keine Formalität: ein Schlüsseldienst, der ohne diese Prüfung arbeitet, ist genau der Weg, auf dem ein fremdes Auto gestohlen wird. Den Festpreis hören Sie vorher am Telefon, inklusive 19 % MwSt., und Sie erhalten eine Rechnung mit ausgewiesener Steuer sowie zwölf Monate schriftliche Garantie.`,
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
      <h2>Autoschlüssel nachmachen und anlernen — in {cityName} vor Ort</h2>
      <p>{intro(cityName)}</p>

      <h3>Werkstatttechnik und Schlüssel aus dem Lager</h3>
      <p>{body1(cityName)}</p>

      <h3>Schadenfrei öffnen und fachgerecht reparieren</h3>
      <p>{body2(cityName)}</p>

      <h3>Was Sie in {cityName} erwarten können</h3>
      <p>
        Warten Sie nicht, bis der einzige Schlüssel ausfällt — ein Zweitschlüssel
        kostet im Normalfall einen Bruchteil dessen, was der Notfall kostet. Unser
        Partner in <strong>{cityName}</strong> ist {travelTime} erreichbar. Rufen Sie
        unter <strong>{SITE_CONFIG.phone}</strong> an: Sie nennen Marke, Modell,
        Baujahr und Schlüsselart, und Sie hören den Festpreis und ein ehrliches
        Zeitfenster, bevor jemand losfährt.
      </p>
    </div>
  );
}
