/**
 * What we cannot do, and what we can only do with a delay.
 *
 * These are real workshop limits, not marketing copy. Quoting a same-day price
 * for a job that needs a dealer-ordered key — or any price at all for a car we
 * cannot key — costs twice: once for the advertising click, and again for the
 * phone call that ends in "sorry". The same rules therefore drive the kenteken
 * wizard and the notices on the brand pages, so the site cannot say one thing
 * in one place and something else in another.
 *
 * SCENARIOS
 *
 *   'add-key'  the customer still has a working key and wants another
 *   'akl'      all keys lost, the car has to be opened and started from nothing
 *
 * These are harder than each other in that order, which is why a make can be
 * fine for one and impossible for the other.
 */

export type LimitScenario = 'add-key' | 'akl';

export type LimitVerdict =
  | { status: 'ok' }
  | {
      /** We do it, but not today. */
      status: 'lead-time';
      title: string;
      detail: string;
      /** Human-readable, e.g. "2-4 werkdagen". */
      lead: string;
    }
  | {
      /** We do not do this at all. Say so before the visitor pays for a click. */
      status: 'unavailable';
      title: string;
      detail: string;
    };

/**
 * The oldest car we take on.
 *
 * Pre-2000 vehicles are mechanical or use immobiliser generations whose tooling
 * we no longer carry.
 */
const OLDEST_YEAR = 2000;

/**
 * Mercedes FBS4.
 *
 * FBS4 keys are bound to the car in a way no aftermarket tool can reproduce:
 * neither an extra key nor all-keys-lost is possible outside the dealer
 * network. It arrived with the W222 S-Klasse in 2013 and spread through the
 * range with the W205 C-Klasse in 2014.
 *
 * The cut-off is the earlier of the two on purpose. Being too cautious costs a
 * job we might have done; being too generous means a van sent to a car that
 * cannot be keyed, with the customer waiting. If you would rather catch the
 * 2013 cars, move this to 2014 — it is deliberately one number in one place.
 */
const MERCEDES_FBS4_FROM = 2013;

/**
 * Volkswagen, all keys lost.
 *
 * ONLY all-keys-lost. An extra key alongside a working one is same-day as
 * usual — the working key is what makes that possible. With no key left the
 * replacement has to be ordered as an original through the dealer channel,
 * which is what takes the days.
 *
 * Applying this to add-key as well, as an earlier version did, quietly told
 * every VW owner wanting a spare to wait four days for a job we do while they
 * watch.
 */
const VW_AKL_ORDER_FROM = 2014;

/** Normalises RDW make strings: "MERCEDES-BENZ", "VOLKSWAGEN", "V.W." … */
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
 * @param make  as the RDW returns it
 * @param year  first registration year; anything unparseable means we stay
 *              quiet rather than guess, because a wrong "we cannot help you"
 *              loses a customer who was ready to book.
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
      title: `Bouwjaar vóór ${OLDEST_YEAR} — wij kunnen deze auto niet helpen`,
      detail:
        'Voor auto’s van vóór 2000 werken wij niet meer: het benodigde gereedschap voor die oudere systemen voeren wij niet. Een traditionele slotenmaker of de merkdealer kan u hier wel verder helpen.',
    };
  }

  if (isMercedes(make) && y >= MERCEDES_FBS4_FROM) {
    return {
      status: 'unavailable',
      title: 'Mercedes met FBS4 — alleen via de dealer',
      detail:
        'Mercedes-modellen vanaf ongeveer 2013/2014 gebruiken het FBS4-systeem. Daarbij zijn de sleutels zo aan de auto gekoppeld dat een sleutel bijmaken én alle sleutels kwijt uitsluitend door Mercedes zelf gedaan kunnen worden. Wij kunnen dit niet voor u oplossen en sturen u liever meteen door dan dat u op ons wacht.',
    };
  }

  if (isVolkswagen(make) && scenario === 'akl' && y >= VW_AKL_ORDER_FROM) {
    return {
      status: 'lead-time',
      title: 'Mogelijk, maar niet dezelfde dag',
      lead: '2-4 werkdagen',
      detail:
        'Bent u álle sleutels kwijt van een Volkswagen van dit bouwjaar, dan moet de nieuwe sleutel als origineel onderdeel bij de dealer besteld worden. Wij programmeren hem daarna gewoon bij u op locatie, maar houd rekening met 2 tot 4 werkdagen. Heeft u nog wél een werkende sleutel en wilt u er een bij? Dat doen wij gewoon dezelfde dag.',
    };
  }

  return { status: 'ok' };
}

/**
 * The limits that apply to a whole make, for the notice on a brand page.
 * Returns null when a make has nothing worth warning about.
 */
export function brandLimitNotice(make: string): { title: string; detail: string } | null {
  if (isMercedes(make)) {
    return {
      title: 'Let op: Mercedes vanaf ±2013/2014 (FBS4)',
      detail:
        'Bij Mercedes-modellen met het FBS4-systeem — grofweg vanaf bouwjaar 2013/2014 — kunnen wij géén sleutel bijmaken en geen oplossing bieden als alle sleutels kwijt zijn. Dat kan alleen de merkdealer. Voor oudere Mercedes-modellen bent u bij ons wel aan het juiste adres.',
    };
  }
  if (isVolkswagen(make)) {
    return {
      title: 'Volkswagen: sleutel bijmaken dezelfde dag, alle sleutels kwijt 2-4 werkdagen',
      detail:
        'Heeft u nog een werkende sleutel en wilt u een reservesleutel? Die maken en programmeren wij gewoon dezelfde dag bij u op locatie. Bent u vanaf bouwjaar 2014 álle sleutels kwijt, dan moet de nieuwe sleutel als origineel onderdeel bij de dealer besteld worden — reken dan op 2 tot 4 werkdagen.',
    };
  }
  return null;
}
