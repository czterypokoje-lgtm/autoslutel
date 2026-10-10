# autosleutel24.nl — SEO Audit & Lokal Görünürlük Planı

Tarih: 9 Ekim 2026 · Branch: `claude/fervent-cannon-83tj9h`
Kapsam: tam site SEO denetimi + lokal görünürlük (GBP post) planı + "tüm bölgelerde aktif olma" yol haritası

---

## 0. Bu denetim neye dayanıyor, neye dayanmıyor

**Kullandığım kaynaklar**
- Repo'nun tamamı: `src/app` (90+ route), `src/config/cities.ts` (75 şehir), `brands.ts` (48 marka),
  `diensten.ts` (17 hizmet), `services.ts` (27 blog), `sitemap.ts`, `robots.ts`, `thinPages.ts`,
  `LocalBusinessSchema.tsx`, `site.config.ts`.
- Kodun içine yazılmış **gerçek Search Console verileri** (yorum satırlarında kayıtlı; aşağıda
  tek tek kaynak gösterdim). Bunlar tahmin değil, export edilmiş rakamlar.

**Kullanamadığım kaynaklar — bunları bilerek boş bıraktım, uydurmadım**
| Eksik | Neden | Sonuç |
|---|---|---|
| Canlı site (`www.autosleutel24.nl`) | Bu oturumun ağ politikası host'u reddetti | Render edilmiş HTML, Core Web Vitals ve gerçek `<title>` çıktılarını doğrulayamadım. On-page bulgular **koddan** çıkarıldı — kaynak doğru ama canlı doğrulama yapılmadı. |
| Ahrefs / Semrush / Similarweb | MCP sunucuları bu oturumda bağlanamadı (proxy 403) | Arama hacmi ve KD skorları yok. Fırsat tablosunda **gerçek GSC impression'ları** ve `cities.ts`'deki kendi hacim tahminlerinizi kullandım; ikisini karıştırmadım. |
| Google Search Console (canlı) | Erişim yok | Kodda kayıtlı Jul–Sep 2026 export'u ile sınırlıyım. |
| Google Business Profile / Maps Insights | Erişim yok | Lokal bölümdeki her şey yapısal analiz; performans ölçümü LocalFalcon raporlarınız gelince yapılacak. |
| **LocalFalcon** | Siz göndereceksiniz | §9 bu raporlar için ayrılmış. §10'da tam olarak hangi formatta göndermeniz gerektiğini yazdım. |

Ağ erişimini açmak isterseniz: oturum başlığındaki cloud environment menüsü → Edit → Network
access. `www.autosleutel24.nl`'i Allowed domains'e eklerseniz canlı doğrulamayı da yaparım.

---

## 1. Yönetici özeti

**En büyük gücünüz:** teknik SEO tabanı bu sektör için olağanüstü iyi. Dinamik sitemap +
image-sitemap, IndexNow entegrasyonu, `llms.txt`/`llms-full.txt`, AI bot izinleri, gerçek
per-URL `lastmod` yönetimi (`contentDates.ts`), thin page'ler için bilinçli `noindex`
stratejisi, AdsBot'un bloke edildiği gerçek bir bütçe kaybına dayanan robots kuralı,
`aggregateRating`'i Google'ın kendi kuralı gereği bilerek **kaldırmış** olmanız — bunlar
danışman işi değil, operatör işi. Taban sağlam.

**Ama lokal tarafta bir yapısal tavan var ve "tüm bölgelerde aktif olmak" hedefi şu anda
bu tavana çarpıyor.** Üç sayı bunu anlatıyor:

1. **Tek bir Google Business Profile var, Bussum'da.** Kuş uçuşu: Rotterdam 61 km,
   Den Haag 63 km, Nijmegen 68 km, Maastricht 162 km. Local pack'te proximity (yakınlık) en güçlü faktördür ve
   service-area business'ta **değiştirilemez** — post atmak bunu çözmez.
2. **10 Google yorumu var** (`site.config.ts: reviewCount: '10'`). Rotterdam'daki bir
   rakibin 150 yorumu varsa, Rotterdam'da hiçbir on-page çalışması sizi local pack'e
   sokmaz. Bu, elinizdeki **en yüksek kaldıraçlı ve en az kullanılmış** kalem.
3. **75 şehir sayfasının 71'i aynı 3×3×3 şablondan üretiliyor** (`CitySeoText.tsx`) —
   yani 27 olası metin kombinasyonu, 71 sayfa. Sadece şehir adı değişiyor. Utrecht,
   Amsterdam, Den Haag, Rotterdam'ın elle yazılmış metni var; diğerlerinin yok.

**Hollanda'da Google çilingir/anahtar reklamlarını tamamen yasaklıyor** (robots.ts'de
doğru şekilde not edilmiş). Yani bu iş için organik + local pack **tek kanal**. Bu,
aşağıdaki işi "iyi olur" kategorisinden çıkarıp "tek büyüme yolu" kategorisine koyuyor.

**Genel değerlendirme: güçlü teknik taban, kritik lokal boşluk.**

**En yüksek etkili 3 öncelik**
1. **Yorum motoru** — 10 → 150+ yorum, şehir adı geçen metinlerle, 6 ayda. Lokal
   sıralamada yapabileceğiniz tek en büyük hamle.
2. **Teknisyen GBP ağı** — her bağımsız teknisyen kendi adresinde kendi GBP'sine sahip
   olur. `technicians.gbp_url` alanı zaten var (migration 0058), yani mimari hazır.
   Proximity problemini **meşru** şekilde çözmenin tek yolu bu.
3. **Şehir sayfalarının şablondan çıkarılması** — 71 sayfanın near-duplicate olmaktan
   çıkıp gerçek lokal içerik taşıması. Bunlar GBP post'larınızın ineceği landing
   sayfaları; ikisi birlikte çalışır.

---

## 2. Kritik bulgu: "tüm bölgelerde aktif olmak" ne demek, ne demek değil

Hedefi iki ayrı hedefe bölmek zorundayız, çünkü mekanikleri tamamen farklı.

