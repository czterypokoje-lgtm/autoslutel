/**
 * Was wir nicht können, und was wir nur mit Verzögerung können.
 *
 * Das sind echte Werkstattgrenzen, keine Werbetexte. Einen Preis für denselben
 * Tag zu nennen, wo der Schlüssel erst beim Händler bestellt werden muss — oder
 * überhaupt einen Preis für ein Fahrzeug, das wir nicht anlernen können —
 * kostet zweimal: einmal den Klick auf die Anzeige und einmal das Telefonat,
 * das mit "tut mir leid" endet. Dieselben Regeln steuern deshalb den Assistenten
 * im Hero und die Hinweise auf den Leistungsseiten, damit die Seite nicht an
 * einer Stelle etwas anderes sagt als an der anderen.
 *
 * SZENARIEN
 *
 *   'add-key'  der Kunde hat noch einen funktionierenden Schlüssel und will einen zweiten
 *   'akl'      alle Schlüssel verloren; das Fahrzeug muss geöffnet und von null angelernt werden
 *
 * In dieser Reihenfolge wird es schwerer, und darum kann eine Marke für das
 * eine machbar und für das andere unmöglich sein.
 */

export type LimitScenario = 'add-key' | 'akl';

export type LimitVerdict =
  | { status: 'ok' }
  | {
      /** We do it, but not today. */
      status: 'lead-time';
      title: string;
      detail: string;
      /** Für Menschen lesbar, z. B. "3-5 Werktage". */
      lead: string;
    }
  | {
      /** We do not do this at all. Say so before the visitor pays for a click. */
      status: 'unavailable';
      title: string;
      detail: string;
    };

/**
 * Das älteste Fahrzeug, das wir übernehmen.
 *
 * Fahrzeuge vor 2000 sind mechanisch oder verwenden Wegfahrsperren-Generationen,
 * deren Technik unsere Partner nicht mehr mitführen.
 */
const OLDEST_YEAR = 2000;

/**
 * Mercedes FBS4.
 *
 * FBS4-Schlüssel sind so an das Fahrzeug gebunden, dass kein Nachbaugerät das
 * reproduziert: weder ein Zweitschlüssel noch "alle Schlüssel verloren" ist
 * außerhalb des Händlernetzes möglich. Eingeführt mit der S-Klasse W222 im Jahr
 * 2013, in der Breite mit der C-Klasse W205 im Jahr 2014.
 *
 * Die Grenze ist absichtlich die früheste der beiden. Zu vorsichtig zu sein
 * kostet einen Auftrag, den wir vielleicht hätten machen können; zu großzügig
 * zu sein heißt, ein Fahrzeug anzufahren, das nicht angelernt werden kann,
 * während der Kunde wartet. Wer die 2013er doch mitnehmen will, setzt das auf
 * 2014 — es ist mit Absicht eine Zahl an einer Stelle.
 */
const MERCEDES_FBS4_FROM = 2013;

/**
 * Volkswagen, alle Schlüssel verloren.
 *
 * NUR dieser Fall. Ein Zweitschlüssel neben einem funktionierenden ist wie
 * immer eine Sache desselben Tages — der vorhandene Schlüssel ist, was das
 * möglich macht. Ohne jeden Schlüssel muss der Ersatz als Originalteil über
 * den Händlerkanal bestellt werden, und das sind die Tage.
 *
 * Das auch auf den Zweitschlüssel anzuwenden, wie eine frühere Fassung es tat,
 * sagte jedem VW-Fahrer, der einen Ersatz wollte, er solle Tage warten — für
 * eine Arbeit, die er zusehen kann.
 */
const VW_AKL_ORDER_FROM = 2014;

/** Normalisiert Markennamen: "MERCEDES-BENZ", "VOLKSWAGEN", "V.W." … */
function normaliseMake(make: string): string {
  return make
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}

function isMercedes(make: string): boolean {
  const m = normaliseMake(make);
  return m.startsWith('mercedes') || m === 'mb';
}

