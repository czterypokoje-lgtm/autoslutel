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
    metadata?: { call_duration_secs?: number };
    analysis?: { call_successful?: string; transcript_summary?: string };
  };
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
 * ElevenLabs' post-call webhook, for the AI voice agent that answers the
 * phone. There is no other transcript capture anywhere in this app — the
 * whole conversation lives on ElevenLabs' side until this fires once the
 * call ends. Sends the outcome + summary + full transcript to every office
 * user who has connected their Telegram (admin_telegram).
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
