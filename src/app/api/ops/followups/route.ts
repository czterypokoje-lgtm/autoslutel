import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { findFollowups, FOLLOWUP_RULES, type FollowupConversation, type FollowupLead } from '@/lib/opsFollowups';

export const dynamic = 'force-dynamic';

const LEAD_COLUMNS =
  'id, created_at, name, phone, phone_e164, brand, model, service, postcode, status, first_contact_at, retracted_at, consent_marketing';

/** Who is waiting on us. Read-only: this proposes, it contacts nobody. */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createSupabaseAdminClient();
  const since = new Date(Date.now() - FOLLOWUP_RULES.noBookingUntilMinutes * 60_000).toISOString();

  const [leads, conversations, jobs] = await Promise.all([
    supabase
      .from('leads')
      .select(LEAD_COLUMNS)
      .in('status', ['new', 'contacted', 'qualified'])
      /* Unanswered leads stay until someone answers them, however old. */
      .or(`status.eq.new,created_at.gte.${since}`)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('agent_conversations')
      .select('id, created_at, channel, phone, outcome, summary')
      .gte('created_at', since)
      .not('phone', 'is', null)
      .limit(500),
    /* Every job, not only recent ones: an old lead whose number booked is not waiting. */
    supabase.from('jobs').select('customer_phone').order('created_at', { ascending: false }).limit(2000),
  ]);

  const failed = leads.error ?? conversations.error ?? jobs.error;
  if (failed) {
    console.error('ops followups read failed:', failed.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const followups = findFollowups({
    leads: (leads.data ?? []) as FollowupLead[],
    conversations: (conversations.data ?? []) as FollowupConversation[],
    jobPhones: (jobs.data ?? []).map((j) => j.customer_phone as string | null),
  });

  await logOps(supabase, 'followups.read', { count: followups.length });
  return NextResponse.json({ count: followups.length, followups });
}
