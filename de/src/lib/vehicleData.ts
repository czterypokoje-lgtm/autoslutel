import { CAR_MODELS } from '../data/carModels';

export const VEHICLE_DATA = CAR_MODELS;
export const FALLBACK_MODELS = ["Alle modellen"];

export function getYears(startYear: number = 1995, endYear: number = new Date().getFullYear()): string[] {
  const years = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y.toString());
  }
  return years;
}
