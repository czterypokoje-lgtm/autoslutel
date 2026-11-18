# KeyForCars preview: putting it online

## Status for the next developer (18 Nov 2026)

- **Done:** everything on this branch runs locally against a local Supabase
  (Docker) with fictional KeyForCars data. All CRM office screens load. Our
  technician screens and public site return 404. A Turbopack production
  build passes.
- **Created, not deployed:** Vercel project `keyforcars-crm` (team Nethoreca).
  It has no env vars yet and is not connected to git; deploy with the CLI from
  this folder (`.vercelignore` keeps `.env*` and local data out).
- **Next:** create the KeyForCars Supabase project (EU), load migrations +
  `kfc-preview.sql` + `seed-kfc-demo.sql`, set the 5 env vars below on
  `keyforcars-crm`, deploy, create the 4 logins, run the acceptance checklist.
- **Never** merge this branch into `main` as is, and never point it at
  Autosleutel24's Supabase. The plan behind all of this is
  `docs/kfc-crm-plan.md` (English, Turkish summary at the top).
- **Not run yet:** the Supabase storage path for stock (`src/lib/kfcStockStore.ts`)
  against a cloud project; English labels for sign-out and the top search.

Branch `kfc/preview`. One codebase: with `CRM_INSTALL=keyforcars` this app is
KeyForCars's CRM — dashboard, orders, stock, product finder — and everything
else (our public site, our CRM modules, crons, webhooks) answers 404. Without
that variable it is Autosleutel24 exactly as before.

**Özet (Türkçe):** Yeni bir Supabase projesi açın, SQL'i yapıştırın, 4 kullanıcı
oluşturun, aynı GitHub deposundan yeni bir Vercel projesi açın, aşağıdaki env
değişkenlerini girin. Bizim Supabase anahtarlarımız oraya asla girilmez.

## What the preview contains

| Screen | Data |
|---|---|
| Dashboard | Sample orders: real products and shop prices, invented quantities (`src/lib/kfcSampleOrders.ts`). Orders, revenue excl. VAT, units, per shop, best sellers, not sold in 90 days. |
| Orders | The same sample orders, filter by shop and status, search by order number or SKU. |
| Stock | The real catalogue (1,704 cards), counting, shelves, labels, bulk photo count, reorder list. Saved in Supabase. |
| Product finder | Scan or type a code, EAN, name, or car + year. |

No customer names, emails or addresses exist anywhere in it.

Plus the whole Autosleutel24 office CRM on fictional KeyForCars data: dashboard
(quick start, to-dos, KPIs), leads with follow-ups, AI conversations, calendar,
customers, invoices, expenses, reports, ad clicks, click fraud, settings. Only our
technician network (technicians, offers, bids, payouts, rates, network chat) and
our public site are hidden.

**Run it locally:** `npx supabase start` in this folder (Docker), load
`supabase/kfc-preview.sql` and `supabase/seed-kfc-demo.sql` into it, put its URL
and keys in `.env.local` with `CRM_INSTALL=keyforcars` and
`KFC_STOCK_STORE=supabase`, then `npm run dev`. The local demo login is in
`.env.local` (`PREVIEW_DEMO_EMAIL` / `PREVIEW_DEMO_PASSWORD`).

## Steps (in this order)

1. **Supabase.** The owner creates a new project, region Frankfurt (EU), named
   `keyforcars-preview`. The free plan is enough for a preview, but it pauses
   after a week without visits.
2. **SQL.** Load every file in `supabase/migrations/` in order (0000 → 0088;
   `supabase db push` does this), then `supabase/kfc-preview.sql`, then the
   fictional sample data `supabase/seed-kfc-demo.sql` (leads, AI calls,
   appointments, invoices, expenses, ad clicks). Never run the seed file
   against Autosleutel24's database.
3. **Auth URLs.** Authentication → URL configuration: Site URL = the preview
   address, and add `<preview address>/admin/auth/callback` to the redirect URLs.
4. **Users.** For each of the 4 people, run once on this machine with the **new**
   project's URL and service-role key in the environment:
   `node scripts/crm-user.mjs <email> owner` for the owner, `kantoor` for the
   other three. Do **not** use `--invite`: its mail link points at
   autosleutel24.nl. The owner sets each password in Supabase → Authentication
   → Users. Roles are only `owner` and `kantoor` in the preview; separate warehouse
   and picker roles come with the real install.
5. **Vercel.** New project from the same GitHub repo, production branch
   `kfc/preview`, function region `fra1`. Env vars (all from the **new** Supabase
   project; never copy Autosleutel24's):

   | Name | Value |
   |---|---|
   | `CRM_INSTALL` | `keyforcars` |
   | `KFC_STOCK_STORE` | `supabase` |
   | `NEXT_PUBLIC_SUPABASE_URL` | new project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | new project anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | new project service-role key |

   Settings → Git → Ignored Build Step:
   `[ "$VERCEL_GIT_COMMIT_REF" = "kfc/preview" ] && exit 1 || exit 0`
   so pushes to our other branches do not build here.
   The `vercel.json` cron is registered on this project too; its route answers
   404 on this install, so it does nothing.
6. **Domain (optional).** `crm.klapsleutels.nl`: a CNAME to `cname.vercel-dns.com`,
   set by whoever manages their DNS.

## Acceptance checklist (they tick it, then pay)

1. Each of the 4 users can log in and sees only Dashboard, Orders and Stock.
2. Any other address (for example `/admin/leads`, `/blog`) shows "not found".
3. Scanning a printed label opens the right product, with shelf and fitting cars.
4. Their handheld scanner reads the printed labels.
5. A count booked on one phone shows on another device after a refresh.
6. Dashboard, orders and stock work in Dutch and English (switch bottom right).

## Known limits of the preview

- Orders are samples. The real install imports them read-only from the three
  WooCommerce shops (plan section 5).
- The stock record is one database row: fine for 4 people. Two saves at the
  same moment cannot overwrite each other: the second gets "try again". The real
  install moves to tables per article and movement (plan section 6).
- Not checked against a real Supabase project yet: the Supabase storage path
  (`src/lib/kfcStockStore.ts`) was type-checked and built, but only the
  local-file path was run end to end.
- Sign-out and a few shell labels stay Dutch in English mode.
