# Cariler — customer and supplier accounts, purchasing (migration 0130)

One account system for both sides of the business, modelled on Nebim V3 /
ERPNext 16 (Customer, Supplier, Purchase Order, Purchase Receipt, Purchase
Invoice, account statement, aging), on the existing KeyForCars ledger design.
Everything is server-only (service role); every screen is office only
(owner/kantoor) because it shows balances and prices. Screens are gated on
`WAREHOUSE` (`CRM_WAREHOUSE=1`) and hidden under `CRM_PREVIEW`, like Inkoop.

**Run order:** apply `supabase/migrations/0130_kfc_cariler.sql` before
deploying this code. `listCustomers`/`getCustomer` now read the new customer
columns, so the KeyForCars klanten screens and statements fail until 0130 runs.
The migration is idempotent (safe to run twice) and ends with
`notify pgrst, 'reload schema'`.

## Schema (0130)

| Object | What it is |
| --- | --- |
| `kfc_customers` + `kvk`, `invoice_email`, `iban`, `bic`, `website` | Company registration and invoicing fields. `kfc_customers_kvk_format` keeps KvK at 8 digits. |
| `kfc_suppliers` | Supplier account: name (unique, case-insensitive), KvK, BTW, IBAN/BIC, e-mail, order e-mail, phone, website, contact, address, `terms_days` (0–180), `lead_time_days`, `min_order_cents`, `customer_number` (ours at them), note, `active`. |
| `kfc_supplier_contacts` | People at a supplier. |
| `kfc_purchase_orders.supplier_id` | Link to the account. **Backfilled** from the distinct free-text `supplier` names (one supplier per name, case/space-insensitive). The text column stays: it is the name on the order. |
| `kfc_supplier_articles` | Per supplier and article: supplier SKU, agreed `price_cents`, `min_qty`, `lead_time_days`, `preferred` (one per article), `last_price_cents`, `last_ordered_at`. Kept current by trigger `kfc_supplier_article_from_po_line` on every PO line insert/price change; seeded once from existing priced PO lines. |
| `kfc_supplier_ledger` | Append-only crediteur ledger, mirrors `kfc_customer_ledger`: `invoice` (+), `payment` (−), `credit_note` (−), `refund` (+, money back from the supplier), `opening` (±), `write_off` (−), `reversal`. **amount > 0 = we owe the supplier.** Carries `invoice_ref` (supplier invoice number), `purchase_order_id`, `vat_cents`, `due_date`. |
| `kfc_supplier_allocations` | Which payment/credit settles which invoice. |
| `kfc_supplier_invoice_open` (view) | Open remainder per debit entry; reversals and reversed entries excluded (as 0094 for customers). |
| `kfc_supplier_balance` (view) | Per supplier: open, overdue, aging buckets (`not_due`, `d1_30`, `d31_60`, `d61_90`, `d90p`), oldest overdue, open/late POs, value on order, last order. |
| `kfc_purchase_line_facts` (view) | One row per PO line with supplier, Amsterdam order date, quantities, ordered/received value (bigint) and last receipt time. Feeds every purchasing report. |
| `kfc_post_supplier_entry(...)` | Books invoice/payment/credit/refund/opening/write-off. Idempotent on `p_key` (checked again after the advisory lock). Invoice: needs `invoice_ref`, refuses a duplicate ref per supplier (unless reversed), checks the PO belongs to the supplier, due date defaults to date + supplier terms, writes the ref onto the PO when empty. Credits allocate explicit invoices first, the rest oldest-due-first. |
| `kfc_reverse_supplier_entry(...)` | Opposite entry + opposite allocations; never edits. |

The customer side (`kfc_customer_ledger`, `kfc_post_entry`, `kfc_invoice_open`,
`kfc_customer_balance`, trigger `kfc_post_invoice`) is unchanged.

## Validation (one rule set)

`src/lib/accountValidation.ts` — pure, used by the forms and again on the server:

- **Company** (`account_kind = 'company'`): KvK required for Dutch companies
  (exactly 8 digits; foreign companies have none), BTW required (NL strict
  `NL\d{9}B\d{2}`, other EU prefixes loose, non-EU 4–20 alphanumerics),
  street + postcode + city, invoice e-mail. Optional IBAN gets the mod-97 check.
- **Private person**: only a name; formats checked when filled.
- **Suppliers**: same format checks, nothing mandatory but the name.

`kfcReceivables.cleanCustomer` is the single server gate for customer accounts:
the KeyForCars cari dialog (`/api/admin/kfc-klanten`) and the relaties screen
server actions both go through it.

## Screens

