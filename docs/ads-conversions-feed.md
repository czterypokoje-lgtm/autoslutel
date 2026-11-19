# Daily conversions file for Google Ads

Finished jobs go back to Google Ads every day, so Google learns which ads
bring paying jobs. Google fetches the file by itself. Nobody downloads a CSV.

## The address
`https://<your-domain>/api/ads/conversions.csv`
Username: `google-ads`. Password: the value you set below.
Without the right username and password the address answers "not found".

## What you must do yourself (3 things)
1. In Vercel, project Environment Variables, add `ADS_FEED_PASSWORD`.
   Use a hidden input, at least 24 characters, random. Never paste it in chat
   or in a file. Below 24 characters the address stays switched off.
   Then redeploy so it takes effect.
2. In Google Ads: Goals > Conversions > Uploads > Schedules > new schedule.
   Source "HTTPS", the address above, the username and password, every day.
3. Check that a conversion action named exactly `Job Completed` exists in the
   account that runs the ads today, of the type "Import" from clicks.
   A different spelling and every row is refused.

## Test it once by hand
In a terminal, typing the password when asked (it stays out of your history):
`curl -u google-ads https://<your-domain>/api/ads/conversions.csv`
You should see two header lines and one line per finished job. A wrong
password gives an empty "not found". In Google Ads, use "Preview" on the
schedule before switching it to daily.

## What is in the file
One line per finished job that has an ad click id: click id, "Job Completed",
the time the job was finished (Amsterdam time), the value in euros with a dot
(the job's margin, the same figure the manual page uses), EUR.
No names, phone numbers, emails, addresses or plates.
Skipped: no click id, no value, completed before the click, click older than
90 days. Counts of each are written to the audit log.

## If Google sees a row again
The file always repeats the last 90 days. A row Google already has (same
click, same name, same time) is ignored, so a repeat fetch does no harm.

## Jobs that came in by phone or WhatsApp
A job without a click id of its own gets one more look (`src/lib/adAttribution.ts`).
A click id is added only when the evidence points at ONE click and ONE job:
- the job's own lead holds a click id (already how the file worked);
- a person claimed a click for the job (the "ad click" panel on the job);
- the WhatsApp ad code (`[K7F2]`) of a chat from the job's number points at a
  click. This needs migration `0088_call_click_chat_phone.sql` and the server
  that reads the WhatsApp chats to send `phone` with each code to
  `POST /api/ops/ad-reviews`. Without both, this rule simply does nothing.
- (off by default) another lead with the same number holds a click id; switch
  on with `ADS_FEED_INCLUDE_LIKELY=1` only after looking at
  `GET /api/ops/attribution-stats`.

Nothing is added when two different clicks fit the job (the customer clicked
twice), when the same code came from two numbers (a forwarded link), or when
the click is already on another job or fits two jobs (a customer who returns
with the same number). Those jobs stay without a click id on purpose: a wrong
click id teaches Google to buy the wrong traffic. A click must be no later
than the job and no older than 90 days before it. Counts are in the audit log
(`recovered_certain`, `recovered_likely`, `skipped_duplicate_click`).

## Not covered
- Phone-call jobs without a click id that nobody claimed and no chat or lead
  ties to the job (a plain call leaves no trace to match).
- Jobs older than 90 days: Google forgets the click after 90 days.
- Microsoft Ads (separate file, still manual).

## Good to know
Google calls file imports "legacy" and recommends "enhanced conversions for
leads" as the long-term route. This feed works today; plan the switch later.
