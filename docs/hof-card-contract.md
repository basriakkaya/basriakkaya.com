# Hall of Fame kart sözleşmesi

Bu belge, Türkçe ve İngilizce Hall of Fame kayıtlarının kalıcı içerik ve arayüz sözleşmesidir. Yeni HOF kaydı eklemeden veya mevcut kartları değiştirmeden önce okunmalıdır.

## Değiştirilemez temel düzen

- HOF verisinin tek kaynağı `src/config/site.ts` içindeki `achievements` listesidir.
- Kart başlığı kısa tutulur. Tercih edilen biçim: `Kurum/Program — Yıl Hall of Fame`.
- Görünür açıklama tek kısa cümledir. Kanıtın bütün ayrıntıları karta taşınmaz.
- Aynı bulgu; açıklama, büyük başlık ve etiketlerde tekrar edilmez.
- `findingTitle` HOF kartlarında varsayılan olarak kullanılmaz. `findings` etiketleri varken ayrıca büyük kırmızı bulgu bloğu eklenmez.
- En fazla iki kısa `findings` etiketi gösterilir.
- `status` kısa tutulur: örneğin `HOF · P3` veya `HOF · LOR bekleniyor`.
- Bir kartta en fazla iki aksiyon bulunur:
  - Kanıt varsa: **Kanıtı görüntüle** + **Resmî kaydı görüntüle**.
  - Kanıt yoksa: **Resmî kaydı görüntüle** + gerekliyse **Kurum sitesi**.
- Üçüncü buton, uzun açıklama veya tekrar eden büyük vurgu bloğu eklenmez.

## Logo sözleşmesi

- Her HOF kartında doğrulanmış kurum logosu bulunur; placeholder kullanılmaz.
- Logo mümkünse kurumun resmî alan adından alınır ve yerel asset olarak saklanır.
- Şeffaf SVG/PNG tercih edilir; beyaz kutulu raster görsel kullanılmaz.
- Dairesel amblemler `shape: 'round'`, yatay logolar `shape: 'wordmark'` olarak tanımlanır.
- Dairesel logo dikdörtgen çerçeveye, yatay logo da dairesel çerçeveye zorlanmaz.
- Alt metin kurumun tam ve doğru adını içermelidir.

## Kanıt ve responsive davranış

- Kanıt görseli `public/images/recognition/` altında anlamlı bir dosya adıyla tutulur.
- Gerçek `evidenceWidth` ve `evidenceHeight` değerleri yazılır.
- Türkçe ve İngilizce `evidenceAlt` metinleri tarih, hedef ve kabul bilgisini doğru biçimde açıklar.
- Kanıt yalnızca dialog içinde açılır; karta büyük ekran görüntüsü gömülmez.
- 390 px mobil görünümde sayfa ve dialog yatay taşmamalıdır. Geniş kanıt görseli dialog genişliğine küçülmelidir.

## Türkçe, İngilizce ve SEO

- `title` / `titleEn`, `description` / `descriptionEn` ve kanıt alt metinleri iki dilde birlikte eklenir.
- Görünür metinler çeviri olmalıdır; Türkçe karta uzun İngilizce paragraf veya İngilizce karta Türkçe metin konmaz.
- Doğrulama URL'si kamuya açık gerçek kayda gitmelidir.
- HOF kaydı Person JSON-LD `award` / `subjectOf` verisinde temsil edilmelidir.
- Yeni logo ve kritik HOF metinleri build auditleriyle korunmalıdır.

## Yayın kalite kapısı

Yayın öncesinde aşağıdakilerin tamamı gerekir:

1. `npm run check`
2. `npm run build`
3. `git diff --check`
4. 1440 px masaüstü HOF grid kontrolü
5. 390 px mobil kart ve kanıt dialog kontrolü
6. Türkçe `/ben-kimim` ve İngilizce `/en/about` içerik kontrolü
7. Production sonrası logo, kanıt ve doğrulama bağlantısı kontrolü

Yeni kart mevcut gridin yüksekliğini belirgin biçimde bozuyorsa yayınlanmaz; önce metin ve aksiyonlar sadeleştirilir.
