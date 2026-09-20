import { NextResponse, after } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { verifyElevenLabsSignature } from '@/lib/elevenlabsWebhook';

export const dynamic = 'force-dynamic';

interface TranscriptTurn {
  role: 'agent' | 'user';
  message: string | null;
}

interface PostCallPayload {
  type: string;
  data?: {
    conversation_id?: string;
    status?: string;
    transcript?: TranscriptTurn[];
    /*
     * Read defensively. ElevenLabs puts the caller's number under
     * phone_call for a call and somewhere else again for WhatsApp, and the
     * shape differs per channel and per version. Unknown keys are kept in
     * `metadata` rather than guessed at.
     */
    metadata?: {
      call_duration_secs?: number;
      phone_call?: { external_number?: string; direction?: string } | null;
      whatsapp?: {
        /* International digits, no plus: "48500312292". Not external_number —
           that key belongs to phone_call and does not exist here. */
        whatsapp_user_id?: string;
        whatsapp_phone_number_id?: string;
        direction?: string;
      } | null;
      sms?: unknown;
      conversation_initiation_source?: string;
      phone_number?: string;
      from_number?: string;
      [key: string]: unknown;
    };
    conversation_initiation_client_data?: { dynamic_variables?: Record<string, unknown> };
    analysis?: { call_successful?: string; transcript_summary?: string };
  };
}

/**
 * Which channel this conversation came in on.
 *
 * Returns 'unknown' rather than defaulting to 'phone': a missing field is not
 * evidence of a phone call, and a wrong label is worse than an honest blank
 * when someone later filters the list by channel.
 */
function detectChannel(data: NonNullable<PostCallPayload['data']>): string {
  const meta = data.metadata;
  if (!meta) return 'unknown';

  /*
   * Read from the real payload, which the first stored call settled:
   * `metadata.channel` does not exist at all. What ElevenLabs actually sends
   * is one populated sub-object per channel and null for the rest —
   *
   *   phone_call: { type: 'twilio', call_sid, direction, external_number, … }
   *   whatsapp:   null
   *   sms:        null
   *
   * The previous version led with `metadata.channel`, which was dead code,
   * and then fell through to `phone_call` — right for a call by luck, and
   * wrong for WhatsApp, which would have been stored as 'unknown' because
   * nothing here ever looked at `metadata.whatsapp`.
   */
  if (meta.whatsapp) return 'whatsapp';
  if (meta.phone_call) return 'phone';
  if (meta.sms) return 'sms';

  /* Last resort, and a real one: the source that opened the conversation. */
  const source = String(meta.conversation_initiation_source ?? '').toLowerCase();
  if (source.includes('whatsapp')) return 'whatsapp';
  if (source.includes('twilio') || source.includes('phone')) return 'phone';

  return 'unknown';
}

/** The customer's number, from whichever key this payload happens to use. */
function detectPhone(data: NonNullable<PostCallPayload['data']>): string | null {
  const meta = data.metadata;

  /*
   * A call gives "+31611751231" under phone_call.external_number. WhatsApp
   * gives "48500312292" under whatsapp.whatsapp_user_id — international
   * digits, no plus, and a different key entirely. The first version of this
   * guessed at external_number/phone_number inside the whatsapp object; the
   * first stored WhatsApp conversation showed neither exists, which is why
   * that row landed with no number at all.
   */
  const fromCall = meta?.phone_call?.external_number;
  if (typeof fromCall === 'string' && fromCall.trim()) return fromCall.trim();

  const waUser = meta?.whatsapp?.whatsapp_user_id;
  if (typeof waUser === 'string' && waUser.trim()) {
    const digits = waUser.replace(/\D/g, '');
    /* Prefixed here rather than stored bare: every other number in this
       database is E.164, and a bare "48500312292" joins against nothing. */
    return digits ? `+${digits}` : null;
  }

  const fallback = meta?.from_number ?? meta?.phone_number;
  return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : null;
}

