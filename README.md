# KampüsKit Frontend

Bağımsız React/TypeScript/Vite reposu. Backend reposu veya üst dizindeki npm workspace olmadan kurulabilir, test edilebilir ve derlenebilir. Supabase SDK ve sunucu anahtarları bu repoda bulunmaz.

## Kurulum

Node.js 24 önerilir (en az 22.17). Bu reposunun kökünde:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Windows'ta dosyayı `Copy-Item .env.example .env.local` ile kopyalayabilirsin. Varsayılan adres http://127.0.0.1:5173. Backend ayrı terminalde kendi reposundan başlatılır; varsayılan API http://127.0.0.1:3001.

```dotenv
VITE_API_BASE_URL=/api
API_PROXY_TARGET=http://127.0.0.1:3001
VITE_GOOGLE_MAPS_API_KEY=
VITE_EMAIL_REMINDERS_ENABLED=false
```

`API_PROXY_TARGET` geliştirme/preview proxy hedefidir; tarayıcı paketine girmez. Harita tarayıcı anahtarı referrer ve Maps JavaScript API kısıtlarıyla kullanılmalıdır. Supabase ve Places sunucu anahtarları backend'de tutulur.

## Klasörler

```text
src/components/          Ortak arayüz ve gezinme
src/pages/               Uygulama ekranları
src/features/occupancy/  ML yoğunluk ekranı, grafik ve senaryolar
src/services/            /api istemcileri
src/lib/                 Arayüz durumu ve yardımcılar
packages/shared/         Sürümlenmiş yerel tip/kural paketi
public/                  Görseller ve veri lisansı
docs/                    API ve ML açıklamaları
dist/                    Üretilmiş statik site
```

`@kampuskit/shared`, `file:./packages/shared` bağımlılığıdır. Kardeş repo veya dış registry gerektirmez. API sözleşmesini değiştirdiğinde iki repodaki paket sürümünü ve ilgili dosyaları aynı sürüme getir. Üst çalışma klasörü mevcutsa `npm run contracts:check` eşleşmeyi kontrol eder.

## Kontroller ve yayın

```bash
npm test
npm run lint
npm run build
npm run preview
```

`npm run build` yalnızca bu reponun `dist/` klasörünü üretir. GitHub Actions aynı kontrolleri repo kökünden çalıştırır. `dist/` statik sunucuya yayımlanabilir. Üretimde geliştirme Vite proxy'si yoktur; frontend origin'indeki `/api/` yolunu backend'e reverse proxy et. Backend `APP_ORIGIN` değerini frontend'in HTTPS origin'ine ayarla. HttpOnly oturum ve PKCE callback bu bağlantıyla çalışır. Örnek reverse proxy konfigürasyonu [deploy/nginx.conf](deploy/nginx.conf) dosyasında; adresleri kendi ortamına göre değiştir.

Yoğunluk ML demosu `/#/demo/yogunluk?gorunum=ml` adresinde açılır. Tahminler backend'de hesaplanır; model ağırlıkları frontend'e taşınmaz. Ayrıntılar [ML](docs/ML.md) ve [API](docs/API.md) belgelerinde.
