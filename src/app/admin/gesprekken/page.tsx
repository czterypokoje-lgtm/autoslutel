import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, Empty, Badge } from '../_ui';
import styles from './gesprekken.module.css';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface TranscriptTurn {
  role?: string;
  message?: string | null;
}

interface ConversationRow {
  id: string;
  conversation_id: string;
  channel: string;
  phone: string | null;
  outcome: string | null;
  duration_secs: number | null;
  summary: string | null;
  transcript: TranscriptTurn[] | null;
  created_at: string;
}

const CHANNEL_LABEL: Record<string, string> = {
  phone: '📞 Telefoon',
  whatsapp: '💬 WhatsApp',
  unknown: '— Onbekend',
};

/* Badge's own vocabulary — ok / warn / stop / info — not colour names. */
const OUTCOME_TONE: Record<string, 'ok' | 'warn' | 'stop' | 'info'> = {
  success: 'ok',
  failure: 'stop',
  unknown: 'info',
};

function duration(secs: number | null) {
  if (!secs) return '—';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function when(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

/**
 * Everything the AI agent has said and heard, phone and WhatsApp together.
 *
 * Before this the transcripts only existed in Telegram, which meant they could
 * be read once and never searched. The list is deliberately flat and newest
 * first — the office question is almost always "what did we just miss", not
 * "find me a call from March".
 */
export default async function GesprekkenPage() {
  await requireOfficeUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('agent_conversations')
    .select('id, conversation_id, channel, phone, outcome, duration_secs, summary, transcript, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  const rows = (data ?? []) as ConversationRow[];

  return (
    <>
      <PageHead
        title="Gesprekken"
        sub="Telefoon- en WhatsApp-gesprekken van de AI-assistent, met samenvatting en volledig transcript."
      />

      {error && (
        <Card>
          <p className={styles.error}>
            Kon de gesprekken niet laden: {error.message}
            <br />
            <span className={styles.hint}>
              Staat migratie 0044_agent_conversations.sql al in de database?
            </span>
          </p>
        </Card>
      )}

      {!error && rows.length === 0 && (
        <Empty>
          Nog geen gesprekken opgeslagen. Ze verschijnen hier zodra de assistent
          een gesprek afrondt.
        </Empty>
      )}

      <div className={styles.list}>
        {rows.map((row) => {
          const turns = Array.isArray(row.transcript) ? row.transcript : [];
          return (
            <Card key={row.id}>
              <div className={styles.meta}>
                <span className={styles.channel}>
                  {CHANNEL_LABEL[row.channel] ?? row.channel}
                </span>
                {row.phone ? (
                  <a className={styles.phone} href={`/admin/klanten/${encodeURIComponent(row.phone)}`}>
                    {row.phone}
                  </a>
                ) : (
                  <span className={styles.noPhone}>geen nummer</span>
                )}
                <span className={styles.when}>{when(row.created_at)}</span>
                <span className={styles.duration}>{duration(row.duration_secs)}</span>
                {row.outcome && (
                  <Badge tone={OUTCOME_TONE[row.outcome] ?? 'info'}>{row.outcome}</Badge>
                )}
              </div>

              {row.summary && <p className={styles.summary}>{row.summary}</p>}

              {turns.length > 0 && (
                <details className={styles.transcript}>
                  <summary>Transcript ({turns.length} berichten)</summary>
                  <div className={styles.turns}>
                    {turns.map((turn, i) => (
                      <p
                        key={i}
                        className={turn.role === 'agent' ? styles.agent : styles.user}
                      >
                        <strong>{turn.role === 'agent' ? 'Assistent' : 'Klant'}</strong>
                        {turn.message}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
