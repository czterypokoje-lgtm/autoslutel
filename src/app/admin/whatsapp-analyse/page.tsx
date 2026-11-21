import { Suspense } from 'react';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PreviewText } from '../PreviewLanguage';
import AnalyseView, { type Quote } from './AnalyseView';

export const dynamic = 'force-dynamic';

/**
 * What the WhatsApp history says about our prices: every price question the
 * AI found in the chats, what we asked, and why people said yes or no. Each
 * number opens the chats behind it, and the office marks rows right or wrong.
 */
export default async function WhatsappAnalysePage() {
  await requireOfficeUser('/admin/whatsapp-analyse');
  const supabase = await createSupabaseServerClient();

  // Every report on the page is computed from these rows in the browser, so the
  // filters apply to all of them at once. A few hundred rows a year: cheap.
  const { data, error } = await supabase
    .from('whatsapp_quotes')
    .select(
      'id, phone, contact_name, asked_at, quoted_at, reply_minutes, context, make, model, year, kenteken, scenario, problem, product, city, postcode, urgency, requested_time, conditions, price_amount, price_max, price_kind, price_vat, price_vat_assumed, price_incl, quote_excerpt, outcome, lost_reason, lost_detail, declined_reason, declined_detail, price_objection, time_objection, competitor_price, competitor, customer_budget, we_lowered_price, final_price_amount, we_followed_up, source, job_id, confidence, review',
    )
    .order('asked_at', { ascending: false })
    .limit(10000);

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
        <Suspense>
          <AnalyseView quotes={(data ?? []) as Quote[]} />
        </Suspense>
      )}
    </div>
  );
}
