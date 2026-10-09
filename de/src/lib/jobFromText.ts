import { scenarioFromLabel, type Scenario } from './scenarios.ts';

/**
 * A job dictated in one line, for the office taking a call on a phone.
 *
 * Pipe-separated and positional rather than clever. A free-text parser that
 * guesses which word is the town and which is the car is wrong often enough
 * that the office would stop trusting it, and "wrong" here means a van driving
 * to the wrong postcode. Pipes are unambiguous, and the bot answers an empty
 * /nieuw with the template.
 *
 *   naam | telefoon | auto | postcode plaats | dienst | prijs
 *   Jan de Vries | 0612345678 | Peugeot 107 2010 | 1012AB Amsterdam | bijmaken | 150
 *
 * Everything may be blank — `| |` skips a field — because a call that gives
 * only a car and a postcode is still a job worth offering, and refusing it
 * would send the office back to the laptop they are not at.
 */

export interface ParsedJob {
  customer_name: string | null;
  customer_phone: string | null;
  car_make: string | null;
  car_model: string | null;
  car_year: number | null;
  postcode: string | null;
  city: string | null;
  service_type: string | null;
  scenario: Scenario | null;
  quoted_price: number | null;
}

export const JOB_TEMPLATE =
  'Stuur zo:\n\n' +
  '/nieuw naam | telefoon | auto | postcode plaats | dienst | prijs\n\n' +
  'Bijvoorbeeld:\n' +
  '/nieuw Jan de Vries | 0612345678 | Peugeot 107 2010 | 1012AB Amsterdam | bijmaken | 150\n\n' +
  'Alles mag leeg blijven. Minimaal een auto of een plaats.';

const clean = (value: string | undefined): string | null => {
  const trimmed = String(value ?? '').trim();
  return trimmed ? trimmed : null;
};

/** "Peugeot 107 2010" → make, model, year. The year is the last 4-digit word. */
function readCar(text: string | null): { make: string | null; model: string | null; year: number | null } {
  if (!text) return { make: null, model: null, year: null };
  const words = text.split(/\s+/).filter(Boolean);

  let year: number | null = null;
  const thisYear = new Date().getFullYear();
  const last = words[words.length - 1];
  if (last && /^\d{4}$/.test(last)) {
    const candidate = Number(last);
    /* A plausible build year only. "Golf 1600" is an engine, not a year. */
    if (candidate >= 1980 && candidate <= thisYear + 1) {
      year = candidate;
      words.pop();
    }
  }

  return {
    make: words.shift() ?? null,
    model: words.length ? words.join(' ') : null,
    year,
  };
}

/** "1012AB Amsterdam" → postcode and town, either of which may be missing. */
function readPlace(text: string | null): { postcode: string | null; city: string | null } {
  if (!text) return { postcode: null, city: null };
  const match = /\b(\d{4}\s?[a-z]{2})\b/i.exec(text);
  const postcode = match ? match[1]!.toUpperCase().replace(/\s+/g, '') : null;
  const city = clean(match ? text.replace(match[0], '') : text);
  return { postcode, city };
}

/** "150", "€ 150", "150,50" → 150 / 150.5. Null when there is no number. */
function readPrice(text: string | null): number | null {
  if (!text) return null;
  const match = /(\d{1,5}(?:[.,]\d{1,2})?)/.exec(text);
  if (!match) return null;
  const value = Number(match[1]!.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

export function parseJobLine(line: string): ParsedJob | null {
  const body = line.replace(/^\/nieuw(?:@\w+)?\s*/i, '').trim();
  if (!body) return null;

  const [name, phone, car, place, service, price] = body.split('|').map((part) => clean(part));

  const { make, model, year } = readCar(car);
  const { postcode, city } = readPlace(place);

  /* Something to drive to or something to open. Without either there is no
     job, only a name. */
  if (!make && !postcode && !city) return null;

  return {
    customer_name: name,
    customer_phone: phone,
    car_make: make,
    car_model: model,
    car_year: year,
    postcode,
    city,
    service_type: service,
    /* The same derivation the planner and the offer route use, so a job typed
       into a chat prices exactly like one typed into the CRM. */
    scenario: scenarioFromLabel(service),
    quoted_price: readPrice(price),
  };
}
