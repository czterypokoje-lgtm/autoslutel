/**
 * The colour a technician is known by, on the planning board and in the van.
 *
 * These are identity colours, not theme colours: two technicians on the same
 * afternoon have to be told apart at a glance, from across a workshop, on a
 * phone in daylight. The six below are picked to stay distinct from each other
 * and to hold their own against the CRM's near-black ground — the previous set
 * was mixed for a white page (#2c4a63, #186b4b) and went to mud on it.
 *
 * The old values are still in the database against existing technicians, so
 * they are mapped rather than migrated: nobody has to re-pick a colour, and a
 * row written before this change looks the same as one written after it.
 */

export const TECHNICIAN_COLOURS: string[] = [
  '#38bdf8', // sky
  '#fb923c', // orange
  '#34d399', // emerald
  '#c084fc', // violet
  '#fbbf24', // amber
  '#f87171', // red
];

/** What each of the old, light-page colours becomes on the dark surface. */
const LEGACY: Record<string, string> = {
  '#2c4a63': '#38bdf8',
  '#c2410c': '#fb923c',
  '#186b4b': '#34d399',
  '#6b21a8': '#c084fc',
  '#8a5804': '#fbbf24',
  '#9d201c': '#f87171',
};

export const DEFAULT_TECHNICIAN_COLOUR = TECHNICIAN_COLOURS[0];

/** The colour to paint with, whatever generation the stored value is from. */
export function technicianColour(stored: string | null | undefined): string {
  if (!stored) return DEFAULT_TECHNICIAN_COLOUR;
  return LEGACY[stored.toLowerCase()] ?? stored;
}
