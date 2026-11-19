import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { readPhoto, writePhoto } from '@/lib/kfcStockStore';
import { getCrmUser, seesPrices, type CrmUser } from '@/lib/crmSession';
import type { StockArticle, StockBatch, StockBin, StockMove, StockState } from '@/lib/keyforcarsStock';
import catalog from '@/data/keyforcars-stock.json';

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
const articleCode = /^KFC-[123]-[0-9]+$/;
const MOVE_LIMIT = 2000;

/** Thrown by the RPCs; mapped to the messages the UI already shows. */
const RPC_MESSAGES: Record<string, [string, number]> = {
  KFC_INSUFFICIENT: ['Onvoldoende voorraad op deze locatie.', 409],
  KFC_HAS_LOCATED_STOCK: ['Dit artikel heeft getelde voorraad. Kies een locatie en bak.', 409],
  KFC_LOCATION_REQUIRED: ['Kies een locatie en bak.', 400],
  KFC_ZERO_MOVE: ['Het aantal is nul.', 400],
  KFC_BAD_TRANSFER: ['Kies een andere geldige bestemming.', 400],
  KFC_NEGATIVE_COUNT: ['Een telling kan niet negatief zijn.', 400],
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

/** The whole record in the shape the screens already render. */
export async function loadState(user: CrmUser): Promise<StockState> {
  const db = admin();
  const [locs, workshop, levels, moves, photos, batches] = await Promise.all([
    locations(),
    db.from('kfc_articles').select('code, name, sku, image, category').like('code', 'KFC-3-%').order('code'),
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
export async function newArticle(name: string, sku: string): Promise<string> {
  const db = admin();
  const { count } = await db.from('kfc_articles').select('code', { count: 'exact', head: true }).like('code', 'KFC-3-%');
  const code = `KFC-3-${(count ?? 0) + 1}`;
  const { error } = await db.from('kfc_articles').insert({ code, name, sku, category: 'Werkplaats' });
  if (error) throw new StockError(`Artikel aanmaken mislukt: ${error.message}`, 500);
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

export interface PurchaseLine { id: string; article_code: string; name: string; sku: string; quantity: number; received: number; unit_cost_cents: number | null }
export interface PurchaseOrder {
  id: string; supplier: string; status: 'draft' | 'ordered' | 'received' | 'cancelled'; expected_on: string | null;
  note: string | null; created_at: string; ordered_at: string | null; received_at: string | null; lines: PurchaseLine[];
}

export async function listPurchaseOrders(user: CrmUser): Promise<PurchaseOrder[]> {
  const { data, error } = await admin().from('kfc_purchase_orders')
    .select('id, supplier, status, expected_on, note, created_at, ordered_at, received_at, kfc_purchase_order_lines (id, article_code, quantity, received, unit_cost_cents, kfc_articles (name, sku))')
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw new StockError(`Inkooporders lezen mislukt: ${error.message}`, 500);
  const prices = seesPrices(user);
  return (data ?? []).map((row) => {
    const lines = (row.kfc_purchase_order_lines as unknown as { id: string; article_code: string; quantity: number; received: number; unit_cost_cents: number | null; kfc_articles: { name: string; sku: string } | null }[]) ?? [];
    return {
      id: row.id, supplier: row.supplier, status: row.status, expected_on: row.expected_on, note: row.note,
      created_at: row.created_at, ordered_at: row.ordered_at, received_at: row.received_at,
      lines: lines.map((line) => ({
        id: line.id, article_code: line.article_code, name: line.kfc_articles?.name ?? line.article_code, sku: line.kfc_articles?.sku ?? '',
        quantity: line.quantity, received: line.received, unit_cost_cents: prices ? line.unit_cost_cents : null,
      })),
    };
  });
}

export interface NewPurchaseOrder { supplier: string; expected_on?: string | null; note?: string | null; lines: { article: string; quantity: number; unit_cost_cents?: number | null }[] }

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
  const po = await db.from('kfc_purchase_orders').insert({ supplier, expected_on: input.expected_on || null, note: input.note?.trim() || null, created_by: user.id }).select('id').single();
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

/** Goods received for one line, onto a shelf and box (created if new). */
export async function receivePurchaseLine(lineId: string, quantity: number, shelf: string, box: string, key: string, user: CrmUser): Promise<void> {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100_000) throw new StockError('Controleer het ontvangen aantal.');
  if (!binCode.test(shelf) || !binCode.test(box)) throw new StockError('Controleer locatie en bakcode.');
  const line = await admin().from('kfc_purchase_order_lines').select('id, quantity, received, kfc_purchase_orders (status)').eq('id', lineId).maybeSingle();
  if (!line.data) throw new StockError('Inkoopregel niet gevonden.', 404);
  if ((line.data.kfc_purchase_orders as unknown as { status: string } | null)?.status !== 'ordered') throw new StockError('Deze inkooporder is niet besteld.', 409);
  if (line.data.received + quantity > line.data.quantity) throw new StockError('Meer ontvangen dan besteld. Pas het aantal aan.', 409);
  const location = await locationId(shelf, box, true);
  const { error } = await admin().rpc('kfc_receive_po_line', { p_line: lineId, p_quantity: quantity, p_location: location, p_key: key, p_created_by: user.id });
  if (error) throw rpcError(error);
}
