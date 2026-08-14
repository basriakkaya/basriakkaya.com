---
title: "Network Öğrenme Günlüğü — Gün 3: Bu IP Kimin Mahallesi?"
description: "IPv4, binary, subnet mask ve CIDR mantığını; network, broadcast ve kullanılabilir host aralığını hesaplayarak öğrendiğim üçüncü gün notlarım."
publishedAt: 2026-08-05
lang: tr
translationKey: "network-learning-journal-day-3"
draft: false
category: "ag-ve-linux"
series: "network-ogrenme-gunlugu"
seriesOrder: 3
toc: true
tags:
  - Network
  - IPv4
  - Subnetting
  - CIDR
  - Öğrenme Günlüğü
cover: "/images/blog/network-gun-3/ipv4-subnet-cover.png"
coverAlt: "Dört alt ağa ayrılmış cihaz gruplarını, bir router'ı ve hedefe ilerleyen veri paketini gösteren teknik illüstrasyon"
---

Dün paketlerin katmanlar arasında nasıl yolculuk ettiğine bakmıştım. Bugün o paketin navigasyon ekranını biraz daha yaklaştırıyorum.

Çünkü karşıma sürekli şöyle adresler çıkıyor:

```text
192.168.1.25/24
10.0.0.5/8
172.16.5.100/27
```

IP kısmına az çok alıştım. Ama sondaki `/24` veya `/27` ne anlatıyor? İki cihaz yan yana görünen adreslere sahipken neden bazen doğrudan konuşuyor, bazen router'a ihtiyaç duyuyor? Bir adresin “mahallesi” nerede başlayıp nerede bitiyor?

Bugünkü hedefim tam olarak bu:

> Bir IPv4 adresine baktığımda ağ adresini, broadcast adresini ve kullanılabilir host aralığını kendim hesaplayabilmek.

<figure class="article-figure">
  <img src="/images/blog/network-gun-3/ipv4-subnet-cover.png" alt="Dört alt ağa ayrılmış cihaz gruplarını, bir router'ı ve hedefe ilerleyen veri paketini gösteren teknik illüstrasyon" width="1536" height="1024" loading="eager" />
  <figcaption>Bugünün sorusu: Bu IP hangi ağın sınırları içinde yaşıyor?</figcaption>
</figure>

## IPv4 neden dört parçalı görünüyor?

IPv4 adresi toplam **32 bitten** oluşuyor. Okumamız kolay olsun diye bu bitler sekizerli dört gruba ayrılıyor. Her gruba **octet** deniyor.

```text
192  .  168  .  1  .  25
octet  octet  octet  octet
```

Bir octette sekiz bit var ve her bit ya `0` ya da `1`. Sekiz bitin alabileceği en küçük değer `00000000`, yani `0`; en büyük değer `11111111`, yani `255`. Bu yüzden IPv4 adresindeki her octet `0–255` arasında olmak zorunda.

Bitlerin basamak değerleri şöyle:

```text
128  64  32  16  8  4  2  1
```

Örneğin `192`, binary olarak `11000000`:

```text
128 + 64 = 192
```

`168` ise `10101000`:

```text
128 + 32 + 8 = 168
```

Dolayısıyla adresin tamamı şöyle yazılabilir:

```text
192.168.1.25
11000000.10101000.00000001.00011001
```

İlk bakışta Matrix'in düşük bütçeli devam filmi gibi görünüyor. Neyse ki her IP'yi baştan sona binary çevirmem gerekmiyor. Ama subnet mask'in neden çalıştığını anlamak için bu görüntüyle bir kez tanışmak şart.

## Bir IP adresinde mahalle ve kapı numarası

Bir IPv4 adresi mantıksal olarak iki parçaya ayrılıyor:

```text
Network portion | Host portion
Ağ kısmı        | Host kısmı
```

