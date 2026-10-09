# Expansion plan — Belgium & Germany

Status: **plan only, nothing built yet.** Written after reading the actual
codebase, not from a template. Every claim below names the file it came from.

---

## 1. What we already have (the good news)

The NL site is in far better shape for this than a typical expansion target.

| Fact | Where | Why it matters |
|---|---|---|
| `City` type **already** declares `country: "NL" \| "BE" \| "DE"` and `lang: "NL" \| "FR" \| "VL"` | `src/config/cities.ts:17-18` | The data model was designed for this. No migration needed. |
| 237 uses of `SITE_CONFIG.domain`, only 22 hardcoded `autosleutel24.nl` strings | `src/config/site.config.ts` + grep | Domain is already centralised. A multi-domain build is a config change, not a rewrite. |
| 75 cities, all `country:"NL"` | `src/config/cities.ts` | Clean slate for BE/DE rows — same shape, same page template. |
| `SERVICE_REGIONS`, sitemap, robots, `LocalBusinessSchema`, `ServiceSchema`, `ArticleSchema`, FAQ schema, `llms.txt`, image sitemap, geojson service area | `src/app/sitemap.ts`, `src/components/Schema/*`, `src/app/llms*.txt` | The entire SEO machine is built and proven. We re-point it, not rebuild it. |
| The CRM network already treats a country as a first-class unit | `src/app/admin/netwerk/layout.tsx:11` — *"A server is a country: Nederland, Duitsland, België"* | Ops side already anticipated this. Monteurs read all three channels. |
| `Address.country` defaults to `"NL"` but exists | `prisma/schema.prisma:196` | Orders/addresses are country-aware already. |

**Conclusion: the machinery is ~80% reusable. The work is content, legal, and
local presence — not code.**

---

## 2. The one thing I have to push back on

> "same page just the cities will change"

This is **true for Belgium-Flanders and false for Germany.**

- **Flanders (BE-NL)** really is close to a city swap. Dutch copy works with
  terminology corrections (see §5). This is the cheap, fast win.
- **Wallonia + Brussels (BE-FR)** needs a full French translation.
- **Germany** needs a full German translation. The public-facing copy surface is
  roughly **22,400 lines**: `src/app` routes 10,263 + `src/components` 6,087 +
  `src/config` content 6,083 (including `blog_content.tsx`, 2,352 lines of
  long-form Dutch articles). Prices, FAQs, service descriptions, blog, meta
  templates — all Dutch prose embedded in TSX.
- **Good news on scope:** `src/app/admin` is 23,821 lines and needs **zero**
  translation. Monteurs and office work in Dutch; the network layout comment
  already confirms all monteurs read all three country channels. That cuts the
  translation surface by more than half versus "translate the app".

So: Belgium ships fast. Germany is a real project. Phasing below reflects that.

## 3. The other thing I have to push back on: "rank 1 very fast"

I can build the site in this session. I cannot make it rank, and neither can any
amount of code — and **this repo already documents why**, in your own words:

> `src/config/thinPages.ts` — *"A page for a town the van does not drive to is
> the textbook doorway page, and it dilutes the cities that do earn clicks."*
> Nine NL cities beyond the 75 km radius earned **zero impressions** and were
> noindexed for exactly this reason.

And `src/app/steden/[citySlug]/[slug]/page.tsx` permanently redirects the old
city×brand and city×service combinations — you already learned that
combinatorial local pages don't work.

If we launch 200 German city pages with no technician in Germany, we rebuild the
exact mistake `thinPages.ts` was written to clean up — at 10× scale, on a fresh
domain with no authority to absorb it.

**What actually controls local ranking in DE/BE:**
1. A verified **Google Business Profile** per country with a local address and
   phone. Without it there is no local pack, and the local pack is where
   "Autoschlüssel nachmachen Köln" converts. GBP verification needs a real
   verifiable presence — this is the hard gate, and it is not a code problem.
2. A **local phone number** (+49 / +32). A Dutch 06 number on a German page
   kills trust and GBP eligibility.
3. **Technician coverage that is real.** `findCityTechnician` →
   `arrivalWindow()` in the city page already refuses to print an arrival time
   when distance is unknown (`src/app/steden/[citySlug]/page.tsx:215-230`). On a
   German page with no German monteur, every page would honestly say nothing.
4. **Reviews in-country.** `reviewCount: '10'` today.

