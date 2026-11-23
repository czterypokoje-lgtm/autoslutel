# Canlıya alma: webshop asistanı, yasal düzenlemeler, KeyForCars ayrışması

_23 Kasım 2026. Hepsi **Autosleutel24** için. Kod hazır ve pushlandı; aşağıdaki adımlar sizin (Supabase,
Vercel, ElevenLabs) ve `main`'e alma onayı._

| Repo | Branch | İçerik |
|---|---|---|
| `czterypokoje-lgtm/autoslutel` (CRM) | `claude/magical-ptolemy-wmbp2e` | sipariş/iade/yönlendirme araçları, AB iade kuralları, saklama süreleri, gizlilik |
| `czterypokoje-lgtm/shop` (webshop) | `claude/elevenlabs-agent-tools` | ürün/uyumluluk araçları, cayma butonu, AI bildirimi, gizlilik metni, iade metinleri |

## Sıra

Her adım bir sonrakinin ön koşulu.

### 1. Supabase (Autosleutel24 projesi)
- [ ] Yedek alın.
- [ ] SQL editöründe bir kez çalıştırın: `supabase/migrations/0143_returns_policy_eu_law.sql`
      (bilgi tabanındaki iade kuralını AB hukukuna göre düzeltir; sonunda iki satırı gösterir).

### 2. Vercel — env değişkenleri
- [ ] Uzun rastgele bir token üretin (en az 24 karakter):

```bash
openssl rand -hex 24
```

- [ ] **CRM projesi:** `SHOP_AGENT_TOKEN` = bu token.
- [ ] **Shop projesi:** `SHOP_AGENT_TOKEN` = **aynı** token.
- [ ] İki projede de Upstash bağlı mı kontrol edin (`KV_REST_API_URL`/`KV_REST_API_TOKEN` veya `storage_KV_*`).
      Yoksa: Vercel → Storage → Upstash Redis → projeye bağla. **Yoksa canlıda ajan araçları kapalı kalır.**
- [ ] CRM'de `CRON_SECRET` var mı (yeni gece silme işi bunu kullanıyor).

### 3. `main`'e alma ve deploy
- [ ] Bana "main'e al" deyin: iki branch'i birleştirip pushlarım (ya da önce PR açarım).
- [ ] Deploy sonrası kontrol:
  - `https://www.autosleutel24.nl/webshop/herroepen` açılıyor; her sayfanın altında "Overeenkomst herroepen".
  - Chat butonuna basınca önce "U chat met een AI-assistent" kutusu çıkıyor.
  - `/webshop/privacybeleid` içinde "4b. Chat- en telefoonassistent (AI)".

### 4. ElevenLabs — gizlilik (bugün, her ajan için)
- [ ] Profil → Terms and privacy → Data use → **"Improve the models for everyone" kapalı**.
- [ ] Her ajan → Advanced → Data retention **30 gün**, "apply to existing" açık; webchat'te ses kaydı kapalı.
- [ ] Telefon ajanının ilk mesajı: *"Autosleutel24, u spreekt met een AI-assistent; dit gesprek wordt
      vastgelegd. Wat is er met de sleutel?"* (AI Act, 2 Ağustos 2026'dan beri zorunlu).

### 5. ElevenLabs — webshop ajanı (yeni)
Ayrıntılar: [`webshop-agent.md`](webshop-agent.md).
- [ ] Workspace secret `SHOP_AGENT_TOKEN` (adım 2'deki değer).
- [ ] Yeni ajan "Webshop — Autosleutel24", text-only, Felemenkçe; ilk mesaj AI diyor.
- [ ] 6 araç: `get_order`, `request_return`, `handover`, `get_knowledge` (CRM) ve `find_parts`,
      `product_details` (shop). `conversation_id` = `{{system__conversation_id}}`.
- [ ] Sistem prompt'u (`webshop-agent.md` §5).
- [ ] Güvenlik: guardrails (focus, prompt injection, content) açık; **tüm override'lar kapalı**; allowlist
      autosleutel24.nl; bursting kapalı; en fazla 15 dakika.
- [ ] Testler (`webshop-agent-plan.md` §4.5, 20 senaryo) — Agent testing ile.
- [ ] CRM Vercel'ine `ELEVENLABS_SHOP_AGENT_ID` = yeni ajanın id'si → redeploy.

### 6. Webshop'u yeni ajana bağlama
- [ ] Shop Vercel: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` = yeni ajanın id'si → redeploy.
- [ ] Deneme: gerçek bir sipariş numarası + e-posta ile sipariş sorgula; bir test iadesi (Gesprekken'de,
      siparişte ve e-postada görünüyor mu?); "Golf 7 2016 sleutel" ile ürün ara.
- [ ] Geri dönüş: eski agent-id'yi geri yazıp redeploy.

### 7. KeyForCars ayrışması

⚠️ **Sıra önemli:** KeyForCars kodu artık ayrı repoda: `czterypokoje-lgtm/keyforcars-crm1`. Bu
branch `main`'e alınınca Autosleutel24 reposunda KeyForCars kodu kalmaz. KeyForCars'ın Vercel projesi
hâlâ bu repodan (veya `uroborosoftware/autosleutel-crm-erp`'den) deploy ediyorsa, **önce** onu yeni
repoya bağlayın: Vercel → `keyforcars-crm` → Settings → Git → `czterypokoje-lgtm/keyforcars-crm1`,
branch `main` (adımlar o reponun `docs/keyforcars-installatie.md` §4.2'sinde). Ancak ondan sonra
"main'e al" deyin.

[`keyforcars-ayrisma.md`](keyforcars-ayrisma.md): kendi ElevenLabs workspace'i, kendi anahtarları, sonra eski
ajanların bizim workspace'imizden silinmesi. Sözleşme taslağı:
[`verwerkersovereenkomst-keyforcars.md`](verwerkersovereenkomst-keyforcars.md).

### 8. İlk hafta
- [ ] Gesprekken'de webshop konuşmalarını günde bir okuyun (ajan cevaplayamadığı soruları `get_knowledge`
      boşluğu olarak bırakır → bilgi tabanına onaylı cevap ekleyin).
- [ ] Ertesi sabah: `/api/cron/privacy-retention` Vercel → Cron Jobs'ta yeşil mi.

## Avukat / FG'ye sorulacaklar
- Sadece programlanmış (frezelenmemiş) anahtar ısmarlama sayılır mı; kullanılmış üründe değer kaybı ne kadar olabilir.
- DPIA zorunlu mu; AI Act'te rolümüz (sağlayıcı mı, kullanıcı mı).
- ElevenLabs widget'ının Google Fonts ve FingerprintJS kodu.
- KeyForCars veri işleme sözleşmesi taslağı.

## Bilinçli olarak sonraya kalanlar
- Kurumsal müşteri bayrağı siparişte yok (shop'ta migration gerekir).
- Sipariş listesinde "iade talebi" işareti (nadir bir hatada ofisin habersiz kalmaması için).
- Gizlilik talepleri için Gesprekken'de e-posta/sipariş numarasıyla arama.
