# KeyForCars geçici demo kurulumu

Demo VPS çalıştırıcısı sağlayıcı anahtarlarını alt sürece aktarmadan, yalnızca loopback üzerinde başlatır. Ayrı bir Supabase projesi kullanın ve bu projeye yalnızca sentetik veri ile demo personel hesapları yükleyin. Proje referansı ile URL eşleşmesi yanlış yazılan adresi yakalar. Verilerin sentetik olduğunu doğrulamak ayrıca gerekir.

1. VPS üzerinde mevcut servislerin portlarını, bellek ve disk kullanımını kontrol edin. Ayrı servis kullanıcısı ve ayrı kurulum dizini seçin.
2. Kaynak sürümünü temiz checkout olarak alın. Yerel .env dosyalarını, .next ve node_modules dizinlerini taşımayın. Paketleri npm ci ile kurun.
3. Ayrı Supabase projesine repodaki migration'ları sırasıyla uygulayın. Mevcut üretim verisini taşımayın. Demo için örnek sipariş ve stok yükleyin. ElevenLabs senkronizasyonunu, sağlayıcı secret'larını ve dış webhook'ları demo projesinde tanımlamayın.
4. /etc/keyforcars-demo.env dosyasında DEMO_SUPABASE_PROJECT_REF, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY ve gerekirse DEMO_PORT değerlerini tanımlayın. Dosyayı yalnızca yetkili kullanıcılar okuyabilsin.
5. Demo dizininde aynı ortam değerleriyle node deploy/keyforcars-demo/start.mjs build çalıştırın. Ardından örnek systemd servisini kurulum dizinine ve Node yoluna göre ayarlayın.
6. Var olan ters proxy'ye yalnızca demo hostname'i için TLS ve giriş doğrulaması ekleyin. Caddyfile.example ayrı site bloğu örneğidir. CRM girişini de açık tutun. Uygulama portunu internete açmayın.
7. Korumasız isteğin reddedildiğini, yetkili hesabın oturum açabildiğini ve canlı sağlayıcı işlemlerinin yapılmadığını doğrulayın. Kurulan commit'i git rev-parse HEAD ile kaydedin.

Yerel kontrol: node deploy/keyforcars-demo/check.mjs.

0103 migration'ı harcama rezervasyonunun veritabanı temelidir. Kurulum mevcut canlı sağlayıcı çağrılarını bu rezervasyona bağlamaz. Uzaktan başlatılan ElevenLabs görüşmelerinin kotası ayrıca sağlayıcı tarafında ele alınmalıdır.
