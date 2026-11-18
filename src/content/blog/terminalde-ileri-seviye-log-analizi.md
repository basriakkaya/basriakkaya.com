---
title: "Terminalde ileri seviye log analizi: p95 hesabına güvenebilir miyim?"
description: "Bash, awk ve sort ile HTTP günlüklerinden rota bazında p95 gecikmesini hesaplıyorum. Bozuk satırları, hata kodlarını ve yanlış sıralamayı deneyerek sonucu doğruluyorum."
publishedAt: 2026-11-18
lang: tr
translationKey: terminal-latency-pipeline
draft: false
category: ag-ve-linux
toc: true
tags: [Linux, Bash, awk, Log analizi, Performans]
cover: "/images/kageterm/latency-ranks.webp"
coverAlt: "İki rotanın 20 ölçümü içinde 19. isteğin süresi /notes için 80, /search için 900 milisaniye."
---

Önümde iki rota var. İkisinde de gördüğüm en yavaş başarılı istek 900 milisaniye. İkisinin de ortanca süresi 80 milisaniye. Şimdi biri “Hangisini önce inceleyelim?” diye sorsa, elimdeki bu iki sayıyla ne cevap vereceğim?

Bugün terminalde tam olarak bunu çözmek istiyorum. Yazacağım komutun sonucunu önceden kalemle hesaplayacağım. Sonra veriyi bilerek bozacağım. Çünkü ekranda tertemiz bir tablo görmek güzel de, `sort` boş dosyayı da gayet güzel sıralıyor.

## Önce neyi ölçtüğüme karar vereyim

Benim sorum şu: **Her rotada, başarılı GET isteklerinin en az yüzde 95’i kaç milisaniyede tamamlandı?** Burada başarı HTTP 2xx, süre ise tam milisaniye. Yüzdelik hesabında *nearest rank* yöntemini kullanıyorum. Süreleri küçükten büyüğe dizip `ceil(0.95 × n)` numaralı gözlemi alıyorum. Sıra numarası birden başlıyor.

20 istekte aradığım yer 19. sıra. Diyelim ki ilk 18 istek 80 ms, son ikisi 900 ms sürdü. 80 ms sınırını seçersem 18/20, yani yalnızca yüzde 90 içeride kalıyor. 19. isteğe geçtiğim anda cevap 900 ms oluyor. Şimdi şu tek satırı kafamızda değiştirelim: Yavaş iki istekten biri 80 ms’de bitseydi? Bu kez 19/20 tam yüzde 95. Aynı maksimum, bambaşka bir p95.

<figure class="article-figure">
  <img src="/images/kageterm/latency-ranks.webp" width="1000" height="560" alt="Süreye göre sıralanmış iki dizide 19. gözlem işaretli. /notes satırında 80 ms, /search satırında 900 ms." loading="lazy" />
  <figcaption>Her kare bir başarılı istek. Zaman ekseninde ilerlemiyoruz. Her satırın kendi ölçümlerini süreye göre sıraladım.</figcaption>
</figure>

## 41 satırlık bir deney kuralım

Boş bir çalışma dizininde, Bash ile şu örneği çalıştırıyorum. Oluşturduğu `requests.tsv` dört alan taşıyor: HTTP yöntemi, rota, durum kodu ve süre. Ayraç gerçek bir tab karakteri. Buradaki rota adları zaten gruplamaya uygun. Gerçek bir uygulamada `/users/42` ile `/users/93` için uygulamanın verdiği aynı rota şablonunu kullanırdım.

```bash
awk 'BEGIN {
  OFS = "\t"
  for (i = 1; i <= 20; i++) {
    print "GET", "/search", 200, (i <= 18 ? 80 : 900)
    print "GET", "/notes",  200, (i <= 19 ? 80 : 900)
  }
  print "GET", "/search", 503, 1200
}' > requests.tsv
```

Dosyaya sonradan fark edelim diye bir de 1200 ms süren 503 ekledim. Toplam 41 kayıt var ama birazdan çıkacak iki grubun toplamı **40** olmalı. Hatalı isteği de saymak isteseydim soruyu baştan farklı kurmam gerekirdi. Başarıların p95’i ile servisin hata oranını birlikte izlemek tam bu yüzden önemli.

## Bir borunun iki ucunu ayrı ayrı düşünmek

Aşağıdaki dosyanın adı `latency.sh`. Aynı dizinde `bash latency.sh requests.tsv` ile çalışıyor. İlk yarı girdiyi doğruluyor ve sıralıyor. İkinci yarı, sıralı dosyayı iki kez okuyor.

```bash
#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

input=${1:?usage: bash latency.sh requests.tsv}
work=$(mktemp -d)
trap 'rm -f -- "$work/sorted.tsv"; rmdir -- "$work"' EXIT

awk -F '\t' '
  NF != 4 || $1 == "" || $2 !~ /^\// ||
  $3 !~ /^[1-5][0-9][0-9]$/ || $4 !~ /^[0-9]+$/ {
    printf "Invalid record at line %d\n", NR > "/dev/stderr"
    exit 2
  }
  $1 == "GET" && $3 ~ /^2/ { print $2 "\t" $4 }
' "$input" |
  sort -t $'\t' -k1,1 -k2,2n > "$work/sorted.tsv"

awk -F '\t' '
  NR == FNR { total[$1]++; next }
  $1 != route { route = $1; rank = 0 }
  {
    rank++
    n = total[route]
    if (rank == int((95*n + 99)/100)) {
      printf "%s\t%d\t%d\n", route, n, $2
    }
  }
' "$work/sorted.tsv" "$work/sorted.tsv"
```

