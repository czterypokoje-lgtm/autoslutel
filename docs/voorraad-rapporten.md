# Voorraadlijsten en eigenaarsrapporten (KeyForCars)

Branch `claude/voorraad-rapporten-a4d3cf`, migration `0131_kfc_inventory_reports.sql`.
Works on every install with `CRM_WAREHOUSE=1` (KeyForCars always); each install reads only its own Supabase project.

## Screens

| Route | Who | What |
|---|---|---|
| `/admin/voorraad/artikelen` | office, magazijn, inpak (no prices for the last two) | Article master list (ERPNext Item list): quick-filter chips (op voorraad / laag / nul / negatief / tekort / onderweg / gereserveerd / geen verkoop 90 d / zonder kostprijs), filters (categorie, status, stand, leverancier, locatie), server-side sort and paging (50–500 per page), column picker, saved views (URL + named views per browser), bulk select → export selection, labels, status / category change (office), export everything that matches (CSV `;` or Excel). Search box takes a handheld scanner; the camera button decodes with `StockCamera` + `bulkScanPool`; with "Exacte scan opent het artikel" (or any camera scan) a unique match via `findArticlesByScan` opens the article. |
| `/admin/voorraad/artikel/<code>` | same | Article 360°: master data, physical / reserved / available / incoming / minimum per location, sold 30/90/365 d, prices + list margin + realised 12-month revenue and gross profit (office), monthly sales chart, sales by channel, tabs for locations, movements with running balance (last 200, link to the full ledger), purchase-order history with unit cost, sales history (revenue / cost / profit per line), open reservations. Buttons: label, book/count, purchasing, product profile. |
| `/admin/voorraad/analyse?r=…` | stock reports: same; money reports: office | Report hub. Filters, columns and sort are URL parameters; every report exports to CSV and Excel from the same loader as the screen (`/api/admin/voorraad-analyse?export=<id>&…`). |
| `/admin/voorraad/etiketten?codes=A,B` | same (price only for office) | Shelf / price labels: Code 39 of the SKU (article code when the SKU is not Code 39-safe), QR to the article 360°, shelf, price. 62×29, 100×50, A4 24-up. |
| `/admin/rapporten/eigenaar` | office | Owner dashboard: revenue / gross profit / margin today, this week, this month vs same days last month, stock value, shortages, open and late purchase orders, open web-shop orders (and > 2 days old), refunds, 30-day revenue chart, top 10 of the month, revenue by channel, till cash / PIN / other split. |

Reports (`r=`): `balance` (voorraadstand per locatie; group detail / article / warehouse / category), `valuation` (voorraadwaarde op datum, from the ledger), `ledger` (voorraadgrootboek, server-paged, running balance), `ageing` (FIFO buckets 0–30 … >365 d / unknown), `movers` (snel / traag / niet verkocht, days of cover), `abc` (A 80 % / B 95 % / C / D = stock without sales; by revenue, units or profit), `reorder` (kritiek / bestellen with suggested quantity = max(minimum, sales/day × (lead + 30 d)) − available − incoming), `counts` (telverschillen), `sales` (per article / category / day / month / channel / web shop), `profit` (brutowinst), `top` (top 50 by units, revenue or profit). Money reports: valuation, abc, sales, profit, top.

Nav: KfcShell → Overzicht → *Eigenaarsoverzicht*; Magazijn → Voorraad → *Artikellijst*, *Analyse en rapporten* (TITLES entries added for the breadcrumbs).

## Data rules

- **Sales line** (`kfc_sales_lines`): every `sale` / `return` move. Channel: `webshop` (order line), `kassa` (invoice + note `Kassa …`, as `kfc_pos_sale` writes it), `factuur` (other invoice), `overig` (manual booking). Revenue excl. VAT: web shop = order line `total_excl_cents` pro rata; invoice = the invoice line whose description is the article name or `name (SKU)`; otherwise shelf price ÷ 1.21 (flag `revenue_estimated`). Cost = move `unit_cost_cents`, else current purchase price (flag `cost_estimated`). Returns are negative lines. Date = move date (shipment / till / invoice booking).
- **Stock value** = (physical − unusable, floored at 0) × current purchase price. Quarantine is not valued. Valuation on a date uses the last receipt/assembly unit cost up to that day.
- **Stock state**: negatief (physical < 0), nul (= 0), laag (minimum > 0 and available ≤ sum of shelf minimums), else op voorraad.
- **Supplier** of an article = supplier of its latest non-cancelled purchase order (`kfc_purchase_orders.supplier` is text today). If the cariler session (0130) introduces a supplier table, `kfc_article_overview.suppliers / last_supplier` is the place to switch.
- **Till** (`kfc_pos_payments`, migration 0129 on `feat/kassa`) is read defensively: if the table is missing the dashboard says the till is not in use. Amounts there are incl. VAT.
- A count without a difference books no move, so it is not in *Telverschillen* (the count date is kept on the bin).

## Migration 0131

Read-only, idempotent, server-only (no grants to anon / authenticated; select / execute for `service_role`): indexes on `kfc_stock_moves` (reason+time, invoice, order line, location+time, batch) and `kfc_articles` (category, status); views `kfc_sales_lines`, `kfc_article_overview`; functions `kfc_sales_report`, `kfc_article_movement`, `kfc_stock_valuation`, `kfc_stock_ledger`, `kfc_stock_ageing`, `kfc_article_totals`. The app calls the functions with `{ get: true }` (GET), so they also work on the read-only copy. **Not applied to any database from this branch** — apply with the normal migration flow after review. Until it is applied, the new screens show "Staat migratie 0131 … op deze database?" instead of crashing.

## Not done / follow-ups

- English strings live inline in the new components (`english ? … : …`); the shared dictionary in `PreviewLanguage.tsx` was left alone to avoid conflicts, so the three new nav labels stay Dutch in English mode.
- No live data run: SQL and screens are typechecked and linted only (no DB, no `next build`, per the disk/database rules). First real check: open each report on a staging copy.
- Saved named views are per browser (localStorage); a shared server-side views table would be a small extra migration.
- `/admin/inkoop` has no per-PO deep link, so purchase rows link to the purchasing screen.
