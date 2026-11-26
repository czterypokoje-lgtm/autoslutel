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
      status: 'pending',
      // From the scan step: the stored file and what was read from it (migration 0145 for the last two).
      receipt_url: typeof body.receipt_url === 'string' && /^[\w-]+\/[\w-]+\.[a-z0-9]+$/i.test(body.receipt_url) ? body.receipt_url : null,
      supplier_name: typeof body.supplier_name === 'string' ? body.supplier_name.slice(0, 120) || null : null,
      invoice_number: typeof body.invoice_number === 'string' ? body.invoice_number.slice(0, 60) || null : null,
      receipt_text: typeof body.receipt_text === 'string' ? body.receipt_text.slice(0, 4000) || null : null,
    });

  if (purchase && error?.code === '23505') return NextResponse.json({error:'Kosten voor dit inkoopdocument zijn al geregistreerd.'},{status:409});
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}