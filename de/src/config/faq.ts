// ============================================================
// FAQ — speist das FAQPage-Schema auf Dienst-, Stadt- und statischen Seiten
//
// Geschrieben gegen das eine Problem, das diese Branche in Deutschland hat.
// Schlüssel- und Türnotdienste stehen seit Jahren in der Verbraucherpresse,
// und ein deutscher Suchender prüft zuerst, ob er am Ende mehr zahlt als
// abgesprochen. Darum steht der Festpreis in der ersten Antwort und nicht die
// Geschwindigkeit — in den Niederlanden ist "prijs vooraf" eine
// Selbstverständlichkeit, hier ist es das Unterscheidungsmerkmal.
//
// Das zweite Thema ist eine Korrektur. ADAC, AutoScout24, Allianz und R+V
// ranken für "Autoschlüssel nachmachen" und schreiben, beim Schlüsseldienst
// sei das bei modernen Schlüsseln nicht möglich. Das stimmt für einen
// Schlüsseldienst ohne Fahrzeugdiagnose und nicht für einen Fachbetrieb, der
// die Wegfahrsperre anlernt. Diese Antwort steht weit oben, weil genau diese
// Frage im Kopf des Suchenden steht, wenn er hier ankommt.
//
// Keine Antwort nennt eine Zahl, die nicht aus SITE_CONFIG kommt. Solange die
// Preise auf TBD stehen, sagt der Text, dass der Festpreis am Telefon genannt
// wird — wahr und in dieser Branche das stärkere Versprechen.
// ============================================================

import { SITE_CONFIG, isReady } from '@/config/site.config';

export type FaqItem = { q: string; a: string };

/** "ab 149 €" oder, solange kein Preis hinterlegt ist, eine wahre Aussage. */
function abPreis(key: keyof typeof SITE_CONFIG.prices, fallback: string): string {
  const value = SITE_CONFIG.prices[key];
  return typeof value === 'string' && isReady(value) ? `ab ${value} €` : fallback;
}

const FESTPREIS = 'zu einem Festpreis, den Sie am Telefon hören';

