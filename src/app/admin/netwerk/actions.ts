'use server';

import { after } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireCrmUser } from '@/lib/crmSession';
import { sendTelegram } from '@/lib/telegram';

/**
 * Who else can read this channel, so they can be told a message arrived.
 *
 * Deliberately the admin client, not the sender's own session: a monteur's
 * RLS only lets them read their OWN `technician_coverage` and
 * `chat_channel_members` rows (0013/0014's `technician_id = my_technician_id()`
 * policies), so a monteur asking "who else is in this 'make' channel" through
 * their own session would only ever find themselves. The real message insert
 * above already went through the sender's session and its RLS — this only
 * reads, to route a notification, after that write has already been allowed.
 */
async function notifyChannelRecipients(channelId: string, senderTechnicianId: string | null, content: string) {
  const admin = createSupabaseAdminClient();

  const { data: channel } = await admin
    .from('chat_channels')
    .select('name, type, target_make, server_id')
    .eq('id', channelId)
    .maybeSingle();
  if (!channel) return;

  let recipientIds: string[] = [];
  if (channel.type === 'general') {
    const { data } = await admin
      .from('technicians')
      .select('id')
      .eq('server_id', channel.server_id)
      .eq('active', true);
    recipientIds = (data ?? []).map((t) => t.id);
  } else if (channel.type === 'make' && channel.target_make) {
    const { data } = await admin
      .from('technician_coverage')
      .select('technician_id')
      .ilike('make', channel.target_make);
    recipientIds = [...new Set((data ?? []).map((row) => row.technician_id))];
  } else {
    const { data } = await admin.from('chat_channel_members').select('technician_id').eq('channel_id', channelId);
    recipientIds = (data ?? []).map((row) => row.technician_id);
  }

  recipientIds = recipientIds.filter((id) => id !== senderTechnicianId);
  if (!recipientIds.length) return;

  const { data: recipients } = await admin.from('technicians').select('telegram_chat_id').in('id', recipientIds);
  const snippet = content.length > 140 ? `${content.slice(0, 137)}...` : content;
  const message = `Nieuw bericht in #${channel.name}:\n${snippet}\n\nBekijk: https://autosleutel24.nl/admin/netwerk`;

  for (const recipient of recipients ?? []) {
    await sendTelegram(recipient.telegram_chat_id, message);
  }
}

export async function sendMessage(channelId: string, content: string, parentId: string | null = null) {
  const user = await requireCrmUser();
  const supabase = await createSupabaseServerClient();

  let technicianId = null;
  if (user.role === 'monteur') {
    const { data: me } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .single();
    technicianId = me?.id || null;
  }

  // Insert will fail via RLS if user doesn't have access
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      channel_id: channelId,
      content,
      parent_id: parentId,
      user_id: user.role !== 'monteur' ? user.id : null,
      technician_id: technicianId,
    });

  if (error) {
    console.error('Failed to send message:', error.message);
    throw new Error('Kon bericht niet verzenden');
  }

  after(() => notifyChannelRecipients(channelId, technicianId, content));
}
