import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendTelegram } from './telegram';
import { judgeAll, needsAlert, type AdVisit, type Judgement } from './clickFraud';

/**
 * Tell the office the day click fraud starts, not the next time someone
 * happens to open a screen.
 *
 * /admin/klikfraude has had the evidence since 0073, but it had to be opened
 * to say anything. A screen you have to remember tells you nothing: the fraud
 * starts on a Wednesday and you find out the following Monday, by which point
 * the exclusions you could have set have already been paid for.
 *
 * ONE ALERT PER ADDRESS, EVER. public.ad_fraud_alerts is the memory that
 * makes "new" mean new. Without it the nightly run would re-report the same
 * addresses, and after three nights nobody reads the message — which is worse
 * than no message, because it hides the night something genuinely changes.
 *
 * An address that gets worse after being reported is not re-reported. The
 * screen keeps the detail; this is only the tap on the shoulder.
 */

/** The window judged on each run. Matches the screen's default. */
const WINDOW_DAYS = 30;
const MAX_ROWS = 5000;

/** Addresses named in one message before it becomes a wall of text. */
const MAX_LISTED = 8;

export interface FraudAlertResult {
  /** Addresses that crossed into `fraude` for the first time on this run. */
  newly: string[];
  /** True when a message actually reached somebody. */
  delivered: boolean;
  /** Rows removed by the 90-day prune, so the cron can report it. */
  pruned: number;
}

function describe(judgement: Judgement): string {
  const parts = [
    `${judgement.visits} klik${judgement.visits === 1 ? '' : 'ken'}`,
    `${judgement.silent} stil`,
  ];
  if (judgement.country) parts.push(judgement.country);

  /* One reason, not all of them: the office needs to know why it is being
     told, and the screen has the rest. */
  const why = judgement.reasons[0] ?? 'meerdere zwakke signalen samen';
  return `• ${judgement.ip} — ${parts.join(', ')}\n  ${why}`;
}

function compose(newly: Judgement[]): string {
  const count = newly.length;
  const head =
    count === 1
      ? '1 nieuw IP-adres is beoordeeld als klikfraude.'
      : `${count} nieuwe IP-adressen zijn beoordeeld als klikfraude.`;

  const listed = newly.slice(0, MAX_LISTED).map(describe).join('\n');
  const rest =
    count > MAX_LISTED ? `\n…en nog ${count - MAX_LISTED} op het scherm.` : '';

  /*
   * The message says what to do, in the order that matters, because the
   * expensive mistakes are both in the doing and not in the detecting:
   * claiming what Google already credited wastes a ticket, and excluding an
   * address that was never checked costs a customer nobody will miss.
   *
   * Performance Max is named explicitly: it has no IP exclusions at all, and
   * someone who does not know that will look for a setting that is not there
   * and conclude the alert was wrong.
   */
  return (
    `${head}\n\n${listed}${rest}\n\n` +
    'Wat nu:\n' +
    '1. Kijk eerst in Google Ads bij «Ongeldige klikken». Wat daar al staat, heeft Google zelf gecrediteerd.\n' +
    '2. Bekijk de opname in Clarity (Filters → Aangepaste tags → ad_click) voordat je iemand uitsluit.\n' +
    '3. Zoekcampagne: Instellingen → Aanvullende instellingen → IP-uitsluitingen. Performance Max heeft die niet — daar is de creditering de enige weg.\n\n' +
    'https://autosleutel24.nl/admin/klikfraude'
  );
}

/** Every office chat that should hear about this, deduplicated. */
async function officeChats(supabase: SupabaseClient): Promise<Set<string>> {
  const chats = new Set<string>();

  const envChat = process.env.TELEGRAM_OFFICE_CHAT_ID;
  if (envChat) chats.add(envChat);

  try {
    const { data } = await supabase.from('admin_telegram').select('telegram_chat_id');
    for (const row of data ?? []) chats.add(String(row.telegram_chat_id));
  } catch (error) {
    /* The env chat still gets it; one failed lookup must not cost the alert. */
    console.error('[klikfraude] admin_telegram lookup failed:', error);
  }

  return chats;
}

/**
 * Judge the window, report what is new, and prune what is too old to keep.
 *
 * Takes a service-role client: this runs from a cron with no session, and it
 * has to read every visit rather than the ones one user may see.
 */
export async function notifyNewClickFraud(
  supabase: SupabaseClient
): Promise<FraudAlertResult> {
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

  const { data: visits, error } = await supabase
    .from('ad_visits')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);

  // Table missing (0073 not yet applied) or unreachable. Say so loudly rather
  // than reporting a quiet night, which is what "no alert" would look like.
  if (error) throw new Error(`ad_visits unreadable: ${error.message}`);

  const judgements = judgeAll((visits ?? []) as AdVisit[]);
  const fraud = judgements.filter((j) => j.tier === 'fraude');

  /*
   * The 90-day prune lives here rather than in its own schedule, because an
   * IP address is personal data and a promise that depends on somebody
   * remembering to add a second cron job is not a promise. Runs before the
   * alert so a failure to prune is still visible in the logs even on a quiet
   * night.
   */
  let pruned = 0;
  try {
    const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const { data: removed } = await supabase
      .from('ad_visits')
      .delete()
      .lt('created_at', cutoff)
      .select('id');
    pruned = removed?.length ?? 0;
  } catch (pruneError) {
    console.error('[klikfraude] prune failed:', pruneError);
  }

  if (!fraud.length) return { newly: [], delivered: false, pruned };

  const { data: already } = await supabase
    .from('ad_fraud_alerts')
    .select('ip')
    .in(
      'ip',
      fraud.map((j) => j.ip)
    );
  const seen = new Set((already ?? []).map((row) => String(row.ip)));

  const newly = needsAlert(fraud, seen);
  if (!newly.length) return { newly: [], delivered: false, pruned };

  /*
   * Recorded BEFORE sending. If the insert succeeded and the send then failed,
   * the office misses one message and can still see everything on the screen.
   * The other order risks a message sent every single night to a phone that
   * has already been told, which is how an alert stops being read.
   */
  const { error: insertError } = await supabase.from('ad_fraud_alerts').insert(
    newly.map((j) => ({
      ip: j.ip,
      points: j.points,
      visits: j.visits,
      reasons: j.reasons.join('; ').slice(0, 2000),
    }))
  );
  if (insertError) throw new Error(`ad_fraud_alerts insert failed: ${insertError.message}`);

  let delivered = false;
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const chats = await officeChats(supabase);
    const message = compose(newly);
    for (const chat of chats) {
      await sendTelegram(chat, message).then(
        () => {
          delivered = true;
        },
        (sendError) => {
          console.error(`[klikfraude] send to ${chat} failed:`, sendError);
        }
      );
    }
  }

  if (!delivered) {
    console.error(
      `[klikfraude] ${newly.length} new fraud address(es) reached NOBODY. ` +
        'Set TELEGRAM_BOT_TOKEN + TELEGRAM_OFFICE_CHAT_ID, or connect a chat in Mijn profiel.'
    );
  }

  return { newly: newly.map((j) => j.ip), delivered, pruned };
}
