import type { VehicleFit } from '@/lib/productProfiles';

/**
 * The fitment list comes from a supplier catalogue and holds stray lines
 * ("Batterij: CR", "• Laguna II", tool instructions). Only a line that starts
 * with a car make and reads like a model is printed.
 */
const MAKE = /^(Abarth|Alfa Romeo|Aston Martin|Audi|Bentley|BMW|Buick|Cadillac|Chevrolet|Chrysler|Citro[eë]n|Cupra|Dacia|Daewoo|Daihatsu|Dodge|DS|Ferrari|Fiat|Ford|Honda|Hummer|Hyundai|Infiniti|Isuzu|Iveco|Jaguar|Jeep|Kia|Lamborghini|Lancia|Land Rover|Lexus|Lincoln|Maserati|Mazda|Mercedes(?:[- ]Benz)?|MG|Mini|Mitsubishi|Nissan|Opel|Peugeot|Polestar|Porsche|Range Rover|Renault|Rolls[- ]Royce|Rover|Saab|Seat|Skoda|Škoda|Smart|SsangYong|Subaru|Suzuki|Tesla|Toyota|Vauxhall|Volkswagen|VW|Volvo)\b/i;
export const plausibleFit = (vehicle: string) => vehicle.length <= 50 && MAKE.test(vehicle.trim()) && !/[:•]|\b(?:suitable|support|keys?|all)\b/i.test(vehicle);

const TWO_WORD_MAKE = /^(Alfa Romeo|Land Rover|Aston Martin|Rolls[- ]Royce|Mercedes[- ]Benz)\b/i;

export interface ModelRow { make?: string; model?: string; years?: string }

/**
 * The vehicle list as lines a person reads at the shelf: a make heading, then
 * one model per line with full years ("Brera  2005–2010"). Cut to the rows the
 * label has; the rest is counted and is one QR scan away on the profile.
 */
export function modelRows(fits: VehicleFit[], rows: number) {
  const byMake = new Map<string, { model: string; years: string }[]>();
  for (const fit of fits) {
    // CRM fitments (text 'crm') print as entered; catalogue lines must look like a model and carry a year.
    const crm = fit.text === 'crm';
    if (!crm && (fit.from === null || !plausibleFit(fit.vehicle))) continue;
    const make = fit.vehicle.match(TWO_WORD_MAKE)?.[1] ?? fit.vehicle.split(' ')[0];
    const model = fit.vehicle.slice(make.length).trim() || make;
    // "Audi A3 2015+" means 2015 onwards; the catalogue stored it as 2015–2015.
    const to = !crm && /\d{4}\s*\+/.test(fit.text) ? null : fit.to;
    const years = fit.from === null ? '' : `${fit.from}–${to ?? ''}`;
    const list = byMake.get(make) ?? [];
    if (!list.some((entry) => entry.model === model && entry.years === years)) list.push({ model, years });
    byMake.set(make, list);
  }
  const total = [...byMake.values()].reduce((sum, list) => sum + list.length, 0);
  const lines: ModelRow[] = [];
  let shown = 0;
  // Always a make heading: "Alfa Romeo Giulietta 940" on one line was cut to "Alfa Romeo …" next to the years.
  const headings = byMake.size > 0;
  for (const [make, list] of byMake) {
    if (headings) {
      if (lines.length + 2 > rows) break;
      lines.push({ make });
    }
    for (const entry of list) {
      if (lines.length >= rows) break;
      lines.push(headings ? entry : { model: `${make} ${entry.model}`.trim(), years: entry.years });
      shown += 1;
    }
    if (lines.length >= rows) break;
  }
  return { lines, more: total - shown };
}
