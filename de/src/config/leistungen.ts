// ============================================================
// LEISTUNGEN — die Dienstseiten der deutschen Seite
//
// Keine Übersetzung der niederländischen Datei, sondern dieselbe Struktur mit
// deutschen Begriffen. Welche Begriffe und warum: ./keywords.ts. Die drei
// Beobachtungen, die hier jeden Text bestimmen, stehen dort oben im Kopf, und
// eine davon ist die wichtigste:
//
//   Für "Autoschlüssel nachmachen" ranken in Deutschland ADAC, AutoScout24,
//   Allianz und R+V — und sie schreiben, beim Schlüsseldienst sei das bei
//   modernen Schlüsseln "nicht möglich", man müsse zum Hersteller, 200 € und
//   mehr, 3 bis 5 Tage. Jede Seite hier beantwortet das in den ersten zwei
//   Sätzen, nicht als Werbung, sondern als Korrektur.
//
// Der Dateiname und der Export bleiben wie in der niederländischen App, damit
// der Code, der sie liest, unverändert bleibt.
// ============================================================
import { SITE_CONFIG, isReady } from '@/config/site.config';

export type Service = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  h1: string;
  intro: string;
  system?: string;
  /**
   * Eine vollständige, für sich stehende Antwort auf die Frage der Seite, in
   * zwei bis drei Sätzen, mit Preis und Zeit darin.
   *
   * Steht als erster Block auf der Seite. Sprachmodelle und Googles
   * Hervorhebungen zitieren eine Passage, die allein die Frage beantwortet;
   * Werbetext, der zur Pointe hinführt, wird nicht zitiert.
   */
  directAnswer?: string;
  priceFrom?: string;
  duration?: string;
  heroImage?: { src: string; alt: string };
  pricing?: { service: string; features: string; ours: string; dealer: string }[];
  steps: string[];
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
};

/**
 * Der Ab-Preis, oder nichts.
 *
 * Solange die Preise auf TBD stehen (siehe site.config.ts), darf hier kein
 * "ab €__TBD__" erscheinen und auch kein Strich, der wie ein Preis aussieht.
 * Die Seite sagt dann, dass der Festpreis am Telefon genannt wird — das ist
 * wahr und in dieser Branche ohnehin das stärkere Versprechen.
 */
export function preisAb(key: keyof typeof SITE_CONFIG.prices): string | undefined {
  const value = SITE_CONFIG.prices[key];
  return typeof value === 'string' && isReady(value) ? `ab ${value} €` : undefined;
}

/** Alte Adressen, die auf eine Übersichtsseite umgeleitet werden. */
export const REDIRECTED_SERVICE_SLUGS = new Set<string>([]);

