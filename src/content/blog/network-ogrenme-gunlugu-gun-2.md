---
title: "Network Öğrenme Günlüğü — Gün 2: Katmanlardan Paket Avına"
description: "OSI ve TCP/IP modellerini, kapsülleme sürecini ve Wireshark ile ICMP, DNS, TCP ve TLS paketlerini incelemeyi öğrendiğim ikinci gün notlarım."
publishedAt: 2026-08-04
lang: tr
translationKey: "network-learning-journal-day-2"
draft: false
category: "ag-ve-linux"
series: "network-ogrenme-gunlugu"
seriesOrder: 2
toc: true
tags:
  - Network
  - Wireshark
  - OSI
  - TCP/IP
  - Paket Analizi
cover: "/images/blog/network-gun-2/osi-wireshark-cover.png"
coverAlt: "Katmanlardan geçen ağ paketlerini ve paket analiz ekranını gösteren koyu temalı teknik illüstrasyon"
---

Dün “internet var mı?” diye başlayıp switch, router, IP, MAC, gateway ve paket kavramlarına kadar gelmiştim. Bugün işi biraz daha kurcalayıp paketin içine bakıyorum.

Hedefim şu soruya düzgün cevap verebilmek:

> Tarayıcıdan çıkan veri hangi katmanlardan geçiyor ve Wireshark'ta neden Ethernet, IP, TCP ve TLS diye iç içe görünüyor?

Çünkü “paket gidiyor abi” teknik olarak tamamen yanlış değil ama insanın içini de pek rahatlatmıyor. Kargo firması takip ekranına “bir yerlere gidiyor” yazsa müşteri hizmetlerini arardık.

<figure class="article-figure">
  <img src="/images/blog/network-gun-2/osi-wireshark-cover.png" alt="Katmanlardan geçen ağ paketlerini ve paket analiz ekranını gösteren koyu temalı teknik illüstrasyon" width="1536" height="1024" loading="eager" />
  <figcaption>Bugünün rotası: teoride katmanlar, pratikte gerçek paketler.</figcaption>
</figure>

## Neden katman diye bir şey var?

Bir web sitesini açarken tek bir dev protokol bütün işi sırtlanmıyor. Tarayıcı isteği hazırlıyor, TCP taşıma işini yönetiyor, IP hedefi buluyor, Ethernet veya Wi-Fi yerel teslimatı yapıyor, fiziksel ortam da bitleri gerçekten taşıyor.

```text
Tarayıcı
   ↓
HTTP / TLS
   ↓
TCP
   ↓
IP
   ↓
Ethernet / Wi-Fi
   ↓
Elektrik · ışık · radyo dalgası
```

Katmanlı yapı sayesinde her parça kendi işine bakıyor. Daha önemlisi, sorun çıktığında ben de nereden başlayacağımı biliyorum:

- Kablo ve sinyal mi?
- Yerel ağ ve MAC teslimatı mı?
- IP yönlendirmesi mi?
- TCP bağlantısı mı?
- Yoksa uygulama mı “bugün çalışasım yok” dedi?

Katmanlı düşünmek, her problemde DNS değiştirme refleksinden kurtulmanın ilk adımı.

## OSI modeli: yedi katlı network apartmanı

OSI, **Open Systems Interconnection** ifadesinin kısaltması. Gerçek internetin birebir çalışan protokol seti değil; iletişimi anlamak, sınıflandırmak ve sorun gidermek için kullandığımız kavramsal bir model.

Yedi katmanı üstten alta şöyle:

| Katman | Adı | Temel işi | Örnek | Veri birimi |
|---:|---|---|---|---|
| 7 | Application | Uygulama protokolleri | HTTP, DNS, SSH | Data |
| 6 | Presentation | Format, encoding, şifreleme | UTF-8, TLS, JPEG | Data |
| 5 | Session | Oturumun yönetimi | Oturum kontrolü | Data |
| 4 | Transport | Uçtan uca taşıma ve portlar | TCP, UDP | Segment / Datagram |
| 3 | Network | Ağlar arası yönlendirme | IP, router | Packet |
| 2 | Data Link | Yerel ağda teslimat | Ethernet, MAC, switch | Frame |
| 1 | Physical | Bitlerin fiziksel taşınması | Kablo, fiber, Wi-Fi | Bits |

