# Platform strategy — two products, one engine

Written 20 September 2026, against branch `integrate`, after reading
`HANDOFF.md`, `ANTIGRAVITY-CRM.md`, `AGENTS.md`, all 45 files in
`supabase/migrations/`, and `prisma/schema.prisma`.

This file exists because an external prompt (written by ChatGPT, without
access to this repo) described a plan to turn "CarKey24" into a multi-tenant
SaaS sold to other locksmith businesses. That prompt was **not wrong about
the destination**, but it was blind to the fact that **the destination is
partly built already, in a different shape than it assumed**. Read this
before touching architecture based on that prompt or its descendants.

---

## 1. What actually exists (verified against the repo, not assumed)

autosleutel24.nl is a live, single-tenant Next.js app. There is exactly one
company in this database: autosleutel24 itself. It has grown into a
**technician dispatch marketplace**, not a piece of software other companies
run:

- `technicians` + `technician_availability`, `technician_coverage`,
  `technician_tools`, `technician_subscription` — technicians join *our*
  network and pay *us* (Starter €0+25%, Pro €399+18%, Premium €1200+8%,
  reasoned about against real revenue break-evens in `HANDOFF.md`).
- `job_offers` + `crm_respond_to_offer()` — offer/accept, not assign. Built
  deliberately this way because of *schijnzelfstandigheid* risk (NL
  self-employment law) — this is a legal decision already made, not an
  oversight.
- `src/lib/dispatch.ts`, `capability.ts`, `quote.ts`, `scenarios.ts` — real
  dispatch logic: hard gates (capability, area, availability, slot), scored,
  van-stock weighted heaviest.
- `src/lib/subscription.ts` — the tier pricing above, with the actual
  break-even math behind why Pro is €399 and not €599.
- An agent API (`/api/agent/car|quote|slots|book`) built for ElevenLabs but
  **not yet connected** — bearer-token gated, price always recomputed
  server-side, agent never composes a price. This is the voice product the
  external prompt asked for; it already exists as a contract, unwired.
- Network layer (`0040`–`0043`): Discord-shaped channels for technicians,
  scoped by region and by make — this is community/support infrastructure
  for the marketplace side, not multi-tenant infrastructure.
- WhatsApp (`wa.me` links only, no Business API yet), Telegram (offer
  notifications), marketplace_listings, sales_invoices, stock_transfer,
  purchase_invoices, revenue_analysis, capability_gaps — a real, deep
  operational core.
- `prisma/schema.prisma` is the **former webshop's** data model. The webshop
  itself was deleted from this repo on 17 Sept 2026 (see `ANTIGRAVITY-CRM.md`
  header) and lives only on branch `webshop-backup-2026-09-17`. Treat Prisma
  as historical, not as the platform's real schema — Supabase migrations are.

**None of this has a `tenant_id`.** RLS is role-based
(`owner`/`kantoor`/`monteur` in JWT `app_metadata.role`, via `crm_role()` in
migration `0003`), not tenant-scoped. There is one business in this
database, full stop.

### Standing technical debt that blocks *any* commercial expansion

From `HANDOFF.md` §7, still true unless someone confirms otherwise —
**check before assuming fixed**:

1. CRM password for `info@autosleutel24.nl` was `123456` against a public
   Supabase anon key.
2. `SUPABASE_SERVICE_ROLE_KEY` was pasted into a chat and needs rotation.
3. No audit trail on leads/jobs — "who changed this" is unanswerable.

Do not sell this to anyone, in any form, before these three are closed.

### Standing business decisions nobody has made yet

Also from `HANDOFF.md` — an AI agent must not invent answers to these:

- Are the €399/€1,200 subscription fees monthly or annual?
- Technicians: employees or independent contractors? (Direct legal exposure
  under NL *schijnzelfstandigheid* enforcement, resumed 2025.)
- Who holds the customer's payment — does commission flow through Mollie, or
  is there collection risk on every job?
- The technician earnings split for self-billing.

---

## 2. The real shape: two flywheels, correctly separated

The external prompt's "two flywheels feed each other" idea is sound, but it
described the wrong second flywheel. The actual pair is:

```
FLYWHEEL A — already live
Lead (autosleutel24.nl) → Dispatch to network technician → Job → Payment
  → technician subscription revenue + commission
  → improve dispatch.ts / quote.ts / scenarios.ts
  → recruit more technicians (unmet_requests table = the recruitment list)

FLYWHEEL B — not started, needs new infrastructure
Prospect (competing locksmith owner) → Demo → Tenant provisioned
  → THEIR technicians, THEIR stock, THEIR customers, isolated
  → they pay a software subscription (not a marketplace cut)
  → learn what's universal vs autosleutel24-specific
  → generalize into config, not code
```

