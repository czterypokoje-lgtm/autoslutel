# KeyForCars → yeni CRM/ERP geçiş analizi

_21 Kasım 2026 · salt okunur analiz, hiçbir şey değiştirilmedi_

## Kısa sonuç

1. **Kod hazır.** `autosleutel-crm-erp`, `keyforcars-crm`'nin her şeyini içeriyor ve daha yeni. KeyForCars'a özel kaybolacak bir özellik yok. Tek "eksik" görünen şey (WooCommerce iade senkronu), crm-erp'de daha iyi bir sürümle var.
2. **Veritabanı yolu temiz.** KeyForCars'ın 106 migration'ının hepsi crm-erp'dekilerle **birebir aynı**. KeyForCars veritabanı **0105'te**. Eksik olan 24 migration (0104z, 0106–0128), Autosleutel24'e bugün sorunsuz uygulanan SQL'in aynısı.
3. **Gizleme sunucu tarafında çalışıyor**, ama liste eksik. WhatsApp, klikfraude, leads, jobs ve agenda sayfaları ile teknisyen API'leri KeyForCars'ta **hâlâ açık**.
4. **Barkod 6 ekranda var.** Picking, sevkiyat, fatura/satış ve iade ekranlarında yok.
5. **Ürün ve stok verisini göremedim.** Bunun için KeyForCars'ın service-role anahtarı gerekiyor (Vercel vermiyor).

---

## 1. Kod karşılaştırması

| | keyforcars-crm (`kfc/main`) | autosleutel-crm-erp |
|---|---|---|
| Son commit | 20 Kas 2026 | 21 Kas 2026 |
| Migration | 0001–0105 (106 dosya) | 0001–0128 (130 dosya) |
| Ortak migration'lar | **106/106 birebir aynı** | |
| `src` farkı | 324 satır sadece KFC'de | ~5.000 satır sadece crm-erp'de |

