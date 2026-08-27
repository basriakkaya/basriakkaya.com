# Güvenlik araştırması ve CVE doğrulama sözleşmesi

Bu sözleşme, CVE ve Hall of Fame verilerinin arama motorları ile makine istemcilerine doğrulanabilir, ölçülü ve görünür içerikle uyumlu sunulmasını korur.

## Kaynak ve yayın durumu

- CVE verisinin tek kaynağı `src/config/site.ts` içindeki `cves` listesidir.
- `published` yalnızca CVE Programının kamuya açık kaydında teknik veri ve araştırmacı kredisi bulunan kayıtlar için kullanılır.
- `publication-pending` kayıtları yayımlanmış CVE sayısına, `ItemList` içine, finder `TechArticle` şemasına veya detay route'larına girmez.
- Teknik başlık, açıklama, üretici, ürün, CWE, CAPEC, CVSS, tarih ve finder kredisi yetkili kayıtla birebir doğrulanır. Özel rapor veya yayımlanmamış istismar ayrıntısı eklenmez.

## URL, locale ve şema

- Türkçe merkez `/guvenlik-arastirmalari`, İngilizce merkez `/en/security-research` olarak kalır.
- Yayımlanmış kayıtlar küçük harfli CVE kimliğiyle eşleşen çift dilli statik detay route'u üretir.
- Her çift self-canonical, karşılıklı `tr` / `en` / `x-default` hreflang ve gerçek dilde metadata kullanır.
- Detay sayfasında `TechArticle`, `Person` ve `BreadcrumbList`; merkezde `CollectionPage` ve `ItemList` bulunur.
- `Person` kimliği `https://www.basriakkaya.com/#person` olarak tek kalır; `Basri Akkaya` ile `realkage` aynı kişiye bağlanır.
- Yapılandırılmış veri, kullanıcıya görünmeyen yeni başarı veya teknik iddia üretemez.

## Kaynak bağlantıları ve kanıt seviyesi

- Her yayımlanmış detay sayfası CVE Programı kaydına ve mevcutsa yetkili kamu bildirimine görünür bağlantı verir.
- HOF kanıtı; resmî kurum listesi, kamuya açık platform profili, kurum mektubu veya kamuya açık takdir kaydı olarak doğru seviyede etiketlenir.
- Yerel ekran görüntüsü bağımsız üçüncü taraf doğrulaması gibi sunulmaz; yalnızca görüntülenen kaydın arşiv kanıtıdır.
- Dış bağlantı metni hedefi açıklar; yalnızca “tıkla” gibi bağlamsız metin kullanılmaz.

## Kalite kapısı

Değişiklikten sonra `npm run check`, `npm run build`, `npm run audit:seo`, `npm run audit:i18n`, `npm run audit:sitemap`, `npm run audit:links`, `npm run audit:security`, `npm run audit:pwa` ve `git diff --check` çalıştırılır. Merkez ve detay sayfaları 320, 390, 768, 1024 ve 1440 px genişliklerinde yatay taşma, odak sırası ve kaynak linkleri açısından kontrol edilir.