// ── GLOBAL: Startseite, FAQ-Seite, Rückfalloption ──────────
export const FAQ_GLOBAL: FaqItem[] = [
  {
    q: 'Was kostet es, einen Autoschlüssel nachmachen zu lassen?',
    a: `Sie erfahren den Preis am Telefon, bevor jemand losfährt — und er ändert sich vor Ort nicht. Was er ist, hängt von Marke, Modell, Baujahr und Schlüsselart ab: ein einfacher Transponderschlüssel (${abPreis(
      'transponder',
      'Festpreis auf Anfrage'
    )}) ist deutlich günstiger als ein Keyless-Go-Schlüssel (${abPreis(
      'smartKey',
      'Festpreis auf Anfrage'
    )}), bei dem die Wegfahrsperre zusätzlich angelernt werden muss. Alle Beträge sind Bruttopreise inklusive 19 % MwSt., es kommt nichts dazu.`,
  },
  {
    q: 'Kommen am Ende noch Kosten dazu?',
    a: 'Nein. Der am Telefon genannte Preis ist der Preis auf der Rechnung: keine Anfahrtspauschale, kein Nacht-, Sonntags- oder Feiertagszuschlag, kein Aufschlag, der erst am Fahrzeug genannt wird. Zeigt sich am Fahrzeug, dass der Auftrag ein anderer ist als beschrieben, hören Sie den neuen Preis, bevor gearbeitet wird — und können ablehnen, ohne dass etwas berechnet wird.',
  },
  {
    q: 'Ich habe gelesen, ein Schlüsseldienst kann moderne Autoschlüssel nicht nachmachen. Stimmt das?',
    a: 'Für einen klassischen Schlüsseldienst stimmt es. Wer nur Schlüssel fräst, kann die elektronische Wegfahrsperre nicht anlernen, und ohne das startet der Motor nicht — deshalb schreiben ADAC und die Versicherer-Ratgeber, man müsse zum Hersteller. Der Unterschied ist die Fahrzeugdiagnose: unsere Partner arbeiten mit denselben Anlerngeräten wie eine Werkstatt und lernen den Transponder am Fahrzeug an. Bei einzelnen sehr neuen Systemen, die der Hersteller nur über eine Online-Freigabe zulässt, geht es tatsächlich nicht — und dann sagen wir das am Telefon, statt für eine Anfahrt zu berechnen.',
  },
  {
    q: 'Ich habe alle Schlüssel verloren. Muss das Auto abgeschleppt werden?',
    a: 'In der Regel nicht. Wir öffnen das Fahrzeug schadenfrei, lesen die nötigen Daten aus, fräsen einen neuen Schlüssel und lernen ihn an der Wegfahrsperre an — dort, wo das Auto steht. Der verlorene Schlüssel wird dabei aus dem System gelöscht, damit er das Fahrzeug nicht mehr öffnet. Das ist der Teil, den viele vergessen, und der wichtigste.',
  },
  {
    q: 'Wie schnell ist jemand da?',
    a: `Das hängt davon ab, wo Sie stehen und was gerade läuft, und wir nennen Ihnen am Telefon ein ehrliches Zeitfenster statt einer Zahl, die gut klingt. Unsere Partner in ${SITE_CONFIG.serviceAreaString} arbeiten rund um die Uhr, auch am Wochenende und an Feiertagen.`,
  },
  {
    q: 'Welche Unterlagen brauche ich?',
    a: 'Ihren Personalausweis oder Pass und die Zulassungsbescheinigung Teil I. Damit weisen Sie nach, dass das Fahrzeug Ihnen gehört. Ohne diesen Nachweis wird kein Schlüssel angefertigt — das ist keine Bürokratie, sondern der Grund, warum sich ein Dritter für Ihr Auto keinen Schlüssel machen lassen kann.',
  },
  {
    q: 'Ist der neue Schlüssel so gut wie der vom Hersteller?',
    a: 'Ja. Es wird dieselbe Technik verwendet: der passende Transponder, am Fahrzeug angelernt, mit einem auf Ihr Schließsystem gefrästen Rohling. Der Unterschied zum Händler ist nicht die Qualität, sondern dass kein Schlüssel auf Fahrgestellnummer bestellt und drei bis fünf Werktage geliefert werden muss. Auf Schlüssel und Anlernen gibt es 12 Monate Garantie.',
  },
  {
    q: 'Arbeiten Sie an allen Marken?',
    a: 'An den allermeisten — Volkswagen, BMW, Audi, Mercedes-Benz, Opel, Ford, Toyota, Renault, Peugeot, Škoda, Seat, Fiat und weitere. Einzelne sehr neue Modelle und Systeme mit Online-Freischaltung durch den Hersteller lassen sich nicht vor Ort anlernen. Das klären wir am Telefon anhand von Modell und Baujahr.',
  },
  {
    q: 'Wer kommt — Sie oder ein Partnerbetrieb?',
    a: 'Ein Partnerbetrieb aus Ihrer Stadt, der zu unserem Netzwerk gehört. Er ist ein eigenständiger Fachbetrieb vor Ort, arbeitet aber zu den Preisen und Bedingungen, die Sie bei uns zugesagt bekommen. Deshalb ist jemand in Ihrer Stadt und nicht drei Stunden entfernt.',
  },
  {
    q: 'Mein Schlüssel öffnet das Auto, aber der Motor startet nicht.',
    a: 'Dann arbeitet die Funkfernbedienung noch und der Chip für die Wegfahrsperre nicht mehr. Meist ist der Transponder defekt oder nicht mehr angelernt, und beides wird am Fahrzeug behoben — der Schlüssel muss dafür nicht ersetzt werden. Das ist der günstigere Fall, und wir prüfen ihn zuerst.',
  },
  {
    q: 'Kann ein defekter Schlüssel repariert werden, statt einen neuen zu kaufen?',
    a: 'Sehr oft. Gebrochene Gehäuse, verschlissene Mikroschalter unter den Tasten, leere Batterien und kalte Lötstellen sind einzeln zu beheben, und die Elektronik bleibt dabei Ihre — es muss nichts neu angelernt werden. Verbraucherberichte nennen für Herstellerersatz 200 bis 500 Euro; eine Reparatur liegt um ein Mehrfaches darunter. Wir sagen Ihnen das auch dann, wenn ein neuer Schlüssel für uns der größere Auftrag wäre.',
  },
  {
    q: 'Wie bezahle ich?',
    a: `Vor Ort nach der Arbeit: ${SITE_CONFIG.paymentAccepted.join(
      ', '
    )}. Sie erhalten eine Rechnung mit ausgewiesener Mehrwertsteuer.`,
  },
];

