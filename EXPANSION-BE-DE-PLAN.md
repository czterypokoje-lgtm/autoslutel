# Expansion plan — Belgium & Germany

**v2 — revised after the business model was clarified: we are not opening a
second mobile workshop, we are replicating the network.** The leads go to local
technicians who become our branch. That changes the order of the whole project.

**v3 — Phase 0 is built, verified and pushed.** The German model and the
launch cities are now decided (§2, §8). Every claim names the file it came from.

Decided: domain `autoschluessel24.de`. Partners already on the ground in
**Berlin, Hamburg, München and Frankfurt**. Pricing: the partner names what the
job is worth to them, we add our margin and sell at that price.

---

## 1. The finding that reframes everything

**You already built this product. It is running in NL.**

| What exists | Where |
|---|---|
| Three-tier partner subscription: Starter €0/25% commission, Pro €679/18%, Premium €1,800/8%, with priority dispatch windows (0/45/90 s) | `src/lib/subscription.ts` |
| Break-even maths so each tier is cheapest *somewhere* (`bestTier`, `breakEven`) — with a written account of how a dead Pro tier was found and repriced | `src/lib/subscription.ts:10-32` |
| Offer-and-accept dispatch with four hard gates (can they do this car / do they drive there / are they free) then a score | `src/lib/dispatch.ts` |
| Telegram bid offers to technicians, 24 h window | `src/lib/offerJob.ts` |
| Per-technician rate cards, office-wide comparison + Excel export | `src/lib/technicianRates.ts` |
| Technician balance, commission settlement, payouts | `src/lib/technicianBalance.ts`, `/admin/mijn-saldo`, `/admin/kas` |
| Bidding screen, my-jobs, my-van, my-profile, marktplaats, per-country network channels | `/admin/biedingen`, `/admin/mijn-klussen`, `/admin/mijn-bus`, `/admin/netwerk/*` |
| Partner recruitment landing page | `src/app/monteur-worden/page.tsx` |
| The "what you'd have paid Google" renewal argument (`ADS_COST_PER_JOB = 85`) | `src/lib/subscription.ts` |
| Country as a first-class unit in the network | `admin/netwerk/layout.tsx:11` — *"A server is a country: Nederland, Duitsland, België"* |

So Germany and Belgium are **a replication of a working playbook**, not a new
build. That is a much stronger starting position than §1 of v1 of this plan
assumed, and it changes the sequencing below.

---

## 2. The model, now settled: resale with a margin

The partner names the price the job is worth to them. We add our margin and
that is what the customer is quoted and pays. **We contract and invoice the
consumer; the partner invoices us.**

The machinery for this already exists on the Dutch side:
`src/lib/technicianRates.ts` is *"Every technician's price list, in one place,
for the office"*, built to answer *"what does a Golf cost me, and from whom"* —
which is exactly the input a markup needs. `priceFor()` in `capability.ts`
prices a job from a partner's own coverage row.

Three consequences, and the third is the one that changes a deliverable:

1. **German VAT registration (or OSS).** We are selling a service performed in
   Germany to a German consumer, so that sale carries German VAT. The partner
   invoicing us is a separate B2B leg. **Confirm the treatment with a
   Steuerberater before the price pages go live** — I can build either shape,
   but I will not guess which one you are registering under.
2. **Scheinselbständigkeit still applies and is still manageable.** We set the
   customer price and take the payment, which is the risk profile
   `src/lib/dispatch.ts:3-9` already names for the Dutch equivalent. The
   offer-and-accept design is the defence and must survive translation: a
   German partner declines without penalty, sets their own availability, keeps
   their own customers. The partner naming their own price *helps* here.
3. **The German "ab" prices must be computed, not typed.** If the consumer
   price is the partner's price plus margin, then the cheapest achievable price
   in Berlin is a function of the Berlin rate cards — and it moves when a
   partner joins or reprices. A hand-typed constant in `de.ts` would go stale
   silently, and a stale advertised price is an Abmahnung in exactly this
   category. So `de.ts` keeps its prices at TBD and the right fix is to derive
   them from the rate cards plus a margin, the way the Dutch quote engine
   already works. **What I need is the margin, not eight numbers.**

## 3. The ranking engine you actually have: partner GBPs

This is the answer to "rank 1 very fast", and it only exists because of the
network model.

