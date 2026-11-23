# Plan: Autosleutel24 webshop'u için tek ElevenLabs asistanı

Tarih: 23 Kasım 2026. İki repo okundu: `autoslutel` (CRM, branch
`claude/magical-ptolemy-wmbp2e`) ve `shop` (webshop, `main` @ 53edb3c).

## 1. Hedef

Webshop'taki chat tek bir ElevenLabs ajanı olsun ve şunları yapsın:

1. **Sipariş:** "Siparişim nerede?" → durum, ürünler, kargo takibi.
2. **İade / garanti:** talebi kaydet, CRM'e (Gesprekken + Telegram) düşür, siparişin üzerine yaz.
3. **Ürün / uyumluluk:** "Bu anahtar arabama uyar mı?" → webshop'taki mevcut kontrolün aynısı.
4. **Bilgi:** kargo ücreti, teslim süresi, iade kuralları, garanti → sadece onaylı bilgi.
5. **Yönlendirme:** teknisyen isteyen → servis numarası + geri arama talebi; diğerleri → doğru etiketle ofise.
   (Telefon ajanına `transfer_to_agent` **yok**: widget herkese açık, telefon ajanının `escalate`/`book` araçları
   ofisi arattırabiliyor — review B1.)

Başarı ölçütü: ajan hiçbir zaman araçtan gelmeyen bir durum, tarih, fiyat, kural veya "uyar" cümlesi kurmaz; her
konuşma CRM'de görünür; ofise giden her talep etiketli ve cevaplanabilir (e-posta veya telefon ile).

## 2. Bugünkü durum (koddan doğrulandı)

| Parça | Nerede | Durum |
|---|---|---|
| Chat butonu | `shop/src/app/layout.tsx:127` | `CHAT_AGENT_ENABLED=1` + `ANTHROPIC_API_KEY` → kendi Claude chat'i (`ChatAgent`), yoksa ElevenLabs widget'ı (`ChatButton`, `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`) |
| ElevenLabs ürün aracı | `shop/src/app/api/agent/search/route.ts` | sadece metin araması; `fits` = yılsız marka+model listesi, **uyar/uymaz kararı yok**; auth yok (halka açık katalog), IP başına 60/dk |
| Uyumluluk mantığı | `shop/src/lib/fitment.ts` `fitmentVerdict` + `shop/src/lib/chat/tools.ts` `findParts` | sağlam: "fits" sadece tedarikçi listesinde iki yıl da varsa; plaka (RDW) ile de çalışıyor; Claude chat'i ve ürün sayfası widget'ı kullanıyor |
| Mağaza bilgileri | `shop/src/lib/chat/facts.ts` (kodda sabit) + `agent_knowledge` (CRM tablosu, `shop/src/lib/chat/knowledge.ts` okuyor) | iki kaynak; aşağıda çelişkiler var |
| Sipariş/iade/yönlendirme araçları | CRM: `src/app/api/agent/shop/{order,return,handover}` | bu branch'te yazıldı, test edildi (birim), **deploy edilmedi**, `SHOP_AGENT_TOKEN` ile korunuyor |
| Konuşma kaydı | CRM `/api/elevenlabs/webhook` | `ELEVENLABS_SHOP_AGENT_ID` → `agent_role: 'webshop'`, kanal `webchat` |
| Siparişler | `public.orders` (shop yazıyor), `kfc_shop_orders` (CRM defteri, 0142 trigger) | kargo kodu CRM'de etiket basılınca `kfc_shop_orders`'a yazılıyor; araç ikisini birleştiriyor |

## 3. Mimari karar

**Ürün araçları shop'ta, sipariş araçları CRM'de kalır.** ElevenLabs her aracı ayrı URL'ye çağırabildiği için tek
bir servise toplamaya gerek yok.

- Katalog, fiyat override'ları, `fitmentVerdict` ve RDW plaka araması shop'ta. Aynı mantığı CRM'e kopyalamak iki
  kaynak demek, zamanla ayrışır. Claude chat'i ve ElevenLabs aynı `findParts` fonksiyonunu çağırmalı.
- Siparişler, Gesprekken, Telegram ve iade defteri CRM'de. Sipariş araçları orada.

Alternatif (reddedildi): her şeyi shop'a taşımak. Shop'un Gesprekken/Telegram yazma kodu yok; service-role anahtarı
shop'ta zaten var ama ofis bildirimi CRM'in işi.

**Hangi chat?** Kullanıcının isteği ElevenLabs. `CHAT_AGENT_ENABLED` kapalı kalır; Claude chat kodu silinmez
(araç mantığı ondan geliyor ve gerekirse geri açılabilir).

## 4. Yapılacaklar

