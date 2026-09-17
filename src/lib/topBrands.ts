/**
 * The twenty makes worth putting in front of a monteur first.
 *
 * Computed from real demand rather than guessed: every make named across the
 * jobs and leads tables, weighted jobs×3 / leads×1, because a booked job is a
 * far stronger signal of what actually turns up on the kerb than an enquiry
 * that may never have become a real car. Thirty distinct makes appear in that
 * data; these are the top twenty once the two non-cars are dropped
 * ("kenteken aanvraag" and "onbekend" are form values, not vehicles).
 *
 * Scores at the time of writing: Volkswagen 50, BMW 31, Kia 24,
 * Mercedes-Benz 24, Peugeot 22, Opel 21, Fiat 20, Toyota 19, Ford 18,
 * Renault 15, Nissan 11, Hyundai 10, then a five-way tie on 8 (Citroen,
 * Seat, Chevrolet, Volvo, Audi), Mini and Mitsubishi on 6, Mazda on 3.
 *
 * Motorcycle makes (Aprilia, Ducati) and the rare-in-NL American brands
 * (Buick, Cadillac, Chrysler, Dodge) are deliberately absent — they exist in
 * the parts catalogue but not in a single real job.
 *
 * This is a snapshot, not a live calculation: it decides screen order only,
 * and recomputing it per request would cost two table scans to move a tile.
 * Worth revisiting when the job count has grown a lot.
 */
export const TOP_BRANDS: string[] = [
  'Volkswagen',
  'BMW',
  'Kia',
  'Mercedes-Benz',
  'Peugeot',
  'Opel',
  'Fiat',
  'Toyota',
  'Ford',
  'Renault',
  'Nissan',
  'Hyundai',
  'Citroen',
  'Seat',
  'Chevrolet',
  'Volvo',
  'Audi',
  'Mini',
  'Mitsubishi',
  'Mazda',
];

const TOP_SET = new Set(TOP_BRANDS.map((b) => b.toLowerCase()));

export function isTopBrand(make: string): boolean {
  return TOP_SET.has(make.trim().toLowerCase());
}

/** Rank for sorting; anything outside the twenty sorts after all of them. */
export function brandRank(make: string): number {
  const i = TOP_BRANDS.findIndex((b) => b.toLowerCase() === make.trim().toLowerCase());
  return i === -1 ? TOP_BRANDS.length : i;
}
