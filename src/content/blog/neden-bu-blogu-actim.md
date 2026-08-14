---
title: "Neden Bu Blogu Açtım?"
description: "Öğrendiğim şeyleri unutmamak, yaşadığım teknik saçmalıkları not almak ve belki birilerinin işine yarar diye paylaşmak için bu blogu açtım."
publishedAt: 2026-08-03
lang: tr
translationKey: "why-i-started-this-blog"
draft: false
category: "kisisel-notlar"
toc: true
tags:
  - Kişisel
  - Siber Güvenlik
  - Öğrenme
cover: "/images/blog/neden-bu-blogu-actim/terminal-ogrenme-yolculugu.png"
coverAlt: "Gece çalışan, terminal ekranları ve teknik notlar arasında bir problemi araştıran güvenlik öğrencisi"
---

Günümün büyük bir kısmı bilgisayar başında geçiyor. Bazen bir güvenlik açığını araştırıyorum, bazen Linux’ta nedenini anlamadığım bir hatayla kavga ediyorum, bazen de iki dakikada bitecek sandığım bir iş için üç saat terminale bakıyorum.

Klasik.

Bir problemi çözdüğümde genelde “tamamdır, bunu artık öğrendim” diyorum. Aradan iki hafta geçiyor, aynı problem yeniden karşıma çıkıyor ve bu sefer kendi kendime şunu soruyorum:

> Ben bunu en son nasıl çözmüştüm?

Komutu hatırlıyorum ama neden kullandığımı hatırlamıyorum. Çözümü bulmuşum ama mantığını bir yerde kaybetmişim. Sonra tekrar araştır, tekrar dene, tekrar uğraş.

Bu blogu biraz da aynı şeyleri tekrar tekrar yaşamamak için açtım.

<figure class="article-figure">
  <img src="/images/blog/neden-bu-blogu-actim/terminal-ogrenme-yolculugu.png" alt="Gece çalışan, terminal ekranları ve teknik notlar arasında bir problemi araştıran güvenlik öğrencisi" width="1536" height="1024" loading="eager" />
  <figcaption>Bazen çözüm tek satır; o satıra ulaşan yol ise notlar, denemeler ve birkaç saatlik terminal mesaisi.</figcaption>
</figure>

## Burada ne paylaşacağım?

Burası yalnızca uzun ve aşırı ciddi teknik yazıların olduğu bir yer olmayacak.

Bazen bir güvenlik araştırmasında öğrendiğim bir şeyi paylaşacağım. Bazen Linux’ta karşıma çıkan saçma bir hatanın çözümünü yazacağım. Bazen de saatlerce uğraşıp sonunda tek satırlık bir komutla çözdüğüm problemleri not edeceğim.

Genel olarak şunlardan bahsetmeyi düşünüyorum:

- Web güvenliği
- Network temelleri
- Linux
- Sızma testi notları
- Sorumlu açıklama süreçleri
- Geliştirdiğim araçlar
- CTF yarışmalarında öğrendiklerim
- Yaptığım hatalar
- “Bunu neden daha önce öğrenmedim?” dediğim konular

Bazı yazılar uzun olabilir. Bazıları ise sadece birkaç paragraftan oluşabilir. Bir şey kısa anlatılabiliyorsa sırf uzun görünsün diye destan yazmanın bir anlamı yok.

## Her şeyi bildiğim için yazmıyorum

Bu blogu açma sebebim “ben her şeyi biliyorum, şimdi size anlatacağım” demek değil.

Zaten siber güvenlikte böyle bir şey söyleyen birine çok güvenmemek lazım.

Bu alan sürekli değişiyor. Bugün doğru bildiğin bir şey birkaç ay sonra eskiyebiliyor. Yeni bir teknoloji çıkıyor, yeni bir açık bulunuyor, kullandığın araç değişiyor, sistemler değişiyor.

Ben de öğrenirken karşılaştığım şeyleri buraya not edeceğim. Yanlış yaptığım bir şey olursa düzelteceğim. Eskiyen bir bilgi olursa güncelleyeceğim.

Kısacası burası bitmiş bir uzmanlık hikâyesi değil. Devam eden bir öğrenme sürecinin kayıtları olacak.

## Güvenlik tarafında sınır nerede?

Güvenlik araştırmalarıyla ilgili içerikler de paylaşacağım ama aktif sistemlere zarar verecek, hassas verileri açığa çıkaracak veya birilerini riske sokacak detayları buraya koymayacağım.

Bir açığın nasıl bulunduğunu anlatmakla, herkese çalışır istismar kodu bırakmak aynı şey değil.

Benim için amaç yalnızca açık bulmak değil. Problemi doğru anlamak, etkisini anlatmak ve mümkünse düzeltilmesine katkı sağlamak.

Zaten güvenlik araştırmasının eğlenceli kısmı da biraz burada başlıyor.

Bazen herkesin normal çalışan bir site gördüğü yerde sen yanlış giden küçük bir detayı fark ediyorsun. Sonra biraz kurcalıyorsun, biraz araştırıyorsun ve o küçük detayın arkasından çok daha büyük bir problem çıkabiliyor.

İtiraf edeyim, bu kısmı seviyorum.

<figure class="article-figure">
  <img src="/images/blog/neden-bu-blogu-actim/guvenlik-arastirmasi-anomali.png" alt="Normal görünen bir web sistemi içinde küçük bir anomaliyi takip eden güvenlik araştırmacısını gösteren teknik illüstrasyon" width="1536" height="1024" loading="lazy" />
  <figcaption>Güvenlik araştırması bazen herkesin normal gördüğü akıştaki tek bir küçük tutarsızlığı fark etmekle başlıyor.</figcaption>
</figure>

## Neden herkese açık bir blog?

Notlarımı bilgisayarımda da tutabilirdim. Hatta yıllardır farklı klasörlerde, metin dosyalarında ve ne olduğunu artık benim bile bilmediğim dosya isimlerinde bir sürü notum var.

Ama bilgisayarda duran notun çoğu zaman pek bir anlamı olmuyor. Yazıp bir daha açmıyorsun.

Burada paylaşınca hem daha düzenli yazmak zorunda kalıyorum hem de “birisi bunu okuyacak” düşüncesiyle konuyu gerçekten anlayıp anlamadığımı fark ediyorum.

Bir konuyu sade biçimde anlatamıyorsam büyük ihtimalle ben de tam anlamamışımdır.

Ayrıca benim saatlerce uğraştığım bir problem, başka birinin bu yazıyı okuyup beş dakikada çözmesine yardımcı olursa gayet güzel olur.

## İlk kayıt

Bu yazı blogun ilk yazısı.

Buradan sonra terminalde yaşadığım küçük krizlerden, güvenlik araştırmalarında öğrendiğim şeylere kadar gerçekten faydalı bulduğum konuları paylaşacağım.

Bazen ciddi, bazen teknik, bazen de “bu hata yüzünden neden üç saatimi harcadım?” tarzında yazılar olacak.

Kısacası bu blogu öğrendiklerimi unutmamak, yaşadığım teknik saçmalıkları kayıt altına almak ve belki birilerinin işine yarar diye paylaşmak için açtım.

Bakalım ne çıkacak.
