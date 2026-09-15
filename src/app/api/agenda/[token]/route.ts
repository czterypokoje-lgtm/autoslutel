import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * iCalendar feed for one monteur, so their jobs appear in the calendar app they
 * already use.
 *
 * A calendar client cannot sign in — it fetches a URL and nothing more — so the
 * token in the path *is* the credential. That shapes what goes in the feed:
 * time, address, service and plate, and nothing else. No phone number, no
 * price, no notes. A forwarded link then leaks where a van will be, not who the
 * customer is. The CRM app remains the only place with the full picture.
 *
 * Read with the service-role key on purpose: there is no session here, and the
 * token has already established which technician is being asked for.
 */

const TOKEN = /^[0-9a-f]{64}$/;

/** RFC 5545: escape, then fold at 75 octets. Long addresses break naive clients. */
function line(name: string, value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

  const full = `${name}:${escaped}`;
  const chunks: string[] = [];
  let rest = full;
  while (rest.length > 74) {
    chunks.push(rest.slice(0, 74));
    rest = rest.slice(74);
  }
  chunks.push(rest);
  return chunks.join('\r\n ');
}

/** `2026-09-02` + `14:00` → `20260902T140000` (floating local time). */
function stamp(date: string, time: string | null): string {
  const hhmm = (time ?? '00:00').slice(0, 5).replace(':', '');
  return `${date.replace(/-/g, '')}T${hhmm}00`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!TOKEN.test(token)) {
    return new Response('Not found', { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return new Response('Not configured', { status: 503 });
  }

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: technician } = await db
    .from('technicians')
    .select('id, name')
    .eq('ical_token', token)
    .maybeSingle();

  // Same answer for a wrong token as for a missing one.
  if (!technician) {
    return new Response('Not found', { status: 404 });
  }

  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const { data: jobs } = await db
    .from('jobs')
    .select('id, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type, status')
    .eq('technician_id', technician.id)
    .gte('scheduled_date', from)
    .neq('status', 'geannuleerd')
    .order('scheduled_date');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Autosleutel24//CRM//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    line('X-WR-CALNAME', `Autosleutel24 — ${technician.name}`),
    // Most clients poll on their own schedule; this is a hint, not a promise.
    'X-PUBLISHED-TTL:PT30M',
    'REFRESH-INTERVAL;VALUE=DURATION:PT30M',
  ];

  for (const job of jobs ?? []) {
    const address = [job.street, job.postcode, job.city].filter(Boolean).join(', ');
    const summary = [job.service_type ?? 'Klus', job.kenteken].filter(Boolean).join(' · ');

    lines.push(
      'BEGIN:VEVENT',
      line('UID', `${job.id}@autosleutel24.nl`),
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;TZID=Europe/Amsterdam:${stamp(job.scheduled_date as string, job.slot_start as string)}`,
      `DTEND;TZID=Europe/Amsterdam:${stamp(job.scheduled_date as string, job.slot_end as string)}`,
      line('SUMMARY', summary),
      line('LOCATION', address),
      line('DESCRIPTION', `Status: ${job.status}\nOpen in CRM: https://www.autosleutel24.nl/admin/jobs/${job.id}`),
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
