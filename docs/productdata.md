# Product master data, categories and staff roles (migration 0134)

For the KeyForCars install (`CRM_INSTALL=keyforcars`), and for Autosleutel24 with
`CRM_WAREHOUSE=1`. Each install runs the migration against its own Supabase
project, so KeyForCars data never mixes with Autosleutel24 data.

## Database (`supabase/migrations/0134_kfc_product_master.sql`)

Idempotent and server-only: RLS on, no policies, nothing granted to anon or
authenticated. RPCs are executable by `service_role` only.

| Object | What it is |
| --- | --- |
| `kfc_categories` | Category tree (ERPNext "Item Group"): `parent_id`, `name`, `sort`, `vat_rate` (default 21), `default_margin_pct`. Sibling names are unique (case-insensitive). A trigger refuses cycles. |
| `kfc_articles.category_id` | FK to the tree (`on delete restrict`). **The text column `category` is kept**: a trigger makes it mirror the leaf name. |
| `kfc_category_aliases` | Old names of merged categories. A later write of the old text (Woo import, quick article) lands on the survivor instead of re-creating the merged category. |
| `kfc_category_paths` (view) | `path` ("Sleutels › Volkswagen"), `depth`, sort keys. |
| `kfc_articles.min_stock` | Article-level reorder point. The per-location `kfc_stock_levels.minimum` is unchanged. |
| `kfc_article_specs` | 1:1 item attributes: `brand`, `key_type` (remote, smart, flip, transponder, blade, emergency, housing, card, chip, pcb, battery, tool, other), `frequency`, `chip`, `buttons`, `blade`. |
| `kfc_article_fitments` | Vehicle compatibility: `make`, `model`, `year_from`, `year_to` (1:n, unique per article + vehicle + range). |
| `kfc_article_changes` | Audit of every bulk edit and import: `{field: [old, new]}`, the import run, who, when. |
| `kfc_barcode_duplicates` (view) | Barcodes on more than one **quantity-tracked** article. Serial (used) articles share the new product's EAN on purpose (`kfc_quick_article`), so they are left out. Duplicates are reported, never deleted. |
| `kfc_article_quality` (view) | One row per article with flags `no_barcode`, `no_category`, `no_price`, `no_purchase_price`, `duplicate_barcode`, `negative_stock`. Discontinued articles are not flagged for barcode or price. |
| `kfc_import_runs` (0091) | New columns `checksum`, `file_name`, `summary`, `created_by`. The kind check is widened by OR-ing `kind = 'article_import'` onto whatever check exists, so a kind added by another migration is kept. A partial unique index on `checksum` (successful article imports) makes a re-apply a no-op. |

Backfill: every distinct non-empty `kfc_articles.category` (trimmed, case-insensitive)
becomes a root category and the article is linked. Expect one big "Automerken" root on
KeyForCars (about 1,500 scraped shop articles): restructure it in the tree manager
(add sub-categories, move, merge).

RPCs:

- `kfc_category_resolve(path, create)`: "A > B > C" → id, creating missing levels.
- `kfc_merge_categories(from, into)`: articles and children move (same-named children merge recursively), the old name becomes an alias, and `from` is deleted. Merging into one's own subcategory is refused.
- `kfc_bulk_update_articles(changes, user)`: `[{code, before, after}]`. Every `before` value must still match, otherwise the whole call rolls back with `KFC_CONFLICT:<codes>`. A barcode new to an article may not exist on another quantity-tracked article (`KFC_DUPLICATE_BARCODE:<code>`). Existing duplicates never block unrelated edits.
- `kfc_apply_article_import(checksum, file, prefix, rows, user)`: all or nothing. New article codes are `KFC-1-<max+1>` (or `AS24-1-…`), allocated under the advisory lock `hashtext('kfc_article_code:' || prefix)`. Other code that allocates `-1-` codes should take the same lock.

Checked offline on PGlite (Postgres 16 in-process): 0090 + 0125 + the import-runs
table, then 0134 applied twice. Covered: backfill, sync trigger, quick article,
resolve, rename, cycle guard, merge/alias/recursive merge, FK on delete, bulk
update (conflict, rollback, duplicate barcode, bad field), import (create/update,
specs, fitments, replay, conflict, prefix) and grants. **Not run against any live
database.**

## Screens (office only: owner, kantoor)