Ezber cümleleri var ama yalnızca sırayı bilmek yetmiyor. Telefon rehberini ezberleyip kimseyi tanımamak gibi bir şey olur.

### Layer 1 — Physical: fişi kontrol ettin mi?

Fiziksel katmanda HTTP, IP veya port yok. Elektrik sinyali, ışık, radyo dalgası, kablo, konektör ve sinyal gücü var.

Kablo kopuksa, Wi-Fi kapalıysa veya ağ kartı devre dışıysa buradayız. Bu durumda DNS değiştirmek, elektriği kesik eve yeni modem şifresi yazmaya benziyor.

### Layer 2 — Data Link: mahallenin teslimat işleri

Aynı yerel ağdaki iletişimi yönetir. MAC adresleri, Ethernet frame'leri, switch, VLAN ve frame forwarding burada karşımıza çıkar.

Switch'in temel sorusu şudur:

```text
Hedef MAC adresi hangi portta?
```

Switch mahallenin muhtarı gibi. Kimin hangi portta oturduğunu bilir; en azından MAC tablosu düzgünse.

Yaygın problemler: yanlış VLAN, ARP sorunu, kapalı switch portu, loop ve broadcast storm.

### Layer 3 — Network: paketin navigasyonu

Farklı ağlar arasındaki iletişim burada. Temel protokol IP, temel cihaz router, veri birimi packet.

```text
Source IP:      192.168.1.20
Destination IP: 1.1.1.1
```

Router hedef IP'ye ve routing table'a bakıp bir sonraki yolu seçer. Yanlış IP, subnet mask, default gateway veya eksik route varsa paketin navigasyonu “rota oluşturulamadı” der.

### Layer 4 — Transport: apartmanı bulduk, daire kaç?

TCP ve UDP bu katmanın iki ünlü oyuncusu. IP hedef cihazı, port ise cihazdaki uygulamayı belirler.

```text
22   → SSH
53   → DNS
80   → HTTP
443  → HTTPS
```

IP apartmanın adresiyse port daire numarasıdır. Apartmanı bulup daireyi bilmiyorsan kapıcıya sorarsın. Network'te kapıcı yok; port var.

TCP bağlantı, sıra numarası, acknowledgement, akış kontrolü ve yeniden iletim gibi işlerle ilgilenir. UDP daha az törenle hareket eder. Aralarındaki hesaplaşmayı başka güne bırakıyorum.

### Layer 5 — Session: her “session” aynı session değil

Oturumların kurulması, sürdürülmesi ve sonlandırılmasıyla ilgilenen kavramsal katman. Modern protokollerde görevleri çoğu zaman uygulama ve transport katmanlarına dağılır.

Web uygulamasındaki session cookie ile OSI Session Layer birebir aynı şey değildir. Network terminolojisi bazen aynı kelimeyi iki farklı yerde bırakıp uzaktan bizi izliyor.

### Layer 6 — Presentation: veri hangi kılıkta gelecek?

Encoding, decoding, encryption, decryption, compression ve veri formatı dönüşümleri burada düşünülür. UTF-8, JPEG, JSON temsili ve TLS ilişkisi buna örnek.

Türkçe karakterler bozuldu diye herkes DNS'e kızmadan önce encoding kontrol etmek faydalı olabilir.

### Layer 7 — Application: kullanıcıya en yakın katman

HTTP, HTTPS, DNS, SMTP, IMAP, FTP, SSH ve DHCP gibi protokoller burada.

