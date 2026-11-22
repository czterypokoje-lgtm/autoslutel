# Webshop-voorraadsync en retouren (KeyForCars)

Migration `supabase/migrations/0132_kfc_woo_stock_sync.sql`. Nothing is sent to any
WooCommerce shop until the owner switches a shop on (below). Branch: `claude/woo-sync-retour-81da2d`.

## What it does

**Stock push (CRM → WooCommerce).** The CRM ledger is the master. Every stock move
(`kfc_stock_moves`: sale, POS sale, receipt, count, transfer, return, correction,
assembly), every order reservation (`kfc_reservations`) and every job reservation
(`kfc_job_stock`) queues its article in `kfc_woo_stock_outbox` through database
triggers — so the POS (0129), receipts and counts need no code of their own. Only
articles that a shop actually lists are queued, so Autosleutel24 (no shops) never
fills the queue.

The worker (`src/lib/kfcWooStock.ts`, `runStockPush`) claims due articles, computes
the sellable number per article — `kfc_webshop_position.available` (shelves minus
order and job reservations minus van stock), never below 0 — and sends only changed
numbers through `POST /products/batch` and `POST /products/<parent>/variations/batch`,
100 items per request, one request per `WOO_STOCK_PUSH_INTERVAL_MS` (default 1000 ms),
at most `WOO_STOCK_PUSH_MAX_REQUESTS` (default 30) per shop per batch. HTTP 429/503
stops that shop for the run; failed articles back off 1, 2, 4 … minutes (max 6 h).
Claims use `FOR UPDATE SKIP LOCKED`, so parallel runs are safe; a re-queue during a
push is never lost (settle only deletes the row version it claimed).

Where the worker runs:
- `GET /api/cron/kfc-woo-stock` (Bearer `CRON_SECRET`) — the main worker, see "Scheduler".
- After every WooCommerce order webhook (`/api/woo/<shop>`), with an 8 s budget.
- After a return is booked ("Retour ontvangen").
- At the end of the nightly `/api/cron/kfc-reconcile` (already scheduled 03:00).
- By hand on the status screen.

**Mapping.** `kfc_woo_products` holds every product/variation per shop with its
article by SKU (case-insensitive): `ok` (pushed), `unmapped`, `ambiguous` (SKU on
several articles, or twice in one shop), `no_stock` (the shop does not manage stock
for it; a variation whose stock is managed on the parent counts as no_stock). Built
by "Koppelingen verversen" (GET requests only). Manual links survive a refresh.

