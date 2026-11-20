import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import catalog from '@/data/keyforcars-stock.json';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { hasLanCookie, lanMode } from '@/lib/lanPreview';
import { requireWarehouseUserApi } from '@/lib/crmSession';
import { kfcGet, kfcPost } from '@/lib/kfcInventory';
import { WAREHOUSE } from '@/config/install';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loadStock, readPhoto, saveStock, writePhoto, type StockSlot } from '@/lib/kfcStockStore';
import { EMPTY_STOCK, STOCK_OPERATIONS, type StockBin, type StockMove, type StockState } from '@/lib/keyforcarsStock';
import { findProfile } from '@/lib/productProfiles';

export const runtime = 'nodejs';
/** Online KeyForCars install: the ledger tables (0090). Local pilot and ?demo=1 keep the JSON record. */
const LEDGER = WAREHOUSE && !CRM_PREVIEW;
const articles = new Set(catalog.map(({ id }) => id));
let catalogResponse: { body: string; etag: string } | undefined;
const articleCode = /^KFC-[123]-[0-9]+$/;
const binCode = /^[A-Z0-9-]{1,24}$/;
const demoSkus = ['ALRK05', 'ALRK03', 'ALRK04'];
const demoArticles = demoSkus.map((sku) => catalog.find((article) => article.sku === sku)!);

type Save = (state: StockState) => Promise<boolean>;

const slotOf = (demo: boolean): StockSlot => (demo ? 'demo' : 'stock');
const movementPhoto = (id: string, demo: boolean) => `${demo ? 'demo-' : 'stock-'}${id}.jpg`;

function seedDemo(now: number): StockState {
  const state = structuredClone(EMPTY_STOCK);
  for (const [index, article] of demoArticles.entries()) {
    const bin = { article: article.id, shelf: `A-03-0${index + 1}`, box: `DEMO-${index + 1}` };
    state.bins.push({ ...bin, quantity: 20, minimum: 5 });
    state.moves.push({ ...bin, operation: 'count', delta: 20, after: 20, time: new Date(now - 12 * 86_400_000).toISOString() });
    for (const days of [9, 2]) {
      const time = new Date(now - days * 86_400_000).toISOString();
      state.moves.push({ ...bin, operation: 'receive', delta: 3, after: 23, time, bot: { eventId: `sample-${index}-${days}-receive` } });
      state.moves.push({ ...bin, operation: 'issue', delta: -3, after: 20, time: new Date(Date.parse(time) + 1000).toISOString(), bot: { eventId: `sample-${index}-${days}-issue` } });
    }
  }
  state.moves.sort((a, b) => b.time.localeCompare(a.time));
  return state;
}

/**
 * Who may use this API.
 *
 * Local pilot (CRM_PREVIEW, development only): this machine, or the phone
 * holding the LAN cookie. Online, on the KeyForCars install only: a signed-in
 * office user, checked against the Auth server. Anywhere else it does not
 * exist.
 */
async function allowed(request: Request): Promise<boolean> {
  if (CRM_PREVIEW) {
    const host = request.headers.get('host') ?? '';
    if (lanMode()) return hasLanCookie(request.headers.get('cookie'));
    return /^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host);
  }
  if (!WAREHOUSE) return false;
  return !(await requireWarehouseUserApi()).response;
}