Under **Magazijn › Artikelbeheer** in `KfcShell` (both installs with the warehouse module):

- `/admin/artikelbeheer/kwaliteit`: counts per issue (plus invalid EAN/GTIN check digits, computed in TypeScript), a list per issue, the duplicate-barcode table, and a link to the bulk editor filtered on that issue.
- `/admin/artikelbeheer/categorieen`: tree manager (add root or child, rename, VAT %, default margin %, move up/down, move to another parent, merge with confirmation, delete when empty).
- `/admin/artikelbeheer/bulk`: grid with filters (search, category incl. subcategories, status, quality issue), 50 rows per page, inline edit of name, SKU, barcodes, category, status, sale/purchase price, min stock. Bulk actions on the selection: set category/status/min stock, price ± %, and "sale price from category margin" (`purchase × (1 + margin) × (1 + VAT)`; untick "incl. btw" for ex-VAT). **The VAT basis of `sale_price_cents` is not recorded anywhere; webshop prices are assumed incl. VAT.** Saves send `before` values, so a concurrent change is refused instead of overwritten.
- `/admin/artikelbeheer/import`: wizard. Upload CSV (`;` `,` or tab, auto-detected) or XLSX (max 5 MB / 20,000 rows) and match on SKU or EAN (a `code` column always wins). The dry run shows per row new / change (old → new per field) / unchanged / skipped with the reason, plus categories to be created and ignored columns. Apply rebuilds the plan from the same bytes on the server and checks the checksum. Empty cells keep the current value; barcodes are only added, never removed. Ambiguous matches, barcodes owned by another article, and duplicate rows in the file are skipped. Export (CSV for Dutch Excel or XLSX, filter on category subtree and status) uses the same columns, so a file round-trips. A template is at `/api/admin/artikelbeheer/export?template=1`.
  Columns: `code, sku, ean (a;b), naam, categorie (A > B), status (voorraad | op bestelling | uitlopend), verkoopprijs, inkoopprijs, min_voorraad, voorraad (export only), leveranciersref, merk, sleuteltype, frequentie, chip, knoppen, baard, voertuigen (Merk|Model|Van|Tot; …)`. English and WooCommerce headers are recognised too (Name, SKU, Regular price, Categories, "GTIN, UPC, EAN, or ISBN").

Strings go through `PreviewText`/`t()`. No English dictionary entries were added (that file is shared), so the English preview shows Dutch for these screens.

## Staff and roles (`/admin/instellingen/medewerkers`)

In the Kantoor nav for office on warehouse installs. Office can read; **only the owner** can invite, change roles, toggle prices, disable/enable, or make a new link. Roles offered: owner, kantoor, magazijn, inpak (no monteur; on Autosleutel24 monteurs stay under Monteurs and are read-only here). Invite = `generateLink('invite')` with the link shown to copy (WhatsApp, as with technicians), or a password set directly. Disable = auth ban (`ban_duration`). Last login comes from `last_sign_in_at`. Guards: you can't edit yourself, and the last active owner can't be demoted or disabled.

Purchase prices for magazijn: `crmSession.ts` gains `CrmUser.pricesAllowed` (`app_metadata.prices`) and **`seesPurchasePrices(user)`** = office, or magazijn with the switch on. `seesPrices` is **unchanged**, because it also gates office actions (purchase orders, order import, agenda edits). The display-only call sites now use `seesPurchasePrices`: `kfcInventory.loadState` (stripPrices), `listPurchaseOrders` line costs, and the montage page and API. Inpak never sees prices.

## For the other sessions

- **Kassa (0129):** gate the till with `requireWarehouseUser` (magazijn may sell), and strip purchase/cost prices with `seesPurchasePrices`, not `seesPrices`.
- **Inventory lists/reports (0131):** group by `kfc_articles.category_id` / `kfc_category_paths.path` instead of the regexes in `inventoryCategories.ts`. `min_stock` is article-level and nullable; the reorder logic can use `greatest(min_stock, sum(levels.minimum))`. `kfc_article_quality` is reusable.
- **Woo sync (0132):** keep writing `kfc_articles.category` text if that is easier; the trigger links it to the tree (aliases respected). If you change the `kfc_import_runs.kind` check, keep `'article_import'`.
- Not done: no screen yet to edit specs/fitments per article (import/export only); `keyforcars-profiles.json` fitments are not seeded into `kfc_article_fitments`.
