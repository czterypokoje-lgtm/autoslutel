# Autosleutel24 güncelleme notu (22 Kasım 2026)

Branch: `sync/kfc-2026-11-22` (repo `czterypokoje-lgtm/autoslutel`). Canlı `main` (8ea3557c) değişmedi.

## Ne geliyor

- Kod: KeyForCars CRM/ERP hattının tamamı (`keyforcars-crm` kfc/main 5bf49b22). Buna studio-shell, Autosleutel CRM/ERP (0109–0128), kasa (0129–0135) ve 21 Kasım işleri dahil.
- `studio/gesprekken-redesign`: içeriği zaten kfc hattında (daha yeni hâli). Ek değişiklik yok.
- `studio/inbox-channels` ve `studio/whatsapp-analyse`: içerikleri zaten burada.
- `claude/ads-conversion-upload`: alındı. Migration'ı **0109 → 0141** oldu (0109 numarası `my_open_offers`'a ait).
- Veritabanı: `supabase/as24_apply_0129-0141.sql`. Tek dosya, ya hep ya hiç.

## Günlük kullanımda ne değişir

Bu bölüm Vercel production'da `CRM_UI` ve `CRM_WAREHOUSE` **ayarlı değilken** geçerlidir (şu an production'da ikisi de yok, sadece preview'da var).

**Aynı kalanlar**
- Görünüm: eski CRM görünümü.
- Monteur menüsü.
- Kasa, depo, sipariş, etiket, sayım ve dönem kilidi ekranları kapalı kalır (404).

**Ofis menüsüne eklenenler**
- Conversies naar Google
- Verkoop & diensten
- WhatsApp-analyse
- Alle rapporten

**Gesprekken**
- Gelen kutusu: e-posta, WhatsApp, webchat ve web formu tek ekranda.
- Web formları artık burada da bir konuşma açıyor.
- Otomatik yanıt, `INBOX_AI_AUTO` ayarlanmadıkça kapalı.

**Google Ads dosyası (`/api/ads/conversions.csv`)**
- Artık sadece ofisin /admin/conversies ekranında onayladığı eşleşmeleri, KDV hariç, içeriyor.
- Production'da `ADS_FEED_PASSWORD` tanımlı değil, yani bu dosya şu an zaten kapalı (404). Bugün canlıda etkisi yok.

**Güvenlik**
- Monteurs ekranından sadece monteur girişleri silinebilir. Önceden herhangi bir ofis girişi, sahibinki dahil her hesabı silebiliyordu.
- 0135, anon anahtarın veritabanı fonksiyonlarını çalıştırma yetkisini kapatıyor. Canlı kodun RPC çağrıları ya service-role ya da giriş yapmış kullanıcıyla yapılıyor; halka açık katalog okuması (`product_overrides`) test edildi ve çalışıyor.

**Halka açık site**
- Google Ads etiketi sadece autosleutel24.nl'de ve /admin dışında yükleniyor.
- Fontlar artık sitenin kendisinden geliyor (Google Fonts isteği yok).

**Hata ekranı**
- Admin'de bir hata olursa menü yerinde kalıyor ve "tekrar dene" çıkıyor.

**`CRM_WAREHOUSE=1` açılırsa (sonraki adım, ayrıca karar verilir)**
- Kasa: iade, nakit hareketleri, Z-raporu. Kasa kodu ile 0136 birlikte gitmek zorunda; bu paket ikisini birlikte getiriyor.
- Ortalama maliyet.
- "Sadece toplanan gönderilir" kuralı (0138).
- Siparişi eksik kapatma.
- Dönem kilidi: bir tarih girilene kadar etkisiz.
- Para okuma: "1.500" = 1.500 €.

## Sizin yapacaklarınız (sırayla)

1. **Vercel → autoslutel → Settings → Environment Variables (Production):** `NEXT_PUBLIC_SUPABASE_URL` ve `storage_SUPABASE_URL` ikisi de `https://utctfircycpjmpjqmtmm.supabase.co` olmalı.
   - Yeni kurulum koruması bu adreslerin ikisine de bakıyor. Biri başka bir projeyi gösterirse CRM ve form API'leri durur.
   - Farklıysa deploy'dan önce bana söyleyin.
2. **Supabase (Autosleutel24 projesi):** yedek alın, sonra `supabase/as24_apply_0129-0141.sql` dosyasını **bir kez** SQL editöründe çalıştırın.
   - Yanlış veritabanında veya ikinci kez çalıştırılırsa hiçbir şey değiştirmeden durur.
   - Ardından probe'u tekrar çalıştırabilirsiniz; `missing` sütununda sadece `-` kalmalı.
3. **Deploy:** SQL'den **sonra** branch `main`'e alınır. Bunu ancak siz "main'e al / push et" dediğinizde yaparım.
4. Bayraklar (`CRM_UI=studio`, `CRM_WAREHOUSE=1`) daha sonra, birer birer açılır. Her biri yeniden build gerektirir.

## Ne doğrulandı, ne doğrulanmadı

**Doğrulandı**
- `tsc`.
- ESLint: değişen dosyalar temiz; `src` genelindeki 79 hata kfc/main'de de birebir aynı.
- Unit testler: 60/60.
- PGlite testleri: 51/51 + paket provası 2/2.
- `next build`: bayraksız ve `CRM_UI=studio CRM_WAREHOUSE=1` ile, ikisi de başarılı.
- SQL paketi, 0128'deki ve içinde veri (iş, lead, sayılmış stok) olan bir veritabanında prova edildi:
  - Mevcut satırlar değişmedi.
  - İkinci çalıştırma, KeyForCars benzeri, işi olmayan ve 0127'deki veritabanları reddedildi.
  - Şema ve yetkiler, migration'ları sırayla uygulanmış bir veritabanıyla birebir aynı.

**Doğrulanmadı**
- Ekranlar tarayıcıda, gerçek veritabanına karşı.
- Paketin gerçek Supabase'de çalışması.
- Vercel'deki Supabase adreslerinin değerleri.
- Elle oluşturulmuş (migration'da olmayan) fonksiyonlar üzerinde 0135'in etkisi.
