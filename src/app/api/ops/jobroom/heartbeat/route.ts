import { checkHeartbeats, expectedServices, recordHeartbeat, runOps } from '@/lib/opsJobRoom';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/** A service says it is alive. */
export async function POST(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.heartbeat', (db, body) => recordHeartbeat(db, body));
}

/**
 * The stop alarm check, called by a timer. Reports stale services. `?alert=1`
 * also tells the owner on Telegram, but only when JOBROOM_ALERTS=on and an
 * office chat is configured; until then it is shadow and only reports.
 */
export async function GET(request: Request) {
  return runOps(request, createSupabaseAdminClient, 'jobroom.heartbeat.check', (db, input) => {
    const chat = process.env.TELEGRAM_OFFICE_CHAT_ID;
    return checkHeartbeats(db, {
      expected: expectedServices(),
      alert: (input as URL).searchParams.get('alert') === '1',
      alertsOn: process.env.JOBROOM_ALERTS === 'on' && !!chat,
      notify: (text) => sendTelegram(chat, text),
    });
  });
}