async function readStock(demo = false): Promise<{ state: StockState; version: number }> {
  const stored = await loadStock(slotOf(demo));
  const version = stored.version;
  const state = stored.state ?? (demo ? seedDemo(Date.now()) : structuredClone(EMPTY_STOCK));
  if (demo) {
    const now = Date.now();
    const monday = new Date(`${new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam', dateStyle: 'short' }).format(now)}T12:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    const today = new Date(now - 60_000);
    const week = new Date(Math.min(monday.getTime(), now - 120_000));
    const month = new Date(Math.min(week.getTime() - 86_400_000, Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 3, 12)));
    const dates = [today, week, month];
    const run = today.toISOString().slice(0, 10);
    const quantities = [[6, 4, 2], [2, 10, 3], [2, 1, 26]];
    for (const [period, day] of dates.entries()) for (const [index, article] of demoArticles.entries()) {
      const id = `sales-example-${period}-${index}`;
      const amountCents = quantities[period][index] * [6500, 6100, 5500][index];
      const existing = state.moves.find((move) => move.id === id);
      if (existing) { existing.amountCents ??= amountCents; continue; }
      state.moves.push({ id, article: article.id, operation: 'sale', shelf: '', box: '',
        delta: -quantities[period][index], after: null, time: day.toISOString(), note: `Voorbeeldverkoop · ${run}`, amountCents });
    }
    for (const move of state.moves) {
      if (move.bot?.eventId.startsWith('sample-') && move.operation === 'receive') move.amountCents ??= move.delta * 2700;
    }
    state.moves.sort((a, b) => b.time.localeCompare(a.time));
  }
  return { state, version };
}

function reply(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Someone else saved between our read and our write; nothing of ours was stored. */
const conflict = () => reply({ error: 'Iemand anders heeft net de voorraad gewijzigd. Probeer het opnieuw.' }, 409);

function jpeg(image: Uint8Array) {
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' } });
}

export async function GET(request: Request) {
  if (!(await allowed(request))) return reply({}, 404);
  const query = new URL(request.url).searchParams;
  if (query.get('catalog') === '1') {
    if (!catalogResponse) {
      const body = JSON.stringify(catalog);
      catalogResponse = { body, etag: `"${createHash('sha256').update(body).digest('base64url')}"` };
    }
    const { body, etag } = catalogResponse;
    const headers = { 'Cache-Control': 'private, no-cache', 'Content-Type': 'application/json', ETag: etag };
    if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
    return new Response(body, { headers });
  }
  const demo = query.get('demo') === '1';
  const profile = query.get('profile');
  if (profile !== null) return reply(/^[A-Za-z0-9._\-/ ]{1,80}$/.test(profile) ? findProfile(profile) ?? null : null);
  // Labels for a print run: up to 300 SKUs in one call, comma-separated.
  const profiles = query.get('profiles');
  if (profiles !== null) {
    const skus = [...new Set(profiles.split(',').map((sku) => sku.trim()).filter((sku) => /^[A-Za-z0-9._\-/ ]{1,80}$/.test(sku)))].slice(0, 300);
    return reply(Object.fromEntries(skus.map((sku) => [sku, findProfile(sku) ?? null])));
  }
  if (LEDGER && !demo) return kfcGet(query);
  const movement = query.get('movement');
  if (movement) {
    if (!/^[a-f0-9-]{36}$/i.test(movement)) return reply({}, 404);
    const entry = (await readStock(demo)).state.moves.find((move) => move.id === movement && move.photo);
    if (!entry) return reply({}, 404);
    const image = await readPhoto(entry.requestFingerprint ? movementPhoto(movement, demo) : `${movement}.jpg`);
    return image ? jpeg(image) : reply({}, 404);
  }
  const photo = query.get('foto');
  if (!photo) {
    const { state } = await readStock(demo);
    if (query.get('movementCatalog') === '1') {
      const used = new Set(state.moves.map(move => move.article));
      return reply({ state, catalog: catalog.filter(article => used.has(article.id)) });
    }
    return reply(state);
  }
  if (!articleCode.test(photo) || !(await readStock()).state.photos[photo]) return reply({}, 404);
  const image = await readPhoto(`${photo}.jpg`);
  return image ? jpeg(image) : reply({}, 404);
}

/** Same-origin only: https online, http on the local pilot and in `next dev`. */
function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const http = CRM_PREVIEW || process.env.NODE_ENV === 'development';
  return origin === `https://${host}` || (http && origin === `http://${host}`);
}

export async function POST(request: Request) {
  if (!(await allowed(request))) return reply({}, 404);
  const demo = new URL(request.url).searchParams.get('demo') === '1';
  const external = demo && request.headers.has('authorization');
  if (external) {
    const secret = process.env.KEYFORCARS_STOCK_EVENT_KEY;
    const provided = Buffer.from(request.headers.get('authorization') ?? '');
    const expected = Buffer.from(`Bearer ${secret ?? ''}`);
    if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) return reply({}, 403);
  } else if (!sameOrigin(request)) {
    return reply({}, 403);
  }
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return reply({ error: 'Ongeldige invoer.' }, 400);
  if (LEDGER && !demo && !external) return kfcPost(input as Record<string, unknown>);

  const { state, version } = await readStock(demo);
  const save: Save = (next) => saveStock(slotOf(demo), next, version);
  if (external) return ingestStockEvent(state, input, save);
  const hasArticle = (id: string) => articles.has(id) || state.workshop.some((item) => item.id === id);
  if (input.operation === 'photo') {
    if (demo) return reply({ error: 'Wijzig de etiketfoto via de lokale voorraad.' }, 400);
    const { article, photo } = input;
    if (typeof article !== 'string' || !articleCode.test(article) || !hasArticle(article) ||
        typeof photo !== 'string' || photo.length > 240_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo)) {
      return reply({ error: 'Kies een kleinere geldige foto.' }, 400);
    }
    const image = Buffer.from(photo, 'base64');
    if (image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9) {
      return reply({ error: 'De afbeelding is geen geldige JPEG.' }, 400);
    }
    await writePhoto(`${article}.jpg`, image);
    state.photos[article] = `${Date.now()}`;
    if (!(await save(state))) return conflict();
    return reply({ state });
  }
  if (input.operation === 'new') {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const sku = typeof input.sku === 'string' ? input.sku.trim() : '';
    if (!name || name.length > 180 || sku.length > 80) return reply({ error: 'Controleer de artikelnaam en SKU.' }, 400);
    const id = `KFC-3-${state.workshop.length + 1}`;
    state.workshop.push({ id, name, sku, image: '', category: 'Werkplaats', sources: [] });
    if (!(await save(state))) return conflict();
    return reply({ state, id });
  }

  if (input.operation === 'bulkCount') return bulkCount(state, input, hasArticle, save);
  if (!hasArticle(input.article)) return reply({ error: 'Onbekend artikel.' }, 400);
  const requestedId = input.mutationId;
  if (requestedId !== undefined && (typeof requestedId !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestedId))) return reply({ error: 'Ongeldige boekingsreferentie.' }, 400);
  const id = typeof requestedId === 'string' ? requestedId : randomUUID();
  const duplicate = state.moves.find((move) => move.id === id);
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (note.length > 500) return reply({ error: 'De notitie is te lang.' }, 400);
  const amountCents: unknown = input.amountCents;
  const invoiceId = input.invoiceId;
  if (invoiceId !== undefined && (input.operation !== 'sale' || typeof invoiceId !== 'string' ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(invoiceId))) {
    return reply({ error: 'Ongeldige factuur-ID.' }, 400);
  }
  if (amountCents !== undefined && ((input.operation !== 'sale' && input.operation !== 'receive') ||
    typeof amountCents !== 'number' || !Number.isSafeInteger(amountCents) || amountCents < 0 || amountCents > 100_000_000)) {
    return reply({ error: 'Controleer het bedrag in euro.' }, 400);
  }
  const photo = input.photo;
  let image: Buffer | undefined;
  if (photo !== undefined) {
    if (typeof photo !== 'string' || photo.length > 400_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo)) return reply({ error: 'Kies een kleinere geldige foto.' }, 400);
    image = Buffer.from(photo, 'base64');
    if (image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9) return reply({ error: 'Gebruik een geldige JPEG-foto.' }, 400);
  }
  const requestFingerprint = createHash('sha256').update(JSON.stringify([
    input.article, input.operation, input.shelf, input.box, input.quantity, input.minimum,
    input.destinationShelf || '', input.destinationBox || '', note, photo ?? null,
    ...(amountCents === undefined ? [] : [amountCents]),
    ...(invoiceId === undefined ? [] : [invoiceId]),
  ])).digest('hex');
  if (duplicate) {
    if (duplicate.requestFingerprint !== requestFingerprint) {
      return reply({ error: 'Deze boekingsreferentie is al gebruikt. Controleer het logboek.' }, 409);
    }
    return reply({ state, movement: duplicate });
  }
  if (typeof invoiceId === 'string') {
    if (CRM_PREVIEW || demo) return reply({ error: 'Facturen koppelen vereist een actieve CRM-database.' }, 409);
    const supabase = await createSupabaseServerClient();
    const invoice = await supabase.from('sales_invoices').select('id').eq('id', invoiceId).maybeSingle();
    if (invoice.error) return reply({ error: 'De factuur kon niet worden gecontroleerd.' }, 503);
    if (!invoice.data) return reply({ error: 'Factuur niet gevonden.' }, 404);
  }
  const result = bookMovement(state, input, { id, photo: Boolean(image), note, requestFingerprint, amountCents, ...(invoiceId ? { invoiceId } : {}) });
  if (result) return result;
  if (image) await writePhoto(movementPhoto(id, demo), image);
  if (!(await save(state))) return conflict();
  return reply({ state, movement: state.moves[0] });
}

