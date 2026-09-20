import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Empty, Notice } from '../_ui';
import { toE164NL } from '@/lib/phone';
import ConversationConsole, { type Conversation } from './ConversationConsole';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 100;

/**
 * Everything the AI agent has said and heard, phone and WhatsApp together.
 *
 * Laid out as a console rather than a feed of cards: a list to pick from, the
 * conversation itself, and — the part that makes it a CRM screen instead of a
 * log viewer — who this caller already is. A number on its own is not an
 * answer to "should I ring them back"; the lead they filled in two hours ago
 * and the job already in the agenda are.
 *
 * The matching is done here, on the server, because it is two extra queries
 * against columns that are already indexed, and doing it in the browser would
 * mean shipping every lead and job to the page to find two of them.
 */
export default async function GesprekkenPage() {
  await requireOfficeUser('/admin/gesprekken');
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('agent_conversations')
    .select('id, conversation_id, channel, phone, outcome, duration_secs, summary, transcript, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  const rows = data ?? [];

  /*
   * Match on E.164 through the shared normaliser, never on the raw string:
   * the agent reports "+31611751231" and a web form stores whatever the
   * customer typed, so a literal comparison finds nothing and the console
   * would quietly claim every caller is a stranger.
   */
  const numbers = [...new Set(rows.map((r) => toE164NL(r.phone)).filter((n): n is string => Boolean(n)))];

  interface LeadMatch {
    id: string | number;
    name: string | null;
    phone_e164: string | null;
    brand: string | null;
    model: string | null;
    year: string | null;
    service: string | null;
    postcode: string | null;
    status: string | null;
    created_at: string;
  }

  interface JobMatch {
    id: string | number;
    customer_phone: string | null;
    scheduled_date: string | null;
    slot_start: string | null;
    status: string | null;
    service_type: string | null;
    car_make: string | null;
    car_model: string | null;
    city: string | null;
  }

  let leads: LeadMatch[] = [];
  let jobs: JobMatch[] = [];

  if (numbers.length) {
    const [leadResult, jobResult] = await Promise.all([
      supabase
        .from('leads')
        .select('id, name, phone_e164, brand, model, year, service, postcode, status, created_at')
        .in('phone_e164', numbers)
        .order('created_at', { ascending: false }),
      /*
       * jobs has no phone index and stores the number as it was typed, so it
       * cannot be filtered with .in() on the E.164 list the way leads can —
       * the normalisation has to happen in JS. Bounded to the most recent 300
       * rather than the whole table.
       */
      supabase
        .from('jobs')
        .select('id, customer_phone, scheduled_date, slot_start, status, service_type, car_make, car_model, city')
        .order('scheduled_date', { ascending: false })
        .limit(300),
    ]);
    leads = (leadResult.data ?? []) as LeadMatch[];
    jobs = (jobResult.data ?? []) as JobMatch[];
  }

  /* Newest first above, so the first hit for a number is its latest. */
  const leadByPhone = new Map<string, LeadMatch>();
  for (const lead of leads) {
    const key = lead.phone_e164;
    if (key && !leadByPhone.has(key)) leadByPhone.set(key, lead);
  }

  const jobByPhone = new Map<string, JobMatch>();
  for (const job of jobs) {
    const key = toE164NL(job.customer_phone);
    if (key && !jobByPhone.has(key)) jobByPhone.set(key, job);
  }

  /*
   * The journey rail needs every conversation this number has had, not just
   * the selected one — so the phone is normalised onto each row here and the
   * grouping happens in the client, which already holds the whole list.
   */
  const conversations: Conversation[] = rows.map((row) => {
    const key = toE164NL(row.phone);
    const lead = key ? leadByPhone.get(key) ?? null : null;
    const job = key ? jobByPhone.get(key) ?? null : null;
    return {
      id: row.id,
      channel: row.channel,
      phone: row.phone,
      phoneKey: key,
      outcome: row.outcome,
      durationSecs: row.duration_secs,
      summary: row.summary,
      turns: (Array.isArray(row.transcript) ? row.transcript : [])
        .map((t: { role?: string; message?: string | null }) => ({
          role: (t.role === 'agent' ? 'agent' : 'user') as 'agent' | 'user',
          message: t.message ?? '',
        }))
        .filter((t) => t.message),
      createdAt: row.created_at,
      lead: lead
        ? {
            id: String(lead.id),
            name: lead.name,
            car: [lead.brand, lead.model, lead.year].filter(Boolean).join(' ') || null,
            service: lead.service,
            postcode: lead.postcode,
            status: lead.status,
            createdAt: lead.created_at,
          }
        : null,
      job: job
        ? {
            id: String(job.id),
            date: job.scheduled_date,
            slot: job.slot_start ? String(job.slot_start).slice(0, 5) : null,
            status: job.status,
            service: job.service_type,
            car: [job.car_make, job.car_model].filter(Boolean).join(' ') || null,
            city: job.city,
          }
        : null,
    };
  });

  return (
    <>
      <PageHead
        title="Gesprekken"
        sub="Telefoon en WhatsApp van de AI-assistent, met samenvatting, transcript en wie de beller al is."
      />

      {error && (
        <Notice tone="bad">
          Kon de gesprekken niet laden: {error.message}
        </Notice>
      )}

      {!error && conversations.length === 0 && (
        <Empty>
          Nog geen gesprekken opgeslagen. Ze verschijnen hier zodra de assistent
          een gesprek afrondt — bij WhatsApp pas als het gesprek is afgelopen,
          niet na elk bericht.
        </Empty>
      )}

      {conversations.length > 0 && <ConversationConsole conversations={conversations} />}
    </>
  );
}
