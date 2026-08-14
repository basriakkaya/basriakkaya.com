---
title: "Network Öğrenme Günlüğü — Gün 1: İnternet Var mı?"
description: "Network ile internet arasındaki farktan IP, MAC, switch, router, gateway, kapsülleme ve ping testlerine uzanan ilk gün notlarım."
publishedAt: 2026-08-03
lang: tr
translationKey: "network-learning-journal-day-1"
draft: false
category: "ag-ve-linux"
series: "network-ogrenme-gunlugu"
seriesOrder: 1
toc: true
tags:
  - Network
  - Linux
  - Temel Kavramlar
  - Öğrenme Günlüğü
cover: "/images/blog/network-gun-1/network-altyapisi.jpg"
coverAlt: "Bir ağ kabininde Ethernet kabloları, switch ve diğer ağ donanımları"
---

Bugün network öğrenme serüvenimin ilk günü.

Hedefim çok net: sadece araç çalıştıran biri olmak istemiyorum. Bir araç bana bir çıktı verdiğinde, o çıktının **neden öyle geldiğini** anlayabilmek istiyorum.

Terminale `nmap`, `ping`, `curl` veya `traceroute` yazmak kolay. Zor olan, arka tarafta gerçekten ne olduğunu açıklayabilmek:

- Paket nereye gidiyor?
- Switch ile router tam olarak ne yapıyor?
- IP adresi ile MAC adresi neden ayrı şeyler?
- `127.0.0.1` neden her zaman “ben” oluyor?
- Wi-Fi simgesi doluyken internet neden çalışmayabiliyor?
- Bir port açık diye sistem neden otomatik olarak ele geçirilmiş olmuyor?

Bugün bu soruların temelini kuruyorum. Başlangıç seviyesinden başlayacağım ama çocukça değil; sade, teknik ve gerektiği kadar ayrıntılı ilerleyeceğim.

<figure class="article-figure">
  <img src="/images/blog/network-gun-1/network-altyapisi.jpg" alt="Bir ağ kabininde Ethernet kabloları, switch ve diğer ağ donanımları" width="1920" height="1440" loading="eager" />
  <figcaption>Bir ağın fiziksel tarafı: kablolar, switch'ler ve diğer altyapı bileşenleri. Fotoğraf: Cloud899, CC BY-SA 4.0.</figcaption>
</figure>

## Network internet demek değildir

Network, Türkçesiyle **ağ**, iki veya daha fazla cihazın veri alışverişi yapabilmesini sağlayan yapıdır.

En basit hâliyle iki bilgisayarın birbiriyle konuşması da bir ağdır. Telefon, yazıcı, Raspberry Pi, güvenlik kamerası, sanal makine, router veya IoT cihazı da bu ağın bir parçası olabilir.

Evdeki bilgisayarım aynı Wi-Fi ağına bağlı yazıcıya belge gönderiyorsa ortada ağ iletişimi vardır. Bunun için internetin çalışmasına gerek yoktur. İki cihaz aynı yerel ağda olduğu sürece birbirleriyle haberleşebilir.

İlk önemli ayrımım bu:

> Network her zaman internet demek değildir.

İnternet ise tek bir dev bilgisayar veya tek bir şirketin sahip olduğu tek bir ağ değildir. Milyonlarca farklı ağın birbirine bağlanmasıyla oluşan bir **ağlar ağıdır**.

Bir web sitesine bağlandığımda bilgisayarım siteye ışınlanmıyor. Trafik önce yerel ağdan çıkıyor, router'a ulaşıyor, servis sağlayıcının ağına geçiyor, yol boyunca başka yönlendiricilerden ilerliyor ve sonunda hedef veri merkezine ulaşıyor.

Paketler bir bakıma kargo gibi elden ele gidiyor. Fark şu: burada kurallar “abi evde yokmuş” seviyesinde değil, protokollerle belirleniyor.

## Host, istemci ve sunucu

Ağa bağlı olan ve ağ üzerinden iletişim kurabilen cihazlara **host** denir. Laptop, telefon, yazıcı ve Raspberry Pi ayrı ayrı birer host olabilir.

Bir hostun genellikle bir ağ arayüzü, IP adresi ve ağ yapılandırması bulunur. Ancak “host” cihazın o an hangi rolü üstlendiğini söylemez. Bunun için istemci–sunucu ilişkisine bakmam gerekir.

**İstemci**, bir hizmet talep eden taraftır. Tarayıcı, mobil uygulama, SSH istemcisi veya e-posta uygulaması buna örnektir.

**Sunucu**, o hizmeti sunan taraftır. Web, DNS, dosya veya e-posta sunucusu olabilir.