const MAX_BULK_LINES = 500;
const MAX_BULK_PHOTOS = 300;

/**
 * Books a bulk count from photos: every line or none.
 *
 * Lines are checked before anything is booked, and the state is only written
 * after all of them succeeded, so a bad line leaves the stock untouched. The
 * batch id makes a retried request harmless, and the photo hashes stop the
 * same picture from being counted in a later batch.
 */
async function bulkCount(state: StockState, input: Record<string, unknown>, hasArticle: (id: string) => boolean, save: Save) {
  const { batchId, photos, lines } = input;
  if (typeof batchId !== 'string' || !/^[a-f0-9-]{36}$/i.test(batchId)) return reply({ error: 'Ongeldige tellingreferentie.' }, 400);
  if (state.moves.some((move) => move.batch === batchId)) return reply({ state, duplicate: true });
  if (!Array.isArray(photos) || photos.length > MAX_BULK_PHOTOS || !photos.every((hash) => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash))) {
    return reply({ error: 'Ongeldige fotolijst.' }, 400);
  }
  const countedBefore = new Set((state.batches ?? []).flatMap((batch) => batch.photos));
  const repeated = photos.filter((hash) => countedBefore.has(hash));
  if (repeated.length) return reply({ error: `${repeated.length} foto('s) zijn al eerder geteld. Haal ze uit de selectie.` }, 409);
  if (!Array.isArray(lines) || !lines.length || lines.length > MAX_BULK_LINES) return reply({ error: `Tussen 1 en ${MAX_BULK_LINES} regels per telling.` }, 400);

  const seen = new Set<string>();
  for (const line of lines) {
    if (!line || typeof line !== 'object') return reply({ error: 'Ongeldige regel.' }, 400);
    const { article, shelf, box, quantity } = line as Record<string, unknown>;
    if (typeof article !== 'string' || !hasArticle(article) || typeof shelf !== 'string' || typeof box !== 'string' ||
        !binCode.test(shelf) || !binCode.test(box) || typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 1_000_000) {
      return reply({ error: `Controleer artikel, locatie en aantal bij ${String(article).slice(0, 40)}.` }, 400);
    }
    const key = `${article}/${shelf}/${box}`;
    if (seen.has(key)) return reply({ error: `Dubbele regel voor ${article} op ${shelf} · ${box}.` }, 400);
    seen.add(key);
  }

  const time = new Date().toISOString();
  for (const [position, line] of (lines as { article: string; shelf: string; box: string; quantity: number }[]).entries()) {
    const existing = state.bins.find((bin) => bin.article === line.article && bin.shelf === line.shelf && bin.box === line.box);
    const result = bookMovement(state, { ...line, operation: 'count', minimum: existing?.minimum ?? 0 },
      { id: `${batchId}-${position}`, note: 'Bulktelling met foto\'s', batch: batchId });
    if (result) return result;
  }
  state.batches = [...(state.batches ?? []), { id: batchId, time, photos, lines: lines.length }].slice(-500);
  if (!(await save(state))) return conflict();
  return reply({ state, saved: lines.length });
}

