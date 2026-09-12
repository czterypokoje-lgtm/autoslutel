'use server';

import { after } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readStockStatus, notifyIfStockWorsened } from '@/lib/stockNotify';

/**
 * Move parts from one van to another.
 *
 * Through the caller's own session, not the service-role key. The previous
 * version reached for the admin client because 0008 gives a monteur no write
 * access to `stock_items` — but that bypasses every policy, and it took both
 * technician ids straight from the caller, so any monteur could move parts out
 * of somebody else's van into their own.
 *
 * `crm_transfer_stock` (migration 0018) is the whole write surface now: it
 * checks the caller owns the source, moves both sides in one transaction, and
 * locks the row so two transfers cannot read the same quantity.
 */
export async function transferStock(
  fromTechId: string | null,
  toTechId: string | null,
  description: string,
  quantity: number
): Promise<{ ok: true } | { error: string }> {
  await requireCrmUser();

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'Ongeldig aantal.' };
  }
  if (!description?.trim()) {
    return { error: 'Kies een artikel.' };
  }

  const supabase = await createSupabaseServerClient();

  /*
   * Only the source van can end up worse off — the destination only gains.
   * Read its status before the move so `after()` below has something to
   * compare against once the row has actually changed.
   */
  const before = fromTechId ? await readStockStatus(supabase, fromTechId, description.trim()) : null;

  const { data, error } = await supabase.rpc('crm_transfer_stock', {
    p_from: fromTechId,
    p_to: toTechId,
    p_description: description.trim(),
    p_quantity: quantity,
  });

  if (error) {
    console.error('Stock transfer failed:', error.message);
    return {
      error: /function|does not exist/i.test(error.message)
        ? 'Voer supabase/migrations/0018_stock_transfer.sql uit.'
        : 'Overzetten mislukt.',
    };
  }

  /* The function answers in words rather than throwing, so the reason survives. */
  const said: Record<string, string> = {
    ok: '',
    ongeldig_aantal: 'Ongeldig aantal.',
    geen_omschrijving: 'Kies een artikel.',
    zelfde_bus: 'Bron en bestemming zijn hetzelfde.',
    geen_monteur: 'Uw login is niet aan een monteur gekoppeld.',
    niet_uw_voorraad: 'U kunt alleen uit uw eigen bus overzetten.',
    alleen_eigen_bus: 'Uit het magazijn kunt u alleen naar uw eigen bus halen.',
    niet_gevonden: 'Dit artikel ligt niet in de bron-bus.',
    te_weinig: 'Daar liggen er niet genoeg van.',
  };

  const outcome = String(data);
  if (outcome !== 'ok') return { error: said[outcome] ?? 'Overzetten mislukt.' };

  if (fromTechId && before) {
    after(() => notifyIfStockWorsened(supabase, fromTechId, description.trim(), before));
  }
  return { ok: true };
}

/**
 * The +/- on a monteur's own "wat er in de bus ligt" list: not a transfer
 * between two named bins, just correcting the count of an article already
 * sitting in this van. crm_transfer_stock (above) refused this every time
 * for anything that arrived via a confirmed invoice rather than a warehouse
 * hand-out — it has no warehouse quantity to pull the "+1" from, so the tap
 * silently did nothing. crm_adjust_own_stock (0024) writes the one row
 * directly instead of moving anything between two places.
 */
export async function adjustOwnStock(
  description: string,
  delta: number
): Promise<{ ok: true } | { error: string }> {
  const user = await requireCrmUser();

  if (!Number.isFinite(delta) || delta === 0) {
    return { error: 'Ongeldig aantal.' };
  }
  if (!description?.trim()) {
    return { error: 'Kies een artikel.' };
  }

  const supabase = await createSupabaseServerClient();

  /* A "+1" can only ever improve things — only worth checking on the way down. */
  let techId: string | null = null;
  let before: Awaited<ReturnType<typeof readStockStatus>> | null = null;
  if (delta < 0) {
    const { data: me } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    techId = me?.id ?? null;
    if (techId) before = await readStockStatus(supabase, techId, description.trim());
  }

  const { data, error } = await supabase.rpc('crm_adjust_own_stock', {
    p_description: description.trim(),
    p_delta: delta,
  });

  if (error) {
    console.error('Stock adjust failed:', error.message);
    return {
      error: /function|does not exist/i.test(error.message)
        ? 'Voer supabase/migrations/0024_adjust_own_stock.sql uit.'
        : 'Aanpassen mislukt.',
    };
  }

  const said: Record<string, string> = {
    ok: '',
    ongeldig_aantal: 'Ongeldig aantal.',
    geen_omschrijving: 'Kies een artikel.',
    geen_monteur: 'Uw login is niet aan een monteur gekoppeld.',
    niet_gevonden: 'Dit artikel staat niet in uw bus.',
    te_weinig: 'Daar liggen er niet genoeg van.',
  };

  const outcome = String(data);
  if (outcome !== 'ok') return { error: said[outcome] ?? 'Aanpassen mislukt.' };

  if (techId && before) {
    after(() => notifyIfStockWorsened(supabase, techId, description.trim(), before));
  }
  return { ok: true };
}