Basit akış şöyledir:

```text
İstemci  ---- İstek ---->  Sunucu
İstemci  <--- Cevap ----  Sunucu
```

Tarayıcıdan bir web sitesine girdiğimde tarayıcı istemci rolündedir. Sunucuya şöyle bir HTTP isteği gönderebilir:

```http
GET / HTTP/1.1
Host: example.com
```

Sunucu da buna cevap verir:

```http
HTTP/1.1 200 OK
Content-Type: text/html
```

Bunu müşteri–kasiyer ilişkisine benzetebilirim:

```text
Müşteri: Bir kahve alabilir miyim?
Kasiyer: Elbette, buyurun.
```

Teknik karşılığı ise istek ve cevaptır.

Sunucu her zaman veri merkezinde duran devasa bir makine olmak zorunda değildir. Kendi bilgisayarımda şu komutu çalıştırırsam o bilgisayar, 8000 numaralı portta basit bir web sunucusu olur:

```bash
python3 -m http.server 8000
```

Aynı cihaz bir bağlantıda istemci, başka bir bağlantıda sunucu olabilir. Rolü belirleyen şey cihazın fiyatı veya büyüklüğü değil, o iletişimde ne yaptığıdır.

## Ağ arayüzü: Trafik hangi kapıdan çıkıyor?

Ağ arayüzü, cihazın ağa bağlandığı fiziksel veya sanal bağlantı noktasıdır.

Örnek olarak:

- Wi-Fi kartı
- Ethernet kartı
- VPN tüneli
- Loopback arayüzü
- Sanal makine veya konteyner adaptörü

macOS üzerinde `en0`, `lo0` ve `utun0`; Linux üzerinde `eth0`, `wlan0`, `lo` ve `tun0` gibi isimlerle karşılaşabilirim.

Bir bilgisayarda aynı anda birden fazla ağ arayüzü bulunabilir. Wi-Fi üzerinden internete bağlıyken VPN kullanabilir, Docker ağı çalıştırabilir ve loopback üzerinden kendi içindeki bir servise erişebilirim.

Bu yüzden “bilgisayarın bir IP adresi vardır” cümlesi çoğu zaman fazla basittir. Daha doğru ifade şudur:

> Ağ arayüzlerinin IP adresleri vardır.

## IP ve MAC neden iki farklı adres?

IP adresi, ağ üzerindeki **mantıksal adrestir**. Bir paketin nereden çıktığını ve nereye gittiğini belirtir.

```text
Kaynak IP: 192.168.1.20
Hedef IP:  1.1.1.1
```

IP adresini posta adresine benzetmek başlangıçta işe yarıyor ama bu benzetmenin sınırları var. IP adresim bulunduğum ağa göre değişebilir. Evde `192.168.1.20`, üniversitede `10.20.30.55`, telefon erişim noktasında `172.20.10.2` alabilirim. Cihaz aynı cihazdır; mantıksal konumu değişmiştir.

MAC adresi ise ağ arayüzüyle ilişkili **yerel ağ adresidir**:

```text
A4:5E:60:12:34:56
```

Temel farkı şöyle aklımda tutuyorum:

```text
IP  → Hangi ağa ve hangi hosta gitmeliyim?
MAC → Bu yerel ağda frame'i hangi arayüze teslim etmeliyim?
```

IP, ağlar arasında yönlendirme kararlarında kullanılır. MAC adresi ise özellikle aynı yerel ağdaki Ethernet iletişiminde önemlidir.

MAC adresini “cihazın dünyadaki değişmeyen kimlik numarası” olarak görmek de doğru değil. MAC taklit edilebilir, işletim sistemleri gizlilik için rastgeleleştirme kullanabilir, sanal arayüzlerin kendi MAC adresleri olabilir ve tek cihazda birden fazla ağ kartı bulunabilir.

## Switch ve router aynı işi yapmıyor

Switch, aynı yerel ağdaki cihazları birbirine bağlar. Gelen Ethernet frame'lerinin kaynak MAC adreslerini öğrenir ve zamanla hangi MAC adresinin hangi fiziksel portta olduğunu tutan bir tablo oluşturur.

Mantığı kabaca şöyledir:

> “Bu MAC adresini 3 numaralı portta görmüştüm. Frame'i oraya göndermeliyim.”

Hub ise çok daha kaba davranır; gelen veriyi genellikle tüm portlara yayar. Network dünyasında dedikoducu komşu hub, adres bilen kurye switch'tir.

Router ise farklı ağlar arasında paket yönlendirir. Temel sorusu şudur:

> “Bu hedef IP hangi ağda ve paketi bir sonraki adımda nereye göndermeliyim?”

