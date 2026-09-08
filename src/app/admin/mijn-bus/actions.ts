'use server';

import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
  if (outcome === 'ok') return { ok: true };
  return { error: said[outcome] ?? 'Overzetten mislukt.' };
}
