# Basri Akkaya — Kişisel site ve blog

Astro, TypeScript ve Tailwind CSS ile geliştirilmiş; statik, hızlı ve erişilebilir kişisel web sitesi. İçerik dili Türkçedir ve tasarım ölçülü bir Linux/terminal atmosferi taşır.

## Gereksinimler

- Node.js 22.12 veya üzeri
- npm

## Kurulum ve geliştirme

```bash
npm install
npm run dev
```

Üretim çıktısını kontrol etmek için:

```bash
npm run check
npm run build
npm run preview
```

## Yeni yazı ekleme

Ayrıntılı kategori, seri, başlık ve yayın akışı için [İçerik Yazma Rehberi](docs/content-authoring.md) dosyasına bakın.

`src/content/blog` içinde bir `.md` dosyası oluşturun. Frontmatter örneği:

```yaml
---
title: "Yazı başlığı"
description: "Kısa açıklama"
publishedAt: 2026-08-03
updatedAt: 2026-08-04 # isteğe bağlı
draft: false
tags: ["Linux", "Güvenlik"]
cover: "/images/kapak.png" # isteğe bağlı
---
```

`draft: true` olan yazılar geliştirme ortamında görünür, production build içinde listeye ve route'lara alınmaz.

## Yapılandırma

`.env.example` dosyasını `.env` olarak kopyalayın ve gerçek alan adını yazın:

```dotenv
SITE_URL=https://www.basriakkaya.com
```

Production canonical origin'i `https://www.basriakkaya.com` adresidir; apex domain kalıcı olarak bu adrese yönlenir. Alan adı verilmezse geliştirme ve build için güvenli `https://example.com` fallback'i kullanılır. İsim, unvan, e-posta, LinkedIn ve opsiyonel GitHub adresi `src/config/site.ts` içinde yönetilir. GitHub bağlantısı eklemek için `github` alanına URL yazın; boşken arayüzde gösterilmez.

Profil fotoğrafı kullanılmıyor; `src/pages/ben-kimim.astro` içindeki `monogram` alanı daha sonra Astro `Image` bileşeniyle değiştirilebilir ve görsel `src/assets` altına eklenebilir.

## Vercel'e dağıtım

Blog sayfa görüntülenmeleri Vercel Web Analytics üzerinden ölçülür. Ziyaretçilere açık bir görüntülenme sayacı bilinçli olarak gösterilmez.

1. Depoyu GitHub/GitLab/Bitbucket'a gönderin ve Vercel'de **New Project** ile içe aktarın.
2. Framework preset olarak Astro otomatik algılanır; build komutu `npm run build`, output dizini `dist` olmalıdır.
3. Project Settings → Environment Variables altında `SITE_URL` değerini production alan adıyla ekleyin.
4. Deploy işlemini başlatın.

Özel alan adı için Vercel projesinde Settings → Domains bölümünden alan adını ekleyin ve Vercel'in gösterdiği DNS kayıtlarını alan adı sağlayıcınızda tanımlayın. `SITE_URL` değerini de aynı HTTPS adresiyle güncelleyin.

## Günlük İçerik Yayınlama

Yeni bir blog yazısı veya site değişikliği üzerinde çalışmaya başlamadan önce ana branch'i güncelleyin ve geliştirme sunucusunu açın:

```bash
git checkout main
git pull --ff-only
npm install
npm run dev
```

Değişikliği yayınlamadan önce kontrolleri çalıştırın, ardından anlamlı bir commit oluşturup `main` branch'ine gönderin:

```bash
npm run check
npm run build
npm run audit:seo
npm run audit:security
git add .
git commit -m "Değişikliği açıklayan kısa mesaj"
git push origin main
```

`main` branch'ine gönderilen commitler production deployment oluşturur. Farklı branch'ler ve pull request'ler Vercel preview deployment akışını kullanır. `.env`, `.vercel`, `dist`, `.astro` ve `node_modules` hiçbir zaman commit edilmemelidir.

## Güvenlik başlıkları

Dağıtım sonrasında CSP, HSTS, `X-Content-Type-Options` ve `Referrer-Policy` gibi başlıklar Vercel yapılandırmasından eklenebilir. CSP, kullanılan kaynaklar doğrulanmadan zorla uygulanmamıştır.
