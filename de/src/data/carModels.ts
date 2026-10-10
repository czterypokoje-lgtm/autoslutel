import { BRANDS } from '../config/brands';

// Dynamically generate CAR_MODELS from the central BRANDS config
export const CAR_MODELS: Record<string, string[]> = {};

BRANDS.forEach(brand => {
  if (brand.models && brand.models.length > 0) {
    CAR_MODELS[brand.name] = brand.models.map(m => m.name);
  } else {
    CAR_MODELS[brand.name] = ["Alle Modelle"];
  }
});

// Fallback for brands that are not in the list
CAR_MODELS["Sonstige"] = ["Anderes Modell"];

export const BRANDS_LIST = Object.keys(CAR_MODELS).map(b => b.replace(/_/g, " "));

export const SERVICES_LIST = [
  "Autoschlüssel verloren / Notschlüssel",
  "Ersatzschlüssel nachmachen",
  "Auto öffnen ohne Schlüssel",
  "Schlüssel anlernen / programmieren",
  "Transponder anlernen",
  "Keyless Go / Smart Key",
  "Zündschloss reparieren",
  "Schlüsselgehäuse wechseln",
  "Alle Schlüssel verloren",
  "Transporter- / Firmenwagenschlüssel",
  "Tesla Keycard anlernen",
  "Steuergerät klonen / Component Protection",
];

export const YEARS_LIST: string[] = Array.from({ length: 27 }, (_, i) => String(2026 - i));
