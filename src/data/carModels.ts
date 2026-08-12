import { BRANDS } from '../config/brands';

// Dynamically generate CAR_MODELS from the central BRANDS config
export const CAR_MODELS: Record<string, string[]> = {};

BRANDS.forEach(brand => {
  if (brand.models && brand.models.length > 0) {
    CAR_MODELS[brand.name] = brand.models.map(m => m.name);
  } else {
    CAR_MODELS[brand.name] = ["Alle modellen"];
  }
});

// Add Overige fallback
CAR_MODELS["Overige"] = ["Anders model"];

export const BRANDS_LIST = Object.keys(CAR_MODELS).map(b => b.replace(/_/g, " "));

export const SERVICES_LIST = [
  "Autosleutel kwijt / noodsleutel",
  "Reservesleutel bijmaken",
  "Auto openen zonder sleutel",
  "Sleutel programmeren",
  "Transponder inleren",
  "Smart key / keyless entry",
  "Contactslot reparatie",
  "Sleutelbehuizing vervangen",
  "Alle sleutels kwijt",
  "Bedrijfswagen sleutel",
  "Tesla key card programmeren",
  "ECU clonen / component protection",
];

export const YEARS_LIST: string[] = Array.from({ length: 27 }, (_, i) => String(2026 - i));
