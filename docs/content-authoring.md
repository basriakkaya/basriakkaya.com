# İçerik Yazma Rehberi

## Yeni bağımsız yazı

```yaml
---
title: "Açık ve özgün yazı başlığı"
description: "Yazının içeriğini doğru biçimde özetleyen özgün açıklama."
publishedAt: 2026-08-04
category: "web-guvenligi"
tags: ["Web Güvenliği", "Yetkilendirme"]
draft: true
toc: true
---
```

Türkçe varsayılan dildir. İngilizce içerik için `lang: en` ekleyin. Aynı yazının iki dildeki sürümlerini stabil, slug'dan bağımsız bir `translationKey` ile eşleyin:

```yaml
lang: en
translationKey: tcp-udp-basics
```

İngilizce yazılar `/en/articles/<slug>` altında yayınlanır. Bir locale içinde aynı `translationKey` tekrarlanamaz; çevrilmemiş bir yazıya dil seçici üzerinden sahte eş bağlantı üretilmez.

## Yeni kategori ekleme

Önce `src/config/categories.ts` registry'sine lowercase ASCII ve tireli bir slug ile ad ve açıklama ekle. Ardından yazının `category` alanında bu slug'ı kullan.

## Yeni seri oluşturma

Seri metadata'sını `src/config/series.ts` içine ekle. Durum yalnızca `ongoing` veya `completed` olabilir. Production'a sahte veya boş seri ekleme.

## Seriye yeni bölüm ekleme

```yaml
series: "gercek-seri-slug"
seriesOrder: 2
```

Her yayınlanmış bölümün sıra numarası benzersiz ve pozitif olmalıdır. Önceki/sonraki bölüm navigasyonu build sırasında otomatik hesaplanır.

## Başlık yapısı

Markdown gövdesinde H1 kullanma; makale başlığı layout tarafından üretilir. Ana bölümler H2, alt bölümler H3 olmalıdır. Gereksiz H4–H6 kullanımından kaçın. İki veya daha fazla H2/H3 bulunduğunda içindekiler otomatik oluşur; `toc: false` ile kapatılabilir.

## Reaction sistemi

RECON, PATCH ve ROOT alanı bütün blog detaylarında otomatik görünür. Markdown içine reaction bileşeni ekleme.

## Günlük yayın akışı

```bash
git checkout main
git pull --ff-only
npm run dev
```

Yayınlamadan önce:

```bash
npm run check
npm run build
npm run audit:content
npm run audit:seo
npm run audit:security
npm run audit:i18n
```

Kontroller başarılıysa anlamlı bir commit oluşturup uygun feature branch'i push et.