Realistic timeline, stated plainly: **domain + indexable site in days; first
real DE organic traffic 3–6 months; local-pack competitiveness 6–12 months**
with GBP + reviews. Paid (Google Ads) is the only "fast" channel and can run
from day one on the same pages.

I will build the fastest-ranking site that is technically possible. I will not
promise a timeline that depends on things code cannot do.

---

## 4. Recommended architecture: one repo, three builds

**Decision: separate Vercel project per domain, same repo, selected by a
`SITE_ID` env var at build time.**

Why not host-header multi-tenancy in one deployment (the obvious first idea):
`SITE_CONFIG` is a **module-level constant imported in 77 files**. Making it
request-scoped means threading a context through 77 files and 237 call sites,
and it breaks static generation — the thing that makes these pages fast and
cheap. Host-based resolution would also force `sitemap.ts` and `robots.ts`
dynamic, and all three domains would share one Vercel deployment, so a bug in
German copy could take down the Dutch site that pays for everything.

Build-time selection gives us, with almost no refactor:

```
src/config/sites/
  nl.ts   ← today's site.config.ts, unchanged
  be.ts
  de.ts
  index.ts → export const SITE_CONFIG = SITES[process.env.SITE_ID ?? 'nl']
```

- Every one of the 77 importers keeps `import { SITE_CONFIG } from '@/config/site.config'`. **Zero changes at call sites.**
- Static generation preserved.
- Each domain gets its own `sitemap.ts` / `robots.ts` output naturally.
- Each domain is its own Google Search Console property (required anyway).
- NL deploy is isolated from DE/BE deploys. NL risk ≈ 0.
- One `git push` builds all three.

`CITIES` gets filtered per build: `CITIES.filter(c => c.country === SITE.country)`.
Same for `SERVICE_REGIONS` (becomes per-country), `FAQ`, `DIENSTEN`, `BRANDS`
(brands are universal — reused as-is, translated labels only).

### Locale handling
- `src/app/layout.tsx:123` hardcodes `<html lang="nl">` → `lang={SITE.htmlLang}`.
- 119 `nl-NL` references audited and driven from config.
- `alternates.languages` in the city page currently hardcodes `'nl-NL'` and
  `'x-default'` to itself (`steden/[citySlug]/page.tsx:185-191`). Becomes a real
  cross-domain hreflang cluster: `nl-NL` → .nl, `nl-BE` → .be/nl, `fr-BE` →
  .be/fr, `de-DE` → .de, `x-default` → .nl. **Cross-domain hreflang must be
  reciprocal on all four or Google ignores it.**
- BE is the only bilingual build: `/nl/...` and `/fr/...` path prefixes.
  DE and NL stay unprefixed at the root (no reason to pay the migration cost).

### Routing / URL slugs
Dutch slugs must not survive into German. `/steden/koeln` is wrong; it must be
`/staedte/koeln`. Slug map per site, defined in config:

| NL | BE-NL | BE-FR | DE |
|---|---|---|---|
| `/steden` | `/steden` | `/fr/villes` | `/staedte` |
| `/diensten` | `/diensten` | `/fr/services` | `/leistungen` |
| `/merken` | `/merken` | `/fr/marques` | `/marken` |
| `/prijzen` | `/prijzen` | `/fr/tarifs` | `/preise` |
| `/contact` | `/contact` | `/fr/contact` | `/kontakt` |
| `/veelgestelde-vragen` | idem | `/fr/faq` | `/haeufige-fragen` |
| `/autosleutel-kwijt` | idem | `/fr/cle-voiture-perdue` | `/autoschluessel-verloren` |

---

## 5. Keyword & content strategy per market

**I will not invent search volumes.** `cities.ts` carries a real `nlSearches`
field per city, sourced from Search Console/SEMrush. I have no DE/BE data and
will not fill that field with numbers I made up — a fabricated volume would
drive the P1/P2 priority decisions and the whole city roster. See §8 for what I
need. Until then, DE/BE cities get `nlSearches: 0` and priority from population
and competitive logic, explicitly marked as provisional.

What I *can* give with confidence is the keyword **structure** — the head terms
in each language, which is what the page templates and meta hang off:

