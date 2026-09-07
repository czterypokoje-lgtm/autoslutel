# Handoff — autosleutel24.nl

Last updated 7 Sep 2026, branch `integrate`, head `6b254c0`.

A Dutch mobile car-key business, becoming a dispatch platform for car-key
technicians. Webshop and CRM are one Next.js app. **Read `AGENTS.md` first** —
this is Next 16 and the APIs differ from what you remember.

Talk to the user in **English**. The product — UI strings, product copy, commit
messages — is Dutch and stays Dutch.

---

## 1. Where things are

| | |
|---|---|
| Repo | `~/Desktop/autosleutel24-repo`, remote `czterypokoje-lgtm/autoslutel` |
| Branch | `integrate` — **all work is here; `main` is days behind** |
| Local | `npm run dev` → `localhost:3000`, CRM at `/admin` |
| Preview | `autoslutel-git-integrate-nethoreca.vercel.app` — deployed but blocked, see §7 |

```bash
npm run dev
npx tsc --noEmit && npm run build
node scripts/audit-catalog.mjs     # catalogue invariants — must print "No failures"
```

---

## 2. The catalogue (done, working)

Four scripts in order. Each refuses to guess; missing evidence means the article
is held back, never filed wrong.

```bash
node scripts/scrape-akey-catalog.mjs   # 3,752 pages from their sitemap
node scripts/scrape-akey-sections.mjs
node scripts/classify-akey.mjs         # category per article, with evidence
node scripts/build-catalog.mjs         # → src/lib/catalog.json (generated, gitignored)
node scripts/audit-catalog.mjs
```

**The rule:** a category comes from A-Key's own JSON-LD breadcrumb, never from
words in a title. `scripts/taxonomy.mjs` maps all 50 of their shelves to our 20
categories by hand; an unmapped shelf fails the build. **Edit `taxonomy.mjs`
when something is filed wrong.**

3,627 articles · `filed 3503 · review 41 · conflicts 0` · 127 without a price.
1,700 fitment entries (1,073 with both years, 104 start-year only, 523 with
none because A-Key states none).

---

## 3. The platform layer (new, built, not yet exercised with real data)

**`supabase/migrations/0013_technician_platform.sql` has not been run against
any database yet.** Run it first; every screen below fails with a clear
"voer de migratie uit" message until you do.

| Table | Holds |
|---|---|
| `technician_coverage` | which cars, per scenario; make-wide rows with model exceptions |
| `technician_tools` | what is in the van |
| `technician_subscription` | tier, fee, commission **on the row** — a price change must never retroactively alter what someone owes |
| `job_offers` | offer and accept, never assign |
| `unmet_requests` | every request we could not serve = the recruitment list |

### The libraries

- **`src/lib/scenarios.ts`** — `bijmaken`, `alle_sleutels_kwijt`, `reparatie`,
  `slot`. Four different jobs, not degrees of one.
- **`src/lib/capability.ts`** — `coversCar()` / `whoCanDo()`. Model beats make,
  exclusion beats permission, unknown car is **no**.
- **`src/lib/quote.ts`** — price from our catalogue. First an article naming the
  model; otherwise the **median of the make**, but only while those keys sit
  within **1.8×** of each other. Renault spans 1.3× (quotable); Toyota spans
  31.8×, because its range runs from a €7 chip to a €220 smart key — there we
  refuse and say a colleague will call.
- **`src/lib/dispatch.ts`** — four hard gates (capability, area, availability,
  slot), then a score. Van stock weighted heaviest at 50 points: arriving
  without the right blank is the most expensive failure in this trade. Premium
  buys a 90-second head start, not exclusivity.
- **`src/lib/subscription.ts`** — Starter €0 + 25%, **Pro €399** + 18%,
  Premium €1,200 + 8%. Pro is €399 and not €599 because at €599 it was never
  the cheapest tier at any revenue (Premium overtook Starter at €7,059, Pro not
  until €8,557). Now: Starter < €5,700 < Pro < €8,010 < Premium.

### The agent API (built; ElevenLabs not yet connected)

`/api/agent/car` · `quote` · `slots` · `book`. Bearer auth via
`AGENT_API_TOKEN` (set it, or the routes return 503 by design).

