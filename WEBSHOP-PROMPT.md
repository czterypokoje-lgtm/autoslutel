# The one prompt

Hand everything between the two `═══` rules to a fresh Claude Code session on
this repository. It is written to stand alone — it does not assume any memory
of the conversation that produced it.

Below the prompt: **what I need from you** (§A), **templates** (§B), and
**what I already checked so you don't pay for it twice** (§C).

═══════════════════════════════════════════════════════════════════════════

## Build the autosleutel24 webshop on its own domain

You are working on `czterypokoje-lgtm/autoslutel`, a Next.js 16 app. **Read
`AGENTS.md` first — this is Next 16 and the APIs differ from your training
data.** Talk to me in English; the product (UI strings, product copy, commit
messages) is Dutch and stays Dutch.

### The situation, in full

This repository holds two things: a **service site** (autosleutel24.nl — lead
capture, dispatch, CRM, voice agent) and a **webshop** that was removed from it
on 17 September 2026.

Read commit `5acebbb8` before you start. It is the whole reason this task
exists:

> **Remove the webshop entirely — SEO/traffic collapse, moving to its own
> domain.** Google Analytics active users collapsed to near-zero starting ~Sept
> 5 […] Sept 2: `/webshop` was deliberately noindexed over scraped third-party
> product content — legitimate at the time, but Google dropped every webshop
> page from its index within days, matching the traffic cliff almost exactly.
> […] Per instruction: the webshop is being run on its own domain going
> forward, disconnected from this project's SEO/traffic.

**The one rule that outranks everything else in this task: the webshop must
never again be crawlable on autosleutel24.nl.** Not in its sitemap, not in its
nav, not reachable by a crawler. If a change you are about to make would put
supplier-derived product pages back into autosleutel24.nl's index, stop and ask.

The pre-removal shop is preserved on branch **`webshop-backup-2026-09-17`**
(tip `c367eabb`). I have verified it still builds clean on Next 16.4.0. It is
good: 14 routes, ~40 components, its own navigation, mega-menu, search, account,
orders, wishlist, checkout and a well-designed service model. **It is the base.
You are not rebuilding it.**

A second branch, `claude/vibrant-hypatia-8upt86`, holds a *different*, newer
shop at `/winkel` built without knowledge of the backup branch. Most of it is
redundant. Three pieces of it are not, and porting those into the backup shop
is the main body of this task.

### What to do

**1. Make the branch.**

```bash
git fetch --all
git checkout -b webshop-eigen-domein origin/webshop-backup-2026-09-17
```

Work there. Push with `git push -u origin webshop-eigen-domein`. Do not push to
`main` or to `claude/vibrant-hypatia-8upt86`.

**2. Cut the shop loose from autosleutel24.nl.**

- `src/proxy.ts` has `const HIDDEN = ['/webshop'];` — a hard 404 on every
  `/webshop` request, added Sept 16. Decide its fate deliberately: on the new
  domain the shop must be *reachable*, on the old one it must not be. The
  cleanest shape is to key it off an env var (e.g. `SHOP_HOST`) rather than
  delete it, so one deploy can serve the shop and another can keep 404ing it.
- `src/config/site.config.ts` has `domain: 'https://www.autosleutel24.nl'`.
  The shop needs its own, from an env var with the current value as the
  fallback, so canonicals, OG URLs and the sitemap name the right host.
  Only one file under `src/app/webshop` and `src/components/webshop` reads
  `SITE_CONFIG.domain`, so this is a small change — check it is still only one.
- `src/app/sitemap.ts` and `src/app/robots.ts` must not list or allow any
  `/webshop` URL while they are serving autosleutel24.nl.
- Ask me for the domain. If I have not given you one, use
  `SHOP_DOMAIN` from the environment and leave it unset — do not invent a
  hostname or hardcode one.

