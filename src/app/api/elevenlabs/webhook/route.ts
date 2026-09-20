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
      phone_call?: { external_number?: string; direction?: string };
      phone_number?: string;
      from_number?: string;
      channel?: string;
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
  const raw = String(data.metadata?.channel ?? '').toLowerCase();
  if (raw.includes('whatsapp')) return 'whatsapp';
  if (raw.includes('phone') || raw.includes('voice')) return 'phone';
  if (data.metadata?.phone_call) return 'phone';
  return 'unknown';
}

/** The customer's number, from whichever key this payload happens to use. */
function detectPhone(data: NonNullable<PostCallPayload['data']>): string | null {
  const candidate =
    data.metadata?.phone_call?.external_number ??
    data.metadata?.from_number ??
    data.metadata?.phone_number;
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
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