Router karar verirken routing table, hedef IP ve next hop gibi bilgilere bakar.

<figure class="article-figure">
  <img src="/images/blog/network-gun-1/router-switch-katmanlari.png" alt="Switch'in veri bağlantı, router'ın ağ katmanında çalışmasını gösteren şema" width="739" height="426" loading="lazy" />
  <figcaption>Switch ve router'ın ağ modelindeki temel konumu. Şema: Xcrespo11, CC BY-SA 3.0.</figcaption>
</figure>

Şimdilik kısa formülüm:

```text
Switch → Aynı yerel ağ içindeki iletişim
Router → Farklı ağlar arasındaki iletişim
```

Gerçek cihazlar birden fazla görevi aynı kutuda yapabilir. Evde “modem” dediğim cihaz çoğu zaman modem, router, switch, kablosuz erişim noktası, DHCP sunucusu, NAT cihazı ve firewall rollerinin birkaçını birlikte üstlenir.

Tek kutu, beş meslek.

## Default gateway: Yerel ağın çıkış kapısı

Bilgisayarım hedef IP'nin kendi yerel ağında olmadığını anlarsa paketi **default gateway** adresine gönderir.

```text
Laptop IP:       192.168.1.20
Default gateway: 192.168.1.1
Hedef:           1.1.1.1
```

Bilgisayarın mantığı şudur:

> “Bu hedef benim yerel ağımda değil. Doğrudan nasıl ulaşacağımı bilmiyorum; paketi yönlendiriciye bırakıyorum.”

Gateway olmadan cihaz genellikle kendi yerel ağındaki sistemlerle konuşabilir ama başka ağlara çıkamaz.

Burada modem ve access point kavramlarını da ayırmam gerekiyor:

- **Modem**, servis sağlayıcıdan gelen bağlantıyı kullanılabilir sinyale dönüştürür.
- **Router**, farklı ağlar arasında yönlendirme yapar.
- **Access point**, kablosuz cihazların yerel ağa katılmasını sağlar.
- **Switch**, aynı yerel ağdaki kablolu cihazları birbirine bağlar.

Ev cihazlarında bu roller aynı kasanın içinde olduğu için günlük dilde hepsine “modem” deyip geçiyoruz.

## LAN, WAN ve internet

**LAN**, ev, ofis veya laboratuvar gibi sınırlı bir alandaki yerel ağdır.

**WAN**, daha geniş coğrafi bölgelerdeki ağları birbirine bağlar. Farklı şehirlerdeki şirket ofislerinin özel bağlantıları veya servis sağlayıcı altyapıları buna örnek olabilir.

**İnternet** ise birbirinden bağımsız çok sayıda ağın ortak protokoller üzerinden birbirine bağlandığı küresel yapıdır.

```text
LAN      → Yerel alan
WAN      → Geniş coğrafi alan
İnternet → Birbirine bağlı ağlar bütünü
```

## Veri, segment, paket ve frame

Bu dört kelime çoğu zaman rastgele birbirinin yerine kullanılıyor. Aslında farklı katmanlardaki veri yapılarını anlatıyorlar.

Bir uygulamanın ürettiği veri ağdan çıkarken her katman kendi bilgisini ekler:

```text
Uygulama verisi
      ↓
TCP segmenti
      ↓
IP paketi
      ↓
Ethernet frame'i
      ↓
Kablo veya Wi-Fi
```

Bu işleme **kapsülleme** denir. Hedef cihazda başlıklar ters sırayla açılır; buna da kapsülden çıkarma denir.

<figure class="article-figure light-figure">
  <img src="/images/blog/network-gun-1/kapsulleme.png" alt="Uygulama verisinin UDP, IP ve bağlantı katmanı başlıklarıyla kapsüllenmesini gösteren şema" width="1280" height="800" loading="lazy" />
  <figcaption>Uygulama verisinin taşıma, internet ve bağlantı katmanlarında kapsüllenmesi. Şema: Cburnett ve Kbrose, CC BY-SA 3.0.</figcaption>
</figure>

Bunu kargo gibi düşünebilirim: belge zarfa, zarf kargo poşetine, kargo poşeti araca girer. Her katmanın kendi görevi ve kendi adres bilgisi vardır.

Önemli nokta şu:

> Segment, paket ve frame rastgele eş anlamlı kelimeler değildir.

## Loopback: Kendime paket gönderiyorum

Loopback, cihazın kendi kendisiyle iletişim kurmasını sağlayan sanal ağ arayüzüdür. En bilinen IPv4 loopback adresi `127.0.0.1`, hostname karşılığı ise `localhost` olur.