function bookMovement(state: StockState, input: Record<string, unknown>, details: Pick<StockMove, 'id' | 'photo' | 'note' | 'bot' | 'requestFingerprint' | 'amountCents' | 'batch' | 'invoiceId'> = {}) {
  const { article, operation, shelf, box, quantity, minimum, destinationShelf, destinationBox } = input;
  const unlocated = shelf === '' && box === '' && ['receive', 'issue', 'sale', 'return'].includes(String(operation));
  if (typeof operation !== 'string' || !Object.hasOwn(STOCK_OPERATIONS, operation) ||
      typeof article !== 'string' || typeof quantity !== 'number' || typeof minimum !== 'number' ||
      typeof shelf !== 'string' || typeof box !== 'string' || (!unlocated && (!binCode.test(shelf) || !binCode.test(box))) ||
      !Number.isSafeInteger(quantity) || quantity < (operation === 'count' ? 0 : 1) || quantity > 1_000_000 ||
      !Number.isSafeInteger(minimum) || minimum < 0 || minimum > 1_000_000) {
    return reply({ error: 'Controleer artikel, locatie, bakcode en aantallen.' }, 400);
  }

  const time = new Date().toISOString();
  const outgoing = operation === 'issue' || operation === 'sale' || operation === 'transfer';
  if (unlocated) {
    if (state.bins.some((bin) => bin.article === article)) {
      return reply({ error: 'Dit artikel heeft getelde voorraad. Kies een locatie en bak.' }, 409);
    }
    state.moves.unshift({ ...details, article, operation, shelf, box, delta: outgoing ? -quantity : quantity, after: null, time });
    return;
  }

  const findBin = (location: string, container: string) => state.bins.find(
    (bin) => bin.article === article && bin.shelf === location && bin.box === container,
  );
  const existing = findBin(shelf, box);
  if (!existing && operation !== 'count') return reply({ error: 'Tel deze locatie eerst.' }, 409);
  const source: StockBin = existing ?? { article, shelf, box, quantity: 0, minimum };
  if (outgoing && source.quantity < quantity) return reply({ error: 'Onvoldoende voorraad op deze locatie.' }, 409);

  const adjust = (bin: StockBin, after: number, metadata = {}) => {
    state.moves.unshift({ ...metadata, article, operation, shelf: bin.shelf, box: bin.box, delta: after - bin.quantity, after, time });
    bin.quantity = after;
  };
  if (operation === 'transfer') {
    if (typeof destinationShelf !== 'string' || typeof destinationBox !== 'string' ||
        !binCode.test(destinationShelf) || !binCode.test(destinationBox) ||
        (destinationShelf === shelf && destinationBox === box)) {
      return reply({ error: 'Kies een andere geldige bestemming.' }, 400);
    }
    const target = findBin(destinationShelf, destinationBox);
    if (!target) return reply({ error: 'Tel de bestemming eerst, ook als deze leeg is.' }, 409);
    adjust(target, target.quantity + quantity);
  }

  if (!existing) state.bins.push(source);
  if (operation === 'count') source.minimum = minimum;
  adjust(source, operation === 'count' ? quantity : source.quantity + (outgoing ? -quantity : quantity), details);
}