### Germany (de-DE)
| Intent | Head term | Notes |
|---|---|---|
| Duplicate | `Autoschlüssel nachmachen` | primary money term |
| Duplicate alt | `Autoschlüssel nachmachen lassen`, `Ersatzschlüssel Auto` | |
| Lost | `Autoschlüssel verloren` | highest-urgency, highest-converting |
| Lost (all keys) | `Autoschlüssel verloren alle Schlüssel` | |
| Programming | `Autoschlüssel programmieren`, `Transponder anlernen` | |
| Smart key | `Keyless Go Schlüssel nachmachen`, `Funkschlüssel` | |
| Locked out | `Auto aufschließen Notdienst`, `Auto öffnen ohne Schlüssel` | |
| Trade term | `Schlüsseldienst Auto`, `mobiler Autoschlüsseldienst` | |
| Ignition | `Zündschloss reparieren` | |
| Cost | `Autoschlüssel nachmachen Kosten` | top-of-funnel, feeds the price page |

**Critical market note:** "Schlüsseldienst" in Germany is a scam-plagued
category with heavy consumer-protection press coverage. German searchers screen
hard for: a fixed price *before* arrival, gross prices incl. MwSt, an Impressum,
a real address, TÜV/handwerk-style credibility signals. Our existing
"prijs vooraf" positioning is exactly right for this market — it is a
differentiator in DE in a way it isn't in NL. Lead with it.

### Belgium — Flanders (nl-BE)
Dutch copy reused, with Belgian terminology corrections. Flemish searchers use
different words and a Netherlands-Dutch page reads as foreign:
- `nummerplaat` not `kenteken` (this matters — we have a whole
  `/autosleutel-bestellen-op-kenteken` page and a `KentekenForm` component)
- `inschrijvingsbewijs` not `kentekenbewijs`
- `BTW-nummer` + `ondernemingsnummer` not `KvK`
- `GSM` commonly used for mobile
- `autosleutel bijmaken` works; `autosleutel namaken` also used
- Prices: BE VAT is **21%**, NL is 21% too — same, but see §6 on display.

### Belgium — Wallonia/Brussels (fr-BE)
`clé de voiture`, `double de clé de voiture`, `clé de voiture perdue`,
`reprogrammation clé`, `serrurier automobile`, `ouverture de voiture`.
Brussels is bilingual and must be served by both language versions.

### City rosters (provisional, pending real volume data)
- **BE**: Antwerpen, Gent, Brussel/Bruxelles, Charleroi, Liège, Brugge, Namur,
  Leuven, Mons, Aalst, Mechelen, Hasselt, Kortrijk, Oostende, Genk, Sint-Niklaas,
  Turnhout, Roeselare, Dendermonde, Beringen. Antwerpen/Gent/Brussel/Hasselt/
  Turnhout are plausible day-one coverage from a Dutch base (Antwerpen is ~160 km
  from Bussum — further than Maastricht, which we noindexed). **This is the
  coverage question, not a content question.**
- **DE**: the NRW cluster first — Köln, Düsseldorf, Duisburg, Essen, Dortmund,
  Mönchengladbach, Krefeld, Aachen, Wuppertal, Bochum — because it is the
  densest car market in Europe *and* the closest to the existing base. Berlin,
  Hamburg, München, Frankfurt only once there is a technician there.

**Hard rule, inherited from `thinPages.ts`: a city page ships indexable only
where a technician actually drives. Everything else is `noindex, follow` from
day one** — reachable, linked, ready to flip with one line when coverage
arrives. This is the single highest-leverage SEO decision in the whole plan.

---

## 6. Legal & compliance — blocking, and mostly Germany

These are launch-blockers, not nice-to-haves. A German site missing these is
exposed to `Abmahnung` (competitor cease-and-desist letters are an industry in
Germany) and gets its Google Ads account suspended.

### Germany
1. **Impressum** — mandatory under §5 DDG (successor to §5 TMG). Needs: legal
   name, legal form, address, phone, email, Handelsregister + HRB number if
   applicable, USt-IdNr., and a named person responsible. Must be reachable in
   two clicks from every page. **We have no `/impressum` route.**
2. **Gross prices incl. MwSt — not optional.** `site.config.ts:56` ships
   `exVatDisclaimer: 'excl. btw'`, rendered on at least four pages
   (`/prijzen`, `/regio/[regio]:211`, `/autosleutel-laten-maken:188`,
   `/autosleutel-kopieren:186`). B2C prices in Germany must be shown **gross,
   incl. 19% MwSt**, under the Preisangabenverordnung. Shipping an "excl. btw"
   price to German consumers is a textbook Abmahnung. The DE config needs a
   gross price table — not the NL numbers with a different label.