Bu adresi kullandığımda trafik router'a veya internete gitmez. Bilgisayar kendi içinde konuşur.

```bash
python3 -m http.server 8000
```

Bu sunucuya aynı cihazdan şu adresle erişebilirim:

```text
http://127.0.0.1:8000
```

Her cihaz için `127.0.0.1` kendisini ifade eder. Başka bir bilgisayarda bu adresi açarsam benim bilgisayarıma değil, o bilgisayarın kendisine bağlanırım.

Loopback, network dünyasının “kendime mesaj attım, kendim cevapladım” özelliği.

## Ping neyi kanıtlar, neyi kanıtlamaz?

Ping, bir hedefe ağ üzerinden ulaşılabilirliği sınamak için kullanılan temel araçlardan biridir. Genellikle ICMP Echo Request gönderir ve ICMP Echo Reply bekler.

```bash
ping -c 4 1.1.1.1
```

Çıktıda gönderilen ve alınan paket sayısını, paket kaybını ve gidiş–dönüş süresini görebilirim.

Fakat ping başarısızsa hedefin kesinlikle kapalı olduğunu söyleyemem. Firewall ICMP'yi engelliyor olabilir, ara router cevap vermiyor olabilir veya hedef özellikle ping cevaplarını kapatmış olabilir. Aynı sistem HTTPS trafiğine izin vermeye devam edebilir.

Bu yüzden:

> Ping bir sinyaldir, kesin hüküm değildir.

## “İnternet var mı?” sorusunu dört parçaya bölmek

Bugünün en faydalı pratiği, ağ problemini katman katman kontrol etmek oldu.

### 1. Loopback testi

```bash
ping -c 4 127.0.0.1
```

Bu test cihazın kendi TCP/IP yığını ve loopback arayüzü hakkında fikir verir.

### 2. Gateway testi

```bash
ping -c 4 192.168.1.1
```

Gateway adresi her ağda aynı olmak zorunda değildir. Bu test yerel ağ bağlantısını ve router'a erişimi sorgular.

### 3. Genel IP testi

```bash
ping -c 4 1.1.1.1
```

Bu test, DNS'e ihtiyaç duymadan internet yönünde IP seviyesinde erişim olup olmadığını anlamama yardımcı olur.

### 4. Alan adı testi

```bash
ping -c 4 google.com
```

IP adresine ulaşabiliyor fakat alan adına ulaşamıyorsam güçlü şüphelilerden biri DNS olur.

Kontrol sıram şöyle:

```text
127.0.0.1 → Gateway → Genel IP → Alan adı
```

Bu sıra bana “internet yok” demek yerine problemin nerede olabileceğini söylemeye başlıyor.

## Dört kısa arıza senaryosu

### Loopback başarılı, gateway başarısız

Wi-Fi bağlantısı, yanlış arayüz, gateway yapılandırması, yerel ağ veya router erişimi tarafına bakarım.

### Gateway başarılı, `1.1.1.1` başarısız

Router'ın internet çıkışı, servis sağlayıcı, routing veya firewall tarafı şüphelidir.

### `1.1.1.1` başarılı, alan adı başarısız

IP seviyesinde dışarı çıkabiliyorum ama alan adını çözemiyorum. İlk güçlü şüpheli DNS olur.

### Ping başarısız, web sitesi açılıyor

Bu tamamen mümkündür. ICMP engellenirken HTTP/HTTPS trafiğine izin verilebilir. “Ping yoksa sistem yok” sonucu çıkaramam.

## Gün 1 laboratuvarı

Bu komutlar yalnızca gözlem için. Çıktıyı paylaşırken yerel IP, MAC, VPN ve kurum ağı gibi bilgilerin özel olabileceğini unutmamak gerekiyor.

### macOS

```bash
# Ağ arayüzleri
ifconfig

# en0 arayüzünün IPv4 adresi
ipconfig getifaddr en0

# Varsayılan rota ve gateway
route -n get default

# Alternatif routing tablosu görünümü
netstat -rn

# Katmanlı erişim testleri
ping -c 4 127.0.0.1
ping -c 4 <gateway-ip>
ping -c 4 1.1.1.1
ping -c 4 google.com
```

### Linux

```bash
# Ağ arayüzleri ve adresler
ip addr

# Routing tablosu ve default gateway
ip route

# Dinleyen ve açık socket'leri gözlemlemek için
ss -tulpn

# Katmanlı erişim testleri
ping -c 4 127.0.0.1
ping -c 4 <gateway-ip>
ping -c 4 1.1.1.1
ping -c 4 google.com
```

