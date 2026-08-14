---
title: "OWASP Top 10:2025 — Ezber Listesi Değil, Güvenlik Haritası"
description: "OWASP Top 10:2025 kategorilerini ezberlemek yerine kök nedenleri, gerçek senaryoları, kategori farklarını ve kalıcı savunmalarıyla anlamaya çalıştığım kapsamlı rehber."
publishedAt: 2026-08-05
lang: tr
translationKey: "owasp-top-10-2025-reasoning-guide"
draft: false
category: "web-guvenligi"
toc: true
tags:
  - OWASP
  - Web Güvenliği
  - Uygulama Güvenliği
  - Güvenli Yazılım
  - Pentest
cover: "/images/blog/owasp-top-10-2025/cover.webp"
coverAlt: "Modern bir web uygulamasını çevreleyen güvenlik risk alanlarını inceleyen araştırmacının teknik illüstrasyonu"
---

OWASP Top 10 ile ilk tanıştığımda önümde on maddelik düzenli bir liste gördüm. Doğal olarak yapılacak işin bu on başlığı ezberlemek olduğunu düşündüm.

```text
A01 access control
A02 misconfiguration
A03 supply chain
...
```

Bir süre sonra fark ettim ki başlıkları sırayla söyleyebilmek pek bir şey çözmüyor. Bir isteği Burp Suite'te yakaladığımda asıl soru “Bu kaçıncı maddeydi?” değil; **sistem burada neye güveniyor, kontrol nerede eksik ve bunun gerçek etkisi ne?**

Bu yazıda OWASP Top 10:2025'i bir sınav listesi gibi değil, web uygulamalarına bakma biçimi olarak ele alıyorum. Amacım her kategori için birkaç payload ezberlemek değil. Kök nedeni, sınırları, diğer kategorilerle farkı ve kalıcı savunmayı anlayabilmek.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/cover.webp" alt="Modern bir web uygulamasını çevreleyen güvenlik risk alanlarını inceleyen araştırmacının teknik illüstrasyonu" width="1536" height="1024" loading="eager" />
  <figcaption>OWASP Top 10, on ayrı saldırı numarası değil; modern bir uygulamaya farklı açılardan bakmamı sağlayan risk haritası.</figcaption>
</figure>

