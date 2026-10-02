'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireOfficeUser } from '@/lib/crmSession';
import {
  sendInboxMessage,
  markConversationRead,
  type SendResult,
} from '@/lib/berichtenStore';

/**
 * What the office can do to a thread.
 *
 * Server actions rather than route handlers, following netwerk/actions.ts:
 * every one of these writes through the caller's own session client, so the
 * 0062 policies are the real guard and the requireOfficeUser check is the fast
 * one. Both have to pass.
 *
 * None of them throw on a foreseeable failure — they return a message. There
 * is no toast primitive in this CRM by design, so the console renders the
 * string inline, and a thrown error would replace the composer with an error
 * page while the half-typed reply was still in it.
 */

export async function replyToConversation(
  conversationId: string,
  body: string,
): Promise<SendResult> {
  const user = await requireOfficeUser('/admin/berichten');
  const supabase = await createSupabaseServerClient();

  const result = await sendInboxMessage(supabase, conversationId, body, user.id);

  /*
   * Read the moment it is answered. The trigger deliberately does not clear
   * `unread` on an outbound message — it has no idea whether the reply came
   * from the person the thread was waiting on — so the one place that does
   * know says so here.
   */
  if (result.ok) await markConversationRead(supabase, conversationId);

  return result;
}

/** Hand the thread to the AI, or take it back. */
export async function setConversationAi(
  conversationId: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireOfficeUser('/admin/berichten');
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('inbox_conversations')
    .update({ ai_enabled: enabled })
    .eq('id', conversationId);

  if (error) {
    console.error('[berichten] AI omzetten mislukt:', error.message);
    return { ok: false, error: 'Kon de assistent niet omzetten.' };
  }

  revalidatePath('/admin/berichten');
  return { ok: true };
}

export async function assignConversationToMe(
  conversationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireOfficeUser('/admin/berichten');
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('inbox_conversations')
    .update({ assigned_to: user.id })
    .eq('id', conversationId);

  if (error) {
    console.error('[berichten] toewijzen mislukt:', error.message);
    return { ok: false, error: 'Kon het gesprek niet toewijzen.' };
  }

  revalidatePath('/admin/berichten');
  return { ok: true };
}

export async function setConversationState(
  conversationId: string,
  state: 'open' | 'closed',
): Promise<{ ok: boolean; error?: string }> {
  await requireOfficeUser('/admin/berichten');
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('inbox_conversations')
    .update({ state, unread: false })
    .eq('id', conversationId);

  if (error) {
    console.error('[berichten] status zetten mislukt:', error.message);
    return { ok: false, error: 'Kon het gesprek niet bijwerken.' };
  }

  revalidatePath('/admin/berichten');
  return { ok: true };
}

export async function markRead(conversationId: string): Promise<void> {
  await requireOfficeUser('/admin/berichten');
  const supabase = await createSupabaseServerClient();
  await markConversationRead(supabase, conversationId);
}

/**
 * Attach a thread to a lead by hand.
 *
 * The only way an Instagram or Messenger thread ever gets a lead: their ids
 * are scoped to one Meta app and appear on no lead, so there is nothing to
 * match on and nothing to guess from. Somebody who recognises the customer
 * says so, once.
 */
export async function linkConversationToLead(
  conversationId: string,
  leadId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireOfficeUser('/admin/berichten');
  const supabase = await createSupabaseServerClient();

  /* Confirm the lead exists before pointing at it, so a typo is a message
     rather than a foreign-key error page. */
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .maybeSingle();

  if (!lead) return { ok: false, error: 'Die lead bestaat niet.' };

  const { error } = await supabase
    .from('inbox_conversations')
    .update({ lead_id: leadId })
    .eq('id', conversationId);

  if (error) {
    console.error('[berichten] lead koppelen mislukt:', error.message);
    return { ok: false, error: 'Kon de lead niet koppelen.' };
  }

  revalidatePath('/admin/berichten');
  return { ok: true };
}
