# Job room: approval secret, who mints tokens, roles and erasure

Status: shadow. Nothing here sends a message. Written for the owner's review of migrations 0078 to 0085.

## The rule

A message in `job_outbox` is released only by a **signed approval token**. The token carries who approves (the approver's number), through which channel, the decision, and the hash of the exact row they were shown. `POST /api/ops/jobroom/approvals` reads all of that from the token and nothing from the JSON around it.

The ops token (`OPS_API_TOKEN`) lets a caller *propose*. It cannot approve. That is the point of having two secrets: the side that proposes (the transport, an assistant's process) must never be able to approve what it proposed.

## Where `JOBROOM_APPROVAL_SECRET` lives

| Place | Holds it? | Why |
|---|---|---|
| CRM on Vercel (server env only, never `NEXT_PUBLIC_`) | yes, to **verify** tokens | The approvals route has to check the signature. |
| The process that **mints** tokens | yes, to sign | See "Who mints tokens". |
| The WhatsApp transport (`wacli` / Cloud API worker) | **no** | It proposes and sends; it must not approve. |
| Claw / OpenClaw, the model, any agent environment | **no** | The model has no sending or approving tools. |
| The assistant's own devices or accounts | **no** | The assistant approves through the verified channel, not with a secret. |
| `OPS_API_TOKEN` env of the transport | **never in the same env file** | If one leak gives both, the split protects nothing. |
| Chat, logs, command lines, URLs, prompts, git | never | Same rule as every other key (concepts brief, Security basics). |

Rotation: every 3 months and at once after any exposure. Rotating invalidates tokens in flight (they live at most 10 minutes), which is harmless.

The secret must be at least 32 characters. With no secret configured the approvals route answers 503 and approves nothing (fails closed).

## Who mints tokens

1. **The owner, from the CRM** (built, off by default). `POST /api/admin/jobroom/approval-token` needs a signed-in CRM session with role `owner` and `JOBROOM_MINT_ENABLED=on`. The server re-computes the hash of the stored row (the caller cannot choose what is approved), takes the approver's number from the owner's `job_approvers` row, and returns a token valid for 2 minutes. The identity is the CRM session, verified by Supabase Auth, never a field in the request.
2. **The assistant, from `tech-listen`** (not built; server side, lane J2). The process that receives the assistant's `ja A7` from their own WhatsApp number mints the token after checking, itself, that the message came from that number on the business line. It holds the secret; the assistant's account does not. The approver number in the token is the number WhatsApp reported for the sender, never text from the message.
3. Nobody else. There is no mint endpoint for the transport, for Claw, or for the assistant's session.

**The approver number must come from the verified channel.** In the CRM that is the Supabase session; in `tech-listen` it is the sender number the WhatsApp session reports. A number typed into a request, a lead name, or message text is never an identity.

What a token cannot do: approve a row whose text, recipient, audience, tier, kind or attachment changed after the card was shown (the hash covers all of them, and the database refuses such edits anyway); approve twice (one approval per row, enforced by a unique key and a transaction); approve past the 24-hour window; approve something the approver has no right for (`job_approvers`: audiences, highest tier, invoices).

## The transport credential (inbound messages)

`POST /api/ops/jobroom/inbound` (what a customer wrote) needs a second secret besides `OPS_API_TOKEN`: `JOBROOM_TRANSPORT_TOKEN` (32+ characters), sent by the transport as header `x-transport-token`. Without it the route answers 403 and nothing is recorded as "in". `POST /events` refuses `direction: "in"` altogether, whatever `actor` the body claims, so a caller with only the ops token cannot fake a customer message (which is what makes a reply "customer_reply"). An event that names a room and a contact must name a room that exists and a contact that belongs to it.

## Roles: owner and staff exist only in SQL

`owner` and `staff` contacts unlock the `internal` audience and approver rights, so the API refuses to create them and a contact's role can never change once set (migration 0083 enforces both in the database). To add the owner or the assistant, in the SQL editor, in one run:

```sql
select set_config('app.allow_staff_roles', 'on', true);
insert into public.contacts (phone_e164, display_name, role) values ('<E.164 number>', '<name>', 'owner');   -- or 'staff'
insert into public.job_approvers (contact_id, role) values ('<that contact id>', 'owner');                  -- or 'assistant', with audiences, max_tier, may_invoice
```

An approver row grants nothing by default: the owner sets `audiences`, `max_tier` and `may_invoice` explicitly. Suggested start for the assistant: customer drafts yes, invoices no.

## Erasure (GDPR)

The log tables are append-only on purpose. A deletion request is honoured by blanking the message text, not by deleting rows:

```sql
select * from public.job_redact_contact_messages('<contact id>', 'avg-verzoek 2026-11');
```

It blanks `body` (and `meta` for events) of that contact's events, of events without a contact id that belong to their own jobs, and of their finished outbox rows (sent, cancelled, failed). It keeps ids, hashes, kinds and times, sets `redacted_at`, and writes one event `privacy.redacted` with counts and the reason code only. Evidence events (`outbox.blocked`, `approval.refused`, `privacy.redacted`: ids, hashes and reason codes) are never blanked. It also **anonymises the contact row** (name, WhatsApp name, city and number replaced, aliases removed, contact deactivated). It refuses owner, staff and approver contacts. It also redacts events of the contact's own jobs written by anyone who is not owner, staff or approver. It **refuses while the contact still has unfinished outbox rows** (proposed, approved, claimed, unknown): cancel or finish them first. The reason is a code, never personal data. Only the service role and the SQL editor can run it. Deadline: within 30 days of the request (concepts brief).

**Run it before anything else touches the contact.** A contact that has events can never be deleted (the log points at it, and 0084 refuses the delete with a clear message); after redaction the anonymised row simply stays.

## Running the checks

All checks are plain Node scripts (Node 24, no test runner, nothing added to `package.json`). From the CRM repo root:

```bash
node scripts/check-jobroom.mts      # handlers, on an in-memory fake database
node scripts/check-joblive.mts      # live view logic and the stop alarm
node scripts/attack-jobroom.mts     # attacks on the guard, approvals, events, tier 0, plus stress
node scripts/check-jobroom-sql.mts  # migrations 0078 to 0085 on a throwaway Postgres (pglite)
```

`check-jobroom-sql.mts` needs `@electric-sql/pglite`. The first run installs it once (pinned to 0.2.17, with npm) into a folder in the system temp directory, so it needs network only that once; after that it runs offline. Set `PGLITE_DIR=<folder>` to use another folder, or `PGLITE_OFFLINE=1` to forbid the install (then it tells you the one command to run by hand: `npm install @electric-sql/pglite@0.2.17 --prefix <folder>`). The database is in memory and thrown away; nothing touches Supabase. The script runs the migrations twice, as the non-superuser roles `service_role` (bypasses RLS), `authenticated` and `anon`, with Supabase-style default grants (every new table granted to all three), and also runs the real handlers against that Postgres. Expected last line: `check-jobroom-sql: all passed (... checks, 7 migrations applied twice ...)`.