A single Dutch company cannot get a verified Google Business Profile in Köln.
But **a real technician in Köln already can — and does.** In the network model,
each recruited partner is a potential GBP in their city. That is the mechanism
that gets us into the local pack, which is where `Autoschlüssel nachmachen Köln`
actually converts.

Three options, in order of ranking power:

| Option | Local pack? | Notes |
|---|---|---|
| **A. Partner trades as "Autoschlüssel24 Köln"** at their real address, our city page as the listing's website | **Yes** | Strongest. Needs a brand licence in the partner agreement, their real address, consistent NAP, and their own or a tracked number. Franchise-style listings are legitimate when the partner genuinely trades under that name at that address. |
| B. Partner keeps their own brand, our site listed as a secondary link | Their listing ranks, not ours | Leads reach them directly and bypass our commission. Worst of both. |
| C. No GBP, organic only | No | Works for research queries (`Autoschlüssel nachmachen Kosten`), loses the urgent local ones. |

**Go with A, and build the partner agreement around it from day one.** Retrofitting
a brand licence onto twenty partners later is far harder than writing it in now.

**Consequence for sequencing: every partner recruited is a city that becomes
rankable. Partner recruitment is not a prerequisite of the SEO — it *is* the
SEO.** That inverts v1 of this plan.

---

## 4. Revised sequencing: B2B funnel first, consumer funnel second

v1 said: build consumer pages, hold them `noindex` until coverage exists. Still
true — but it buries the lede. **The first page that has to rank in Germany is
not a consumer page at all. It is the partner recruitment page.**

Why this is the right order:
- **Cheap.** `Schlüsseldienst Partner werden`, `Autoschlüssel Aufträge`,
  `mehr Aufträge als Autoschlüsseldienst` — near-zero competition against the
  consumer terms, which are among the most expensive CPCs in Germany.
- **Unblocks everything.** No partner → no coverage → no GBP → no local pack →
  no indexable city page. One partner in Köln unlocks the entire NRW cluster.
- **The pitch already exists and is good.** `subscription.ts:4-8`: *"every
  independent auto locksmith in the country is already buying leads, they just
  buy them from Google, per click, for a stranger who may be driving a car
  nobody can do. This is the same money for a booked job at an agreed price."*
  That argument is **stronger** in Germany, where Schlüsseldienst CPCs are
  brutal. `ADS_COST_PER_JOB = 85` is a conservative Dutch figure and must become
  a per-country number — the German one is higher, which makes the pitch better.
- **It's measurable fast.** A partner signup is a conversion we control, unlike
  waiting on Google to trust a new domain.

So: **`/partner-werden` (DE) and `/partner-worden` + `/fr/devenir-partenaire`
(BE) are Phase 1 deliverables, ahead of the consumer city pages.**

One concrete improvement over the NL page: `monteur-worden/page.tsx:158-172`
hardcodes the eight cities we're recruiting in (Eindhoven, Maastricht, Tilburg…).
In DE/BE that list should be **derived from live coverage gaps** — cities with
demand and no partner — so the recruitment page updates itself as the network
fills, instead of going stale the way a hand-typed list does.

---

## 5. Architecture (unchanged from v1 — this part was right)

**One repo, three Vercel builds, selected by `SITE_ID` at build time.**

```
src/config/sites/{nl,be,de}.ts  →  index.ts exports SITES[SITE_ID]
```

`SITE_CONFIG` is a module-level constant imported in **77 files** with **237
`SITE_CONFIG.domain` call sites**. Request-scoping it for host-header
multi-tenancy means touching all of them and losing static generation, and it
would put untested German copy in the same deployment as the Dutch site that
pays for everything. Build-time selection needs **zero call-site changes**,
keeps static generation, gives each domain its own sitemap/robots and GSC
property, and isolates NL risk to approximately zero.

`CITIES.filter(c => c.country === SITE.country)` per build. The `City` type
**already** declares `country: "NL"|"BE"|"DE"` and `lang: "NL"|"FR"|"VL"`
(`src/config/cities.ts:17-18`) — the data model was built for this.

### Now per-country, because of the network model
- `TIER_TERMS` (German partners earn differently; €679/month is a Dutch number)
- `ADS_COST_PER_JOB`
- `prices` — **gross incl. MwSt for DE** (see §7)
- `BIZ_ID`, `areaServed`, `paymentAccepted`, `availableLanguage`
- `serviceArea` centre + radius (a 75 km circle around Bussum is meaningless in NRW)
- `reviewCount` / `rating` — **start at zero per country.** Reusing the Dutch
  `reviewCount: '10'` in German schema is a structured-data violation and risks
  a manual action.