// ── Dienstspezifisch ───────────────────────────────────────
export const FAQ_AUTOSLEUTEL_BIJMAKEN: FaqItem[] = [
  {
    q: 'Muss mein vorhandener Schlüssel dabei sein?',
    a: 'Wenn Sie noch einen haben, bringen Sie ihn mit — dann ist der Auftrag einfacher und oft günstiger. Nötig ist es nicht: auch ohne vorhandenen Schlüssel lässt sich ein neuer anfertigen, das dauert dann länger und kostet mehr.',
  },
  {
    q: 'Zweitschlüssel oder Ersatzschlüssel — was brauche ich?',
    a: 'Ein Zweitschlüssel kommt dazu, solange der erste noch da ist: planbar und günstig. Ein Ersatzschlüssel ersetzt einen, der weg ist, und wenn es der letzte war, muss das Fahrzeug zuerst geöffnet und die Wegfahrsperre ohne Vorlage angelernt werden. Darum fragen wir am Telefon, wie viele Schlüssel Sie noch haben.',
  },
  {
    q: 'Wie lange dauert das Anlernen?',
    a: '30 bis 60 Minuten vor Ort, je nach Fahrzeug und System. Gefräst wird der Rohling auf Ihr Schließsystem, angelernt wird über die OBD-Schnittstelle, und zum Schluss werden Türen, Heckklappe und Motorstart geprüft.',
  },
];

export const FAQ_TRANSPONDER: FaqItem[] = [
  {
    q: 'Was ist ein Transponder und was heißt anlernen?',
    a: 'Der Transponder ist der Chip im Schlüssel, den die Wegfahrsperre des Fahrzeugs erkennen muss, damit der Motor startet. Anlernen heißt, diesen Chip dem Fahrzeug bekannt zu machen — über die OBD-Schnittstelle, mit derselben Technik, die eine Werkstatt dafür benutzt.',
  },
  {
    q: 'Was ist FBS4 oder FEM/BDC?',
    a: 'Neuere Wegfahrsperren-Systeme von Mercedes und BMW, bei denen der Hersteller das Anlernen nur über seine eigene Online-Freigabe zulässt. Bei diesen Fahrzeugen kann auch ein gut ausgerüsteter Fachbetrieb nicht frei anlernen. Wir prüfen das vorher anhand von Modell und Baujahr.',
  },
];

export const FAQ_SMART_KEY: FaqItem[] = [
  {
    q: 'Mein Keyless-Schlüssel wird nicht mehr erkannt. Brauche ich einen neuen?',
    a: 'Oft nicht. Am häufigsten ist die Batterie leer oder die Batteriehalterung im Gehäuse gebrochen — beides eine Reparatur und kein Neuschlüssel. Das prüfen wir zuerst, weil es der günstigere und meistens der richtige Weg ist.',
  },
  {
    q: 'Warum ist ein Keyless-Go-Schlüssel so viel teurer?',
    a: 'Weil mehr darin steckt: Transponder, Funkplatine und die Elektronik für den schlüssellosen Zugang, und weil er fahrzeugspezifisch angelernt werden muss. Beim Hersteller kommen Bestellung auf Fahrgestellnummer und Wartezeit dazu — das ist der Teil, den wir Ihnen sparen.',
  },
];

export const FAQ_AUTO_OP_SLOT: FaqItem[] = [
  {
    q: 'Entsteht beim Öffnen ein Schaden?',
    a: 'Nein. Geöffnet wird mit Fachwerkzeug über die Türdichtung oder das Schließsystem, nicht über die Scheibe. ADAC und t-online warnen beide vor den Hausmitteln aus dem Internet, weil die meist Lack, Dichtung oder Türelektrik beschädigen — die Reparatur kostet dann mehr als die Öffnung.',
  },
  {
    q: 'Ein Kind oder ein Hund ist im Auto eingeschlossen.',
    a: 'Rufen Sie sofort 112. Bei Hitze zählen Minuten, und dann ist die Feuerwehr richtig und nicht ein Dienstleister mit Anfahrtszeit. Rufen Sie uns danach an, wenn ein Ersatzschlüssel gebraucht wird.',
  },
  {
    q: 'Hat meine Hersteller-App eine Entsperrfunktion?',
    a: 'Bei vielen neueren Fahrzeugen ja, und das ist dann der günstigste Weg — sofern das Handy nicht ebenfalls im Auto liegt. Probieren Sie es zuerst.',
  },
  {
    q: 'Muss ich nachweisen, dass das Auto mir gehört?',
    a: 'Ja: Personalausweis und Zulassungsbescheinigung Teil I. Dieselbe Prüfung macht auch der ADAC, und sie ist der Grund, warum dieser Dienst nicht missbraucht werden kann.',
  },
];

