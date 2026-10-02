import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Empty, Notice } from '../_ui';
import type { InboxChannel } from '@/lib/berichten';
import BerichtenConsole, { type Thread } from './BerichtenConsole';
import styles from './berichten.module.css';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 100;

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Gesloten' },
  { value: '', label: 'Alles' },
] as const;

/**
 * Het postvak: e-mail, WhatsApp, Instagram, Facebook en telefoon op één plek.
 *
 * The thread list is one query against one table, because 0062 keeps
 * `last_message_at` and `last_snippet` on the conversation — the messages
 * themselves are fetched by the console when a thread is opened, the same way
 * a lead's notes are. A hundred threads is a few thousand transcript turns,
 * and all but one of them is for a thread nobody is reading.
 *
 * The lead and the job are resolved here rather than in the browser, for the
 * same reason /admin/gesprekken resolves them here: two indexed queries on the
 * server against shipping every lead and job to the page to find a handful.
 */
export default async function BerichtenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireOfficeUser('/admin/berichten');
  const supabase = await createSupabaseServerClient();

  const params = await searchParams;
  const status = TABS.some((t) => t.value === params.status) ? (params.status ?? 'open') : 'open';

  interface ConversationRow {
    id: string;
    channel: InboxChannel;
    external_id: string;
    display_name: string | null;
    lead_id: string | null;
    assigned_to: string | null;
    state: string;
    ai_enabled: boolean;
    subject: string | null;
    last_message_at: string | null;
    last_inbound_at: string | null;
    last_snippet: string | null;
    unread: boolean;
    created_at: string;
  }

  const listQuery = supabase
    .from('inbox_conversations')
    .select(
      'id, channel, external_id, display_name, lead_id, assigned_to, state, ai_enabled, subject, last_message_at, last_inbound_at, last_snippet, unread, created_at',
    )
    /* Nulls last: a thread with no message yet should not head the list. */
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(PAGE_SIZE);

  const [listResult, ...countResults] = await Promise.all([
    status ? listQuery.eq('state', status) : listQuery,
    ...TABS.filter((t) => t.value).map((tab) =>
      supabase
        .from('inbox_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('state', tab.value),
    ),
  ]);

  const error = listResult.error;
  const rows = (listResult.data ?? []) as ConversationRow[];

  const counts: Record<string, number | null> = {};
  TABS.filter((t) => t.value).forEach((tab, i) => {
    counts[tab.value] = countResults[i]?.count ?? null;
  });

  interface LeadRow {
    id: string;
    name: string | null;
    phone: string | null;
    phone_e164: string | null;
    email: string | null;
    brand: string | null;
    model: string | null;
    year: string | null;
    service: string | null;
    postcode: string | null;
    status: string | null;
    created_at: string;
  }

  interface JobRow {
    id: string;
    lead_id: string | null;
    scheduled_date: string | null;
    slot_start: string | null;
    status: string | null;
    service_type: string | null;
    car_make: string | null;
    car_model: string | null;
    city: string | null;
  }

  const leadIds = [...new Set(rows.map((r) => r.lead_id).filter((id): id is string => Boolean(id)))];

  let leads: LeadRow[] = [];
  let jobs: JobRow[] = [];

  if (leadIds.length) {
    const [leadResult, jobResult] = await Promise.all([
      supabase
        .from('leads')
        .select('id, name, phone, phone_e164, email, brand, model, year, service, postcode, status, created_at')
        .in('id', leadIds),
      /* The job that came out of the lead, newest first so the first hit wins. */
      supabase
        .from('jobs')
        .select('id, lead_id, scheduled_date, slot_start, status, service_type, car_make, car_model, city')
        .in('lead_id', leadIds)
        .order('scheduled_date', { ascending: false }),
    ]);
    leads = (leadResult.data ?? []) as LeadRow[];
    jobs = (jobResult.data ?? []) as JobRow[];
  }

  const leadById = new Map(leads.map((lead) => [String(lead.id), lead]));

  const jobByLead = new Map<string, JobRow>();
  for (const job of jobs) {
    const key = job.lead_id ? String(job.lead_id) : null;
    if (key && !jobByLead.has(key)) jobByLead.set(key, job);
  }

  const threads: Thread[] = rows.map((row) => {
    const lead = row.lead_id ? leadById.get(String(row.lead_id)) ?? null : null;
    const job = row.lead_id ? jobByLead.get(String(row.lead_id)) ?? null : null;

    return {
      id: String(row.id),
      channel: row.channel,
      externalId: row.external_id,
      displayName: row.display_name,
      subject: row.subject,
      state: row.state,
      aiEnabled: row.ai_enabled,
      assigned: Boolean(row.assigned_to),
      unread: row.unread,
      snippet: row.last_snippet,
      lastMessageAt: row.last_message_at ?? row.created_at,
      lastInboundAt: row.last_inbound_at,
      createdAt: row.created_at,
      lead: lead
        ? {
            id: String(lead.id),
            name: lead.name,
            phone: lead.phone_e164 ?? lead.phone,
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
        title="Berichten"
        sub="E-mail, WhatsApp, Instagram, Facebook en telefoon in één postvak, met de lead en de klus erbij."
      />

      <nav className={styles.tabs}>
        {TABS.map((tab) => {
          const active = tab.value === status;
          const href = tab.value ? `/admin/berichten?status=${tab.value}` : '/admin/berichten?status=';
          return (
            <Link
              key={tab.label}
              href={href}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            >
              {tab.label}
              {tab.value && counts[tab.value] !== null && (
                <span className={styles.tabCount}>{counts[tab.value]}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {error && (
        <Notice tone="bad">
          Kon het postvak niet laden: {error.message}
          {' — '}is migratie 0062_berichten.sql al in Supabase gezet? Een policy
          zonder de bijbehorende GRANT geeft precies deze lege lijst.
        </Notice>
      )}

      {!error && threads.length === 0 && (
        <Empty>
          {status === 'closed'
            ? 'Nog geen gesloten gesprekken.'
            : 'Nog geen berichten. E-mail aan info@autosleutel24.nl komt hier binnen zodra de doorstuurregel staat; telefoon en WhatsApp verschijnen zodra de assistent een gesprek afrondt.'}
        </Empty>
      )}

      {threads.length > 0 && <BerichtenConsole threads={threads} />}
    </>
  );
}