Sonuçta soldan sağa rota, örnek sayısı ve p95 milisaniyesi var:

```text
/notes	20	80
/search	20	900
```

Beni burada en kolay yanıltan ayrıntı `-k2,2n`. İkinci alan süre ve **sayısal** sıralanmalı. Metin sırasıyla `100`, `80` değerinin önüne geçer. Üstelik benim 80 ve 900 içeren ilk örneğimde metin sırası tesadüfen doğru çıkar. O yüzden bir komutu tek örnekle doğrulamıyorum.

`LC_ALL=C` iki komutun da aynı yerel ayarları kullanmasını sağlıyor. `sort` önce rota, sonra süre anahtarını kullanıyor. Aranan değeri, aynı rotanın bitişik satırları arasından seçebiliyorum. Sıralanan ham alanları arada biçimlendirseydim, ekran için eklediğim bir boşluk bile veri ayıracına dönüşebilirdi.

## İki geçiş için diske yazmaya değer mi?

`awk` içindeki `NR` toplam kayıt sayısı, `FNR` o anki dosyada okunan kayıt sayısı. Aynı dosyayı iki kez argüman olarak veriyorum. İlk geçişte `NR == FNR` doğru ve her rota için yalnızca bir sayaç tutuyorum. İkinci geçişte toplamlar hazır. Rota değişince sırayı sıfırlıyor, hedef sıraya ulaştığım satırın süresini yazıyorum. Tam sayılı örneklerde `int((95*n + 99)/100)` yukarı yuvarlamayı veriyor.

Bir milyon isteği tek bir `awk` dizisinde tutmak da mümkün. Buradaki tercihimin bedeli disk alanı ve ek okuma. Kazancım, `awk` belleğinin istek sayısından çok **farklı rota sayısına** bağlı olması. Dış sıralama gerektiğinde `sort` ayrıca geçici disk alanı kullanabilir. Saniyede sürekli ölçüm üreten bir sistemde aynı dosyayı tekrar tekrar sıralamak yerine histogram toplardım. Günlük bir arşiv üzerinde, hangi satırın yüzdeliği belirlediğini tek tek görebilmek benim için daha değerli.

## Komutu nasıl sınarım?

1. **Metin sırasını yakala.** Yeni bir dosyada aynı rotaya ait yalnızca 80 ve 100 ms’lik iki başarılı istek bırak. p95 ikinci gözlemdir ve sonuç 100 olmalı. `n` seçeneğini çıkarınca bu deney yanlış sonucu görünür kılar.
2. **Bozuk alan gönder.** Deney dosyasının bir kopyasında son süreyi `1200ms` yap. Bu satır 503 olsa bile önce biçim kontrolünden geçer. Beklediğim davranış, standart hata akışında satır numarası, sıfırdan farklı çıkış kodu ve standart çıktıda hiç rapor olmaması. `pipefail` olmazsa son komut olan `sort` başarılı biterek ilk hatayı gizleyebilir.
3. **Hiç eşleşme bırakma.** Yalnızca geçerli 503 kayıtları ver. Bu kez çıkış durumu başarılı, çıktı boş. “Geçerli veri var ama ölçülecek başarılı istek yok” ile “girdi okunamadı” arasındaki farkı böyle koruyorum.

Bir de birleştirme tuzağı var. İki sunucunun p95 değerlerini alıp ortalamasını hesaplarsam birleşik trafiğin p95’ini bulamam. Bu deneyde iki rotayı birleştirince 40 isteğin 37’si hızlı, üçü yavaş. Hedef 38. sıra olduğu için cevap 900 ms. İki p95’in aritmetik ortalaması ise 490 ms. Üstelik deneyde 490 ms süren tek bir istek yok.

## Komutu elime alıştırdığım yer

Bu örneğin mantığını anlamakla ertesi gün terminalin başında `|` işaretini, tırnakları ve seçenekleri rahat yazmak bende iki ayrı çalışma istiyor. KageTerm’i bu ikinci iş için geliştirdim. Öğren modunda komutu yazarken yaptığı işi görebiliyor, sonra Sınav modunda kendimi deneyebiliyorum. Özellikle TR-Q klavyede her sembol için gözümü ekrandan ayırıyorsam, kısa bir pratik oturumu işime yarıyor.

<figure class="article-figure">
  <img src="/images/kageterm/practice-tr.webp" width="1020" height="780" alt="KageTerm’in gerçek Öğren ekranında pwd komutu, anlamı ve TR-Q ekran klavyesi." loading="lazy" />
  <figcaption>KageTerm’de bir alıştırma böyle görünüyor. Ekrandaki örnek ilk dizin komutu olan pwd. Yukarıdaki log analizini ise kendi Bash oturumumuzda çalıştırdık.</figcaption>
</figure>

<a href="https://kageterm.com/"><img src="/images/kageterm/mark.webp" width="28" height="28" style="display:inline-block;width:1.75rem;height:1.75rem;margin:0 .35rem 0 0;vertical-align:middle" alt="" loading="lazy" /> KageTerm’de terminal pratiği yap ↗</a>

Bir sonraki denemede sadece iki yavaş isteğin sayısını değiştir. Komutu çalıştırmadan önce 19. sırada ne göreceğini söyleyebiliyor musun? Benim için bir terminal komutunu öğrenmenin en iyi ölçüsü bu: Sonucu okuyabilmek kadar, hangi girdinin o sonucu değiştireceğini de biliyor muyum?
