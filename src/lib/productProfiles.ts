import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IS_KEYFORCARS } from '@/config/install';
import { catalogProfiles } from '@/lib/stockCatalog';

/**
 * Product profiles: what a key is and which cars it fits, one per SKU.
 *
 * On KeyForCars they come from remkeys.com, keyforcars.nl and klapsleutels.nl,
 * built by scripts/build-profiles.mjs. On Autosleutel24 there is no such
 * scrape, so they are derived from the shop's own key catalogue instead —
 * src/lib/stockCatalog.ts decides which. Either way: read on the server only
 * and on first use, because the file is a few megabytes and holds the whole
 * catalogue.
 */

export interface VehicleFit { text: string; vehicle: string; from: number | null; to: number | null }

export interface ProductFactsData {
  /** Behuizing, Transpondersleutel, Transponderchip, Sleutel / afstandsbediening, or empty. */
  kind: string;
  chips: string[];
  frequency: string[];
  /** Key blade profiles (Silca or as the shop names them). For a housing: the blade it takes. */
  blade: string[];
  buttons: string;
}

export interface ProductProfileData {
  sku: string;
  name: string;
  nameNl: string;
  image: string;
  imageLarge: string;
  brand: string;
  facts: ProductFactsData;
  specs: [string, string][];
  fits: VehicleFit[];
  links: { shop: string; url: string }[];
  ean: string[];
}

export interface ProfileHit { profile: ProductProfileData; fits: VehicleFit[] }

let cache: { all: ProductProfileData[]; bySku: Map<string, ProductProfileData>; byEan: Map<string, ProductProfileData> } | undefined;

function profiles() {
  if (!cache) {
    let all: ProductProfileData[] = [];
    try {
      // Two literal paths on purpose: Vercel's file tracer resolves path.join with string
      // literals; a spread array made it pull the whole project (322 MB of public/images)
      // into every function that imports this module.
      const file = JSON.parse(IS_KEYFORCARS
        ? readFileSync(join(process.cwd(), 'src', 'data', 'keyforcars-profiles.json'), 'utf8')
        : readFileSync(join(process.cwd(), 'src', 'lib', 'catalog.json'), 'utf8'));
      all = IS_KEYFORCARS ? (file as ProductProfileData[]) : catalogProfiles(file.products);
    } catch {
      // No profile file yet: every lookup finds nothing instead of crashing the page.
    }
    cache = {
      all,
      bySku: new Map(all.map((profile) => [profile.sku, profile])),
      byEan: new Map(all.flatMap((profile) => profile.ean.map((ean) => [ean, profile] as const))),
    };
  }
  return cache;
}

/**
 * Whatever a scanner or a camera hands over: a bare SKU, an EAN from a drawer
 * label, or a label link ending in /p/<code>.
 */
export function lookupCode(input: string) {
  const value = input.trim();
  const link = value.match(/\/p\/([^/?#\s]+)/);
  return decodeURIComponent(link ? link[1] : value).toUpperCase();
}

export function findProfile(input: string) {
  const code = lookupCode(input);
  const { bySku, byEan } = profiles();
  return bySku.get(code) ?? byEan.get(code.replace(/\D/g, '') || code);
}

const fold = (value: string) => value.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Search by SKU, EAN, name or car. Words must all appear in the name, SKU or
 * one vehicle line; a four-digit year must fall inside that line's range, so
 * "punto 2001" finds keys for a Punto built in 2001 and not one from 2010.
 */
export function searchProfiles(query: string, limit = 40): ProfileHit[] {
  const raw = query.trim();
  if (!raw) return [];
  const exact = findProfile(raw);
  const words = fold(raw).split(/\s+/).filter(Boolean);
  const year = words.map(Number).find((word) => word >= 1950 && word <= 2100);
  const terms = words.filter((word) => Number(word) !== year);
  const hits: (ProfileHit & { score: number })[] = [];

  for (const profile of profiles().all) {
    if (profile === exact) continue;
    const sku = profile.sku.toLowerCase();
    const name = fold(`${profile.sku} ${profile.name} ${profile.nameNl} ${profile.brand}`);
    const fits = profile.fits.filter((fit) => {
      const vehicle = fold(fit.text);
      if (!terms.every((term) => vehicle.includes(term))) return false;
      if (year === undefined) return true;
      return fit.from !== null && fit.from <= year && (fit.to === null || year <= fit.to);
    });
    const byName = year === undefined && terms.length > 0 && terms.every((term) => name.includes(term));
    if (!byName && !fits.length) continue;
    const score = (sku.startsWith(terms[0] ?? '\u0000') ? 0 : 2) + (byName ? 0 : 1);
    hits.push({ profile, fits: terms.length || year !== undefined ? fits : [], score });
  }

  hits.sort((a, b) => a.score - b.score || a.profile.sku.localeCompare(b.profile.sku));
  const results = hits.slice(0, limit).map(({ profile, fits }) => ({ profile, fits }));
  return exact ? [{ profile: exact, fits: [] }, ...results.slice(0, limit - 1)] : results;
}

export function profileCount() {
  const { all } = profiles();
  return { total: all.length, withFits: all.filter((profile) => profile.fits.length).length, withEan: all.filter((profile) => profile.ean.length).length };
}

export function productNamesInEnglish() {
  return Object.fromEntries(profiles().all.map(({ sku, name }) => [sku.toUpperCase(), name]));
}
