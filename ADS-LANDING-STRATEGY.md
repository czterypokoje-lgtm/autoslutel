# Ads landing architecture + campaign plan — autosleutel24.nl

Written 2026-09-26. Answers three questions: can ad clicks go to
autosleutelnamaken.nl, where do the landing pages live, and what the
campaigns should look like.

---

## 1. Verdict

| Question | Answer |
|---|---|
| Forward ad clicks from autosleutel24.nl → autosleutelnamaken.nl? | **No.** Policy violation. |
| Move Namaken pages into autosleutel24.nl? | **No copy-paste migration.** Serve the Namaken app *under* the autosleutel24.nl domain at `/lp/*` with a rewrite. |
| Does SEO on autosleutel24.nl suffer? | **No**, if `/lp/*` is `noindex` and no existing ranking URL is touched. |
| What happens to autosleutelnamaken.nl? | 301 → autosleutel24.nl. Keep the domain as a defensive/brand asset, not a second SEO property. |

## 2. Why forwarding is not allowed

Google Ads destination requirements: **the final URL must be on the same
domain as the display URL.** A final URL on autosleutel24.nl that redirects
to autosleutelnamaken.nl is disapproved as a destination mismatch /
misleading redirect. This is enforced, not theoretical.

The legal alternative — set display *and* final URL to
autosleutelnamaken.nl — means:

- the domain carrying brand searches, sitelinks, organic rankings and years
  of ad history stops being the destination;
- landing-page-experience history restarts on an unproven domain;
- two domains with near-identical content (`werkgebied/[stad]`,
  `merken/[merk]` exist on **both**) compete with each other in organic.

That last point is the real risk to the SEO the user wants to protect. Two
sites, one business, same keywords = self-cannibalisation. Pick one
indexable property: autosleutel24.nl.

## 3. Architecture: Namaken becomes the `/lp` zone of autosleutel24.nl

Next.js multi-zone. Namaken keeps its own repo and deploy; autosleutel24.nl
proxies `/lp/*` to it. Browser URL stays `autosleutel24.nl/lp/...`.

This is the cheap path because the wiring already exists:

- `Namaken/src/app/actions/submitLead.ts` already POSTs to
  `https://autosleutel24.nl/api/leads` → leads land in the same CRM.
- `Namaken/src/components/AdParameterTracker.tsx` already captures
  `gclid`/`wbraid`/`gbraid`/`msclkid` into 90-day cookies, read server-side
  on submit.
- `Namaken/.env.example` already says to reuse container **GTM-PRT75SWX**.

Four diffs:

**a. `Namaken/next.config.ts`** — serve under `/lp`, move assets out of the
`/_next` collision:

```ts
const nextConfig: NextConfig = {
  basePath: "/lp",
  assetPrefix: "/lp-assets",
  // ...existing images config
};
```

**b. `autosleutel24-repo/next.config.ts`** — add to the **existing**
`rewrites()` array (line ~340):

```ts
{ source: "/lp", destination: "https://<namaken-deploy>.vercel.app/lp" },
{ source: "/lp/:path*", destination: "https://<namaken-deploy>.vercel.app/lp/:path*" },
{ source: "/lp-assets/_next/:path*", destination: "https://<namaken-deploy>.vercel.app/lp-assets/_next/:path*" },
```

**c. `Namaken/src/app/(nl)/layout.tsx`** — port the Consent Mode v2 default
block from `autosleutel24-repo/src/app/layout.tsx:143-155` so it runs
**before** GTM. Namaken currently drops `<GoogleTagManager>` with no consent
default: every tag fires unconsented (GDPR problem) and `url_passthrough` /
`ads_data_redaction` are lost, which degrades gclid attribution. ~20 lines,
copy verbatim.

**d. `Namaken/src/app/(nl)/layout.tsx` metadata** — `robots: { index: false, follow: true }`
on the layout, so every `/lp/*` page is noindex. Also set
`Namaken/src/app/robots.ts` to `disallow: "/"` — the namaken domain is no
longer a public site.

