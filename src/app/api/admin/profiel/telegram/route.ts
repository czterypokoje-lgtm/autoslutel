import { NextResponse } from 'next/server';
import { requireCrmUser, OFFICE_ROLES } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Disconnecting a Telegram chat.
 *
 * Needed more often than it sounds: a phone is replaced, somebody connects
 * the wrong account while testing, a technician leaves. Without this the
 * connection is permanent — the profile page hides the connect button once
 * `telegramConnected` is true, so there is no way back to it.
 *
 * A technician may disconnect their own. The office may disconnect anyone's,
 * because the case that matters is a phone nobody has any more, and the
 * person who lost it cannot sign in to fix it.
 */
export async function DELETE(request: Request) {
  const user = await requireCrmUser();
  const supabase = await createSupabaseServerClient();

  const asked = new URL(request.url).searchParams.get('technician');
  const isOffice = Boolean(user.role && OFFICE_ROLES.includes(user.role));

  /* Office with no technician named: their own admin_telegram row. */
  if (isOffice && !asked) {
    const { error } = await supabase.from('admin_telegram').delete().eq('user_id', user.id);
    if (error) {
      console.error('Admin telegram unlink failed:', error.message);
      return NextResponse.json({ error: 'Ontkoppelen mislukt' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  let technicianId: string | null = null;

  if (asked) {
    if (!UUID.test(asked)) {
      return NextResponse.json({ error: 'Ongeldige monteur' }, { status: 400 });
    }
    if (!isOffice) {
      /* A technician asking about somebody else. Not "forbidden", because
         that confirms the id exists — just their own, or nothing. */
      return NextResponse.json({ error: 'Alleen kantoor kan dit voor een ander doen.' }, { status: 403 });
    }
    technicianId = asked;
  } else {
    const { data: me } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!me) {
      return NextResponse.json({ error: 'Uw login is niet aan een monteur gekoppeld.' }, { status: 403 });
    }
    technicianId = me.id;
  }

  const { error } = await supabase
    .from('technicians')
    .update({ telegram_chat_id: null })
    .eq('id', technicianId);

  if (error) {
    console.error('Technician telegram unlink failed:', error.message);
    return NextResponse.json({ error: 'Ontkoppelen mislukt' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