### A) Organik sıralama (klasik mavi link, `/steden/<şehir>`)
Buna coğrafi sınır yok. İçerik, link ve otorite işi. **Bugün başlanabilir.** Nijmegen'de
organik 1. sıraya çıkmanız için Nijmegen'de ofis gerekmez.

### B) Local pack / Maps (3-pack, LocalFalcon'un ölçtüğü şey)
Buna coğrafi sınır **var** ve bu sınır serttir:
- Google service-area business'ı **tek bir noktadan** ölçer (sizin durumda Bussum).
- Grid'in merkezinden uzaklaştıkça sıralama düşer. 75 km'lik `serviceArea` yarıçapı
  schema'da yazılı olsa da **Google bunu sıralama sinyali olarak kullanmaz** — sadece
  "nereye hizmet veriyor" bilgisi.
- Maastricht/Venlo/Heerlen için local pack'te görünmenin **meşru** tek yolu: orada
  gerçekten konuşlanmış, kendi KvK'sı olan bir teknisyenin kendi GBP'si.

**Yapmayacağımız şey:** personelin olmadığı adrese GBP açmak. Çilingir/anahtar kategorisi
Google'ın en sıkı denetlediği dikeylerden biri; yakalanırsa tek profili değil tüm hesabı
kaybedersiniz. Reklam kanalı zaten kapalı olduğu için GBP suspension = kanal kaybı demek.
Bu riski almaya değmez ve zaten gerekmiyor — teknisyen ağı modeli aynı sonucu meşru verir.

### Bugünkü coğrafi durum

| Bölge | Şehir sayfası | GBP kapsamı | Local pack'te şansınız |
|---|---|---|---|
| Noord-Holland (Gooi, Amsterdam) | 17 | Bussum GBP, 0–48 km | **Güçlü** — buraya yatırım en hızlı döner |
| Utrecht | 25 | 11–39 km | **Orta-iyi** |
| Flevoland (Almere, Lelystad) | 2 | 11–34 km | **Orta** |
| Zuid-Holland (Rotterdam, Den Haag) | 12 | 38–74 km | **Zayıf** — teknisyen GBP şart |
| Gelderland (Arnhem, Nijmegen, Apeldoorn) | 11 | 32–84 km | **Zayıf** — teknisyen GBP şart |
| Noord-Brabant (3 şehir) | `noindex` | 83–95 km, yok | **Yok** |
| Limburg (5 şehir) | `noindex` | 122–164 km, yok | **Yok** |

Son iki satır dikkat: `thinPages.ts` bu 8 şehri bilinçli olarak `noindex` yapmış, çünkü
"van'ın gitmediği şehrin sayfası tanım gereği doorway page". **Bu karar doğruydu.**
"Tüm bölgelerde aktif olmak" istiyorsanız sıra şu olmak zorunda: **önce teknisyen, sonra
sayfa.** Tersi Google'a yalan söylemek olur ve 2026'da bu ucuza gelmiyor.

---

## 3. On-page bulgular

