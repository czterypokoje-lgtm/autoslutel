# Handoff — autosleutel24.nl

Last updated 7 Sep 2026, branch `integrate`, head `0fbe7f2`.

A Dutch mobile car-key service: a webshop and an internal CRM in one Next.js
app. Read `AGENTS.md` first — this is Next 16 and the APIs differ from what you
remember.

---

## 1. Where things are

| | |
|---|---|
| Repo | `~/Desktop/autosleutel24-repo`, remote `czterypokoje-lgtm/autoslutel` |
| Working branch | `integrate` — **all recent work is here, `main` is 4+ days behind** |
| Local | `npm run dev` → `localhost:3000`, CRM at `/admin` |
| Preview | `autoslutel-git-integrate-nethoreca.vercel.app` (see §6 — blocked) |
| Production | the `main` deploy; does **not** have the catalogue rework |

Talk to the user in **English**. The product — UI strings, product copy, commit
messages — is Dutch and stays Dutch.

---

## 2. The catalogue pipeline

Four scripts, run in order. Each one refuses to guess; when evidence is missing
the article is held back rather than filed wrong.

```bash
node scripts/scrape-akey-catalog.mjs   # 3,752 pages from their sitemap → src/data/akey-catalog-raw.json
node scripts/scrape-akey-sections.mjs  # category pages → akey-sections.json
node scripts/classify-akey.mjs         # decides a category per article, with evidence
node scripts/build-catalog.mjs         # → src/lib/catalog.json (gitignored, generated)
node scripts/audit-catalog.mjs         # must print "No failures"
```

**The design rule that matters.** A category comes from A-Key's own JSON-LD
breadcrumb on their product page, not from words in a title. `scripts/taxonomy.mjs`
maps every one of their shelves to one of our 20 categories **by hand**; an
unmapped shelf is a build error, never a silent `null`. This is what stopped a
Mercedes key being filed under Dodge and a circuit board landing among the
transponders.

`scripts/taxonomy.mjs` is the file you edit when something is in the wrong place.

### Current state

3,627 articles. `filed 3503 · review 41 · conflicts 0`.

```
1186 woningsleutels   440 behuizingen        366 sleutels-zonder-chip
 312 accessoires      262 afstandsbedieningen 190 frezen-en-tasters
 172 universal-remotes 118 transpondersleutels  92 sleutelbaarden
  74 batterijen         74 sloten              71 smart-keys
  62 gereedschap        50 programmeerapparatuur 46 transponders
  38 noodsleutels       34 printplaten          34 sleutelmachines
   6 motorsleutels
```

1,700 fitment entries: 1,073 with both years, 104 with a start year only, 523
with none because A-Key states none.

### Data files (inputs, committed)

`src/data/akey-catalog-raw.json` (the scrape) · `akey-sections.json` ·
`akey-classified.json` · `akey-full-scrape.json` (the Antigravity import) ·
`akey-accessories.json` · `accessfobs-key-cases.json`

`src/lib/catalog.json` is **generated and gitignored** — regenerate it, never
edit it.

---

## 3. Rules learned the hard way

- **A server route must never import from a `'use client'` module.** Values
  arrive as client references. This 500'd every checkout once; `src/lib/services.ts`
  exists to hold what both sides need.
- **Inline styles cannot carry media queries.** Every mobile failure on this
  project traced back to that.
- **Progressive enhancement.** Menus and filters use hidden-checkbox + `<label>`
  CSS and real `<a href>` links, so they work before hydration. Buttons did not.
- Next 16: `src/proxy.ts` (not `middleware.ts`), async `params`/`searchParams`/`cookies()`.
- Supabase: role lives in the JWT `app_metadata.role` (`owner`/`kantoor`/`monteur`),
  enforced by RLS **and** GRANTs — privileges are checked before policies.
- **Never invent** prices, stock, EAN/GTIN barcodes, BTW numbers or reviews.
  Nothing in this catalogue claims anything A-Key does not state.

---

## 4. The CRM

`/admin`, same app. Design system in `src/app/admin/theme.css` (four surfaces,
three inks, two rules, one accent, three radii) and `admin.module.css` (shell +
the shared list idiom: rounded card, hairline rows, chips, icon group).
Icons are `lucide-react`. `src/lib/crmColours.ts` holds technician identity
colours with the pre-dark-theme values mapped, not migrated.

WhatsApp is phase 1: `src/lib/whatsapp.ts` builds `wa.me` deep links with the
message pre-written — job briefing to the technician, "on my way" to the
customer. No Business API (needs a verified Meta business, a number not in the
WhatsApp app, approved templates, a fee per conversation).

---

## 5. Commands

```bash
npm run dev                      # localhost:3000
npx tsc --noEmit && npm run build
node scripts/audit-catalog.mjs   # catalogue invariants — must be clean
node scripts/export-catalogue.mjs # exports/ CSV for Excel, eBay, Amazon
node scripts/export-excel.mjs    # exports/Autosleutel24-producten.xlsx
```

---

## 6. Open items

**Security — do these first.**

1. The Supabase **service_role key** was pasted into a chat. Rotate it.
2. The CRM password for `info@autosleutel24.nl` is still `123456`.

**Blocking the friend's access.** The preview deploy is current (it matches
`c4e6d7c`) but Vercel **Deployment Protection** returns Vercel's own login page
— this is the "No Vercel account for this email" error. Fix in the dashboard:
*Project `autoslutel` → Settings → Deployment Protection → Vercel Authentication
→ off*, or use Protection Bypass for a single secret URL.

**Catalogue.**

- 127 articles have no price and cannot be sold or listed.
- 41 held back for review — see `akey-classified.json`, they need a human call.
- 269 articles where `geeignet für` names a machine, not a car (correct, but the
  fitment block stays empty for them).
- 82 short descriptions — hand tools A-Key writes nothing about.
- eBay/Amazon exports still need: eBay category ids, real stock, and GTIN
  exemption per brand. Do not fabricate barcodes.

**Infrastructure.** ~500 MB of product images are committed; a push failed at
239 MB once. Images are WebP now, but watch the repo size.

**Unverified.** The CRM redesign was checked by rendering the real stylesheets
in a browser, but nobody has walked the live screens with data in them — I have
no login. The shell, nav and shared list styles are confirmed; the detail pages
(`/admin/jobs/[id]`, `/admin/producten/[slug]`, settings panels) inherited the
tokens but were not seen.
