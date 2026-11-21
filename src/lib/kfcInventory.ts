import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { readPhoto, writePhoto } from '@/lib/kfcStockStore';
import { getCrmUser, seesPrices, type CrmUser } from '@/lib/crmSession';
import type { StockArticle, StockBatch, StockBin, StockMove, StockState } from '@/lib/keyforcarsStock';
import catalog from '@/data/keyforcars-stock.json';
import { ARTICLE_CODE, WORKSHOP_PREFIX } from '@/lib/stockCatalog';

/*
 * The KeyForCars stock ledger (migration 0090) behind the existing stock UI.
 *
 * The screens still speak StockState: workshop articles, bins, moves, photos,
 * batches. This module assembles that shape from kfc_articles, kfc_locations,
 * kfc_stock_levels and kfc_stock_moves, and turns every write into one RPC
 * call, so the server computes quantity-after under a row lock and the phone
 * never sends a delta it worked out from a stale screen. The old one-row JSON
 * record (kfc_stock_state) stays for CRM_PREVIEW and the ?demo=1 screen only.
 *
 * Prices: moves carry unit_cost_cents. A warehouse or picker user gets the
 * same payload with every amount removed (stripPrices), so hiding is done
 * where the data leaves the server, not in the component.
 */

export type Position = { article_code: string; physical: number; unusable: number; reserved: number; available: number; incoming: number };

const admin = () => createSupabaseAdminClient();
const binCode = /^[A-Z0-9-]{1,24}$/;
const articleCode = ARTICLE_CODE; // KFC-… on KeyForCars, AS24-… on Autosleutel24 (src/lib/stockCatalog.ts)
const MOVE_LIMIT = 2000;

/** Thrown by the RPCs; mapped to the messages the UI already shows. */
const RPC_MESSAGES: Record<string, [string, number]> = {
  KFC_INSUFFICIENT: ['Onvoldoende voorraad op deze locatie.', 409],
  KFC_HAS_LOCATED_STOCK: ['Dit artikel heeft getelde voorraad. Kies een locatie en bak.', 409],
  KFC_LOCATION_REQUIRED: ['Kies een locatie en bak.', 400],
  KFC_NOT_SHIPPED: ['Deze regel is nog niet verzonden.', 409],
  KFC_RETURN_EXCEEDS: ['Het aantal is hoger dan het aantal dat nog retour kan.', 409],
  KFC_NO_ORDER_LINE: ['Bestelregel niet gevonden.', 404],
  KFC_ZERO_MOVE: ['Het aantal is nul.', 400],
  KFC_BAD_TRANSFER: ['Kies een andere geldige bestemming.', 400],
  KFC_NEGATIVE_COUNT: ['Een telling kan niet negatief zijn.', 400],
  KFC_PART_IS_OUTPUT: ['Het product kan niet ook een onderdeel zijn.', 400],
  KFC_NO_COMPONENTS: ['Voeg minstens één onderdeel toe.', 400],
  KFC_UNKNOWN_ARTICLE: ['Onbekend artikel.', 400],
  KFC_BAD_LABOUR: ['Controleer het arbeidsloon.', 400],
  kfc_count_photos_pkey: ['Een of meer foto\'s zijn al eerder geteld. Haal ze uit de selectie.', 409],
};