- Recruitment target cities — derived, not hardcoded

### Slug map
Dutch slugs must not survive into German.

| NL | BE-NL | BE-FR | DE |
|---|---|---|---|
| `/steden` | `/steden` | `/fr/villes` | `/staedte` |
| `/diensten` | `/diensten` | `/fr/services` | `/leistungen` |
| `/merken` | `/merken` | `/fr/marques` | `/marken` |
| `/prijzen` | `/prijzen` | `/fr/tarifs` | `/preise` |
| `/monteur-worden` | `/partner-worden` | `/fr/devenir-partenaire` | `/partner-werden` |
| `/autosleutel-kwijt` | idem | `/fr/cle-voiture-perdue` | `/autoschluessel-verloren` |
| `/contact` | `/contact` | `/fr/contact` | `/kontakt` |
| — | — | — | `/impressum` (**new, legally required**) |

---

## 6. Technical blockers (from the code)

| # | Finding | File | Impact under the network model |
|---|---|---|---|
| 1 | **Dispatch drops non-4-digit postcodes.** `parseWerkgebied` filters on `/^\d{4}(-\d{4})?$/`; `coversPostcode` compares 4-digit integers | `src/lib/crmJobs.ts:77-101` | **German postcodes are 5-digit. Every German partner's werkgebied would be silently discarded and no German job would ever route to anyone.** Under the network model dispatch *is* the product, so this moves from "a bug" to **critical path**. Belgium (4-digit) is unaffected. Needs country-aware parsing + a country column on werkgebied. |
| 2 | `postcodeDigits` assumes Dutch format | `src/lib/crmJobs.ts` | same |
| 3 | Payment is iDEAL-first | `admin/jobs/[id]/PaymentPanel.tsx`, `LocalBusinessSchema.tsx:95` | A German partner cannot take iDEAL — it does not exist there. **DE needs card/PayPal/SEPA, BE needs Bancontact (~60 % of Belgian online payments).** Now an operational blocker: the partner cannot get paid on site. |
| 4 | `<html lang="nl">` hardcoded | `src/app/layout.tsx:123` | from config |
| 5 | hreflang self-references `nl-NL` + `x-default` only | `steden/[citySlug]/page.tsx:185-191` | reciprocal cross-domain cluster across all four locales, or Google ignores it |
| 6 | `geo.region: 'NL'`, `geo.placename: '…, Nederland'` hardcoded | `steden/[citySlug]/page.tsx:199-203` | from config |
| 7 | `LocalBusinessSchema`: NL `areaServed`, Dutch description, Dutch provinces, Dutch My Maps, single `BIZ_ID` | `src/components/Schema/LocalBusinessSchema.tsx` | per-country `@id` or the three sites claim to be one business. Partner GBPs (§3) also need the city page's schema to agree with the listing's NAP. |
| 8 | 22 hardcoded `autosleutel24.nl` strings in 17 files | grep | route through config |
| 9 | 119 `nl-NL` references | grep | audit |
| 10 | `reviewCount: '10'`, `rating: '5.0'` | `site.config.ts` | must not cross borders |
| 11 | Placeholder `kvk` / `btw` / `iban`, flagged in the code as *"VERIFY BEFORE INVOICING"* | `site.config.ts` | **do not let this bug propagate into three countries** |
| 12 | `thinPages.ts` noindex set is hand-maintained | `src/config/thinPages.ts` | Under the network model, indexability should be **derived from live coverage** — a city gets indexed when a partner covers it. The city page already reads technicians at request time (`findCityTechnician`, `arrivalWindow`), so the page itself is ready; the sitemap needs a build-time snapshot or ISR. Design decision to make, not a blocker. |
| 13 | **Next.js 16.2.4** — middleware is `src/proxy.ts`; newer than my training data; `node_modules` not installed in this container | `package.json`, `AGENTS.md` | `npm install` and read `node_modules/next/dist/docs/` before I write routing/i18n code, per `AGENTS.md` |

**The honest `arrivalWindow` behaviour is an asset here.** `steden/[citySlug]/page.tsx:215-230`
already refuses to print an arrival time when no technician distance is known —
so a German city page with no partner says nothing rather than lying. That is
exactly the right default for a network that is still filling.

