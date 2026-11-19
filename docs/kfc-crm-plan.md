# KeyForCars CRM: their own install, built from the Autosleutel24 CRM

* **Status:** plan only. No code changed, nothing committed, pushed or deployed.
* **Date:** 2026-11-18
* **Read for this plan:** `autoslutel-ops` (branch `fix/lane-c-crm`, commit `c73d237c`): `src/app/admin/*`, `src/app/api/**`, `src/proxy.ts`, `src/lib/crmSession.ts`, `src/app/admin/AdminNav.tsx`, `supabase/migrations/0001–0077`, `supabase/OPENSTAAND.sql`, `PLATFORM-STRATEGY.md`, `vercel.json`, `package.json`. Also the inventory package (`~/Downloads/KeyForCars-Inventory`), the demo checkout (`autoslutel-ops-inventory-demo`, branch `demo/inventory-reorder`), and the earlier review (`reports/inventory-brainstorm/concepts_brief.md`).

---

## Özet (Türkçe, patron için)

**Ne öneriyoruz:** KeyForCars'a kendi CRM'ini veriyoruz. Görünüşü ve kullanımı bizimkiyle aynı. Kod tek, ama kurulum ayrı: kendi Vercel projesi, kendi Supabase veritabanı, kendi kullanıcıları ve kendi alan adı (örneğin `crm.klapsleutels.nl`). Bizim CRM'imize giriş vermiyoruz, çünkü bizim veritabanımızda şirketleri birbirinden ayıran bir yapı yok. Giriş versek bizim müşterilerimizi ve rakamlarımızı görürler.

**Paketler:**
- **Temel paket (satılır):** siparişler (üç WooCommerce mağazasından, önce sadece okuma), günlük satış ve ciro (KDV hariç), depo stoku (raf, etiket, sayım, ürün profili), satın alma faturaları ve marj, giderler, kullanıcılar.
- **Ek modüller (ayrı ücret):** reklam tıklamaları ve hangi reklamın sipariş getirdiği, tıklama dolandırıcılığı, yapay zekâ müşteri asistanı ("bu anahtar arabama uyar mı?"), müşteri listesi.
- **Verilmez:** teknisyen planlama, işler, teklifler, kasa ve teknisyen ödemeleri, teknisyen ağı. Bunlar bizim çilingir işimize ait.

**Dürüst uyarılar (önce zayıf yanlar):**
1. Bizim CRM'in 36 bölümünden sadece 5'i küçük değişiklikle uyuyor (giriş, ayarlar, giderler gibi). 8'i değiştirilmeli, 23'ü teknisyen ve iş yönetimi için yazıldığından uymuyor. Ortak olan kabuk, tasarım, giriş ve birkaç finans ekranı. Sipariş, çoklu mağaza ve depo kısmı yeni yazılacak. "Bizimkiyle aynı" görünüş için doğru, içerik için değil.
2. Önceki inceleme, üç mağaza arasında stoku eşitleyen kısmın **satın alınmasını** önerdi (Picqer, aylık yaklaşık €379, ayda 3.000 sipariş dahil). Bu planda önce sadece siparişleri okuyoruz. Stoku mağazalara geri yazmayı kendimiz mi yapacağız, satın mı alacağız, ayrı bir karar.
3. Reklam tıklaması ve tıklama dolandırıcılığı modülleri bugün sadece bizim sitemizdeki (autosleutel24.nl) ziyaretleri görüyor. KeyForCars'ın mağazaları WordPress. Bu modülleri satmadan önce mağazalara küçük bir eklenti kurmamız gerekiyor.
4. CRM bugün sadece Hollandaca. Siz ve çalışanlar için İngilizce ve Türkçe eklenmeli.
5. Onların müşteri verisini biz barındıracağız. Bu yüzden imzalı bir veri işleme sözleşmesi (verwerkersovereenkomst) şart.

**Maliyet (tahmini, ayda):** Supabase yaklaşık $25, Vercel kullanım dahil yaklaşık $0–20 ek, alan adı kendi alt alan adlarıysa €0. Toplam altyapı ayda yaklaşık €50'nin altında.

**Önce önizleme (yaklaşık 1 hafta):** kendi ürünleri ve son 3 ayın gerçek siparişleriyle (müşteri adı ve adresi olmadan) çalışan bir önizleme açıyoruz. KeyForCars kısa bir kontrol listesini onaylar ve öder, sonra devam ederiz. Bölüm P.

**Hızlı yol (yaklaşık 2 hafta):** CRM'i olduğu gibi taşıyoruz, kullanmayacakları menüleri gizliyoruz, üç mağazanın siparişlerini okuyoruz, stok paketini veritabanına koyuyoruz. Satın alma, marj ve stoku mağazalara geri yazma sonra gelir. Ayrıntılar bölüm 0'da.

**Sizden 8 kısa cevap bekliyoruz:** belgenin sonunda, bölüm 9.

---

## P. Preview first: they confirm, they pay, then we continue (about 1 week)

Before the full move, we put a working preview online. KeyForCars tries it with their own products and their own orders, signs a short checklist, and pays. Only then do we start section 0.

**Where it runs**
- Its own Vercel project and its own Supabase project, from a `kfc/preview` branch.
- Our live CRM and our database are not touched.
- It runs on a Vercel address, or on `crm.klapsleutels.nl` if they set the DNS record.

**What they see**

| Screen | Content |
|---|---|
| Login | Their logo and name. 4 personal accounts. |
| Menu | Only their modules. Everything of ours is hidden and returns 404. |
| Stock | Their real catalogue (1,704 products from the public shop data), shelves, label printing, scanner search, product profile with "which cars it fits", bulk photo count. |
| Orders dashboard | Their **real orders from the last 3 months** from all 3 shops, read-only: orders, revenue excl. VAT, units, per shop, best sellers, "not sold in 90 days". |

**What the preview stores**
- Order number, date, status, shop, totals and order lines.
- **No names, emails or addresses.** So no customer data sits with us before the processing agreement is signed.
- If they do not give API keys, the dashboard runs on sample orders instead. It is less convincing that way.

**What is not in the preview:** stock pushed back to the shops, purchasing, margin, Turkish and English screens.

**Effort:** about 5–6 working days.
- Day 1: projects, switches and branding.
- Days 2–3: stock in the database.
- Days 4–5: order import and dashboard.
- Day 6: polish and the checklist.

