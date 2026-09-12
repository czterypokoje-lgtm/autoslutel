import type { SupabaseClient } from '@supabase/supabase-js';
import { stockStatus, STOCK_SEVERITY, type StockStatus } from './stockStatus';
import { sendTelegram } from './telegram';

interface StockRow {
  technician_id: string | null;
  description: string;
  quantity: number | string;
  min_quantity: number | string | null;
}

async function notifyRow(supabase: SupabaseClient, row: StockRow | null, before: StockStatus): Promise<void> {
  if (!row || !row.technician_id) return;

  const after = stockStatus(row);
  if (STOCK_SEVERITY[after] <= STOCK_SEVERITY[before]) return;

  const { data: tech } = await supabase
    .from('technicians')
    .select('telegram_chat_id')
    .eq('id', row.technician_id)
    .maybeSingle();
  if (!tech?.telegram_chat_id) return;

  const label = after === 'out' ? 'is op' : 'is bijna op';
  await sendTelegram(
    tech.telegram_chat_id,
    `Voorraad: "${row.description}" ${label} in uw bus (nog ${Number(row.quantity)} over).\nBekijk: https://autosleutel24.nl/admin/mijn-bus`
  );
}

/**
 * A stock-decreasing action reads this BEFORE its mutation (adjustOwnStock,
 * transferStock, logging materials used), so `notifyIfStockWorsened` below has
 * something to compare against once the row has actually changed.
 */
export async function readStockStatus(
  supabase: SupabaseClient,
  technicianId: string,
  description: string
): Promise<StockStatus> {
  const { data } = await supabase
    .from('stock_items')
    .select('quantity, min_quantity')
    .eq('technician_id', technicianId)
    .eq('description', description)
    .maybeSingle();
  return data ? stockStatus(data) : 'ok';
}

/** Same as `readStockStatus`, keyed by the row's own id instead of technician+description. */
export async function readStockStatusById(supabase: SupabaseClient, stockItemId: string): Promise<StockStatus> {
  const { data } = await supabase
    .from('stock_items')
    .select('quantity, min_quantity')
    .eq('id', stockItemId)
    .maybeSingle();
  return data ? stockStatus(data) : 'ok';
}

/**
 * Call from inside `after()`, once the mutation has committed. Only sends a
 * Telegram message when the status is strictly worse than `before` — the guard that
 * keeps a technician tapping "-1" on an already-empty article from getting
 * one message per tap.
 */
export async function notifyIfStockWorsened(
  supabase: SupabaseClient,
  technicianId: string,
  description: string,
  before: StockStatus
): Promise<void> {
  const { data: item } = await supabase
    .from('stock_items')
    .select('technician_id, description, quantity, min_quantity')
    .eq('technician_id', technicianId)
    .eq('description', description)
    .maybeSingle();
  await notifyRow(supabase, item, before);
}

/** Same as `notifyIfStockWorsened`, keyed by the row's own id (the material-logging path only has this). */
export async function notifyIfStockWorsenedById(
  supabase: SupabaseClient,
  stockItemId: string,
  before: StockStatus
): Promise<void> {
  const { data: item } = await supabase
    .from('stock_items')
    .select('technician_id, description, quantity, min_quantity')
    .eq('id', stockItemId)
    .maybeSingle();
  await notifyRow(supabase, item, before);
}
