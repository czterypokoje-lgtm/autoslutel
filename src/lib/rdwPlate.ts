/**
 * Dutch licence plate lookup on RDW open data (opendata.rdw.nl, free, no key).
 *
 * Twin of claw-server/bin/plate.mjs: the same normalising and the same clean
 * JSON, so Claw (`asl plate`) and the CRM give the same answer. Keep the two in
 * step; scripts/check-rdw-plate.mts runs the same recorded fixtures.
 *
 * Plain TypeScript with no path aliases, so `node scripts/check-rdw-plate.mts`
 * can import it. RDW open data holds no owner name or address. Look a plate up
 * only when a customer or approver gave it, never in bulk.
 */
import { createHash } from 'node:crypto';

const BASE = 'https://opendata.rdw.nl/resource';
const VEHICLE_DATASET = 'm9d7-ebf2';
const FUEL_DATASET = '8ys7-d773';
const TIMEOUT_MS = 5000;
const TTL_MS = 24 * 3600_000;
const TTL_NOT_FOUND_MS = 3600_000;
const CACHE_MAX = 500;

export type RdwVehicle = {
  make: string | null;
  model: string | null;
  first_registration: string | null;
  year: number | null;
  version: { type: string | null; variant: string | null; uitvoering: string | null; type_approval: string | null };
  body: string | null;
  vehicle_kind: string | null;
  fuel: string[];
  hybrid_electric_class: string | null;
  colour: string | null;
  colour_second: string | null;
  catalogue_price: number | null;
  last_owner_change: string | null;
  apk_expiry: string | null;
  taxi: boolean | null;
  export: boolean | null;
  open_recall: boolean | null;
  key_hint: string | null;
};

export type PlateResult = {
  status: 'ok' | 'not_found';
  summary: string;
  next_actions: string[];
  retry: false;
  plate: string;
  sidecode: number | null;
  cached: boolean;
  vehicle: RdwVehicle | null;
};

export class PlateError extends Error {
  retry: boolean;
  nextActions: string[];
  httpStatus: number;
  constructor(message: string, retry: boolean, nextActions: string[], httpStatus: number) {
    super(message);
    this.retry = retry;
    this.nextActions = nextActions;
    this.httpStatus = httpStatus;
  }
}

const SIDECODES: [number, string, number[]][] = [
  [1, 'LLDDDD', [2, 2, 2]], [2, 'DDDDLL', [2, 2, 2]], [3, 'DDLLDD', [2, 2, 2]],
  [4, 'LLDDLL', [2, 2, 2]], [5, 'LLLLDD', [2, 2, 2]], [6, 'DDLLLL', [2, 2, 2]],
  [7, 'DDLLLD', [2, 3, 1]], [8, 'DLLLDD', [1, 3, 2]], [9, 'LLDDDL', [2, 3, 1]],
  [10, 'LDDDLL', [1, 3, 2]], [11, 'LLLDDL', [3, 2, 1]], [12, 'DLLDDD', [1, 2, 3]],
];
const AGAIN = ['ask the customer to type the plate again, or fall back to make, model and year'];
const shape = (p: string) => p.replace(/[A-Z]/g, 'L').replace(/[0-9]/g, 'D');

/** "ab-123-c", "AB 123 C", "ab123c" -> RDW form (6 chars, upper case) plus the usual dashes. */
export function normalizePlate(input: unknown): { plate: string; display: string; sidecode: number | null } {
  const plate = String(input ?? '').toUpperCase().replace(/[\s\-._]/g, '');
  if (!/^[A-Z0-9]{6}$/.test(plate)) {
    throw new PlateError('not a Dutch plate: needs 6 letters or digits after removing dashes and spaces', false, AGAIN, 400);
  }
  if (!/[0-9]/.test(plate) || !/[A-Z]/.test(plate)) {
    throw new PlateError('not a Dutch plate: needs both letters and digits', false, AGAIN, 400);
  }
  const hit = SIDECODES.find(([, s]) => s === shape(plate));
  let display = plate;
  if (hit) {
    let i = 0;
    display = hit[2].map((n) => { const part = plate.slice(i, i + n); i += n; return part; }).join('-');
  }
  return { plate, display, sidecode: hit ? hit[0] : null };
}

/** A short hash for logs and the audit table: the plate itself is personal-ish data. */
export const plateHash = (plate: string) => createHash('sha256').update(plate).digest('hex').slice(0, 12);

type Row = Record<string, string | undefined>;

const iso = (v?: string) => {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(v ?? '');
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};
const num = (v?: string) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const yes = (v?: string) => (v === 'Ja' ? true : v === 'Nee' ? false : null);
const text = (v?: string) => (v && v !== 'Niet geregistreerd' && v !== 'N.v.t.' ? String(v) : null);
const titleCase = (s: string | null) =>
  s ? s.toLowerCase().replace(/(^|[\s\-/])([a-zà-ÿ])/g, (_m, a: string, b: string) => a + b.toUpperCase()) : s;

