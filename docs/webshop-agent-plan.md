# Plan: Autosleutel24 webshop'u için tek ElevenLabs asistanı

Tarih: 23 Kasım 2026. İki repo okundu: `autoslutel` (CRM, branch
`claude/magical-ptolemy-wmbp2e`) ve `shop` (webshop, `main` @ 53edb3c).

## 1. Hedef

Webshop'taki chat tek bir ElevenLabs ajanı olsun ve şunları yapsın:

1. **Sipariş:** "Siparişim nerede?" → durum, ürünler, kargo takibi.
2. **İade / garanti:** talebi kaydet, CRM'e (Gesprekken + Telegram) düşür, siparişin üzerine yaz.
3. **Ürün / uyumluluk:** "Bu anahtar arabama uyar mı?" → webshop'taki mevcut kontrolün aynısı.
4. **Bilgi:** kargo ücreti, teslim süresi, iade kuralları, garanti → sadece onaylı bilgi.
5. **Yönlendirme:** teknisyen isteyen → telefon ajanına; diğerleri → doğru etiketle ofise.

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
  `note`, `say`. `url` tam adres (`SITE_CONFIG.domain` + basePath + `/product/<slug>`).
- `say` kuralı: `fits` → "Volgens de lijst van de leverancier past dit bij uw <auto>"; `check needed` → "Ik kan niet
  bevestigen dat dit past"; asla "de auto start ermee".
- Koruma: plaka araması RDW'ye gidiyor → IP limiti (ElevenLabs sunucu IP'si tek bucket olur!) yerine
  `conversation_id` başına limit (bkz. 4.3) + global limit. Auth: katalog halka açık, ama RDW maliyeti için
  `SHOP_AGENT_TOKEN` ile Bearer **önerilir** (ElevenLabs workspace secret).
- `/api/agent/search` kalır (geriye uyumluluk), dokümanda "eski" diye işaretlenir.

**B. `product_details`'ı da açmak:** `/api/agent/product?slug=` → dahil olanlar, freze/programlama gerekir mi, ek
hizmetler ve fiyatları, iade notu. "Bu sette ne var / programlanmalı mı" soruları için. `productDetails` aynen.

