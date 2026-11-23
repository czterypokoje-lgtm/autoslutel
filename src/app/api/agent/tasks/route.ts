import { NextResponse } from 'next/server';
import { checkOwnerAgent, asText } from '@/lib/agentAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { addTask, completeTask, dueLabel, listTasks, parseDue, UUID } from '@/lib/tasks';
import { addDays, amsterdamToday, amsterdamToUtc } from '@/lib/amsterdamTime';

export const dynamic = 'force-dynamic';

/**
 * The owner's agent and the task list. One route, three actions, so the
 * ElevenLabs console holds one tool definition instead of three:
 *
 *   { "action": "list" }
 *   { "action": "add",  "description": "...", "due": "morgen 10:00" }
 *   { "action": "done", "id": "<uuid>" }
 *
 * Service-role client: the agent has no login. The route is the guard, and
 * it touches crm_tasks and nothing else.
 */
export async function POST(request: Request) {
  const auth = checkOwnerAgent(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();
  const action = asText(body.action, 10);

  try {
    if (action === 'list') {
      const tasks = await listTasks(db, { open: true, limit: 20 });
      return NextResponse.json({
        count: tasks.length,
        tasks: tasks.map((t) => ({ id: t.id, description: t.description, due: dueLabel(t.due_at), due_at: t.due_at })),
      });
    }

    if (action === 'add') {
      const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '';
      if (!description) return NextResponse.json({ error: 'Omschrijving ontbreekt' }, { status: 400 });
      /* No date given: tomorrow 09:00. Said but not understood: ask back. */
      const due = body.due == null || body.due === '' ? amsterdamToUtc(addDays(amsterdamToday(), 1), '09:00') : parseDue(body.due);
      if (!due) return NextResponse.json({ error: 'Datum onduidelijk, vraag de datum opnieuw' }, { status: 400 });
      const task = await addTask(db, { description, due_at: due, source: 'agent' });
      return NextResponse.json({ ok: true, task: { id: task.id, description: task.description, due: dueLabel(task.due_at) } });
    }

    if (action === 'done') {
      const id = typeof body.id === 'string' && UUID.test(body.id) ? body.id : null;
      if (!id) return NextResponse.json({ error: 'Taak-id ontbreekt' }, { status: 400 });
      await completeTask(db, id, true);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Onbekende actie: list, add of done' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mislukt' }, { status: 500 });
  }
}