/** RDW has no key data; only the fuel type supports a pointer, and only as something to check. */
export function keyHint(fuel: string[], hybridClass: string | null): string | null {
  const f = fuel.map((x) => x.toLowerCase());
  const electric = f.includes('elektriciteit') || /elektr/i.test(hybridClass ?? '');
  if (!electric) return null;
  const kind = f.length > 1 || /hybride/i.test(hybridClass ?? '') ? 'hybride' : 'elektrisch';
  return `${kind}: vaak keyless of smart key, controleer bij de klant (indicatie, geen RDW-feit)`;
}

export function normalizeVehicle(v: Row, fuelRows: Row[] = []): RdwVehicle {
  const fuel = [...new Set(fuelRows.map((f) => text(f.brandstof_omschrijving)).filter((x): x is string => !!x))];
  const hybridClass = text(fuelRows.map((f) => f.klasse_hybride_elektrisch_voertuig).find(Boolean));
  const first = iso(v.datum_eerste_toelating);
  const colours = [text(v.eerste_kleur), text(v.tweede_kleur)].filter((x): x is string => !!x);
  return {
    make: titleCase(text(v.merk)),
    model: text(v.handelsbenaming),
    first_registration: first,
    year: first ? Number(first.slice(0, 4)) : null,
    version: {
      type: text(v.type), variant: text(v.variant), uitvoering: text(v.uitvoering),
      type_approval: text(v.typegoedkeuringsnummer),
    },
    body: text(v.inrichting),
    vehicle_kind: text(v.voertuigsoort),
    fuel,
    hybrid_electric_class: hybridClass,
    colour: colours[0] ?? null,
    colour_second: colours[1] ?? null,
    catalogue_price: num(v.catalogusprijs),
    last_owner_change: iso(v.datum_tenaamstelling),
    apk_expiry: iso(v.vervaldatum_apk),
    taxi: yes(v.taxi_indicator),
    export: yes(v.export_indicator),
    open_recall: yes(v.openstaande_terugroepactie_indicator),
    key_hint: keyHint(fuel, hybridClass),
  };
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

async function getRows(url: string, fetchImpl: Fetch): Promise<Row[]> {
  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    const timeout = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
    throw new PlateError(timeout ? 'RDW did not answer in time' : 'could not reach RDW', true,
      ['retry once later', 'otherwise ask for make, model and year'], timeout ? 504 : 502);
  }
  if (res.status === 429 || res.status >= 500) {
    throw new PlateError(`RDW answered ${res.status}`, true, ['retry once later'], 502);
  }
  if (!res.ok) throw new PlateError(`RDW answered ${res.status}`, false, ['report this exact error to the owner'], 502);
  const body: unknown = await res.json();
  if (!Array.isArray(body)) throw new PlateError('RDW answer has an unexpected shape', false, ['report this exact error to the owner'], 502);
  return body as Row[];
}

/* Short in-memory cache. A serverless instance forgets it, which only costs one more RDW call. */
const cache = new Map<string, { at: number; result: PlateResult }>();

export async function lookupPlate(
  input: unknown,
  { fetchImpl = fetch as Fetch, now = Date.now, useCache = true }: { fetchImpl?: Fetch; now?: () => number; useCache?: boolean } = {}
): Promise<PlateResult> {
  const { plate, display, sidecode } = normalizePlate(input);
  const hit = useCache ? cache.get(plate) : undefined;
  if (hit && now() - hit.at < (hit.result.status === 'not_found' ? TTL_NOT_FOUND_MS : TTL_MS)) {
    return { ...hit.result, cached: true };
  }
  const q = (dataset: string) => `${BASE}/${dataset}.json?kenteken=${encodeURIComponent(plate)}&$limit=10`;
  const vRows = await getRows(q(VEHICLE_DATASET), fetchImpl);
  let result: PlateResult;
  if (!vRows.length) {
    result = {
      status: 'not_found', summary: 'No vehicle found at RDW for this plate.',
      next_actions: ['ask the customer once more for the plate', 'then fall back to make, model and year'],
      retry: false, plate: display, sidecode, cached: false, vehicle: null,
    };
  } else {
    const fRows = await getRows(q(FUEL_DATASET), fetchImpl);
    const vehicle = normalizeVehicle(vRows[0]!, fRows);
    const label = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ');
    result = {
      status: 'ok', summary: label || 'RDW record found without make or model', next_actions: [],
      retry: false, plate: display, sidecode, cached: false, vehicle,
    };
  }
  if (useCache) {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(plate, { at: now(), result });
  }
  return result;
}
