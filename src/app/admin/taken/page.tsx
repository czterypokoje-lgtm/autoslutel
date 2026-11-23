import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BRAND } from '@/config/install';
import { listTasks, dueLabel, type Task } from '@/lib/tasks';
import { amsterdamParts } from '@/lib/amsterdamTime';
import { PageHead, Card, CardHead, Table, Badge, Empty, Notice } from '../_ui';
import TaskForm from './TaskForm';
import TaskActions from './TaskActions';

export const dynamic = 'force-dynamic';

export const metadata = { title: `Taken | ${BRAND.name}` };

/**
 * The owner's task list. Tasks live in crm_tasks; the voice agent writes them
 * through /api/agent/tasks, so what is said on the phone shows up here. The
 * calendar is deliberately not here: it is Google Calendar, and the agent
 * reaches it through ElevenLabs' built-in Google Calendar integration.
 */
export default async function TakenPage() {
  await requireOfficeUser('/admin/taken');
  const db = await createSupabaseServerClient();

  /* A database that has not seen 0106 yet answers "permission denied". Say
     which migration is missing instead of a blank 500. */
  let open: Task[] = [];
  let done: Task[] = [];
  let dbError: string | null = null;
  try {
    [open, done] = await Promise.all([listTasks(db, { open: true, limit: 100 }), listTasks(db, { open: false, limit: 15 })]);
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Taken konden niet worden geladen';
  }


  const today = amsterdamParts(Date.now()).day;
  const now = Date.now();
  const tone = (iso: string) => {
    const t = new Date(iso).getTime();
    if (t < now) return { label: 'Te laat', tone: 'stop' as const };
    if (amsterdamParts(iso).day === today) return { label: 'Vandaag', tone: 'warn' as const };
    return null;
  };

  return (
    <>
      <PageHead title="Taken" sub="Wat er nog moet gebeuren. Afspraken staan in Google Calendar." />

      {dbError && (
        <Notice tone="bad">
          Taken konden niet worden geladen: {dbError}. Controleer of <code>supabase/migrations/0141_crm_tasks_access.sql</code> is toegepast.
        </Notice>
      )}

      <Card>
        <CardHead>Nieuwe taak</CardHead>
        <TaskForm />
      </Card>

      <Card>
        <CardHead>Open ({open.length})</CardHead>
        {open.length === 0 ? (
          <Empty>Niets open. Zeg het tegen de agent of typ het hierboven.</Empty>
        ) : (
          <Table head={<><th>Wanneer</th><th>Taak</th><th>Bron</th><th></th></>}>
            {open.map((t) => {
              const flag = tone(t.due_at);
              return (
                <tr key={t.id}>
                  <td>{dueLabel(t.due_at)} {flag && <Badge tone={flag.tone}>{flag.label}</Badge>}</td>
                  <td>{t.description}</td>
                  <td>{t.source === 'agent' ? <Badge tone="info">Agent</Badge> : <Badge>CRM</Badge>}</td>
                  <td><TaskActions id={t.id} done={false} /></td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {done.length > 0 && (
        <Card>
          <CardHead>Afgerond</CardHead>
          <Table head={<><th>Was gepland</th><th>Taak</th><th></th></>}>
            {done.map((t) => (
              <tr key={t.id}>
                <td>{dueLabel(t.due_at)}</td>
                <td>{t.description}</td>
                <td><TaskActions id={t.id} done /></td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </>
  );
}
