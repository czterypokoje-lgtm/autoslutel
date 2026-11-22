import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logOps } from '@/lib/opsAuth';
import { notifyNewLead } from '@/lib/leadNotify';

/**
 * A number writes to the business WhatsApp for the first time: make a
 * `whatsapp` lead and send the usual alert, once per number. Anyone who already
 * has a lead or a job is left alone — a second row would only make them look
 * new again. Only the number and the first message are stored, never the chat.
 *
 * Shared by the ops route (the old server listener) and the Meta webhook.
 */
export async function ensureWhatsappLead(
  supabase: SupabaseClient,
  phone: string,
  text: string
): Promise<{ created: boolean; leadId?: string; known?: 'lead' | 'job'; error?: string }> {
  const last9 = phone.slice(-9);
  const [lead, job] = await Promise.all([
    supabase.from('leads').select('id').or(`phone_e164.eq.${phone},phone.ilike.%${last9}`).limit(1),
    supabase.from('jobs').select('id').ilike('customer_phone', `%${last9}`).limit(1),
  ]);
  const failed = lead.error ?? job.error;
  if (failed) {
    console.error('whatsapp-lead read failed:', failed.message);
    return { created: false, error: 'Lezen mislukt' };
  }
  if (lead.data?.length || job.data?.length) {
    return { created: false, known: lead.data?.length ? 'lead' : 'job' };
  }

  const row = { phone, phone_e164: phone, source: 'whatsapp' };
  const { data, error } = await supabase.from('leads').insert([row]).select('id').single();
  if (error || !data) {
    console.error('whatsapp-lead insert failed:', error?.message);
    return { created: false, error: 'Opslaan mislukt' };
  }
  const leadId = String((data as { id: string }).id);

  if (text) {
    const note = await supabase
      .from('lead_notes')
      .insert([{ lead_id: leadId, body: `Eerste WhatsApp: ${text}`, author_email: 'whatsapp' }]);
    if (note.error) console.error('whatsapp-lead note failed:', note.error.message);
  }

  await logOps(supabase, 'lead.whatsapp', { leadId });
  try {
    await notifyNewLead({ ...row, id: leadId, service: text ? text.slice(0, 120) : null, status: 'new' });
  } catch (notifyError) {
    console.error('[whatsapp-lead] lead saved but the alert failed', leadId, notifyError);
  }
  return { created: true, leadId };
}
