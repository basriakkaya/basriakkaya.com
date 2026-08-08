# Türkçe ve İngilizce SEO sözleşmesi

Bu belge, route, içerik, layout, PWA ve deployment değişikliklerinde korunacak kalıcı sözleşmeyi özetler. Kaynak kod ve build çıktısı bu belgeden önce gelir.

## URL ve locale modeli

- Production origin yalnızca `https://www.basriakkaya.com` değeridir.
- Türkçe varsayılan dildir ve kökte kalır: `/`, `/yazilar`, `/yazilar/<slug>`, `/yazilar/kategori/<category>`, `/yazilar/seri/<series>`, `/ben-kimim`, `/rss.xml`.
- İngilizce `/en` altındadır: `/en`, `/en/about`, `/en/articles`, `/en/articles/<slug>`, `/en/articles/category/<category>`, `/en/articles/series/<series>`, `/en/rss.xml`.
- Dil seçici gerçek anchor kullanır; otomatik dil redirect'i, cookie veya query-string locale kullanılmaz.
- Her sayfa self-canonical kullanır. Preview ve localhost origin metadata, sitemap veya RSS'e giremez.

## İçerik ve eşleştirme

- `lang` yalnızca `tr` veya `en` olabilir; eski içerikler schema default'u ile `tr` kabul edilir.
- `translationKey` slug değildir. Aynı içeriğin diller arası stabil eşleme anahtarıdır ve bir locale içinde benzersizdir.
- Makale hreflang yalnızca iki gerçek, yayınlanmış eş bulunduğunda üretilir. Çeviri yoksa dil seçici karşı dilin liste sayfasına gidebilir fakat bu hedef hreflang olarak yayınlanmaz.
- İngilizce makale, kategori veya seri route'u yalnızca gerçek İngilizce yayınlanmış içerik varsa üretilir.

## Metadata ve structured data

- Her indexlenebilir HTML sayfasında tek title, description, canonical ve H1 bulunur.
- `og:url` canonical ile aynıdır. Locale mapping Türkçe için `tr` / `tr-TR` / `tr_TR`, İngilizce için `en` / `en-US` / `en_US` kullanır.
- Homepage, about ve listing çiftleri karşılıklı `tr`, `en` ve Türkçe eşe giden `x-default` alternate yayınlar.
- Makaleler `BlogPosting`, görünür yollar `BreadcrumbList` kullanır. `url`, `mainEntityOfPage`, `inLanguage`, tarih, author ve image gerçek sayfa verisiyle uyumludur. `dateModified` build zamanı değildir.

## Sitemap, RSS ve PWA

- Tek sitemap üreticisi `@astrojs/sitemap`; giriş noktası `/sitemap-index.xml` olarak kalır.
- Sitemap yalnızca indexlenebilir production canonical HTML URL'lerini içerir; RSS, robots, offline, manifest, Service Worker ve preview URL'leri içermez.
- `/rss.xml` yalnızca Türkçe, `/en/rss.xml` yalnızca İngilizce içerik taşır. İngilizce içerik yoksa boş feed geçerlidir.
- Manifest ve Service Worker registration tek instance'dır. `/rss.xml`, `/en/rss.xml`, robots, sitemap, manifest ve SW sistem URL'leri NetworkOnly kapsamındadır.
- RFC 9116 kaynağı yalnızca `/.well-known/security.txt` adresindedir; `/guvenlik` ve `/en/security` karşılıklı locale politika sayfalarıdır. Public contact için tek kaynak `siteConfig.email` değeridir.
- `security.txt` sitemap ve PWA precache dışında, Service Worker NetworkOnly kapsamındadır. Sabit `Expires` tarihi build sırasında ileri taşınmaz; `audit:security` geçmiş/60 günden yakın veya bir yıldan uzak tarihi reddeder. Tarih en geç 60 gün kala yenilenmelidir.
- `/admin` yalnızca statik ve noindex operations console route'udur. Canonical, hreflang, JSON-LD, sosyal metadata, RSS discovery veya public navigation bağlantısı yayınlamaz; sitemap/RSS/robots ilanı dışında kalır.
- `/admin` bağımsız minimal layout kullanır; Analytics, Speed Insights, manifest ve Service Worker registration yüklemez. HTML, Vercel `no-store` ve Service Worker NetworkOnly kurallarıyla PWA runtime cache dışında tutulur.
- Türkçe reaction anahtarı `basri:post-reaction:<slug>` olarak korunur; İngilizce anahtar `basri:post-reaction:en:<slug>` biçimindedir.

## Değişiklik sınıfları ve kalite kapısı

- İçerik: `check`, build, content, SEO, links, i18n, sitemap ve RSS çıktısı.
- Route/i18n veya layout: yukarıdakilere ek olarak PWA, responsive QA ve aynı viewportta `/`–`/en` hero koordinat karşılaştırması.
- Build/PWA/deployment veya SEO sistemi: bütün audit zinciri, preview metadata kontrolü ve responsive QA.
- `npm run build` postbuild aşamasında sitemap, links, PWA, i18n, content, SEO ve security auditlerini çalıştırır. Kritik hata warning'e çevrilmez.

Yayın öncesinde `npm run check`, `npm run build` ve `git diff --check` çalıştırılır. Preview'da canonical production origin olarak kalmalı; navigation, hreflang, RSS, sitemap ve PWA tekrar kontrol edilmelidir. Merge ve production deploy ayrıca kullanıcı onayı gerektirir. Production sonrasında Search Console sonuçlarının gecikmeli olduğu ve sitemap gönderiminin index garantisi olmadığı kabul edilir.
