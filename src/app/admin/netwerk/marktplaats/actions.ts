'use server';

import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface NewListingInput {
  title: string;
  description: string;
  price: string;
  photos: string[];
}

export async function createListing(input: NewListingInput): Promise<{ ok: true } | { error: string }> {
  const user = await requireCrmUser();

  const title = input.title.trim();
  if (!title) return { error: 'Titel is verplicht.' };

  const priceValue = input.price.trim() === '' ? null : Number(input.price.replace(',', '.'));
  if (priceValue !== null && (!Number.isFinite(priceValue) || priceValue < 0)) {
    return { error: 'Ongeldige prijs.' };
  }

  const supabase = await createSupabaseServerClient();

  let technicianId: string | null = null;
  if (user.role === 'monteur') {
    const { data: me } = await supabase.from('technicians').select('id').eq('user_id', user.id).single();
    technicianId = me?.id ?? null;
  }

  const { error } = await supabase.from('marketplace_listings').insert({
    posted_by: user.id,
    technician_id: technicianId,
    title,
    description: input.description.trim() || null,
    price: priceValue,
    photos: input.photos,
  });

  if (error) {
    console.error('Marketplace listing insert failed:', error.message);
    return { error: 'Opslaan mislukt.' };
  }
  return { ok: true };
}

export async function markSold(id: string): Promise<{ ok: true } | { error: string }> {
  await requireCrmUser();
  const supabase = await createSupabaseServerClient();

  // RLS restricts this to the poster or the office — a stranger's update just
  // matches zero rows rather than erroring, so check that explicitly.
  const { data, error } = await supabase
    .from('marketplace_listings')
    .update({ status: 'sold', sold_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Marketplace mark-sold failed:', error.message);
    return { error: 'Bijwerken mislukt.' };
  }
  if (!data) return { error: 'Geen toegang tot deze advertentie.' };
  return { ok: true };
}

export async function deleteListing(id: string): Promise<{ ok: true } | { error: string }> {
  await requireCrmUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('marketplace_listings').delete().eq('id', id).select('id').maybeSingle();

  if (error) {
    console.error('Marketplace delete failed:', error.message);
    return { error: 'Verwijderen mislukt.' };
  }
  if (!data) return { error: 'Geen toegang tot deze advertentie.' };
  return { ok: true };
}