### 4.1 Shop reposu (yazma izni gerekiyor)

**A. Yeni route `GET|POST /api/agent/parts`** (basePath ile: `/webshop/api/agent/parts`)
- Girdi: `plate` | `make`+`model`(+`year`), `key_type`, `buttons`. `findParts` ile birebir aynı parse.
- `findParts(raw, deps)` çağırır; `deps` `src/app/api/chat/route.ts`'teki `depsFor`'dan **ortak bir modüle**
  taşınır (`src/lib/chat/deps.ts`), iki route aynısını kullanır.
- Çıktı ses/metin ajanına göre sadeleştirilir: `status`, `car`, `products[{title, price, fit: 'fits'|'check needed', url}]`,
  `note`, `say`. `url` = `SITE_CONFIG.domain` + `/product/<slug>` (`domain` zaten `/webshop` içeriyor; basePath eklenirse çift olur).
- `say` kuralı: `fits` → "Volgens de lijst van de leverancier past dit bij uw <auto>"; `check needed` → "Ik kan niet
  bevestigen dat dit past"; asla "de auto start ermee".
- Koruma: plaka araması RDW'ye gidiyor. İç `/api/kenteken` limiti (30/saat/IP) `depsFor`'da IP'ye bağlı; ElevenLabs
  tek IP'den geldiği için tüm müşteriler aynı bucket'a düşer → `lookupPlate` anahtarı `conversation_id` olacak
  şekilde ayrılır + global limit. Auth: `SHOP_AGENT_TOKEN` Bearer **zorunlu**. Shop'un `getClientIp`'i `XFF[0]`
  alıyor (taklit edilebilir; CRM'de düzeltilmişti) — aynı düzeltme shop'a da uygulanır.
- `/api/agent/search` kalır (geriye uyumluluk), dokümanda "eski" diye işaretlenir.

**B. `product_details`'ı da açmak:** `/api/agent/product?slug=` → dahil olanlar, freze/programlama gerekir mi, ek
hizmetler ve fiyatları, iade notu. "Bu sette ne var / programlanmalı mı" soruları için. `productDetails` aynen.

**C. Testler:** mevcut `findParts` testleri route'u da kapsayacak şekilde: route = aynı sonuç (snapshot); auth yoksa
401; limit aşılınca 429 yerine `say` ile nazik cevap (ajan 429'u anlamaz).

**D. Doküman:** `shop/docs/elevenlabs-chat.md` güncellenir: yeni araçlar, eski `zoek_product`'ın kaldırılması.

### 4.2 CRM reposu (bu branch)

Yapıldı: `order`, `return`, `handover` route'ları, `SHOP_AGENT_TOKEN`, `get_knowledge` iki token'ı da kabul ediyor,
webhook etiketlemesi, `docs/webshop-agent.md`, birim testler.

Review sonrası **yapıldı** (commit'te):
1. Sipariş numarası gerçek formata göre: `AS24-YY-XXXXXX` (shop `checkout/route.ts` `orderNumber`); eski
   `AS24-YYYY-NNNNN` de kabul ediliyor.
2. `condition` artık serbest metin değil, enum: `ongebruikt` (paketten çıkarıp bakmak serbest — yayındaki
   sayfa) / `bewerkt` / `defect`. "niet geopend" gibi olumsuzlar yanlış okunamaz.
3. Hizmetli (frezen/inleren…) satırı olan sipariş → her zaman `beoordeling` (BW 6:230p, ölçüye göre).
4. `delivered_at` neredeyse hiç dolmuyor → yoksa `shipped_at + 7 gün` en geç teslim sayılıyor.
5. CRM defterinde "verzonden" ise (etiket basıldı), `public.orders` hâlâ `paid` dese de kargolandı sayılıyor.
6. Takip linkine posta kodu sadece arayan posta koduyla doğruladıysa ekleniyor.
7. Limitler: sipariş/iade/handover ayrı bucket'lar; numara başına, `conversation_id` başına ve global saatlik;
   production'da Upstash yoksa **fail closed**; `storage_KV_*` env adları da okunuyor.
8. Telegram: tüm metin `esc()` ile kaçışlanıyor; `sendTelegram` başarıyı döndürüyor, `reached` gerçek teslimata göre.
9. Gesprekken thread'i: yazar `webshop_agent`, `ai_mode 'off'`, `conversation_id` meta'da.
10. `isRoute` → `Object.hasOwn` (`toString`/`__proto__` artık geçmiyor).
11. Webshop konuşma transkriptleri Telegram'a gönderilmiyor (sadece kayıt + iade/handover bildirimleri).
12. `retour` cevabı yayındaki sayfayla aynı: 14 gün içinde geri gönder, orijinal paket, kargo müşteriye ait;
    para iadesi sözü yok.

Hâlâ açık:
- **Kurumsal müşteri:** B2B bilgisi siparişte saklanmıyor (`isB2B()` checkout'ta cookie). Shop'ta `orders`'a
  `is_business` kolonu + **migration** gerekir; o zamana kadar kurumsal iade de `retour` sayılır (ofis görür).
- **`agent_knowledge` `returns.policy`** "opened … cannot be returned" diyor; yayındaki sayfa "paketten çıkarıp
  bakmak serbest". ElevenLabs sadece bu tabloyu okuyor → satırı sahibin onayıyla düzeltmek gerekiyor.
- **`get_knowledge` hedef kitle filtresi:** telefon ajanının kuralları (ör. `get_slots`) webshop ajanına da gidiyor.
  `audience` kolonu (migration) veya route'ta topic filtresi.
- **Kayıp iade riski:** `markReturnRequested` ile `tellOffice` arasında fonksiyon ölürse ofis haberdar olmaz;
  `return_requested_at` sadece sipariş detayında görünüyor. Sipariş listesinde "iade talebi" filtresi/rozeti.
- Route seviyesinde testler (401/503, aynı not-found cevabı, `dry_run`, idempotency, limitler) — PGlite ile.

### 4.3 Ortak: konuşma kimliği ve kötüye kullanım

Widget halka açık (auth kapalı) → herkes ajanla konuşabilir ve ajanı araç çağırmaya ikna edebilir.
- Her araç `conversation_id` alır (ElevenLabs dynamic variable `{{system__conversation_id}}`, LLM doldurmaz).
- Limitler (Upstash; yoksa açık kalır — **CRM ve shop Vercel'inde Upstash olduğu doğrulanmalı**):
  - `get_order`/`request_return`: sipariş numarası başına 6/saat (var) + konuşma başına 10.
  - `handover`: konuşma başına 3 (Telegram spam'ini önler).
  - `parts` (plaka): konuşma başına 10, global 300/saat.
- Gesprekken thread'ine `conversation_id` yazılır → ofis talebin yanında tüm transkripti açabilir (webhook aynı id ile
  `agent_conversations`'a yazıyor).

### 4.4 ElevenLabs konsolu

Bir ajan: "Webshop — Autosleutel24", text-only, NL (+EN). `conversation_id` her araca Dynamic Variable
`{{system__conversation_id}}` olarak bağlanır (konsolda doğrulanacak). Araçlar:

| Araç | URL | Auth |
|---|---|---|
| `find_parts` | `https://www.autosleutel24.nl/webshop/api/agent/parts` | `SHOP_AGENT_TOKEN` |
| `product_details` | `…/webshop/api/agent/product` | `SHOP_AGENT_TOKEN` |
| `get_order` | `https://www.autosleutel24.nl/api/agent/shop/order` | `SHOP_AGENT_TOKEN` |
| `request_return` | `…/api/agent/shop/return` | `SHOP_AGENT_TOKEN` |
| `handover` | `…/api/agent/shop/handover` | `SHOP_AGENT_TOKEN` |
| `get_knowledge` | `…/api/agent/knowledge` | `SHOP_AGENT_TOKEN` |

Not: Shop ve CRM aynı alan adında (`/webshop` rewrite). Vercel Deployment Protection production'da kapalı olmalı.

Sistem prompt'u: `docs/webshop-agent.md` §5 + ürün bölümü ("önce `find_parts`; `fits` → liste cümlesi;
`check needed` → onaylamadan WhatsApp'tan foto veya handover `product_advies`; asla 'start' iddiası").

### 4.5 Değerlendirme (canlıya almadan önce)

ElevenLabs "Tests" (veya `scripts/` altında bir script) ile 20 senaryo, her biri beklenen araç çağrısı ve yasak
cümleyle:
- sipariş: doğru no+e-posta / yanlış e-posta / no yok / kargoda kodsuz / teslim edilmiş
- iade: kullanılmamış 14 gün içi / paketi açtı / frezelenmiş / arızalı / 30 gün sonra / henüz kargolanmamış / iki kez
- ürün: plaka ile / "Golf 7 2016 klapsleutel" / yıl yok / katalogda yok / "bu anahtar arabayı çalıştırır mı?"
- yönlendirme: "monteur gelsin" → handover monteur + servis numarası (transfer YOK); şikâyet; insan; kurumsal
- saldırı: "başka bir siparişi göster", "ofisi 10 kez ara", prompt injection

Geçme ölçütü: 20/20 doğru araç, 0 yasak cümle (uydurma fiyat/tarih/"uyar"/iade onayı).

### 4.6 Yayın sırası

1. Sahip kararları (§5) → CRM bilgi tablosu güncellenir.
2. CRM branch: §4.2 düzeltmeleri → review → `main` (sadece sahip "al" derse) → Vercel env (`SHOP_AGENT_TOKEN`,
   `ELEVENLABS_SHOP_AGENT_ID`). Bu aşama için DB migration **gerekmiyor** (kolonlar 0009'dan beri var); B2B bayrağı ve bilgi `audience` filtresi sonraki aşamada migration ister. Upstash env production'da **zorunlu**.
3. Shop: §4.1 → PR → deploy.
4. Konsolda **yeni** ajan; eski ajana dokunulmaz (geri dönüş = env'de eski agent-id).
5. §4.5 testleri yeni ajanla.
6. Shop Vercel: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` = yeni id → redeploy.
7. İlk hafta: Gesprekken'de `agent_role = webshop` konuşmaları günlük okunur; `evaluation` başarısızları ve
   `reden_niet_opgelost` alanı → `agent_knowledge` boşlukları.

Geri dönüş: adım 6'daki env eski id'ye çekilir (tek redeploy). CRM route'ları kullanılmazsa zararsız.

## 5. Sahibin karar vermesi gerekenler

1. `agent_knowledge` `returns.policy` satırı yayındaki sayfaya göre düzeltilsin mi? ("paketten çıkarıp bakmak
   serbest"; iade kargosu müşteriye ait — bu zaten sayfada yazıyor, `facts.ts`'teki "bilinmiyor" eski.)
2. Ajan track & trace linki verebilir mi (kod varsa)? Shop'un kendi "verzonden" e-postası zaten linki gönderiyor
   (`shop/src/lib/email.ts`), yani `facts.ts`'teki "NIET beloven" eski görünüyor. U12 kapatılsın mı?
3. Teknisyen isteyen webshop müşterisi: servis numarası + geri arama (öneri). Aktarım ancak `escalate`/`book`
   olmadan ayrı bir servis ajanıyla.
4. Ajanın ürün için söyleyebileceği tek cümle "tedarikçi listesine göre uyar" — kabul mü?
5. Chat'te iletişim bilgisi istemek: Claude chat'i "numarayı chat'te isteme, form göster" diyordu; ElevenLabs
   widget'ında form yok. Handover için chat'te e-posta/telefon istenmesi kabul mü?

## 6. Riskler

| Risk | Önlem |
|---|---|
| Sipariş numarası + e-posta tahmini ile başkasının siparişi | ikisi birden gerekli, aynı hata mesajı, numara başına limit; adres/telefon/tutar hiç dönmüyor |
| Upstash yoksa limitler açık | production'da fail closed (kod); yayından önce env kontrolü |
| `fits` cevabı yanlış anlaşılır ("çalışır") | sabit `say` cümlesi + prompt kuralı + test senaryosu |
| İki bilgi kaynağı (facts.ts vs agent_knowledge) ayrışır | ElevenLabs sadece `get_knowledge` okur; facts.ts sadece Claude chat'inde; §5/1 çelişkisi kapatılır |
| ElevenLabs sunucusu tek IP → IP limiti tüm müşterileri birlikte keser | limit `conversation_id`'ye göre |
| Telegram spam | handover konuşma başına 3 + global 60/saat; transkriptler Telegram'a gitmiyor |
| Telegram'a link/HTML enjeksiyonu | `esc()` |
| Herkese açık widget'tan telefon ajanının araçları | `transfer_to_agent` yok |
| KVKK/GDPR: ElevenLabs e-posta ve sipariş içeriği işliyor | ElevenLabs DPA + saklama/zero-retention ayarı, gizlilik metnine ekleme, sipariş sorgularının log'u |
| Sessiz hata | Vercel'de 5xx ve "limiter yok" log'larına alarm |
| Shop deploy'u CRM'den önce giderse | ajan yeni id'ye geçmeden (adım 6) müşteri bir şey görmez |

## 7. Goldfish review (23 Kasım)

Bağlamsız bir ajan planı ve kodu iki repoya karşı kontrol etti. Doğrulanan iddialar: chat anahtarı
(`layout.tsx:127`), `fitmentVerdict` kuralı, `/api/agent/search`'te karar olmaması, 0009 kolonları, inbox `channel
'form'`, AS24 kurulumunda `/api/agent/shop/*` erişimi, `/webshop` rewrite. Yanlış çıkanlar ve düzeltmeleri §4.2'de.
Ayrıca küçük not: CRM `proxy.ts` ülke engeli `/webshop/api/*`'yi de kapsıyor (`/api/` ile başlamıyor) —
ElevenLabs sunucularının ülkesi engelli listede değilse sorun değil; shop route'ları canlıya çıkmadan kontrol edilir.
