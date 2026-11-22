'use server';

import { redirect } from 'next/navigation';
import { DEMO_BOT_AGENT } from '@/lib/kfcDemoBotRules';
import { requireOfficeUser } from '@/lib/crmSession';
import { normalizeKfcCall, reviewAgentIds } from '../../../../supabase/functions/_shared/kfcCallReview';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const path = '/admin/bot-conversations';

async function readElevenLabs(pathname: string, key: string) {
  const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations' + pathname, {
    headers: { 'xi-api-key': key }, cache: 'no-store', signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('History request failed');
  return response.json();
}

export async function syncBotConversations() {
  await requireOfficeUser(path);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) redirect(path + '?sync=unavailable');

  const ids = reviewAgentIds(process.env.KFC_REVIEW_AGENT_IDS);
  const db = createSupabaseAdminClient();
  let failed = false;
  try {
    for (const agent of ids) {
      const params = new URLSearchParams({ agent_id: agent, page_size: '20' });
      const page = await readElevenLabs('?' + params, key);
      for (const entry of page.conversations ?? []) {
        if (!['done', 'failed'].includes(entry.status) || !/^conv_[a-z0-9]+$/i.test(entry.conversation_id)) continue;
        const data = await readElevenLabs('/' + entry.conversation_id, key);
        const row = normalizeKfcCall(data, ids);
        if (!row) continue;
        const { error } = await db.from('agent_conversations').upsert(row, { onConflict: 'conversation_id' });
        if (error) throw error;
      }
    }
  } catch {
    failed = true;
  }
  redirect(path + (failed ? '?sync=error' : '?sync=complete'));
}

export async function deleteBotConversation(formData: FormData) {
  const user = await requireOfficeUser(path);
  const id = formData.get('conversation_id');
  if (typeof id === 'string' && /^kfc-sim-[a-f0-9-]{36}$/.test(id) && user.role === 'owner' && process.env.KFC_DEMO_MODE === '1') {
    const { error } = await createSupabaseAdminClient().from('agent_conversations').delete()
      .eq('conversation_id', id).eq('metadata->kfc_call_review->>agent_id', DEMO_BOT_AGENT);
    redirect(path + (error ? '?deleted=error' : '?deleted=yes'));
  }
  if (typeof id !== 'string' || !/^conv_[a-z0-9]+$/i.test(id)) redirect(path + '?deleted=error');
  const { data, error } = await createSupabaseAdminClient().rpc('kfc_delete_bot_conversation', {
    p_id: id, p_agents: reviewAgentIds(process.env.KFC_REVIEW_AGENT_IDS),
  });
  redirect(path + (error || data !== true ? '?deleted=error' : '?deleted=yes'));
}
