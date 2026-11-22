import Link from 'next/link';
import { ArrowDownToLine, AudioLines, CheckCircle2, PackageSearch, PhoneForwarded } from 'lucide-react';
import { DEMO_BOT_AGENT } from '@/lib/kfcDemoBotRules';
import { requireOfficeUser } from '@/lib/crmSession';
import { reviewAgentIds, type ReviewMetadata } from '../../../../supabase/functions/_shared/kfcCallReview';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewText, ReviewDate } from './ReviewText';
import { DeleteConversation } from './DeleteConversation';
import { syncBotConversations } from './actions';

export const dynamic = 'force-dynamic';
const path = '/admin/bot-conversations';

type Row = {
  conversation_id: string;
  phone: string | null;
  outcome: string | null;
  duration_secs: number | null;
  summary: string | null;
  created_at: string;
  metadata: { kfc_call_review: Omit<ReviewMetadata, 'channel'> & { channel: ReviewMetadata['channel'] | 'email' }; kfc_demo_bot?: { technician_requested?: boolean } };
  transcript?: { role: 'agent' | 'user'; message: string }[];
};

const verdictLabels = { yes: ['Confirmed', 'Bevestigd'], no: ['No', 'Nee'], unknown: ['Unknown', 'Onbekend'] } as const;
const transferLabels = {
  connected: ['Connected', 'Verbonden'], attempted: ['Attempted · not confirmed', 'Geprobeerd · niet bevestigd'],
  failed: ['Failed', 'Mislukt'], not_recorded: ['No transfer recorded', 'Geen overdracht vastgelegd'],
} as const;
const channels = { email: ['Email', 'E-mail'], phone: ['Phone', 'Telefoon'], whatsapp: ['WhatsApp', 'WhatsApp'], web: ['Web', 'Web'], unknown: ['Unknown', 'Onbekend'] } as const;
const outcome = (value: string | null) => value === 'success' ? ['Successful', 'Geslaagd'] as const : value === 'failure' ? ['Unsuccessful', 'Niet geslaagd'] as const : verdictLabels.unknown;
const duration = (seconds: number | null) => seconds == null ? '—' : Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');

