> **Güncelleme:** KeyForCars'ın kodu artık kendi reposunda: [`czterypokoje-lgtm/keyforcars-crm1`](https://github.com/czterypokoje-lgtm/keyforcars-crm1). Bu repo yalnızca Autosleutel24'ü çalıştırıyor (`CRM_INSTALL` kaldırıldı); aşağıdaki metin ayrışma anındaki durumu anlatıyor.

# KeyForCars ile ayrışma: veri ve hesaplar

_23 Kasım 2026. Karar: veri ve hesaplar tamamen ayrılır, kod şimdilik ortak kalır (tek repo, `CRM_INSTALL`)._

## Bugün ne ayrı, ne ortak

| | Durum |
|---|---|
| Veritabanı | ✅ Ayrı. Autosleutel24 `utctfircycpjmpjqmtmm`, KeyForCars `lzdwxkhlscsitstxdgar`. Yanlış veritabanına bağlanırsa uygulama açılmıyor (`src/lib/supabase/installGuard.ts`) |
| Vercel projesi, kullanıcılar, alan adı | ✅ Ayrı |
| Ekranlar ve API'ler | ✅ KeyForCars'ta Autosleutel24 ekranları 404 (`src/config/install.ts`, test: `tests/unit/install-serves.test.mjs`) |
| **ElevenLabs workspace** | ❌ **Ortak.** Post-call webhook workspace başına çalıştığı için KeyForCars/KEY24 konuşmaları bizim veritabanımıza düşüyordu |
| Diğer anahtarlar (Resend, Telegram, OpenAI, Upstash…) | ⚠️ `docs/keyforcars-installatie.md` §4 KeyForCars için kendi Resend'ini öngörüyor; gerçekte hangilerinin ortak olduğu Vercel'den kontrol edilmeli (aşağıdaki liste) |
| Sözleşme | ❌ KeyForCars'ın CRM'ini Autosleutel24 çalıştırıyorsa, onların müşteri verisi için **verwerker** (veri işleyen) oluyoruz. Sözleşme yok → taslak: [`verwerkersovereenkomst-keyforcars.md`](verwerkersovereenkomst-keyforcars.md) |

Kod tarafında yapılanlar (bu branch):
- Webhook, başka markaların ajanlarının konuşmalarını **artık kaydetmiyor** (`ELEVENLABS_AGENT_IDS` listesinde olmayan her ajan).
- Gece işi `/api/cron/privacy-retention`, daha önce kaydedilmiş `extern` konuşmaları siliyor.
- Telegram'a konuşma dökümü gitmiyor.

## Yapılacaklar, sırayla

### 1. ElevenLabs: KeyForCars'a kendi workspace'i (en önemli adım)