Not `Disallow: /lp/` in `autosleutel24-repo/src/app/robots.ts`. AdsBot-Google
must be able to fetch the final URL for landing-page quality; robots.txt is
exactly the mechanism already used in that file to make `/blog/` ineligible
as an ad destination. `noindex` keeps it out of the index without touching
ad eligibility.

**Set `NEXT_PUBLIC_GTM_ID=GTM-PRT75SWX` in the Namaken deploy.** Unset, it
renders nothing and every `/lp` conversion is invisible.

**Fallback if the rewrite proves awkward:** port the `ag/*` components into
`autosleutel24-repo/src/app/(lp)/` and add Tailwind v4 scoped to that route
group. One deploy, no proxy — but a bigger diff, and the root layout's
`globals.css` will fight Tailwind preflight on those pages. Do this only
once the design has won the test in §11, as the step that makes it the
site-wide design.

## 4. SEO rules (non-negotiable)

1. No existing URL changes, redirects or is deleted. `/diensten/*`,
   `/steden/*`, `/merken/*` stay exactly as they rank today.
2. Every `/lp/*` page: `noindex, follow`. They never enter the index, so they
   cannot cannibalise the pages that rank.
3. `/lp/*` never appears in `sitemap.xml`.
4. autosleutelnamaken.nl: 301 to autosleutel24.nl at the DNS/host level once
   the `/lp` zone is live. One indexable property.
5. `/lp` pages may link *out* to the main site (`follow`) — free internal
   links, no risk.

## 5. URL → campaign map

| Landing URL | Intent | Campaign / ad group |
|---|---|---|
| `/lp/autosleutel-kwijt` | emergency, all keys lost | Search — Spoed |
| `/lp/sleutel-bijmaken` | planned spare key | Search — Bijmaken |
| `/lp/sleutel-bijmaken/[merk]` | brand+model | Search — Merken (8 ad groups) |
| `/lp/auto-openen` | locked out, key inside | Search — Spoed |
| `/lp/zakelijk` | fleet, vans, lease, dealers | Search — Zakelijk |
| existing `/` and `/diensten/*` | control arm of the A/B | (see §11) |

Each ad group points at exactly one URL. One ad group per landing page, one
landing page per intent — message match is the cheapest CVR gain available.

## 6. Fix the conversion signal before touching bids

This is the highest-value item in this document and it is not an ad-copy
problem.

Current state: ~88 leads, **1** turned into revenue, 10 retracted,
€425 real. Smart Bidding is optimising towards form fills, and ~98% of
those form fills are worth nothing. Every bid decision Google makes is
trained on noise.

Fix, in order:

1. **Offline conversion import — "Klus Afgerond".** the `/offline-conversions` screen
   already produces the Google Ads CSV from `jobs.status = 'afgerond'`
   joined to `leads.gclid`, with real value. Create the conversion action in
   Google Ads, upload weekly (or automate via the Ads API later). Mark it
   **Primary**.
2. **Demote the form-fill conversion to Secondary** (observation only). It
   stops steering the algorithm the moment it is no longer primary.
3. **"Gekwalificeerde Lead" as the interim primary.** One completed job a
   month cannot feed Smart Bidding — it needs ~30 conversions/30 days. Use
   the lead-minus-retracted signal (`leads.retracted_at IS NULL`, migration
   0046) as a second offline conversion action with a modelled value
   (average job value × close rate). That is the honest signal with volume.
4. **Enhanced conversions for leads.** `leads` already stores email and
   phone; the export already emits both columns. Hashed upload materially
   improves match rate on iOS/Safari clicks. Free signal.
5. **Call conversions.** `/api/track-call-conversion` and
   `gtag_report_conversion()` exist. Confirm both the tel: click *and* the
   answered-call import are firing — in this business the phone is the
   primary conversion, not the form.