`ss -tulpn` bugünün ana konusu değil ama hangi servisin hangi portta dinlediğini görmek açısından güzel bir gözlem noktası. Açık bir port gördüğümde bunun yalnızca bir servisin bağlantı kabul ettiğini gösterdiğini; otomatik olarak güvenlik açığı veya ele geçirilmiş sistem anlamına gelmediğini de unutmamam gerekiyor.

## Günün kısa sözlüğü

| Türkçe | İngilizce |
|---|---|
| Ağ | Network |
| Ana makine | Host |
| İstemci | Client |
| Sunucu | Server |
| İstek | Request |
| Cevap | Response |
| Ağ arayüzü | Network interface |
| Kaynak IP | Source IP |
| Hedef IP | Destination IP |
| Yönlendirici | Router |
| Ağ anahtarı | Switch |
| Varsayılan ağ geçidi | Default gateway |
| Paket | Packet |
| Çerçeve | Frame |
| Yerel ağ | Local network |
| Erişim noktası | Access point |
| Kapsülleme | Encapsulation |
| Kapsülden çıkarma | Decapsulation |
| Paket kaybı | Packet loss |

## Kendimi test ediyorum

Notlara bakmadan şu soruları cevaplayabiliyorsam ilk günün temeli oturmaya başlamış demektir:

1. Network ile internet aynı şey mi?
2. Bir host hangi durumda istemci, hangi durumda sunucu olur?
3. IP ve MAC adresleri neden ayrı kavramlardır?
4. Switch ile router arasındaki temel fark nedir?
5. Default gateway neden gereklidir?
6. `127.0.0.1` kimi ifade eder?
7. Segment, paket ve frame aynı şey mi?
8. `1.1.1.1` çalışırken bir alan adı çalışmıyorsa ilk olarak hangi sistemi sorgularım?
9. Ping başarısızsa hedefin kesinlikle kapalı olduğunu söyleyebilir miyim?
10. Wi-Fi bağlantısı ile internet erişimi neden aynı şey değildir?

## Günün sonunda kafamda oluşan resim

Tarayıcıya bir web adresi yazdığımda artık yalnızca “site açılıyor” diye düşünmüyorum.

İstemci bir istek hazırlıyor. Veri ağ arayüzünden çıkmadan önce katman katman kapsülleniyor. Hedef yerel ağda değilse frame önce default gateway'in yerel ağdaki MAC adresine teslim ediliyor. Router IP paketine bakıp bir sonraki yolu seçiyor. Paket farklı ağlardan geçerek sunucuya ulaşıyor. Sunucu cevabı hazırlıyor ve süreç ters yönde tekrar yaşanıyor.

Elbette DNS, ARP, TCP bağlantısı, TLS ve routing gibi açılması gereken daha çok kutu var. Ama artık kavramlar birbirinden kopuk ezberler değil; aynı yolculuğun parçaları.

Bugünün özeti:

- İstemci hizmet ister, sunucu hizmet sunar.
- Switch aynı yerel ağdaki cihazları bağlar.
- Router farklı ağlar arasında paket yönlendirir.
- IP mantıksal adres, MAC yerel ağ teslimatında kullanılan adrestir.
- Default gateway dış ağlara çıkış noktasıdır.
- Segment, paket ve frame aynı şey değildir.
- `127.0.0.1` cihazın kendisidir.
- Ping başarısızlığı tek başına hedefin kapalı olduğunu kanıtlamaz.

İlk günün sonunda hâlâ dünyanın en iyi network uzmanı değilim.

Ama artık “Wi-Fi çekiyor, internet niye yok?” demek yerine daha doğru sorular sorabiliyorum:

- Loopback çalışıyor mu?
- Gateway erişilebilir mi?
- Genel bir IP adresine ulaşabiliyor muyum?
- DNS çözümlemesi çalışıyor mu?

Gerçek gelişim biraz da burada başlıyor: daha fazla komut ezberlemekte değil, daha doğru soru sormakta.

Bir sonraki gün OSI ve TCP/IP modellerine, katman mantığına ve Wireshark ile ilk paket analizine geçeceğim.

Kural basit:

> Komutu çalıştır. Çıktıyı gör. Ama en önemlisi, neden öyle olduğunu açıkla.

---

### Görsel kaynakları

- Ağ altyapısı fotoğrafı: [Cloud899 — Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Network-Engineering_Ashlan_Chidester_7.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Switch ve router şeması: [Xcrespo11 — Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Router_switch_in_OSI_model.png), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- Kapsülleme şeması: [Cburnett ve Kbrose — Wikimedia Commons](https://commons.wikimedia.org/wiki/File:UDP_encapsulation.svg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