`192.168.1.25/24` adresindeki `/24`, ilk 24 bitin ağı; kalan 8 bitin o ağdaki hostu gösterdiğini söylüyor.

<figure class="article-figure light-figure">
  <img src="/images/blog/network-gun-3/ipv4-anatomisi.svg" alt="192.168.1.25/24 adresinde ilk 24 bitin network, son 8 bitin host kısmı olduğunu gösteren şema" width="1200" height="520" loading="lazy" />
  <figcaption>/24 adresinde ilk üç octet ağı, son octet o ağdaki hostu temsil ediyor.</figcaption>
</figure>

Bunu mahalle ve kapı numarası gibi düşünebilirim:

```text
192.168.1 | 25
mahalle     kapı
```

Benzetme mantığı kuruyor ama teknik gerçeğin tamamı değil. Ağ sınırı her zaman octet'in bittiği yerde durmaz. `/25`, `/26` veya `/27` geldiğinde sınır son octetin ortasına girer. İşte subnetting'in eğlencesi — veya ilk yarım saatteki hafif baş ağrısı — burada başlıyor.

## Subnet mask ve CIDR aynı sınırı tarif ediyor

Subnet mask, IP'nin hangi bitlerinin network, hangilerinin host olduğunu gösteriyor. Maskedeki `1` bitleri ağ kısmını, `0` bitleri host kısmını temsil ediyor.

```text
255.255.255.0
11111111.11111111.11111111.00000000
```

Burada 24 tane `1` olduğu için bu maskenin kısa gösterimi `/24`.

CIDR, **Classless Inter-Domain Routing** ifadesinin kısaltması. Günlük kullanımda slash notation ile subnet mask'i daha kısa yazmamı sağlıyor:

| CIDR | Subnet mask | Toplam adres | Geleneksel kullanılabilir host |
|---:|---|---:|---:|
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 6 |
| /30 | 255.255.255.252 | 4 | 2 |

Temel formül:

```text
Host biti = 32 - CIDR
Toplam adres = 2^(host biti)
Geleneksel kullanılabilir host = 2^(host biti) - 2
```

Neden eksi iki? Geleneksel bir subnet'te ilk adres **network address**, son adres **broadcast address** olarak ayrılıyor. `/31` ve `/32` gibi özel durumlar bu klasik hesabın dışında; bugün standart host subnetlerine odaklanıyorum.

## Network, broadcast ve kullanılabilir hostlar

`192.168.1.0/24` ağına bakalım:

```text
Network:    192.168.1.0
First host: 192.168.1.1
Last host:  192.168.1.254
Broadcast:  192.168.1.255
```

**Network address**, subnet'in kendisini temsil ediyor. Bir cihaza verilecek normal host adresi değil; mahallenin tabelası gibi.

**Broadcast address**, o subnet içindeki tüm hostlara yönelik yayın adresi. Network dünyasının “bu sokaktaki herkes duysun” anonsu.

Arada kalan adresler de cihazlara atanabilen geleneksel host aralığı.

Burada kritik nokta şu:

> Subnet mask olmadan IP adresi, ağ sınırını tek başına söylemez.

Örneğin aynı IP iki farklı maskeyle bambaşka ağlara aittir:

```text
192.168.1.25/24 → 192.168.1.0/24
192.168.1.25/16 → 192.168.0.0/16
```

Sadece apartman numarasını bilip hangi ilçede olduğunu bilmemek gibi. Adres var ama bağlam eksik.

## Aynı subnet'te miyiz?

İki cihazın “aynı subnet'te” olması, subnet mask uygulandığında aynı network address'i üretmeleri demek.

```text
Host A: 192.168.1.20/24 → Network: 192.168.1.0
Host B: 192.168.1.50/24 → Network: 192.168.1.0
```

İkisi aynı yerel ağda. Uygun Layer 2 bağlantısı da varsa birbirleriyle yerel olarak haberleşebilirler.

