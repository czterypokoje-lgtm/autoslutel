import { NextRequest, NextResponse } from 'next/server';
import { requireCrmUser, seesPrices } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await requireCrmUser();
  const body = await req.json();
  const purchase = body.purchase_order_id;
  if (purchase && !seesPrices(user)) return NextResponse.json({error:'Geen toegang'},{status:403});
  if (purchase && !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(purchase)) return NextResponse.json({error:'Ongeldige inkooporder'},{status:400});
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('expenses')
    .insert({
      purchase_order_id: purchase || null,
      category: body.category,
      description: body.description,
      amount: body.amount,
      date_incurred: body.date_incurred,
      technician_id: body.technician_id || null,
      is_reimbursable: body.is_reimbursable || false,
      created_by: user.id,
      status: 'pending'
    });

  if (purchase && error?.code === '23505') return NextResponse.json({error:'Kosten voor dit inkoopdocument zijn al geregistreerd.'},{status:409});
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}