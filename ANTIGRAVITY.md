# Brief for the next agent

Paste this as the opening message in Antigravity (or any agent) working on
this repo. It is written to be read by the agent, not by a person.

---

You are continuing a live commercial project: **autosleutel24.nl**, a Dutch
mobile car-key service with a webshop and an internal CRM. Real customers,
real money, real supplier data. Read `HANDOFF.md` in the repo root before you
touch anything — it is the state of the project and it is accurate.

## Where you are

The only real repo is `/Users/ik/Desktop/autosleutel24-repo`, branch
`integrate`, 17 commits ahead of `origin/main`, **not deployed**. A stale copy
exists at `~/.gemini/antigravity/scratch/autosleutel`; ignore it entirely.

Stack: Next.js 16 App Router · React 19 · TypeScript · Supabase · Vercel ·
Mollie. Read `AGENTS.md` — this is not the Next.js in your training data.

## How to work

**Plan before you type.** For anything larger than a one-file fix, write the
plan first: what changes, in which files, what could break, how you will know
it worked. Show it, then execute it. A plan that lists files you have not
opened is a guess, not a plan.

**Work in vertical slices.** Data → server → UI → verification, one feature at
a time, each ending in a state where the build passes and the feature is
usable. Do not leave a half-wired feature behind a flag and move on.

**Verify what you build, yourself.** "It should work" is not a result.
Minimum before you call anything done:

```bash
npx tsc --noEmit          # clean
npm run build             # clean
npx next start -p 3100 -H 0.0.0.0
```

Then actually load the page — at 375px as well, because most customers are on
a phone — and check the thing you changed does what you said. If you changed
an API route, call it with `curl` and paste the response. If you changed data,
print the counts before and after.

**Read the data before you write code about it.** This project has been
burned repeatedly by assumptions about the supplier feed. `node -e` over
`src/lib/catalog.json` costs thirty seconds and settles the question.

**One commit per coherent change**, with a message that says *why*, not what.
The diff already says what.

## Hard rules

**1. Nothing on a page may claim something we cannot show is true.**

This site had invented reviews, invented reference prices, "Top seller" badges
on 944 products, "OEM quality" seals over an aftermarket catalogue, blog posts
by people who do not exist, and a pre-ticked €6.95 warranty plan nobody sells.
All removed. Do not reintroduce any of it, in any form, for any reason —
including "placeholder for now". Two Dutch statutes this keeps meeting:
**BW 6:193c** (misleading commercial practice) and **BW 6:230j** (no
pre-ticked paid extras).

If a component needs a number you do not have, render nothing and say so in
the code comment. An empty state is a finished state.

**2. Prices, delivery terms and services live in code, not in copy.**
`src/lib/catalog.ts` and `src/lib/services.ts`. If a page states a price, it
reads it from there. Never type a euro amount into JSX.

**3. Everything that displays a product reads `src/lib/shopCatalog.ts`.**
`getShopProducts` / `getShopProductBySlug` merge the generated catalogue with
the office's overrides. Reading `catalog.json` directly shows hidden products
and stale prices — this bug has already shipped once.

**4. A server route must never import from a `'use client'` module.** The
values arrive as client references, not objects. This made every checkout
return 500. Shared constants go in a plain module — see `src/lib/services.ts`.

**5. The shop must work before hydration.** Menu and filter drawers open from
a hidden checkbox with a `<label>` handle; filter options are plain links.
This is deliberate — a phone that never finishes hydrating still has a
working shop. Do not "clean this up" into `onClick` handlers.

**6. Do not decide business facts.** Prices you were not given, a btw number,
a technician's earnings split, which carrier we ship with, whether a review is
real: ask. Guessing here produces a page that is confidently wrong, which is
worse than an unfinished one.

**7. Ask before anything irreversible.** Pushing, deploying, running
migrations against production Supabase, deleting rows, rotating keys. Prepare
it, explain it, wait.

## Definition of done

A task is done when: the plan was followed or the deviation was explained ·
typecheck and build are clean · the change was loaded and checked at 375px and
on desktop · no invented content was added · the commit message explains the
reasoning · anything still missing is stated plainly rather than left to be
discovered.

## What to build next

In this order. Each has an acceptance test — meet it, do not approximate it.

**1. Fitment for the other 809 products.**
Only 135 of 944 name the cars they fit, because A-Key stops there. Key blade
plus frequency plus transponder identifies most vehicles. Build the lookup,
combine it with the RDW data already used for kenteken lookups, and let a
customer answer "does this fit my car" from a licence plate alone.
*Done when:* entering a kenteken on a product page returns a definite yes/no
for that product, and the method behind it is written down in the code.

**2. The money path, end to end.**
The live Mollie key is the owner's to add. With it: a test order through
iDEAL, the webhook marking it paid, the confirmation e-mail arriving, the
order visible in `/admin/orders`. Then the failure paths — cancelled, expired,
webhook retried twice, stock gone between basket and checkout.
*Done when:* each of those six paths has been run and the outcome reported.

**3. Open the shop to Google.**
`/webshop` is `noindex` in `src/proxy.ts` and in the layout metadata, a hold
from when the product copy was scraped English text. That reason is gone.
*Done when:* product and category pages are indexable, every filtered URL
still is not, each page has its own canonical, and the sitemap includes them.

**4. Reviews that are real.**
Ask by e-mail some days after delivery, store the review against the order,
show it, and only then put `AggregateRating` back into the Product schema.
*Done when:* a review cannot exist in the database without an order behind it.

**5. Stock from the supplier.**
Stock is manual per product today, so almost everything reads as available.
*Done when:* a product A-Key cannot supply goes unavailable without anyone
touching the CRM.

## Questions the owner still has to answer

Do not invent these. Ask, and if the answer does not come, leave the feature
visibly unfinished rather than filled in:

- the technician earnings split (blocks self-billing in the CRM)
- €19,95 for *frezen* — a placeholder I chose, not their price
- carriers besides DHL, and a logo file for
  `public/images/carriers/dhl.svg`
- whether the margin tiers in `src/lib/catalog.ts` match the market for these
  article codes
- the btw number: the one in `site.config.ts` looks like the KvK number with
  `NL`/`B01` wrapped around it, which is not how they are issued

## First move

Read `HANDOFF.md`, then `src/lib/catalog.ts`, `src/lib/shopCatalog.ts` and
`scripts/build-catalog.mjs`. Run the build. Load the shop at 375px. Then tell
me what you found and what you plan to do about item 1 — before you write any
code.
