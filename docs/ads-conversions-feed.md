# Daily conversions file for Google Ads

Sales that came from an ad go back to Google Ads every day, so Google learns
which ads bring paying customers instead of which bring clicks. Google fetches
the file by itself. Nobody downloads a CSV.

Only sales a person **confirmed** on `/admin/conversies` are in the file. The
system proposes which click belongs to which sale; it never sends a guess.

## The address
`https://<your-domain>/api/ads/conversions.csv`
Username: `google-ads`. Password: the value you set below.
Without the right username and password the address answers "not found".

## What you must do yourself
1. Supabase SQL editor: run `supabase/migrations/0109_ad_conversion_matches.sql`
   (safe to run twice). Until then the screen shows a warning and the file is
   empty apart from its two header lines.
2. In Vercel, project Environment Variables, add `ADS_FEED_PASSWORD` (skip if it
   is already there). Hidden input, at least 24 random characters, never in chat
   or in a file. Below 24 characters the address stays switched off. Redeploy.
3. In Google Ads, in the account that owns tag **AW-18511036958**:
   Goals > Conversions > New conversion action > Import > "Other data sources
   or CRMs" > Track conversions from clicks. Name it exactly `Job Completed`,
   value "use different values", count "one". A different spelling and every
   row is refused.
4. Goals > Conversions > Uploads > Schedules > new schedule. Source "HTTPS",
   the address above, the username and password, every day. Use "Preview"
   first. Remove any older schedule that pointed at another conversions file
   (for example one for the previous Google Ads account), so nothing is counted twice.
5. Stop uploading `/api/export-conversions` and the WhatsApp-review download by
   hand once the schedule runs: the same sales now come through this file.

## Test it once by hand
On `/admin/conversies`, "Download proefbestand" gives exactly what Google
would receive, without marking anything. Or in a terminal, typing the
password when asked (it stays out of your history):
`curl -u google-ads https://<your-domain>/api/ads/conversions.csv`

## What is in the file
One line per confirmed sale: click id (gclid, GBRAID or WBRAID column),
"Job Completed", the time of the sale (Amsterdam time), the value in euros
**excl. 21% BTW** with a dot, EUR. No names, phone numbers, emails,
addresses or plates.

The office types or checks the amount **incl. BTW** (what the customer paid);
the screen shows the excl. BTW figure that goes to Google next to it. A job's
`final_price` is incl. BTW. A WhatsApp price whose chat does not say incl. or
excl. is taken as incl. (owner's rule, 21 Nov 2026) and marked "aangenomen".

Left out: clicks older than 90 days (Google refuses them). The first time
Google receives a row it is marked "door Google opgehaald"; from then on the
office can no longer undo it in the CRM, only retract it in Google Ads.

## Where the proposals come from (src/lib/conversionMatcher.ts)
Sales: finished jobs, WhatsApp chats marked won (`whatsapp_quotes`), and
WhatsApp ad reviews marked "gedaan". Evidence, strongest first:
- hard: the click is on the job, on the job's own web form, or the office
  claimed the click for the job (`/admin/attributie`);
- strong: the WhatsApp ad code (`[K7F2]`) of the click appears in the review or
  in the won chat, or was sent from the sale's phone number (migration 0088);
- medium: another web form with the same phone number carries a click;
- guess: a tap on the phone button up to 72 hours before the job was entered,
  shown only when nothing better exists, with an extra confirmation.

A click a person confirmed for one sale is shown as taken for every other
sale. "Niet deze" hides that click for that sale for good.

## If Google sees a row again
The file always repeats every confirmed row of the last 90 days. A row Google
already has (same click, same name, same time) is ignored.

## Not covered
- Phone calls with no click trace at all (no form, no code, no tap).
- WhatsApp wins that are older than 90 days: most of the imported history.
- Microsoft Ads and ChatGPT ads (msclkid, oppref): not in this file.

## Good to know
Google calls file imports "legacy" and recommends the Google Ads API (or its
newer Data Manager API) for the long term. That route needs a developer token
and OAuth secrets; switch when volume or Google's deprecation makes it worth it.