Önemli ayrım: Chrome bir Layer 7 protokolü değil, HTTP/HTTPS kullanan bir uygulama. “Chrome Layer 7'dir” dediğim anda bir yerlerde network hocasının gözü seğirebilir.

HTTP 500, yanlış API endpoint'i, authentication/authorization hataları ve uygulama güvenlik açıkları bu seviyede düşünülür.

## TCP/IP modeli: gerçek hayatta işler biraz daha toplu

OSI yedi katmanlı öğretim haritası. TCP/IP modeli ise internet protokollerinin gerçek kullanımına daha yakın ve genellikle dört katmanla anlatılıyor:

| OSI | TCP/IP |
|---|---|
| Application + Presentation + Session | Application |
| Transport | Transport |
| Network | Internet |
| Data Link + Physical | Network Access |

Bazı kaynaklarda beş katman görebilirim; bu bir network iç savaşı değil. Ana fikir aynı: görevleri katmanlara ayırmak.

Benim kafamda kısa formül şu:

> OSI ile düşün, TCP/IP ile uygula.

## Encapsulation: paketlerin matruşka dönemi

Uygulama verisi ağdan çıkarken her katman kendi kontrol bilgisini ekliyor. Buna **encapsulation**, yani kapsülleme deniyor.

```text
Application Data
      ↓  TCP header
TCP Segment
      ↓  IP header
IP Packet
      ↓  Ethernet header + trailer
Ethernet Frame
      ↓
Bits
```

<figure class="article-figure light-figure">
  <img src="/images/blog/network-gun-1/kapsulleme.png" alt="Uygulama verisinin UDP, IP ve Ethernet katmanlarıyla kapsüllenmesini gösteren şema" width="1280" height="800" loading="lazy" />
  <figcaption>Kapsülleme: her katmanın veriye kendi kontrol bilgisini eklemesi. Cburnett ve Kbrose, CC BY-SA 3.0.</figcaption>
</figure>

### Header ve payload aynı şey değil

Header, protokolün veriyi yönetebilmek için eklediği bilgidir. Payload ise o katmanın taşıdığı asıl yük.

TCP açısından HTTP verisi payload olabilir. IP açısından TCP segmentinin tamamı payload'dur. Ethernet açısından da IP paketi payload olur.

```text
Ethernet Frame
├── Ethernet Header
└── IP Packet
    ├── IP Header
    └── TCP Segment
        ├── TCP Header
        └── Application Data
```

Bir katmanın paketi diğer katmanın kargosu. Network dünyasında herkes başkasının yükünü taşıyor.

### Decapsulation: hedefte kutuları açmak

Hedef cihazda süreç tersine döner:

```text
Bits → Frame → Packet → Segment → Application Data
```

Her katman kendi header'ını kontrol eder, ilgili kısmı çıkarır ve kalan veriyi üst katmana teslim eder. Matruşka bu kez kapatılmıyor, açılıyor.

## Bir HTTPS isteğinin yolculuğu

Tarayıcıdan `https://example.com` adresine gittiğimi düşünelim.

1. Uygulama katmanı HTTP isteğini oluşturur.
2. TLS veriyi şifreler.
3. TCP kaynak portu ve hedef `443` portunu ekler.
4. IP kaynak ve hedef IP adreslerini ekler.
5. Ethernet yerel teslimat için kaynak MAC ve gateway MAC adresini ekler.
6. Frame fiziksel ortamda bitler olarak gönderilir.

Buradaki kritik detay: Laptop uzak sunucunun MAC adresini kullanmaz. Sunucu başka ağdaysa frame'i önce default gateway'e teslim eder.

```text
Source MAC:      Laptop
Destination MAC: Gateway
```

Router her hop'ta Layer 2 frame'i yeniden oluşturabilir. Bu yüzden MAC adresleri yol boyunca değişebilir; IP adresleri ise ağlar arası uç hedefi temsil eder.

## Wireshark: Matrix ekranını anlamlandırmak