export class StockError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function rpcError(error: { message: string }): StockError {
  for (const [code, [message, status]] of Object.entries(RPC_MESSAGES)) {
    if (error.message.includes(code)) return new StockError(message, status);
  }
  return new StockError(`Voorraad boeken mislukt: ${error.message}`, 500);
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

type LocationRow = { id: string; shelf: string; box: string; kind: string };

async function locations(): Promise<Map<string, LocationRow>> {
  const { data, error } = await admin().from('kfc_locations').select('id, shelf, box, kind').eq('warehouse', 'main');
  if (error) throw new StockError(`Locaties lezen mislukt: ${error.message}`, 500);
  return new Map((data as LocationRow[]).map((row) => [row.id, row]));
}

export async function returnLocations() {
  return [...(await locations()).values()].filter((location) => location.kind === 'shelf')
    .sort((a, b) => a.shelf.localeCompare(b.shelf) || a.box.localeCompare(b.box));
}

export async function returnShopLine(line: string, quantity: number, location: string, key: string, user: CrmUser) {
  if ((await locations()).get(location)?.kind !== 'shelf') throw new StockError('Kies een geldige retourlocatie.');
  const { error } = await admin().rpc('kfc_return_line', {
    p_line: line, p_quantity: quantity, p_location: location,
    p_key: ['return', line, key].join('-'), p_created_by: user.id,
  });
  if (error) throw rpcError(error);
}

/** The whole record in the shape the screens already render. */
export async function loadState(user: CrmUser): Promise<StockState> {
  const db = admin();
  const [locs, workshop, levels, moves, photos, batches] = await Promise.all([
    locations(),
    db.from('kfc_articles').select('code, name, sku, image, category').like('code', `${WORKSHOP_PREFIX}%`).order('code'),
    db.from('kfc_stock_levels').select('article_code, location_id, quantity, minimum'),
    db.from('kfc_stock_moves')
      .select('article_code, location_id, delta, quantity_after, unit_cost_cents, reason, sales_invoice_id, count_batch_id, note, photo_path, created_at, idempotency_key')
      .order('created_at', { ascending: false }).limit(MOVE_LIMIT),
    db.from('kfc_articles').select('code, photo_version').not('photo_version', 'is', null),
    db.from('kfc_count_batches').select('id, line_count, created_at, kfc_count_photos (sha256)').order('created_at', { ascending: false }).limit(500),
  ]);
  for (const result of [workshop, levels, moves, photos, batches]) {
    if (result.error) throw new StockError(`Voorraad lezen mislukt: ${result.error.message}`, 500);
  }
  const at = (id: string | null) => (id ? locs.get(id) : undefined);
  const state: StockState = {
    workshop: (workshop.data ?? []).map((row) => ({ id: row.code, name: row.name, sku: row.sku, image: row.image, category: row.category, sources: [] }) as StockArticle),
    bins: (levels.data ?? []).map((row): StockBin => ({
      article: row.article_code, shelf: at(row.location_id)?.shelf ?? '', box: at(row.location_id)?.box ?? '',
      quantity: row.quantity, minimum: row.minimum,
    })),
    moves: (moves.data ?? []).map((row): StockMove => {
      const loc = at(row.location_id);
      const move: StockMove = {
        id: row.idempotency_key, article: row.article_code, operation: row.reason === 'received' ? 'receive' : row.reason,
        shelf: loc?.shelf ?? '', box: loc?.box ?? '', delta: row.delta, after: row.quantity_after, time: row.created_at,
      };
      if (row.photo_path) move.photo = true;
      if (row.note) move.note = row.note;
      if (row.unit_cost_cents !== null) move.amountCents = row.unit_cost_cents * Math.abs(row.delta);
      if (row.sales_invoice_id) move.invoiceId = row.sales_invoice_id;
      if (row.count_batch_id) move.batch = row.count_batch_id;
      return move;
    }),
    photos: Object.fromEntries((photos.data ?? []).map((row) => [row.code, row.photo_version as string])),
    batches: (batches.data ?? []).map((row): StockBatch => ({
      id: row.id, time: row.created_at, lines: row.line_count,
      photos: ((row.kfc_count_photos as { sha256: string }[] | null) ?? []).map((p) => p.sha256),
    })),
  };
  return seesPrices(user) ? state : stripPrices(state);
}

function stripPrices(state: StockState): StockState {
  return { ...state, moves: state.moves.map((move) => { const { amountCents, ...rest } = move; void amountCents; return rest; }) };
}

/** Physical · unusable · reserved · available · incoming, for articles that have any of them. */
export async function positions(): Promise<Position[]> {
  const { data, error } = await admin().from('kfc_stock_position').select('*')
    .or('physical.neq.0,reserved.neq.0,incoming.neq.0');
  if (error) throw new StockError(`Voorraadstanden lezen mislukt: ${error.message}`, 500);
  return data as Position[];
}

export async function articleExists(code: string): Promise<boolean> {
  const { data } = await admin().from('kfc_articles').select('code').eq('code', code).maybeSingle();
  return !!data;
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

async function locationId(shelf: string, box: string, create: boolean): Promise<string | null> {
  const db = admin();
  const found = await db.from('kfc_locations').select('id').eq('warehouse', 'main').eq('shelf', shelf).eq('box', box).maybeSingle();
  if (found.data) return found.data.id;
  if (!create) return null;
  const made = await db.from('kfc_locations').insert({ warehouse: 'main', shelf, box }).select('id').single();
  if (made.error) throw new StockError(`Locatie aanmaken mislukt: ${made.error.message}`, 500);
  return made.data.id;
}

async function levelExists(article: string, location: string): Promise<boolean> {
  const { data } = await admin().from('kfc_stock_levels').select('article_code').eq('article_code', article).eq('location_id', location).maybeSingle();
  return !!data;
}

export interface MovementInput {
  article: string; operation: string; shelf: string; box: string; quantity: number; minimum: number;
  destinationShelf?: string; destinationBox?: string; note?: string; amountCents?: number; invoiceId?: string;
  image?: Uint8Array; key: string;
}

/**
 * One booking from the stock form, with the validation the JSON version did.
 * `key` is the client's mutationId: a retry with the same key returns the move
 * already booked, a retry with different content is refused by the RPC's
 * unique key.
 */
export async function bookMovement(input: MovementInput, user: CrmUser): Promise<StockMove | null> {
  const { article, operation, shelf, box, quantity, minimum } = input;
  const unlocated = shelf === '' && box === '' && ['receive', 'issue', 'sale', 'return'].includes(operation);
  if (!['count', 'receive', 'issue', 'sale', 'return', 'transfer'].includes(operation) || !articleCode.test(article) ||
      (!unlocated && (!binCode.test(shelf) || !binCode.test(box))) ||
      !Number.isSafeInteger(quantity) || quantity < (operation === 'count' ? 0 : 1) || quantity > 1_000_000 ||
      !Number.isSafeInteger(minimum) || minimum < 0 || minimum > 1_000_000) {
    throw new StockError('Controleer artikel, locatie, bakcode en aantallen.');
  }
  if (!(await articleExists(article))) throw new StockError('Onbekend artikel.');
  const photoPath = input.image ? `stock-${input.key}.jpg` : null;
  const unitCost = input.amountCents !== undefined && quantity > 0 ? Math.round(input.amountCents / quantity) : null;
  const db = admin();

  if (operation === 'count') {
    const location = await locationId(shelf, box, true);
    if (input.image) await writePhoto(photoPath!, input.image);
    const { data, error } = await db.rpc('kfc_count_bin', {
      p_article: article, p_location: location, p_counted: quantity, p_minimum: minimum, p_key: input.key,
      p_created_by: user.id, p_note: input.note || null, p_photo_path: photoPath,
    });
    if (error) throw rpcError(error);
    return data ? toMove(data, shelf, box) : null;
  }

  if (operation === 'transfer') {
    const { destinationShelf = '', destinationBox = '' } = input;
    if (!binCode.test(destinationShelf) || !binCode.test(destinationBox) || (destinationShelf === shelf && destinationBox === box)) {
      throw new StockError('Kies een andere geldige bestemming.');
    }
    const [from, to] = await Promise.all([locationId(shelf, box, false), locationId(destinationShelf, destinationBox, false)]);
    if (!from || !(await levelExists(article, from))) throw new StockError('Tel deze locatie eerst.', 409);
    if (!to || !(await levelExists(article, to))) throw new StockError('Tel de bestemming eerst, ook als deze leeg is.', 409);
    const { error } = await db.rpc('kfc_transfer', { p_article: article, p_from: from, p_to: to, p_quantity: quantity, p_key: input.key, p_created_by: user.id, p_note: input.note || null });
    if (error) throw rpcError(error);
    const { data } = await db.from('kfc_stock_moves').select('*').eq('idempotency_key', `${input.key}:out`).single();
    return data ? toMove(data, shelf, box) : null;
  }

  let location: string | null = null;
  if (!unlocated) {
    location = await locationId(shelf, box, false);
    if (!location || !(await levelExists(article, location))) throw new StockError('Tel deze locatie eerst.', 409);
  }
  const outgoing = operation === 'issue' || operation === 'sale';
  if (input.image) await writePhoto(photoPath!, input.image);
  const { data, error } = await db.rpc('kfc_book_move', {
    p_article: article, p_location: location, p_delta: outgoing ? -quantity : quantity,
    p_reason: operation === 'receive' ? 'received' : operation, p_key: input.key,
    p_unit_cost_cents: unitCost, p_note: input.note || null, p_photo_path: photoPath, p_created_by: user.id,
    p_sales_invoice_id: input.invoiceId ?? null,
  });
  if (error) throw rpcError(error);
  return toMove(data, shelf, box);
}

function toMove(row: Record<string, unknown>, shelf: string, box: string): StockMove {
  const move: StockMove = {
    id: row.idempotency_key as string, article: row.article_code as string,
    operation: row.reason === 'received' ? 'receive' : (row.reason as string), shelf, box,
    delta: row.delta as number, after: (row.quantity_after as number | null), time: row.created_at as string,
  };
  if (row.photo_path) move.photo = true;
  if (row.note) move.note = row.note as string;
  if (row.unit_cost_cents !== null && row.unit_cost_cents !== undefined) move.amountCents = (row.unit_cost_cents as number) * Math.abs(move.delta);
  if (row.sales_invoice_id) move.invoiceId = row.sales_invoice_id as string;
  if (row.count_batch_id) move.batch = row.count_batch_id as string;
  return move;
}

/** Bulk photo count: lines are (article, shelf, box, quantity); every line or none. */
export async function bulkCount(batchId: string, photos: string[], lines: { article: string; shelf: string; box: string; quantity: number }[], user: CrmUser): Promise<number> {
  const mapped = [];
  for (const line of lines) {
    if (!(await articleExists(line.article))) throw new StockError(`Onbekend artikel ${line.article}.`);
    mapped.push({ article: line.article, location: await locationId(line.shelf, line.box, true), quantity: line.quantity });
  }
  const { data, error } = await admin().rpc('kfc_bulk_count', { p_batch_id: batchId, p_photos: photos, p_lines: mapped, p_created_by: user.id });
  if (error) throw rpcError(error);
  return data as number;
}

/** A workshop article made on the spot (no shop listing): KFC-3-<n>. */
/** An article whose code, SKU or EAN is exactly this scan, or null. Case-insensitive for code and SKU. */
export async function findArticlesByScan(scan: string) {
  const key = scan.trim();
  if (!key || key.length > 80) return [];
  const db = admin();
  const query = () => db.from('kfc_articles').select('code, name, sku, tracking');
  const exact = key.replace(/[\\%_]/g, (char) => '\\' + char);
  const results = await Promise.all([query().ilike('code', exact), query().ilike('sku', exact), query().contains('ean', [key]), query().ilike('supplier_ref', exact)]);
  const matches = new Map<string, { id: string; name: string; sku: string; tracking: string }>();
  for (const result of results) {
    if (result.error) throw new StockError('Artikelen zoeken mislukt.', 500);
    for (const row of result.data) matches.set(row.code, { id: row.code, name: row.name, sku: row.sku ?? '', tracking: row.tracking });
  }
  return [...matches.values()];
}

/**
 * A new workshop article, opened once: an existing article with the same SKU or
 * EAN is returned instead of a second card (spec S2). The code takes the highest
 * number in use + 1, not the row count, so a deleted card cannot cause a clash.
 */
export type ArticleCondition = 'new' | 'opened' | 'used';

export async function newArticle(name: string, sku: string, ean: string | null = null, condition: ArticleCondition = 'new', ref = '', category = 'Werkplaats', tracking = condition === 'used' ? 'serial' : 'quantity', cost: number | null = null): Promise<string> {
  const { data: code, error } = await admin().rpc('kfc_quick_article_details', {
    p_prefix: WORKSHOP_PREFIX, p_name: name, p_sku: sku, p_ean: ean, p_condition: condition, p_ref: ref, p_category: category, p_tracking: tracking, p_cost: cost,
  });
  if (error?.message.includes('KFC_AMBIGUOUS_CARD')) throw new StockError('Meerdere artikelen gevonden. Kies een artikel.', 409);
  if (error) throw new StockError('Artikel aanmaken mislukt.', 500);
  return code;
}

export async function setArticlePhoto(code: string, image: Uint8Array): Promise<void> {
  if (!(await articleExists(code))) throw new StockError('Onbekend artikel.');
  await writePhoto(`${code}.jpg`, image);
  const { error } = await admin().from('kfc_articles').update({ photo_version: `${Date.now()}`, updated_at: new Date().toISOString() }).eq('code', code);
  if (error) throw new StockError(`Foto opslaan mislukt: ${error.message}`, 500);
}

export async function movementPhoto(key: string): Promise<Uint8Array | null> {
  const { data } = await admin().from('kfc_stock_moves').select('photo_path').eq('idempotency_key', key).maybeSingle();
  return data?.photo_path ? readPhoto(data.photo_path) : null;
}

export async function articlePhoto(code: string): Promise<Uint8Array | null> {
  const { data } = await admin().from('kfc_articles').select('photo_version').eq('code', code).maybeSingle();
  return data?.photo_version ? readPhoto(`${code}.jpg`) : null;
}

/** Same fingerprint rule as the JSON version, so a reused mutationId with other content is caught. */
export const requestFingerprint = (parts: unknown[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex');
export const newKey = () => randomUUID();
export { getCrmUser };

// ---------------------------------------------------------------------------
// Route handlers, same contract as the JSON version in voorraad-local/route.ts
// ---------------------------------------------------------------------------

const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const jpeg = (image: Uint8Array) => new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

/** A base64 JPEG from the form, or a StockError. */
function decodeJpeg(photo: unknown, max: number): Uint8Array {
  if (typeof photo !== 'string' || photo.length > max || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo)) throw new StockError('Kies een kleinere geldige foto.');
  const image = Buffer.from(photo, 'base64');
  if (image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9) throw new StockError('Gebruik een geldige JPEG-foto.');
  return image;
}

export async function kfcGet(query: URLSearchParams): Promise<Response> {
  const user = await getCrmUser();
  if (!user) return reply({ error: 'Niet ingelogd' }, 401);
  try {
    const movement = query.get('movement');
    if (movement) {
      if (!uuid.test(movement)) return reply({}, 404);
      const image = await movementPhoto(movement);
      return image ? jpeg(image) : reply({}, 404);
    }
    const photo = query.get('foto');
    if (photo) {
      if (!articleCode.test(photo)) return reply({}, 404);
      const image = await articlePhoto(photo);
      return image ? jpeg(image) : reply({}, 404);
    }
    const state = await loadState(user);
    const wantPositions = query.get('positions') === '1';
    const wantCatalog = query.get('movementCatalog') === '1';
    if (!wantPositions && !wantCatalog) return reply(state);
    const used = new Set(state.moves.map((move) => move.article));
    return reply({
      state,
      ...(wantPositions ? { positions: await positions() } : {}),
      ...(wantCatalog ? { catalog: catalog.filter((article) => used.has(article.id)) } : {}),
    });
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}

export async function kfcPost(input: Record<string, unknown>): Promise<Response> {
  const user = await getCrmUser();
  if (!user) return reply({ error: 'Niet ingelogd' }, 401);
  try {
    if (input.operation === 'photo') {
      if (typeof input.article !== 'string' || !articleCode.test(input.article)) throw new StockError('Onbekend artikel.');
      await setArticlePhoto(input.article, decodeJpeg(input.photo, 240_000));
      return reply({ state: await loadState(user) });
    }
    if (input.operation === 'new') {
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      const sku = typeof input.sku === 'string' ? input.sku.trim() : '';
      if (!name || name.length > 180 || sku.length > 80) throw new StockError('Controleer de artikelnaam en SKU.');
      const id = await newArticle(name, sku);
      return reply({ state: await loadState(user), id });
    }
    if (input.operation === 'bulkCount') {
      const { batchId, photos, lines } = input;
      if (typeof batchId !== 'string' || !uuid.test(batchId)) throw new StockError('Ongeldige tellingreferentie.');
      if (!Array.isArray(photos) || photos.length > 300 || !photos.every((hash) => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash))) throw new StockError('Ongeldige fotolijst.');
      if (!Array.isArray(lines) || !lines.length || lines.length > 500) throw new StockError('Tussen 1 en 500 regels per telling.');
      const seen = new Set<string>();
      const clean = lines.map((line) => {
        const { article, shelf, box, quantity } = (line ?? {}) as Record<string, unknown>;
        if (typeof article !== 'string' || !articleCode.test(article) || typeof shelf !== 'string' || typeof box !== 'string' ||
            !binCode.test(shelf) || !binCode.test(box) || typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 1_000_000) {
          throw new StockError(`Controleer artikel, locatie en aantal bij ${String(article).slice(0, 40)}.`);
        }
        const key = `${article}/${shelf}/${box}`;
        if (seen.has(key)) throw new StockError(`Dubbele regel voor ${article} op ${shelf} · ${box}.`);
        seen.add(key);
        return { article, shelf, box, quantity };
      });
      const saved = await bulkCount(batchId, photos as string[], clean, user);
      const state = await loadState(user);
      return saved === 0 ? reply({ state, duplicate: true }) : reply({ state, saved });
    }

    const requestedId = input.mutationId;
    if (requestedId !== undefined && (typeof requestedId !== 'string' || !uuid.test(requestedId))) throw new StockError('Ongeldige boekingsreferentie.');
    const note = typeof input.note === 'string' ? input.note.trim() : '';
    if (note.length > 500) throw new StockError('De notitie is te lang.');
    const amountCents = input.amountCents;
    if (amountCents !== undefined && ((input.operation !== 'sale' && input.operation !== 'receive') ||
      typeof amountCents !== 'number' || !Number.isSafeInteger(amountCents) || amountCents < 0 || amountCents > 100_000_000)) {
      throw new StockError('Controleer het bedrag in euro.');
    }
    const invoiceId = input.invoiceId;
    if (invoiceId !== undefined && (input.operation !== 'sale' || typeof invoiceId !== 'string' || !uuid.test(invoiceId))) throw new StockError('Ongeldige factuur-ID.');
    if (typeof invoiceId === 'string') {
      const invoice = await admin().from('sales_invoices').select('id').eq('id', invoiceId).maybeSingle();
      if (invoice.error) throw new StockError('De factuur kon niet worden gecontroleerd.', 503);
      if (!invoice.data) throw new StockError('Factuur niet gevonden.', 404);
    }
    const image = input.photo === undefined ? undefined : decodeJpeg(input.photo, 400_000);
    const str = (value: unknown) => (typeof value === 'string' ? value : '');
    const movement = await bookMovement({
      article: str(input.article), operation: str(input.operation), shelf: str(input.shelf), box: str(input.box),
      quantity: Number(input.quantity), minimum: Number(input.minimum ?? 0),
      destinationShelf: str(input.destinationShelf), destinationBox: str(input.destinationBox),
      note, amountCents: amountCents as number | undefined, invoiceId: invoiceId as string | undefined,
      image, key: typeof requestedId === 'string' ? requestedId : newKey(),
    }, user);
    return reply({ state: await loadState(user), movement });
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Purchasing: what is on order at the supplier. Feeds Incoming; receiving by
// scan is the only writer of 'received' moves.
// ---------------------------------------------------------------------------

export interface PurchaseLine { photos: number[]; id: string; article_code: string; name: string; sku: string; quantity: number; received: number; unit_cost_cents: number | null }
export interface PurchaseOrder {
  id: string; supplier: string; status: 'draft' | 'ordered' | 'received' | 'cancelled'; expected_on: string | null;
  note: string | null; created_at: string; ordered_at: string | null; received_at: string | null; lines: PurchaseLine[];
  /** The supplier's invoice number, and whether its PDF/photo is attached (0111). */
  invoice_ref: string | null; document_type: string | null;
}

export async function listPurchaseOrders(user: CrmUser): Promise<PurchaseOrder[]> {
  const { data, error } = await admin().from('kfc_purchase_orders')
    .select('id, supplier, status, expected_on, note, created_at, ordered_at, received_at, invoice_ref, document_type, kfc_purchase_order_lines (id, article_code, quantity, received, unit_cost_cents, kfc_stock_moves(id,kfc_receipt_photos(move_id)), kfc_articles (name, sku))')
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw new StockError(`Inkooporders lezen mislukt: ${error.message}`, 500);
  const prices = seesPrices(user);
  return (data ?? []).map((row) => {
    const lines = (row.kfc_purchase_order_lines as unknown as { kfc_stock_moves: { id: number; kfc_receipt_photos: { move_id: number } | null }[]; id: string; article_code: string; quantity: number; received: number; unit_cost_cents: number | null; kfc_articles: { name: string; sku: string } | null }[]) ?? [];
    return {
      id: row.id, supplier: row.supplier, status: row.status, expected_on: row.expected_on, note: row.note,
      created_at: row.created_at, ordered_at: row.ordered_at, received_at: row.received_at,
      invoice_ref: row.invoice_ref ?? null, document_type: row.document_type ?? null,
      lines: lines.map((line) => ({
        photos: line.kfc_stock_moves.filter(move => move.kfc_receipt_photos?.move_id).map(move => move.id), id: line.id, article_code: line.article_code, name: line.kfc_articles?.name ?? line.article_code, sku: line.kfc_articles?.sku ?? '',
        quantity: line.quantity, received: line.received, unit_cost_cents: prices ? line.unit_cost_cents : null,
      })),
    };
  });
}

export interface NewPurchaseOrder { supplier: string; expected_on?: string | null; note?: string | null; invoice_ref?: string | null; lines: { article: string; quantity: number; unit_cost_cents?: number | null }[] }

const cleanInvoiceRef = (value: string | null | undefined) => {
  const ref = (value ?? '').trim();
  if (ref.length > 80) throw new StockError('Factuurnummer is te lang (max. 80 tekens).');
  return ref || null;
};

/** A draft purchase order. `article` may be the code (KFC-1-…) or the SKU. */
export async function createPurchaseOrder(input: NewPurchaseOrder, user: CrmUser): Promise<string> {
  const supplier = input.supplier.trim();
  if (!supplier || supplier.length > 120) throw new StockError('Vul de leverancier in.');
  if (input.expected_on && !/^\d{4}-\d{2}-\d{2}$/.test(input.expected_on)) throw new StockError('Controleer de verwachte datum.');
  if (!input.lines.length || input.lines.length > 200) throw new StockError('Tussen 1 en 200 regels per inkooporder.');
  const db = admin();
  const lines = [];
  for (const line of input.lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 100_000) throw new StockError('Controleer de aantallen.');
    if (line.unit_cost_cents != null && (!Number.isSafeInteger(line.unit_cost_cents) || line.unit_cost_cents < 0 || line.unit_cost_cents > 100_000_000)) throw new StockError('Controleer de inkoopprijs.');
    const key = line.article.trim().toUpperCase();
    const found = await db.from('kfc_articles').select('code').or(`code.eq.${key},sku.eq.${key}`).limit(2);
    if (found.error || found.data?.length !== 1) throw new StockError(`Artikel ${key} niet eenduidig gevonden.`);
    lines.push({ article_code: found.data[0].code, quantity: line.quantity, unit_cost_cents: line.unit_cost_cents ?? null });
  }
  const invoice_ref = cleanInvoiceRef(input.invoice_ref);
  const po = await db.from('kfc_purchase_orders').insert({ supplier, expected_on: input.expected_on || null, note: input.note?.trim() || null, invoice_ref, created_by: user.id }).select('id').single();
  if (po.error) throw new StockError(`Inkooporder aanmaken mislukt: ${po.error.message}`, 500);
  const inserted = await db.from('kfc_purchase_order_lines').insert(lines.map((line) => ({ ...line, po_id: po.data.id })));
  if (inserted.error) throw new StockError(`Regels opslaan mislukt: ${inserted.error.message}`, 500);
  return po.data.id;
}

export async function setPurchaseOrderStatus(id: string, status: 'ordered' | 'cancelled'): Promise<void> {
  const db = admin();
  const current = await db.from('kfc_purchase_orders').select('status').eq('id', id).maybeSingle();
  if (!current.data) throw new StockError('Inkooporder niet gevonden.', 404);
  if (current.data.status !== 'draft') throw new StockError('Alleen een concept kan besteld of geannuleerd worden.', 409);
  const { error } = await db.from('kfc_purchase_orders')
    .update(status === 'ordered' ? { status, ordered_at: new Date().toISOString() } : { status }).eq('id', id);
  if (error) throw new StockError(`Status wijzigen mislukt: ${error.message}`, 500);
}

// ---------------------------------------------------------------------------
// Assembly (0112, spec S3): parts off their shelves, one product onto its shelf,
// in one database transaction. Cost = parts + labour; unknown part cost → null.
// ---------------------------------------------------------------------------

export interface AssemblyInput {
  output: string; shelf: string; box: string; quantity: number; labour_cents: number; note?: string | null; key: string;
  components: { article: string; shelf: string; box: string; quantity: number }[];
}
export interface AssemblyRow {
  id: string; output_article: string; output_name: string; quantity: number; labour_cents: number;
  unit_cost_cents: number | null; components: { article: string; quantity: number; unit_cost_cents: number | null }[]; created_at: string;
}

export async function assemble(input: AssemblyInput, user: CrmUser): Promise<AssemblyRow> {
  const output = input.output.trim().toUpperCase();
  if (!(await articleExists(output))) throw new StockError('Kies het product dat je maakt.');
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000) throw new StockError('Controleer het aantal.');
  if (!Number.isSafeInteger(input.labour_cents) || input.labour_cents < 0 || input.labour_cents > 10_000_000) throw new StockError('Controleer het arbeidsloon.');
  if (!binCode.test(input.shelf) || !binCode.test(input.box)) throw new StockError('Controleer locatie en bakcode van het product.');
  if (!input.components.length || input.components.length > 50) throw new StockError('Voeg 1 tot 50 onderdelen toe.');
  const parts = [];
  for (const part of input.components) {
    const article = part.article.trim().toUpperCase();
    if (!Number.isSafeInteger(part.quantity) || part.quantity < 1 || part.quantity > 10_000) throw new StockError('Controleer de aantallen van de onderdelen.');
    if (!binCode.test(part.shelf) || !binCode.test(part.box)) throw new StockError(`Controleer de locatie van ${article}.`);
    const location = await locationId(part.shelf, part.box, false);
    if (!location || !(await levelExists(article, location))) throw new StockError(`${article} ligt niet op ${part.shelf} / ${part.box}. Tel deze locatie eerst.`, 409);
    parts.push({ article, location, quantity: part.quantity });
  }
  const outputLocation = await locationId(input.shelf, input.box, true);
  const { data, error } = await admin().rpc('kfc_assemble', {
    p_output: output, p_output_location: outputLocation, p_quantity: input.quantity, p_components: parts,
    p_labour_cents: input.labour_cents, p_key: input.key, p_created_by: user.id, p_note: input.note?.trim() || null,
  });
  if (error) throw rpcError(error);
  return (await recentAssemblies(1, data.id))[0];
}

/** Purchase price per article, for the cost preview. Office only (the caller checks seesPrices). */
export async function articleCosts(codes: string[]): Promise<Record<string, number | null>> {
  const clean = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter((c) => articleCode.test(c) || c.startsWith(WORKSHOP_PREFIX)))].slice(0, 60);
  if (!clean.length) return {};
  const { data } = await admin().from('kfc_articles').select('code, purchase_price_cents').in('code', clean);
  return Object.fromEntries((data ?? []).map((row) => [row.code, row.purchase_price_cents]));
}

export async function recentAssemblies(limit = 20, id?: string): Promise<AssemblyRow[]> {
  let query = admin().from('kfc_assemblies').select('id, output_article, quantity, labour_cents, unit_cost_cents, components, created_at, kfc_articles (name)')
    .order('created_at', { ascending: false }).limit(limit);
  if (id) query = query.eq('id', id);
  const { data, error } = await query;
  if (error) throw new StockError(`Montages lezen mislukt: ${error.message}`, 500);
  return (data ?? []).map((row) => ({
    id: row.id, output_article: row.output_article, output_name: (row.kfc_articles as unknown as { name: string } | null)?.name ?? row.output_article,
    quantity: row.quantity, labour_cents: row.labour_cents, unit_cost_cents: row.unit_cost_cents,
    components: row.components as AssemblyRow['components'], created_at: row.created_at,
  }));
}

/** The supplier's invoice number on an order; empty clears it. Any status: the invoice often arrives after the goods. */
export async function setPurchaseInvoiceRef(id: string, value: string): Promise<void> {
  const { data, error } = await admin().from('kfc_purchase_orders').update({ invoice_ref: cleanInvoiceRef(value) }).eq('id', id).select('id');
  if (error) throw new StockError(`Factuurnummer opslaan mislukt: ${error.message}`, 500);
  if (!data?.length) throw new StockError('Inkooporder niet gevonden.', 404);
}

const DOCUMENT_TYPES: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Attach (or replace) the supplier invoice or receipt: PDF, JPEG or PNG, up to 10 MB. */
export async function attachPurchaseDocument(id: string, bytes: Uint8Array, type: string): Promise<void> {
  const ext = DOCUMENT_TYPES[type];
  if (!ext) throw new StockError('Alleen PDF, JPG of PNG.');
  if (bytes.length === 0 || bytes.length > MAX_DOCUMENT_BYTES) throw new StockError('Bestand is leeg of groter dan 10 MB.');
  const exists = await admin().from('kfc_purchase_orders').select('id').eq('id', id).maybeSingle();
  if (!exists.data) throw new StockError('Inkooporder niet gevonden.', 404);
  const path = `po-${id}.${ext}`;
  await writePhoto(path, bytes, type);
  const { error } = await admin().from('kfc_purchase_orders').update({ document_path: path, document_type: type }).eq('id', id);
  if (error) throw new StockError(`Document koppelen mislukt: ${error.message}`, 500);
}

/** The attached invoice or receipt, or null. */
export async function purchaseDocument(id: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  const { data } = await admin().from('kfc_purchase_orders').select('document_path, document_type').eq('id', id).maybeSingle();
  if (!data?.document_path || !data.document_type) return null;
  const bytes = await readPhoto(data.document_path);
  return bytes ? { bytes, type: data.document_type } : null;
}

/** Goods received for one line, onto a shelf and box (created if new). */
export async function receivePurchaseLine(lineId: string, quantity: number, shelf: string, box: string, key: string, user: CrmUser, photo: string | null, mime: string | null): Promise<number> {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100_000) throw new StockError('Controleer het ontvangen aantal.');
  if (!binCode.test(shelf) || !binCode.test(box)) throw new StockError('Controleer locatie en bakcode.');
  const location = await locationId(shelf, box, true);
  const { data, error } = await admin().rpc('kfc_receive_with_photo', { p_line: lineId, p_quantity: quantity, p_location: location, p_key: key, p_created_by: user.id, p_photo: photo, p_mime: mime });
  if (error?.message.includes('KFC_RECEIPT_CONFLICT')) throw new StockError('Controleer de openstaande hoeveelheid en de ontvangst.', 409);
  if (error) throw rpcError(error);
  return data;
}