---

## 7. Legal & compliance

### Germany — launch blockers
1. **Impressum** (§5 DDG): legal name, form, address, phone, email, HRB,
   USt-IdNr., named responsible person. Two clicks from every page. No route exists today.
2. **Gross prices incl. 19 % MwSt.** `site.config.ts:56` ships
   `exVatDisclaimer: 'excl. btw'`, rendered on four pages (`/regio/[regio]:211`,
   `/autosleutel-laten-maken:188`, `/autosleutel-kopieren:186`,
   `/renault-sleutelkaart…:156`). German B2C prices must be gross under the
   Preisangabenverordnung. **A German price table is needed, not Dutch numbers
   relabelled.**
3. **Widerrufsrecht** (14 days) + the urgent-service exception: the customer must
   expressly request immediate performance and acknowledge loss of the right.
   **This is a change to the lead funnel, not just a legal page.**
4. **Datenschutzerklärung** + TTDSG consent audit of `ConsentBanner`.
5. **German VAT** — see §2. Depends on who contracts the consumer.
6. **Scheinselbständigkeit** — §2. Partner agreement, not code.
7. **Handwerksordnung — must verify, I will not guess.** Whether mobile auto-key
   work requires Handwerkskammer registration (and whether it falls in Anlage A
   as meisterpflichtig) decides who we are even allowed to recruit. **Get this
   from a German Steuerberater or the HWK before recruiting. If I had to bet I'd
   say it's not Anlage A, but a bet is not a basis for a recruitment campaign.**

### Belgium
1. Ondernemingsnummer (KBO/BCE) + Belgian BTW/TVA in the footer.
2. Legal pages in **both** NL and FR on a `.be` domain.
3. Prices incl. 21 % BTW. 14-day withdrawal + urgent-service exception.
4. **Access to the profession — verify.** Flanders dropped the
   bedrijfsbeheer requirement; Wallonia and Brussels retain access rules for
   some trades. Affects who can be a partner in Liège/Charleroi vs Antwerpen.

### Both
Partner agreement needs: brand licence (for the GBP strategy in §3), commission
and tier terms, decline-without-penalty, their own customers stay theirs,
warranty allocation (who honours the 12-month warranty we advertise), insurance,
data processing (they see customer data → GDPR processor terms).

---

## 8. Keywords

**I will not invent search volumes.** `cities.ts` carries a real `nlSearches`
per city from Search Console/SEMrush; filling DE/BE rows with numbers I made up
would silently drive the P1/P2/P3 priorities and the whole city roster. DE/BE
cities get `nlSearches: 0` and provisional priority from population and
proximity until there is an export. See §10.

### Germany — consumer (Phase 3)
`Autoschlüssel nachmachen` (head), `Autoschlüssel nachmachen lassen`,
`Ersatzschlüssel Auto`, `Autoschlüssel verloren` (highest urgency and
conversion), `Autoschlüssel verloren alle Schlüssel`,
`Autoschlüssel programmieren`, `Transponder anlernen`,
`Keyless Go Schlüssel nachmachen`, `Funkschlüssel`,
`Auto aufschließen Notdienst`, `Schlüsseldienst Auto`,
`mobiler Autoschlüsseldienst`, `Zündschloss reparieren`,
`Autoschlüssel nachmachen Kosten` (feeds the price page).

**Market note:** German Schlüsseldienst is a scam-plagued category with heavy
consumer-protection coverage. Searchers screen for a fixed price before arrival,
gross prices, an Impressum, a real address. Our existing "prijs vooraf"
positioning is a genuine differentiator there in a way it is not in NL — lead
with it, and it is also the argument that makes partners want the brand.

### Germany — partner recruitment (Phase 1, the one that matters first)
`Schlüsseldienst Partner werden`, `Autoschlüssel Aufträge`,
`Aufträge für Schlüsseldienst`, `mehr Aufträge Autoschlüsseldienst`,
`Franchise Schlüsseldienst`, `als Subunternehmer Autoschlüssel`.

### Belgium — Flanders (nl-BE)
Dutch copy reused with Flemish corrections: **`nummerplaat` not `kenteken`**
(we have a whole `/autosleutel-bestellen-op-kenteken` page and a `KentekenForm`
component built on that word), `inschrijvingsbewijs` not `kentekenbewijs`,
`ondernemingsnummer` not `KvK`, `GSM` for mobile.