| Sayfa | Bulgu | Önem | Düzeltme |
|---|---|---|---|
| 71 şehir sayfası (`CitySeoText.tsx`) | 3×3×3 = 27 metin kombinasyonu, 75 sayfaya dağıtılmış. Sadece `{city}` değişkeni değişiyor. Utrecht/Amsterdam/Den Haag/Rotterdam hariç hiçbirinde özgün gövde metni yok. | **Kritik** | P1 şehirler için elle yazılmış metin (§7'de plan). P2'ler için: `localFact` + `commonJob` + `popularBrands` + `subAreas` alanları zaten dolu — şablonu bu alanlar etrafında yeniden kurup gerçek varyasyon üret. |
| 12 şehir sayfası, `nlSearches: 0` | Veenendaal, Delft, Schiedam, Vlaardingen, Capelle a/d IJssel, Spijkenisse, Wageningen, Barneveld, Harderwijk, Doetinchem, Zutphen, Tiel — hacim verisi yok, `noindex` listesinde de değil, yani indexlenmiş durumda. | **Yüksek** | Ya teknisyen kapsamı doğrulanıp gerçek içerik yazılır, ya `thinPages.ts`'e eklenir. Aradaki durum (şablon + hacim yok + index) en kötü seçenek. |
| Şehir `<title>` (`cityTitle()`) | 75 başlık aynı kalıpta: `Autosleutel Bijmaken {Şehir} \| 30-60 Min`. 60 karakter disiplini doğru, ama hiçbir başlık farklı bir intent'i hedeflemiyor. | Orta | P1 şehirlerde intent'e göre ayır: Amsterdam → "Keyless & Smart Key", Rotterdam → "Alle Sleutels Kwijt", Nijmegen → "Goedkoper dan Dealer" (her biri o şehrin `commonJob`'ı ile uyumlu, veri zaten elinizde). |
| `LocalBusinessSchema.tsx` | `areaServed` elle tutulmuş 29 şehirlik liste; `CITIES`'teki 75 şehirle ve gerçek teknisyen kapsamıyla senkron değil. Alphen aan den Rijn gibi "GBP'de henüz yok" şehirler yorum satırıyla açıklanmış. | Orta | `areaServed`'i `CITIES.filter(c => !isNoindexCity(c.slug))`'dan üret. Tek doğruluk kaynağı olur, elle senkron derdi biter. |
| `LocalBusinessSchema.tsx` | Tüm sitede tek bir `LocalBusiness` node'u, Bussum koordinatıyla. Şehir sayfalarında o şehre özel bir node yok. | Orta | Şehir sayfasına o şehrin `geo`'su ile `Service` + `areaServed: City` node'u ekle (`getBaseLocalBusinessSchema` zaten var, genişletilebilir). Ana `LocalBusiness` @id tek kalmalı. |
| `site.config.ts` | `reviewCount: '10'`, `rating: '5.0'` | **Yüksek** (SEO'dan çok iş riski) | §8'deki yorum motoru. 5.0/10 ile 4.8/180'e karşı local pack'te şansınız yok. |
| `site.config.ts` | `btw: 'NL42123555B01'` ve `iban: 'NL00BANK0123456789'` placeholder. BTW numarası KvK numarasının etrafına "NL"+"B01" eklenerek uydurulmuş — Belastingdienst numaraları böyle verilmiyor. Kod `isBtwConfigured()` ile faturaya basılmasını engelliyor (doğru), ama `vatID` schema'ya **giriyor**. | **Yüksek** | Gerçek BTW numarasını gir, yoksa `vatID`'yi schema'dan çıkar. Başkasının numarası structured data'da sizin problemi. |
| Blog (27 yazı) | `/blog/` AdsBot'tan bloke (doğru karar, €86,82/€274,53 boşa gitmişti, 0 dönüşüm). Ama organik tarafta blog→şehir sayfası iç linklemesi zayıf. | Orta | Her blog yazısının sonuna ilgili şehir/hizmet sayfası bloğu. Blog trafiği zaten var, dönüşüm sayfasına akmıyor. |
| Genel | `og-image.png` tüm core sayfalarda ve tüm blog yazılarında aynı. | Düşük | En azından P1 şehirler ve ilk 10 blog için ayrı OG görseli — GBP post ve sosyal paylaşımda CTR'ı doğrudan etkiler. |

---

## 4. Anahtar kelime fırsat tablosu

İki ayrı sütun var ve karıştırmıyorum:
**GSC** = kodda kayıtlı gerçek Search Console export'u (Jul–Sep 2026).
**Tahmin** = `cities.ts`'deki kendi hacim tahminleriniz (kaynağı doğrulanmadı).

| # | Anahtar kelime | Veri | Mevcut pozisyon | Intent | Fırsat | Önerilen aksiyon |
|---|---|---|---|---|---|---|
| 1 | `autosleutel laten maken` + 212 varyant | **GSC: 17.314 impr.** | pos 47 | Transactional | **Çok yüksek** | `/autosleutel-laten-maken` var ama pos 47. Sitenin en büyük tek fırsatı — pillar sayfaya dönüştür, 2.000+ kelime, fiyat tablosu, marka matrisi, FAQ schema. |
| 2 | `sleutelmaker` / `slotenmaker` ailesi | **GSC: 1.299 impr.** | `sleutelmaker` pos 10 | Commercial | **Çok yüksek** | Reklam yasak olduğu için organik tek kanal. `/mobiele-sleutelmaker` + `/diensten/auto-slotenmaker` güçlendir; pos 10 → pos 3 en ucuz kazanç. |
| 3 | `autosleutel kopieren` | **GSC: 798 impr.** | sayfa yeni | Transactional | **Yüksek** | Sayfa açıldı (404'tü). 8 hafta izle, pozisyon 15'in altına inmezse içerik derinleştir. |
| 4 | `autosleutel gestolen` | **GSC: 612 impr.** | pos 50 | Informational→Trans. | **Yüksek** | Sayfa var, pos 50. Aciliyet + polise bildirim + sigorta akışı + "eski sleutel dijital bloke" — hiçbir rakip bunu düzgün yazmıyor. |
| 5 | `autosleutel bijmaken in de buurt` | **GSC: en iyi CTR** | pos 8,4 | Local/Trans. | **Yüksek** | Lokal sorguların en iyi CTR'ı. Sayfa + GBP post'ları buraya bağla; `NearestCity` komponenti zaten var. |
| 6 | Renault `sleutelkaart` sorguları | **GSC: ~425 impr., 0 klik** | sayfa yeni | Transactional | Orta-yüksek | 0 klik = başlık/description sorunu. Meta'yı "Renault Sleutelkaart Kwijt? Ter Plaatse Nieuw — €125" gibi fiyatlı yaz. |
| 7 | `autosleutel bijmaken amsterdam noord` | **GSC: 175 impr.** | pos 12,6 | Local | Orta-yüksek | Sayfa açıldı. Amsterdam'ın tek gerçek talep gösteren ilçesi — diğer ilçeler `noindex`, doğru karar. |
| 8 | `autosleutel programmeren amsterdam` | Tahmin: 1.320 | — | Local/Trans. | **Çok yüksek** | Elle yazılmış metni var. Asıl darboğaz GBP proximity + yorum, içerik değil. |
| 9 | `autosleutel programmeren rotterdam` | Tahmin: 1.100 | — | Local/Trans. | **Çok yüksek** | Metni var. 61 km → teknisyen GBP olmadan local pack imkansız. |
| 10 | `autosleutel programmeren den haag` | Tahmin: 850 | — | Local/Trans. | **Yüksek** | Aynı: içerik tamam, coğrafya eksik. |
| 11 | `autosleutel programmeren utrecht` | Tahmin: 480 | — | Local/Trans. | **Yüksek** | Çekirdek bölge + elle yazılmış metin. En hızlı dönen şehir. |
| 12 | `autosleutel programmeren arnhem` | Tahmin: 450 | — | Local/Trans. | Orta-yüksek | Şablon metin. Elle yazılacak ilk P1 adayı. |
| 13 | `autosleutel programmeren nijmegen` | Tahmin: 410 | — | Local/Trans. | Orta-yüksek | Şablon. `localFact`'i güçlü (öğrenci şehri, bütçe hassas) — gerçek içeriğe çevir. |
| 14 | `autosleutel programmeren apeldoorn` | Tahmin: 380 | — | Local/Trans. | Orta-yüksek | Şablon. |
| 15 | `autosleutel programmeren almere` | Tahmin: 323 | — | Local/Trans. | Orta | Şablon. Asya markaları açısı (`popularBrands`: Toyota/Kia/Hyundai) ayrıştırıcı. |
| 16 | `alle sleutels kwijt auto` | Hizmet sayfası var | — | Transactional | **Yüksek** | En yüksek marjlı iş (€299). Sayfa var ama şehir sayfalarından iç link zayıf. |
| 17 | `smart key programmeren` | Hizmet sayfası var | — | Transactional | Yüksek | Premium iş. Amsterdam Zuid/Zeist/Naarden gibi premium şehirlerden iç link. |
| 18 | `contactslot auto vervangen` | Hizmet sayfası var | — | Transactional | Orta | €299 iş. Den Haag `commonJob`'ı tam bu — şehir↔hizmet eşleşmesi kur. |
| 19 | `autosleutel bijmaken kosten` / `prijs` | Blog + `/prijzen` | — | Commercial | Yüksek | Fiyat sorguları dönüşüme en yakın. `/prijzen`'i Product/Offer schema ile güçlendir. |
| 20 | `bmw sleutel bijmaken` (+47 marka) | 48 marka sayfası | — | Transactional | Orta-yüksek | Marka×şehir kesişimi hâlâ boş. BMW+Zeist, Tesla+Amsterdam Zuid gibi 10-15 gerçek kesişim yazılabilir. |
| 21 | `tesla key card` | `amsterdam-zuid` `commonJob`'ında | — | Transactional | Orta | Niş, rakipsiz, yüksek değerli. Ayrı sayfa hak ediyor. |
| 22 | `motorsleutel bijmaken` | Sayfa var | — | Transactional | Orta | 12 kesilen araba markası yerine 10 motor markası — doğru hamle. İzle. |
| 23 | `autosleutel bijmaken zonder origineel` | Blog yazısı | — | Informational | Orta | Blog→hizmet dönüşümü zayıf. `/diensten/alle-sleutels-kwijt-auto`'ya CTA. |
| 24 | `goedkoper dan dealer` ailesi | 2 blog yazısı | — | Commercial | Orta | Karşılaştırma sayfası formatı eksik (dealer vs. mobiel, tablo + gerçek fiyat). |
| 25 | `zakelijk` / wagenpark / lease | 4 B2B segmenti | — | Commercial | Orta | Düşük hacim, iş başına çok yüksek değer. Her sorgu 1 iş değil 5-20 iş. |

---

## 5. İçerik boşlukları

| # | Konu | Neden önemli | Format | Öncelik | Efor |
|---|---|---|---|---|---|
| 1 | `/autosleutel-laten-maken` → gerçek pillar sayfa | GSC'de 17.314 impression, pos 47. Sitenin en büyük tek kaybı. | Pillar sayfa, 2.000+ kelime | **Yüksek** | 1 gün |
| 2 | 10 P1 şehir için elle yazılmış metin | Arnhem, Nijmegen, Apeldoorn, Almere, Amersfoort, Haarlem, Alkmaar, Hilversum, Nieuwegein, Zeist — hepsi şablonda | Şehir sayfası gövdesi, 600-800 kelime | **Yüksek** | 2-3 gün |
| 3 | Marka × şehir kesişimi (10-15 sayfa) | `popularBrands` verisi zaten şehir bazında var, hiç kullanılmıyor | Şehir sayfası içinde bölüm (ayrı sayfa **değil** — 664 model sayfası hatasını tekrarlamayın) | Orta | Yarım gün |
| 4 | "Dealer vs. mobiel" karşılaştırma sayfası | 2 blog yazısı aynı konuyu anlatıyor, ikisi de tablo formatında değil | Karşılaştırma sayfası + fiyat tablosu | Orta | 2-4 saat |
| 5 | Tesla key card / EV anahtar sayfası | Amsterdam Zuid + Zuidas, rakipsiz niş, yüksek fiyat | Hizmet sayfası | Orta | 2-4 saat |
| 6 | Sigorta akışı derinleştirme | `verzekering-dekt-autosleutel-vervangen` blog var; `gestolen` sayfası ile birleşmemiş | Mevcut sayfaları birbirine bağla | Orta | 1-2 saat |
| 7 | Her blog yazısı sonuna şehir/hizmet CTA bloğu | 27 yazı var, dönüşüm sayfasına akıtmıyor | Komponent | **Yüksek** | 2-3 saat (tek seferde 27 yazı) |
| 8 | 12 adet `nlSearches: 0` şehir kararı | Index'te, şablon içerikli, hacim verisi yok | Karar + uygulama | **Yüksek** | 1-2 saat |
| 9 | Şehir sayfalarına gerçek iş fotoğrafı | `galerij` + `REAL_GALLERY_PROJECTS` var; şehir eşleşmesi yok | Foto↔şehir eşlemesi | Orta | Yarım gün |
| 10 | B2B segment sayfalarını derinleştir | 4 segment var, her sorgu çoklu iş değerinde | Landing sayfa güçlendirme | Düşük-orta | 1 gün |

---

## 6. Teknik SEO checklist

| Kontrol | Durum | Detay |
|---|---|---|
| XML sitemap | **Geçti** | Dinamik, `noindex` sayfaları hariç tutuyor, redirect listelemiyor, image dahil |
| Image sitemap | **Geçti** | `/image-sitemap.xml`, robots'ta duyurulmuş (423 görsel eskiden keşfedilmiyordu — düzeltilmiş) |
| robots.txt | **Geçti** | `/api/` bloke, `/_next/` bilinçli açık, AdsBot ayrı blokta isimle bloke (gerekliydi — `*` AdsBot'a ulaşmaz) |
| Per-URL `lastmod` | **Geçti** | `contentDates.ts` — bölüm bazlı gerçek tarihler, `new Date()` değil. Çok az site bunu doğru yapıyor. |
| IndexNow | **Geçti** | `/api/indexnow`, auth korumalı (eskiden açıktı — düzeltilmiş) |
| `llms.txt` / `llms-full.txt` | **Geçti** | AI arama görünürlüğü için, 11 AI bot'a izin verilmiş |
| Thin page yönetimi | **Geçti** | `thinPages.ts` — 13 şehir + 3 marka `noindex, follow`, gerekçeleri yazılı |
| Model sayfası temizliği | **Geçti** | 664 near-duplicate sayfa 301 ile marka sayfasına yönlendirilmiş, sitemap'ten çıkarılmış |
| `LocalBusiness` schema | **Geçti** | Doğru tip kombinasyonu (`LocalBusiness`+`AutomotiveBusiness`+`Locksmith`), `hasMap` service-area haritasına bakıyor |
| `aggregateRating` kararı | **Geçti** | Bilerek çıkarılmış — Google self-serving rating'i LocalBusiness'ta zaten göstermiyor. Doğru karar. |
| `FAQPage` schema | **Geçti** | `FaqSection` + `ServiceLayout` |
| HTTPS | **Geçti** | Vercel |
| Mobil | **Doğrulanamadı** | Canlı siteye erişemedim. `HANDOFF.md`'de "inline style media query taşımaz, her mobil hata buradan çıktı" notu var — bilinen hassas nokta. |
| Core Web Vitals | **Doğrulanamadı** | Canlı siteye erişemedim. Risk sinyali: repo'ya ~500 MB görsel commit'lenmiş, bir push 239 MB'ta düşmüş. |
| `areaServed` tutarlılığı | **Uyarı** | Elle tutulmuş 29 şehir vs. `CITIES`'te 75. Senkron değil. |
| `vatID` structured data'da | **Uyarı** | Placeholder BTW numarası schema'ya giriyor. Faturada engellenmiş, schema'da değil. |
| Şehir sayfası özgünlüğü | **Başarısız** | 71/75 sayfa 27 metin kombinasyonundan üretiliyor |
| `nlSearches: 0` şehirler | **Başarısız** | 12 şehir index'te, şablon içerikli, talep doğrulanmamış |
| Şehir bazlı schema | **Uyarı** | Şehir sayfalarında o şehre özel `Service`/`areaServed` node'u yok |

---

## 7. Lokal görünürlük planı — altyapı

Post atmaya başlamadan önce iki şeyin oturması gerekiyor, yoksa post'lar boşa gider.

### 7.1 GBP temel hijyeni (1. hafta, 2-3 saat)

| Kontrol | Yapılacak |
|---|---|
| Birincil kategori | `Auto Locksmith` (Autoslotenmaker). Çilingir kategorisi yanlış sinyal verir. |
| İkincil kategoriler | `Locksmith`, `Auto Repair Shop` — en fazla 3-4, alakasız kategori sulandırır |
| Service area | `cities.ts`'deki P1 şehirlerle **birebir** aynı olmalı. Şu an schema'da 29, config'de 75. Google en fazla 20 alan kabul ediyor → P1'leri seç. |
| Services | 17 `diensten` kalemini GBP Services'a gerçek fiyatlarıyla gir (`site.config.ts: prices`) |
| Attributes | "Op locatie service", "24/7", "Identiteitscontrole" |
| Fotoğraflar | **Haftada 3 gerçek iş fotoğrafı**, EXIF'i temiz, dosya adı açıklayıcı. `REAL_GALLERY_PROJECTS` zaten var. |
| Products | En çok satan 6 anahtar tipi, fiyatlı |
| Q&A | 10 soruyu kendiniz sorup kendiniz cevaplayın (Google buna izin veriyor). `faq.ts` içinde hazır. |
| NAP tutarlılığı | Telefon `06 11 75 12 31` ve `+31611751231` sitede tutarlı. GBP, KvK kaydı, Facebook, Instagram, Marktplaats — hepsinde **aynı** olmalı. |

### 7.2 Teknisyen GBP ağı — "tüm bölgeler"in gerçek çözümü

Mimari zaten var: `technicians.gbp_url` (migration 0058), `public_technicians` view'ı bunu
şehir sayfalarına taşıyor, `cityTechnician.ts` hangi şehirde kimin görüneceğini postcode
aralığından çözüyor. Eksik olan tek şey **içerik stratejisi**.

Model:
1. Teknisyen bağımsız girişimci, kendi KvK'sı ve kendi adresi var (zaten `HANDOFF.md`'de
   bu yapı tartışılıyor — offer-and-accept modeli tam bu yüzden kurulmuş).
2. Kendi adresinde **kendi GBP'sini** açar. Service-area business, adres gizli.
3. GBP'si `autosleutel24.nl/steden/<şehir>` sayfasına link verir.
4. O şehir sayfası onu isimle, fotoğrafla, sertifikalarıyla gösterir — zaten yapıyor.
5. O bölgenin yorumları onun profiline gider.

Bu, Rotterdam/Arnhem/Nijmegen/Maastricht'te local pack'e girmenin **tek meşru yolu** ve
aynı zamanda `HANDOFF.md`'de "1. öncelik: teknisyen girişi yok" olarak yazılmış blocker'ı
da iş değerine bağlıyor. Teknisyen onboarding'i artık sadece operasyon değil, SEO.

**Kural:** GBP ancak orada gerçekten konuşlanmış bir teknisyen varsa açılır. Bu sıra
asla tersine çevrilmez.

### 7.3 Yorum motoru — en yüksek kaldıraç (1. haftadan itibaren sürekli)

10 yorumla 1.100 aramalı Rotterdam'da local pack'e girilmez. Hedef: **6 ayda 150+.**

Mekanik:
- İş biter → teknisyen WhatsApp'tan link atar. `src/lib/whatsapp.ts` zaten `wa.me`
  linklerini hazır metinle kuruyor — buraya bir şablon eklemek yarım günlük iş.
- Zamanlama: iş bitiminden **30 dakika sonra**, aynı gün. Ertesi gün oranı yarıya düşer.
- Müşteriye **şehrini ve işini yazmasını** kolaylaştırın (zorlamayın, önermek yeterli):

> Bedankt voor het vertrouwen! Een korte review helpt ons enorm — vooral als u
> erin zet **in welke plaats** wij waren en **welke auto** het was. Dat helpt de
> volgende klant in uw buurt ons te vinden: [link]

  Yorum metninde geçen şehir adı local pack'te gerçek bir sinyal. 150 yorumun 150
  şehir adı taşıması, 75 şablon sayfadan daha değerli.
- **Her yoruma 24 saat içinde cevap**, cevapta şehir ve hizmet geçsin:

> Dank u wel, [naam]! Fijn dat we u in **Nijmegen** snel konden helpen met het
> **bijmaken van uw Volkswagen-sleutel**. Veel veilige kilometers!

- Teknisyen başına aylık yorum sayısını CRM'de takip edin (`/admin/rapportage` var).
  Teknisyen bazlı ölçülmeyen şey yapılmıyor.
- **Asla** yorum satın alın, teşvik etmeyin, filtrelemeyin. `GoogleReviewsCta.tsx`'te bir
  kez uydurma yorum basılmış ve temizlenmiş — o kaslı hafıza doğru, koruyun.
- `site.config.ts: reviewCount` gerçek sayıyı göstermeli, her ay güncellenmeli.

---

## 8. Lokal görünürlük planı — GBP Post takvimi

### Önce dürüst bir uyarı

GBP post'ları **local pack sıralamasını doğrudan ciddi şekilde hareket ettirmez.**
Yaptıkları şey:
- Profil tazeliği ve etkileşim sinyali
- Markalı ve keşif aramalarında local panel'de yer kaplama
- Maps'te tıklama ve arama oranını artırma (dolaylı sıralama etkisi)
- İçeriğin şehir sayfalarına trafik akıtması

Yani post'lar **yorum ve teknisyen GBP ağının üstüne** gelen bir katman. Tersi sırada
yaparsanız sonuç alamazsınız. Bunu baştan bilin ki 8 hafta sonra hayal kırıklığı olmasın.

### Ritim

| Tip | Sıklık | Süre | Amaç |
|---|---|---|---|
| **Update** (iş hikayesi) | Haftada 2 | 7 gün görünür | Tazelik + gerçek iş kanıtı |
| **Offer** | Ayda 1 | Kampanya süresi | Dönüşüm |
| **Event** | Çeyrekte 1 | Etkinlik tarihi | Sezonsal (kış, tatil) |
| **Fotoğraf** (post değil) | Haftada 3 | Kalıcı | En hafife alınan sinyal |

Haftada 2 post + 3 fotoğraf. Fazlası değer katmıyor, azı ritmi bozuyor.

### Her post'un formülü

```
[Şehir/ilçe adı]  +  [gerçek iş]  +  [araç markası]  +  [süre veya fiyat]  +  [CTA]
→ /steden/<şehir>  veya  /diensten/<hizmet>  sayfasına link
```

Dört kural:
1. **Her post bir şehir adı taşır** — ama her hafta farklı şehir (§8.1 rotasyonu).
2. **Her post gerçek bir işe dayanır.** Uydurma iş hikayesi yazmayın; `/admin/jobs`'da
   gerçek işler var, galeri fotoğrafları var. Uydurmanın SEO değeri yok, riski var.
3. **Her post bir şehir veya hizmet sayfasına link verir** — post'un asıl işi bu.
4. **Metin Hollandaca.** Müşteri Hollandalı ve acelesi var.

### 8.1 12 haftalık şehir rotasyonu

Mantık: P1 şehirler sık, P2'ler bir kez, GBP'nin ulaşabildiği yakın bölge ağırlıklı.
Rotterdam/Arnhem/Nijmegen teknisyen GBP'leri açılana kadar listede **az** yer alıyor —
çünkü oradan gelen post bugün local pack'te karşılık bulmuyor.

| Hafta | Post 1 (şehir) | Post 2 (hizmet odaklı) |
|---|---|---|
| 1 | Utrecht | Alle sleutels kwijt |
| 2 | Amsterdam | Smart key programmeren |
| 3 | Hilversum | Sleutel in auto laten liggen |
| 4 | Amersfoort | **Offer:** reservesleutel actie |
| 5 | Almere | Transponder programmeren |
| 6 | Bussum / Gooise Meren | Sleutelbehuizing vervangen |
| 7 | Zeist | BMW / premium smart key |
| 8 | Nieuwegein | **Offer:** tweede sleutel voordeel |
| 9 | Haarlem | Noodopening schadevrij |
| 10 | Alkmaar | Contactslot reparatie |
| 11 | Den Haag | Zakelijk / wagenpark |
| 12 | Houten / Soest | **Offer:** winteractie batterij + sleutelcheck |

13. haftadan sonra başa dön, ama her döngüde o şehrin **farklı** bir `commonJob`'ını
kullan — veri `cities.ts`'de şehir bazında hazır.

### 8.2 Hazır post metinleri (Hollandaca, kopyala-kullan)

**Hafta 1 — Utrecht / Update**
> **Autosleutel kwijt in een parkeergarage in Utrecht?**
> Vanmiddag stond onze monteur binnen 25 minuten bij een Volkswagen in de garage
> onder Hoog Catharijne. Alle sleutels kwijt — oude sleutel digitaal geblokkeerd,
> nieuwe sleutel ter plaatse geprogrammeerd. Auto reed weer weg voor het
> parkeerkaartje verliep.
> Wij komen naar u toe, 24/7, in heel Utrecht en omgeving.
> **CTA:** Bekijk Utrecht → `/steden/utrecht`

**Hafta 2 — Amsterdam / Update**
> **Keyless entry doet niets meer? In Amsterdam lossen wij dat op locatie op.**
> Keyless-storingen zien wij in Amsterdam dagelijks — van Tesla key cards tot
> BMW comfort access. Geen sleepwagen, geen dealerafspraak van drie weken: onze
> mobiele werkplaats leest de boordcomputer uit en leert de sleutel opnieuw in
> naast uw auto.
> Gemiddeld binnen 30-60 minuten ter plaatse.
> **CTA:** Smart key service → `/diensten/smart-key-programmeren`

**Hafta 4 — Offer**
> **Eén sleutel is geen sleutel. Reservesleutel vanaf €125 — excl. btw, ter plaatse.**
> De duurste autosleutel is de sleutel die u laat maken nadat u de laatste kwijt
> bent. Met één werkende sleutel kost een reserve een fractie van een All Keys
> Lost-traject.
> Vaste all-in prijs vóór we beginnen. Officiële factuur, 12 maanden garantie.
> **CTA:** Bekijk prijzen → `/prijzen`

**Hafta 7 — Zeist / premium**
> **BMW-sleutel bijmaken in Zeist — zonder dealerafspraak.**
> In Zeist en 't Gooi rijden veel BMW's, Mercedessen en Audi's waarvoor
> dealer-niveau programmering nodig is. Wij hebben die software in de bus:
> BDC2, FEM, CAS4 — wij programmeren op uw oprit, niet op een wachtlijst.
> **CTA:** BMW-sleutel → `/merken/bmw-autosleutel-bijmaken`

**Hafta 12 — Event / kış**
> **Winter: koude batterij, sleutel die niet meer opent.**
> Elk jaar in november en december krijgen wij dezelfde telefoontjes: de auto
> reageert niet meer op de sleutel. Negen van de tien keer is het de batterij,
> en dat vervangen wij in vijf minuten voor een paar euro.
> Laat uw sleutel gratis nakijken wanneer wij toch in de buurt zijn.
> **CTA:** Batterij vervangen → `/diensten/batterij-vervangen`

### 8.3 Post'ları nerede yönetelim

`postiz` MCP sunucusu bu oturumda mevcut (28+ kanal, Google My Business dahil). İsterseniz
takvimi doğrudan oraya kurup zamanlanmış hale getirebilirim — söyleyin, bağlayalım.
Alternatif: `/admin` içine basit bir post kuyruğu, ama bu kod işi ve ilk 12 hafta için
gerekmez.

### 8.4 Sosyal kanallar

Facebook (`autosleutel24utrecht`), Instagram (`autosleutel24`), Marktplaats profili var.
GBP post'u yazıldıktan sonra **aynı metin aynı gün** Facebook ve Instagram'a gider —
ekstra efor sıfır, kazanç: GBP↔sosyal tutarlılığı ve `sameAs` sinyalleri.

Marktplaats profili özel bir durum: arama sonuçlarında zaten görünüyorsunuz (bunu
doğruladım). Her P1 şehir için ayrı bir Marktplaats ilanı meşru bir lokal kanal ve
rakipleriniz bunu aktif kullanıyor.

---

## 9. "Tüm bölgelerde aktif" yol haritası

### Faz 1 — Çekirdeği sağlamlaştır (0-6 hafta)
**Bölge:** Noord-Holland + Utrecht + Flevoland (Bussum GBP'nin gerçekten eriştiği yer)
- GBP hijyeni (§7.1)
- Yorum motoru başlat, hedef: 6 haftada +40 yorum
- 10 P1 şehir için elle yazılmış içerik
- GBP post ritmi (haftada 2)
- `nlSearches: 0` olan 12 şehir hakkında karar
- **Başarı ölçütü:** LocalFalcon'da Utrecht + Amsterdam grid'inde ortalama sıra iyileşmesi

### Faz 2 — Zuid-Holland + Gelderland (6-16 hafta)
**Önkoşul:** Rotterdam, Den Haag, Arnhem, Nijmegen'de konuşlanmış teknisyen
- Her teknisyen için kendi GBP'si (§7.2)
- O şehirlerin sayfaları teknisyeni gösteriyor — kod zaten hazır
- Post rotasyonunda o şehirlerin ağırlığını artır
- Yorumlar teknisyen profillerine yönlendirilir
- **Başarı ölçütü:** Rotterdam grid'inde local pack'te ilk kez görünme

### Faz 3 — Noord-Brabant + Limburg (16+ hafta)
**Önkoşul:** Eindhoven/Breda ve Maastricht/Venlo bölgesinde teknisyen
- Teknisyen geldikçe `thinPages.ts`'den o şehri çıkar (tek satır)
- Gerçek içerik yaz, şablon kullanma
- Teknisyen GBP'si aç
- **Sıra asla değişmez: teknisyen → GBP → sayfa index'e açılır.**
  Tersi doorway page ve 2026'da bunun bedeli ağır.

`unmet_requests` tablosu (migration 0013) tam bu iş için var: hizmet veremediğiniz her
talep, hangi bölgede teknisyene ihtiyaç olduğunun listesi. Faz 3'ün hedef şehirlerini
tahminden değil o tablodan seçin.

---

## 10. LocalFalcon raporları — bana tam olarak ne gönderin

Raporları alınca yapacağım analiz: grid bazlı sıra haritası, bozulma eşiği (kaç km'de
local pack'ten düşüyorsunuz), rakip yoğunluğu, şehir bazlı öncelik revizyonu ve Faz 2
teknisyen yerleştirme haritası.

Bunun işe yaraması için her tarama şu şekilde olmalı:

**Dosya formatı:** CSV veya PDF export (ikisi de olur), tarama başına bir dosya.

**Her tarama için gerekli parametreler**
| Parametre | Ne olmalı |
|---|---|
| Keyword | Tek bir keyword, tarama başına. Aynı keyword'ü farklı şehirlerde tekrarlayın. |
| Grid boyutu | **9×9** (büyük şehir) veya **7×7** (küçük şehir). 5×5 çok kaba kalıyor. |
| Grid aralığı | Amsterdam/Rotterdam/Utrecht: **1,5 km**. Diğerleri: **3 km**. |
| Merkez | Şehir merkezi, yakınınızdaki bir nokta değil |
| Business | `Autosleutel24` GBP'si (ileride teknisyen GBP'leri de) |

**İstediğim taramalar — öncelik sırasıyla**

*Tur 1 (baseline, 10 tarama):*
1. `autosleutel bijmaken` — Utrecht, 9×9, 1,5 km
2. `autosleutel bijmaken` — Amsterdam, 9×9, 1,5 km
3. `autosleutel bijmaken` — Rotterdam, 9×9, 1,5 km
4. `autosleutel bijmaken` — Den Haag, 9×9, 1,5 km
5. `autosleutel bijmaken` — Almere, 7×7, 3 km
6. `autosleutel bijmaken` — Arnhem, 7×7, 3 km
7. `autosleutel bijmaken` — Amersfoort, 7×7, 3 km
8. `autosleutel bijmaken` — Hilversum, 7×7, 3 km
9. `sleutelmaker auto` — Utrecht, 9×9, 1,5 km *(organikte pos 10, lokalde ne durumda?)*
10. `auto openen zonder sleutel` — Amsterdam, 9×9, 1,5 km

*Tur 2 (varsa, intent kırılımı):*
11. `alle sleutels kwijt` — Rotterdam
12. `autosleutel programmeren` — Nijmegen
13. `autoslotenmaker` — Den Haag

**Bir de şu ekranı gönderin:** rapor içindeki **rakip listesi** (her grid noktasında ilk
3'e giren işletmeler). Benim web aramasıyla ulaşamadığım tek veri bu, ve rekabet
analizinin tamamı buna bağlı. Bu listede en sık çıkan 3-4 isim, gerçek rakipleriniz —
Marktplaats ilanları değil.

**Zamanlama:** Faz 1'e başlamadan baseline alın. Sonra **6 haftada bir** aynı taramaları
tekrarlayın, aynı parametrelerle. Parametre değişirse karşılaştırma anlamını yitirir.

---

## 11. Öncelikli aksiyon planı

### Hızlı kazanımlar (bu hafta, her biri <2 saat)

| # | Aksiyon | Etki | Efor | Bağımlılık |
|---|---|---|---|---|
| 1 | GBP birincil kategorisini `Auto Locksmith` yap, Services'a 17 hizmeti fiyatlı gir | **Yüksek** | 1 sa | — |
| 2 | WhatsApp yorum isteme şablonunu `src/lib/whatsapp.ts`'e ekle, teknisyenlere duyur | **Yüksek** | 1,5 sa | — |
| 3 | Mevcut 10 yoruma şehir+hizmet geçen cevap yaz | Orta | 30 dk | — |
| 4 | 12 adet `nlSearches: 0` şehir için karar: `thinPages.ts`'e ekle ya da içerik planla | **Yüksek** | 1 sa | Teknisyen kapsamı bilgisi |
| 5 | `areaServed`'i `CITIES`'den türet (elle liste yerine) | Orta | 1 sa | — |
| 6 | Placeholder `vatID`'yi schema'dan çıkar (gerçek numara gelene kadar) | Orta | 15 dk | — |
| 7 | Renault sleutelkaart sayfasının meta title/description'ını fiyatlı yeniden yaz (425 impr., 0 klik) | Orta | 30 dk | — |
| 8 | GBP'ye 10 gerçek iş fotoğrafı yükle (galeriden) | Orta | 1 sa | — |
| 9 | 10 GBP Q&A'yı `faq.ts`'den kendiniz sorup cevaplayın | Orta | 1 sa | — |
| 10 | İlk 2 GBP post'unu yayınla (§8.2'den hazır) | Orta | 30 dk | #1 |
| 11 | NAP'ı 4 kanalda (GBP, Facebook, Instagram, Marktplaats) karşılaştır, farkları düzelt | Orta | 1 sa | — |

### Stratejik yatırımlar (bu çeyrek)

| # | Aksiyon | Etki | Efor | Bağımlılık |
|---|---|---|---|---|
| 1 | **Yorum motoru: 10 → 150+** (süreç + ölçüm + teknisyen bazlı takip) | **Çok yüksek** | Sürekli, 6 ay | Hızlı kazanım #2 |
| 2 | **Teknisyen GBP ağı** — Rotterdam, Den Haag, Arnhem, Nijmegen | **Çok yüksek** | 2-3 ay | Teknisyen onboarding (`HANDOFF.md` §6.1 blocker) |
| 3 | `/autosleutel-laten-maken` pillar sayfası (17.314 impr., pos 47) | **Çok yüksek** | 1 gün | — |
| 4 | 10 P1 şehir için elle yazılmış içerik; şablonu `localFact`/`commonJob` etrafında yeniden kur | **Yüksek** | 2-3 gün | — |
| 5 | 12 haftalık GBP post takvimini çalıştır (haftada 2 post + 3 foto) | Orta-yüksek | Haftada 1 sa | Hızlı kazanım #1, #10 |
| 6 | 27 blog yazısına şehir/hizmet CTA bloğu | **Yüksek** | 3 sa | — |
| 7 | `sleutelmaker`/`slotenmaker` ailesini pos 10 → pos 3 (reklam yasak, organik tek kanal) | **Yüksek** | 1 gün | — |
| 8 | Şehir sayfalarına şehir bazlı `Service` + `areaServed` schema node'u | Orta | Yarım gün | — |
| 9 | Marka × şehir kesişimi — şehir sayfası içinde bölüm olarak (ayrı sayfa **değil**) | Orta | Yarım gün | #4 |
| 10 | Dealer vs. mobiel karşılaştırma sayfası + Tesla key card sayfası | Orta | 1 gün | — |
| 11 | Her P1 şehir için Marktplaats ilanı | Orta | 1 gün | — |
| 12 | Core Web Vitals denetimi (canlı erişim açıldığında) | Bilinmiyor | Yarım gün | Ağ erişimi |

---

## 12. Ölçüm

**6 haftada bir**
- LocalFalcon: aynı 10 tarama, aynı parametreler → ortalama sıra + ATRP
- GBP Insights: arama görüntüleme, yol tarifi isteği, telefon araması
- Google yorum sayısı ve puanı (`site.config.ts`'i de güncelle)

**Aylık**
- Search Console: şehir sorguları için impression + pozisyon; özellikle `laten maken`
  (pos 47 → ?) ve `sleutelmaker` (pos 10 → ?)
- Şehir sayfası organik trafiği, P1/P2 kırılımı
- `unmet_requests` tablosu: hangi bölgelerde teknisyen eksiği birikiyor

**Dönüşüm tarafı**
- CRM'de lead kaynağı kırılımı (`/admin/attributie` var)
- Teknisyen başına aylık yorum sayısı
- GBP post'larından şehir sayfalarına tıklama

---

## 13. Söylemem gereken tek uyarı

"Tüm bölgelerde aktif olmak" hedefinin iki yolu var: biri çalışır, biri hesabınızı
kaybettirir.

**Çalışan yol** yukarıdaki üç fazdır: gerçek teknisyen → gerçek GBP → gerçek içerik →
gerçek yorum. Yavaştır, 6-12 ay sürer, ve kalıcıdır.

**Diğer yol** — personelin olmadığı şehirlerde GBP açmak, şablon şehir sayfalarını
index'e açmak, yorum satın almak — kısa vadede grafikleri hareket ettirir. Ama Google
Hollanda'da bu sektörde çilingir reklamlarını **tamamen yasaklamış** durumda; yani
reklam kanalınız yok, GBP'niz tek kanalınız. Suspension aldığınızda yedeğiniz olmaz.

Repo'da bu içgüdünün zaten doğru olduğuna dair kanıt var: uydurma yorumlar temizlenmiş,
664 near-duplicate model sayfası kaldırılmış, radius dışı şehirler "textbook doorway page"
denerek `noindex` yapılmış, self-serving `aggregateRating` çıkarılmış. Bu plan o çizginin
devamı. Hızlandırmak için o çizgiden çıkmaya değmez.
