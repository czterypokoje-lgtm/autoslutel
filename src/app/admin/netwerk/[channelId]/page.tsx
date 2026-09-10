import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ChatClient from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  await requireCrmUser();
  const { channelId } = await params;
  const supabase = await createSupabaseServerClient();

  // Validate channel exists (and user can see it)
  const { data: channel, error } = await supabase
    .from('chat_channels')
    .select('id, name, type, target_make')
    .eq('id', channelId)
    .single();

  if (error || !channel) {
    return <div>Kanaal niet gevonden of geen toegang.</div>;
  }

  // Fetch initial messages (top-level only)
  const { data: initialMessages } = await supabase
    .from('chat_messages')
    .select('*, technicians:technician_id(name)')
    .eq('channel_id', channelId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .limit(50);

  return (
    <ChatClient
      channel={channel}
      initialMessages={initialMessages || []}
    />
  );
}