**3. Port three things from `claude/vibrant-hypatia-8upt86`.** Read each file on
that branch, understand *why* it is written the way it is from its comments,
then bring it across. Do not cherry-pick the commits — that branch also carries
a whole parallel shop you do not want.

   **(a) `src/lib/finder.ts` — the catalogue-wide car finder.** The backup shop
   has `VehicleFitmentWidget`, which answers "does *this product* fit my car?"
   on a product page. It does not have an entry point that answers "what fits my
   car?" across the catalogue. That is this file.

   Its central decision, and the one thing you must not undo: **make filters,
   model ranks, year refines.** Only 416 of 2,108 public articles name a model
   and only 214 carry year ranges, so a strict make→model→year filter returns an
   empty shelf for most of the Dutch car park — measured: Mercedes C-Klasse 2016
   returned **0** articles, Toyota Yaris 2015 returned **1**. "No model stated"
   means the supplier did not narrow it, not that it does not fit. So the model
   step promotes exact matches and keeps the rest of the make visible below,
   honestly labelled, and a year never excludes an article that states no years.
   After this change those cars return 48 and 101.

   `scripts/check-finder.mts` comes with it and exits non-zero if any test car
   returns an empty shelf. Run it after any change to `finder.ts` or
   `scripts/taxonomy.mjs`.

   Wire it into the backup shop's own design — its hero, its components, its
   nav. Do not bring `/winkel`'s pages, CSS or layout across.

   **(b) The `accessoires` reclassification, inside `finder.ts`.** The backup
   shop's `/webshop/catalogus` currently sells `Accessoire (DRS3050)` — a bag of
   100 zip-lock pouches — for €15,95, with the supplier's German promo banner as
   its photo. That is not a one-off. All 312 public `accessoires` were checked:
   84 are soldering adapters for key programmers (XDMP/XDNP), 16 are packs of
   100–200, 191 carry no name beyond "Accessoire (CODE)", and the remaining 41
   are clamps for key-cutting machines and VVDI/OBDSTAR kits. **Not one is a
   consumer article.** `finder.ts` classes the category as trade-only, i.e.
   hidden from the storefront. It also moves `printplaten` to the
   needs-programming group, because a replacement PCB carries the key's chip
   identity — fitting one and programming one are the same job.

   **(c) `housingTitle()` in `scripts/product-copy.mjs`, and its call site in
   `scripts/build-catalog.mjs`.** 123 of 440 housings were still named
   "Aftermarket Flip Key Remote Fob Case for VW Seat Skoda 3 buttons" — English,
   in the category the shop leads with, against Dutch queries. They come from
   the AccessFobs import, which passed `item.title` through unchanged. The
   function composes a Dutch name from the fields already in the feed, in the
   same shape `dutchTitle()` uses for A-Key. It takes 123 down to 1.

   **Do NOT port** `/winkel`'s pages, its `src/lib/cart.ts`, its
   `/api/checkout`, its `AddToCart`, or its service copy. The backup shop's
   equivalents are better:
   - its `/api/checkout` already re-prices every line server-side from the
     catalogue, which is the thing that matters;
   - `src/lib/services.ts` models the work properly as four options with
     surcharges — `product_only`, `cut_only` (€19,95), `send_in` (€29,95),
     `mobile_tech` (€169) — and records what each one needs from the customer
     (kenteken, old key). `/winkel` just refused to sell keys. This is better.
   - its product page already renders `descriptionNl` as HTML via
     `dangerouslySetInnerHTML`, with a comment explaining why.

