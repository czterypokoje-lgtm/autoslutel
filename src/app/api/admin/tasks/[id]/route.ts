import { NextRequest, NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { completeTask, removeTask, UUID } from '@/lib/tasks';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }
  const db = await createSupabaseServerClient();
  try {
    await completeTask(db, id, body.done !== false);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mislukt' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;
  const db = await createSupabaseServerClient();
  try {
    await removeTask(db, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mislukt' }, { status: 500 });
  }
}