export const DIENSTEN: Service[] = [
  // ── 1. Der Geldbegriff ────────────────────────────────────
  {
    slug: 'autoschluessel-nachmachen',
    title: 'Autoschlüssel nachmachen',
    metaTitle: 'Autoschlüssel nachmachen lassen | vor Ort, 12 Monate Garantie',
    metaDesc:
      'Autoschlüssel nachmachen lassen — vor Ort, am selben Tag. Wegfahrsperre wird am Fahrzeug angelernt, alle Marken. Festpreis vorab, inkl. MwSt.',
    h1: 'Autoschlüssel nachmachen — vor Ort angelernt, nicht beim Händler bestellt',
    intro:
      'Zweitschlüssel nötig? Unser Partner fräst den Schlüssel und lernt die Wegfahrsperre direkt an Ihrem Fahrzeug an — ohne Termin beim Händler und ohne Tage Wartezeit.',
    system: 'AVDI, Lonsdor K518, VVDI, Autel IM608 Pro',
    priceFrom: preisAb('transponder'),
    duration: '30–60 Minuten',
    directAnswer:
      'Einen Autoschlüssel nachmachen zu lassen dauert bei uns 30 bis 60 Minuten, und zwar dort, wo das Fahrzeug steht. Sie lesen oft, beim Schlüsseldienst sei das bei modernen Schlüsseln nicht möglich — das gilt für einen Schlüsseldienst ohne Fahrzeugdiagnose. Wir lernen die Wegfahrsperre über die OBD-Schnittstelle am Fahrzeug an, mit derselben Technik wie die Werkstatt, und Sie hören den Festpreis am Telefon, bevor jemand losfährt.',
    steps: [
      'Marke, Modell, Baujahr und Schlüsselart telefonisch oder per WhatsApp durchgeben',
      'Sie hören den Festpreis und ein ehrliches Zeitfenster — erst dann fährt jemand los',
      'Der Schlüsselrohling wird vor Ort auf Ihr Schließsystem gefräst',
      'Transponder und Funkfernbedienung werden über die OBD-Schnittstelle angelernt',
      'Alle Funktionen werden geprüft: Türen, Heckklappe, Motorstart',
    ],
    faq: [
      {
        q: 'Ich habe gelesen, ein Schlüsseldienst kann moderne Autoschlüssel nicht nachmachen. Stimmt das?',
        a: 'Für einen klassischen Schlüsseldienst stimmt es: wer nur Schlüssel fräst, kann die elektronische Wegfahrsperre nicht anlernen, und ohne das startet der Motor nicht. Der Unterschied ist die Fahrzeugdiagnose. Unsere Partner arbeiten mit denselben Anlerngeräten wie eine Werkstatt und lernen den Transponder am Fahrzeug an. Bei einzelnen sehr neuen Systemen, die der Hersteller nur online freigibt, geht es tatsächlich nicht — und dann sagen wir das am Telefon und fahren nicht los.',
      },
      {
        q: 'Was brauche ich dafür?',
        a: 'Ihren Personalausweis oder Pass und die Zulassungsbescheinigung Teil I. Damit weisen Sie nach, dass das Fahrzeug Ihnen gehört. Ohne diesen Nachweis wird kein Schlüssel angefertigt — das ist der Grund, warum sich ein Dritter für Ihr Auto keinen Schlüssel machen lassen kann.',
      },
      {
        q: 'Ist der nachgemachte Schlüssel so gut wie der vom Hersteller?',
        a: 'Ja. Es wird dieselbe Technik verwendet: der passende Transponder, am Fahrzeug angelernt, mit einem auf Ihr Schließsystem gefrästen Rohling. Der Unterschied zum Händler ist nicht die Qualität, sondern dass kein Schlüssel auf Fahrgestellnummer bestellt und tagelang geliefert werden muss.',
      },
      {
        q: 'Muss mein vorhandener Schlüssel dabei sein?',
        a: 'Wenn Sie noch einen haben, bringen Sie ihn mit — dann ist der Auftrag einfacher und oft günstiger. Nötig ist es nicht: auch wenn kein Schlüssel mehr da ist, lässt sich ein neuer anfertigen. Das ist dann der Fall "alle Autoschlüssel verloren" und dauert länger.',
      },
    ],
    relatedSlugs: ['ersatzschluessel-anfertigen', 'alle-autoschluessel-verloren', 'funkschluessel-nachmachen'],
  },

  // ── 2. Höchste Dringlichkeit ──────────────────────────────
  {
    slug: 'alle-autoschluessel-verloren',
    title: 'Autoschlüssel verloren',
    metaTitle: 'Autoschlüssel verloren? Ersatz vor Ort | ohne Abschleppen',
    metaDesc:
      'Alle Autoschlüssel verloren? Wir öffnen das Fahrzeug, fertigen einen neuen Schlüssel an und löschen den verlorenen. Vor Ort, kein Abschleppen.',
    h1: 'Autoschlüssel verloren — neuer Schlüssel dort, wo das Auto steht',
    intro:
      'Kein Schlüssel mehr da? Wir öffnen schadenfrei, fertigen einen neuen Schlüssel an, lernen die Wegfahrsperre an und löschen den verlorenen aus dem System.',
    priceFrom: preisAb('allKeysLost'),
    duration: '45–90 Minuten',
    directAnswer:
      'Wenn alle Autoschlüssel verloren sind, muss das Fahrzeug in der Regel nicht abgeschleppt werden. Wir öffnen es schadenfrei, lesen die nötigen Daten aus, fertigen einen neuen Schlüssel an und lernen ihn an der Wegfahrsperre an — am Standort des Fahrzeugs, in 45 bis 90 Minuten. Der verlorene Schlüssel wird dabei aus dem System gelöscht, damit er das Auto nicht mehr öffnet; das ist der Teil, den viele vergessen, und der wichtigste.',
    pricing: [
      {
        service: 'Ersatz bei verlorenem Schlüssel',
        features: 'Öffnung, neuer Schlüssel, Anlernen, alten Schlüssel löschen',
        ours: isReady(SITE_CONFIG.prices.allKeysLost)
          ? `ab ${SITE_CONFIG.prices.allKeysLost} €`
          : 'Festpreis am Telefon',
        dealer: 'Händler: oft 400 € und mehr, plus Abschleppen',
      },
    ],
    steps: [
      'Anrufen und Marke, Modell, Baujahr und Standort durchgeben',
      'Sie hören den Festpreis, bevor jemand losfährt',
      'Unser Partner öffnet das Fahrzeug schadenfrei — keine Scheibe, kein Aufbohren',
      'Schlüsseldaten werden ausgelesen und ein neuer Schlüssel wird gefräst',
      'Die Wegfahrsperre wird angelernt und der Motorstart geprüft',
      'Der verlorene Schlüssel wird gelöscht und öffnet das Fahrzeug nicht mehr',
    ],
    faq: [
      {
        q: 'Muss mein Auto abgeschleppt werden?',
        a: 'In der Regel nicht. Wir arbeiten dort, wo das Fahrzeug steht — auf der Straße, in der Einfahrt, in der Tiefgarage. Das Abschleppen zum Händler ist der Standardweg, den die Ratgeber beschreiben, und er kostet Geld und Tage, die Sie nicht aufwenden müssen.',
      },
      {
        q: 'Was kostet es, wenn alle Schlüssel weg sind?',
        a: 'Mehr als ein Zweitschlüssel, weil drei Arbeitsschritte zusammenkommen: Öffnen, Anfertigen und Anlernen ohne vorhandenen Schlüssel. Sie hören den Festpreis für Ihr Fahrzeug am Telefon, und er ändert sich vor Ort nicht. Beim Hersteller liegt der Ersatz laut Verbraucherberichten oft bei 200 bis 500 Euro, zuzüglich Abschleppen und Wartezeit.',
      },
      {
        q: 'Kann jemand mit meinem verlorenen Schlüssel mein Auto öffnen?',
        a: 'Nachdem wir ihn gelöscht haben, nicht mehr. Der alte Schlüssel wird aus der Wegfahrsperre entfernt: er öffnet nicht und startet nicht. Wird der Schlüssel samt Fahrzeugpapieren gestohlen, melden Sie den Verlust zusätzlich Ihrer Versicherung.',
      },
      {
        q: 'Wie lange dauert das?',
        a: '45 bis 90 Minuten vor Ort, je nach Fahrzeug und System. Bei schlüssellosen Systemen kann es länger sein. Was dazukommt, ist die Anfahrt, und dafür nennen wir am Telefon ein ehrliches Zeitfenster statt einer Zahl, die gut klingt.',
      },
      {
        q: 'Brauche ich die Fahrzeugpapiere?',
        a: 'Ja — Personalausweis und Zulassungsbescheinigung Teil I. Bei einem Fahrzeug, zu dem gar kein Schlüssel mehr existiert, ist dieser Nachweis besonders wichtig, und wir arbeiten ohne ihn nicht.',
      },
      {
        q: 'Was ist, wenn das Auto in einer Tiefgarage steht?',
        a: 'Dann kommt unser Partner in die Tiefgarage. In Frankfurt ist das der häufigste Fall überhaupt, und es ist kein Hindernis — das Fahrzeug muss nicht herausgeschoben oder abgeschleppt werden.',
      },
    ],
    relatedSlugs: ['auto-oeffnen-notdienst', 'autoschluessel-nachmachen', 'autoschluessel-gestohlen'],
  },

  // ── 3. Notöffnung ────────────────────────────────────────
  {
    slug: 'auto-oeffnen-notdienst',
    title: 'Auto öffnen ohne Schlüssel',
    metaTitle: 'Auto öffnen ohne Schlüssel | schadenfrei, rund um die Uhr',
    metaDesc:
      'Auto aufschließen ohne Schlüssel — schadenfrei geöffnet, ohne Scheibe und ohne Aufbohren. Rund um die Uhr, Festpreis vorab.',
    h1: 'Auto öffnen ohne Schlüssel — schadenfrei, ohne Scheibe',
    intro:
      'Schlüssel eingeschlossen oder verloren? Wir öffnen Ihr Fahrzeug schadenfrei. Keine Scheibe, kein Aufbohren, kein Lackschaden.',
    priceFrom: preisAb('unlock'),
    duration: '15–30 Minuten',
    directAnswer:
      'Ein Auto ohne Schlüssel zu öffnen dauert bei uns meist 15 bis 30 Minuten und geschieht schadenfrei — ohne Scheibe, ohne Aufbohren, ohne Lackschaden. Der ADAC rät ausdrücklich davon ab, es selbst mit Tricks aus dem Internet zu versuchen, weil dabei fast immer ein Schaden an Lack oder Technik entsteht. Sie hören den Festpreis am Telefon, bevor jemand losfährt.',
    steps: [
      'Anrufen und sagen, wo das Fahrzeug steht und welches Modell es ist',
      'Sie hören den Festpreis und ein Zeitfenster',
      'Unser Partner kommt zum Fahrzeug — Straße, Parkhaus, Betriebshof',
      'Schadenfreie Öffnung mit Fachwerkzeug',
      'Auf Wunsch gleich ein Ersatzschlüssel, wenn der alte weg ist',
    ],
    faq: [
      {
        q: 'Entsteht ein Schaden am Auto?',
        a: 'Nein. Geöffnet wird mit Fachwerkzeug über die Türdichtung oder das Schließsystem, nicht über die Scheibe. Genau davor warnen auch ADAC und t-online bei den Hausmitteln, die im Internet kursieren: die kosten meist mehr als die Öffnung.',
      },
      {
        q: 'Ein Kind oder ein Hund ist im Auto eingeschlossen. Was jetzt?',
        a: 'Rufen Sie sofort 112. Bei Hitze zählen Minuten, und dann ist die Feuerwehr richtig und nicht ein Dienstleister mit Anfahrtszeit. Rufen Sie uns danach an, wenn ein Ersatzschlüssel gebraucht wird.',
      },
      {
        q: 'Muss ich nachweisen, dass das Auto mir gehört?',
        a: 'Ja. Personalausweis und Zulassungsbescheinigung Teil I. Das ist dieselbe Prüfung, die auch der ADAC macht, und sie ist der Grund, warum dieser Dienst nicht missbraucht werden kann.',
      },
      {
        q: 'Kommen Sie auch nachts und am Wochenende?',
        a: 'Ja, rund um die Uhr, auch an Feiertagen — und ohne Nacht- oder Wochenendzuschlag. Der am Telefon genannte Preis ist der Preis auf der Rechnung.',
      },
      {
        q: 'Der Schlüssel liegt sichtbar im Auto. Geht das schneller?',
        a: 'Für die Öffnung ja — dann ist es nur die Öffnung und kein neuer Schlüssel. Sagen Sie es am Telefon, dann stimmt auch der Preis.',
      },
    ],
    relatedSlugs: ['schluessel-im-auto-eingeschlossen', 'alle-autoschluessel-verloren', 'kofferraum-oeffnen'],
  },

  // ── 4. Schlüssel im Auto ─────────────────────────────────
  {
    slug: 'schluessel-im-auto-eingeschlossen',
    title: 'Schlüssel im Auto eingeschlossen',
    metaTitle: 'Schlüssel im Auto eingeschlossen? Schadenfrei geöffnet',
    metaDesc:
      'Schlüssel im Auto liegen gelassen und die Tür ist zu? Wir öffnen schadenfrei, rund um die Uhr. Festpreis vorab, inkl. MwSt.',
    h1: 'Schlüssel im Auto eingeschlossen — wir öffnen schadenfrei',
    intro:
      'Der Schlüssel liegt im Auto und die Zentralverriegelung hat zugeschlossen. Passiert täglich, und es ist in einer halben Stunde erledigt.',
    priceFrom: preisAb('unlock'),
    duration: '15–30 Minuten',
    directAnswer:
      'Wenn der Schlüssel im Auto eingeschlossen ist, öffnen wir das Fahrzeug schadenfrei, meist in 15 bis 30 Minuten, dort wo es steht. Der Schlüssel ist danach wieder in Ihrer Hand und muss nicht ersetzt werden — Sie zahlen also nur die Öffnung. Versuchen Sie es nicht selbst mit Draht oder Keil: der Schaden am Lack oder an der Türdichtung kostet mehr als die Öffnung.',
    steps: [
      'Anrufen und Standort und Modell durchgeben',
      'Festpreis und Zeitfenster hören',
      'Unser Partner kommt zum Fahrzeug',
      'Schadenfreie Öffnung, der Schlüssel liegt wieder in Ihrer Hand',
      'Kein neuer Schlüssel nötig — Sie zahlen nur die Öffnung',
    ],
    faq: [
      {
        q: 'Kann ich es selbst mit einem Draht versuchen?',
        a: 'Besser nicht. ADAC und t-online warnen beide davor: bei modernen Türen sitzt die Mechanik so, dass die Hausmittel aus dem Internet die Dichtung, den Lack oder die Elektrik in der Tür beschädigen. Die Reparatur kostet dann ein Mehrfaches der Öffnung.',
      },
      {
        q: 'Hat meine Hersteller-App eine Entsperrfunktion?',
        a: 'Bei vielen neueren Fahrzeugen ja, und das ist dann der günstigste Weg — sofern das Handy nicht ebenfalls im Auto liegt. Probieren Sie es zuerst, bevor Sie uns anrufen.',
      },
      {
        q: 'Was kostet nur das Öffnen?',
        a: 'Weniger als ein neuer Schlüssel, weil nichts gefräst und nichts angelernt werden muss. Sie hören den Festpreis am Telefon, und es kommt kein Anfahrts- oder Nachtzuschlag dazu.',
      },
      {
        q: 'Mein Fahrzeug hat Keyless Go und ist trotzdem zu.',
        a: 'Kommt vor: liegt der Schlüssel im Innenraum und die Verriegelung schließt, hilft das schlüssellose System nicht mehr. Die Öffnung läuft genauso ab.',
      },
      {
        q: 'Kommen Sie auch in ein Parkhaus?',
        a: 'Ja, auch in die Tiefgarage. Nennen Sie am Telefon die Ebene und die Einfahrt, dann findet unser Partner das Fahrzeug direkt.',
      },
    ],
    relatedSlugs: ['auto-oeffnen-notdienst', 'autotuer-zugefallen', 'kofferraum-oeffnen'],
  },

  // ── 5. Tür zugefallen ────────────────────────────────────
  {
    slug: 'autotuer-zugefallen',
    title: 'Autotür zugefallen',
    metaTitle: 'Autotür zugefallen, Schlüssel drin? Schadenfrei geöffnet',
    metaDesc:
      'Autotür zugefallen mit dem Schlüssel im Fahrzeug? Wir öffnen schadenfrei, rund um die Uhr, zum Festpreis.',
    h1: 'Autotür zugefallen mit dem Schlüssel drin',
    intro:
      'Ein Windstoß, ein Kind an der Tür, ein kurzer Moment — und der Schlüssel liegt innen. Das ist in einer halben Stunde erledigt.',
    priceFrom: preisAb('unlock'),
    duration: '15–30 Minuten',
    directAnswer:
      'Eine zugefallene Autotür mit dem Schlüssel im Fahrzeug öffnen wir schadenfrei, meist in 15 bis 30 Minuten. Es muss kein neuer Schlüssel angefertigt werden, denn der alte liegt ja im Auto — Sie zahlen nur die Öffnung, zum Festpreis, der am Telefon genannt wird.',
    steps: [
      'Anrufen und Standort und Modell nennen',
      'Festpreis und Zeitfenster hören',
      'Unser Partner kommt zum Fahrzeug',
      'Schadenfreie Öffnung über die Türdichtung oder das Schließsystem',
      'Funktionsprüfung der Tür, damit nichts hakt',
    ],
    faq: [
      {
        q: 'Warum schließt die Tür überhaupt beim Zufallen ab?',
        a: 'Viele Fahrzeuge verriegeln automatisch, sobald sie Bewegung oder eine bestimmte Geschwindigkeit erkennen, und einige auch beim Zuschlagen. Deshalb liegt der Schlüssel manchmal innen, ohne dass irgendwer etwas falsch gemacht hat.',
      },
      {
        q: 'Ist das dasselbe wie eine Notöffnung?',
        a: 'Technisch ja, kaufmännisch meist günstiger: es ist nur die Öffnung, kein neuer Schlüssel. Sagen Sie am Telefon, dass der Schlüssel im Auto liegt, dann stimmt der Preis.',
      },
      {
        q: 'Kann ich warten, bis jemand mit dem Zweitschlüssel kommt?',
        a: 'Natürlich, und wenn jemand in der Nähe einen Zweitschlüssel hat, ist das der günstigste Weg. Rufen Sie uns, wenn es den nicht gibt oder es zu lange dauert.',
      },
      {
        q: 'Kommen Sie am Wochenende?',
        a: 'Ja, rund um die Uhr und ohne Wochenend- oder Feiertagszuschlag.',
      },
      {
        q: 'Was ist, wenn die Tür danach nicht richtig schließt?',
        a: 'Das soll nicht passieren und passiert bei fachgerechter Öffnung auch nicht. Unser Partner prüft die Tür zum Schluss; wäre etwas, sagen Sie es uns sofort.',
      },
    ],
    relatedSlugs: ['schluessel-im-auto-eingeschlossen', 'auto-oeffnen-notdienst', 'kofferraum-oeffnen'],
  },

  // ── 6. Kofferraum ────────────────────────────────────────
  {
    slug: 'kofferraum-oeffnen',
    title: 'Kofferraum öffnen ohne Schlüssel',
    metaTitle: 'Kofferraum öffnen ohne Schlüssel | Heckklappe schadenfrei',
    metaDesc:
      'Kofferraum oder Heckklappe zu und der Schlüssel liegt drin? Wir öffnen schadenfrei, rund um die Uhr, zum Festpreis.',
    h1: 'Kofferraum öffnen ohne Schlüssel — auch die Heckklappe',
    intro:
      'Kofferraum zugeschlagen und der Schlüssel liegt darin, oder das Schloss reagiert nicht mehr. Wir öffnen schadenfrei.',
    priceFrom: preisAb('unlock'),
    duration: '20–40 Minuten',
    directAnswer:
      'Einen Kofferraum oder eine Heckklappe ohne Schlüssel zu öffnen dauert 20 bis 40 Minuten und geschieht schadenfrei. Am häufigsten liegt der Schlüssel beim Einladen im Kofferraum und die Klappe fällt zu; manchmal ist es auch das Schloss oder der Stellmotor. Was es ist, sieht unser Partner am Fahrzeug — und Sie hören vorher den Festpreis.',
    steps: [
      'Anrufen und Modell und Standort nennen',
      'Festpreis und Zeitfenster hören',
      'Unser Partner kommt zum Fahrzeug',
      'Schadenfreie Öffnung der Heckklappe',
      'Prüfung, ob Schloss und Stellmotor noch sauber arbeiten',
    ],
    faq: [
      {
        q: 'Mein Kofferraum geht nicht auf, obwohl ich den Schlüssel habe.',
        a: 'Dann ist es nicht der Schlüssel, sondern meist das Schloss oder der Stellmotor der Heckklappe — bei vielen Modellen ein bekannter Verschleißpunkt. Wir öffnen zuerst und sagen dann, was es ist.',
      },
      {
        q: 'Lässt sich die Rückbank nicht einfach umklappen?',
        a: 'Bei manchen Fahrzeugen ja, und dann ist das der einfachste Weg — probieren Sie es. Bei vielen Kombis und SUV ist die Durchladeöffnung zu klein oder von innen verriegelt.',
      },
      {
        q: 'Wird der Lack beschädigt?',
        a: 'Nein. Geöffnet wird mit Fachwerkzeug am Schließsystem, nicht mit Hebeln am Blech.',
      },
      {
        q: 'Was kostet das?',
        a: 'Etwas mehr als eine Türöffnung, weil Heckklappen schlechter zugänglich sind. Den Festpreis hören Sie am Telefon.',
      },
      {
        q: 'Kommen Sie auch, wenn nur die Klappe defekt ist?',
        a: 'Ja. Dann öffnen wir und sagen Ihnen, ob es mit einem neuen Schloss erledigt ist oder in die Werkstatt gehört. Wenn es Letzteres ist, sagen wir das auch.',
      },
    ],
    relatedSlugs: ['auto-oeffnen-notdienst', 'schluessel-im-auto-eingeschlossen', 'autotuer-zugefallen'],
  },

  // ── 7. Abgebrochen ───────────────────────────────────────
  {
    slug: 'autoschluessel-abgebrochen',
    title: 'Autoschlüssel abgebrochen',
    metaTitle: 'Autoschlüssel abgebrochen oder steckt fest | vor Ort gelöst',
    metaDesc:
      'Autoschlüssel abgebrochen im Schloss oder Zündschloss? Wir holen das Bruchstück heraus und fertigen einen neuen Schlüssel an — vor Ort.',
    h1: 'Autoschlüssel abgebrochen — Bruchstück heraus, neuer Schlüssel dazu',
    intro:
      'Abgebrochen im Türschloss oder im Zündschloss? Drehen Sie nicht weiter und nehmen Sie keinen Kleber. Wir holen das Stück heraus und fertigen einen neuen Schlüssel.',
    priceFrom: preisAb('transponder'),
    duration: '30–60 Minuten',
    directAnswer:
      'Ein abgebrochener Autoschlüssel wird vor Ort aus dem Schloss geholt und durch einen neuen ersetzt, in der Regel in 30 bis 60 Minuten. Wichtig bis dahin: nicht mit Gewalt weiterdrehen und keinen Kleber verwenden — beides beschädigt den Schließzylinder, und dann wird aus einem Schlüssel ein Schloss. Bewahren Sie das Teil mit der Elektronik auf, der Transponder darin lässt sich meist weiterverwenden.',
    steps: [
      'Nicht weiterdrehen, keinen Kleber, das Bruchstück möglichst stecken lassen',
      'Anrufen und Marke, Modell und Baujahr durchgeben',
      'Unser Partner holt das Bruchstück heraus, ohne den Zylinder zu beschädigen',
      'Ein neuer Schlüssel wird auf Ihr Schließsystem gefräst',
      'Der Transponder aus dem alten Teil wird übernommen oder neu angelernt',
      'Alle Funktionen werden geprüft',
    ],
    faq: [
      {
        q: 'Soll ich das abgebrochene Stück selbst herausziehen?',
        a: 'Nur wenn es weit heraussteht und sich ohne Kraft herausnehmen lässt. Sonst lassen Sie es stecken: ein Fachbetrieb bekommt ein steckendes Stück sauber heraus, ein herausgebrochener Rest im Zylinder ist deutlich aufwendiger. Mit Kleber zu arbeiten macht es in jedem Fall schlimmer.',
      },
      {
        q: 'Ist die Elektronik im Schlüssel noch zu retten?',
        a: 'Meistens ja. Der Transponder und die Funkelektronik sitzen im Griffteil, und das bricht selten mit. Bewahren Sie es auf, dann kann es in das neue Gehäuse übernommen werden — das ist günstiger als ein kompletter Neuschlüssel.',
      },
      {
        q: 'Mein Schlüssel steckt fest, ist aber nicht abgebrochen.',
        a: 'Dann ist oft das Zündschloss ausgeschlagen oder der Schlüssel abgenutzt. Bewegen Sie das Lenkrad leicht und ziehen Sie ohne Kraft; geht es nicht, rufen Sie an, bevor etwas bricht.',
      },
    ],
    relatedSlugs: ['autoschluessel-nachmachen', 'autoschluessel-reparieren', 'schluesselgehaeuse-wechseln'],
  },

  // ── 8. Transponder ───────────────────────────────────────
  {
    slug: 'transponder-anlernen',
    title: 'Transponder anlernen',
    metaTitle: 'Transponder anlernen | Wegfahrsperre programmieren vor Ort',
    metaDesc:
      'Transponder anlernen und Wegfahrsperre programmieren — vor Ort über OBD, alle Marken. Festpreis vorab, inkl. MwSt.',
    h1: 'Transponder anlernen — Wegfahrsperre am Fahrzeug programmiert',
    intro:
      'Der Schlüssel dreht, aber der Motor startet nicht? Dann erkennt die Wegfahrsperre den Transponder nicht. Das wird am Fahrzeug angelernt.',
    system: 'AVDI, Lonsdor K518, VVDI, Autel IM608 Pro',
    priceFrom: preisAb('transponder'),
    duration: '30–60 Minuten',
    directAnswer:
      'Einen Transponder anzulernen heißt, den Chip im Schlüssel der Wegfahrsperre Ihres Fahrzeugs bekannt zu machen — ohne das dreht der Schlüssel, aber der Motor startet nicht. Das geschieht über die OBD-Schnittstelle am Fahrzeug und dauert 30 bis 60 Minuten. Bei vielen Fahrzeugen geht das vor Ort; bei einzelnen neueren Systemen wie FBS4 oder FEM/BDC verlangt der Hersteller eine Online-Freigabe, und dann sagen wir das vorher.',
    steps: [
      'Marke, Modell und Baujahr durchgeben — danach wissen wir, welches System verbaut ist',
      'Sie hören, ob es vor Ort machbar ist, und den Festpreis',
      'Diagnosegerät an die OBD-Schnittstelle',
      'Transponder wird an der Wegfahrsperre angelernt',
      'Motorstart und alle Funktionen werden geprüft',
    ],
    faq: [
      {
        q: 'Mein Schlüssel öffnet das Auto, aber der Motor startet nicht.',
        a: 'Das ist das typische Bild eines Transponderproblems: die Funkfernbedienung arbeitet noch, der Chip für die Wegfahrsperre nicht mehr. Meist ist der Transponder defekt oder nicht mehr angelernt — beides wird am Fahrzeug behoben, der Schlüssel muss nicht ersetzt werden.',
      },
      {
        q: 'Was ist FBS4 oder FEM/BDC, und warum ist das ein Problem?',
        a: 'Das sind neuere Wegfahrsperren-Systeme von Mercedes und BMW, bei denen der Hersteller das Anlernen nur über seine eigene Online-Freigabe zulässt. Bei diesen Fahrzeugen kann auch ein gut ausgerüsteter Fachbetrieb nicht frei anlernen. Wir prüfen das am Telefon anhand von Modell und Baujahr und fahren nicht los, um Ihnen vor dem Auto eine Anfahrt zu berechnen.',
      },
    ],
    relatedSlugs: ['autoschluessel-nachmachen', 'keyless-go-schluessel', 'autoschluessel-reparieren'],
  },

  // ── 9. Keyless ───────────────────────────────────────────
  {
    slug: 'keyless-go-schluessel',
    title: 'Keyless-Go-Schlüssel nachmachen',
    metaTitle: 'Keyless Go Schlüssel nachmachen | Smart Key anlernen',
    metaDesc:
      'Keyless Go, Comfort Access oder Smart Key nachmachen und anlernen — vor Ort, alle Marken. Festpreis vorab, inkl. MwSt.',
    h1: 'Keyless-Go-Schlüssel nachmachen und anlernen',
    intro:
      'Schlüsselloser Zugang — Keyless Go, Comfort Access, Smart Key. Teuer beim Hersteller, langsam im Termin, bei uns vor Ort.',
    system: 'AVDI, Lonsdor K518, VVDI, Autel IM608 Pro',
    priceFrom: preisAb('smartKey'),
    duration: '35–60 Minuten',
    directAnswer:
      'Einen Keyless-Go- oder Smart-Key-Schlüssel nachmachen zu lassen dauert bei uns 35 bis 60 Minuten, am Fahrzeug. Diese Schlüssel sind beim Hersteller die teuersten und im Termin die langsamsten, weil sie auf Fahrgestellnummer bestellt werden; angelernt werden sie über die Fahrzeugdiagnose. Welche Systeme vor Ort machbar sind, hängt von Marke und Baujahr ab — das klären wir am Telefon, bevor jemand losfährt.',
    steps: [
      'Marke, Modell, Baujahr und Schlüsselart durchgeben',
      'Sie hören, ob es vor Ort machbar ist, und den Festpreis',
      'Der passende Schlüssel wird vorbereitet und das mechanische Notblatt gefräst',
      'Anlernen über die Fahrzeugdiagnose',
      'Prüfung: schlüsselloses Öffnen, Start-Stopp-Taste, Notblatt',
    ],
    faq: [
      {
        q: 'Mein Keyless-Schlüssel wird nicht mehr erkannt. Muss ein neuer her?',
        a: 'Oft nicht. Am häufigsten ist die Batterie leer oder die Batteriehalterung im Gehäuse gebrochen — beides ist eine Reparatur und kein Neuschlüssel. Wir prüfen das zuerst, denn das ist der günstigere Weg und meistens der richtige.',
      },
      {
        q: 'Warum ist ein Keyless-Schlüssel so viel teurer?',
        a: 'Weil mehr darin steckt: Transponder, Funkplatine und die Elektronik für den schlüssellosen Zugang, und weil er fahrzeugspezifisch angelernt werden muss. Beim Hersteller kommen Bestellung auf Fahrgestellnummer und Wartezeit dazu — das ist der Teil, den wir Ihnen sparen, nicht die Technik.',
      },
    ],
    relatedSlugs: ['transponder-anlernen', 'autoschluessel-nachmachen', 'autoschluessel-batterie-wechseln'],
  },

  // ── 10. Funkschlüssel ────────────────────────────────────
  {
    slug: 'funkschluessel-nachmachen',
    title: 'Funkschlüssel nachmachen',
    metaTitle: 'Funkschlüssel nachmachen | Klappschlüssel mit Fernbedienung',
    metaDesc:
      'Funkschlüssel oder Klappschlüssel nachmachen lassen — inklusive Fernbedienung, vor Ort angelernt. Festpreis vorab.',
    h1: 'Funkschlüssel nachmachen — inklusive Fernbedienung, vor Ort angelernt',
    intro:
      'Klapp- und Funkschlüssel mit Fernbedienung, am Fahrzeug angelernt. Und wenn nur die Fernbedienung spinnt, reparieren wir sie lieber.',
    priceFrom: preisAb('klapsleutel'),
    duration: '30–60 Minuten',
    directAnswer:
      'Einen Funkschlüssel nachmachen zu lassen dauert 30 bis 60 Minuten vor Ort: der Rohling wird gefräst, Transponder und Fernbedienung werden am Fahrzeug angelernt. Wenn Ihr Funkschlüssel nur unzuverlässig reagiert, lohnt sich zuerst der Blick auf Batterie, Mikroschalter und Gehäuse — das ist oft eine Reparatur für einen Bruchteil des Preises, und wir sagen Ihnen das auch dann, wenn ein neuer Schlüssel für uns der größere Auftrag wäre.',
    steps: [
      'Marke, Modell, Baujahr und Schlüsselart durchgeben',
      'Festpreis hören — und ob eine Reparatur reicht',
      'Rohling auf Ihr Schließsystem fräsen',
      'Transponder und Fernbedienung anlernen',
      'Prüfung aller Tasten und Funktionen',
    ],
    faq: [
      {
        q: 'Meine Fernbedienung reagiert nur noch aus einem Meter Entfernung.',
        a: 'Fast immer die Batterie, und manchmal eine kalte Lötstelle an der Antenne. Beides ist eine Reparatur. Erst wenn die Funkplatine selbst defekt ist, wird ein neuer Schlüssel nötig.',
      },
      {
        q: 'Eine Taste geht nicht mehr. Brauche ich einen neuen Schlüssel?',
        a: 'Nein. Die Tasten sitzen auf kleinen Mikroschaltern, die sich einzeln austauschen lassen. Siehe unsere Seite zu Tasten, die nicht mehr funktionieren.',
      },
    ],
    relatedSlugs: ['autoschluessel-nachmachen', 'autoschluessel-tasten-reparieren', 'autoschluessel-reparieren'],
  },

  // ── 11. Ersatz-/Zweitschlüssel ───────────────────────────
  {
    slug: 'ersatzschluessel-anfertigen',
    title: 'Ersatzschlüssel anfertigen',
    metaTitle: 'Ersatzschlüssel Auto anfertigen | Zweitschlüssel vor Ort',
    metaDesc:
      'Zweitschlüssel oder Ersatzschlüssel fürs Auto anfertigen lassen — vor Ort angelernt, 12 Monate Garantie. Festpreis vorab.',
    h1: 'Ersatzschlüssel anfertigen — bevor der erste verloren geht',
    intro:
      'Nur noch ein Schlüssel? Ein Zweitschlüssel jetzt kostet einen Bruchteil von dem, was ein Totalverlust später kostet.',
    priceFrom: preisAb('transponder'),
    duration: '30–60 Minuten',
    directAnswer:
      'Ein Zweitschlüssel, solange der erste noch da ist, ist der günstigste Schlüssel, den Sie je kaufen: er wird in 30 bis 60 Minuten vor Ort gefräst und angelernt. Ist der letzte Schlüssel weg, kommen Öffnung und ein Anlernen ohne Vorlage dazu, und bei Verbraucherberichten liegt der Herstellerersatz dann bei 200 bis 500 Euro plus Abschleppen. Der Unterschied ist nicht die Technik, sondern der Zeitpunkt.',
    steps: [
      'Marke, Modell, Baujahr und Schlüsselart durchgeben',
      'Festpreis hören und einen Termin wählen, der passt',
      'Rohling auf Ihr Schließsystem fräsen',
      'Transponder und Fernbedienung am Fahrzeug anlernen',
      'Alle Funktionen prüfen, 12 Monate Garantie auf Schlüssel und Anlernen',
    ],
    faq: [
      {
        q: 'Zweitschlüssel oder Ersatzschlüssel — wo ist der Unterschied?',
        a: 'Ein Zweitschlüssel kommt dazu, solange der erste noch da ist: einfach, planbar, günstig. Ein Ersatzschlüssel ersetzt einen, der weg ist, und wenn es der letzte war, muss das Fahrzeug zuerst geöffnet und die Wegfahrsperre ohne Vorlage neu angelernt werden. Darum fragen wir am Telefon, wie viele Schlüssel Sie noch haben.',
      },
      {
        q: 'Lohnt sich ein Zweitschlüssel bei einem älteren Auto?',
        a: 'Oft besonders: bei älteren Modellen sind Ersatzteile knapper und der Herstellerweg manchmal gar nicht mehr offen. Was heute 30 Minuten dauert, kann in zwei Jahren eine Suche nach einem Steuergerät sein.',
      },
    ],
    relatedSlugs: ['autoschluessel-nachmachen', 'alle-autoschluessel-verloren', 'funkschluessel-nachmachen'],
  },

  // ── 12. Batterie ─────────────────────────────────────────
  {
    slug: 'autoschluessel-batterie-wechseln',
    title: 'Autoschlüssel Batterie wechseln',
    metaTitle: 'Autoschlüssel Batterie wechseln | Festpreis, vor Ort',
    metaDesc:
      'Autoschlüssel Batterie leer? Wechsel vor Ort zum Festpreis — ohne Risiko für Transponder und Gehäuse.',
    h1: 'Autoschlüssel Batterie wechseln — ohne das Gehäuse zu beschädigen',
    intro:
      'Die Fernbedienung reicht nicht mehr weit, oder gar nicht mehr. Meist ist es nur die Batterie — und meistens können Sie das selbst.',
    priceFrom: preisAb('casing'),
    duration: '10–15 Minuten',
    directAnswer:
      'Eine leere Schlüsselbatterie ist in 10 bis 15 Minuten gewechselt, und bei vielen Schlüsseln können Sie das selbst: der Batterietyp steht meist im Gehäuse oder in der Bedienungsanleitung. Rufen Sie uns, wenn das Gehäuse sich nicht zerstörungsfrei öffnen lässt, der Schlüssel nach dem Wechsel nicht mehr erkannt wird oder die Batteriehalterung gebrochen ist — die ist bei Keyless-Schlüsseln ein bekannter Schwachpunkt.',
    steps: [
      'Batterietyp prüfen — er steht meist im Gehäuse oder in der Bedienungsanleitung',
      'Das Gehäuse an der vorgesehenen Stelle öffnen, nicht hebeln',
      'Batterie tauschen, ohne die Platine zu berühren',
      'Gehäuse schließen und alle Tasten prüfen',
      'Wenn der Schlüssel danach nicht erkannt wird: anrufen, nicht weiterprobieren',
      'Bei gebrochener Batteriehalterung wird das Gehäuse getauscht, nicht der Schlüssel',
    ],
    faq: [
      {
        q: 'Kann ich die Batterie selbst wechseln?',
        a: 'Bei den meisten Schlüsseln ja, und dann sollten Sie das auch. Vorsicht nur bei schlüssellosen Schlüsseln, wo die Platine direkt unter dem Deckel liegt, und bei Gehäusen, die verklebt sind — da bricht beim Hebeln eher das Gehäuse als der Deckel aufgeht.',
      },
      {
        q: 'Nach dem Batteriewechsel reagiert der Schlüssel nicht mehr.',
        a: 'Dann ist meist beim Öffnen etwas verrutscht oder ein Kontakt verbogen, selten muss die Fernbedienung neu angelernt werden. Probieren Sie nicht weiter — jeder weitere Versuch macht es wahrscheinlicher, dass die Platine Schaden nimmt.',
      },
      {
        q: 'Meine Batteriehalterung ist gebrochen.',
        a: 'Kommt bei Keyless-Schlüsseln vor, und manchmal funktioniert der Schlüssel trotzdem noch, nur unzuverlässig. Dann wird das Gehäuse getauscht und die Elektronik übernommen — deutlich günstiger als ein neuer Schlüssel.',
      },
    ],
    relatedSlugs: ['schluesselgehaeuse-wechseln', 'autoschluessel-reparieren', 'keyless-go-schluessel'],
  },

  // ── 13. Reparatur ────────────────────────────────────────
  {
    slug: 'autoschluessel-reparieren',
    title: 'Autoschlüssel reparieren',
    metaTitle: 'Autoschlüssel reparieren | günstiger als ein neuer Schlüssel',
    metaDesc:
      'Autoschlüssel defekt? Reparatur vor Ort — Gehäuse, Tasten, Platine, Transponder. Oft ein Bruchteil des Herstellerpreises.',
    h1: 'Autoschlüssel reparieren — statt 200 bis 500 Euro beim Hersteller',
    intro:
      'Ein defekter Schlüssel ist selten ein Fall für einen neuen. Gehäuse, Tasten, Lötstellen und Transponder lassen sich einzeln instand setzen.',
    priceFrom: preisAb('casing'),
    duration: '20–45 Minuten',
    directAnswer:
      'Einen defekten Autoschlüssel zu reparieren kostet in der Regel einen Bruchteil eines Neuschlüssels und dauert 20 bis 45 Minuten. Verbraucherberichte nennen für Herstellerersatz 200 bis 500 Euro, und bei älteren Modellen sind Ersatzteile knapp — während der eigentliche Fehler oft eine gebrochene Gehäusehälfte, ein verschlissener Mikroschalter oder eine kalte Lötstelle ist. Wir sehen zuerst nach, was defekt ist, und sagen es Ihnen auch, wenn eine Reparatur der kleinere Auftrag ist.',
    steps: [
      'Beschreiben, was der Schlüssel noch tut und was nicht',
      'Festpreis für die Diagnose und die wahrscheinliche Reparatur hören',
      'Unser Partner öffnet den Schlüssel zerstörungsfrei',
      'Gehäuse, Tasten, Lötstellen oder Transponder werden instand gesetzt',
      'Alle Funktionen werden am Fahrzeug geprüft',
      'Nur wenn die Platine selbst defekt ist, wird ein neuer Schlüssel nötig',
    ],
    faq: [
      {
        q: 'Woran merke ich, ob Reparatur reicht?',
        a: 'Grobe Regel: wenn der Schlüssel das Fahrzeug noch startet, ist der Transponder in Ordnung und der Rest ist meist mechanisch oder eine Lötstelle — also reparierbar. Startet er nicht mehr, geht es um Transponder oder Anlernen. Beides sieht unser Partner am Fahrzeug in wenigen Minuten.',
      },
      {
        q: 'Mein Schlüssel ist nass geworden.',
        a: 'Batterie heraus, nicht trockenföhnen, und so schnell wie möglich öffnen lassen. Entscheidend ist, dass die Platine nicht unter Spannung korrodiert — wer eine Woche wartet, kommt oft zu spät für die Reparatur.',
      },
      {
        q: 'Das Schlüsselblatt ist abgenutzt und dreht schwer.',
        a: 'Ein abgenutztes Blatt verschleißt das Zündschloss mit, und das ist die teurere Reparatur. Ein neu gefrästes Blatt mit der vorhandenen Elektronik löst das, bevor aus dem Schlüssel ein Schloss wird.',
      },
      {
        q: 'Lohnt sich die Reparatur bei einem alten Auto?',
        a: 'Besonders dann. Bei älteren Modellen ist Herstellerersatz knapp oder gar nicht mehr lieferbar, während die Reparatur unabhängig davon ist.',
      },
    ],
    relatedSlugs: ['schluesselgehaeuse-wechseln', 'autoschluessel-tasten-reparieren', 'autoschluessel-batterie-wechseln'],
  },

  // ── 14. Gehäuse ──────────────────────────────────────────
  {
    slug: 'schluesselgehaeuse-wechseln',
    title: 'Schlüsselgehäuse wechseln',
    metaTitle: 'Schlüsselgehäuse wechseln | Elektronik bleibt, Gehäuse neu',
    metaDesc:
      'Autoschlüssel Gehäuse gebrochen? Wir tauschen das Gehäuse und übernehmen Transponder und Platine — ohne neuen Schlüssel.',
    h1: 'Schlüsselgehäuse wechseln — die Elektronik bleibt Ihre',
    intro:
      'Gebrochenes Gehäuse, lose Taste, abgebrochener Schlüsselbügel. Das Gehäuse ist Kunststoff; der teure Teil sitzt darin und bleibt.',
    priceFrom: preisAb('casing'),
    duration: '20–30 Minuten',
    directAnswer:
      'Ein gebrochenes Schlüsselgehäuse zu tauschen dauert 20 bis 30 Minuten: Transponder, Funkplatine und das gefräste Blatt werden in ein neues Gehäuse übernommen, der Schlüssel bleibt derselbe und muss nicht neu angelernt werden. Autobild warnt ausdrücklich davor, das selbst zu machen, weil beim Tausch häufig der Transponder im alten Gehäuse zurückbleibt — und dann startet das Auto nicht mehr und aus einem Gehäusetausch wird ein Neuschlüssel.',
    steps: [
      'Marke, Modell und Schlüsselart durchgeben, am besten mit einem Foto',
      'Festpreis hören — das passende Gehäuse wird mitgebracht',
      'Der Schlüssel wird zerstörungsfrei geöffnet',
      'Transponder, Platine und Schlüsselblatt werden übernommen',
      'Neues Gehäuse montieren und alle Funktionen prüfen',
      'Kein Anlernen nötig: es ist derselbe Schlüssel in einem neuen Gehäuse',
    ],
    faq: [
      {
        q: 'Ich habe ein Gehäuse im Internet gekauft. Bauen Sie es ein?',
        a: 'Wenn es passt, ja. Nur: Gehäuse aus Fernost passen oft nur fast, und was nur fast passt, bricht an der Taste oder schließt nicht dicht. Wir bringen eins mit, das passt, und sagen vorher, was es kostet.',
      },
      {
        q: 'Warum soll ich das nicht selbst machen?',
        a: 'Können Sie — nur mit zwei Risiken, die beide teuer sind: der Transponder bleibt im alten Gehäuse zurück (dann startet der Motor nicht mehr), oder die Platine bricht beim Hebeln. Autobild nennt genau das als häufigsten Fehler.',
      },
      {
        q: 'Muss der Schlüssel danach neu angelernt werden?',
        a: 'Nein. Die Elektronik ist dieselbe, nur die Hülle ist neu. Das Fahrzeug merkt keinen Unterschied.',
      },
      {
        q: 'Mein Schlüsselbügel ist abgebrochen, die Elektronik ist heil.',
        a: 'Der klassische Fall für diese Reparatur. Neues Gehäuse, neu gefrästes Blatt, alte Elektronik — fertig.',
      },
    ],
    relatedSlugs: ['autoschluessel-reparieren', 'autoschluessel-abgebrochen', 'autoschluessel-batterie-wechseln'],
  },

  // ── 15. Tasten ───────────────────────────────────────────
  {
    slug: 'autoschluessel-tasten-reparieren',
    title: 'Autoschlüssel Tasten reparieren',
    metaTitle: 'Autoschlüssel Taste funktioniert nicht | Mikroschalter neu',
    metaDesc:
      'Taste am Autoschlüssel reagiert nicht mehr? Wir löten neue Mikroschalter ein — Ihr Schlüssel bleibt, kein Anlernen nötig.',
    h1: 'Autoschlüssel Tasten reparieren — neue Mikroschalter, kein neuer Schlüssel',
    intro:
      'Die Taste klickt noch, aber nichts passiert — oder sie klickt gar nicht mehr. Darunter sitzt ein Mikroschalter, und der ist einzeln tauschbar.',
    priceFrom: preisAb('casing'),
    duration: '20–40 Minuten',
    directAnswer:
      'Wenn eine Taste am Autoschlüssel nicht mehr reagiert, liegt es fast immer am Mikroschalter darunter — einem Bauteil für wenige Cent, das sich einzeln auslöten und ersetzen lässt. Die Reparatur dauert 20 bis 40 Minuten, Ihr Schlüssel bleibt derselbe und muss nicht neu angelernt werden. Ein Neuschlüssel dafür wäre, ein Gerät wegzuwerfen, weil ein Schalter verschlissen ist.',
    steps: [
      'Sagen, welche Taste nicht mehr geht und ob sie noch klickt',
      'Festpreis hören',
      'Der Schlüssel wird zerstörungsfrei geöffnet',
      'Der verschlissene Mikroschalter wird ausgelötet und ersetzt',
      'Alle Tasten werden am Fahrzeug geprüft',
    ],
    faq: [
      {
        q: 'Die Taste klickt noch, aber das Auto reagiert nicht.',
        a: 'Dann ist der Kontakt im Schalter verschlissen, obwohl die Mechanik noch arbeitet — typisch nach einigen Jahren an der Taste, die man am häufigsten drückt. Genau dafür ist diese Reparatur.',
      },
      {
        q: 'Lohnt sich das gegenüber einem neuen Schlüssel?',
        a: 'Fast immer. Ein Mikroschalter kostet Cent, ein neuer Funkschlüssel inklusive Anlernen ein Vielfaches. Nur wenn die Platine selbst Risse hat, ist der Neuschlüssel die ehrlichere Antwort — und dann sagen wir das.',
      },
      {
        q: 'Muss der Schlüssel danach neu angelernt werden?',
        a: 'Nein. Es ist dieselbe Platine mit einem neuen Schalter darauf.',
      },
      {
        q: 'Kann ich einen Mikroschalter selbst einlöten?',
        a: 'Mit Löterfahrung und einer feinen Spitze: ja. Die Schalter sind SMD-Bauteile, direkt neben Bauteilen, die bei zu viel Hitze aufgeben. Wer das noch nicht gemacht hat, riskiert an einer Cent-Reparatur die ganze Platine.',
      },
    ],
    relatedSlugs: ['autoschluessel-reparieren', 'funkschluessel-nachmachen', 'schluesselgehaeuse-wechseln'],
  },
];