**Decided 18 Nov: sample orders.** The preview runs on invented orders built from their real products and shop prices, so no API keys and no customer data are needed. It is built on branch `kfc/preview` in `/Users/mac/Documents/autoslutel-ops-kfc-preview`. Hosting steps are in `docs/kfc-preview.md` there.

**Acceptance checklist (they tick it, then pay)**
1. Each of the 4 users can log in and sees only Dashboard, Orders and Stock.
2. Any other address (for example `/admin/leads`) shows "not found".
3. Scanning a label opens the right product, with shelf and fitting cars.
4. Printed labels read with their handheld scanner.
5. A count booked on one phone shows on another device after a refresh.
6. The screens work in Dutch and English.

**Payment:** the owner sets the amounts. We suggest a fixed preview fee, or a deposit paid at acceptance, before any work on section 0 starts. Put the scope and the price in writing first, so "one more thing" requests do not end up inside the preview.

## 0. Fast path: move it now, build the rest later (about 2 weeks)

The 6–9 weeks in section 8 is the full product: purchasing, margin, three languages, a release process and the stock push. Most of that can wait. Moving the CRM itself is days. Three things cannot be skipped, because without them the move does not work or harms us:

1. **Their own database.** If they log in to ours, they see our customers.
2. **Turning our public site off on their domain.** If it is left on, their domain serves copies of autosleutel24.nl pages, and Google sees duplicate content against our own site.
3. **Moving the stock package out of its JSON file.** Vercel cannot write files, so the package as it is does not run online at all.

There is also one honest catch. Our orders and finance screens read **our** tables. Moved as is, they show empty screens for KeyForCars, because their orders are in three WooCommerce shops. So "orders and finance" means the order import (days 6–8).

| Day | Work |
|---|---|
| 1 | New Supabase project (EU). Replay our migrations and fix what fails. New Vercel project on the same repo. Env vars and domain. |
| 2 | Two env switches: `CRM_ONLY=1` (everything outside `/admin` and `/api/admin` returns 404, the A-Key prebuild and our cron are skipped) and `CRM_HIDE=leads,jobs,…` (hidden from the menu, 404 in `proxy.ts`). Name and logo from env. |
| 3 | Four users, created by hand with `scripts/crm-user.mjs`: owner and office as `owner` and `kantoor`. Warehouse and picker also get `kantoor` for now, with prices hidden later. |
| 4–5 | Stock package into Supabase: articles, shelves, moves, count batches, profiles. Labels and scanner work as they do today. |
| 6–8 | Read-only order import from the three shops (backfill, webhooks, nightly check). Owner dashboard: orders, revenue excl. VAT, units, shop. |
| 9–10 | Test with the owner, fix, go live. Signed processing agreement before real customer data goes in. |

**Left for later, in order:** separate warehouse and picker roles, purchase prices and margin, purchasing with "on order", Turkish and English screens, the release branch, and the stock push or Picqer.

**What the shortcut costs:**
- Every push to `main` goes live for them the same minute.
- The warehouse staff can see purchase prices until the roles are split.
- Both shortcuts get harder to undo the longer they stay.

Plan a week for the cleanup within the first two months.

## 1. Weakest points first

These are the places where this plan is most likely to be wrong or expensive. Each one has a mitigation further down.

