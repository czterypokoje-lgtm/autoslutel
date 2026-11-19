import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Active technicians, for the office assistant's WhatsApp step. The number stays
 * in the server tool; the assistant itself only ever sees names.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('technicians').select('id, name, phone').eq('active', true).order('name');

  if (error) {
    console.error('ops technicians read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  await logOps(supabase, 'technicians.read', { count: data?.length ?? 0 });
  return NextResponse.json({ technicians: data ?? [] });
}
