/*
 * Which phone number sent the WhatsApp ad code of a click, so the daily Google
 * Ads file can use the code (src/lib/adAttribution.ts, rule `chat_ref`).
 *
 * Run after 0087. Additive and idempotent: it only adds two columns to
 * call_clicks and changes nothing that exists. Paste it into the Supabase SQL
 * editor; there is no migration runner. Safe to run twice.
 *
 * Why. Since 0063 a visitor who comes from an ad gets a four-character code in
 * the pre-filled WhatsApp text ("[K7F2] Hallo, ..."), stored in call_clicks.ref.
 * The chat then arrives from a phone number, and the job later carries that
 * same number in jobs.customer_phone. Nothing in the database joined the two:
 * the code lives on the click, the number on the job, and the only place that
 * sees both is the server that reads the WhatsApp chats. The matcher could
 * therefore use the code only when that server passed the chat list along by
 * hand (the stats route), never in the daily file. One column on the click
 * closes the gap: the number's last nine digits, written once when the chat
 * with that code is reported (POST /api/ops/ad-reviews, optional "phone").
 *
 * What is stored. Only the last nine digits, the same key the matcher and the
 * other ops routes already compare on (not the full international number, not
 * the name, not the message). It is personal data, so: it is written only for
 * a click whose code the customer themselves sent in a chat, it is never
 * returned by any route, never put in the Google file, and it is read only on
 * the server to compare with a job's number. Office users who can already read
 * jobs and leads can read it through the existing call_clicks policy; no new
 * policy or grant is added. The 0053 table comment ("no customer identity")
 * predates this column and is left untouched.
 *
 * Shared codes. A code is meant for one person. If the same code is later
 * reported from a different number (the link was forwarded), the first number
 * stays and chat_phone_conflict is set. A conflicted click is never used to
 * attribute a job: when two people could fit, the job stays unattributed.
 *
 * Retention (not run here). The feed looks back at most about 200 days. To
 * drop the numbers after that, run by hand now and then:
 *   update public.call_clicks set chat_phone_key = null
 *    where chat_phone_key is not null and created_at < now() - interval '200 days';
 */
alter table public.call_clicks
  add column if not exists chat_phone_key text
    check (chat_phone_key is null or chat_phone_key ~ '^[0-9]{9}$');

alter table public.call_clicks
  add column if not exists chat_phone_conflict boolean not null default false;

comment on column public.call_clicks.chat_phone_key is
  'Last nine digits of the phone number whose WhatsApp chat started with this click''s ref code. Set once, never overwritten. Server-side comparison only: not returned by any route, not written to the Google file.';
comment on column public.call_clicks.chat_phone_conflict is
  'True when the same ref code was reported from a second, different number (a forwarded link). Such a click is never used to attribute a job.';

notify pgrst, 'reload schema';
