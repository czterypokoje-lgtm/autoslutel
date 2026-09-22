import { NextRequest, NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireCrmUser();
  if (user.role === 'monteur') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('expenses')
    .update({ 
      status: body.status, 
      approved_by: user.id 
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}