### Belgium — Wallonia/Brussels (fr-BE)
`clé de voiture`, `double de clé de voiture`, `clé de voiture perdue`,
`reprogrammation clé`, `serrurier automobile`, `ouverture de voiture`.
Brussels is bilingual and must be served by both.

### City rosters — driven by partner coverage, not by population
- **DE, live in `cities.ts` as of Phase 0:** Berlin, Hamburg, München,
  Frankfurt am Main. All four `priority: "P1"` — because a partner is there,
  not because of a search volume I guessed. Köln, Düsseldorf and the rest of
  NRW go in when a partner does. The earlier draft of this plan put NRW first
  on grounds of proximity to Bussum; that is the right argument for a van and
  the wrong one for a network.
- **BE**: empty until there are Belgian partners, and that is the correct
  state rather than a gap. Candidates once there are: Antwerpen, Gent,
  Brussel/Bruxelles, Hasselt, Leuven, Mechelen, Turnhout, Brugge, Kortrijk
  (NL) + Liège, Charleroi, Namur, Mons (FR).

**Hard rule, inherited from `thinPages.ts`: a city page is indexable only where
a partner actually drives. Everything else is `noindex, follow` from day one** —
reachable, linked, one flag from going live. `thinPages.ts` documents nine NL
cities beyond the serving radius that earned **zero impressions** and diluted the
ones that earn clicks. Under the network model this rule gets *easier* to obey,
because coverage is now a database fact rather than a judgement call.

---

## 9. Phases

**Phase 0 — foundation. DONE, verified, pushed.**
- `SITE_ID` picks the country at build time; data in
  `src/config/sites/{nl,be,de}.ts`; `site.config.ts` kept as the facade so none
  of the 77 importers or 237 call sites changed.
- `assertSiteComplete()` refuses a build with any `TBD` left, naming the
  missing fields — the same fail-closed stance `src/proxy.ts` already takes for
  an unconfigured CRM. BE and DE both correctly refuse today (30 fields each).
- Country-aware postcode routing. `parseWerkgebied` kept only
  `/^\d{4}(-\d{4})?$/`, so **every German werkgebied a partner typed was
  discarded on save and no German job could ever be routed to anyone.** A
  werkgebied entry now says its own country (`DE:40000-40999` beside a bare
  `3500-3599`, which still means NL — no migration). The prefix exists because
  the numbering spaces overlap: without it `3500-3599` would take a job in
  35001 Hessen, since the first four digits of a German postcode read as a
  perfectly good Dutch one. 25 routing cases pass across three countries.
- `CITIES` is the building country's cities, `ALL_CITIES` is everything; the CRM
  reads `ALL_CITIES` so a German partner's coverage is editable from the
  Dutch-built admin.
- Four German cities in `cities.ts`.

Verified: `tsc` and `eslint` clean on the changed files (the 49 pre-existing
`blog_content.tsx` lint errors are on `main` too). Two full builds diffed
against `main`: after normalising what also differs between *two builds of
identical source* — chunk hashes, buildId, RSC stream segmentation, the
sitemap `lastmod` that falls back to build time, and the random gallery shuffle
at `ServiceLayout.tsx:85` — **all 208 build artefacts are identical.** A
throwaway filled-in `de.ts` was used to prove the German build runs: it
produces exactly four city pages, the right canonical host and a 4-entry
sitemap, and it also shows what Phase 3 still owes — `lang="nl"`, Dutch titles,
and `geo.placename` reading `"Berlin, Nederland"`.

**Phase 1 — partner recruitment, both countries at once.** `/partner-werden`
(DE) + `/partner-worden` and `/fr/devenir-partenaire` (BE), with the
tier/commission/break-even maths localised and the recruitment city list derived
from coverage gaps. Partner agreement drafted with the brand licence in it.
B2B Google Ads — cheap, and the only fast channel. **This phase is what makes
every later phase possible.**

**Phase 2 — Belgium consumer (`/nl`, then `/fr`).** Dutch copy + Flemish
terminology pass, Bancontact, Belgian legal pages, reciprocal hreflang.
Indexable only where partners cover. French: core funnel only, not the
2,352-line blog.

