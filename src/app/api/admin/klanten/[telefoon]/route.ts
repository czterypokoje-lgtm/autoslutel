import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * AVG erasure for one customer.
 *
 * The work is done by `crm_erase_customer` in the database, in one transaction,
 * so a half-finished deletion cannot happen. The function checks the caller's
 * role itself — this route is the second lock, not the only one.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ telefoon: string }> }
) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { telefoon } = await params;
  const phone = decodeURIComponent(telefoon);

  if (!/^\+?\d{5,20}$/.test(phone)) {
    return NextResponse.json({ error: 'Ongeldig telefoonnummer' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase.rpc('crm_erase_customer', {
    target_phone: phone,
  });

  if (error) {
    console.error('Erasure failed:', error.message);
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
  }

  return NextResponse.json(
    { result: data },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