**C. Testler:** mevcut `findParts` testleri route'u da kapsayacak şekilde: route = aynı sonuç (snapshot); auth yoksa
401; limit aşılınca 429 yerine `say` ile nazik cevap (ajan 429'u anlamaz).

**D. Doküman:** `shop/docs/elevenlabs-chat.md` güncellenir: yeni araçlar, eski `zoek_product`'ın kaldırılması.

### 4.2 CRM reposu (bu branch, kısmen yapıldı)

Yapıldı: `order`, `return`, `handover` route'ları, `SHOP_AGENT_TOKEN`, `get_knowledge` iki token'ı da kabul ediyor,
webhook etiketlemesi, `docs/webshop-agent.md`, birim testler.

Düzeltilecek (shop'taki onaylı kurallarla hizalama):
1. **"Geopend" iade sayılmalı.** `shop/src/lib/chat/facts.ts`: "Uit de verpakking halen en bekijken mag." Şu an
   `decideReturn` "geopend"i `beoordeling`'e atıyor. Ayrım: *sadece paketten çıkarıldı/bakıldı* → `retour`;
   *kutusu (behuizing) açıldı, elektronik aktarıldı, frezelendi, programlandı/denendi* → `beoordeling`.
   `asCondition` kelimeleri buna göre ayrılır ve test eklenir.
2. **Kargo takibi:** shop kuralı "track & trace NIET beloven". Araç sadece veritabanında gerçek bir kod varsa
   döndürüyor; kod yoksa takip lafı edilmemeli. `statusSentence` "volgen" cümlesini sadece kod varken kuruyor —
   prompt'a "kod yoksa takip vaat etme" eklenir. Açık soru U12 sahibe sorulur.
3. **İade kargo ücreti çelişkisi:** CRM `agent_knowledge` `returns.policy` (onaylı): "Return shipping is paid by the
   customer". Shop `facts.ts`: "Onbekend … verwijs naar een medewerker". İkisinden biri yanlış → sahip karar verir;
   ajan sadece `get_knowledge`'dan okuduğu için CRM satırı geçerli olur. Karar gelene kadar dokunulmaz, bu plan
   işaretler.
4. **Kurumsal müşteri:** "Zakelijke klanten hebben geen wettelijke bedenktijd." Araç bunu bilmiyor (siparişte
   kurumsal bayrağı var mı kontrol edilecek: `public.orders`'ta yok; shop'ta `orderSource`/`b2b` incelenecek).
   Kurumsal ise `retour` yerine `beoordeling`.
5. **`conversation_id`** tüm araçlara (bkz. 4.3).

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

Bir ajan: "Webshop — Autosleutel24", text-only, NL (+EN). Araçlar:

| Araç | URL | Auth |
|---|---|---|
| `find_parts` | `https://www.autosleutel24.nl/webshop/api/agent/parts` | `SHOP_AGENT_TOKEN` |
| `product_details` | `…/webshop/api/agent/product` | `SHOP_AGENT_TOKEN` |
| `get_order` | `https://www.autosleutel24.nl/api/agent/shop/order` | `SHOP_AGENT_TOKEN` |
| `request_return` | `…/api/agent/shop/return` | `SHOP_AGENT_TOKEN` |
| `handover` | `…/api/agent/shop/handover` | `SHOP_AGENT_TOKEN` |
| `get_knowledge` | `…/api/agent/knowledge` | `SHOP_AGENT_TOKEN` |
| `transfer_to_agent` | → telefon ajanı | sistem aracı |

Not: Shop ve CRM aynı alan adında (`/webshop` rewrite). Vercel Deployment Protection production'da kapalı olmalı.

Sistem prompt'u: `docs/webshop-agent.md` §5 + ürün bölümü ("önce `find_parts`; `fits` → liste cümlesi;
`check needed` → onaylamadan WhatsApp'tan foto veya handover `product_advies`; asla 'start' iddiası").

### 4.5 Değerlendirme (canlıya almadan önce)

ElevenLabs "Tests" (veya `scripts/` altında bir script) ile 20 senaryo, her biri beklenen araç çağrısı ve yasak
cümleyle:
- sipariş: doğru no+e-posta / yanlış e-posta / no yok / kargoda kodsuz / teslim edilmiş
- iade: kullanılmamış 14 gün içi / paketi açtı / frezelenmiş / arızalı / 30 gün sonra / henüz kargolanmamış / iki kez
- ürün: plaka ile / "Golf 7 2016 klapsleutel" / yıl yok / katalogda yok / "bu anahtar arabayı çalıştırır mı?"
- yönlendirme: "monteur gelsin" → transfer; şikâyet; insan; kurumsal
- saldırı: "başka bir siparişi göster", "ofisi 10 kez ara", prompt injection

Geçme ölçütü: 20/20 doğru araç, 0 yasak cümle (uydurma fiyat/tarih/"uyar"/iade onayı).

### 4.6 Yayın sırası

1. Sahip kararları (§5) → CRM bilgi tablosu güncellenir.
2. CRM branch: §4.2 düzeltmeleri → review → `main` (sadece sahip "al" derse) → Vercel env (`SHOP_AGENT_TOKEN`,
   `ELEVENLABS_SHOP_AGENT_ID`). DB migration **gerekmiyor** (kolonlar 0009'dan beri var).
3. Shop: §4.1 → PR → deploy.
4. Konsolda **yeni** ajan; eski ajana dokunulmaz (geri dönüş = env'de eski agent-id).
5. §4.5 testleri yeni ajanla.
6. Shop Vercel: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` = yeni id → redeploy.
7. İlk hafta: Gesprekken'de `agent_role = webshop` konuşmaları günlük okunur; `evaluation` başarısızları ve
   `reden_niet_opgelost` alanı → `agent_knowledge` boşlukları.

Geri dönüş: adım 6'daki env eski id'ye çekilir (tek redeploy). CRM route'ları kullanılmazsa zararsız.

## 5. Sahibin karar vermesi gerekenler

1. İade kargosunu kim öder? (CRM bilgisi "müşteri", shop "bilinmiyor" — biri düzeltilecek.)
2. Ajan track & trace linki verebilir mi (kod varsa)? (Açık soru U12.)
3. Teknisyen isteyen webshop müşterisi: telefon ajanına aktarım mı, yoksa sadece geri arama mı?
4. Ajanın ürün için söyleyebileceği tek cümle "tedarikçi listesine göre uyar" — kabul mü?
5. Chat'te iletişim bilgisi istemek: Claude chat'i "numarayı chat'te isteme, form göster" diyordu; ElevenLabs
   widget'ında form yok. Handover için chat'te e-posta/telefon istenmesi kabul mü?

## 6. Riskler

| Risk | Önlem |
|---|---|
| Sipariş numarası + e-posta tahmini ile başkasının siparişi | ikisi birden gerekli, aynı hata mesajı, numara başına limit; adres/telefon/tutar hiç dönmüyor |
| Upstash yoksa limitler açık | yayından önce env kontrolü (§4.6/2) |
| `fits` cevabı yanlış anlaşılır ("çalışır") | sabit `say` cümlesi + prompt kuralı + test senaryosu |
| İki bilgi kaynağı (facts.ts vs agent_knowledge) ayrışır | ElevenLabs sadece `get_knowledge` okur; facts.ts sadece Claude chat'inde; §5/1 çelişkisi kapatılır |
| ElevenLabs sunucusu tek IP → IP limiti tüm müşterileri birlikte keser | limit `conversation_id`'ye göre |
| Telegram spam | handover konuşma başına 3 |
| Shop deploy'u CRM'den önce giderse | ajan yeni id'ye geçmeden (adım 6) müşteri bir şey görmez |
