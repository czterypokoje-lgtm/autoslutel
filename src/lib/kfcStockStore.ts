import 'server-only';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { StockState } from '@/lib/keyforcarsStock';

/**
 * Where the KeyForCars stock record lives.
 *
 * Locally (the pilot on one laptop) it is a JSON file and photo files in
 * ./local-data, exactly as before. Online there is no writable disk, so with
 * KFC_STOCK_STORE=supabase the same record is one jsonb row per slot in
 * `kfc_stock_state`, and the photos sit in the private `kfc-stock-photos`
 * bucket (supabase/kfc-preview.sql).
 *
 * One row for the whole record is a preview shortcut: fine for four people,
 * not for production. Two saves can still not overwrite each other: every
 * save names the version it read, and a save against a newer version is
 * refused, so the second person gets "try again" instead of silently undoing
 * the first person's count. The real install replaces this with tables per
 * article, location and movement (reports/kfc-crm/plan.md, section 6).
 */

export type StockSlot = 'stock' | 'demo';

const DATABASE = process.env.KFC_STOCK_STORE === 'supabase';
const TABLE = 'kfc_stock_state';
const BUCKET = 'kfc-stock-photos';
const folder = join(process.cwd(), 'local-data');
const stockFile = (slot: StockSlot) =>
  join(folder, slot === 'demo' ? 'keyforcars-stock-demo.json' : 'keyforcars-stock.json');

/** The stored record and the version it was read at; null when nothing is stored yet. */
export async function loadStock(slot: StockSlot): Promise<{ state: StockState | null; version: number }> {
  if (!DATABASE) {
    try {
      return { state: JSON.parse(readFileSync(stockFile(slot), 'utf8')) as StockState, version: 0 };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      return { state: null, version: 0 };
    }
  }
  const { data, error } = await createSupabaseAdminClient()
    .from(TABLE)
    .select('state, version')
    .eq('slot', slot)
    .maybeSingle();
  if (error) throw new Error(`Voorraad lezen mislukt: ${error.message}`);
  return data ? { state: data.state as StockState, version: data.version as number } : { state: null, version: 0 };
}

/**
 * Saves the record if nobody saved since `version` was read.
 * Returns false when someone else was first; the caller asks the user to retry.
 */
export async function saveStock(slot: StockSlot, state: StockState, version: number): Promise<boolean> {
  if (!DATABASE) {
    // Writes are serialised by the one local Next.js process.
    mkdirSync(folder, { recursive: true });
    const file = stockFile(slot);
    writeFileSync(`${file}.tmp`, JSON.stringify(state), 'utf8');
    renameSync(`${file}.tmp`, file);
    return true;
  }
  const supabase = createSupabaseAdminClient();
  const updatedAt = new Date().toISOString();
  if (version === 0) {
    const { error } = await supabase.from(TABLE).insert({ slot, state, version: 1, updated_at: updatedAt });
    if (error?.code === '23505') return false; // someone created it first
    if (error) throw new Error(`Voorraad opslaan mislukt: ${error.message}`);
    return true;
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update({ state, version: version + 1, updated_at: updatedAt })
    .eq('slot', slot)
    .eq('version', version)
    .select('version');
  if (error) throw new Error(`Voorraad opslaan mislukt: ${error.message}`);
  return (data?.length ?? 0) === 1;
}

/** A stored JPEG, or null. */
export async function readPhoto(name: string): Promise<Uint8Array | null> {
  if (!DATABASE) {
    try {
      return new Uint8Array(readFileSync(join(folder, name)));
    } catch {
      return null;
    }
  }
  const { data } = await createSupabaseAdminClient().storage.from(BUCKET).download(name);
  return data ? new Uint8Array(await data.arrayBuffer()) : null;
}

export async function writePhoto(name: string, image: Uint8Array, contentType = 'image/jpeg'): Promise<void> {
  if (!DATABASE) {
    mkdirSync(folder, { recursive: true });
    const path = join(folder, name);
    writeFileSync(`${path}.tmp`, image);
    renameSync(`${path}.tmp`, path);
    return;
  }
  const { error } = await createSupabaseAdminClient()
    .storage.from(BUCKET)
    .upload(name, image, { contentType, upsert: true });
  if (error) throw new Error(`Foto opslaan mislukt: ${error.message}`);
}