3. **Widerrufsrecht** (14-day withdrawal) + the service exception: for urgent
   on-site work the customer must expressly request immediate performance and
   acknowledge loss of the withdrawal right. This is a form/flow change in the
   lead funnel, not just a legal page.
4. **Datenschutzerklärung** — German-specific, and stricter in practice than the
   Dutch `/privacybeleid`. Consent banner (`src/components/ConsentBanner`) must
   be audited for TTDSG: no non-essential scripts before consent.
5. **VAT registration**: either a German USt-IdNr. or OSS, depending on whether
   on-site services make us locally established. **Accountant question, not mine.**
6. `site.config.ts` currently carries a **placeholder KvK-derived BTW number and
   a placeholder IBAN** — the file's own comments flag both as "VERIFY BEFORE
   INVOICING". These must not propagate into a second and third country.

### Belgium
1. **Ondernemingsnummer (KBO/BCE)** + Belgian BTW/TVA number on every page footer.
2. Legal pages in **both** NL and FR for a `.be` domain serving both regions.
3. Belgian consumer law: 14-day withdrawal, same urgent-service exception logic.
4. B2C prices shown incl. BTW (21%).

### Both
- Payments: `LocalBusinessSchema.tsx:95` lists `iDEAL` and the CRM payment panel
  is iDEAL-first (`admin/jobs/[id]/PaymentPanel.tsx`). **BE needs Bancontact**
  (~60%+ of Belgian online payments), **DE needs PayPal / SEPA / card** — Germans
  have no iDEAL and low card usage. Mollie supports all of these, so this is
  configuration + schema `paymentAccepted` per country, plus new options in the
  monteur's payment panel.

---

## 7. Technical findings that will bite us (found in the code)

| # | Finding | File | Fix |
|---|---|---|---|
| 1 | **Dispatch is hard-wired to 4-digit postcodes.** `parseWerkgebied` drops anything not matching `/^\d{4}(-\d{4})?$/`; `coversPostcode` compares 4-digit integers. | `src/lib/crmJobs.ts:77-101` | **BE is fine (4-digit). German postcodes are 5-digit — every German werkgebied range would be silently dropped and no German job would ever route.** Needs country-aware parsing + a `country` column on technician werkgebied. This is the #1 functional blocker for DE. |
| 2 | `City.postcode` doc-comment assumes Dutch ranges | `src/config/cities.ts:5-13` | Same change as #1. |
| 3 | `<html lang="nl">` hardcoded | `src/app/layout.tsx:123` | from config |
| 4 | hreflang self-references only `nl-NL` + `x-default` | `steden/[citySlug]/page.tsx:185-191` | real reciprocal cross-domain cluster |
| 5 | `geo.region: 'NL'`, `geo.placename: '…, Nederland'` hardcoded in city meta | `steden/[citySlug]/page.tsx:199-203` | from config |
| 6 | `LocalBusinessSchema`: `areaServed: 'NL'`, Dutch `description`, NL-only `availableLanguage`, Dutch provinces in `areaServed`, `addressCountry` from NL config, `hasMap` → Dutch My Maps | `src/components/Schema/LocalBusinessSchema.tsx` | per-country schema config; **each country needs its own `BIZ_ID`** or the three sites claim to be one business |
| 7 | 22 hardcoded `autosleutel24.nl` strings | across 17 files | route through `SITE_CONFIG.domain` |
| 8 | `BLOCKED_COUNTRIES = {PL, IN}` blocks by Vercel geo on **all** pages | `src/proxy.ts:29` | harmless for DE/BE, but confirm no German/Belgian traffic is caught by proxy rules; the crawler allowlist already protects Googlebot |
| 9 | `serviceArea` = 75 km radius around Bussum | `site.config.ts` | per-country centre + radius, or the German pages claim coverage from the Netherlands |
| 10 | `reviewCount: '10'`, `rating: '5.0'` | `site.config.ts` | **must not be reused on DE/BE.** Reusing Dutch review counts in another country's schema is a structured-data violation and risks a manual action. Each country starts at zero and earns its own. |
| 11 | **Next.js 16.2.4** — middleware is `src/proxy.ts`, not `middleware.ts`; this version is newer than my training data | `package.json`, `AGENTS.md` | Per `AGENTS.md` I must read `node_modules/next/dist/docs/` before writing routing/i18n code. **`node_modules` is not installed in this container — `npm install` first.** |
| 12 | `prebuild` runs `scripts/build-catalog.mjs` | `package.json` | verify it is country-agnostic before three builds run it |

