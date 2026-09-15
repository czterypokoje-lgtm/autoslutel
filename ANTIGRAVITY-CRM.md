# Brief for the next agent — the CRM

Paste this as the opening message of a chat that works on `/admin` only.
Written 4 September 2026. The webshop has its own brief in
`ANTIGRAVITY.md`; read that one only if your change crosses into the shop.

---

You are working on the internal CRM of **autosleutel24.nl**, a Dutch mobile
car-key service. The office plans jobs here, technicians run their day from
it, and money is counted in it. It is used, not a prototype: wrong data here
becomes a wrong invoice or a technician sent to the wrong address.

Repo: `/Users/ik/Desktop/autosleutel24-repo`, branch `integrate`.
Read `HANDOFF.md` for the project as a whole and `AGENTS.md` for the Next 16
rules. **Stay out of `src/app/webshop`, `src/components/webshop`,
`src/lib/catalog*` and `scripts/` unless the task genuinely needs them** —
another agent works there and you will collide.

## The surface

Everything lives under `src/app/admin` (pages) and `src/app/api/admin`
(mutations). Styling is CSS modules per section plus `src/app/admin/theme.css`
— the CRM is deliberately neutral and dense; the orange belongs to the shop.

| Route | What it is |
|---|---|
| `/admin/leads` | the pipeline — every enquiry from the site |
| `/admin/jobs`, `/jobs/[id]`, `/jobs/nieuw` | jobs and the planning board |
| `/admin/vandaag` | the technician's day screen, built for a van |
| `/admin/mijn-agenda`, `/mijn-profiel` | the technician's own calendar and profile |
| `/admin/monteurs` | technicians, availability, ledger |
| `/admin/klanten`, `/klanten/[telefoon]` | customers, keyed on phone number |
| `/admin/orders`, `/orders/[id]` | webshop orders, and which need planning |
| `/admin/producten`, `/producten/[slug]` | price, stock, photos, publish state |
| `/admin/kas`, `/kas/[id]` | cash and the technician ledger |
| `/admin/rapportage` | source, service, response time, technician, region |
| `/admin/instellingen` | service templates, stock, CRM users |

API routes mirror these under `/api/admin/*`, plus `/api/agenda/[token]` — an
iCal feed so a technician's phone calendar shows their jobs.

## Auth, and why it is in two places

Roles are `owner`, `kantoor`, `monteur`, stored in the Supabase JWT at
`app_metadata.role` — not in a table, so a policy check costs no extra read.
Assign one with:

```js
supabase.auth.admin.updateUserById(id, { app_metadata: { role: 'kantoor' } })
```

- `src/proxy.ts` does an **optimistic** check and refreshes the token. It is
  not authorisation; a Server Component cannot set cookies, so this is where
  the session stays alive.
- `src/lib/crmSession.ts` is the real gate, next to the data:
  `requireOfficeUser()` for office pages, `requireCrmUser()` where a monteur
  belongs too. **Every page and every route starts with one of these.** A page
  that reads data without calling one is a bug, even if it looks harmless.
- Postgres has the last word: RLS policies plus `public.crm_role()` in
  migration `0003`. Note the lesson in that file — Postgres checks table
  *privileges* before it looks at a row policy, so a policy without a `grant`
  denies everyone. That cost a day.

## Schema

`supabase/migrations/0001…0012`, all applied by hand to the production project
through the SQL editor. There is no migration runner; if you add one, hand the
SQL to the owner to paste, and say so plainly.

```
leads                    every enquiry (the public site writes here)
technicians              + technician_availability
jobs                     + job_photos, job_materials, job_payments
technician_ledger        what a technician owes or is owed
service_templates        service + price presets
stock_items              van stock
orders                   webshop orders (jsonb items snapshot)
product_overrides        the office's price/stock/photo decisions
product_reviews          exists, unused — no review flow yet

views: crm_customers · crm_customer_vehicles · crm_technician_balance
       crm_warranty_watch · crm_orders_to_plan
       crm_report_source / _service / _response / _technician / _region
```

`orders.items` is a **snapshot** taken at checkout — never re-read prices from
the catalogue for an old order.

## What is unfinished, in the code's own words

- `/admin/instellingen` — *"De vergoeding wordt nog niet automatisch geboekt"*.
  Self-billing is blocked on one decision nobody has made: **the technician
  earnings split**. Ask; do not invent a percentage.
- `/admin/mijn-profiel` — a technician cannot change their own e-mail, because
  no mail server is wired up. Same blocker as the webshop: `RESEND_API_KEY`.
- A signed-in monteur whose account is not linked to a `technicians` row sees
  an explanatory empty state on three screens. That is intended, but the
  linking still happens by hand in `/admin/monteurs`.
- `product_reviews` is an empty table with no flow behind it.

## Rules

**1. Never invent a business number.** An earnings split, a service price, a
VAT number, a technician's hourly rate. Ask. A CRM that displays a confident
wrong number is worse than one that displays nothing.

**2. Money is recalculated, never trusted from the client.** Payments and
ledger entries are written server-side in `/api/admin/*` and checked there.
Do not let a form post an amount that is stored as-is without a check.

**3. Every page and route starts with `requireOfficeUser` or
`requireCrmUser`.** No exceptions for "internal" pages.

**4. Do not weaken RLS to make something work.** If a query returns nothing,
the cause is a missing `grant` or a policy, and both are fixable without
`service_role`. The service key bypasses every policy — it belongs in
webhooks and public write endpoints, not in CRM pages.

**5. Migrations are additive and idempotent.** `if not exists`, no
destructive `alter`. They are pasted into a production database by a person.

**6. Ask before anything irreversible** — running SQL against production,
deleting rows, changing a role, rotating a key.

## Definition of done

Typecheck and build clean · the screen loaded and used, including at 375px
because the van screen lives on a phone · the query checked against real data,
not assumed · any SQL handed over as a numbered migration file with a note
that it needs pasting · what is still missing said out loud.

```bash
npx tsc --noEmit
npm run build
npx next start -p 3100 -H 0.0.0.0     # then /admin on a phone
```

## Known problems to fix early

1. **The CRM password is `123456`** for `info@autosleutel24.nl`. The Supabase
   anon key is public by design, so anyone can try that against the live auth
   endpoint. This is the most urgent item in the whole project.
2. **The `SUPABASE_SERVICE_ROLE_KEY` was pasted into a chat.** It bypasses
   every policy. Rotate it and update Vercel.
3. There is no audit trail: "who changed this lead" is answerable from the
   role model but nothing writes it down yet.

## Suggested order of work

1. Password and key rotation, and a check that no CRM page reads with the
   service key where a user session would do.
2. **Self-billing**, once the split is known: `technician_ledger` already has
   the shape; what is missing is the rule and a monthly statement a technician
   can see in `/admin/mijn-profiel`.
3. **Order → job automation.** `crm_orders_to_plan` exists; a paid webshop
   order with a technician service should create a job rather than wait for
   someone to notice it.
4. **Audit trail** on leads and jobs — who changed what, when.
5. **Stock that decrements** when a job books materials, so `stock_items`
   reflects the van rather than an intention.

## First move

Read `src/lib/crmSession.ts`, `supabase/migrations/0003_crm_roles.sql` and one
full slice — `/admin/jobs/[id]` with its API route — before writing anything.
Then tell me which of the five items you propose to start with and why, and
what you need from the owner to finish it.
