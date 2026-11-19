# Tracking plan — GA4, Clarity, and where to find the drop-off

Written after a full read of the tracking code in both repos (service site
`autoslutel` and webshop `shop`), not a guess. Nothing here was invented —
every event below already fires in production. What was missing was a map
of it: no single place explained what exists, so the instinct was to assume
gaps that turned out not to be there. This doc is that map, plus the two
real gaps found and the console work (not code) that turns these events
into an actual "where are we losing people" view.

## 1. Architecture — one customer journey, one dataset

Both apps send to the **same GA4 property** (`G-C4WR7TYCTV`) and the **same
Clarity project** (`y9gjejwp8z`). This matters more than any single event:
without it, a visitor who starts on the service site and clicks through to
`/webshop` would split into two unrelated sessions in two different tools,
and no funnel could ever cross that boundary. It doesn't split — `content_group:
'webshop'` on the shop's GA4 config is the only thing that tells the two
apart downstream.

Both apps also run **Google Consent Mode v2**: nothing is stored until a
visitor accepts, analytics and ads consent are tracked separately, and
Clarity (not Consent-Mode-aware on its own) is only loaded at all after
explicit statistics consent — `src/lib/consent.ts` on the shop,
`src/lib/consent.ts` on the service site. A visitor who clicks "weigeren"
is invisible to both tools by design, which is correct and not a gap — it's
the AVG requirement. It does mean the funnel numbers below are "of visitors
who accepted cookies," not "of all visitors" — keep that in mind when a
GA4 total looks lower than you'd expect from raw traffic.

## 2. Full event inventory

| Event | Fired from | What it tells you |
|---|---|---|
| `form_step` | `VehicleWizard.tsx` (homepage hero wizard) | Every step reached — `step_name`: kenteken, contact, start, knoppen, werkende_sleutel, klaar. **This is the single most important event on the service site**: it's the only thing that shows exactly which step of the 5-step wizard people abandon on. |
| `lead_form_submit` | `/api/leads` success, via `leadTracking.ts` | A lead row was actually saved — phone number in hand, not just "reached the end of the form." |
| `generate_lead` | same | GA4's own standard name for the same moment, sent alongside `lead_form_submit` so Google Ads' built-in lead-gen reporting picks it up without custom config. |
| `contact_form_submit` | `ContactForm.tsx` | The plain `/contact` page form, separate funnel from the wizard. |
| `click_to_call` | `PhoneConversionTracker.tsx` (site-wide delegated listener) / `TrackView.tsx` → `ContactClicks` (shop) | Every tap on a `tel:` link, anywhere on either app. Not per-button — one listener catches all of them. |
| `click_to_whatsapp` | same two files | Every tap on a `wa.me` / `/whatsapp` / `api.whatsapp.com` link. Ad-attributed: a click carrying a `gclid`/`wbraid`/`msclkid` gets a `ref` code stamped into the WhatsApp message itself, so a chat can be traced back to the ad that caused it (`addWhatsAppRef`). |
| `view_item_list` | `TrackView` on `catalogus/page.tsx`, `merk/[merk]/[model]/page.tsx` | A category/brand/search results page was shown, with up to 20 of the listed products and their prices. |
| `view_item` | `TrackView` on `product/[slug]/page.tsx` | A single product page was shown — price, brand, category, stock state. |
| `add_to_cart` / `remove_from_cart` | `lib/cart.ts` | Standard GA4 ecommerce, fired from the one place cart state changes, not duplicated per button. |
| `begin_checkout` | `CheckoutForm.tsx` | Checkout page reached with a non-empty cart. |
| `purchase` | `bedankt/PaidEffects.tsx` | Real transaction id, value and items — only after Mollie confirms payment, not on form submit. |
| `consent_update` | `consent.ts` (both apps) | Lets you segment every report above by "visitor who opted in to statistics," which is implicitly all of them, but also lets you see the accept/decline rate itself. |

Every one of these also fires a matching **Clarity custom event** (`track()`
in the shop calls `window.clarity('event', …)` alongside `gtag`), and three
places set a **Clarity session tag** you can filter recordings by:
`lead_id` (ties a recording to the exact lead row), `page_type` (product /
list), and `step` (checkout). That means: you can already filter Clarity to
"every recording that reached checkout but has no matching purchase" —
that's your cart-abandonment session library, today, no new code.

## 3. The two funnels to build — do this in the GA4 UI, not here

Events existing is not the same as a funnel report existing. Nobody has
built one yet. In GA4 → **Explore → Funnel exploration**, create:

**Funnel A — service wizard (the money funnel, this is the business):**
1. `page_view` where `page_location` contains `autosleutel24.nl` and not `/webshop`
2. `form_step` where `step_name` = `kenteken`
3. `form_step` where `step_name` = `contact` *(this is where the phone number is captured — a lead already exists here even if they go no further)*
4. `form_step` where `step_name` = `klaar`
5. `lead_form_submit`

Breaking it down by `step_name` is what answers "where are we losing
customers" literally — whichever step has the steepest drop between it and
the next is the one to fix first. My bet, unverified, is step 1→2
(kenteken → phone): that's the step that asks for a phone number, which is
always the biggest single drop in any lead form. Don't take my word for it,
the funnel report will say for certain.

**Funnel B — webshop purchase:**
1. `view_item_list`
2. `view_item`
3. `add_to_cart`
4. `begin_checkout`
5. `purchase`

Mark `lead_form_submit`, `generate_lead`, and `purchase` as **Key events**
(GA4 Admin → Events → toggle "Mark as key event") if they aren't already —
that's what makes them show up in the default reporting views and in Google
Ads' conversion import, instead of only being visible inside a manually-built
Exploration.

**In Clarity:** set up a saved filter for `step = checkout` with no matching
GA4 `purchase` in the same session window — that's your highest-value
recording list, the people who got to the door and didn't walk through it.

## 4. What this cannot show you, and why that's not a bug

- **Mid-Mollie abandonment.** Once `begin_checkout` fires and the visitor is
  sent to Mollie, the next thing either GA4 or Clarity can see is the
  `purchase` event on return — or nothing, if they never come back. Mollie
  itself is the only place that distinguishes "cancelled on Mollie's screen"
  from "closed the tab." If that gap matters, it's a Mollie dashboard
  question, not a GA4 one.
- **What happens on a phone call.** `click_to_call` tells you the tap
  happened; it cannot tell you whether the call converted. That's a CRM
  question (does the lead's status get updated after the call), not an
  analytics one.
- **Declined-consent visitors.** Covered in §1 — by design, not a leak.

## 5. Gaps actually found, fixed in this branch

**`HorizontalKentekenForm.tsx`** (used on `/autosleutel-bestellen-op-kenteken`)
had no step-level signal at all — unlike the hero wizard, it's one flat
screen (kenteken, postcode, phone, submit), so it never had an equivalent to
`form_step`. The only visibility was "did they submit," with nothing between
landing and conversion. Added one `form_engaged` event, fired once on first
interaction with the kenteken field — now this page's funnel is at least
landing → engaged → submitted, instead of landing → submitted with a black
box in between.

Everything else audited (full list in §2) was already correctly built. No
other code gap was found worth a diff — the real missing piece was this
document and the two GA4 Explorations in §3, not more instrumentation.
