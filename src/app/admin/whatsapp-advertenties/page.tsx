import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { STUDIO_UI } from '@/config/install';
import { Notice, PageHead } from '../_ui';
import { PreviewText } from '../PreviewLanguage';
import ReviewList, { type Review } from './ReviewList';
import StudioReviewList from './StudioReviewList';

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

  if (STUDIO_UI) {
    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>WhatsApp en advertenties</PreviewText></h1>
        </div>
        {error ? (
          <p className="text-destructive text-sm"><PreviewText>Voer supabase/migrations/0077_whatsapp_ad_reviews.sql uit.</PreviewText></p>
        ) : (
          <StudioReviewList reviews={(data ?? []) as Review[]} />
        )}
      </div>
    );
  }

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
