import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PreviewText } from '../PreviewLanguage';
import AnalyseView, { type Declined, type Loss, type PriceLine, type Quote } from './AnalyseView';

export const dynamic = 'force-dynamic';

/**
 * What the WhatsApp history says about our prices: every price question the
 * AI found in the chats, what we asked, and why people said yes or no. Each
 * number opens the chats behind it, and the office marks rows right or wrong.
 */
export default async function WhatsappAnalysePage() {
  await requireOfficeUser('/admin/whatsapp-analyse');
  const supabase = await createSupabaseServerClient();

  const [quotes, prices, losses, declined] = await Promise.all([
    supabase
      .from('whatsapp_quotes')
      .select(
        'id, phone, contact_name, asked_at, quoted_at, first_reply_at, reply_minutes, context, make, model, year, scenario, problem, product, city, urgency, conditions, price_amount, price_max, price_kind, price_vat, price_vat_assumed, price_incl, quote_excerpt, outcome, lost_reason, lost_detail, declined_reason, declined_detail, price_objection, competitor_price, competitor, we_lowered_price, final_price_amount, job_id, confidence, review',
      )
      .order('asked_at', { ascending: false })
      .limit(5000),
    supabase.from('whatsapp_price_list').select('*').order('quotes', { ascending: false }),
    supabase.from('whatsapp_loss_reasons').select('*').order('lost', { ascending: false }),
    supabase.from('whatsapp_declined_cars').select('*').order('declined', { ascending: false }),
  ]);

  const error = quotes.error ?? prices.error ?? losses.error ?? declined.error;

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight">
          <PreviewText>WhatsApp-analyse</PreviewText>
        </h1>
        <p className="text-muted-foreground text-sm">
          <PreviewText>Prijsvragen uit alle WhatsApp-gesprekken: wat we vroegen, wat won en waarom klanten afhaakten.</PreviewText>
        </p>
      </div>
      {error ? (
        <p className="text-destructive text-sm">
          <PreviewText>Voer supabase/migrations/0106_whatsapp_quotes.sql uit en importeer de WhatsApp-gegevens.</PreviewText>
        </p>
      ) : (
        <AnalyseView
          quotes={(quotes.data ?? []) as Quote[]}
          prices={(prices.data ?? []) as PriceLine[]}
          losses={(losses.data ?? []) as Loss[]}
          declined={(declined.data ?? []) as Declined[]}
        />
      )}
    </div>
  );
}
