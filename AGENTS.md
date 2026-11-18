## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

SEO, route, content, layout, PWA veya deployment değişikliklerinden önce [`docs/seo-contract.md`](docs/seo-contract.md) içindeki kalıcı Türkçe/İngilizce URL, canonical, hreflang, sitemap, RSS ve kalite kapısı sözleşmesini okuyun ve ilgili auditleri çalıştırın.

Hall of Fame kaydı eklemeden veya HOF kart UI/verisini değiştirmeden önce [`docs/hof-card-contract.md`](docs/hof-card-contract.md) içindeki kompakt kart, en fazla iki aksiyon, logo geometrisi, iki dilli içerik, SEO ve responsive kanıt sözleşmesini okuyun. Büyük tekrar eden `findingTitle` bloğu, üç butonlu kart veya mevcut grid yüksekliğini bozan uzun açıklama yayınlanamaz.

Güvenlik bildirimi sözleşmesi: canonical makine kaynağı `/.well-known/security.txt`, politika sayfaları `/guvenlik` ve `/en/security`, public contact kaynağı `siteConfig.email` değeridir. Dosya sitemap/PWA precache dışında ve NetworkOnly kalır. Sabit RFC 9116 `Expires` tarihini en geç 60 gün kala yenileyin; değişiklikten sonra `npm run audit:security`, `npm run audit:pwa`, `npm run audit:sitemap` ve `npm run audit:i18n` çalıştırın.

`/admin` ve eski API uçları kaldırıldı. İlgili cache ve sitemap dışlamaları koruyucu amaçlıdır. `npm run audit:console` build çıktısında eski yönetim bileşenlerinin bulunmadığını denetler.

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