function isVolkswagen(make: string): boolean {
  const m = normaliseMake(make);
  return m.startsWith('volkswagen') || m === 'vw';
}

/**
 * @param make  wie der Besucher sie angegeben hat
 * @param year  Baujahr; ist es nicht lesbar, schweigen wir statt zu raten —
 *              ein falsches "wir können Ihnen nicht helfen" verliert einen
 *              Kunden, der buchen wollte.
 */
export function serviceLimit(
  make: string | null | undefined,
  year: string | number | null | undefined,
  scenario: LimitScenario,
): LimitVerdict {
  if (!make) return { status: 'ok' };

  const y = typeof year === 'number' ? year : parseInt(String(year ?? ''), 10);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return { status: 'ok' };

  if (y < OLDEST_YEAR) {
    return {
      status: 'unavailable',
      title: `Baujahr vor ${OLDEST_YEAR} — dieses Fahrzeug können wir nicht übernehmen`,
      detail:
        'Für Fahrzeuge vor 2000 führen unsere Partner die Technik nicht mehr mit. Ein klassischer Schlüsseldienst mit mechanischer Fräse oder der Vertragshändler kann Ihnen hier weiterhelfen — wir sagen es lieber jetzt als nach der Anfahrt.',
    };
  }

  if (isMercedes(make) && y >= MERCEDES_FBS4_FROM) {
    return {
      status: 'unavailable',
      title: 'Mercedes mit FBS4 — nur über den Vertragshändler',
      detail:
        'Mercedes-Modelle ab etwa 2013/2014 verwenden FBS4. Dabei sind die Schlüssel so an das Fahrzeug gebunden, dass weder ein Zweitschlüssel noch der Fall "alle Schlüssel verloren" außerhalb des Händlernetzes möglich ist. Das können wir nicht lösen, und wir schicken Sie lieber gleich weiter, als dass Sie auf uns warten.',
    };
  }

  if (isVolkswagen(make) && scenario === 'akl' && y >= VW_AKL_ORDER_FROM) {
    return {
      status: 'lead-time',
      title: 'Machbar, aber nicht am selben Tag',
      lead: '3-5 Werktage',
      detail:
        'Sind bei einem Volkswagen dieses Baujahrs ALLE Schlüssel verloren, muss der neue Schlüssel als Originalteil über den Händlerkanal bestellt werden und der Hersteller eine Online-Freigabe erteilen. Angelernt wird er danach bei Ihnen vor Ort, aber rechnen Sie mit 3 bis 5 Werktagen. Haben Sie noch einen funktionierenden Schlüssel und wollen einen zweiten? Das erledigen wir am selben Tag.',
    };
  }

  return { status: 'ok' };
}

/**
 * Die Grenzen, die für eine ganze Marke gelten — für den Hinweis auf einer
 * Markenseite. Gibt null zurück, wenn es bei einer Marke nichts zu warnen gibt.
 */
export function brandLimitNotice(make: string): { title: string; detail: string } | null {
  if (isMercedes(make)) {
    return {
      title: 'Achtung: Mercedes ab etwa 2013/2014 (FBS4)',
      detail:
        'Bei Mercedes-Modellen mit FBS4 — grob ab Baujahr 2013/2014 — können wir weder einen Schlüssel nachmachen noch den Fall "alle Schlüssel verloren" lösen. Das kann nur der Vertragshändler. Für ältere Mercedes-Modelle sind Sie bei uns richtig.',
    };
  }
  if (isVolkswagen(make)) {
    return {
      title: 'Volkswagen: Zweitschlüssel am selben Tag, alle Schlüssel verloren 3-5 Werktage',
      detail:
        'Haben Sie noch einen funktionierenden Schlüssel und wollen einen Zweitschlüssel? Den fertigen und lernen wir am selben Tag bei Ihnen vor Ort an. Sind ab Baujahr 2014 ALLE Schlüssel verloren, muss der neue Schlüssel als Originalteil bestellt und vom Hersteller freigegeben werden — rechnen Sie dann mit 3 bis 5 Werktagen.',
    };
  }
  return null;
}
