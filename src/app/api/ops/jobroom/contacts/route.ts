import { resolveContact, resolveNote, runOps, saveContact } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Saves a contact (every customer who writes) and, on an explicit pick, one alias. */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.contact.save', (db, body) =>
    saveContact(db, body)
  );
}

/**
 * `?q=name` (optional `role`, `last4`): exact alias match after folding accents.
 * `?names=Ali, Mehmet en Oğuz`: one lookup per name. Zero or several matches
 * return candidates to ask about; nothing is guessed.
 */
export async function GET(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.contact.resolve', (db, input) => {
    const params = (input as URL).searchParams;
    const names = params.get('names');
    if (names) return resolveNote(db, names, { role: params.get('role') });
    return resolveContact(db, params.get('q'), { role: params.get('role'), last4: params.get('last4') });
  });
}
