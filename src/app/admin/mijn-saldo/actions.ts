'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrmUser } from '@/lib/crmSession';

export async function requestPayout(amount: number) {
  if (amount <= 0) return { error: 'Ongeldig bedrag.' };
  
  const user = await requireCrmUser();
  if (user.role !== 'monteur') return { error: 'Geen toegang.' };

  const supabase = await createSupabaseServerClient();
  
  // Get tech id
  const { data: tech } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!tech) return { error: 'Monteur niet gevonden.' };

  const { error } = await supabase
    .from('payout_requests')
    .insert({
      technician_id: tech.id,
      amount,
    });

  if (error) {
    console.error('Payout insert failed:', error.message);
    return { error: 'Aanvraag mislukt. Probeer het later opnieuw.' };
  }

  return { ok: true };
}