| Route | What |
| --- | --- |
| `/admin/klanten` (KeyForCars) | Existing cari list; "Nieuwe klant" now opens the shared `AccountFields` form (kind, KvK, BTW, invoice e-mail, IBAN, address, terms, credit limit, reverse charge). |
| `/admin/klanten/[id]` | Existing cari card; shows KvK/BTW/IBAN/invoice e-mail/address, warns when a Dutch company has no KvK. Payments, reversals, reminders unchanged. |
| `/admin/klanten/[id]/ekstre` | Existing statement, now with KvK. |
| `/admin/klanten/relaties` | Same `AccountFields` form for new accounts, plus "Gegevens wijzigen" on the selected account; search also by KvK/BTW; links to the cari card and statement on KeyForCars. |
| `/admin/leveranciers` | Supplier list: search (name, city, KvK, BTW, contact, our customer number), filters (actief, open saldo, vervallen, open orders, te laat, inactief, alle), totals, CSV export, new supplier. |
| `/admin/leveranciers/[id]` | Supplier card, tabs: **Gegevens** (details + contacts), **Artikelen en prijzen** (scan/type a barcode, SKU, code or supplier ref → agreed price, supplier SKU, min qty, lead time, preferred; last paid vs agreed), **Inkooporders** (ordered/received/invoiced per PO, "Factuur boeken"), **Facturen**, **Betalingen**, **Ekstre** (running balance, reversals), **Saldo** (balance, overdue, on order, aging, open invoices). `?tab=` opens a tab; `?po=<id>` opens the purchase-invoice dialog for that order. |
| `/admin/leveranciers/[id]/ekstre` | Printable supplier statement with aging; `?van=YYYY-MM-DD` brings the earlier balance forward. |
| `/admin/inkoop` | New order: **supplier picker** (active suppliers, "Nieuw" creates one in place) instead of free text; picking a supplier prefills agreed prices, supplier SKU and minimum quantity; scan input unchanged. Order cards link to the supplier and to "Inkoopfactuur boeken (crediteur)". `?leverancier=<id>` preselects. |
| `/admin/rekeningen` | Reports (printable): ouderdom debiteuren, ouderdom crediteuren (0–30/31–60/61–90/90+, with statement links), inkoop per periode grouped by leverancier/artikel/maand, open inkooporders, te late leveringen (open past expected date + received after it), inkoopprijshistorie per article (scan input via `findArticlesByScan`, agreed price per supplier, % change per order). |

API: `/api/admin/leveranciers` (GET options / `?prices=<id>`; POST `create`,
`update`, `contact_add`, `contact_remove`, `article_save`, `article_remove`,
`entry`, `reverse`). `/api/admin/inkoop` `create` accepts `supplier_id`; an old
caller that sends only a name gets the supplier with that name (created when new).

Nav (`KfcShell.tsx`): Magazijn → Leveranciers (office only); Geld →
Debiteuren & crediteuren (KeyForCars and Autosleutel24-with-warehouse). TITLES:
`leveranciers`, `rekeningen`, `relaties`, `ekstre`.

## Not verified

- The migration was **not run** against any database (hard rule). It needs a
  run on a test project before KeyForCars/Autosleutel24 production.
- Screens were type-checked and linted only (`npx tsc --noEmit`, eslint on the
  changed files); no `next dev`/`next build` (disk space), no browser test.

## What's left

- **Bank matching for suppliers**: `kfc_bank` (0095) matches incoming payments
  to customers via `kfc_post_entry`; outgoing bank lines should be matched to
  `kfc_post_supplier_entry(..., 'payment', ...)` the same way.
- **Purchase invoice ↔ receipt 3-way match**: the invoice dialog shows ordered /
  received / already invoiced for the PO, but does not block or flag a
  difference; ERPNext-style price/quantity variance checks are still manual.
- **Purchase invoice lines**: invoices are booked as a total + btw. The existing
  upload flow (`purchase_invoice_lines`, 0096) still sets article cost prices;
  linking those uploads to `kfc_supplier_ledger` entries is not done.
- **Payment run**: a "to pay this week" list (due date ≤ N, grouped by IBAN,
  SEPA export) on top of `kfc_supplier_invoice_open`.
- **Customer company data backfill**: existing company accounts have no KvK;
  the cari card and relaties screen flag Dutch companies without one, and the
  next edit forces it. A bulk import (KvK API) is not built.
- **Merge suppliers**: duplicates from the free-text backfill (e.g. "KeyDIY" vs
  "KeyDIY Europe") must be renamed/merged by hand; no merge action yet.
- **VIES check** for EU VAT numbers (format only today).
- The KeyForCars migration bundle now lives in the KeyForCars repository
  (czterypokoje-lgtm/keyforcars-crm1).