Two rules that must not be relaxed: **the agent never composes a price** (it
gets a number or a sentence it can say aloud), and **`/book` re-computes the
price server-side** — a caller who talks the agent into a number must not make
it binding.

No licence plate is asked for. Intake is make, model, year, "heeft u nog een
werkende sleutel?", keyless, postcode. RDW lookup stays available for callers
who have a plate to hand.

---

## 4. The CRM

Design system: `src/app/admin/theme.css` (four surfaces, three inks, two rules,
one accent, three radii) and `admin.module.css` (shell plus the shared list
idiom: rounded card, hairline rows, chips, icon group). Icons are
`lucide-react`. `src/lib/crmColours.ts` maps pre-dark-theme technician colours
rather than migrating them.

Screens for the technician: **Aanbod** (accept/decline with a live countdown,
`crm_respond_to_offer()` claims the job in one statement so two people cannot
both win) and **Mijn vak** (own tools and coverage, plus their tier with the
real break-even number computed from their last 30 days).

WhatsApp is phase 1: `src/lib/whatsapp.ts` builds `wa.me` links with the message
pre-written. No Business API.

---

## 5. Rules learned the hard way

- **A server route must never import from a `'use client'` module.** Values
  arrive as client references. This 500'd every checkout once.
- **Inline styles cannot carry media queries.** Every mobile failure traced here.
- Menus and filters use CSS checkbox + real `<a href>`, so they work before
  hydration. Buttons did not.
- Next 16: `src/proxy.ts` (not `middleware.ts`), async `params` / `searchParams`
  / `cookies()`.
- Supabase: role in JWT `app_metadata.role`; RLS **and** GRANTs, because
  privileges are checked before policies. Only `src/lib/supabase/admin.ts`
  bypasses RLS, and only the agent routes may use it.
- **Never invent** prices, stock, EAN/GTIN, BTW numbers or reviews.

---

## 6. Next, in order

**1. The technician entrance — this is the blocker.** There is none. Today a
technician needs `scripts/crm-user.mjs` run on a laptop, then hand-linking in
`/admin/monteurs`; `/api/admin/crm-users` only has a `GET`. Needed: invite by
e-mail from the monteurs page, and a first-run wizard (phone → work area →
tools → coverage → tier) that **does not finish until coverage exists** — a
technician who lands on an empty Aanbod concludes the app is broken.

**2. The network, Discord-shaped.** The user was explicit: servers → channels,
by region and later by country, not a flat Slack. Server = Nederland, later
België/Deutschland (where price list, VAT and contract all differ, so the
boundary is real). Channels by town and by make. The part that is not Discord:
a channel scoped to a make reaches exactly the technicians who declared that
coverage, so a question routes itself. Supabase Realtime; no new vendor.

**3. Van stock** — `stock_items` exists and nothing writes to it. Morning load
list, deduct on job completion, van-to-van transfer.

**4. Routing and map** — PDOK geocoder (free, verified). OSRM works but its
public server is demo-only: self-host or pay Mapbox.

**5. carkeyhelper** — 3,800 verified procedure pages. Ask them: API or stable
URL pattern per make/model/year, account linking, reseller terms, referrals.

---

## 7. Open items

**Security, before sharing any link.**

1. Rotate the Supabase **service_role key** — it was pasted into a chat.
2. Change the CRM password for `info@autosleutel24.nl`; it is still `123456`.

**Blocking the friend's access.** The preview deploy is current but Vercel
**Deployment Protection** returns Vercel's own login page — the "No Vercel
account for this email" error. Fix: *Project `autoslutel` → Settings →
Deployment Protection → Vercel Authentication → off*, or Protection Bypass.

**Decisions the user still owes.**

- Are €399 / €1,200 per month or per year? Every number assumes monthly.
- Technicians employees or independents? We set the price, take the payment and
  route the work — in NL that is the pattern examined for
  *schijnzelfstandigheid*, enforcement resumed 2025. Offer-and-accept is already
  built for this reason; keep it.
- Who holds the customer's money. Commission only works if it passes through
  us (Mollie), otherwise there is collection risk on every job.

**Unverified.** The CRM redesign and the two new screens were checked by
rendering the real stylesheets in a browser; nobody has walked them signed in
with real data, because there is no login to use.

**Infrastructure.** ~500 MB of product images committed; a push failed at 239 MB
once. Images are WebP now, but watch repo size.
