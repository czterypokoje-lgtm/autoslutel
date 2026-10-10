// ============================================================
// GESCHÄFTSKUNDEN — B2B-Segmente
//
// Vier Betriebsarten, die am selben Problem Geld verlieren, aus vier
// verschiedenen Gründen. Dieser Unterschied IST die Seite: eine Werkstatt
// verliert den ganzen Reparaturauftrag, ein Autohaus Marge bei der Übergabe,
// ein Importeur Tage pro Charge, ein Vermieter den Tagessatz. Eine einzige
// Seite für "Firmenkunden" würde keinem von ihnen etwas sagen.
//
// WAS HIER ABSICHTLICH NICHT STEHT
//
// Keine Mengenrabatte, keine Vertragsbedingungen, kein "X Werkstätten
// arbeiten mit uns". Das sind echte kaufmännische Entscheidungen, die das
// Büro noch nicht getroffen hat, und eine Landingpage ist der falsche Ort,
// sie zu erfinden. Jede Seite endet stattdessen in einer Anfrage — was
// ehrlich ist und zugleich das erzeugt, wofür die Seiten da sind.
//
// ÜBERSETZUNG, NICHT ÜBERTRAGUNG
//
// Drei Dinge der niederländischen Fassung gelten hier nicht und sind
// geändert, nicht übersetzt:
//
//  - Das Kennzeichen identifiziert in Deutschland kein Fahrzeug für Dritte
//    (kein öffentliches Register, siehe app/autoschluessel-nachmachen-lassen).
//    Für den B2B-Weg ist die FIN sowieso die bessere Angabe, und Betriebe
//    haben sie zur Hand — sie steht in Feld E der Zulassungsbescheinigung.
//  - "btw-specificatie" ist der MwSt.-Ausweis auf der Rechnung, 19 %.
//  - "op Nederlands kenteken" wird zur deutschen Zulassung.
// ============================================================

export type ZakelijkSegment = {
  slug: string;
  /** Beschriftung für Navigation und Karte. */
  label: string;
  title: string;
  /* Unter 44 Zeichen halten: layout.tsx hängt ' | Autoschlüssel24' an, und
     die niederländischen Fassungen liefen in den Ergebnissen auf 74-79. */
  metaTitle: string;
  metaDesc: string;
  h1Top: string;
  h1Accent: string;
  intro: string;
  image: { src: string; alt: string };
  /** Die Situation, die sie wiedererkennen — in ihren Worten. */
  painTitle: string;
  pain: string[];
  /** Was sich durch die Zusammenarbeit ändert. Eine Aussage je Zeile, jede belegbar. */
  gains: { title: string; text: string }[];
  /** Wie es tatsächlich abläuft, damit niemand fragen muss. */
  steps: string[];
  faq: { q: string; a: string }[];
};

