import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { StockError } from '@/lib/kfcInventory';
import { listStaff } from '@/lib/kfcStaff';
import type { CrmUser } from '@/lib/crmSession';

/* The period lock ("afgesloten periode", migration 0140): nothing may be booked on or before locked_until. */

export interface PeriodLock { locked_until: string; set_by: string | null; set_by_email: string | null; set_at: string; note: string | null }
export interface PeriodLockChange { id: number; old_until: string | null; new_until: string | null; set_by: string | null; set_by_email: string | null; set_at: string; note: string | null }
export interface PeriodLockState { lock: PeriodLock | null; log: PeriodLockChange[] }

export const PERIOD_LOCKED_MESSAGE = 'Deze periode is afgesloten. Boek op een latere datum of laat de eigenaar de periode heropenen.';

const db = () => createSupabaseAdminClient();

const ERRORS: Record<string, [string, number]> = {
  KFC_PERIOD_FUTURE: ['Je kunt alleen een datum vóór vandaag afsluiten: vandaag en later wordt nog geboekt.', 400],
  KFC_PERIOD_NOTE_REQUIRED: ['Schrijf bij heropenen kort waarom (bijvoorbeeld welke boeking gecorrigeerd moet worden).', 400],
  KFC_PERIOD_LOCKED: [PERIOD_LOCKED_MESSAGE, 409],
};

/** Today in Amsterdam as YYYY-MM-DD. */
export function amsterdamToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Last day of the previous month (Amsterdam), the usual date to lock until. */
export function endOfPreviousMonth(now = new Date()): string {
  const [y, m] = amsterdamToday(now).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);
}

export async function getPeriodLock(): Promise<PeriodLockState> {
  const { data, error } = await db().rpc('kfc_period_lock_state');
  if (error) throw new StockError(`Afgesloten periode lezen mislukt: ${error.message}`, 500);
  const raw = (data ?? {}) as { lock?: Omit<PeriodLock, 'set_by_email'> | null; log?: Omit<PeriodLockChange, 'set_by_email'>[] };
  // Names for "who"; a failed staff read only costs the e-mail column, not the state.
  const emails = new Map<string, string>();
  try {
    for (const member of await listStaff()) emails.set(member.id, member.email);
  } catch { /* the id is shown instead */ }
  const who = (id: string | null) => (id ? emails.get(id) ?? null : null);
  return {
    lock: raw.lock ? { ...raw.lock, set_by_email: who(raw.lock.set_by) } : null,
    log: (raw.log ?? []).map((row) => ({ ...row, set_by_email: who(row.set_by) })),
  };
}

/** Set, move or remove (until = null) the lock. Owner only; the database checks the date and the note. */
export async function setPeriodLock(until: string | null, note: string | null, user: CrmUser): Promise<string | null> {
  if (user.role !== 'owner') throw new StockError('Alleen de eigenaar kan een periode afsluiten of heropenen.', 403);
  if (until !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(until) || Number.isNaN(Date.parse(`${until}T00:00:00Z`)))) throw new StockError('Controleer de datum.');
  const text = note?.trim() ? note.trim().slice(0, 500) : null;
  const { data, error } = await db().rpc('kfc_set_period_lock', { p_until: until, p_user: user.id, p_note: text });
  if (error) {
    for (const [code, [message, status]] of Object.entries(ERRORS)) if (error.message.includes(code)) throw new StockError(message, status);
    throw new StockError(`Opslaan mislukt: ${error.message}`, 500);
  }
  return (data as string | null) ?? null;
}
