'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrmUser } from '@/lib/crmSession';

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
}