export const ZAKELIJK_SEGMENTS: ZakelijkSegment[] = [
  // ── 1. KFZ-WERKSTÄTTEN ────────────────────────────────────
  {
    slug: 'kfz-werkstaetten',
    label: 'Kfz-Werkstätten',
    title: 'Autoschlüssel für Kfz-Werkstätten',
    metaTitle: 'Autoschlüssel-Service für Kfz-Werkstätten',
    metaDesc:
      'Schlüsselauftrag in Ihrer Werkstatt? Wir kommen zu Ihnen und lernen den Schlüssel vor Ort an. Keine Investition in Technik, und der Kunde bleibt bei Ihnen.',
    h1Top: 'Ihr Kunde steht mit einem Schlüsselproblem in der Werkstatt.',
    h1Accent: 'Wir kommen zu Ihnen.',
    intro:
      'Schlüssel anlernen verlangt markenspezifische Geräte und Lizenzen, die sich für einen Auftrag im Monat nie rechnen. Wir fahren in Ihre Werkstatt, fertigen den Schlüssel am Fahrzeug und lernen ihn an — und Sie machen mit dem Rest der Reparatur weiter.',
    image: {
      src: '/images/seo/auto-schluesseldienst-werkstatt.webp',
      alt: 'Autoschlüssel wird in der Werkstatt eines Kfz-Betriebs angelernt',
    },
    painTitle: 'Kommt Ihnen das bekannt vor?',
    pain: [
      'Das Fahrzeug steht schon auf der Hebebühne, aber der Schlüssel ist weg oder der Transponder wird nicht mehr erkannt — und Sie können nichts damit anfangen.',
      'Sie schicken den Kunden zum Vertragshändler, warten zwei Wochen auf einen Termin und sind damit auch den Rest der Reparatur los.',
      'Die Anlerntechnik, die Sie dafür bräuchten, kostet zusammen mit den Jahreslizenzen je Marke ein Vielfaches dessen, was ein paar Aufträge im Jahr einbringen.',
      'Das Fahrzeug belegt in der Zwischenzeit einen Hebebühnenplatz, den Sie nicht vermieten können.',
    ],
    gains: [
      {
        title: 'Das Fahrzeug bleibt bei Ihnen',
        text: 'Kein Abschleppwagen und keine Weiterverweisung. Wir kommen in Ihre Werkstatt, das Fahrzeug verlässt Ihr Gelände nicht, und der Auftrag bleibt Ihrer.',
      },
      {
        title: 'Keine Investition in Technik',
        text: 'Sie brauchen keine Diagnosegeräte, keine Lizenzen und keine Abos für Arbeit, die ein paar Mal im Jahr vorbeikommt.',
      },
      {
        title: 'Sie bleiben der Ansprechpartner',
        text: 'Ihr Kunde hat einen Kontakt: Sie. Wir rechnen mit Ihnen ab, Sie mit Ihrem Kunden — mit Ihrer eigenen Marge darauf.',
      },
      {
        title: 'Alle Marken, auch die schwierigen',
        text: 'Von Transponder bis Keyless Go. Was wir nicht können — Mercedes FBS4 ab etwa 2013/2014 —, sagen wir sofort, damit Sie Ihrem Kunden keine falsche Hoffnung machen.',
      },
    ],
    steps: [
      'Sie rufen an oder schreiben per WhatsApp, mit FIN und dem, was ansteht',
      'Wir bestätigen vorab, ob es geht, was es kostet und wann wir kommen',
      'Wir kommen in Ihre Werkstatt und fertigen den Schlüssel am Fahrzeug',
      'Sie erhalten eine Rechnung mit ausgewiesener MwSt. und gewerblichem Zahlungsziel',
    ],
    faq: [
      {
        q: 'Muss das Fahrzeug zu Ihnen gebracht werden?',
        a: 'Nein. Wir arbeiten mobil und kommen in Ihre Werkstatt. Das Fahrzeug muss Ihr Gelände nicht verlassen, und Sie müssen keinen Ersatzwagen organisieren.',
      },
      {
        q: 'Sprechen Sie direkt mit meinem Kunden?',
        a: 'Nur wenn Sie das wollen. Im Normalfall sind Sie der Ansprechpartner: wir rechnen mit Ihnen ab, und Ihr Kunde merkt nur, dass der Schlüssel erledigt ist.',
      },
      {
        q: 'Was, wenn Marke oder Baujahr nicht geht?',
        a: 'Dann hören Sie das vorher und nicht vor Ort. Mercedes mit FBS4 (etwa ab 2013/2014) kann nur der Vertragshändler, und bei manchen Modellen des VW-Konzerns ist eine Online-Freigabe des Herstellers nötig — rechnen Sie dann mit einigen Werktagen.',
      },
    ],
  },

  // ── 2. AUTOHÄUSER UND HÄNDLER ─────────────────────────────
  {
    slug: 'autohaeuser',
    label: 'Autohäuser & Händler',
    title: 'Zweitschlüssel für Ihre Gebrauchtwagen',
    metaTitle: 'Zweitschlüssel für Autohäuser und Händler',
    metaDesc:
      'Gebrauchtwagen mit nur einem Schlüssel? Wir fertigen Zweitschlüssel bei Ihnen auf dem Hof, mehrere Fahrzeuge pro Termin. Besserer Preis, keine Diskussion bei der Übergabe.',
    h1Top: 'Ein Gebrauchtwagen mit einem Schlüssel verkauft sich schwerer.',
    h1Accent: 'Wir fertigen den zweiten bei Ihnen auf dem Hof.',
    intro:
      'Eintauschfahrzeuge kommen mit einem Schlüssel herein. Bei der Übergabe ist das das Erste, worüber ein Käufer verhandelt — und ein fehlender Schlüssel kostet am Verhandlungstisch in der Regel mehr als seine Anfertigung. Wir kommen auf Ihr Gelände und erledigen mehrere Fahrzeuge in einem Termin.',
    image: {
      src: '/images/seo/autoschluessel_lager_alle_marken.webp',
      alt: 'Lager mit Autoschlüsseln für alle Marken, bereit zum Anfertigen für Autohäuser',
    },
    painTitle: 'Kommt Ihnen das bekannt vor?',
    pain: [
      'Jedes Eintauschfahrzeug kommt mit einem Schlüssel herein, und Sie wissen, dass der Käufer später davon anfängt.',
      'Bei der Übergabe geben Sie beim Preis nach, oder Sie versprechen einen Schlüssel, den Sie danach doch besorgen müssen.',
      'Der Vertragshändler verlangt Händlertarif und liefert erst nach einer oder zwei Wochen — während das Fahrzeug längst verkaufsfertig auf dem Hof stehen könnte.',
      'Jedes Fahrzeug einzeln zu organisieren kostet mehr Zeit als die Arbeit selbst.',
    ],
    gains: [
      {
        title: 'Mehrere Fahrzeuge in einem Termin',
        text: 'Sammeln Sie die Fahrzeuge, die einen Zweitschlüssel brauchen. Wir kommen vorbei und erledigen sie hintereinander auf Ihrem eigenen Gelände, in einem Termin.',
      },
      {
        title: 'Stärker bei der Übergabe',
        text: 'Zwei Schlüssel am Fahrzeug nehmen das Thema vom Tisch, bevor der Käufer davon anfängt. Kein Nachlass für etwas, das Sie hätten regeln können.',
      },
      {
        title: 'Eine Rechnung, gewerbliches Zahlungsziel',
        text: 'Keine Einzelzahlungen je Fahrzeug. Sie erhalten eine Rechnung für den gesamten Termin, mit ausgewiesener MwSt. je Fahrzeug für Ihre Buchhaltung.',
      },
      {
        title: 'Auch für Fahrzeuge ohne Schlüssel',
        text: 'Ein Eintauschfahrzeug, von dem kein Schlüssel mehr existiert, lösen wir vor Ort — einschließlich Löschen der alten Schlüssel aus der Wegfahrsperre, damit Sie das Fahrzeug mit sauberer Sicherung übergeben.',
      },
    ],
    steps: [
      'Sie nennen uns die Fahrzeuge, die einen Schlüssel brauchen (FIN genügt)',
      'Wir bestätigen je Fahrzeug, ob es geht und was es kostet',
      'Wir kommen vorbei und erledigen alle Fahrzeuge in einem Termin',
      'Eine Rechnung im Nachgang, mit MwSt.-Ausweis je Fahrzeug',
    ],
    faq: [
      {
        q: 'Wie viele Fahrzeuge schaffen Sie in einem Termin?',
        a: 'Das hängt von Marke und Schlüsselart ab — ein einfacher Transponder geht schneller als ein Keyless-Go-Schlüssel. Nennen Sie uns Anzahl und Modelle, dann planen wir die richtige Zeit ein.',
      },
      {
        q: 'Können Sie auch Schlüssel für Fahrzeuge liefern, die erst hereinkommen?',
        a: 'Ja. Viele Händler legen einen festen Termin pro Woche oder Monat fest, sodass neue Eintauschfahrzeuge beim nächsten Besuch gleich mitlaufen.',
      },
      {
        q: 'Arbeiten Sie mit Original- oder Nachbauschlüsseln?',
        a: 'Mit beiden, je nach Marke und Budget. Wir sagen vorher, was wir verwenden und wo der Unterschied liegt; bei einzelnen Modellen ist ein Originalschlüssel die einzige funktionierende Option.',
      },
    ],
  },

  // ── 3. IMPORT / EXPORT ────────────────────────────────────
  {
    slug: 'import-export',
    label: 'Import & Export',
    title: 'Schlüssel für Import- und Exportfahrzeuge',
    metaTitle: 'Autoschlüssel für Import und Export',
    metaDesc:
      'Importfahrzeuge mit einem oder keinem Schlüssel? Wir fertigen und lernen Schlüssel auf Ihrem Gelände oder in der Halle an, auch bei vollständigem Schlüsselverlust.',
    h1Top: 'Importfahrzeuge kommen selten mit zwei Schlüsseln herein.',
    h1Accent: 'Wir erledigen sie auf Ihrem Gelände.',
    intro:
      'Fahrzeuge von der Auktion oder aus dem Ausland kommen oft mit einem Schlüssel an, manchmal mit keinem. Wir kommen in Ihre Halle oder auf Ihr Lagergelände und fertigen die Schlüssel vor Ort — auch dann, wenn kein Schlüssel mehr existiert und das Fahrzeug von null angelernt werden muss.',
    image: {
      src: '/images/seo/autoschluessel-nachmachen-equipment.webp',
      alt: 'Diagnosetechnik zum Anlernen von Autoschlüsseln bei Import- und Exportfahrzeugen',
    },
    painTitle: 'Kommt Ihnen das bekannt vor?',
    pain: [
      'Ein Auktions- oder Importfahrzeug kommt mit einem Schlüssel an — oder mit gar keinem.',
      'Ohne funktionierenden Schlüssel können Sie das Fahrzeug nicht bewegen, nicht vorführen und nicht ausliefern.',
      'Einen Händler im Herkunftsland anzuschreiben kostet Tage und bringt selten eine schnelle Antwort.',
      'Die Fahrzeuge nehmen in der Zwischenzeit Platz auf Ihrem Gelände ein.',
    ],
    gains: [
      {
        title: 'Wir kommen in die Halle',
        text: 'Kein Transport von Fahrzeugen, die nicht fahren oder sich nicht öffnen lassen. Wir arbeiten auf Ihrem Gelände, auch bei mehreren Fahrzeugen hintereinander.',
      },
      {
        title: 'Auch bei vollständigem Schlüsselverlust',
        text: 'Kein Schlüssel vorhanden ist bei Importfahrzeugen eher die Regel als die Ausnahme. Wir öffnen schadenfrei, lesen die Schlüsseldaten aus dem Steuergerät und lernen einen neuen Schlüssel an.',
      },
      {
        title: 'Alle europäischen Marken',
        text: 'Deutsche, französische, italienische und asiatische Modelle mit Werkstatttechnik. Was nicht geht, sagen wir vorher — Mercedes FBS4 ab etwa 2013/2014 kann nur der Vertragshändler.',
      },
      {
        title: 'Fahrzeuge laufen schneller durch',
        text: 'Je früher ein Fahrzeug einen funktionierenden Schlüssel hat, desto früher kann es zur Hauptuntersuchung, bewegt und verkauft werden. Das ist der eigentliche Kostenpunkt, nicht der Schlüssel.',
      },
    ],
    steps: [
      'Sie schicken die FIN und die Anzahl der Fahrzeuge',
      'Wir bestimmen je Fahrzeug, was nötig ist und ob etwas bestellt werden muss',
      'Wir kommen vorbei und erledigen die Fahrzeuge in einem Termin',
      'Eine Rechnung je Termin, mit Aufstellung je Fahrzeug',
    ],
    faq: [
      {
        q: 'Wir haben kein Kennzeichen, nur die FIN. Geht das?',
        a: 'Ja, und das ist uns ohnehin lieber. In Deutschland gibt es kein öffentliches Register, das zu einem Kennzeichen Marke, Modell und Baujahr herausgibt — die FIN sagt uns das direkt, und bei einem noch nicht zugelassenen Importfahrzeug ist sie die einzige verlässliche Angabe. Sie steht in Feld E der Zulassungsbescheinigung oder auf dem Fahrzeug selbst.',
      },
      {
        q: 'Können Sie auch Fahrzeuge öffnen, von denen kein Schlüssel existiert?',
        a: 'Ja, das ist der Fall, für den wir am häufigsten kommen. Wir öffnen schadenfrei und lernen danach einen neuen Schlüssel an; etwaige noch existierende alte Schlüssel löschen wir aus der Wegfahrsperre.',
      },
      {
        q: 'Wie schnell können Sie bei einer größeren Partie kommen?',
        a: 'Für ein einzelnes Fahrzeug fahren wir meist am selben Tag. Bei einer größeren Partie legen wir einen Termin fest, damit die passenden Schlüssel und Geräte für diese Marken mitkommen.',
      },
    ],
  },

  // ── 4. FUHRPARK / VERMIETUNG ──────────────────────────────
  {
    slug: 'fuhrpark-und-vermietung',
    label: 'Fuhrpark & Vermietung',
    title: 'Schlüsselservice für Fuhrparks und Vermieter',
    metaTitle: 'Schlüsselservice für Fuhrpark und Vermietung',
    metaDesc:
      'Ein Transporter oder Mietwagen ohne Schlüssel steht und verdient nichts. Wir fertigen Zweitschlüssel für Ihren ganzen Fuhrpark und kommen 24/7 bei Verlust oder Störung.',
    h1Top: 'Ein Fahrzeug ohne Schlüssel verdient nichts.',
    h1Accent: 'Wir halten Ihren Fuhrpark am Fahren.',
    intro:
      'Bei Vermietung und Fuhrpark ist der Schlüssel selten der größte Kostenpunkt — der Stillstand ist es. Wir fertigen vorab Zweitschlüssel für Ihre Fahrzeuge, sodass ein Schlüsselverlust eine Sache von Minuten ist statt eines Tages aus der Vermietung. Und wenn es doch passiert, kommen wir rund um die Uhr.',
    image: {
      src: '/images/hero-mobile-van.webp',
      alt: 'Mobiles Servicefahrzeug für Schlüsselservice an Fuhrparks und Vermietern',
    },
    painTitle: 'Kommt Ihnen das bekannt vor?',
    pain: [
      'Ein Mieter gibt ohne Schlüssel zurück, oder schließt den Schlüssel auf einem Parkplatz weit weg im Fahrzeug ein.',
      'Das Fahrzeug steht und kann nicht neu vermietet werden — jeder Tag Stillstand ist entgangener Umsatz.',
      'Für Transporter, Kleinbusse und Wohnmobile ist ein Schlüssel beim Händler teuer und oft erst nach Tagen verfügbar.',
      'Von der Hälfte des Fuhrparks existiert nur ein Schlüssel, und das merkt man im falschen Moment.',
    ],
    gains: [
      {
        title: 'Zweitschlüssel, bevor es schiefgeht',
        text: 'Wir fertigen in einem Durchgang Zweitschlüssel für Ihre Fahrzeuge. Geht danach einer verloren, ist es ein Schlüssel aus der Schublade statt ein Tag aus der Vermietung.',
      },
      {
        title: '24/7 im Notfall',
        text: 'Schlüsselverlust hält sich nicht an Bürozeiten. Unsere Partner fahren auch abends und am Wochenende zum Standort des Fahrzeugs.',
      },
      {
        title: 'Wir kommen zum Fahrzeug',
        text: 'An der Niederlassung, am Standplatz oder beim Mieter am Straßenrand. Kein Abschleppen, kein Transport eines Fahrzeugs, das sich nicht öffnen lässt.',
      },
      {
        title: 'Auch Transporter, Kleinbusse und Wohnmobile',
        text: 'Größeres Material fällt bei vielen Anbietern hinten runter. Wir arbeiten an einem Sprinter oder Wohnmobil auf dieselbe Weise wie an einem Pkw.',
      },
    ],
    steps: [
      'Wir gehen den Fuhrpark gemeinsam durch: welche Fahrzeuge, welche Schlüsselarten',
      'Wir fertigen in einem oder wenigen Terminen die fehlenden Zweitschlüssel',
      'Sie erhalten eine Nummer für den Notfall, rund um die Uhr erreichbar',
      'Abrechnung je Termin oder je Zeitraum, nach Absprache',
    ],
    faq: [
      {
        q: 'Können Sie Zweitschlüssel für unseren gesamten Fuhrpark anfertigen?',
        a: 'Ja, und das ist die günstigste Reihenfolge. Schlüssel vorab anzufertigen kostet je Fahrzeug weniger als ein Noteinsatz hinterher, und es spart den Stillstand in dem Moment, in dem es schiefgeht.',
      },
      {
        q: 'Kommen Sie auch zu einem Mieter, der unterwegs ist?',
        a: 'Ja. Wir fahren zum Standort des Fahrzeugs, auch außerhalb der Bürozeiten. Nennen Sie Fahrzeug und Ort, dann bestätigen wir das Zeitfenster.',
      },
      {
        q: 'Arbeiten Sie mit festen Vereinbarungen oder je Einsatz?',
        a: 'Beides kommt vor. Manche Betriebe rufen von Fall zu Fall an, andere legen einen festen Ablauf und eine Erreichbarkeit fest. Sagen Sie, was Sie brauchen, dann sehen wir, was passt.',
      },
    ],
  },
];

export const getZakelijkSegment = (slug: string) =>
  ZAKELIJK_SEGMENTS.find((s) => s.slug === slug);
