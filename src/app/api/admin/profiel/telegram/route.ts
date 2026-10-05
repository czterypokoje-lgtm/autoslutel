import { NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OUTCOME: Record<string, string> = {
  geen_monteur: 'Uw login is niet aan een monteur gekoppeld.',
  geen_toegang: 'Alleen kantoor kan dit voor een ander doen.',
  niet_gevonden: 'Die monteur bestaat niet meer.',
};

/**
 * Disconnecting a Telegram chat.
 *
 * Through crm_disconnect_telegram rather than a plain update, for the same
 * reason crm_update_own_profile exists: the only write policy on
 * `technicians` is the office one (0004), so a technician's own update
 * matches no rows. PostgREST calls that a success — which is exactly how the
 * first version of this route reported "ok" while changing nothing.
 *
 * Needed more often than it sounds: a new phone, or the wrong account
 * connected while testing. Without it the link is permanent, because the
 * profile page hides the connect button once it says "gekoppeld".
 */
export async function DELETE(request: Request) {
  await requireCrmUser();
  const supabase = await createSupabaseServerClient();

  const asked = new URL(request.url).searchParams.get('technician');
  if (asked && !UUID.test(asked)) {
    return NextResponse.json({ error: 'Ongeldige monteur' }, { status: 400 });
  }

  const { data: outcome, error } = await supabase.rpc('crm_disconnect_telegram', {
    p_technician: asked || null,
  });

  if (error) {
    console.error('Telegram disconnect failed:', error.message);
    return NextResponse.json(
      {
        error: /does not exist|function/i.test(error.message)
          ? 'Voer supabase/migrations/0072_disconnect_telegram.sql uit.'
          : 'Ontkoppelen mislukt',
      },
      { status: 500 }
    );
  }

  if (outcome !== 'ok') {
    return NextResponse.json(
      { error: OUTCOME[String(outcome)] ?? String(outcome) },
      { status: outcome === 'geen_toegang' ? 403 : 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