1. KeyForCars adına **yeni bir ElevenLabs hesabı/workspace** açılsın (fatura KeyForCars'a). Sahibi KeyForCars olsun, siz sadece davetli üye olun.
2. KeyForCars'ın ajanları yeni workspace'te yeniden kurulsun: Workshop Service ajanı, webshop destek ajanı, KEY24 ajanı. ElevenLabs'te ajanı workspace'ler arası taşıma yok; **prompt, araçlar ve ayarlar kopyalanır**, yeni agent-id oluşur.
   - Workshop araçları: `https://<keyforcars-crm>/api/agent/workshop/...`, Bearer `KFC_WORKSHOP_AGENT_TOKEN` → yeni workspace'te **secret** olarak.
   - Gizlilik ayarları baştan: saklama 30 gün, "Improve the models" kapalı, ilk mesajda "AI".
3. KeyForCars sitelerindeki widget'larda (`agent-id`) yeni id'ler kullanılsın; Twilio/telefon numarası varsa yeni workspace'e bağlansın.
4. KeyForCars Vercel'inde: `ELEVENLABS_API_KEY` = **yeni workspace'in** anahtarı; `KFC_REVIEW_AGENT_IDS` = yeni id'ler.
5. Bir hafta yeni ajanlar çalışınca, **Autosleutel24 workspace'inden eski KeyForCars/KEY24 ajanları silinsin**, ElevenLabs'teki konuşmaları da (Agents → Conversations → delete, ya da saklama süresi ile).
6. Autosleutel24 Vercel'inde `ELEVENLABS_AGENT_IDS` = sadece bizim ajanlar (telefoniste, briefing, webshop). Workspace artık sadece bizim olsa da bu liste ikinci bir emniyet.

### 2. Anahtarlar ve hesaplar: her şirkete kendi

Her satır için Vercel'de iki projeye bakın; **aynı değer iki projede varsa** yeni bir anahtar açıp KeyForCars'a verin, eskisini sadece Autosleutel24'te bırakın.

| Değişken | KeyForCars'ta olmalı mı | Not |
|---|---|---|
| `ELEVENLABS_API_KEY`, `KFC_REVIEW_AGENT_IDS` | evet, **kendi workspace'i** | adım 1 |
| `KFC_WORKSHOP_AGENT_TOKEN` | evet, kendi | sadece KeyForCars'ta |
| `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `MAIL_FROM`, `INBOX_EMAIL` | evet, **kendi Resend hesabı/alan adı** | e-postalar onların adresinden gitmeli |
| `TELEGRAM_*` | KeyForCars'ta gerekmiyor (Autosleutel24 ağına ait) | ortaksa KeyForCars'tan silin |
| `KV_REST_API_*` (Upstash) | evet, **kendi** veritabanı | ortak Upstash = limit sayaçları karışır |
| `CRON_SECRET` | evet, kendi | |
| `WOO_*`, `SENDCLOUD_*` | sadece KeyForCars | Autosleutel24'te olmamalı |
| `AGENT_API_TOKEN`, `SHOP_AGENT_TOKEN`, `OPS_API_TOKEN`, `ELEVENLABS_*_AGENT_ID`, `MOLLIE_API_KEY`, `GOOGLE_ADS_*`, `OPENAI_ADS_API_KEY` | **hayır** | Autosleutel24'e ait; KeyForCars'ta varsa silin |
| `ANTHROPIC_API_KEY` (inbox asistanı) | kendi hesabı | ortaksa KeyForCars'a ayrı anahtar |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | kendi (zaten ayrı) | installGuard bunu kontrol ediyor |

Anahtar değiştirmek: önce yeni anahtarı KeyForCars'a girin + redeploy, çalıştığını görün, sonra eskisini o projeden silin.

### 3. Sözleşme

[`verwerkersovereenkomst-keyforcars.md`](verwerkersovereenkomst-keyforcars.md) taslağı avukata/FG'ye gösterilip imzalansın. CRM'i KeyForCars'ın kendisi çalıştıracaksa (siz sadece yazılımı veriyorsanız) gerek yok; o zaman bir yazılım/lisans anlaşması yeterli.

### 4. Kontrol

- [ ] Autosleutel24 `/admin/gesprekken`'te yeni hiçbir KeyForCars/KEY24 konuşması yok.
- [ ] KeyForCars CRM'inde kendi botgesprekken'i yeni workspace'ten geliyor.
- [ ] Vercel'de iki projede aynı değere sahip hiçbir anahtar yok (Supabase URL'leri hariç değil: onlar zaten farklı).
- [ ] Eski ajanlar ve konuşmaları Autosleutel24 workspace'inden silindi.

## Kodu da ayırmak (şimdilik değil)

Şu durumlardan biri olursa: KeyForCars kendi özelliklerini isterse, kendi geliştiricisiyle çalışırsa, iş ilişkisi biterse ya da onların güncellemelerinin canlı sisteminizi etkileme riskini hiç istemezseniz. O zaman KeyForCars için ayrı repo (fork) açılır, bu repodan `IS_KEYFORCARS` dalları ve WooCommerce kodu temizlenir. Birkaç günlük iş; sonrasında iki kod ayrışır.