6. Only after 1–5 are live for 30 days: switch Spoed/Bijmaken to **tCPA on
   Klus Afgerond**. tROAS needs volume this account does not yet have.

Until step 1 is live, keep bidding on **Maximise clicks with a CPC cap** or
manual CPC. Smart Bidding on a broken signal is worse than no Smart Bidding.

## 7. Campaign structure

All Search, NL only, location targeting = **Presence** (not "presence or
interest"), Dutch. No Display Network, no search-partner opt-in until proven.

| Campaign | Match types | Bidding (interim → target) | Budget split | LP |
|---|---|---|---|---|
| **Brand** | exact + phrase on `autosleutel24`, `carkey24` | manual CPC, low | 5% | `/` |
| **Spoed** | exact + phrase | max clicks → tCPA | 40% | `/lp/autosleutel-kwijt`, `/lp/auto-openen` |
| **Bijmaken** | exact + phrase | max clicks → tCPA | 30% | `/lp/sleutel-bijmaken` |
| **Merken** | exact, 8 ad groups (VW, BMW, Mercedes, Audi, Ford, Opel, Renault, Peugeot) | manual CPC | 15% | `/lp/sleutel-bijmaken/[merk]` |
| **Zakelijk** | phrase | manual CPC | 10% | `/lp/zakelijk` |

Rules:

- **URL expansion OFF** on every campaign. €86.82 of €274.53 already went to
  `/blog/` URLs for zero conversions; the robots.txt AdsBot block is the
  durable half of that fix, the campaign setting is the other half.
- **No broad match** until a conversion signal exists. Broad match on a
  broken signal is how budgets disappear.
- **Ad schedule:** Spoed runs 24/7 with +20–30% bid adjustment 20:00–06:00 —
  that is when people are locked out and when competitors' phones are off.
  Bijmaken and Zakelijk: business hours only.
- **Device:** mobile +20% on Spoed (it is a phone-in-hand emergency),
  desktop neutral on Bijmaken/Zakelijk.
- **Geo:** the real technician radius only — Noord-Holland, Zuid-Holland,
  Utrecht, plus Den Haag, Leiden, Dordrecht, Tilburg, Breda. Bidding
  nationally on a 7-technician mobile service buys calls you cannot serve.
- **Call assets** on every Spoed ad, plus one **Call-only** campaign on the
  top 5 emergency exact keywords for 20:00–06:00.

## 8. Ad copy

Dutch. Headlines ≤30 chars, descriptions ≤90. Pin nothing except the phone
number headline (position 3) so Google can test combinations.

### Ad group: Spoed — "autosleutel kwijt"

Headlines:
1. Autosleutel Kwijt? Wij Komen
2. Nieuwe Sleutel op Locatie
3. Bel Direct: 06 11 75 12 31
4. 24/7 Autosleutel Service
5. Geen Sleutel? Wij Maken Hem
6. Zelfde Dag Nog Geholpen
7. Sleutel Kwijt? Geen Sleepwagen
8. Mobiele Sleutelspecialist
9. Goedkoper Dan De Dealer
10. Vaste Prijs, Vooraf Bekend
11. Beoordeeld met 4,9
12. Alle Merken & Modellen
13. Geprogrammeerd Ter Plaatse
14. Ook 's Nachts Bereikbaar
15. {KeyWord:Autosleutel Kwijt}

Descriptions:
1. Sleutel kwijt? Onze monteur komt naar u toe en maakt ter plaatse een nieuwe sleutel.
2. Geen sleepwagen nodig, geen dealerprijzen. Vaste prijs vooraf. Bel of vraag online aan.
3. Werkzaam in Noord-Holland, Zuid-Holland en Utrecht. 7 monteurs, 24/7 bereikbaar.
4. Geef uw kenteken op en u weet direct wat een nieuwe sleutel voor uw auto kost.

### Ad group: Bijmaken — "autosleutel bijmaken"

Headlines:
1. Autosleutel Bijmaken
2. Tweede Sleutel Laten Maken
3. Prijs Direct op Kenteken
4. Wij Komen Naar U Toe
5. Bijmaken Vanaf 125 Euro
6. Vaste Prijs Vooraf Bekend
7. Alle Merken, Ook Smart Keys
8. Goedkoper Dan De Dealer
9. Klaar Terwijl U Wacht
10. Vandaag Nog Mogelijk
11. Bel Direct: 06 11 75 12 31
12. Reservesleutel Nodig?
13. Beoordeeld met 4,9
14. Geen Garantieverlies
15. {KeyWord:Autosleutel Bijmaken}

Descriptions:
1. Reservesleutel nodig? Wij maken en programmeren hem bij u op de oprit of het werk.
2. Transpondersleutel vanaf 125 euro, klapsleutel vanaf 150, smart key vanaf 195 euro.
3. Vul uw kenteken in voor een vaste prijs. Geen dealerprijs, geen wachttijd van weken.
4. Vaste prijs vooraf afgesproken, nooit verrassingen achteraf. 7 monteurs, heel NL.

Assets (account level, then overridden per campaign):

- **Sitelinks:** Prijzen · Werkgebied · Merken · Beoordelingen
- **Callouts:** 24/7 bereikbaar · Vaste prijs vooraf · Aan huis · Alle merken
- **Structured snippet (Diensten):** Sleutel bijmaken · Sleutel kwijt · Auto
  openen · Smart key · Afstandsbediening
- **Call asset:** 06 11 75 12 31, call reporting ON
- **Location asset:** linked Business Profile — this is also what unlocks the
  map pack on mobile emergency searches.

⚠️ Claims to substantiate before they go live: `jobsSince: "18.400"` and
`foundedYear: 2018` in `Namaken/src/lib/business.ts` are both marked PENDING.
Do not put an unverified job count or founding year into ad copy. `4,9` and
`7 monteurs` are real.

## 9. Negative keyword list (account level)

```
gratis, zelf, zelf maken, diy, cursus, opleiding, vacature, baan,
monteur worden, salaris, app, aliexpress, kopen, bestellen chip,
sleutelhanger, sleutelkastje, huissleutel, voordeur, fietsslot, kluis,
brommer, scooter, motorsleutel, tractor, caravan, tweedehands,
kentekenplaat, kentekencheck, wikipedia, forum, marktplaats
```

`monteur worden` matters specifically: `/monteur-worden` exists on the site
and recruitment traffic converts on the wrong form.

## 10. Landing page conversion checklist

What actually moves CVR on a Dutch emergency-service page, mapped to
components that already exist in the Namaken repo:

| Lever | Component | Status |
|---|---|---|
| Phone as primary CTA above the fold | `CallWhatsAppButtons`, `ag/Hero` | built |
| Sticky mobile call bar | `MobileStickyBar` | built |
| Desktop sticky CTA rail | `StickyCtaSidebar` | built |
| Price transparency band | `PriceTiers` | built |
| Trust: rating, KVK, monteurs | `TrustCredentialsBand`, `TrustSection` | built |
| Brand recognition | `BrandGrid`, `BrandLogoGrid` | built |
| Objection handling | `Faq` | built |
| **Kenteken as the first form field** | `autosleutel24-repo/api/kenteken` | **to wire into `LeadForm`** |

The kenteken field is the single biggest untapped lever. `/api/kenteken`
already exists on the main site. A form that opens with "vul uw kenteken in"
and answers with the actual car and its key type converts far better than
name/phone/service, because it gives the visitor something before asking
for anything. Three fields maximum: **kenteken, postcode, telefoon.** Name
and everything else is collected on the phone call.

## 11. Prove it before believing it

Do not swap the design on a hunch. Google Ads **Campaign experiment**,
50/50, identical keywords and budget:

- **Control:** final URLs on the current `/` and `/diensten/*` pages.
- **Variant:** same ad groups, final URLs on `/lp/*`.

Run until each arm has ≥100 clicks per ad group. Primary metric:
**cost per qualified lead** (§6.3), not CVR on raw form fills — a page that
doubles junk leads looks like a winner on CVR and loses money.

If `/lp` wins: promote it to the site's real design (the §3 fallback path),
then delete the zone.
If it loses: the answer was never the design, and €0 of SEO was risked
finding out.

## 12. Order of operations

| Week | Do |
|---|---|
| 1 | §6.1–6.2: offline conversion action live, form-fill demoted. This is worth more than everything else combined. |
| 1 | §3 a–d: `/lp` zone live, noindex, GTM ID set. Verify a test lead lands in the CRM with its gclid. |
| 2 | §9 negatives, URL expansion off, geo tightened, ad schedule set. |
| 2 | §8 ad copy into new ad groups pointed at `/lp/*`. |
| 3 | §11 experiment starts. §10 kenteken field wired. |
| 4 | §6.3–6.5: qualified-lead + enhanced conversions + call conversions. |
| 6–8 | Read the experiment. Promote or discard. 301 autosleutelnamaken.nl. |

---

## 13. Status — §3 is implemented

Done in code (2026-09-26), verified by `npm run build`:

| Change | File |
|---|---|
| `basePath: "/lp"`, `assetPrefix: "/lp-assets"`, `X-Robots-Tag: noindex, follow` on every route | `Namaken/next.config.ts` |
| Consent Mode v2 + GTM-PRT75SWX + AW-18315813515, hostname-gated to autosleutel24.nl | `Namaken/src/components/Tracking.tsx` (new) |
| `<Tracking />` wired in, `@next/third-parties` GTM removed | `Namaken/src/app/(nl)/layout.tsx`, `Namaken/src/app/(en)/en/layout.tsx` |
| Own origin closed to crawlers | `Namaken/src/app/robots.ts` |
| `/lp`, `/lp/:path*`, `/lp-assets/_next/:path*` rewrites, gated on `LP_ZONE_ORIGIN` | `autosleutel24-repo/next.config.ts` |
| `LP_ZONE_ORIGIN` documented | `autosleutel24-repo/.env.example` |

Build output confirms assets at `/lp-assets/_next/...`, internal links at
`/lp/...`, and `robots.txt` = `Disallow: /`.

`NEXT_PUBLIC_GTM_ID` is no longer read — the container ID is hard-coded in
`Tracking.tsx` to match the main site. The `.env.example` entry for it is now
stale.

Known ceiling: `metadataBase` in both Namaken layouts still points at
`https://autosleutelnamaken.nl`, so canonical and OG URLs name a domain that
will 301 away. Harmless while every page is `noindex` and nobody shares an ad
landing page; fix by pointing `metadataBase` at `https://autosleutel24.nl`
if `/lp` is ever promoted to indexable.

### What is left, and it is account-side only

1. Deploy the Namaken app; put its URL in `LP_ZONE_ORIGIN` on the
   autosleutel24.nl project; redeploy. Then load
   `autosleutel24.nl/lp` and submit a test lead with `?gclid=test123`
   appended — it must appear in the CRM with that gclid.
2. Google Ads: create the **Klus Afgerond** conversion action, upload the CSV
   from the `/offline-conversions` screen, set it Primary, demote the form fill
   to Secondary. (§6 — do this first, it is worth more than the rest.)
3. Google Ads: URL expansion off, §9 negatives, geo to Presence-only, §7 ad
   schedule and device adjustments.
4. Google Ads: build the ad groups from §8 against the `/lp/*` URLs.
5. Start the §11 experiment.
6. Wire the kenteken field into `Namaken/src/components/LeadForm.tsx` against
   the existing `/api/kenteken` (§10).
7. 301 autosleutelnamaken.nl → autosleutel24.nl at the host, once 1 is green.