- KFC'nin son commit'leri (ürün profilleri, picklijst/inkoop başlıkları, depo kodları) crm-erp'de **aynı ya da daha yeni** hâliyle mevcut.
- `src/lib/kfcWoo.ts`: KFC, Woo iadelerini sipariş özetinden kaydediyor. crm-erp her iadenin **detayını** çekiyor ve `modified_at`'i tarih olarak karşılaştırıyor. crm-erp'deki sürüm daha doğru.
- **Sadece KFC'de olanlar** uygulama değil, yardımcı dosyalar:
  - `deploy/keyforcars-openclaw`, `deploy/keyforcars-ollama`, `deploy/keyforcars-demo` (AI ajanı ve demo kurulum)
  - `scratch/*` (ürün ve aksesuar scraper'ları, fotoğraf işleme scriptleri)

  Bunlar taşınırken ayrı bir klasöre kopyalanabilir. CRM'in çalışması için gerekli değiller.

## 2. KeyForCars veritabanı

- Proje: `lzdwxkhlscsitstxdgar` (Vercel projesi `keyforcars-crm`)
- **Durum: 0105'e kadar uygulanmış.** 0100–0105 tabloları var, 0106 ve sonrası yok (sonda ile doğrulandı).
- **Uygulanacaklar (24):** `0104z`, `0106`–`0128`.
  - `0104z` sadece eski 0062 tablo şekli varsa çalışıyor. KFC'de bu şekil yok, yani zararsız (no-op).
- **Güvenlik:** public anon anahtarı ile `inbox_*`, `sales_invoices` vb. **0 satır** görüyor, `kfc_articles`, `kfc_shop_orders` ve `kfc_customers` ise 401 dönüyor. RLS çalışıyor, sızıntı yok.
- **Yapılamadı:** ürün ve satır sayıları, barkod/EAN kalitesi (eksik veya tekrarlanan barkodlar), stok bakiyeleri. **KeyForCars service-role anahtarı gerekiyor.**

## 3. Stok giriş-çıkış ve barkod haritası

Stok hareket tipleri (`src/lib/keyforcarsStock.ts`): **Telling** (sayım), **Ontvangst** (mal kabul), **Uitgifte** (çıkış), **Verkoop** (satış), **Retour** (iade), **Verplaatsing** (transfer), ayrıca montaj ve düzeltme.

| Akış | Ekran | Barkod | Nasıl |
|---|---|---|---|
| Stok hareketi (6 tip) | Voorraad | ✅ | Kamera (`StockCamera`, zxing-wasm) + arama |
| Toplu sayım | Voorraad → Bulktelling | ✅ | Fotoğraflardan barkod okuma (web worker) |
| Mal kabul (satın alma) | Inkoop | ✅ | El tarayıcısı (yaz + Enter). Bilinmeyen EAN → hızlı ürün oluşturma |
| Montaj | Voorraad → Montage | ✅ | El tarayıcısı |
| Sipariş parçaları | Bestellingen → [sipariş] | ✅ | El tarayıcısı ile parça onayı |
| Etiketler | Voorraad | ✅ | Raf ve stok etiketi (barkod + QR) |
| **Picklijst** | Bestellingen → Picken | ❌ | Sadece liste ve butonlar |
| **Sevkiyat** | Verzending | ❌ | |
| **Satış faturası** | Facturen | ❌ | Ürün satırı barkodla eklenemiyor |
| **Webshop iadesi → stok** | Orders / Woo | ❌ | İade tutarı kaydediliyor, stoğa otomatik geri giriş yok |

**Eksik:** tek bir ortak tarayıcı bileşeni (kamera + el tarayıcısı) ve bunun picking, sevkiyat, satış faturası ve iade ekranlarına eklenmesi.

## 4. KeyForCars'ta kapatılması gerekenler

`CRM_INSTALL=keyforcars` için `installServes()` gerçek kodla test edildi:

| Durum | Yollar |
|---|---|
| ✅ Zaten 404 | `/admin/monteurs`, `/admin/vandaag`, `/admin/mijn-*`, `/admin/aanbod`, `/admin/biedingen`, `/admin/netwerk`, `/admin/kas`, `/admin/tarieven`, `/api/ads`, `/api/leads`, `/api/elevenlabs`, `/api/telegram`, Autosleutel24 cron'ları |
| ❌ **Hâlâ açık: sayfalar** | `/admin/whatsapp-advertenties`, `/admin/whatsapp-analyse`, `/admin/klikfraude`, `/admin/attributie`, `/admin/live`, `/admin/leads`, `/admin/jobs`, `/admin/agenda`, `/admin/kantoor`, `/admin/bot-conversations` |
| ❌ **Hâlâ açık: API'ler** | `/api/admin/whatsapp-quotes`, `technicians`, `invite-technician`, `jobroom`, `offers`, `jobs`, `leads`, `monteurtarieven` |
| ⚠️ Bilerek açık | `/api/webhooks` (Meta WhatsApp + Resend), `/api/woo`, `/api/cron/kfc-reconcile`, `/api/agent/workshop` |

- **Hata:** gizli sayfaların API'leri açık kalıyor. Örneğin `/admin/monteurtarieven` 404 veriyor ama `/api/admin/monteurtarieven` açık. Gizleme listesi `/api/admin/...` karşılıklarını kapsamıyor. Bu API'ler giriş istiyor, ama yine de kapatılmalı.

## 5. Önerilen geçiş planı

1. **Ayrım koruması (önce bu).** Uygulama açılırken Supabase proje referansı `CRM_INSTALL` ile eşleşmiyorsa başlamasın: `keyforcars` ↔ `lzdwxkhlscsitstxdgar`, `autosleutel24` ↔ `utctfircycpjmpjqmtmm`. Bugün bir kez yanlış veritabanına bağlanıldı.
2. **Gizleme listesini tamamlamak.** Bölüm 4'teki açık sayfalar ve API'ler eklenecek, gizli her sayfanın `/api/admin/...` karşılığı da kapatılacak.
3. **KeyForCars veritabanı:** Supabase'de yedek alınacak, sonra `0104z` + `0106`–`0128` tek işlem (all-or-nothing) olarak çalıştırılacak. Autosleutel24 için kullanılan dosya ile aynı SQL, sadece `0104z` başa eklenecek.
4. **Dağıtım:** Vercel projesi `keyforcars-crm`, `crm-erp` kodundan `CRM_INSTALL=keyforcars` ile deploy edilecek. Bu önizleme ile denenecek, sonra canlıya alınacak.
5. **Barkod her yerde:** ortak tarayıcı bileşeni yazılıp picking, sevkiyat, satış faturası ve iade ekranlarına eklenecek. Woo iadesinde ürünün stoğa geri girişi için bir seçenek eklenecek.
6. **Veri kontrolü (service key ile):** ürün sayısı, barkodu eksik veya tekrarlanan ürünler, negatif stoklar. Gerekirse bir sayımla açılış stoğu girilecek.

## 6. Senin vermen gereken kararlar

1. **KeyForCars service-role anahtarı:** Supabase → proje `lzdwxkhlscsitstxdgar` → Settings → API Keys. Veri kontrolü için gerekli.
2. **Stokta asıl kaynak:** WooCommerce mu, CRM mi?
3. **Atölye (workshop):** KeyForCars'ta atölye takvimi (0104) ve ElevenLabs atölye ajanı (`/api/agent/workshop`) var. "Sadece mağaza" dediğine göre bunlar da kapatılsın mı?
4. **Gesprekken (e-posta + form gelen kutusu):** WhatsApp kapanınca e-posta ve form mesajları için kalsın mı?
5. **Tarayıcı donanımı:** USB/Bluetooth el tarayıcısı mı, telefon kamerası mı, ikisi de mi?
6. **Geçiş zamanı:** canlı mağaza ve webshop sırasında kısa bir satış dondurma kabul edilebilir mi?
