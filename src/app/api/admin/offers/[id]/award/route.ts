import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { after } from 'next/server';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

const OUTCOME: Record<string, string> = {
  geen_toegang: 'Alleen kantoor kan een klus gunnen.',
  niet_gevonden: 'Dit bod bestaat niet meer of is al beantwoord.',
  geen_bod: 'Deze monteur heeft nog geen bedrag gestuurd.',
};

/**
 * Giving the job to one bidder.
 *
 * The decision itself is one SQL statement (crm_award_offer, 0061): the job
 * changes hands, takes the bid's price and slot, and every other bid on it
 * closes — in one transaction, because a second tap between two of those
 * steps would put two technicians on one job.
 *
 * Telling people comes after, in after(), because it is a courtesy and the
 * award is a fact. A Telegram outage must not roll back a job that is
 * already assigned.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldig bod' }, { status: 400 });

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  /* Read who is involved BEFORE awarding: afterwards every losing bid says
     'declined' and there is no way to tell them apart from an old refusal. */
  const { data: before } = await supabase
    .from('job_offers')
    .select('job_id, technician_id, bid_price, bid_date, bid_start')
    .eq('id', id)
    .maybeSingle();

  const { data: outcome, error } = await supabase.rpc('crm_award_offer', { p_offer: id });

  if (error) {
    console.error('Award failed:', error.message);
    return NextResponse.json(
      {
        error: /does not exist|function/i.test(error.message)
          ? 'Voer supabase/migrations/0061_offer_bids.sql uit.'
          : 'Gunnen mislukt',
      },
      { status: 500 }
    );
  }

  if (outcome !== 'ok') {
    return NextResponse.json({ error: OUTCOME[String(outcome)] ?? String(outcome) }, { status: 409 });
  }

  if (before?.job_id) {
    after(async () => {
      const admin = createSupabaseAdminClient();

      const { data: others } = await admin
        .from('job_offers')
        .select('technician_id, technicians (telegram_chat_id, name)')
        .eq('job_id', before.job_id)
        .neq('id', id);

      const { data: winner } = await admin
        .from('technicians')
        .select('telegram_chat_id')
        .eq('id', before.technician_id)
        .maybeSingle();

      await sendTelegram(
        winner?.telegram_chat_id,
        `🎉 De klus is voor u.\n${before.bid_date} · ${String(before.bid_start ?? '').slice(0, 5)}\n${before.bid_price ? MONEY.format(Number(before.bid_price)) : ''}\n\nU vindt hem bij Vandaag.`
      );

      /* Everyone who bid and lost hears it now rather than discovering it by
         keeping the slot free for a day. */
      for (const row of others ?? []) {
        const tech = row.technicians as unknown as { telegram_chat_id: string | null } | null;
        await sendTelegram(tech?.telegram_chat_id, 'Deze klus is naar een collega gegaan. Bedankt voor het bieden.');
      }
    });
  }

  return NextResponse.json({ ok: true });
}
