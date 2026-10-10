# Handover — autoschluessel24.de

**For whoever (human or Claude session) picks this up next.**
Last updated: 10 October 2026. Branch: `claude/modest-einstein-tjdil5`.

---

## 1. Where everything is

| What | Where |
|---|---|
| Repository | `https://github.com/czterypokoje-lgtm/autoslutel` |
| Branch with this work | `claude/modest-einstein-tjdil5` |
| The German site | the `de/` folder — a **separate Next.js app** |
| The Dutch site (do not touch) | `src/` in the repository root |
| What the office still has to deliver | `de/README.md`, section "Checkliste vor dem Livegang" |
| Keyword research behind the German wording | `de/src/config/keywords.ts` |
| Everything that can only be filled in by the owner | `de/src/config/site.config.ts` |

The German app shares **no files** with the Dutch one: its own `package.json`,
its own config, its own components. That separation is deliberate (the reason
is written down at the top of `de/README.md`). Nothing in `de/` may import from
`../src`, and the Dutch app must not be modified.

## 2. Running it locally

Needs Node 20+. No `.env`, no credentials, no database.

```bash
git clone https://github.com/czterypokoje-lgtm/autoslutel.git
cd autoslutel
git checkout claude/modest-einstein-tjdil5
cd de
npm install
npm run dev          # → http://localhost:3001
```

`npm run dev` runs even though the phone number and prices are still missing:
development mode counts as preview mode. A black band at the top of every page
lists the missing fields and every page is on `noindex`.

`npm run build` **refuses** while any `TBD` field remains — that is the build
that goes to Vercel, and it is the thing that says no. To look at a production
build anyway:

```bash
AUTOSCHLUESSEL_ALLOW_PLACEHOLDERS=1 npm run build && npm start
```

## 3. State of the work

Done and pushed (18 commits, `c202f01` … `cd0fedd`):

- All 51 pages translated to German. Verified by loading all 46 reachable
  routes in a real browser and testing the visible text against Dutch
  spelling (`ij`, `aa`, `uu`, `oe`, `ouw`) and Dutch vocabulary: **zero hits**.
  No page errors, no JavaScript errors, `tsc --noEmit` clean, build green.
- German legal pages written for German law: Impressum (§5 DDG), AGB with
  Widerrufsbelehrung (§312g BGB with the §356 Abs. 4 BGB urgent-service
  exception), Datenschutzerklärung (DSGVO), Cookie-Richtlinie (§25 TDDDG),
  19 % MwSt, 10-year retention (§147 AO / §257 HGB, not the Dutch 7).
- Fail-closed configuration: every value only the owner can supply is `TBD`
  or `null`, and the production build stops and names the missing fields.

**Not translated, deliberately:** the blog, the Kennisbank and the ~600 brand
pages (`/marken`). That is why `BrandCard` is a `<div>` and not a `<Link>`,
and why `BLOG_POSTS`, `DEEP_DIVE` and `GHOST_ARTICLE` are empty rather than
Dutch. The CRM was not duplicated either — partners from all countries work in
one system (`../src/app/admin`) with the language set per person, not per
build.

**There is no licence-plate lookup and there cannot be one:** the
Kraftfahrt-Bundesamt does not release vehicle data to third parties. Where the
Dutch site resolves a plate through the RDW, the German one asks for make and
year instead.

## 4. What is still open

### 4.1 Only the owner can supply this (blocks launch)

The full list with reasons is in `de/README.md`. In short, in
`de/src/config/site.config.ts`:

1. `phone`, `phoneTel`, `whatsapp`, `email` — a German number.
2. `logo.header`, `logo.footer` — **a German logo**. The two files that came
   with the copy had German filenames but the pixels said "Autosleutel24.nl",
   so they were deleted; the header currently shows the name as styled text.
3. Impressum under §5 DDG: `legalForm`, `address.*`, `hrb`, `registerCourt`,
   `ustId`, and `responsible` under §18 Abs. 2 MStV.
4. `prices.*` — **gross, including 19 % MwSt** (Preisangabenverordnung).
   Either the gross prices, or the margin plus the four partners' rate cards.
5. `formspreeId` — the e-mail notification for enquiries. Leads already arrive
   through `/api/leads`; this is only the notification on top.
6. `tracking.*` — own GTM, GA4, Google Ads, Bing UET, Clarity, IndexNow key,
   and an own Search Console property.
7. `social.google` — the German Google Business Profile.
8. `src/config/myMaps.ts` — an own German My Maps map. While it is `null`
   there is no map **and no map column** (the section falls back to the four
   region cards at full width).
9. `GOOGLE_MAPS_API_KEY` in the environment, for the static service-area map.

### 4.2 Needs a lawyer

AGB (above all the Widerrufsbelehrung), Datenschutzerklärung, and two open
questions that affect the partner model itself: **Scheinselbständigkeit**
(Deutsche Rentenversicherung can claim up to four years of back contributions)
and whether the work falls under **Handwerksordnung Anlage A**.

### 4.3 Needs the four partners

- Which motorcycle brands they can actually program on the spot, and whether
  the per-brand notes on `/motorradschluessel-nachmachen` match practice.
- Whether **Berkan Acarol** (named as founder on the home page and
  `/ueber-uns`) is also behind the German operation. If not, the person named
  there should be the one who is responsible under §18 Abs. 2 MStV.

### 4.4 Before deploying

`supabase/migrations/0073_technician_country_and_locale.sql` must be run.
Deployment is a **separate Vercel project with Root Directory = `de`**, domain
`autoschluessel24.de`, and its own Search Console property.

### 4.5 Deferred work, if it is ever wanted

Blog, Kennisbank, the ~600 brand pages, a German CRM surface, and the Belgian
site (domain and partners not arranged).

### 4.6 Measurement gap

`de/src/config/keywords.ts` records German search terms per service with the
reasoning behind each, but **no search volumes** — there is no Keyword Planner
or Ahrefs export for Germany yet. The ranking in that file is a reasoned
estimate and is marked as such. One export (city + term + volume) turns it
into a real ranking.

## 5. House rules for this repository

- `AGENTS.md` / `CLAUDE.md`: **this is Next.js 16.2.4** and it has breaking
  changes. Read the relevant guide in `node_modules/next/dist/docs/` before
  writing code.
- Never modify the Dutch app in `src/`. Check with
  `git diff --stat -- . ':(exclude)de/'` — it should come back empty.
- Never invent a value for a `TBD` field. A guessed price or a borrowed
  USt-IdNr. on a German site is an Abmahnung, not a provisional value.
- Do not claim a German city for a photograph taken in the Netherlands. The
  gallery alt texts and the image sitemap deliberately carry no city.
- Translation is checked by loading the pages and reading the visible text,
  not by grepping a word list. A fixed word list passed while three pages were
  still Dutch — the words simply were not on the list.
