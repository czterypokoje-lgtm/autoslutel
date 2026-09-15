'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrmUser } from '@/lib/crmSession';

export async function requestPayout(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Ongeldig bedrag.' };

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

  /*
   * What is actually left, recomputed here rather than trusted from the form.
   * The screen already knows the number, but a server action is a public
   * endpoint: without this a request for €10.000 on a €200 balance lands in the
   * office's queue looking exactly like a real one.
   *
   * The same rules as the balance on the page: what was charged, not what was
   * quoted; the agreed commission even when it is zero; paid and pending both
   * held back, rejected not.
   */
  const [{ data: jobs }, { data: payouts }] = await Promise.all([
    supabase
      .from('jobs')
      .select('quoted_price, final_price, commission_pct')
      .eq('technician_id', tech.id)
      .eq('status', 'afgerond'),
    supabase.from('payout_requests').select('amount, status').eq('technician_id', tech.id),
  ]);

  const earned = (jobs ?? []).reduce((total, job) => {
    const price = Number(job.final_price ?? job.quoted_price) || 0;
    const commission = Number(job.commission_pct ?? 25);
    return total + price * ((100 - commission) / 100);
  }, 0);

  const held = (payouts ?? [])
    .filter((p) => p.status === 'paid' || p.status === 'pending')
    .reduce((total, p) => total + Number(p.amount), 0);

  const available = Math.round((earned - held) * 100) / 100;
  const wanted = Math.round(amount * 100) / 100;

  if (wanted > available) {
    return {
      error:
        available <= 0
          ? 'U heeft op dit moment niets openstaan.'
          : `U kunt maximaal € ${available.toFixed(2).replace('.', ',')} aanvragen.`,
    };
  }

  const { error } = await supabase
    .from('payout_requests')
    .insert({
      technician_id: tech.id,
      amount: wanted,
      status: 'pending',
    });

  if (error) {
    console.error('Payout insert failed:', error.message);
    return { error: 'Aanvraag mislukt. Probeer het later opnieuw.' };
  }

  return { ok: true };
}
