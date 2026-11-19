import { NextRequest, NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await requireCrmUser();
  const body = await req.json();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('expenses')
    .insert({
      category: body.category,
      description: body.description,
      amount: body.amount,
      date_incurred: body.date_incurred,
      technician_id: body.technician_id || null,
      is_reimbursable: body.is_reimbursable || false,
      created_by: user.id,
      status: 'pending'
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}