Ama ikinci cihaz `192.168.2.50/24` olsaydı network adresleri farklı çıkardı. Bu durumda araya router girmesi gerekirdi.

```text
Aynı subnet   → yerel teslimat
Farklı subnet → router üzerinden teslimat
```

Gün 1'deki default gateway şimdi daha anlamlı: Bilgisayarım hedefin kendi subnet'inde olmadığını maskeyle anlıyor ve paketi çıkış kapısına bırakıyor.

## Blok boyutu: Subnet hesabının kısa yolu

`/24` kolay; son octet baştan sona host. Peki `/25`, `/26` ve `/27`?

Pratik yöntem şu:

```text
Blok boyutu = 256 - maskenin değişen octeti
```

`/26` maskesi `255.255.255.192` olduğuna göre:

```text
256 - 192 = 64
```

Alt ağlar son octette 64'er 64'er başlar:

```text
0, 64, 128, 192
```

<figure class="article-figure light-figure">
  <img src="/images/blog/network-gun-3/subnet-bloklari.svg" alt="192.168.1.0/24 ağının dört adet /26 bloğa ayrılmasını ve 192.168.1.70 adresinin ikinci blokta yer almasını gösteren şema" width="1200" height="570" loading="lazy" />
  <figcaption>Blok boyutu 64 ise sınırlar 0, 64, 128 ve 192'de başlıyor.</figcaption>
</figure>

`192.168.1.70/26` adresinde `70`, `64–127` aralığına düşüyor:

```text
Network:    192.168.1.64
First host: 192.168.1.65
Last host:  192.168.1.126
Broadcast:  192.168.1.127
```

Hesabın özü bu: IP'nin hangi iki blok başlangıcı arasında kaldığını buluyorum. İlk sınır network, bir sonraki sınırdan hemen önceki adres broadcast oluyor.

### Bir /27 örneği

`172.16.5.100/27` için maskenin son octeti `224`:

```text
Blok boyutu: 256 - 224 = 32
Başlangıçlar: 0, 32, 64, 96, 128, 160, 192, 224
```

`100`, `96–127` aralığında:

```text
Network:    172.16.5.96
First host: 172.16.5.97
Last host:  172.16.5.126
Broadcast:  172.16.5.127
```

### Binary tarafta gerçekte ne oluyor?

Kısa yol faydalı ama sihir değil. Network address teknik olarak IP adresiyle subnet mask arasında bit düzeyinde **AND** işlemi yapılarak bulunuyor.

```text
IP:    11000000.10101000.00000001.00011001
Mask:  11111111.11111111.11111111.00000000
AND:   11000000.10101000.00000001.00000000
```

Sonuç `192.168.1.0`. AND işleminde yalnızca iki bit de `1` ise sonuç `1` oluyor. Blok boyutu yöntemi günlük hesapta hızlı; binary ise sonucun neden doğru olduğunu gösteriyor.

## Private, public ve diğer özel adresler

Her IPv4 adresi internette doğrudan dolaşamıyor. Yerel ağlarda kullanılmak üzere ayrılmış private aralıklar şunlar:

```text
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
```

Burada sık yapılan hata: `172` ile başlayan her adres private değil. Yalnızca `172.16.0.0–172.31.255.255` aralığı private.

Evde laptopum `192.168.1.20`, telefonum `192.168.1.21` olabilir. Router, NAT yardımıyla bu cihazların trafiğini public IP üzerinden internete çıkarabilir. NAT'ı ilerleyen güne bırakıyorum; şimdilik tek bir public çıkışın arkasında birden fazla private adres olabileceğini bilmem yeterli.

Karşıma çıkabilecek birkaç özel aralık daha var:

| Adres | Ne düşündürür? |
|---|---|
| `127.0.0.0/8` | Loopback; cihazın kendisi |
| `169.254.0.0/16` | Link-local; çoğu zaman DHCP'den adres alınamadı |
| `0.0.0.0` | Bağlama göre belirtilmemiş adres, tüm arayüzler veya default route |
| `255.255.255.255` | Limited broadcast |