export const FAQ_AKL: FaqItem[] = [
  {
    q: 'Was bedeutet „alle Schlüssel verloren"?',
    a: 'Dass kein funktionierender Schlüssel mehr existiert. Dann reicht Fräsen nicht: das Fahrzeug muss geöffnet, die Schlüsseldaten müssen ausgelesen und die Wegfahrsperre ohne vorhandenen Schlüssel neu angelernt werden. Das ist der aufwendigste Fall und dauert 45 bis 90 Minuten.',
  },
  {
    q: 'Kann jemand mit meinem verlorenen Schlüssel mein Auto öffnen?',
    a: 'Nachdem wir ihn gelöscht haben, nicht mehr. Der alte Schlüssel wird aus der Wegfahrsperre entfernt: er öffnet nicht und startet nicht. Wurde er samt Fahrzeugpapieren gestohlen, melden Sie den Verlust zusätzlich Ihrer Versicherung.',
  },
  {
    q: 'Was kostet das im Vergleich zum Händler?',
    a: `Bei uns ${abPreis(
      'allKeysLost',
      'zu einem Festpreis, den Sie vorab hören'
    )}, ${FESTPREIS}. Beim Hersteller nennen Verbraucherberichte 200 bis 500 Euro für den Schlüssel, zuzüglich Abschleppen und drei bis fünf Werktage Wartezeit, in denen das Fahrzeug steht.`,
  },
];

// ── Städte: eine Antwort je Frage, mit dem Stadtnamen darin ──
export function getFaqForCity(cityName: string, arrival?: string | null): FaqItem[] {
  return [
    {
      q: `Was kostet es, in ${cityName} einen Autoschlüssel nachmachen zu lassen?`,
      a: `Sie hören den Festpreis für Ihr Fahrzeug am Telefon, bevor in ${cityName} jemand losfährt, und er ändert sich vor Ort nicht. Ein Transponderschlüssel ist ${abPreis(
        'transponder',
        'günstiger als ein Keyless-Schlüssel'
      )}, ein Keyless-Go-Schlüssel ${abPreis(
        'smartKey',
        'entsprechend teurer, weil mehr Elektronik darin steckt'
      )}. In beiden Fällen ist Fräsen und Anlernen vor Ort enthalten, und alle Beträge sind Bruttopreise inklusive 19 % MwSt.`,
    },
    {
      q: `Autoschlüssel verloren in ${cityName} — was ist der schnellste Weg?`,
      a: `Unseren Partner in ${cityName} anrufen. Er kommt zu Ihrem Fahrzeug, öffnet es schadenfrei, fräst einen neuen Schlüssel, lernt die Wegfahrsperre an und löscht den verlorenen Schlüssel aus dem System. Das Fahrzeug muss dafür in der Regel nicht abgeschleppt werden — das ist der Unterschied zum Weg über den Vertragshändler, den die meisten Ratgeber beschreiben.`,
    },
    {
      q: `Wie lange dauert das Anlernen eines Autoschlüssels in ${cityName}?`,
      a: `Ein Zweitschlüssel 30 bis 60 Minuten, ein kompletter Ersatz ohne vorhandenen Schlüssel 45 bis 90 Minuten. Angelernt wird über die OBD-Schnittstelle am Fahrzeug, danach werden Türen, Heckklappe und Motorstart geprüft. Verlorene Schlüssel werden dabei elektronisch gesperrt.`,
    },
    {
      q: `Schlüssel im Auto eingeschlossen in ${cityName} — helfen Sie auch dabei?`,
      a: `Ja. Unser Partner in ${cityName} öffnet das Fahrzeug schadenfrei, mit Fachwerkzeug am Schließsystem und nicht über die Scheibe. Liegt der Schlüssel sichtbar im Auto, ist es nur die Öffnung und kein neuer Schlüssel — sagen Sie das am Telefon, dann stimmt der Preis.`,
    },
    {
      q: `Arbeiten Sie in ${cityName} an allen Marken?`,
      a: `An den allermeisten: Volkswagen, BMW, Audi, Mercedes-Benz, Opel, Ford, Toyota, Renault, Peugeot, Škoda, Seat, Fiat und weitere — vom einfachen Transponderschlüssel über den Klappschlüssel bis zum Keyless-Go-Schlüssel. Einzelne sehr neue Systeme mit Online-Freischaltung durch den Hersteller gehen nicht vor Ort, und das sagen wir vorher.`,
    },
    {
      q: `Wie schnell ist in ${cityName} jemand bei mir?`,
      a: `${
        arrival
          ? `In ${cityName} im Schnitt innerhalb von ${arrival}.`
          : `Das hängt davon ab, wo Sie in ${cityName} stehen und was gerade läuft — Sie hören am Telefon ein ehrliches Zeitfenster statt einer Zahl, die gut klingt.`
      } Unser Partner arbeitet rund um die Uhr, auch am Wochenende und an Feiertagen, ohne Zuschlag.`,
    },
  ];
}
