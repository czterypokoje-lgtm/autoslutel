/*
 * Webshop chats that the ElevenLabs webhook stored as channel 'unknown'.
 *
 * The chat button on the webshop embeds the ElevenLabs widget, which reports
 * conversation_initiation_source = 'widget' and no phone/whatsapp/sms object.
 * The webhook only knew phone, WhatsApp and SMS, so these landed as 'unknown'
 * and appeared under no channel in Gesprekken. Counted on 21 Nov 2026: 14
 * rows, 27 Oct - 14 Nov. The webhook now files new ones as 'webchat'; this
 * moves the old ones. 'webchat' is the channel the webshop's own assistant
 * (repo shop, src/lib/chat/store.ts) already writes.
 *
 * Only the widget rows. 'react_sdk' and 'unknown' sources are left alone until
 * it is known what they are.
 *
 * Run after 0106. Idempotent.
 */
update public.agent_conversations
   set channel = 'webchat'
 where channel = 'unknown'
   and metadata->>'conversation_initiation_source' = 'widget';

select channel, count(*) from public.agent_conversations group by 1 order by 2 desc;
