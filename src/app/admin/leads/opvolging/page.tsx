import Link from 'next/link';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireOfficeUser } from '@/lib/crmSession';
import { fetchAll } from '@/lib/kfcOrders';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { completeFollowup, openFollowup } from './actions';

export const dynamic = 'force-dynamic';
const when = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });
const messages = {
  error: 'Opslaan mislukt.',
  changed: 'Deze aanvraag wacht niet meer op opvolging.',
  opened: 'Opvolgtaak staat open.',
  completed: 'Opvolgtaak afgerond.',
} as const;

type Lead = { id: string; name: string | null; phone: string | null; service: string | null; created_at: string };
type Task = { id: string; lead_id: string; due_at: string; leads: Lead };

export default async function FollowupPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  await requireOfficeUser('/admin/leads/opvolging');
  const { result } = await searchParams;
  const message = result && Object.hasOwn(messages, result) ? messages[result as keyof typeof messages] : null;
  const db = createSupabaseAdminClient();
  const [leads, tasks] = await Promise.all([
    fetchAll<Lead>((a, b) => db.from('leads').select('id,name,phone,service,created_at').eq('status', 'new')
      .is('first_contact_at', null).is('retracted_at', null).order('created_at').order('id').range(a, b)),
    fetchAll<Task>((a, b) => db.from('crm_tasks').select('id,lead_id,due_at,leads!inner(id,name,phone,service,created_at)')
      .eq('task_type', 'lead_followup').is('completed_at', null).is('leads.retracted_at', null).order('due_at').order('id').range(a, b).overrideTypes<Task[], { merge: false }>()),
  ]);
  const openIds = new Set(tasks.map((task) => task.lead_id));
  const waiting = leads.filter((lead) => !openIds.has(lead.id));
  const contact = (lead: Lead) => <div className="min-w-0">
    <strong>{lead.name || <PreviewText>Aanvraag</PreviewText>}</strong>
    <p className="text-muted-foreground text-sm">
      {lead.service && lead.service + ' · '}<time dateTime={lead.created_at}>{when.format(new Date(lead.created_at))}</time>
      {lead.phone && <> · <a className="underline" href={'tel:' + lead.phone.replace(/[^+\d]/g, '')}>{lead.phone}</a></>}
    </p>
  </div>;
  return <main className="mx-auto grid max-w-5xl gap-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-semibold"><PreviewText>Leadopvolging</PreviewText></h1>
      <Button asChild variant="outline"><Link href="/admin/leads"><PreviewText>Leads</PreviewText></Link></Button>
    </header>
    {message && <p role="status" className="rounded-lg border p-3 text-sm"><PreviewText>{message}</PreviewText></p>}
    <Card>
      <CardHeader><CardTitle><PreviewText>Open opvolgtaken</PreviewText> · {tasks.length}</CardTitle></CardHeader>
      <CardContent>{tasks.length ? <ul className="divide-y">
        {tasks.map((task) => <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          {contact(task.leads)}
          <form action={completeFollowup}><input type="hidden" name="task" value={task.id} /><Button variant="outline" size="sm"><PreviewText>Taak afronden</PreviewText></Button></form>
        </li>)}
      </ul> : <p className="text-muted-foreground text-sm"><PreviewText>Geen open opvolgtaken.</PreviewText></p>}</CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle><PreviewText>Nieuwe aanvragen zonder geregistreerd contact</PreviewText> · {waiting.length}</CardTitle></CardHeader>
      <CardContent>{waiting.length ? <ul className="divide-y">
        {waiting.map((lead) => <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          {contact(lead)}
          <form action={openFollowup}><input type="hidden" name="lead" value={lead.id} /><Button size="sm"><PreviewText>Opvolgtaak maken</PreviewText></Button></form>
        </li>)}
      </ul> : <p className="text-muted-foreground text-sm"><PreviewText>Geen aanvragen in deze lijst.</PreviewText></p>}</CardContent>
    </Card>
  </main>;
}