const CALL_OUTCOME: Record<string, string> = {
  success: '✅ Gelukt',
  failure: '❌ Mislukt',
  unknown: '❔ Onbekend',
};

function minutesSeconds(totalSeconds: number | undefined): string {
  if (!totalSeconds) return '—';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Telegram caps a message at 4096 characters — split on line breaks, never mid-line. */
function chunkText(text: string, maxLen: number): string[] {
  const lines = text.split('\n');
  const chunks: string[] = [];
  let current = '';
  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > maxLen && current) {
      chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * ElevenLabs' post-call webhook, for the AI agent that answers the phone and
 * replies on WhatsApp. This is the only place a conversation enters our own
 * systems — everything else lives on ElevenLabs' side.
 *
 * Does two things, in this order: writes the conversation to
 * agent_conversations, then pushes outcome + summary + transcript to every
 * office user who has connected their Telegram (admin_telegram). The write
 * comes first because it is the half that cannot be redone later.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  const signature = request.headers.get('elevenlabs-signature');

  if (!secret || !verifyElevenLabsSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  let payload: PostCallPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (payload.type !== 'post_call_transcription' || !payload.data) {
    return NextResponse.json({ ok: true });
  }

  const { data } = payload;
  const outcome = CALL_OUTCOME[data.analysis?.call_successful ?? 'unknown'] ?? data.analysis?.call_successful ?? '—';
  const duration = minutesSeconds(data.metadata?.call_duration_secs);
  const summary = data.analysis?.transcript_summary?.trim();

  const header = [
    '📞 Gesprek met de spraakassistent afgerond',
    `Uitkomst: ${outcome} · Duur: ${duration}`,
    summary ? `\nSamenvatting:\n${summary}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const lines = (data.transcript ?? [])
    .filter((turn) => turn.message)
    .map((turn) => `${turn.role === 'agent' ? 'Agent' : 'Klant'}: ${turn.message}`);
  const transcriptText = lines.length ? lines.join('\n') : null;

  after(async () => {
    const admin = createSupabaseAdminClient();

    /*
     * Store first, notify second. Telegram is a convenience; the record is the
     * thing that cannot be recreated, and a failure to reach Telegram must not
     * take the transcript down with it.
     *
     * onConflict on conversation_id makes a retried delivery a no-op instead of
     * a duplicate — webhooks retry, and ElevenLabs is no exception.
     */
    const { error: storeError } = await admin
      .from('agent_conversations')
      .upsert(
        {
          conversation_id: data.conversation_id ?? `onbekend-${Date.now()}`,
          channel: detectChannel(data),
          phone: detectPhone(data),
          status: data.status ?? null,
          outcome: data.analysis?.call_successful ?? null,
          duration_secs: data.metadata?.call_duration_secs ?? null,
          summary: summary ?? null,
          transcript: data.transcript ?? null,
          metadata: data.metadata ?? null,
        },
        { onConflict: 'conversation_id' },
      );
    if (storeError) {
      console.error('Storing agent conversation failed:', storeError.message);
    }

    const { data: recipients, error: recipientsError } = await admin
      .from('admin_telegram')
      .select('telegram_chat_id');
    if (recipientsError) {
      console.error('Reading admin_telegram failed:', recipientsError.message);
      return;
    }
    if (!recipients?.length) return;

    const chunks = transcriptText ? chunkText(transcriptText, 3900) : [];
    for (const recipient of recipients) {
      await sendTelegram(recipient.telegram_chat_id, header);
      for (const [index, chunk] of chunks.entries()) {
        const label = chunks.length > 1 ? `Transcript (${index + 1}/${chunks.length}):\n` : 'Transcript:\n';
        await sendTelegram(recipient.telegram_chat_id, `${label}${chunk}`);
      }
    }
  });

  return NextResponse.json({ ok: true });
}
