'use server';

import { after } from 'next/server';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sendTelegram } from '@/lib/telegram';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/**
 * The office marking a payout request paid or rejected. Nothing wrote this
 * status before now — `payout_requests` had the column and the office-only
 * RLS policy (0017_payout_permissions.sql) but no button anywhere called it.
 */
export async function setPayoutStatus(
  id: string,
  status: 'paid' | 'rejected'
): Promise<{ ok: true } | { error: string }> {
  await requireOfficeUser();

  const supabase = await createSupabaseServerClient();

  const { data: payout, error } = await supabase
    .from('payout_requests')
    .update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('status', 'pending')
    .select('amount, technician_id')
    .maybeSingle();

  if (error) {
    console.error('Payout status update failed:', error.message);
    return { error: 'Bijwerken mislukt.' };
  }
  if (!payout) {
    return { error: 'Dit verzoek is al afgehandeld.' };
  }

  after(async () => {
    const { data: tech } = await supabase
      .from('technicians')
      .select('telegram_chat_id')
      .eq('id', payout.technician_id)
      .maybeSingle();
    if (!tech?.telegram_chat_id) return;

    const amount = MONEY.format(Number(payout.amount));
    const message =
      status === 'paid'
        ? `Uw uitbetaling van ${amount} is betaald.`
        : `Uw uitbetaling van ${amount} is afgewezen. Neem contact op met kantoor voor meer info.`;
    await sendTelegram(tech.telegram_chat_id, message);
  });

  return { ok: true };
}