> **Güncellik notu:** Ağustos 2026 itibarıyla ana web uygulamaları için güncel liste [OWASP Top 10:2025](https://owasp.org/Top10/2025/). “OWASP Top 10:2026” adında ayrı bir ana web uygulaması listesi bulunmuyor. API, mobil, LLM ve smart contract listeleri ise ayrı projeler; onları bu yazıyla karıştırmıyorum.

## OWASP nedir, Top 10 ne işe yarar?

OWASP, açılımıyla **Open Worldwide Application Security Project**, yazılım güvenliğini geliştirmek için açık kaynaklı standartlar, test rehberleri, kontrol listeleri, laboratuvarlar ve araçlar üreten küresel bir topluluk.

Top 10 bu ekosistemin en tanınan parçası ama tamamı değil:

| Kaynak | Ben ne için kullanırım? |
|---|---|
| OWASP Top 10 | Risk farkındalığı ve ortak dil |
| ASVS | Uygulanabilir güvenlik gereksinimleri |
| WSTG | Sistematik web güvenliği test yaklaşımı |
| Cheat Sheet Series | Belirli kontroller için uygulama rehberi |
| Juice Shop / WebGoat | Yasal ve kontrollü pratik |

Top 10'un kendisi bir pentest metodolojisi, zafiyet tarayıcısı veya “bunları kontrol ettim, uygulama güvenli” sertifikası değil. Her madde tek bir zafiyeti değil, benzer kök nedenlere sahip geniş bir **risk ailesini** temsil ediyor.

```text
CWE   → Zayıflık türü
CVE   → Belirli bir üründeki somut açık kaydı
OWASP → Birçok zayıflığı geniş risk ailelerinde toplar
```

Örneğin CWE-89 SQL Injection zayıflık türünü anlatır. Belirli bir üründeki somut SQL Injection açığı bir CVE kaydı alabilir. OWASP A05 ise SQL, command, template ve benzeri pek çok injection biçimini daha geniş bir ailede ele alır.

OWASP 2025 listesi, gerçek uygulama testlerinden gelen verilerle topluluk değerlendirmesini bir araya getiriyor. Bu önemli; çünkü otomatik araçlar bazı teknik zayıflıkları kolay yakalarken iş mantığı ve güvensiz tasarım gibi riskler veri setlerinde olduğundan küçük görünebilir.

## 2025 listesinde ne değişti?

Güncel sıralama şöyle:

| Sıra | Kategori | Kafamdaki kısa soru |
|---:|---|---|
| A01 | Broken Access Control | Bunu yapmaya yetkisi var mı? |
| A02 | Security Misconfiguration | Sistem güvenli mi yapılandırılmış? |
| A03 | Software Supply Chain Failures | İçeri aldığım parçaya güvenebilir miyim? |
| A04 | Cryptographic Failures | Veri ve anahtar doğru korunuyor mu? |
| A05 | Injection | Veri komuta dönüşebiliyor mu? |
| A06 | Insecure Design | Gerekli kontrol en başta tasarlanmış mı? |
| A07 | Authentication Failures | Karşımdaki gerçekten iddia ettiği kişi mi? |
| A08 | Software or Data Integrity Failures | Yazılım veya veri değiştirilmiş mi? |
| A09 | Security Logging and Alerting Failures | Saldırıyı görüp tepki verebiliyor muyum? |
| A10 | Mishandling of Exceptional Conditions | Sistem işler ters gidince güvenli kalıyor mu? |

Broken Access Control birinci sıradaki yerini korudu. Security Misconfiguration ikinci sıraya yükseldi. “Vulnerable and Outdated Components” daha geniş bir bakışla Software Supply Chain Failures'a dönüştü. SSRF, A01 kapsamına taşındı. Logging kategorisinde alarm üretme özellikle öne çıktı ve listeye yeni A10, yani istisnai koşulların hatalı yönetimi eklendi.

## A01:2025 — Broken Access Control

Kimlik doğrulama bana kullanıcının kim olduğunu söyler. Erişim kontrolü ise o kullanıcının **hangi kaynak üzerinde hangi işlemi yapabileceğini** belirler.

```text
Authentication → Sen kimsin?
Authorization  → Bunu yapmaya yetkin var mı?
```

Bu ikisini karıştırınca “Kullanıcı giriş yapmış, demek ki isteği çalıştırabilir” gibi tehlikeli bir kısa yol oluşuyor.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a01-access-control.webp" alt="Farklı kullanıcı ve rol isteklerinin sunucu tarafındaki yetki kapısından doğru kayıtlara yönlendirilmesini gösteren şema" width="1536" height="1024" loading="lazy" />
  <figcaption>Oturumun geçerli olması yetmez; her nesne ve işlem için sahiplik ile yetki yeniden kontrol edilmeli.</figcaption>
</figure>

Klasik IDOR/BOLA örneği:

```http
GET /api/invoices/1001
```

Kendi faturam açılıyor. ID'yi `1002` yaptığımda başka kullanıcının faturası geliyorsa sunucu nesnenin varlığını ve oturumumu kontrol etmiş, fakat o nesnenin **bana ait olup olmadığını** kontrol etmemiş demektir.

```text
Nesne var mı?        Evet
Kullanıcı girişli mi? Evet
Nesne ona ait mi?     Bakılmamış
```

Başka bir kullanıcının verisine geçmek horizontal privilege escalation; normal kullanıcıdan admin yetkisine çıkmak vertical privilege escalation. Frontend'de admin düğmesini gizlemek ikisini de engellemez. API endpoint'i server-side kontrol etmiyorsa düğmenin CSS ile görünmemesi güvenlik kontrolü sayılmaz.

Bu ailede IDOR, forced browsing, eksik method yetkisi, rol manipülasyonu, bazı CORS hataları, CSRF ve 2025 listesinde SSRF gibi konular bulunabiliyor. SSRF'nin buradaki mantığı, saldırganın sunucunun sahip olduğu ağ erişim yetkisini kendi adına kullandırması:

```text
Kullanıcı → Sunucu → 127.0.0.1 / internal-service / cloud metadata
```

Savunma tarafında deny by default, server-side merkezi policy, her nesnede ownership kontrolü, endpoint ve HTTP method bazlı test, kısa ömürlü token, doğru logout ve tekrarlanan yetki ihlallerinde alarm gerekiyor.

> Giriş yapmış olmak, her kapının anahtarına sahip olmak değildir.

## A02:2025 — Security Misconfiguration

Bazen kodda tek bir satır değiştirmeden sistemi savunmasız hâle getirebilirim. Debug modu açık kalır, storage public olur, varsayılan parola değişmez veya `.env` dosyası web root'a düşer. Kod görevini doğru yapıyordur; çevresi fazla cömert davranıyordur.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a02-misconfiguration.webp" alt="Web uygulaması katmanlarında açık debug kanalı, gereksiz servis ve yanlış depolama izinlerini güvenli yapılandırmayla karşılaştıran şema" width="1536" height="1024" loading="lazy" />
  <figcaption>Modern uygulamada yalnızca kodu değil; proxy'den cloud storage'a kadar bütün katmanların ayarlarını koruyorum.</figcaption>
</figure>

Modern uygulama yığını kısa değil:

```text
CDN → Cloud → Load balancer → Reverse proxy → Container
    → Framework → Application → Database → Cache → Queue
```

Her katman yeni bir ayar yüzeyi demek. Açık directory listing, production'da stack trace, gereksiz portlar, test endpoint'leri, actuator panelleri, yanlış CORS, eksik security header, gereksiz HTTP method'ları, public bucket, varsayılan hesaplar ve güvensiz XML parser bu aileye girebilir.

Buradaki savunma “bir kez ayarladım, tamamdır” değil. Tekrarlanabilir hardening standardı, Infrastructure as Code, development/test/production ayrımı, en az yetki, secret yönetimi, güvenli baseline ve configuration drift takibi gerekiyor. Güvenli ayar zaman içinde kayabiliyorsa o ayarı sürekli doğrulamak zorundayım.

> Güvenli kod, yanlış yapılandırılmış altyapının üzerinde sihirli şekilde güvenli kalmıyor.

## A03:2025 — Software Supply Chain Failures

Modern bir uygulamanın ne kadarı gerçekten benim yazdığım kod? Paketler, base image'lar, CI action'ları, SDK'lar, IDE eklentileri, build araçları derken kendi depomun dışından koca bir mahalle içeri giriyor.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a03-supply-chain.webp" alt="Bağımlılıklar, container image ve CI bileşenlerinin doğrulama kapılarından geçerek uygulama artifact'ına ulaştığı tedarik zinciri şeması" width="1536" height="1024" loading="lazy" />
  <figcaption>Uygulamayı doğrudan hedeflemek yerine build'e giren küçük bir parçayı bozmak bazen daha kolaydır.</figcaption>
</figure>

Risk yalnızca “eski npm paketi” değil. Typosquatting, dependency confusion, maintainer hesabının ele geçirilmesi, zararlı güncelleme, güvensiz GitHub Action, CI/CD secret sızıntısı, imzasız artifact, backdoor içeren base image ve korunmayan artifact registry de zincirin parçası.

Transitive dependency özellikle sinsi:

```text
Uygulamam
└── Paket A
    └── Paket B
        └── Paket C  ← sorun burada
```

Paket C'yi ben doğrudan kurmadım diye risk ortadan kalkmıyor. Çalışan yazılımın içine girdiyse sorumluluk zincirime girmiş oluyor.

SBOM, yani Software Bill of Materials, hangi bileşenlerin içeride olduğunu gösterir. Fakat SBOM üretip bir klasörde unutmak güvenlik sağlamaz. Envanteri CVE'lerle eşleştirecek, sahip atayacak, risk değerlendirecek ve güncelleyecek süreç de gerekli.

Lock file, version pinning, güvenilir registry, paket ve artifact imzası, SCA, SBOM, minimal base image, least-privilege CI/CD, branch protection ve kritik action'ları immutable commit hash'ine sabitlemek savunmanın parçaları.

> Uygulamanın güvenliği, yalnızca yazdığım kod kadar değil; build'e kabul ettiğim her parça kadar güçlü.

## A04:2025 — Cryptographic Failures

Kriptografi bölümünde ilk tuzak “şifreleme kullandık” cümlesi. Hangi algoritma, hangi mod, anahtar nerede, nonce tekrar ediyor mu, sertifika gerçekten doğrulanıyor mu, parola nasıl saklanıyor? Kriptografi var olabilir ama yanlış yerde veya yanlış yaşam döngüsüyle kullanılıyor olabilir.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a04-cryptography.webp" alt="Hassas verinin aktarımda ve depolamada şifrelenmesini, parola hash'lemeyi ve ayrı anahtar kasasını gösteren şema" width="1536" height="1024" loading="lazy" />
  <figcaption>Veri yolda ve diskte korunurken anahtarın da veriden ayrı, yönetilen bir yaşam döngüsü olmalı.</figcaption>
</figure>

Önce üç kavramı ayırıyorum:

```text
Encoding   → Format dönüşümü; gizlilik sağlamaz
Encryption → Anahtarla gizler; yetkili taraf geri açabilir
Hashing    → Tek yönlü özet üretir
```

`Base64 != encryption`. Base64 ile çevrilmiş parola korunmuş değil, yalnızca başka biçimde yazılmıştır.

Parolayı plaintext, MD5, SHA-1 veya tek başına hızlı SHA-256 ile saklamak doğru değil. Parola saklama için Argon2id, scrypt, uygun cost ile bcrypt veya uygun parametrelerle PBKDF2 gibi yavaş ve salt kullanan yöntemler gerekir.

Risk ailesinde şifresiz hassas veri, zayıf algoritma, hard-coded key, anahtar rotasyonu eksikliği, yanlış certificate/hostname doğrulaması, tahmin edilebilir token, nonce/IV tekrarı, şifresiz protokol ve TLS downgrade bulunabilir.

Savunma veriyi sınıflandırmak ve gereksiz hassas veriyi hiç toplamamakla başlar. Standart ve güncel algoritmalar, CSPRNG, authenticated encryption, KMS/HSM, anahtar rotasyonu, zorunlu TLS ve doğru sertifika doğrulaması bunun devamı.

> Kriptografi yalnızca algoritma seçimi değil; veri, anahtar, rastgelelik ve yaşam döngüsü yönetimidir.

## A05:2025 — Injection

Injection'ın ortak kök nedeni şu: veri olarak kalması gereken kullanıcı girdisi, bir interpreter tarafından komutun veya sorgunun parçası olarak yorumlanıyor.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a05-injection.webp" alt="Kullanıcı girdisinin güvensiz yolda sorguya karışmasını ve güvenli yolda parametre olarak ayrı tutulmasını gösteren şema" width="1536" height="1024" loading="lazy" />
  <figcaption>Güvenli akışta veri ve komut yapısı ayrı kalır; doğrulama tek başına bu ayrımın yerini tutmaz.</figcaption>
</figure>

Kötü SQL mantığı:

```python
query = "SELECT * FROM users WHERE username = '" + username + "'"
```

Burada girdi sorgu metninin içine karışıyor. Parametreli yaklaşımda ise sorgunun yapısıyla veri ayrılıyor:

```python
cursor.execute(
    "SELECT * FROM users WHERE username = %s",
    (username,)
)
```

Aynı fikir command injection için de geçerli. `os.system("nslookup " + user_input)` çalıştırdığımda girdiyi shell dilinin ortasına bırakıyorum. Mümkünse shell'i kaldırmalı; zorunluysa argümanları ayrı geçmeli, allowlist doğrulaması yapmalı ve işlemi en az yetkiyle çalıştırmalıyım.

SQL, OS shell, LDAP, NoSQL, XPath ve template engine farklı interpreter'lar. XSS'de de veri olması gereken içerik tarayıcı tarafından çalıştırılabilir kod olarak yorumlanıyor. Savunma bağlama göre değişse de ortak çizgi aynı: parameterized query, context-aware output encoding, güvenli template engine, server-side validation ve veriyi komuttan yapısal olarak ayırmak.

> Kullanıcı verisi, çalıştırılacak dilin gramerine karışmamalı.

## A06:2025 — Insecure Design

Bir kontrol var ama kodu hatalıysa implementation bug. O kontrol hiç düşünülmediyse design flaw. İkisi aynı şey değil; ikinci durumda code review'da düzeltilecek tek bir yanlış satır bile olmayabilir.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a06-insecure-design.webp" alt="E-ticaret ve ödeme akışında trust boundary, işlem limiti, yeniden doğrulama ve rollback kontrollerini gösteren güvenli tasarım şeması" width="1536" height="1024" loading="lazy" />
  <figcaption>Limit, yeniden doğrulama ve geri alma davranışı koddan önce akışın tasarımında yer almalı.</figcaption>
</figure>

Para transferinde limit olmaması, kuponun eşzamanlı isteklerle defalarca kullanılması, negatif ürün adedi, kritik işlemde re-authentication bulunmaması, tenant izolasyonunun hiç tasarlanmaması veya rate limit gereksiniminin yazılmaması bu mantığa örnek.

Threat modeling yaparken şunları soruyorum:

- Neyi koruyorum?
- Kim saldırabilir?
- Trust boundary nerede?
- Veri hangi bileşenlerden geçiyor?
- Ne yanlış gidebilir?
- Kontrol bozulursa sistem nasıl davranmalı?

Normal use case “kullanıcı kupon kullanır” diyebilir. Abuse case ise “aynı kuponu eşzamanlı yüz istekte kullanır” diye sorar. Bu soruyu tasarım aşamasında sormadıysam en temiz kod bile eksik iş kuralını kendiliğinden icat etmeyecek.

Güvenlik gereksinimleri, threat model, abuse case, domain katmanında iş kuralları, quota/rate limit, step-up authentication, atomik transaction, rollback ve negatif testler savunmanın burada başlaması gereken yer.

> Güvenlik kontrolü tasarımda yoksa temiz kod onu sonradan var etmiş sayılmaz.

## A07:2025 — Authentication Failures

Authentication yalnızca login formuna kullanıcı adı ve parola yazmak değil. Kayıt, login, MFA, session üretimi, password reset, remember-me, token yenileme ve logout aynı kimlik yaşam döngüsünün parçaları.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a07-authentication.webp" alt="Login, MFA, session, parola sıfırlama ve logout adımlarını; credential stuffing ile session saldırılarını gösteren kimlik yaşam döngüsü şeması" width="1536" height="1024" loading="lazy" />
  <figcaption>Login başarılı olduktan sonra da session ve token yaşam döngüsünü güvenli yönetmek zorundayım.</figcaption>
</figure>

Credential stuffing, başka sızıntılardan gelen `email:password` çiftlerinin hedef sistemde otomatik denenmesi. Bu yüzden güçlü parola kuralı tek başına yeterli değil; sızdırılmış parola kontrolü, rate limit, MFA ve anomali tespiti de gerekiyor.

Session fixation'da saldırgan kurbanın kullanacağı session ID'yi önceden belirliyor. Login sonrası session ID yenilenmezse saldırgan aynı oturumu devralabiliyor. Çözümün temel parçası login sırasında session ID'yi rotate etmek.

Cookie tarafındaki `Secure`, `HttpOnly` ve `SameSite` bayrakları önemli ama bütün session güvenliğinin sihirli üçlüsü değil. Tahmin edilebilir token, uzun ömür, logout sonrası iptal etmeme, güvensiz reset akışı, user enumeration ve MFA bypass hâlâ masada.

MFA, sızdırılmış parola engeli, generic hata mesajları, güvenli rastgele token, kısa ömür, re-authentication, login sonrası session rotation, logout sonrası iptal ve authentication olaylarına alarm savunmanın birlikte çalışan parçaları.

> Kimlik doğrulama bir ekran değil, baştan sona yönetilen bir yaşam döngüsü.

## A08:2025 — Software or Data Integrity Failures

Integrity şu soruyu soruyor: “Bu yazılım veya veri, güvenilir kaynaktan çıktıktan sonra izinsiz biçimde değiştirilmiş olabilir mi?” Kaynağın adını bilmek tek başına cevabı vermiyor; doğrulama gerekiyor.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a08-integrity.webp" alt="Yazılım artifact'ları ve verilerin imza, hash ve provenance doğrulamasından geçerek sisteme alınmasını gösteren şema" width="1536" height="1024" loading="lazy" />
  <figcaption>İmza ve hash kontrolü, güvendiğim kaynaktan geldiğini sandığım parçanın yolda değişmediğini doğrular.</figcaption>
</figure>

İmzasız update kabul etmek, imzayı kontrol etmemek, güvensiz plugin yüklemek, artifact'ı doğrulamadan deploy etmek, client-side state'e güvenmek ve queue/cache verisini doğrulamadan işlemek bu aileye girebilir.

Insecure deserialization da burada önemli. Saldırgan değiştirebildiği serialized veriyi uygulama güvenilir nesne gibi açarsa yetki değişikliği, object injection, logic abuse, veri manipülasyonu ve bazı teknolojilerde kod çalıştırma doğabilir.

A03 ile sınırını şöyle aklımda tutuyorum:

```text
A03 → Bağımlılık, build ve dağıtım ekosistemi nasıl bozulabilir?
A08 → Aldığım yazılım veya verinin bütünlüğünü gerçekten doğruluyor muyum?
```

Bu iki kategori aynı olayda birlikte bulunabilir. Kötü niyetli paket tedarik zinciri problemidir; build sisteminin imzasız artifact'ı kabul etmesi ayrıca integrity problemidir.

İmzalı update, hash ve signature verification, provenance, immutable artifact, güvenilir repository, açık veri şeması, native deserialization'dan kaçınma ve doğrulama başarısızlığında fail closed temel savunmalar.

> “Nereden geldiğini biliyorum” ile “değiştirilmediğini doğruladım” aynı cümle değil.

## A09:2025 — Security Logging and Alerting Failures

Loglama “ne oldu?” sorusuna cevap verir. Alerting ise “bu olay yeterince şüpheliyse kim, ne zaman ve nasıl harekete geçecek?” sorusuna.

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a09-logging.webp" alt="Uygulama olaylarının merkezi ve değiştirilemez log sisteminde toplanıp korelasyon, alarm ve analist müdahalesine dönüşmesini gösteren şema" width="1536" height="1024" loading="lazy" />
  <figcaption>Kayıt var ama alarm ve müdahale yoksa güvenlik kamerası çalışıyor, monitöre bakan kimse yok demektir.</figcaption>
</figure>

Başarılı/başarısız login, MFA hatası, password reset, yetki reddi, admin işlemi, rol değişikliği, kritik veri erişimi, finansal işlem, rate limit, session iptali, configuration değişikliği ve beklenmeyen exception gibi olayları anlamlı biçimde kaydetmek gerekir.

Fakat log her şeyi çöpe atabileceğim bir depo değil. Plaintext parola, access/session token, private key, secret, tam kart bilgisi veya gereksiz kişisel veri loglanmamalı.

İyi bir güvenlik olayı kaydında zaman damgası, olay türü, kullanıcı/sistem kimliği, correlation ID, hedef kaynak, sonuç ve risk seviyesi bulunur. Loglar merkezi toplanmalı, saatler senkron olmalı, erişimleri sınırlanmalı ve saldırganın kolayca değiştiremeyeceği biçimde korunmalı.

Tek IP'den birçok hesaba login denemesi, normal kullanıcının admin endpoint'ine seri isteği, kritik configuration değişikliği, artan 403/404, aynı exception'ın patlaması veya log pipeline'ın durması alarm sebebi olabilir. Alarmın gerçekten bir playbook'a ve sorumlu kişiye bağlanması gerekir.

> Kaydetmediğim olayı analiz edemem; alarm üretmediğim olaya zamanında müdahale edemem.

## A10:2025 — Mishandling of Exceptional Conditions

Bu kategori 2025 listesinin yeni üyesi. Uygulama normal şartlarda güzel çalışabilir. Peki database yarıda kesilirse, disk dolarsa, parametre eksik gelirse, timeout oluşursa, harici servis yarım cevap verirse veya iki istek aynı state'i aynı anda değiştirirse ne olacak?

<figure class="article-figure">
  <img src="/images/blog/owasp-top-10-2025/a10-exceptional-conditions.webp" alt="Yarıda kesilen çok adımlı işlemin güvenli akışta rollback ve alarm üretmesini, güvensiz akışta tutarsız state bırakmasını gösteren şema" width="1536" height="1024" loading="lazy" />
  <figcaption>Güvenli sistem yalnızca happy path'te değil; ağ koptuğunda, kaynak tükendiğinde ve işlem yarıda kaldığında da ne yapacağını bilir.</figcaption>
</figure>

OWASP bu ailede olağan dışı durumu önleyememe, gerçekleşirken algılayamama veya sonrasında kötü tepki verme problemlerine odaklanıyor. Eksik input validation, uncaught exception, yanlış return value, null dereference, kaynak temizlememe, hassas stack trace ve failing open bunun parçaları olabilir.

Fail-open örneği:

```text
Yetki servisi cevap vermedi → kullanıcıyı içeri al
```

Fail-closed yaklaşımı:

```text
Yetki doğrulanamadı → işlemi kontrollü biçimde durdur
```

Bir para transferini düşünelim:

1. Gönderenden parayı düş.
2. Alıcıya parayı ekle.
3. İşlem kaydını oluştur.

İkinci adımda ağ kesildiğinde tüm transaction geri alınmıyorsa state tutarsız kalabilir. Aynı şekilde exception sonrasında database connection, lock, file handle veya memory serbest bırakılmıyorsa saldırgan tekrar tekrar hata üreterek kaynak tüketebilir.

Race condition da yalnızca “çok hızlı iki istek” meselesi değil; state geçişinin atomik tasarlanmaması meselesi:

```text
Kupon kullanılmamış mı? Evet.
Kuponu uygula.
Kullanılmış olarak işaretle.
```

İki istek ilk kontrolü aynı anda geçerse kupon iki kez uygulanabilir.

Yerinde exception handling, global son güvenlik ağı, kontrollü kullanıcı mesajı, güvenli teknik log, alarm, atomik transaction, rollback, resource cleanup, timeout, retry politikası, circuit breaker, quota, rate limit, state machine, invariant ve fault-injection testleri bu kategorinin savunma araçları.

> Gerçek güvenlik, sistemin plan bozulduğunda da kontrollü davranabilmesidir.

## Birbirine benzeyen kategorileri nasıl ayırıyorum?

Tek bir olay birden fazla kategoriyle ilişkili olabilir. OWASP etiketi seçmek için en görünür semptoma değil, kök nedene bakıyorum.

| Karışan kategoriler | Ayıran soru |
|---|---|
| Authentication / Access Control | Kullanıcının kimliği mi doğrulanamadı, yetkisi mi uygulanmadı? |
| Misconfiguration / Insecure Design | Kontrol yanlış mı ayarlı, yoksa hiç tasarlanmamış mı? |
| Supply Chain / Integrity | Zincir mi ele geçirildi, gelen artifact doğrulanmadı mı? |
| Injection / Exceptional Conditions | Veri komuta mı dönüştü, yoksa beklenmeyen state mi kötü yönetildi? |

Bir admin endpoint'inin frontend'de gizli ama API'de açık olması access control. Endpoint'i koruyacak mekanizmanın hiç tasarlanmamış olması aynı zamanda insecure design tartışmasına girebilir. Production debug çıktısının açık kalması misconfiguration; exception'ın hassas stack trace üretmesi A10 ile de kesişebilir.

Kategori seçmek bazen kesin bir kutulama değil. Önemli olan raporda kök nedeni açık yazmak ve etiketi kanıtın önüne koymamak.

## Güvenli laboratuvar ve çalışma planı

Bu konuları yetkisiz gerçek sistemlerde denemek yerine kontrollü laboratuvar kullanırım:

- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- DVWA
- crAPI
- Kendi yerel Docker laboratuvarım

On günlük bir planı şöyle kurabilirim:

1. A01 — IDOR, rol geçişi ve forced browsing
2. A02 — Debug, header, varsayılan credential ve cloud izinleri
3. A03 — Dependency tree, SCA ve SBOM
4. A04 — Hashing, TLS, token entropy ve key management
5. A05 — SQLi, XSS ve command injection
6. A06 — Threat model, abuse case ve iş limiti
7. A07 — Session, reset, MFA ve logout
8. A08 — Signature, provenance ve deserialization
9. A09 — Olay şeması, masking, korelasyon ve alarm
10. A10 — Timeout, rollback, fail closed ve fault injection

Her gün yalnızca payload çalıştırmak yerine şu sekiz soruyu cevaplamaya çalışırım:

```text
1. Korunan varlık ne?
2. Trust boundary nerede?
3. Saldırgan hangi girdiyi kontrol ediyor?
4. Hangi kontrol eksik veya yanlış?
5. Sistem neden bu girdiye güveniyor?
6. Teknik etki ne?
7. İş etkisi ne?
8. Kök nedeni kaldıran düzeltme ne?
```

## Bulduğumu nasıl raporlarım?

“A01 buldum” tek başına rapor değil. İyi rapor, başka birinin problemi tekrar üretmesini, etkisini anlamasını ve doğru noktayı düzeltmesini sağlar.

```markdown
## Başlık
[Zafiyet türü] nedeniyle [somut etki]

## Etkilenen varlık
- URL / endpoint / method
- Rol ve ortam

## Ön koşullar
- Authentication gerekli mi?
- Hangi role ihtiyaç var?
- Kullanıcı etkileşimi gerekiyor mu?

## Teknik kök neden
Kontrol nerede ve neden eksik?

## Yeniden üretim adımları
1. ...
2. ...

## Beklenen / gerçek davranış
Sistem ne yapmalıydı, ne yaptı?

## Etki
- Confidentiality
- Integrity
- Availability
- Business impact

## Eşleştirme
- OWASP Top 10
- CWE
- CVSS

## Düzeltme önerisi
Semptomu değil kök nedeni kaldıran öneri.
```

OWASP kategorisi raporu düzenlemeye yardım eder; kanıt, kapsam ve etki analizinin yerini tutmaz.

## Sonuç: Listeyi değil düşünme biçimini öğrenmek

Yanlış çalışma yöntemi bana şöyle görünüyor:

```text
On başlığı ezberle
→ iki payload kopyala
→ tarayıcı çalıştır
→ bitti san
```

Daha sağlam yöntem ise şu:

```text
Varlığı tanı
→ trust boundary'yi bul
→ kullanıcı kontrollü girdiyi izle
→ eksik kontrolü belirle
→ kök nedeni açıkla
→ teknik ve iş etkisini ayır
→ kalıcı savunmayı tasarla
```

Kendi kısa özetim:

```text
A01 Yetki sınırı bozuluyor.
A02 Sistem yanlış ayarlanıyor.
A03 Tedarik zinciri güvenilmeyen parça taşıyor.
A04 Veri veya anahtar yanlış korunuyor.
A05 Veri komuta dönüşüyor.
A06 Gerekli kontrol tasarımda yok.
A07 Kimlik ve session yaşam döngüsü bozuluyor.
A08 Yazılım veya verinin bütünlüğü doğrulanmıyor.
A09 Saldırı görülmüyor veya alarm üretmiyor.
A10 Beklenmeyen durum güvenli yönetilmiyor.
```

OWASP Top 10 bir payload listesi değil. Bana uygulamanın yalnızca çalışan ekranına değil; yetki sınırına, yapılandırmasına, build zincirine, veri akışına, tasarım kararına ve hata anındaki davranışına birlikte bakmayı öğreten bir **güvenlik düşünme modeli**.

---

### Resmî kaynaklar

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP Top 10 ana proje sayfası](https://owasp.org/www-project-top-ten/)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

### Görsel kaynakları

- Kapak ve A01–A10 teknik illüstrasyonları bu yazı için yerel olarak üretilmiştir.
