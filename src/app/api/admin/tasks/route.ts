import { NextRequest, NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { addTask, listTasks, parseDue, UUID } from '@/lib/tasks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;
  const db = await createSupabaseServerClient();
  const open = req.nextUrl.searchParams.get('done') !== '1';
  try {
    return NextResponse.json({ tasks: await listTasks(db, { open, limit: 100 }) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mislukt' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '';
  if (!description) return NextResponse.json({ error: 'Omschrijving ontbreekt' }, { status: 400 });
  const due = parseDue(body.due);
  if (!due) return NextResponse.json({ error: 'Datum onduidelijk' }, { status: 400 });
  const ref = (v: unknown) => (typeof v === 'string' && UUID.test(v) ? v : null);

  const db = await createSupabaseServerClient();
  try {
    const task = await addTask(db, {
      description,
      due_at: due,
      task_type: typeof body.task_type === 'string' ? body.task_type.slice(0, 40) : undefined,
      lead_id: ref(body.lead_id),
      job_id: ref(body.job_id),
      created_by: auth.user.id,
      source: 'crm',
    });
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mislukt' }, { status: 500 });
  }
}