Wireshark bir network protocol analyzer. Paketleri yakalayıp katman katman incelememi sağlıyor:

- Kaynak ve hedef MAC
- Kaynak ve hedef IP
- Portlar
- TCP flag'leri
- DNS sorguları
- ICMP paketleri
- TLS handshake
- Zamanlama ve retransmission bilgileri

İlk açılışta yüzlerce paket akınca doğal tepki şu:

```text
Bu ne biçim Matrix?
```

Panik yok. Display filter tam olarak bunun için var.

### Kurulum

macOS:

```bash
brew install --cask wireshark
```

Debian/Kali tabanlı Linux:

```bash
sudo apt update
sudo apt install wireshark
```

Linux'ta gerekirse kullanıcıyı capture grubuna ekleyip yeniden oturum açmak gerekir:

```bash
sudo usermod -aG wireshark $USER
```

### Capture filter ve display filter

Capture filter, paket daha yakalanmadan karar verir. Display filter ise yakalanmış paketler arasından neyi göreceğimi seçer.

```text
# Capture filter
host 1.1.1.1

# Display filter
icmp
```

Başlangıçta display filter daha güvenli. Capture filtresini yanlış yazarsam önemli paketler hiç kaydedilmez; sonra ekrana bakıp “trafik yok” derim. Trafik vardır, filtre beni gaslight'lıyordur.

## Paket avı 1: ICMP ile ping'i görmek

Aktif interface'i seçip capture başlattıktan sonra:

```bash
ping -c 4 1.1.1.1
```

Display filter:

```text
icmp
```

Echo Request ve Echo Reply paketlerini görmeliyim. Bir paketi açtığımda şu yapı karşıma çıkar:

```text
Ethernet II
Internet Protocol Version 4
Internet Control Message Protocol
```

Kontrol edeceğim alanlar:

- Ethernet: kaynak/hedef MAC ve EtherType
- IPv4: kaynak/hedef IP, TTL ve protocol
- ICMP: type, code, identifier ve sequence number

Echo Request genellikle Type 8, Echo Reply Type 0. “Ping attım, cevap geldi” artık ekranda gerçek bir request/reply çifti.

## Paket avı 2: DNS sihrinin arkasına bakmak

```bash
nslookup example.com
```

veya:

```bash
dig example.com
```

Filtre:

```text
dns
```

Query tarafında `Name: example.com` ve `Type: A`; response tarafında çözümlenen IP adresini arıyorum. Tarayıcı alan adını içine doğduğu için bilmiyor. Önce DNS'e soruyor.

## Paket avı 3: TCP tokalaşmasını yakalamak

```bash
curl -I https://example.com
```

Filtre:

```text
tcp.port == 443
```

Aradığım üçlü:

```text
Client → SYN     → Server
Client ← SYN-ACK ← Server
Client → ACK     → Server
```

Bu, TCP three-way handshake. Bugün yalnızca gerçek paketlerde yerini buluyorum; TCP'nin bütün aile meselelerini ilerleyen günlere bırakıyorum.

## Paket avı 4: TLS var, içerik neden yok?

Filtre:

```text
tls
```

Bağlantının durumuna ve TLS sürümüne göre Client Hello, Server Hello, Certificate ve Encrypted Application Data görebilirim.

Wireshark trafiği görüyor ama HTTPS içeriğini açık metin göstermiyor. Bu Wireshark'ın bozulduğu anlamına gelmiyor; TLS'in mesaiye geldiği anlamına geliyor.

## İşime yarayan ilk filtreler

```text
icmp
dns
tcp
tls
ip.addr == 1.1.1.1
tcp.port == 443
tcp.flags.syn == 1
```

`http` filtresi yalnızca şifrelenmemiş HTTP trafiğinde anlamlı sonuç verir. Her `https://` isteğinde düz metin GET görmek beklemek, kapalı zarfın içini dışarıdan okumaya çalışmak gibi.

## Güvenlik açısından katmanlı düşünmek

