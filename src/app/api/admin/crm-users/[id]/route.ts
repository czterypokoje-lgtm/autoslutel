import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deletes a CRM login (a monteur-role auth user) directly — for the
 * duplicate/typo'd accounts that pile up from earlier failed invites, which
 * previously had no delete path at all: the only cleanup was deleting the
 * whole technician record along with it (src/app/api/admin/technicians/[id]
 * DELETE), which does nothing for a login nobody ever linked to a technician
 * in the first place, and Supabase's unique-email constraint then blocks
 * re-using that address for a fresh invite forever.
 *
 * Any technician still pointing at this login is unlinked first — same
 * "geen login" state a technician has before ever being linked to one —
 * rather than leaving a user_id that resolves to nothing.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error: unlinkError } = await supabase
      .from('technicians')
      .update({ user_id: null })
      .eq('user_id', id);
    if (unlinkError) {
      console.error('Login unlink failed:', unlinkError.message);
      return NextResponse.json({ error: 'Ontkoppelen mislukt' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    console.error('CRM login delete failed:', error.message);
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
