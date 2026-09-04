# Autosleutel24 — handoff

Everything another developer (or another AI agent) needs to pick this up.
Written 4 September 2026.

## Where it lives

```
/Users/ik/Desktop/autosleutel24-repo      ← the only real repo
```

Branch **`integrate`**, **17 commits ahead of `origin/main`**, nothing pushed
and nothing deployed. The live site still runs the old shop.

> There is a second copy at `~/.gemini/antigravity/scratch/autosleutel`
> (last commit `08b158c revert: contact page redesign`). It is **stale** —
> none of the work below is in it. Do not continue there.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres + Auth) ·
Vercel · Mollie for payments. No CSS framework: inline styles plus
`src/app/globals.css`.

Next 16 specifics that trip people up:

- `src/proxy.ts` replaces `middleware.ts`
- `params`, `searchParams` and `cookies()` are async
- React 19 forbids `setState` in an effect body (`react-hooks/set-state-in-effect`)
- a **server route must not import from a `'use client'` module** — the values
  arrive as client references, not objects. This caused every checkout to 500;
  see `src/lib/services.ts`.

## Commands

```bash
npm run dev                       # localhost:3000
npm run build                     # runs prebuild → build-catalog.mjs first
npx next start -p 3100 -H 0.0.0.0 # production build, reachable on the LAN
npx tsc --noEmit                  # typecheck
npx eslint src                    # lint
```

Testing on a phone: find the IP with `ipconfig getifaddr en0`, then open
`http://<ip>:3100`. Use the **production** build — the dev bundle is heavy
enough over a LAN that hydration may not arrive, which makes every button
look broken.

## The catalogue pipeline

One supplier: **A-Key GmbH**. Nothing else is in the shop.

```
src/data/akey-products.csv     the export (944 products)
src/data/akey-categories.json  which A-Key category pages each product sits on
src/data/akey-specs.json       the specification block off all 1,514 product pages
        ↓  scripts/build-catalog.mjs   (runs as `prebuild`, no network)
src/lib/catalog.json           generated, gitignored — the shop reads this
src/lib/brands.json            generated — car makes with counts, for client components
```

Scrapers, only run by hand when A-Key changes:

```bash
node scripts/scrape-akey-categories.mjs   # ~90 category pages → categories.json
node scripts/scrape-akey-specs.mjs        # 1,514 product pages → specs.json (~12 min)
node scripts/build-catalog.mjs            # rebuild catalog.json
node scripts/sync-payment-icons.mjs       # Mollie's enabled methods → icons + manifest
```

`src/lib/shopCatalog.ts` merges `catalog.json` with the `product_overrides`
table (price, stock, photos, published flag). **Everything that displays a
product must go through `getShopProducts` / `getShopProductBySlug`**, never the
raw JSON — a hidden product and a corrected price only exist in the merged
layer.

Data coverage, of 944 products: 918 photos · 478 button counts · 203
frequencies · 191 key blades · 184 transponders · 135 with model-level
fitment (287 distinct models). The gaps are what A-Key publishes, not import
bugs.

## What is built

**Webshop** — catalogue with facets (make, category, buttons, frequency,
transponder, blade), ranked search on article code and model, product pages
with A-Key's specifications, "past op deze auto's", comparison table, sticky
buy bar, four services (product only / frezen / opsturen / monteur), basket,
Mollie checkout, order confirmation e-mail, terms and returns pages.

**CRM** at `/admin` — leads, jobs, agenda, van screen, customers, reporting,
cash ledger, technician profiles, product management, orders.

**Mobile** — everything works at 375px. Menu and filter drawers open from a
hidden checkbox with a `<label>` handle, and filter options are plain links,
so both work before (or without) hydration. That is deliberate; don't
"simplify" it back into `onClick` handlers.

## House rules

The site had a lot of invented content. It was removed, and the rule is
absolute: **nothing on a page may claim something we cannot show is true.**

Removed, and not to come back without real data behind it: star ratings and
review counts, "Top seller" / "Best of 2026" badges, struck-through reference
prices, "OEM quality" seals over an aftermarket catalogue, invented blog
authors, a pre-ticked €6.95 warranty plan, next-day delivery promises.

Two Dutch rules this keeps hitting:

- **BW 6:193c** — misleading commercial practice (invented prices, reviews)
- **BW 6:230j** — a pre-ticked box may not add a paid extra

Prices, delivery terms and services live in code, not in copy:
`src/lib/catalog.ts` (margin tiers, €5 shipping, free from €25) and
`src/lib/services.ts` (frezen €19,95 · opsturen €29,95 · monteur €169).

## Environment

`.env.local` (gitignored). Production values belong in Vercel.

| Variable | State |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | set |
| `SUPABASE_SERVICE_ROLE_KEY` | set — **rotate before deploy**, it was pasted into a chat |
| `MOLLIE_API_KEY` | test key set; live key needed |
| `RESEND_API_KEY` | **missing** — no order confirmation is sent without it |
| `NEXT_PUBLIC_HIDE_CONSENT=1` | dev only; cannot disable the banner in production |

Supabase migrations are `supabase/migrations/0001…0012`, all applied to the
production project by hand through the SQL editor.

## Blocking go-live

1. **Mollie live key** — the test key works end to end; verified
   `POST /api/checkout` → 200 with a real Mollie checkout URL.
2. **Resend key + SPF/DKIM** on autosleutel24.nl — a paying customer currently
   receives nothing.
3. **The btw number** in `src/config/site.config.ts` reads as the KvK number
   with `NL`/`B01` around it. The Belastingdienst does not issue them that way.
   Verify it before it goes on an invoice.
4. Rotate the Supabase service key; change the CRM password (`123456`).
5. Product photos carry **A-Key's watermark** — ask them for clean files.
6. The Mollie **webhook cannot reach localhost**; the paid → confirmation →
   CRM path only completes once deployed (or through a tunnel).

## Next steps, in order

1. **Fitment from a second source.** Only 135 of 944 products name the cars
   they fit. Blade + frequency + transponder identifies most vehicles; combine
   that with the RDW data already used for kenteken lookups and "past op uw
   auto" can be answered from a licence plate.
2. **Test the money path** end to end once the live key is in: cancelled,
   expired, webhook retry, stock gone between basket and checkout.
3. **Open the shop to Google.** `/webshop` is `noindex` in `src/proxy.ts` and
   in the layout metadata — a hold from when the data was scraped English
   copy. Lift it for product and category pages, keep filtered URLs out, add a
   Merchant Center feed.
4. **Real reviews.** Ask by e-mail after delivery, store against the order,
   and only then put `AggregateRating` back in the schema.
5. **Stock from the supplier** instead of manual flags.
6. The other ~570 A-Key products the category crawl did not reach.

## Open questions for the owner

- The technician earnings split — the CRM tracks jobs and balances but cannot
  self-bill without it.
- €19,95 for *frezen* is my number, not theirs. Confirm.
- Which carriers besides DHL? A logo file at
  `public/images/carriers/dhl.svg` turns the text into the mark.
- Have the margin tiers in `src/lib/catalog.ts` been checked against what the
  market charges for these article codes?