| Katman | Örnek tehditler |
|---|---|
| Layer 1 | Fiziksel erişim, kablo kesme, RF jamming |
| Layer 2 | ARP spoofing, MAC flooding, VLAN hopping |
| Layer 3 | IP spoofing, route manipulation, ICMP abuse |
| Layer 4 | SYN flood, port scanning, TCP reset, UDP flood |
| Layer 7 | SQL injection, XSS, SSRF, authentication bypass |

Gerçek saldırılar tek bir kutuya uslu uslu oturmak zorunda değil. Yine de katmanlar, saldırının hangi seviyede başladığını ve etkisinin nereye yayıldığını anlamak için iyi bir harita.

## Beş yaygın yanlış

1. **“OSI internette birebir çalışan protokoldür.”** Hayır; kavramsal modeldir.
2. **“Chrome Layer 7 protokolüdür.”** Chrome uygulama, HTTP protokoldür.
3. **“Packet ve frame aynı şeydir.”** Packet Layer 3, frame Layer 2 veri yapısıdır.
4. **“MAC adresi internet boyunca değişmeden gider.”** MAC yerel hop'larda değişebilir.
5. **“Wireshark bütün HTTPS içeriğini açık gösterir.”** TLS tam da bunu engellemek için vardır.

## Kendimi test ediyorum

Notlara bakmadan cevaplamam gereken sorular:

1. OSI modeli neden oluşturuldu?
2. Physical Layer ne taşır?
3. Switch ve MAC adresleri hangi katmanla ilişkilidir?
4. Router hangi bilgiye bakarak karar verir?
5. IP ile port neden farklıdır?
6. Chrome neden Layer 7 protokolü değildir?
7. TCP/IP modelinde OSI'nin ilk üç üst katmanı nerede birleşir?
8. Encapsulation sırasında hangi header'lar eklenir?
9. Payload neden göreceli bir kavramdır?
10. Uzak sunucunun MAC adresini neden doğrudan kullanmam?
11. Capture filter ile display filter arasındaki fark nedir?
12. ICMP Echo Request ve Reply type değerleri nedir?
13. DNS query içinde hangi alanları ararım?
14. TCP three-way handshake hangi üç adımdan oluşur?
15. TLS paketlerini görüp uygulama verisini neden okuyamayabilirim?

Senaryolar da basit:

- Ethernet kablosu takılı değil → Layer 1
- Yanlış VLAN → Layer 2
- Yanlış IP/default gateway → Layer 3
- TCP 443 bağlantısı kurulamıyor → Layer 4'ten başlamalıyım
- HTTP 500 → Layer 7

## Günün sonunda kafamda oluşan resim

Dün “paket gidiyor” diyordum. Bugün cümle biraz uzadı ama en azından teknik olarak ayakta:

> Uygulama verisi TCP segmentine, segment IP paketine, paket Ethernet frame'ine kapsüllenir; frame fiziksel ortamda bitler olarak taşınır.

Hedefte aynı kutular ters sırayla açılır. Wireshark da bu yolculuğun farklı katmanlarını önümde gösterir.

Artık Wireshark açıldığında “Bu ne biçim Matrix?” demek yerine şunu söyleyebiliyorum:

```text
Tamam, bu Ethernet frame.
İçinde IPv4 var.
Onun içinde de TCP var.
```

İlerleme biraz da ekrandaki karmaşanın adını koyabilmek.

Bir sonraki gün IPv4, subnet mask, CIDR, network address, broadcast address ve host range konularına geçeceğim. Yani paketlerin nerede yaşadığını öğrendim; sırada mahallenin sınırlarını hesaplamak var.

---

### Görsel kaynakları

- Kapak illüstrasyonu: Bu yazı için yerel olarak üretilmiştir.
- Kapsülleme şeması: [Cburnett ve Kbrose — Wikimedia Commons](https://commons.wikimedia.org/wiki/File:UDP_encapsulation.svg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