`169.254.x.x` gördüğümde ilk refleksim “internet bozuk” demek değil, “DHCP neden adres veremedi?” diye sormak olmalı.

## Default gateway neden aynı subnet'te olmalı?

Normal bir yapılandırma:

```text
Host:    192.168.1.20/24
Gateway: 192.168.1.1
```

Sorunlu örnek:

```text
Host:    192.168.1.20/24
Gateway: 192.168.2.1
```

Host, gateway'e paket teslim edebilmek için önce ona yerel ağda ulaşabilmeli. İkinci örnekte gateway farklı subnet'te; yani başka ağa gitmek için ulaşmam gereken kapı zaten başka ağda. Anahtar içeride kaldı, çilingir de evin içinde gibi bir durum.

## Subnetting neden yapılıyor?

Büyük bir ağı daha küçük mantıksal ağlara bölmek birkaç işe yarıyor:

- Broadcast alanını küçültmek
- Departmanları ve cihaz gruplarını ayırmak
- IP adreslerini daha düzenli kullanmak
- Routing ve hata ayıklamayı kolaylaştırmak
- Güvenlik politikalarının uygulanacağı sınırlar oluşturmak

Ama subnetting tek başına güvenlik duvarı değil. İki ağı ayırmak, aralarındaki trafiği otomatik olarak güvenli yapmaz. Firewall, ACL, VLAN ve doğru routing politikaları hâlâ işin içinde.

## Küçük laboratuvar: Önce elle, sonra araçla

macOS'ta yerel IPv4 ve default route için:

```bash
ipconfig getifaddr en0
route -n get default
netstat -rn
```

Linux'ta:

```bash
ip addr
ip route
```

Hesabı doğrulamak için `ipcalc` kullanabilirim:

```bash
ipcalc 172.16.5.100/27
```

Python'ın standart `ipaddress` modülü de aynı işi yapıyor:

```python
import ipaddress

network = ipaddress.ip_network("172.16.5.100/27", strict=False)

print("Network:", network.network_address)
print("Broadcast:", network.broadcast_address)
print("Netmask:", network.netmask)
print("Total:", network.num_addresses)
```

Kuralım şu:

> Önce elle hesapla, sonra araçla doğrula.

Araç cevabı verir. Benim hedefim, cevabın neden doğru olduğunu anlayabilmek.

Kendime çözmek için bıraktığım adresler:

```text
192.168.10.37/24
192.168.1.140/25
192.168.1.70/26
172.16.5.100/27
10.10.10.14/30
```

Her biri için network, broadcast, ilk host, son host, toplam adres ve kullanılabilir host sayısını bulacağım.

## Günün sonunda kafamda kalan formül

Bugün şu cümle yerine oturdu:

```text
IP adresi + subnet mask = ağ sınırı
```

Artık `172.16.5.100/27` gördüğümde yalnızca noktalı dört sayı ve sonunda gizli tarikat işareti görmüyorum. Şunu okuyabiliyorum:

```text
Network:    172.16.5.96
Broadcast:  172.16.5.127
Host range: 172.16.5.97–172.16.5.126
```

CIDR'ın sorduğu soru aslında basit:

> Bu adresin kaç biti ağı, kaç biti o ağdaki hostu anlatıyor?

Bir sonraki gün MAC adresi ve ARP'ye geçeceğim. Yani aynı subnet'te olduğuma karar verdim; sırada “Peki bu IP'nin MAC adresini nasıl bulacağım?” sorusu var.

---

### Görsel kaynakları

- Kapak illüstrasyonu: Bu yazı için yerel olarak üretilmiştir.
- IPv4 anatomisi ve subnet blokları şemaları: Bu yazı için yerel olarak hazırlanmıştır.