export default async function BotConversationsPage({ searchParams }: { searchParams: Promise<{ call?: string; agent?: string; sync?: string; deleted?: string; channel?: string }> }) {
  await requireOfficeUser(path);
  const { call, agent, sync, deleted, channel: requested } = await searchParams;
  const channel = requested === 'phone' || requested === 'whatsapp' ? requested : undefined;
  const db = await createSupabaseServerClient();
  const allowed = reviewAgentIds(process.env.KFC_REVIEW_AGENT_IDS);
  if (process.env.KFC_DEMO_MODE === '1') allowed.push(DEMO_BOT_AGENT);
  const active = agent && allowed.includes(agent) ? [agent] : allowed;
  let conversations = db.from('agent_conversations')
    .select('conversation_id, phone, outcome, duration_secs, summary, created_at, metadata')
    .in('metadata->kfc_call_review->>agent_id', active)
    .order('created_at', { ascending: false }).limit(100);
  if (channel) conversations = conversations.eq('channel', channel);
  const { data, error } = await conversations;
  const rows = (data ?? []) as Row[];
  const picked = rows.find((row) => row.conversation_id === call) ?? rows[0];
  const { data: detail, error: detailError } = picked ? await db.from('agent_conversations')
    .select('transcript').eq('conversation_id', picked.conversation_id).maybeSingle() : { data: null, error: null };
  const transcript = (detail?.transcript ?? []) as NonNullable<Row['transcript']>;
  const info = picked?.metadata.kfc_call_review;
  const names = new Map(rows.map((row) => [row.metadata.kfc_call_review.agent_id, row.metadata.kfc_call_review.agent_name]));
  const stats = [
    { icon: AudioLines, label: ['Recent conversations', 'Recente gesprekken'], value: rows.length },
    { icon: CheckCircle2, label: ['Successful', 'Geslaagd'], value: rows.filter((row) => row.outcome === 'success').length },
    { icon: PackageSearch, label: ['Product recommended', 'Product aanbevolen'], value: rows.filter((row) => row.metadata.kfc_call_review.recommended === 'yes').length },
    { icon: PhoneForwarded, label: ['Confirmed transfers', 'Bevestigde overdrachten'], value: rows.filter((row) => row.metadata.kfc_call_review.transfer === 'connected').length },
  ] as const;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ElevenLabs <ReviewText en="Conversations" nl="Gesprekken" /></h1>
          <p className="text-muted-foreground text-sm"><ReviewText en="Review what each agent said and what the conversation achieved." nl="Bekijk wat elke agent zei en wat het gesprek heeft opgeleverd." /></p>
        </div>
        <form action={syncBotConversations}>
          <Button variant="outline" size="sm" disabled={!process.env.ELEVENLABS_API_KEY}>
            <ArrowDownToLine aria-hidden /> <ReviewText en="Sync recent calls" nl="Recente gesprekken ophalen" />
          </Button>
        </form>
      </div>
      {!process.env.ELEVENLABS_API_KEY && <p className="text-muted-foreground text-sm"><ReviewText en="Imported history is available. In-panel sync requires a read-only ElevenLabs API key." nl="De geïmporteerde geschiedenis is beschikbaar. Voor synchronisatie is een alleen-lezen ElevenLabs API-sleutel nodig." /></p>}
      {sync && <p role="status" className="text-sm">{sync === 'complete' ? <ReviewText en="Recent conversations synced." nl="Recente gesprekken zijn opgehaald." /> : <ReviewText en="Sync could not finish. Check the ElevenLabs connection and retry." nl="Synchronisatie kon niet worden voltooid. Controleer de ElevenLabs-verbinding en probeer opnieuw." />}</p>}
      {deleted && <p role="status" className="text-sm">{deleted === "yes" ? <ReviewText en="Conversation deleted from the CRM." nl="Gesprek verwijderd uit het CRM." /> : <ReviewText en="The conversation could not be deleted." nl="Het gesprek kon niet worden verwijderd." />}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => <Card key={label[0]}><CardHeader>
          <CardDescription className="flex items-center gap-2"><Icon className="size-4" aria-hidden /><ReviewText en={label[0]} nl={label[1]} /></CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        </CardHeader></Card>)}
      </div>
      {allowed.length > 1 && <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant={!agent ? 'default' : 'outline'}><Link href={path}><ReviewText en="All agents" nl="Alle agenten" /></Link></Button>
        {allowed.map((id) => <Button asChild key={id} size="sm" variant={agent === id ? 'default' : 'outline'}><Link href={path + '?' + new URLSearchParams({ agent: id, ...(channel ? { channel } : {}) })}>{names.get(id) ?? id}</Link></Button>)}
      </div>}
      {error ? <p role="alert"><ReviewText en="Could not load conversation history." nl="Kon gespreksgeschiedenis niet laden." /></p> : rows.length === 0 ? <Card><CardContent><ReviewText en="No conversations have been imported yet." nl="Er zijn nog geen gesprekken geïmporteerd." /></CardContent></Card> :
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader><CardTitle><ReviewText en="Call history" nl="Gespreksgeschiedenis" /></CardTitle></CardHeader>
          <CardContent className="grid max-h-[38rem] gap-2 overflow-auto">
            {rows.map((row) => <Link key={row.conversation_id} href={path + '?' + new URLSearchParams({ call: row.conversation_id, ...(agent ? { agent } : {}), ...(channel ? { channel } : {}) })} aria-current={picked?.conversation_id === row.conversation_id ? 'page' : undefined} className="group grid min-w-0 gap-1 rounded-md border p-3 hover:bg-muted aria-[current=page]:border-primary aria-[current=page]:bg-primary/5">
              <span className="flex flex-wrap justify-between gap-1 text-sm font-medium"><ReviewDate value={row.created_at} /><span>{duration(row.duration_secs)}</span></span>
              <span className="text-muted-foreground truncate text-xs">{row.metadata.kfc_call_review.agent_name}</span>
              <span className="flex flex-wrap items-center gap-2"><Badge variant="outline"><ReviewText en={outcome(row.outcome)[0]} nl={outcome(row.outcome)[1]} /></Badge>{row.phone && <span className="text-xs">{row.phone}</span>}</span>
            </Link>)}
          </CardContent>
        </Card>
        {picked && info && <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>{info.agent_name}</CardTitle><DeleteConversation id={picked.conversation_id} /></div>
            <CardDescription><ReviewDate value={picked.created_at} /> · {duration(picked.duration_secs)} · <ReviewText en={channels[info.channel][0]} nl={channels[info.channel][1]} /></CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm md:grid-cols-3">
              <div><dt className="text-muted-foreground"><ReviewText en="Customer number" nl="Klantnummer" /></dt><dd>{picked.phone ?? '—'}</dd></div>
              <div><dt className="text-muted-foreground"><ReviewText en="Call outcome" nl="Gespreksresultaat" /></dt><dd><ReviewText en={outcome(picked.outcome)[0]} nl={outcome(picked.outcome)[1]} /></dd></div>
              <div><dt className="text-muted-foreground"><ReviewText en="Issue resolved" nl="Probleem opgelost" /></dt><dd><ReviewText en={verdictLabels[info.resolved][0]} nl={verdictLabels[info.resolved][1]} /></dd></div>
              <div><dt className="text-muted-foreground"><ReviewText en="Product recommended" nl="Product aanbevolen" /></dt><dd><ReviewText en={verdictLabels[info.recommended][0]} nl={verdictLabels[info.recommended][1]} />{info.product_skus.length > 0 && ' · ' + info.product_skus.join(', ')}</dd></div>
              <div><dt className="text-muted-foreground"><ReviewText en="Technician transfer" nl="Overdracht naar technicus" /></dt><dd><ReviewText en={transferLabels[info.transfer][0]} nl={transferLabels[info.transfer][1]} /></dd></div>
              {picked.metadata.kfc_demo_bot?.technician_requested && <div><dt className="text-muted-foreground"><ReviewText en="Technician request" nl="Verzoek om technicus" /></dt><dd><ReviewText en="Recorded in demo" nl="Vastgelegd in demo" /></dd></div>}
              <div><dt className="text-muted-foreground"><ReviewText en="Transfer destination" nl="Bestemming overdracht" /></dt><dd>{info.transfer_number ?? '—'}</dd></div>
            </dl>
            <section className="grid gap-2">
              <h2 className="font-semibold"><ReviewText en="Summary" nl="Samenvatting" /></h2>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">{picked.summary ?? <ReviewText en="No summary available." nl="Geen samenvatting beschikbaar." />}</p>
            </section>
            <section className="grid gap-2">
              <h2 className="font-semibold"><ReviewText en="Transcript" nl="Transcript" /></h2>
              {detailError ? <p role="alert"><ReviewText en="Could not load the transcript." nl="Kon het transcript niet laden." /></p> : transcript.length === 0 ? <p className="text-muted-foreground text-sm"><ReviewText en="No transcript available." nl="Geen transcript beschikbaar." /></p> :
                <ol className="grid max-h-[36rem] gap-2 overflow-auto">
                  {transcript.map(({ role, message }, index) => <li key={index} className={role === 'agent' ? 'rounded-lg border p-3 text-sm' : 'bg-muted rounded-lg p-3 text-sm'}>
                    <strong><ReviewText en={role === 'agent' ? 'Agent' : 'Customer'} nl={role === 'agent' ? 'Agent' : 'Klant'} /></strong>
                    <p className="mt-1 whitespace-pre-wrap break-words">{message}</p>
                  </li>)}
                </ol>}
            </section>
          </CardContent>
        </Card>}
      </div>}
    </div>
  );
}