---

## 8. Phasing — what ships when

### Phase 0 — foundation (no public change, safe to merge)
`src/config/sites/{nl,be,de}.ts` + `SITE_ID` switch; `CITIES` filtered by
country; `lang` from config; all 22 hardcoded domains routed through config;
per-country `BIZ_ID`, `areaServed`, `paymentAccepted`; country-aware postcode
parsing (finding #1). **NL output byte-identical — verified by diffing the
built sitemap before and after.** This is the only phase with any risk to the
site that currently pays the bills, and it is designed to have none.

### Phase 1 — Belgium / Flanders (`autosleutel24.be`, `/nl`)
Cheapest real revenue. Dutch copy + Flemish terminology pass, BE city rows,
Bancontact, Belgian legal pages, `/nl` + reciprocal hreflang. **Indexable only
for cities with real coverage; the rest `noindex, follow`.**

### Phase 2 — Belgium / Wallonia (`/fr`)
French translation of the core funnel only — home, 3 service pages, prices,
contact, FAQ, covered cities. **Not** the 2,352-line blog. Brussels served
bilingually.

### Phase 3 — Germany (`autoschluessel24.de` or similar)
German slug map, full translation of the core funnel, **gross MwSt price
table**, Impressum + Widerrufsrecht + Datenschutz, DE payment methods, NRW city
cluster, 5-digit postcode dispatch live, GBP application, Google Ads from day one
(the only fast channel).

### Phase 4 — depth
German blog/kennisbank translation, brand pages per market, review acquisition,
flip `noindex` cities as coverage grows.

**Honest estimate:** Phase 0+1 is one focused working session. Phase 3 is not a
10-minute job at any level of engineering skill — German legal copy and a gross
price table are decisions about your business, and I should not invent either.

---

## 9. What I need from you

Blocking — I cannot build correctly without these:

1. **Domains.** Are `autosleutel24.be` and a German domain registered? German
   has an umlaut problem: `autoschlüssel24.de` only works as punycode and is bad
   for links and ads — recommend **`autoschluessel24.de`** (the standard German
   "ue" transliteration). Tell me what you own or can register.
2. **Germany: do you have, or can you get, a German address + phone + GBP?**
   This single answer decides whether Phase 3 is a real local business or a
   doorway site. If the answer is "not yet", I will build it ad-ready and
   `noindex` on the city pages until it is — that is the correct call, not a
   limitation.
3. **Belgium: same question** — Belgian phone (+32), and does a monteur actually
   drive to Antwerpen/Gent/Brussel today? If not, which cities, and from where?
4. **German gross price table.** NL `transponder: 125` excl. btw. What are the
   German consumer prices **incl. 19% MwSt**? Do not let me guess — German
   price display is legally constrained and a wrong number is an Abmahnung.
5. **Belgian prices incl. 21% BTW.** Same as NL, or different?
6. **Legal identities:** Belgian ondernemingsnummer + BTW number; German legal
   form, address, Handelsregister/HRB, USt-IdNr., and the responsible person for
   the Impressum. Also: the current `kvk`/`btw`/`iban` in `site.config.ts` are
   flagged in the code as placeholders — give me the real NL ones too so the
   bug doesn't get copied three times.
7. **Real keyword volumes for DE and BE.** A Keyword Planner or Ahrefs export
   (city + term + volume, CSV) so `nlSearches` and the P1/P2/P3 priorities are
   data, not my guess. Do you have Ahrefs/SEMrush access?
8. **Target city lists** — or confirm you want my provisional rosters in §5.

Non-blocking but valuable:
9. Existing German/French copy, if any (website, flyers, ad copy) — gives me
   your voice instead of a translator's.
10. Mollie account: can it enable Bancontact and German methods, or is a second
    account needed per country?
11. Who is reviewing the German copy? **I will produce native-quality German,
    but a native speaker who knows the trade should sign off on the legal pages
    and the price page before they go live.**

---

## 10. First decision I need from you

**One repo + three Vercel builds via `SITE_ID`** (§4) — confirm, and I start on
Phase 0, which touches NL only in ways that are provably invisible.

And tell me the Phase 1 answer to question 3, because that decides whether
Belgium launches with 5 indexable cities or 20.