1. **"Looks and works exactly like ours" is true for the shell, not the content.** There are 36 section folders under `src/app/admin`. 5 fit with at most small changes, and those are mostly plumbing: login, auth callback, no-access page, settings and expenses. 8 need real adapting. The other 23 serve technician dispatch or the removed webshop (jobs, offers, bids, vans, payouts, the technician network). KeyForCars's core is three WooCommerce shops, one warehouse and purchasing, and none of that exists in the CRM yet. Our own `orders` table is the old Mollie webshop's (`0002_orders.sql`: one `items` jsonb, no shop of origin, no external order id). So the honest sale is "our CRM's look, login and finance screens, plus a new order and warehouse module built for you".
2. **This plan builds part of what the earlier review said to buy.** All seven reviewers recommended buying Picqer for the order-to-stock connection, so that our team is not on call for another company's order flow (`concepts_brief.md`, point 3). This plan starts with a **read-only** order import, which both routes need, and puts the write-back (pushing stock to the shops) behind an explicit buy-or-build gate in Phase 5. If nobody on our side can be reached when an import stops at 23:00, buy.
3. **The CRM lives inside the public website app.** `autoslutel-ops` is the autosleutel24.nl site (`package.json` name `autosleutel-specialist-nl`, about 40 public route folders, sitemap, SEO, ad-landing recorder in `proxy.ts`) with the CRM under `/admin`. A second install of the same code also serves all of that on KeyForCars's domain unless it is fenced off. The `prebuild` step builds the A-Key catalogue for every deploy, and `vercel.json` registers the `openai-paid-jobs` cron for **every** Vercel project connected to the repo.
4. **The two ad modules we want to sell as extras cannot see KeyForCars's traffic.** Click-fraud evidence is recorded inside our own `proxy.ts` (`handlePaidLanding`) when a paid visitor lands on autosleutel24.nl. Ad-click attribution matches `call_clicks` to `jobs`. KeyForCars's visitors land on WordPress, and their sales are WooCommerce orders, not jobs. Before we can sell either module, we need a small collector on their shops and order-level matching. Until then they are not for sale.
5. **Open security debt blocks selling, by our own rule.** `PLATFORM-STRATEGY.md` §1 says: do not sell this platform "in any form" until three items are closed: a CRM password that was exposed while the repo was public, a service-role key pasted into a chat, and the missing audit trail. `0076_ops_audit_log.sql` covers part of the audit trail. The sibling session's note (18 Nov) says old Telegram, Anthropic and Slack keys are still not revoked. I could not check the repo's current visibility (`gh` is not installed). A separate install does not inherit our keys, but the shared code and repo do.
6. **Our migrations have never been replayed on an empty database.** There is no migration runner. The owner pastes numbered SQL by hand. `supabase/OPENSTAAND.sql` exists because the live database did not match the file list. Numbers already collide across branches: `0089_inbound_mail.sql` sits in another worktree, and the `autoslutel` checkout stops at 0075. Some files create something that a later file drops: 0048 creates tables, 0050 links `expenses` to them, and 0056 drops both. A fresh project built from `0001–0077` is untested.
7. **Roles are hard-coded in two languages.** `CRM_ROLES = ['owner','kantoor','monteur']` (`crmSession.ts:16`), and 101 policy lines in SQL check `crm_role() in (...)`. KeyForCars needs warehouse and picking roles. Adding them touches shared code that Autosleutel24 runs on.
8. **The CRM speaks only Dutch.** There is no i18n in `src/`. The owner reads Turkish or English, and we do not yet know what the four workers read. The inventory package has a preview language switch (`integration/PreviewLanguage.tsx`) that its README says to remove before delivery.
9. **One codebase means our change can break their warehouse.** With two Vercel projects on one repo, a push to `main` builds both. Nobody tests KeyForCars screens when we change a job screen. We need a release channel (section 4.6), or Autosleutel24 work will reach a business we cannot watch.
10. **The product data is not ready for stock.** The catalogue has 1,704 product cards for about 1,542 SKUs, some SKUs sit on four cards, remkeys.com is missing from the stock catalogue, and nobody knows where purchase prices live. Margin and stock deduction both wait on a master article list.
11. **Bus factor of one.** One developer working with Claude builds and supports two installs. WooCommerce disables a webhook after 5 failed deliveries in a row ([WooCommerce webhook docs](https://developer.woocommerce.com/docs/apis/rest-api/v3/webhooks/)). Without a nightly reconcile and an alert, orders silently stop arriving.

## 2. Strengths

- **A separate database is real isolation.** A missed guard on a disabled route in the KeyForCars install reaches an empty KeyForCars database, never Autosleutel24 data. That makes a flag mistake a bug, not a data leak, which is the main reason to prefer this over shared tenancy for now.
- **The CRM already has the right security pattern.** `proxy.ts` does an optimistic check and refreshes the token. `crmSession.ts` revalidates with `getUser()` on every page and API route. Roles come from `app_metadata`, which users cannot edit. It fails closed when unconfigured. All of this carries over unchanged.
- **Some finance screens fit closely:** purchase invoices with lines that set purchase prices (`0019`, `crm_confirm_invoice`), expenses with receipt photos (`uitgaven`), the integrations status page (`instellingen`), and the shared `_ui` kit.
- **Read-only first is safe.** The first phase writes nothing to the shops, so it cannot cause an oversell or hide a product.
- **The upsell path is built in.** Switching a module on for a paying customer is a config change plus its migrations.
- **The inventory package exists** (3,437 lines): labels, scanner search, bulk photo count, reorder logic and product profiles. Its storage is the only part that has to be replaced.

---

## 3. Module inventory

Legend. **Fit:** ✅ as is · 🔧 needs adapting · ❌ does not apply · 🆕 new for KeyForCars. **Tier:** **Base** (sold in the base package) · **Extra** (paid add-on) · **—** (not offered).

| Section (route) | What it does | Main tables read | Fit for KeyForCars | Tier |
|---|---|---|---|---|
| `overzicht` (dashboard) | Today's leads, jobs, offers, payouts, low stock, marketing costs | `leads`, `jobs`, `job_offers`, `payout_requests`, `stock_items`, `expenses`, `crm_marketing_costs`, `crm_orders_to_plan` | 🔧 Replace the content with the owner view: orders, revenue excl. VAT, units, shop, margin. Keep the layout and cards. | Base |
| `leads` | Inbound requests from the site, phone and WhatsApp; status, notes | `leads`, `lead_notes` | ❌ Webshop customers order directly. | — |
| `gesprekken` (conversations) | AI call and WhatsApp transcripts (ElevenLabs) | `agent_conversations`, `leads`, `jobs` | 🔧 Only together with an AI customer assistant | Extra |
| `jobs` (planning, agenda, new job) | Technician jobs, payments, materials, photos, warranty | `jobs`, `job_offers`, `job_payments`, `technicians`, `technician_availability`, `crm_warranty_watch`, … | ❌ | — |
| `aanbod` (offers), `biedingen` (bids) | Offering jobs to technicians, bids | `job_offers`, `technician_coverage` | ❌ | — |
| `vandaag` (today) | Technician's day screen | `jobs`, `stock_items`, `technician_coverage` | ❌ | — |
| `klanten` (customers) | Customers derived from leads and jobs by phone number | views `crm_customers`, `crm_customer_vehicles` | 🔧 Rebuild from shop orders (by email). Only if they need it, because it pulls in names and addresses (see 5.5). | Extra |
| `monteurs`, `monteurtarieven`, `start`, `mijn-*` | Technicians, their rates, onboarding, and their own screens (agenda, van, jobs, balance, trade, profile) | `technicians`, `technician_*`, `jobs`, `payout_requests` | ❌ | — |
| `voorraad` (stock) | Warehouse and van stock with min levels and history | `stock_items` (quantity must be ≥ 0, `0008:73`), `stock_moves`, `part_orders` | 🔧 Replaced by the KeyForCars Inventory module (section 6). The van model and the ≥ 0 rule do not fit. | Base |
| `bestellen` (ordering parts) | A technician asks the office for parts | `part_orders`, `technicians` | ❌ as is. 🆕 KeyForCars needs supplier purchasing (reorder list, purchase order, goods received). | Base (new) |
| `orders` | Old webshop orders (Mollie) to plan as jobs | `orders`, `crm_orders_to_plan`, `jobs` | ❌ wrong schema. 🆕 Shop orders from three WooCommerce shops (section 5). | Base (new) |
| `producten` | Overrides for the removed webshop's products | `product_overrides` | ❌ Replaced by the master article list. | — |
| `facturen` (invoices) | Sales invoices for jobs, plus technician purchase invoices | `sales_invoices`, `sales_invoice_lines`, `purchase_invoices`, `purchase_invoice_lines` | 🔧 Purchase invoices fit: upload, lines, purchase price. Sales invoices do not, because WooCommerce or their bookkeeping makes those. Today purchase invoices are tied to a technician (`my_technician_id()` in `crm_confirm_invoice`), so that must become "warehouse". | Base |
| `uitgaven` (expenses) | Expenses with receipt photo and AI caption | `expenses` (FKs to `technicians`, `jobs`) | ✅ after dropping the technician and job fields from the form | Base |
| `kas` (cash and payouts) | Technician ledger and payout requests | `technician_ledger`, `payout_requests`, `crm_technician_balance` | ❌ | — |
| `tarieven` (rates) | Dispatch price list per car and scenario | `dispatch_pricing` | ❌ | — |
| `winst` (profit and usage) | Profit per job, travel costs | `jobs`, materials (`src/lib/winst.ts`) | 🔧 Same idea, new source: order lines × purchase price. Becomes the margin report. | Base |
| `rapport` (performance), `rapportage` (reports) | Leads, jobs, response times; `crm_report_*` views by make, region, technician | `crm_report_*`, `leads`, `jobs` | ❌ 🆕 Sales by product, shop and month; dead stock; days of cover | Base (new) |
| `attributie` (ad clicks) | Matches ad clicks and calls to jobs and campaigns | `call_clicks`, `ad_campaigns`, `jobs` | 🔧 Needs a click collector on the WordPress shops and matching to orders (the gclid stored on the order) | Extra |
| `klikfraude` (click fraud) | Paid landings recorded in `proxy.ts`, IP lists for exclusion | `ad_visits` | 🔧 Same collector problem. The recorder runs only on our own Next.js site. | Extra |
| `whatsapp-advertenties` (WhatsApp and ads) | Reviews of WhatsApp ad conversations | `whatsapp_ad_reviews`, `call_clicks` | ❌ unless they run WhatsApp ads | — (on request) |
| `netwerk` (network) | Discord-style technician chat and marketplace | `chat_*`, `marketplace_listings` | ❌ | — |
| `instellingen` (settings) | Shows which integrations are configured (env booleans only) | env only | ✅ Shows only this install's integrations. Add user management (today `scripts/crm-user.mjs` and `api/admin/crm-users`, which are tied to `technicians`). | Base |
| `login`, `auth`, `geen-toegang` | Supabase login, callback, no-access page | Supabase Auth | ✅ Branding only | Base |
| AI agent (`api/agent/*`, `api/elevenlabs`, `api/telegram`) | Voice and WhatsApp booking agent, Telegram bot for technicians | `leads`, `jobs`, `job_offers`, `dispatch_pricing`, `unmet_requests`, … | ❌ as is. 🆕 A "does this key fit my car" shop assistant can reuse the chat parts search in the `shop` repo and the vehicle-fit data from product profiles. | Extra |
| Telegram alerts (`stockNotify.ts`, `admin_telegram`) | Low-stock and event messages | `admin_telegram` | ✅ Useful for "order import stopped" and "count this product" alerts | Base |
| `api/ops/*` (OpenClaw approval flow) | Our own WhatsApp and mail approval loop | `ops_audit_log`, … | ❌ | — |

**Proposed packages.** These are a structure. The prices are the owner's decision.

- **Base:** shop orders (read-only import), owner dashboard, inventory (articles, shelves, labels, counts, product profiles, scanner search), purchasing and goods received, purchase invoices and margin, expenses, users and roles, Telegram alerts, settings.
- **Extras:** ad-click attribution (after the shop collector exists), click fraud (same), AI shop assistant plus conversations, customer list, stock push to the shops (if built rather than bought).
- **Not offered:** leads, jobs and planning, offers and bids, technicians and their screens, rates, cash and payouts, network, ops.

---

## 4. Architecture

### 4.1 Recommendation

**One codebase, a separate install per customer.** Each install gets its own Vercel project, its own Supabase project (EU region), its own users and its own domain. Modules are switched per install by a config file in the repo. A disabled module is hidden from the menu, and its pages, API routes and crons return **404**. Branding and language are per install.

In AWS's terms this is the **silo** model: the strongest isolation, at the price of running more copies ([AWS, SaaS Tenant Isolation Strategies](https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/saas-tenant-isolation-strategies.html); [silo vs pool guidance](https://aws.amazon.com/solutions/guidance/multi-tenant-architectures-on-aws)). With one or two customers, the extra copies cost about €50 a month. The isolation is what lets us sign a data processing agreement with a straight face.

### 4.2 Stress test against the alternatives

| Option | Verdict | Why |
|---|---|---|
| **Give them a login to our CRM** | Rejected | No company separation. RLS checks the role only (`crm_role()`), so any `owner` or `kantoor` user sees every lead, job and invoice. Our stock rules (≥ 0, vans) do not fit. And their customer data would sit in our database. |
| **Fork the code into a KeyForCars repo** | Rejected | Fastest for one month, worst after six. Every security fix and UI change has to be ported by hand, and the two copies drift. Our repo already shows drift between branches (migration numbers). |
| **True multi-tenant (`org_id` on every table + RLS)** | Later, maybe | `PLATFORM-STRATEGY.md` §3 scopes this as a multi-week retrofit across about 15 tables, every `crm_report_*` view and 101 policy lines, and warns that a half-scoped table "looks safe and isn't". Worth it at 3–5 paying customers, not one. |
| **Monorepo: `packages/ui` + `apps/autosleutel24` + `apps/keyforcars`** | Strong alternative, second choice | Cleaner than flags, because KeyForCars ships only its own code. But it needs the 31,500 lines of `admin` + `api/admin` reorganised first, which delays the customer. Revisit when a third install arrives, or if the flag checks become noisy. |
| **Buy Picqer, and we deliver only a small app** (profiles, labels, photo count, owner dashboard) | Serious contender for the order and stock part | Picqer imports orders from multiple shops, pushes stock, and has shelves and purchasing. The Team plan is reported at €379 a month including 3,000 orders, with unlimited users and shops ([Picqer pricing](https://picqer.com/en/pricing); [thecofounder.nl](https://thecofounder.nl/leveranciers/picqer/), third-party). 20–50 orders a day is 600–1,500 a month, which fits. The downside: it does not look like our CRM, and the owner pays two vendors. |
| **Separate install, flags (recommended)** | Chosen | Isolation without a retrofit. Reuses the shell, auth, UI kit and finance screens. The cost is a flag layer and release discipline. |

### 4.3 Concrete changes in the CRM code

All in `autoslutel-ops`, behind config, so Autosleutel24 behaves exactly as today when its config lists every current module.

1. **Install config** (new): `src/config/installs/autosleutel24.ts` and `src/config/installs/keyforcars.ts`, chosen by one env var, `CRM_INSTALL`. Each file holds:
   - `modules`: the enabled module ids;
   - `brand`: name, short name, logo path, theme tokens, PWA title, mail sender;
   - `locales` and `defaultLocale`;
   - `roles`: the roles that exist in this install;
   - `publicSite: boolean`.

   The config lives in git, so a module switch is reviewed like code. Secrets stay in env vars.
2. **Module registry** (new): `src/config/modules.ts` maps each module id to:
   - its page prefixes (`/admin/orders`, …);
   - its API prefixes (`/api/admin/orders`, `/api/cron/...`, `/api/agent/...`);
   - its nav entries;
   - the roles that may use it;
   - its migration folder.
3. **Route guard in `proxy.ts`.** It already sees every `/admin`, `/api/admin` and public path (`matcher`, line 307). Add one check before `handleCrm` (line 72): if the path belongs to a module that is off, rewrite to 404. If `publicSite` is false, every path outside the CRM, its API and the login pages returns 404. That fences off all the autosleutel24.nl pages.
4. **Second guard next to the data.** Add `requireModule(id)` beside `requireOfficeUser` in `crmSession.ts`, and call it at the top of every page, route handler and server action of a module. Next's own guidance is that the proxy is an optimistic check only, and server actions do not reliably pass through path rules.
5. **Nav.** `AdminNav.tsx` builds `OFFICE_NAV` and `MONTEUR_NAV` (lines 56 and 108) from the registry, filtered by the install's modules and the user's role. The same goes for `MobileTabBar.tsx`.
6. **Crons.** `vercel.json` is shared by every project on the repo, so every cron route starts with `requireModule` and returns 404 when its module is off. KeyForCars's own crons (order reconcile, profile rebuild) are added the same way and are inert on Autosleutel24.
7. **Build.** Make the `prebuild` catalogue step skip when `publicSite` is false.
8. **Branding.** Move the 27 hard-coded "Autosleutel24" strings in 25 admin files, plus the layout metadata (`layout.tsx:27, 37`) and `theme.css` colours, into `brand`. Mail templates (`email.ts`) and invoice biller fields read the install config. Follow the existing rule that the biller is copied onto the invoice when it is created.
9. **Roles.** Extend `CRM_ROLES` with `magazijn` (warehouse) and `inpak` (picking and packing). Do not use `monteur` for them: that role is tied to a `technicians` row through `my_technician_id()`. Shared SQL policies keep working because the new roles appear only in the new KeyForCars tables' policies. `OFFICE_ROLES` stays `owner` + `kantoor`. Give each module its own allowed-roles list instead of the single office/monteur split.
10. **Language.** Add a small dictionary layer (`t('orders.title')`) for the modules KeyForCars receives, with nl, en and tr. Do not translate the whole CRM. The Autosleutel24-only screens stay Dutch.
11. **User management.** Add a "Users" panel in `instellingen` that invites by email and sets `app_metadata.role` through a server route using the service key. This replaces running `scripts/crm-user.mjs` by hand for a customer.

### 4.4 Env vars per install (Vercel project settings)

Same names in both projects, different values:

- `CRM_INSTALL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` and the mail sender
- `TELEGRAM_*`
- KeyForCars only: `WOO_KFC_URL/KEY/SECRET/WEBHOOK_SECRET`, plus the same four for `WOO_KLAP_*` and `WOO_REM_*`

Vercel keeps env vars per project, and one repo can feed several projects ([Vercel monorepo FAQ](https://vercel.com/docs/monorepos/monorepo-faq); [Vercel projects](https://vercel.com/docs/concepts/projects/overview)). Set the Vercel function region to an EU region for KeyForCars.

### 4.5 Database: fresh Supabase project, migrations and seed

- **Do not replay `0001–0077`.** Most of it builds the technician business. The replay is untested, and it would create about 60 tables KeyForCars never uses.
- **Split schema by module.**
  - `supabase/modules/core/` holds what the shell needs: `crm_role()`, `updated_at` triggers, `admin_telegram`, the storage buckets, audit log, users and roles.
  - `supabase/modules/finance/` holds `expenses`, `purchase_invoices` and lines, made technician-optional.
  - `supabase/modules/kfc-orders/`, `kfc-inventory/` and `kfc-purchasing/` hold the new tables.

  Autosleutel24's existing `supabase/migrations/` stays as history. New shared changes are written once, in the module folder.
- **Track what has run.** A small script, `scripts/install-migrate.mjs <install>`, lists the files of the install's modules in order, compares them with a `public.install_migrations` table, prints a dry run, and applies only the missing ones. For KeyForCars, start with Supabase CLI tracking from day one, because a fresh database has no drift. Supabase's own guide recommends running `supabase db push` from CI per environment ([Supabase, managing environments](https://supabase.com/docs/guides/deployment/managing-environments)). Autosleutel24 stays on hand-pasted SQL until someone takes a schema dump and baselines it. Do that before the second customer.
- **Seed.**
  - Owner account. The owner sets their own password through the invite mail; we never type it.
  - The three shops as rows in `shops`.
  - The master article list, imported from the inventory package's catalogue plus remkeys.
  - The product profiles.
  - No demo data in production.

### 4.6 How updates reach both installs

- One GitHub repo with two Vercel projects. The Autosleutel24 project deploys from `main` as today.
- The KeyForCars project's production branch is `release/keyforcars`. We fast-forward it from `main` once a week, after Autosleutel24 has run the change, and after the KeyForCars migrations for that release have been applied. Preview deploys of `main` on the KeyForCars project are allowed, but they point at a KeyForCars **staging** Supabase project, never production.
- A short smoke test runs before each promotion: login per role, orders list, a stock count, a label print preview, and a check that a disabled route returns 404.
- An urgent security fix is cherry-picked to both branches the same day.

---

## 5. Orders and finance for KeyForCars

### 5.1 Source and access

All three shops run WooCommerce (remkeys.com on 11.3.0). The owner creates one REST API key per shop, **read-only** for Phases 1–4, and pastes it into Vercel himself. We never type or see the keys in chat (`concepts_brief.md`, open decision 6).

### 5.2 Read-only import

- **Backfill.** Fetch 12 months of orders per shop with `GET /wp-json/wc/v3/orders`, 100 per page, sequentially, so we do not load their hosting. Also fetch refunds per order.
- **Live webhooks.** Subscribe to `order.created`, `order.updated`, `order.deleted` and `order.restored` per shop, then:
  - check `X-WC-Webhook-Signature` (base64 HMAC-SHA256 of the **raw** body) against that shop's secret;
  - drop duplicates by the delivery id header;
  - answer 200 fast, and do the work in `after()`.

  WooCommerce disables a webhook after 5 non-2xx deliveries in a row and keeps only the last 25 delivery logs ([WooCommerce webhook docs](https://developer.woocommerce.com/docs/apis/rest-api/v3/webhooks/)). So we never rely on webhooks alone.
- **Nightly reconcile** (Vercel cron, about 03:00):
  - re-fetch every order modified in the last 72 hours per shop and upsert it;
  - compare counts and totals per shop per day with our table;
  - check each webhook's status through the API, and re-enable it if it was disabled;
  - send a Telegram alert on any mismatch or disabled webhook.

  Check whether the `modified_after` filter works on all three WooCommerce versions. If it does not, fall back to `after` plus a status scan.
- **Idempotency.**
  - `shop_orders` has a unique key on `(shop_id, woo_order_id)`, and an upsert wins only when `date_modified_gmt` is newer.
  - `shop_order_lines` has a unique key on `(shop_id, woo_order_id, line_item_id)`.
  - `shop_order_refunds` is stored separately.
  - The raw payload is kept as `jsonb` for 90 days, for debugging.
- **Mapping.** Each line stores the shop's `product_id`, `variation_id` and `sku` as they are. Mapping to a master article goes through an `article_aliases` table. Lines that do not map go to an exceptions list and do not block the import.

### 5.3 What "finance" means for them

| Figure | Definition (proposed; the owner confirms) |
|---|---|
| Orders | Count of orders in statuses `processing` + `completed` (whether `on-hold` bank-transfer orders count is an open question), by order date in Europe/Amsterdam |
| Revenue excl. VAT | Σ line `total` (after discount, excl. tax) + `shipping_total` − refunds excl. tax |
| Units | Σ line `quantity` − refunded quantities |
| Shop of origin | `shop_id` |
| Margin | Revenue excl. VAT − Σ (units × purchase price at the time of sale). Whether shipping cost, payment fees and returns are deducted is an owner decision, and the formula is printed on the screen. |
| Purchase invoices | Existing `purchase_invoices` flow. Confirmed lines set the article's purchase price and, from Phase 5, book goods received. |
| Expenses | Existing `uitgaven` |

Margin stays blank, not zero, for articles without a purchase price, and the dashboard shows the share of revenue that has a known cost. **Where purchase prices live is still unknown.** Candidates: supplier invoices (PDF), a WooCommerce cost-of-goods field or plugin, or a spreadsheet. If there is none, purchase invoices entered from now on build the prices up over time.

Our own job invoices, technician payouts, cash, rates and self-billing do not apply.

### 5.4 Stock deduction (after the import has run clean for two weeks)

- **Sales.** A paid order line writes a `stock_moves` row: reason `sale`, source `shop_order_line`, unique per line. The stock **may go negative**: a sale has already happened, so the record accepts it and raises a "count this now" task. This is the opposite of `stock_items_quantity_check` in our CRM.
- **Returns and cancellations.** Cancellations, and refunds with restock ticked, write reverse moves.
- **No push yet.** Nothing is written to the shops in this phase. Pushing absolute quantities is Phase 5 and its buy-or-build gate.

### 5.5 Personal data

For finance and stock we need no customer name or address. Store per order only:
- order number, dates, status and country;
- totals and lines;
- a hash of the email, for counting repeat customers.

Names and addresses come in only if the customer-list extra is bought, or if packing happens in our app (open question 5). This keeps the data processing agreement small, and it means a leak of our copy exposes no addresses.

---

## 6. Inventory: from the JSON file into their Supabase

### 6.1 Today

`src/app/api/admin/voorraad-local/route.ts` reads and writes `local-data/*.json` and photo files with `fs` in one Node process (lines 2, 10, 49, 85). It answers only on the same machine. State is `StockState { workshop, bins, moves, photos, batches }` (`keyforcarsStock.ts:39`). Product profiles are a 5.5 MB JSON file loaded into memory (`productProfiles.ts`), built by `scripts/build-profiles.mjs` from the three shops' public Store API, plus an optional WooCommerce CSV export for EANs. The earlier review found these problems:
- real orders are refused when stock is short (`route.ts:275`);
- web orders without a shelf are refused (`route.ts:261-264`);
- uncounted products get a suggested order quantity (`keyforcarsStock.ts:197, 203`);
- nothing tracks goods on order.

### 6.2 Tables (module `kfc-inventory`)

| Table | Holds | Notes |
|---|---|---|
| `articles` | Master article: `code` (the label code, e.g. ALRK03), name nl/en, category, image, `purchase_price`, `ean[]`, `status` (held / on demand / discontinued) | One per physical product. `code` is unique. |
| `article_aliases` | `(shop_id, woo_product_id, woo_variation_id, sku) → article_id` | Takes care of the 1,704 cards for 1,542 SKUs and of remkeys |
| `locations` | Shelf and box | One warehouse for now. A `warehouse` column costs nothing. |
| `stock_levels` | `(article_id, location_id) → quantity` | May be negative. Kept up to date by a trigger on `stock_moves`. |
| `stock_moves` | Append-only: delta, quantity after, reason (`count`, `sale`, `return`, `received`, `correction`, `transfer`), source type and id, `batch_id`, `photo_path`, `created_by`, `idempotency_key` (unique) | Replaces `moves` |
| `count_batches` | Bulk count: id, `photo_sha256[]`, line count | A unique id makes re-sends harmless. Saved in one RPC, all lines or none (the package already behaves this way). |
| `purchase_orders`, `purchase_order_lines` | Ordered at supplier, expected date, received quantity | Lets the reorder list subtract "on order" |
| `product_profiles` | `code`, profile `jsonb`, `built_at` | Replaces the 5.5 MB file |
| `vehicle_fits` | `(code, make, model, from_year, to_year)` | Indexed, so "punto 2001" is a query, not a scan of the whole file |
| Storage bucket `stock-photos` (private) | Movement and count photos | Signed URLs only |

### 6.3 Porting

- The UI components (`KeyForCarsStock`, `StockBulkCount`, `ShelfLabel`, `StockLabel`, `ProfileSearch`, `ProductProfile`, `StockReorder`, `StockReports`) keep their props. Only the data calls change from `/api/admin/voorraad-local` to module routes that call `requireModule('inventory')` and role checks.
- **Bulk photo count.** Decoding stays in the browser (Web Workers, `zxing-wasm` 3.1.6 with its pinned SHA-256). The server receives counts and photo hashes only. The 200-photo limit, the duplicate-photo rule and the known limits stay: 7.5% missed labels in the dense test against a 2% target, and overlapping photos counted twice. Counts are therefore reviewed before saving, and they are not used as opening stock for dense shelves.
- **Labels.** Printing is client-side and needs no change. The URL in the QR is permanent once printed, so choose the domain before the first label (open question 4). Either `crm.klapsleutels.nl/p/ALRK03`, which needs no WordPress change, or `klapsleutels.nl/p/ALRK03` with a redirect rule on their WordPress. A scan without a login shows only the login page.
- **Profiles.** `build-profiles.mjs` becomes a weekly job that upserts `product_profiles` and `vehicle_fits` (Vercel cron or GitHub Action). It still reads only the public Store API. The EAN CSV import becomes an upload in the inventory settings.
- **Reorder fixes** (from the review):
  - uncounted products show "count first", never a quantity;
  - quantities already on order are subtracted;
  - out-of-stock days are not counted as "no demand".
- **Language.** The package's preview language switch becomes the install's real locale setting (nl, en, tr).

---

## 7. Users and roles (four workers)

| Role | Who | Sees | May change |
|---|---|---|---|
| `owner` | Owner | Everything in the install, including margin and purchase prices | Everything, including users, modules shown and settings |
| `kantoor` (office / finance) | Office worker | Orders, dashboard, revenue, purchase invoices, expenses, purchasing, reorder list, stock (read) | Purchase invoices, expenses, purchase orders, article prices and status. No user management. |
| `magazijn` (warehouse) | Warehouse worker | Stock, shelves, articles, profiles, labels, goods received, reorder list **without prices** | Counts (single and bulk), moves, shelf assignment, goods received, label printing. No prices, no finance. |
| `inpak` (picking and packing) | Picker | Orders to pick (lines, quantity, shelf), profiles and scanner search | Mark picked or packed, report a "not on shelf" problem (creates a count task). No stock edits beyond that, no prices. |

- **Enforcement.** Pages and API routes check the role through `crmSession.ts`, and RLS on the new tables checks `crm_role()` with the new role names. Purchase prices are excluded from the warehouse and picker views by **column-level** selection in server code and by a separate RLS-protected view, not just hidden in the UI.
- **Fewer roles?** With four people, `magazijn` and `inpak` can start as one role and be split later. Splitting later costs one migration and one config line.
- **Accounts.** Every account is personal. No shared logins, so "who counted this" can be answered.

---

## 8. Delivery phases, effort, costs, risks, legal

### 8.1 Phases

Effort is in working days for one developer working with Claude, and includes testing. These are rough estimates, not quotes.

| Phase | Content | Effort | Gate to start the next phase |
|---|---|---|---|
| **0. Decisions and hygiene** | Owner answers (section 9). Close the `PLATFORM-STRATEGY.md` §1 security items and revoke the old keys. Signed data processing agreement. Create the Supabase org/project (EU) and the Vercel project. Shop API keys created by the owner. | 2–3 + owner time | DPA signed, keys rotated |
| **1. Install skeleton** | Install config, module registry, proxy and `requireModule` guards, nav, crons, public-site fence, branding, roles, i18n layer, user management, `core` + `finance` migrations on a fresh project, staging project, release branch | 7–10 | A KeyForCars login sees only its modules, and all other routes return 404 (tested) |
| **2. Orders, read-only** | Backfill, webhooks, nightly reconcile, alerts, owner dashboard (orders, revenue excl. VAT, units, shop), sales per product, "do not reorder" list | 6–8 | Two weeks with reconcile mismatches at zero |
| **3. Inventory in Supabase** | Tables, port of the package, articles and aliases, labels, profiles and fits, bulk count, staged counting (fast sellers first) | 7–10 | Master article list agreed. Labels printed. |
| **4. Purchasing and margin** | Purchase orders, goods received, purchase invoices → prices, margin report, reorder with "on order" | 4–6 | Prices known for most revenue |
| **5. Stock deduction, then push (buy or build)** | Deduction from orders in shadow mode (record and compare, about 1 week). Then **either** connect Picqer (3–5 days) **or** build the absolute-quantity push per product with a rollback snapshot (8–12 days). The remkeys placeholder figures (484 products at 1,000) are fixed first. | 5–15 | Owner decision on buy vs build |
| **6. Extras** | Shop-side click collector, then attribution and click fraud on orders. AI shop assistant. Customer list. | Quoted per extra | Sold |

The base is roughly **6–9 weeks** of one developer's time, spread over 2–3 months because of counting and gates.

### 8.2 Running costs per month (KeyForCars install)

| Item | Estimate | Note |
|---|---|---|
| Supabase | ≈ $25 (own Pro org) or ≈ $10 (extra Micro project in our Pro org) | Pro is reported at $25/month with a $10 compute credit, and each project pays its compute. The per-project vs per-org billing differs between sources, so check [supabase.com/pricing](https://supabase.com/pricing) ([makerkit](https://makerkit.dev/blog/saas/supabase-pricing), third-party). A **separate org** costs more, but makes billing clean and allows handing the project over at exit. Recommended. |
| Supabase staging project | ≈ $10 | Can be paused between releases |
| Vercel | $0 extra seats. Usage within the Pro credit at their volume (estimate). | Pro is billed per developer seat (reported as $20), not per app user ([Vercel Pro docs](https://vercel.com/docs/plans/pro)). Hobby is not for commercial use. The number of projects per repo is limited by plan. |
| Domain | €0 for a subdomain of their own domain, otherwise about €10/year | |
| Mail (invites, password resets) | €0 on a small Resend plan | Supabase's built-in mail is rate-limited, so use custom SMTP |
| Picqer (only if bought) | ≈ €379 | Team plan, 3,000 orders included (third-party figure) |

Infrastructure without Picqer comes to about €40–60 a month. Our support and maintenance hours are the larger cost, and they belong in the monthly fee.

### 8.3 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Orders silently stop (webhook disabled, key revoked, hosting blocks us) | Medium | High (wrong numbers, later wrong stock) | Nightly reconcile, webhook status check, Telegram alert, a "last order received" time on the dashboard |
| An Autosleutel24 change breaks KeyForCars | Medium | Medium | Release branch, staging, smoke test, module-scoped code |
| A disabled module is reachable | Low | Low (empty database) | Proxy + `requireModule` + a test that walks every registry prefix |
| Stock push conflicts with remkeys' unknown feed or hand edits | High if push is built | High (oversell or hidden products) | Push only in Phase 5, per product, snapshot first, find the remkeys source first |
| Margin wrong because purchase prices are missing or stale | High | Medium | Show coverage %, print the formula, blank instead of zero |
| Photo count is wrong as opening stock | Medium | Medium | Review before save, manual counts on dense shelves, small daily counts |
| One developer unavailable | Medium | High | Runbook for the reconcile and alerts. Owner can fall back to WooCommerce admin. Decide the buy option early if on-call is not possible. |
| Scope creep ("also add X from your CRM") | High | Medium | Module list and prices agreed in writing. Each extra quoted. |

### 8.4 Legal: data processing agreement

We would store order data from KeyForCars's customers (at minimum order numbers, countries and email hashes, and possibly names and addresses) on their behalf. That makes us a processor under GDPR art. 28. The agreement can be a separate document or part of the main contract, but it has to spell out how the obligations are met, not only repeat the law ([Dirkzwager on IT contracts and personal data](https://www.dirkzwager.nl/kennis/artikelen/it-contracten-deel-13-verwerking-van-persoonsgegevens); [VAST article on DPAs](https://uploads-ssl.webflow.com/5dbb3e4ccdb0cf6cebb0de27/608efc44daac8b2403300a9e_VAST_The%20Data%20Lawyers_Artikel%20re%20DPAs.pdf)). The agreement should cover:
- the data categories (section 5.5) and the retention period;
- the sub-processors: Supabase (EU region), Vercel (EU function region; US company), Resend, Telegram for alerts (no personal data in alerts), and Anthropic only if the AI extra is bought;
- breach notification times;
- the security measures: personal accounts, RLS, encrypted keys, audit log;
- data export and deletion at the end of the contract;
- who may access their data on our side.

Have a lawyer check it. This plan is not legal advice. The main contract also needs: support hours and response times, what happens when the shops' data is wrong, liability for stock or order errors (cap it), and price changes.

---

## 9. Open questions for the owner (one line each)

1. Which language do the four workers read: Dutch, English or Turkish?
2. Order and stock connection: build it ourselves, or buy Picqer (about €379/month) and connect to it?
3. Where are the purchase prices today: supplier invoices, a WooCommerce field, or a spreadsheet?
4. Which address goes into the QR on the labels: `crm.klapsleutels.nl` or `klapsleutels.nl/p/…`?
5. Do they pack and print shipping labels from WooCommerce or a shipping tool (which one), or should our app do it?
6. Do bank-transfer orders on hold count as sales, and which status lowers stock?
7. Which extras do they want now: ad clicks, click fraud, AI shop assistant, customer list?
8. Whose name are the Supabase and Vercel accounts in (ours, billed on, or theirs), and who pays them?

---

## 10. References

Only official documentation and named sources. Vendor marketing claims are not treated as evidence. Prices from third-party sites are marked as such and must be checked on the vendor's own page before any quote.

- AWS, *SaaS Tenant Isolation Strategies*: silo, pool and bridge models. https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/saas-tenant-isolation-strategies.html · bridge model: https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/the-bridge-model.html · cost vs isolation: https://aws.amazon.com/solutions/guidance/multi-tenant-architectures-on-aws
- Supabase, *Managing environments*: separate projects per environment, migrations pushed from CI. https://supabase.com/docs/guides/deployment/managing-environments
- Supabase pricing (third-party summaries; they disagree on per-org vs per-project billing): https://makerkit.dev/blog/saas/supabase-pricing · https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/
- Vercel: one repo feeding several projects, env vars per project, project count per repo limited by plan. https://vercel.com/docs/monorepos/monorepo-faq · https://vercel.com/docs/concepts/projects/overview · Pro plan: https://vercel.com/docs/plans/pro
- WooCommerce REST API webhooks: signature header, auto-disable after 5 failures, 25 delivery logs kept. https://developer.woocommerce.com/docs/apis/rest-api/v3/webhooks/ · practical notes: https://hookdeck.com/webhooks/platforms/guide-to-woocommerce-webhooks-features-and-best-practices
- Picqer: plans scale with order volume, unlimited users and shops. https://picqer.com/en/pricing · reported prices (third-party): https://thecofounder.nl/leveranciers/picqer/ · https://www.capterra.com/p/219132/Picqer/ · fulfilment page with a listed price: https://picqer.com/en/fulfilment
- Odoo: per-user plans, all apps in Standard, multi-company and external API only in Custom, "One App Free". https://odoo.com/pricing · summary: https://www.capterra.com/p/135618/Odoo/pricing/
- Teamleader Focus: per-user plans plus "boosters" priced **per account**, not per user (€5–60/month, third-party list). https://www.teamleader.eu/pricing · https://pricingsaas.com/companies/teamleader · planning booster "price per account": https://www.teamleader.eu/solutions/planning
- WooCommerce stock-sync plugins (the cheap fallback): Stock Sync for WooCommerce (free, two stores) https://discover.commoninja.com/wordpress/plugin/stock-sync-for-woocommerce · Inventory Sync for WooCommerce (by SKU) https://discover.commoninja.com/wordpress/plugin/inventory-sync-for-woocommerce
- Processor agreements (Dutch legal articles; no Autoriteit Persoonsgegevens page was found in this search): https://www.dirkzwager.nl/kennis/artikelen/it-contracten-deel-13-verwerking-van-persoonsgegevens · https://uploads-ssl.webflow.com/5dbb3e4ccdb0cf6cebb0de27/608efc44daac8b2403300a9e_VAST_The%20Data%20Lawyers_Artikel%20re%20DPAs.pdf

**What the references suggest for pricing.** Odoo sells per user and makes the module catalogue nearly free. Teamleader sells per user and charges add-ons per account. For a 4-person customer, a flat monthly base per install plus flat per-module extras (Teamleader-style) is simpler to explain than per-user pricing. It also matches our cost structure, which is per install, not per user.

---

## 11. Corrections to earlier notes

- **Fresh replay tested on 18 Nov (local Supabase, branch `kfc/preview`).** It failed twice, then ran clean through `0088`. First, no migration creates `leads`: the live table was made by hand, and `0001` only alters it. Fixed with `0000_baseline_leads.sql` (`create table if not exists`). Second, `0054` dropped `jobs.gross_margin` while the `0052` view still read it. Fixed by dropping that view one step earlier; `0057` drops it anyway. Neither fix changes the live database.
- **The preview now shows the whole office CRM** (dashboard, leads, AI calls, calendar, customers, invoices, expenses, reports, ad clicks, click fraud), not the stripped version. The owner asked for "exactly like ours". It hides only our technician network and our public site.

- `concepts_brief.md` says the CRM refuses negative stock at `0048_erp_inventory_pim.sql:127`. That constraint belongs to `inventory_levels`, which `0056` dropped. The rule that applies today is `stock_items_quantity_check` in `0008_calendar_stock_templates.sql:73`. The conclusion is unchanged.
- Migration `0056` drops the 0048 tables and the columns that pointed at them (`job_materials.inventory_location_id`, `expenses.location_id`, lines 36 and 39), so a replay *may* succeed. It is still untested, and the plan does not depend on it.
