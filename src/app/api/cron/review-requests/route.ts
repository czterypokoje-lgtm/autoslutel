import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { waLink } from '@/lib/whatsapp';
import { esc, b } from '@/lib/telegramText';
import { SITE_CONFIG } from '@/config/site.config';

export const dynamic = 'force-dynamic';

/**
 * Ask yesterday's customers for a Google review.
 *
 * WHY THIS EXISTS
 *
 * 72 jobs finished and ten reviews on the Google profile. Nothing in this
 * system ever asked — not a cron, not a button, not a line in an email — so
 * the gap was never anybody's fault and never got smaller. For a mobile
 * locksmith that number is not vanity: the local pack is where somebody
 * searching "autosleutel kwijt" at eleven at night actually finds a van, and
 * review count is one of the few things deciding whether we appear in it.
 *
 * WHY IT DOES NOT SEND THE MESSAGE ITSELF
 *
 * The customer leaves us a phone number and no email, so the only channel is
 * WhatsApp — and a message a day after the job falls outside the 24-hour
 * window, which means an approved template and a Business API review before a
 * single one could go out. That is a procurement task, not a deploy.
 *
 * What ships instead costs nothing and works today: the office gets one
 * Telegram message listing yesterday's finished jobs, each with a wa.me link
 * that already has the message written. One tap per customer, sent from the
 * number they have been speaking to all along — which answers better than any
 * shortcode would. The same channel the office already watches for leads.
 *
 * Each job is surfaced once. review_requested_at is stamped when it goes into
 * the message, so nobody is asked twice.
 *
 * ponytail: a job the office never taps is simply missed — there is no second
 * reminder and no record of whether the tap happened. If the review count
 * stops moving, that is the thing to add, and the column is already there to
 * build a follow-up on.
 */

/** Jobs finished within this many days are still worth asking about. */
const WINDOW_DAYS = 3;
/** One message to the office; beyond this it is a wall of text nobody taps. */
const MAX_PER_RUN = 10;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const officeChat = process.env.TELEGRAM_OFFICE_CHAT_ID;
  if (!officeChat) {
    /* No point stamping jobs as asked when the message has nowhere to go —
       that would silently burn the one chance each customer gets. */
    return NextResponse.json({ error: 'TELEGRAM_OFFICE_CHAT_ID not configured', asked: 0 }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, customer_name, customer_phone, car_make, car_model, service_type, completed_at')
    .eq('status', 'afgerond')
    .is('review_requested_at', null)
    .not('customer_phone', 'is', null)
    .gte('completed_at', since)
    .order('completed_at', { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error('review-requests query failed', error.code);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
  if (!jobs?.length) return NextResponse.json({ asked: 0, note: 'niets af te handelen' });

  const reviewUrl = SITE_CONFIG.social.google;

  const lines: string[] = [];
  const asked: string[] = [];

  for (const job of jobs) {
    /* Their own name and their own car, because a review request that reads
       like a mailshot gets ignored — and the technician was standing next to
       that car yesterday. */
    const firstName = (job.customer_name ?? '').trim().split(/\s+/)[0] || '';
    const car = [job.car_make, job.car_model].filter(Boolean).join(' ');
    const message = [
      firstName ? `Hallo ${firstName},` : 'Hallo,',
      '',
      car
        ? `bedankt dat wij u gisteren met uw ${car} mochten helpen.`
        : 'bedankt dat wij u mochten helpen.',
      'Zou u ons een beoordeling op Google willen geven? Het kost u een halve minuut en het helpt ons enorm.',
      '',
      reviewUrl,
      '',
      'Met vriendelijke groet,',
      SITE_CONFIG.name,
    ].join('\n');

    const link = waLink(job.customer_phone, message);
    if (!link) continue; // unreadable number: leave it unasked rather than stamped

    /* esc(), because Telegram's HTML parser rejects the whole message on a
       stray & or < — and these are customer names and car models. One
       "Jan & Marie" would mean the office got nothing while every job in this
       batch was stamped as asked. */
    const who = [firstName || 'Klant', car].filter(Boolean).join(' — ');
    lines.push(`• <a href="${esc(link)}">${esc(who)}</a>`);
    asked.push(job.id);
  }

  if (!asked.length) return NextResponse.json({ asked: 0, note: 'geen bruikbare telefoonnummers' });

  const sent = await sendTelegram(
    officeChat,
    [
      `${b('Vraag om een review')} — ${asked.length} afgeronde ${asked.length === 1 ? 'klus' : 'klussen'}`,
      '',
      'Tik een naam aan: WhatsApp opent met de tekst er al in.',
      '',
      ...lines,
    ].join('\n')
  );

  /* Stamped only once Telegram has confirmed it took the message.
     sendTelegram catches everything it meets — a notification must not break
     the thing it reports on — so it reports success instead of throwing. Mark
     on a send that never arrived and those customers are recorded as asked
     while nobody ever asked them, which is the one outcome this route exists
     to prevent. Unmarked, tomorrow's run picks them up again. */
  if (!sent) {
    console.error('review-requests: Telegram refused the message, nothing marked');
    return NextResponse.json({ asked: 0, error: 'Telegram niet bereikbaar' }, { status: 502 });
  }

  const { error: stampError } = await supabase
    .from('jobs')
    .update({ review_requested_at: new Date().toISOString() })
    .in('id', asked);

  if (stampError) {
    console.error('review-requests stamp failed', stampError.code);
    return NextResponse.json({ asked: asked.length, warning: 'verstuurd maar niet gemarkeerd' });
  }

  return NextResponse.json({ asked: asked.length });
}
