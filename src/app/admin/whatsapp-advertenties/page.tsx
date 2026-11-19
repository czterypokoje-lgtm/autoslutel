import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Notice, PageHead } from '../_ui';
import ReviewList, { type Review } from './ReviewList';

export const dynamic = 'force-dynamic';

/**
 * WhatsApp chats that came from an ad. The assistant suggests, the office
 * decides, and only a confirmed chat goes into the file for Google.
 */
export default async function WhatsappAdvertentiesPage() {
  await requireOfficeUser('/admin/whatsapp-advertenties');
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('whatsapp_ad_reviews')
    .select('id, ref, phone_end, chat_at, ai_result, car, price_note, decision, value, work_date, exported_at')
    .order('chat_at', { ascending: false })
    .limit(300);

  return (
    <>
      <PageHead title="WhatsApp en advertenties" />
      {error ? (
        <Notice>Voer supabase/migrations/0077_whatsapp_ad_reviews.sql uit.</Notice>
      ) : (
        <ReviewList reviews={(data ?? []) as Review[]} />
      )}
    </>
  );
}