**Phase 3 — Germany consumer.** Full German translation of the core funnel,
**gross MwSt price table**, Impressum + Widerrufsrecht + Datenschutz, DE payment
methods, NRW cluster, partner GBPs applied for as each partner signs.

**Phase 4 — depth.** German blog/kennisbank, brand pages per market, review
acquisition per country, flip `noindex` cities as the network fills.

**Honest estimate:** Phase 0 + Phase 1 is one focused session — and Phase 1 is
the phase with the highest return per hour in this entire plan. Phase 3 is not a
10-minute job at any skill level: a German gross price table and German legal
copy are decisions about your business that I must not invent.

---

## 10. What I need from you

Answered: domain `autoschluessel24.de`; partners in Berlin, Hamburg, München,
Frankfurt; pricing is partner-price-plus-our-margin (§2). Phase 0 is built on
those answers.

### Blocking Germany
1. **The margin.** A percentage, or a per-job-type markup. This replaces the
   eight prices I would otherwise have asked for, because §2 means the "ab"
   price is computed from the partner rate cards. One number unblocks the whole
   German price page.
2. **The four partners' rate cards** — what each charges for a transponder, a
   flip key, a smart key, all-keys-lost, an opening, an ignition. Same shape as
   `technicianRates.ts` already holds for the Dutch partners. Without them
   there is nothing to add the margin to.
3. **German legal identity for the Impressum** (§5 DDG, launch blocker): legal
   name and form, registered address, Handelsregister/HRB, USt-IdNr., and the
   named responsible person. Plus whether the German entity is the contracting
   party or the Dutch one is — it decides the VAT shape in §2.
4. **A German phone number** (+49). A Dutch 06 on a German page costs trust in
   a category German consumers screen hard, and no GBP will verify against it.
5. **GBP status per city.** For each of the four: does the partner already have
   a verified Google Business Profile, and under whose name? That decides
   whether §3 option A (trading as "Autoschlüssel24 Berlin") is a rename of an
   existing listing or a new application — and it is the single biggest lever
   on how fast Germany ranks.
6. **Payments.** Can your Mollie account enable card/PayPal/SEPA for Germany?
   iDEAL does not exist there, and a partner who cannot take payment on site
   cannot close the job.

### Blocking Belgium
7. **Is `autosleutel24.be` registered?** `be.ts` assumes that name.
8. **Any Belgian partners, or none yet?** `cities.ts` currently has no Belgian
   cities, which is deliberate. Give me cities with partners and I will add them
   the way the German four went in.
9. Belgian ondernemingsnummer (KBO/BCE) + BTW number, for the footer and the
   legal pages.

### Needed soon, not blocking the build
10. **Real DE keyword volumes** (Keyword Planner or Ahrefs CSV: city + term +
    volume). The four German cities carry `nlSearches: 0` — a known gap, not a
    claim. Do you have Ahrefs or SEMrush access?
11. **Handwerksordnung / HWK answer** — whether mobile auto-key work needs
    Handwerkskammer registration in Germany, and whether it falls under Anlage A.
    This decides who you may recruit, so it gates Phase 1's outreach rather
    than its build. Ask a Steuerberater or the HWK; I will not guess it.
12. Who reviews the German copy. I will write native-quality German, but the
    legal pages and the price page should be signed off by a native speaker who
    knows the trade.
13. The real NL `kvk`/`btw`/`iban` — the code flags all three as placeholders
    ("VERIFY BEFORE INVOICING") and I would rather not see that bug copied into
    two more countries.

---

## 11. What I would build next, on your say-so

In rough order of return:

1. **German content layer** — `lang`, hreflang cluster, `geo.*`, slug map
   (`/staedte`, `/leistungen`, `/preise`, `/kontakt`), and German copy for the
   four city pages and the core funnel. This is what turns the working German
   build from Dutch-text-on-a-German-domain into a German site.
2. **`/impressum` + Widerruf + Datenschutz** — launch blockers, and the
   Widerruf consent belongs in the lead funnel, not just on a page.
3. **Price derivation from rate cards + margin** (§2.3), replacing the TBDs.
4. **`/partner-werden`** — still the cheapest traffic in Germany, and now a
   reference-case page rather than a cold pitch, because four partners exist.
5. **Coverage-driven indexability** — derive the `noindex` decision from live
   partner coverage instead of the hand-maintained set in `thinPages.ts`.

Say which and I will take it the same way as Phase 0: built, verified against
`main`, and pushed.
