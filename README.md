# AI Engineer Akademi

[roadmap.sh/ai-engineer](https://roadmap.sh/ai-engineer) yol haritasına dayalı, oyunlaştırılmış Türkçe eğitim sitesi: 17 seviye, 170+ ders, XP ve rütbeler, boss sınavları, ipuçları ve her ders için roadmap.sh kaynakları.

## Yapı

```
public/index.html        Site (tek dosya, statik)
api/register.js          POST  Oyuncu özetini kaydeder (e-posta, ad, seviye, XP...)
api/admin/login.js       POST  Yönetici şifresini sunucuda doğrular, süreli oturum anahtarı verir
api/admin/players.js     GET   Kayıtlı oyuncu listesi (yalnızca yönetici anahtarıyla)
lib/store.js             Redis bağlantısı, şifre ve oturum anahtarı yardımcıları
scripts/hash-password.js Yönetici şifresi için özet üretir
vercel.json              Çıktı klasörü, güvenlik başlıkları, fonksiyon ayarları
```

Oyuncu ilerlemesi tarayıcıda (localStorage) tutulur. Sunucuya yalnızca yönetici panelinde gösterilen özet (e-posta, ad, seviye, XP, ders sayısı, ziyaret bilgisi) gönderilir.

## Vercel kurulumu

1. **Projeyi içe aktar:** Vercel > Add New > Project > bu GitHub deposunu seç. Framework Preset: **Other**. Build ve output ayarlarını boş bırak; `vercel.json` bunları belirler.
2. **Veritabanı ekle:** Proje > Storage (veya Marketplace) > **Upstash for Redis** > projeye bağla. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (ya da `KV_REST_API_*`) değişkenleri otomatik eklenir.
3. **Ortam değişkenleri** (Settings > Environment Variables, Production + Preview):

   | Değişken | Değer |
   |---|---|
   | `ADMIN_EMAIL` | `ozgur.celikv3@gmail.com` |
   | `ADMIN_PASSWORD_HASH` | `npm run hash-password -- "Sifre"` çıktısı |
   | `ADMIN_TOKEN_SECRET` | `openssl rand -hex 32` çıktısı |

4. **Yeniden dağıt:** Değişkenleri ekledikten sonra Deployments > son dağıtım > Redeploy.

Her `main` push'u otomatik olarak production'a, diğer dallar preview'a dağıtılır.

## Yönetici paneli

Sitede `ADMIN_EMAIL` adresiyle giriş yapınca şifre sorulur. Şifre sunucuda doğrulanır (PBKDF2, 15 dakikada 10 deneme sınırı) ve 8 saat geçerli bir oturum anahtarı verilir. Panel kayıtlı tüm oyuncuları listeler; liste 30 saniyede bir yenilenir.

Şifreyi değiştirmek için yeni özeti üretip `ADMIN_PASSWORD_HASH` değerini güncelle ve yeniden dağıt. `ADMIN_TOKEN_SECRET` değiştirildiğinde açık tüm yönetici oturumları geçersiz olur.

## Yerelde çalıştırma

```bash
npm install
npx vercel dev
```

Redis değişkenleri yoksa site çalışır, yalnızca oyuncu kaydı ve yönetici paneli devre dışı kalır.