These do **not** merge into one tenant model. Flywheel A's tenant *is*
autosleutel24 — the technicians are sub-actors inside it, not tenants
themselves. Flywheel B needs an actual tenant boundary above the company
level: an independent locksmith owner in Flywheel B would run their *own*
version of Flywheel A internally (their own technicians, their own
dispatch), completely isolated from yours.

Do not let a future agent collapse "technician" and "tenant" into the same
concept. A technician subscribes to a network. A tenant *owns* a network.

---

## 3. What Flywheel B actually requires (the honest scope)

This is a real multi-week migration project, not a config flag. Scope,
grounded in the existing schema:

**Tenant-scoping required on:** `leads`, `technicians`, `jobs`,
`stock_items`, `service_templates`, `customer` data (currently no
`customers` table — customers are derived via `crm_customers` view off
`leads`/`jobs` by phone number), `orders`, `product_overrides`,
`technician_ledger`, `sales_invoices`, `purchase_invoices`, all `crm_report_*`
views, `network_channels`.

**Not tenant-scoped, stays global:** the catalogue (`src/lib/catalog.json`,
3,627 articles from A-Key) — this is shared reference data every tenant
reads, none write. Same for `technician_coverage` taxonomy and
`scenarios.ts` — these are domain knowledge, not tenant data.

**RLS rework:** every policy currently checks `crm_role()` alone. Every one
needs `crm_role() AND tenant_id = current_tenant()`. Remember the lesson
already paid for once (migration `0003`'s comment): Postgres checks table
*privileges* before row policies — a tenant check without the matching
`grant` silently denies everyone, not just other tenants.

**Provider abstraction** already half-exists in spirit
(`src/lib/whatsapp.ts` builds messages rather than embedding a provider
inline everywhere) but is not yet a real interface. If Flywheel B ships,
`VoiceProvider`/`MessagingProvider` abstractions become worth building —
before that, they're premature.

**Migrations stay additive and idempotent** — this repo's existing rule
(`if not exists`, no destructive `alter`, handed to the owner as numbered
SQL to paste by hand, no migration runner). A tenant retrofit is not an
exception to this; it's the biggest test of it.

---

## 4. Sequencing (do not skip ahead)

1. **Close the three security items in §1.** Non-negotiable, blocks
   everything else including continuing to run Flywheel A safely.
2. **Get the four business decisions in §1 answered by the owner.** An
   agent should ask, not infer, per the existing house rule ("never invent a
   business number").
3. **Finish Flywheel A's own unfinished pieces** before starting Flywheel B:
   self-billing, order→job automation, the technician entrance/onboarding
   wizard (currently manual via `scripts/crm-user.mjs`), stock that
   actually decrements. These are listed in priority order in
   `ANTIGRAVITY-CRM.md` and `HANDOFF.md` §6 already — do not re-derive them.
4. **Connect the ElevenLabs agent API** that already exists
   (`/api/agent/*`) to a real phone number and run it inside autosleutel24
   first. This is the "internal proof before external sale" step the
   external prompt correctly wanted — but the thing being proven is the
   *voice agent*, not a rebuilt CRM, because the CRM already works.
5. **Only then** scope the tenant retrofit (§3), and only after identifying
   3–5 real prospects willing to pay before it's built — the external
   prompt's own "initial commercial validation" principle, which is correct
   and should be kept.

---

## 5. Context block for future AI agents

Prepend this (not the external prompt's `PRODUCT CONTEXT` section, which
assumes Flywheel B already exists) to any spec given to an agent that
touches commercial/tenant architecture:

> autosleutel24.nl runs a live, single-tenant technician dispatch
> marketplace (see `PLATFORM-STRATEGY.md`). A second product — licensing
> this platform to other independent locksmith businesses as isolated
> tenants — is a stated future direction but has zero implementation yet:
> no `tenant_id`, no tenant-scoped RLS, no per-tenant config. Do not assume
> multi-tenancy exists. Do not add a `tenant_id` column speculatively to a
> single table without scoping the whole vertical slice (schema + RLS +
> grants + queries) — a half-tenant-scoped table is worse than an
> unscoped one, because it looks safe and isn't. Ask which flywheel
> (§2 above) a task belongs to before writing code that assumes the other.