async function ingestStockEvent(state: StockState, input: Record<string, unknown>, save: Save) {
  const { eventId, operation, code, quantity } = input;
  if (typeof eventId !== 'string' || !/^[A-Za-z0-9._:-]{1,100}$/.test(eventId) ||
      typeof operation !== 'string' || !['receive', 'issue', 'sale', 'return'].includes(operation) ||
      typeof code !== 'string' || !code.trim() || code.length > 80) {
    return reply({ error: 'Ongeldige voorraadgebeurtenis.' }, 400);
  }
  const key = code.trim().toUpperCase();
  const matches = catalog.filter((article) => article.id === key || article.sku.toUpperCase() === key);
  if (matches.length !== 1) return reply({ error: 'Gebruik een eenduidige SKU of barcode.' }, 400);
  const bins = state.bins.filter((bin) => bin.article === matches[0].id);
  const bin = input.shelf || input.box
    ? bins.find((item) => item.shelf === input.shelf && item.box === input.box)
    : bins.length === 1 ? bins[0] : undefined;
  if (!bin) return reply({ error: 'Gebruik een getelde locatie en bakcode.' }, 409);

  const previous = state.moves.find((move) => move.bot?.eventId === eventId);
  if (previous) {
    if (previous.article !== bin.article || previous.shelf !== bin.shelf || previous.box !== bin.box ||
        previous.operation !== operation || Math.abs(previous.delta) !== quantity) {
      return reply({ error: 'Dit gebeurtenis-ID hoort bij een andere beweging.' }, 409);
    }
    return reply({ accepted: true, duplicate: true });
  }
  const result = bookMovement(state, { ...bin, operation, quantity }, { bot: { eventId } });
  if (result) return result;
  if (!(await save(state))) return conflict();
  return reply({ accepted: true });
}