**4. Fix what is actually broken in the backup shop.** Verify each before you
fix it — these were seen in a rendered page, not read off the code:

   - **Supplier promo images.** Product photos are A-Key's own German marketing
     banners with their logo and *their* prices burned in ("SONDERANGEBOT
     ZUSAMMEN NUR €4,50"). This is the "scraped third-party product content"
     that commit `5acebbb8` blames for the traffic collapse, and it is a
     licensing question as much as an SEO one. There is already
     `scripts/flag-watermarked-photos.mjs` and `src/data/watermark-flags.json`;
     find out why these got through. **Report what you find before changing
     anything here — do not mass-delete images.**
   - **Star ratings on the product page** with no verified review behind them.
     `supabase/migrations/0002_orders.sql` says "The shop shipped fabricated
     reviews once" and there is a branch `fix/remove-fabricated-reviews`. Check
     whether what renders today is real. A rating with nothing behind it is both
     a trust problem and, under EU rules on consumer reviews, a legal one.
   - **German text under Dutch headings.** The product page prints the
     supplier's raw `vehiclesRaw` verbatim: "folgende Fahrzeuge: Duster, Logan,
     Fluence, Clio, Opel Vivaro, Opel Master u.a." Honest, but German.
   - **123 housings have no buying price**, so they cannot be bought at all.
     They are AccessFobs articles priced in pounds with no cost to us. Either
     get trade prices from me or unpublish them — a quarter of the lead
     category that cannot be bought is a bad first impression. Ask me.
   - **67% of sellable slugs are German**
     (`funkschluessel-gehaeuse-kompatibel-fuer-mazda-marc103`). Bad for Dutch
     search, and it reads like a reseller. **Now is the cheapest moment to fix
     it**: nothing is indexed on the new domain, so there is nothing to
     redirect. After launch it costs a redirect map. Propose a slug scheme and
     ask me before doing it.

**5. Security, before any link is shared.** These are from a review in
`REVIEW-2026-10.md` on `claude/vibrant-hypatia-8upt86` — read §1 of it. The two
that touch this task:

   - The backup branch is 717 commits behind on dependencies. `next@16.2.4` on
     it carries a **critical** advisory including a Middleware/Proxy bypass, and
     `proxy.ts` is what gates the CRM. `sharp` has four libvips CVEs and sits
     behind an unauthenticated upload route. Upgrade to `next@16.4.0` (not a
     major) and `sharp@^0.35.5`, and move `sharp` from `devDependencies` to
     `dependencies` — it is imported by `src/app/api/upload/route.ts`, a
     production route.
   - **Do not add a CSP-less checkout.** The app sets `X-Frame-Options`,
     `nosniff`, HSTS and a tight `Permissions-Policy`, but **no
     Content-Security-Policy**. For a page that redirects to a payment
     provider, PCI-DSS 4.0 requirements 6.4.3 and 11.6.1 (mandatory since 31
     March 2025) ask for script management and change detection. Add a CSP in
     report-only first. Say so if you cannot.

**6. Verify, and be honest about what you could not.**

```bash
npm ci
npm run catalog                  # rebuilds src/lib/catalog.json (gitignored)
node scripts/audit-catalog.mjs   # must print "No failures"
npx tsx scripts/check-finder.mts # must print "No empty shelves"
npx tsc --noEmit
npm run build
npm audit
```

Then actually run it: `npm run start`, and walk the shop in a browser —
Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` with
Playwright, or just curl the routes. Check at phone width. Check the finder
against a Mercedes C-Klasse 2016 and a VW Golf 2012.

**You will not be able to test payment or orders** unless I have given you
`MOLLIE_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Say so plainly rather than
implying the checkout works. No order has ever been written by this code and no
payment has ever gone through it.

### How to work

- Commit in Dutch, in the style already in this repository's log: say what
  changed and *why it was wrong before*, not what files you touched.
- Small commits. Build and typecheck before each one.
- `AGENTS.md`, `CLAUDE.md` and the rules in `HANDOFF.md` §5 apply — especially:
  a server route must never import from a `'use client'` module; inline styles
  cannot carry media queries; menus and filters use CSS checkbox + real
  `<a href>` so they work before hydration; **never invent prices, stock,
  EAN/GTIN, BTW numbers or reviews**.
- If you find that something in this prompt is wrong, say so and stop. It was
  written from one session's reading of the code and it can be out of date.

### Ask me, don't guess

1. The shop's domain.
2. AccessFobs trade prices, or permission to unpublish those 123 housings.
3. Whether we have the right to serve A-Key's product images.
4. The slug scheme, before any bulk rename.
5. `MOLLIE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SHOP_DOMAIN` — I will set
   them; do not look for them and do not commit them.

═══════════════════════════════════════════════════════════════════════════

## §A — What I need from you

Nothing below blocks the branch being made and the port being done. They block
it going live.

| # | What | Why it blocks |
|---|---|---|
| 1 | **A domain.** Registered, DNS pointable. | Canonicals, OG tags, sitemap and the Mollie redirect URL all need a host. Everything else can be built with it unset. |
| 2 | **Mollie API key** (test first, then live) | Nothing in either shop has ever taken a real payment. Until a test order goes through, the checkout is correct-by-construction and unproven. |
| 3 | **Supabase service-role key — rotated.** | `HANDOFF.md` §7 says the current one was pasted into a chat. It bypasses every RLS policy you have. Rotate it before it is used anywhere new. |
| 4 | **A decision on A-Key's images.** Do we have the right to serve their photos, logo and promo banners? | This is the content that got the shop noindexed. On a new domain it is a fresh start — or a repeat. |
| 5 | **AccessFobs trade prices**, or "unpublish them" | 123 of 440 housings currently cannot be bought at all. |
| 6 | **GTINs from A-Key.** Ask for their EAN column. | 0 of 3,627 articles have one. Without them a Google Shopping feed runs on `brand` + `mpn` only and reach is cut. |
| 7 | **Confirm the service prices** in `src/lib/services.ts` | The file says "PRICES TO CONFIRM WITH THE OFFICE". €19,95 / €29,95 / €169 are placeholders someone chose. |
| 8 | **A returns address and process** | 14 days' withdrawal is statutory for Dutch consumers. The copy says it; nothing implements it. |
| 9 | **Rotate the CRM password** for `info@autosleutel24.nl` | Its literal value was written into a doc while this repo was public. Not shop-specific, but it is on the same deploy. |
| 10 | **Purge the PII from git history** | 24 plaintext customer phone numbers are still readable at commit `6533e9f` in a repo that was public. Needs `git filter-repo`, a force-push and a GitHub support ticket — and a written GDPR Art. 33 note. Only you can do this. |

If you want the fastest path to something you can click: **1 and 2** alone get
you a working test shop on a real domain.

## §B — Templates

Honest first: **you do not need a template.** Your existing shop is further
along than most of what is on sale — it has a mega-menu, fitment widget,
account, wishlist, a four-option service model and a server-repriced checkout.
Dropping a template on top means rebuilding all of that. Use templates for
*patterns* instead.

**If you want a reference for the car-parts pattern specifically** — this is
the useful category, not generic ecommerce:

- [Inchoo — Year-Make-Model and parts diagrams](https://inchoo.net/ecommerce/year-make-model-fitment-parts-diagrams-automotive-ecommerce/) and their
  [automotive parts design challenges](https://inchoo.net/ux-ui-design/automotive-parts-website-design-challenges/) — the best non-vendor writing I found on this. Worth reading before you change the finder.
- [X-Cart — 9 best Year/Make/Model search tools compared](https://www.x-cart.com/blog/best-ymm-search-tools.html) and [Spark Shipping — best Shopify fitment apps](https://www.sparkshipping.com/blog/the-best-shopify-fitment-apps-for-shopify-year-make-and-model-data) — vendor marketing, but they show the UI conventions buyers already know.

Two things in that reading match what was built and are worth keeping:
one merchant found **Make → Model → Year matched how shoppers actually search**
(not Year first), and **universal parts need a flag so they stay visible** when
a vehicle is selected — which is exactly what the "rest of the make" group does.

**If you want a storefront codebase to borrow layout from** (all Next.js, check
the licence yourself before copying anything):

| Template | Licence | Worth it for |
|---|---|---|
| [Vercel Next.js Commerce](https://github.com/vercel/commerce) | MIT | The most-copied Next.js storefront. Needs Shopify to run, but the layout and cart patterns read well on their own. |
| [Medusa DTC Starter](https://github.com/medusajs/medusa) | MIT | Storefront + admin + backend in one monorepo. Closest to a full system. |
| [Vendure Next.js Starter](https://github.com/vendure-ecommerce/storefront-remix-starter) | MIT | Self-hosted Node backend, actively maintained. |
| [Payload ecommerce template](https://github.com/payloadcms/payload) | MIT | Good admin. Payload still labels the ecommerce template beta. |
| [shadcn/ui commerce blocks](https://ui.shadcn.com/) | MIT | Components, not a store. The pragmatic option if you only want nicer building blocks. |

Saleor's storefront is also strong but ships under FSL-1.1-ALv2 —
source-available, not open source. Read it before you build a business on it.

**My recommendation:** keep your design, read the Inchoo pieces, and spend the
money on photography instead of a template. Your single biggest visual problem
is not layout — it is that your product images are another company's German
advertisements.

## §C — Already checked, don't pay for it twice

Measured on `claude/vibrant-hypatia-8upt86`, 9 Oct 2026:

- Catalogue: 3,627 articles · 2,108 public · 1,519 trade-gated. 3,626 have a
  photo, 3,500 a price, 0 have a GTIN, 1,984 have a supplier article code.
- Fitment: 1,272 of 2,108 public articles name a make, **416 name a model, 214
  carry year ranges**. 836 have neither — mostly batteries and universal
  remotes, which genuinely fit many cars.
- After the reclassification: **1,010 sellable** (885 priced), 709 shown but
  routed to a technician, 389 hidden as trade.
- Škoda is spelled **Škoda** in the catalogue and has 35 articles. (An earlier
  draft of `REVIEW-2026-10.md` claims it has 0 — that was a search for plain
  "Skoda". The claim is wrong; ignore it.)
- `npm audit` on the current branch after the upgrade: 0 critical, 10 high — 8
  of those sit under `eslint` and never run in production. The two that matter
  are `xlsx` (no npm fix; the patched SheetJS is on their own CDN) and `undici`
  (a WebSocket DoS, and nothing here opens a WebSocket).
- RLS is complete: all 46 tables, 98 policies, role read from the JWT.
