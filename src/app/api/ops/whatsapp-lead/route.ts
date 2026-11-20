import { NextResponse } from 'next/server';
import { checkOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { toE164NL } from '@/lib/phone';
import { ensureWhatsappLead } from '@/lib/whatsappLead';

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

  /* Shared with the Meta webhook (src/lib/whatsappLead.ts), so both paths make the same lead. */
  const result = await ensureWhatsappLead(createSupabaseAdminClient(), phone, text);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  if (!result.created) return NextResponse.json({ created: false, known: result.known });
  return NextResponse.json({ created: true, leadId: result.leadId });
}