**Returns.** On a shop order (`/admin/bestellingen/<id>`) the card "Terugbetaling en
retour" shows per line: shipped · refunded (from the Woo refund's line items,
meta `_refunded_item_id`) · received back, with a status (Retour verwacht / Deels
retour / Terugbetaald en retour / Retour zonder terugbetaling). "Retour ontvangen"
(scan the item — code, SKU, EAN or supplier ref via `findArticlesByScan` — or press
the line's button): quantity, condition, location, linked refund, note.
- new / opened → `return` move to the chosen location (a shelf, or quarantine when it
  may not be sold as new);
- defect → `return` move into quarantine plus a `correction` move out of it
  ("Afgeschreven: defecte retour"), in one transaction.

`kfc_receive_return` books once per idempotency key (the browser keeps the key for
retries) and refuses more than shipped minus already returned, like 0113.
`/admin/retouren` lists refunds whose goods have not come back (last 120 days) and
recent receipts. A refund without line items is listed as "alleen bedrag".

## Screens

| Path | Who | What |
| --- | --- | --- |
| `/admin/webshop-sync` | office, KeyForCars | per shop: mode, last push, mapping counts, errors; queue length, retries; "Wachtrij nu verwerken", "Proefrun", "Alles opnieuw in de wachtrij", "Nu pushen" for one article |
| `/admin/webshop-sync/koppelingen` | office, KeyForCars | unmapped / ambiguous / no-stock products, manual link |
| `/admin/retouren` | warehouse roles | refunds awaiting goods, recent returns |
| `/admin/bestellingen/<id>` | warehouse roles (booking: owner, kantoor, magazijn) | refund ↔ return per line, "Retour ontvangen" |

API: `/api/admin/kfc-woo-stock` (office), `/api/admin/kfc-returns` (warehouse,
`canBookReturns`), `/api/cron/kfc-woo-stock` (cron). Nav: "Retouren" under Magazijn,
"Webshop-sync" (Sync-status, Koppelingen) under Kantoor in `KfcShell.tsx`.

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `WOO_KEYFORCARS_STOCK_PUSH` | off | `off` · `dry` (log what would be sent) · `on` (live) |
| `WOO_KLAPSLEUTELS_STOCK_PUSH` | off | same, klapsleutels.nl |
| `WOO_REMKEYS_STOCK_PUSH` | off | same, remkeys.com |
| `WOO_STOCK_PUSH_INTERVAL_MS` | 1000 | pause between Woo requests (min 200) |
| `WOO_STOCK_PUSH_MAX_REQUESTS` | 30 | batch requests per shop per worker batch |
| `WOO_<SHOP>_KEY` / `_SECRET` | — | existing REST keys; need **Read/Write** for the push |
| `CRON_SECRET` | — | existing; protects the cron route |

`CRM_READONLY=1` or `CRM_PREVIEW` turns `on` into `dry`. The status screen shows the
effective mode per shop. A shop without key/secret is always off.

## Switching on (per shop)

1. Apply migration 0132 to the **KeyForCars** Supabase project (it is harmless on
   Autosleutel24 — no shops, nothing queued — but not needed there).
2. Make sure the shop's REST key has Read/Write permission.
3. `/admin/webshop-sync` → "Koppelingen verversen" for the shop. Fix the rows on
   `/admin/webshop-sync/koppelingen` (Aandacht nodig): give SKUs to articles, link by
   hand, resolve doubles, and switch on "Manage stock" in Woo for products that should
   follow the CRM.
4. Set `WOO_<SHOP>_STOCK_PUSH=dry` in Vercel, redeploy, press "Alles opnieuw in de
   wachtrij", then "Proefrun" (or let the worker run). Check "Laatste runs": the
   preview lists `SKU: van→naar`.
5. Happy → set `WOO_<SHOP>_STOCK_PUSH=on`, redeploy, press **"Alles opnieuw in de
   wachtrij"** again (dry runs consume the queue, and articles whose only shops were
   off are settled; this forces one full sync), then "Wachtrij nu verwerken".
6. Switching a shop off: env var back to `off` (or removed) + redeploy.

### Scheduler

`vercel.json` was deliberately **not** changed: it is shared by both installs and a
sub-daily cron fails the deploy on a Vercel Hobby plan. Pick one:
- Vercel Pro: add `{ "path": "/api/cron/kfc-woo-stock", "schedule": "*/5 * * * *" }` to
  `vercel.json` crons (the route answers 404 on Autosleutel24).
- Any external scheduler (cron-job.org, GitHub Actions, Supabase `pg_cron` + `pg_net`):
  `GET https://<keyforcars-crm>/api/cron/kfc-woo-stock` with header
  `Authorization: Bearer <CRON_SECRET>`, every 2–5 minutes.

Without it, pushes still happen after every order webhook, every booked return and
nightly — but a POS sale or a receipt would wait for the next of those.

## Needs allow-listing on KeyForCars (owner of `src/config/install.ts` / `src/proxy.ts`)

`KEYFORCARS_OUTSIDE` in `src/config/install.ts` must get:
- `/api/cron/kfc-woo-stock` — the worker (CRON_SECRET-checked in the route). Without
  it the proxy answers 404 and only the webhook / nightly / manual paths push.

Already reachable, no change needed: `/admin/webshop-sync…`, `/admin/retouren`,
`/api/admin/kfc-woo-stock`, `/api/admin/kfc-returns` (under `/admin/` and
`/api/admin/`), `/api/woo` and `/api/cron/kfc-reconcile` (already listed).

## Known limits

- Woo can sell the last unit between our read and our push; the order webhook
  re-queues the article and the next push corrects it. The CRM never pushes below 0.
- A number changed by hand in Woo admin is only corrected when the article changes in
  the CRM again, or with "Nu pushen" / "Alles opnieuw in de wachtrij" (forced).
- Woo's own "restock refunded items" is overwritten by the next push (the CRM decides).
- Returns need the line to be shipped through the CRM (a `sale` move); orders the shop
  completed before the import (`external`) cannot be returned into stock here.
- The old 0113 "Retour boeken" API action (`kfc-orders` `return`) still works; its
  moves appear in the history as "Retour" without a condition. `ReturnLine` in
  `OrderParts.tsx` and `shopReturnHistory` in `kfcOrders.ts` are no longer used by
  the order page but were left in place.
- Not run against a database or a shop: the migration and the Woo calls are
  type-checked code only.
