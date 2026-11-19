import { NextResponse, after } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { notifyNewLead } from '@/lib/leadNotify';
import { toE164NL } from '@/lib/phone';

export const dynamic = 'force-dynamic';

/**
 * A customer wrote to the business WhatsApp and nobody knew. The server's
 * listener (no AI) posts the number and the first message here; this makes
 * a `whatsapp` lead and sends the usual alert, once per number.
 *
 * Anyone who already has a lead or a job is left alone: they are known, and
 * a second row would only make them look new again. Only the number and the
 * first message are stored, never the chat.
 */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { phone?: unknown; text?: unknown } | null;
  const raw = typeof body?.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  /* WhatsApp numbers arrive as international digits without the plus. */
  const phone = raw.length >= 10 && raw.length <= 15 ? toE164NL(`+${raw}`) : null;
  if (!phone) return NextResponse.json({ error: 'Ongeldig nummer' }, { status: 400 });
  const text = typeof body?.text === 'string' ? body.text.replace(/\s+/g, ' ').trim().slice(0, 500) : '';

  const supabase = createSupabaseAdminClient();
  const last9 = phone.slice(-9);
  const [lead, job] = await Promise.all([
    supabase.from('leads').select('id').or(`phone_e164.eq.${phone},phone.ilike.%${last9}`).limit(1),
    supabase.from('jobs').select('id').ilike('customer_phone', `%${last9}`).limit(1),
  ]);
  const failed = lead.error ?? job.error;
  if (failed) {
    console.error('ops whatsapp-lead read failed:', failed.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
  if (lead.data?.length || job.data?.length) {
    return NextResponse.json({ created: false, known: lead.data?.length ? 'lead' : 'job' });
  }

  const row = { phone, phone_e164: phone, source: 'whatsapp' };
  const { data, error } = await supabase.from('leads').insert([row]).select('id').single();
  if (error || !data) {
    console.error('ops whatsapp-lead insert failed:', error?.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  const leadId = (data as { id: string }).id;

  if (text) {
    const note = await supabase
      .from('lead_notes')
      .insert([{ lead_id: leadId, body: `Eerste WhatsApp: ${text}`, author_email: 'whatsapp' }]);
    if (note.error) console.error('ops whatsapp-lead note failed:', note.error.message);
  }

  await logOps(supabase, 'lead.whatsapp', { leadId });
  after(async () => {
    try {
      await notifyNewLead({ ...row, id: leadId, service: text ? text.slice(0, 120) : null, status: 'new' });
    } catch (notifyError) {
      console.error('[whatsapp-lead] lead saved but the alert failed', leadId, notifyError);
    }
  });
  return NextResponse.json({ created: true, leadId });
}
