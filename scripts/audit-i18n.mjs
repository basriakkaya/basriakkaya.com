import { readFile, readdir, stat, access } from 'node:fs/promises';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
const origin = 'https://www.basriakkaya.com';
const isPreviewBuild = process.env.VERCEL_ENV === 'preview';
const failures = [];
const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
async function walk(directory) { const files = []; for (const name of await readdir(directory)) { const item = path.join(directory, name); (await stat(item)).isDirectory() ? files.push(...await walk(item)) : files.push(item); } return files; }
const normalizeRoute = (pathname) => pathname === '/' ? '/' : pathname.replace(/\/$/u, '');
const routeFor = (file) => { const relative = path.relative(dist, file).replaceAll(path.sep, '/'); return relative === 'index.html' ? '/' : relative === '404.html' ? '/404' : `/${relative.replace(/\/index\.html$/u, '').replace(/\.html$/u, '')}`; };

if (!await exists(dist)) failures.push('dist bulunamadı; önce build çalıştırılmalı');
const files = await walk(dist).catch(() => []);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const pages = new Map();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = routeFor(file);
  const robots = html.match(/<meta name="robots" content="([^"]+)"/u)?.[1] ?? '';
  const alternates = new Map([...html.matchAll(/<link rel="alternate" hreflang="(tr|en|x-default)" href="([^"]+)"/gu)].map((match) => [match[1], match[2]]));
  pages.set(route, { html, robots, alternates });
}

for (const [route, page] of pages) {
  if (route === '/offline') continue;
  if (route === '/admin') {
    if (!page.html.includes('<html lang="en"')) failures.push('/admin: html lang en değil');
    if (page.alternates.size !== 0) failures.push('/admin: hreflang bulunmamalı');
    continue;
  }
  const expectedLang = route === '/en' || route.startsWith('/en/') ? 'en' : 'tr';
  if (!page.html.includes(`<html lang="${expectedLang}"`)) failures.push(`${route}: html lang ${expectedLang} değil`);
  const canonical = page.html.match(/<link rel="canonical" href="([^"]+)"/u)?.[1];
  let canonicalUrl;
  try { canonicalUrl = new URL(canonical); } catch { failures.push(`${route}: canonical geçersiz (${canonical ?? 'eksik'})`); }
  if (canonicalUrl && (canonicalUrl.origin !== origin || normalizeRoute(canonicalUrl.pathname) !== route)) failures.push(`${route}: self-canonical yanlış (${canonical})`);

  if (page.alternates.size > 0) {
    for (const locale of ['tr', 'en', 'x-default']) if (!page.alternates.has(locale)) failures.push(`${route}: hreflang ${locale} eksik`);
    if (page.alternates.get('x-default') !== page.alternates.get('tr')) failures.push(`${route}: x-default Türkçe eş sayfayı göstermiyor`);
    const selfHref = page.alternates.get(expectedLang);
    if (selfHref && normalizeRoute(new URL(selfHref).pathname) !== route) failures.push(`${route}: hreflang self-reference yanlış (${selfHref})`);
    for (const [locale, href] of page.alternates) {
      let target;
      try { target = new URL(href); } catch { failures.push(`${route}: geçersiz hreflang URL (${href})`); continue; }
      const targetRoute = normalizeRoute(target.pathname);
      const targetPage = pages.get(targetRoute);
      if (target.origin !== origin || !targetPage || (!isPreviewBuild && targetPage.robots.includes('noindex'))) { failures.push(`${route}: geçersiz/indexlenemez hreflang hedefi ${href}`); continue; }
      if (locale === 'x-default') continue;
      const reciprocal = targetPage.alternates.get(expectedLang);
      if (!reciprocal || normalizeRoute(new URL(reciprocal).pathname) !== route) failures.push(`${route}: ${targetRoute} ile hreflang karşılıklılığı eksik`);
    }
  }

  const primaryNav = page.html.match(/<nav id="site-menu"[\s\S]*?<\/nav>/u)?.[0] ?? '';
  if (expectedLang === 'en' && /href="\/(?:yazilar|ben-kimim)(?:\/|"|#)/u.test(primaryNav)) failures.push(`${route}: İngilizce sayfada Türkçe ana navigasyon linki`);
}

for (const required of ['en/index.html', 'en/about/index.html', 'en/articles/index.html', 'en/rss.xml']) if (!files.some((file) => file.endsWith(required))) failures.push(`${required} eksik`);
const trRss = await readFile(path.join(dist, 'rss.xml'), 'utf8').catch(() => '');
const enRss = await readFile(path.join(dist, 'en/rss.xml'), 'utf8').catch(() => '');
if (!trRss.includes('<language>tr-TR</language>') || /\/en\/articles\//u.test(trRss)) failures.push('Türkçe RSS dil karışması');
if (!enRss.includes('<language>en-US</language>') || /\/yazilar\//u.test(enRss)) failures.push('İngilizce RSS dil karışması');
for (const [locale, xml, routePrefix] of [['tr', trRss, '/yazilar/'], ['en', enRss, '/en/articles/']]) {
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gu)) {
    const item = match[1];
    const link = item.match(/<link>([^<]+)<\/link>/u)?.[1] ?? '';
    const guid = item.match(/<guid isPermaLink="true">([^<]+)<\/guid>/u)?.[1] ?? '';
    let itemUrl;
    try { itemUrl = new URL(link); } catch { failures.push(`${locale} RSS geçersiz item linki (${link})`); continue; }
    if (itemUrl.origin !== origin || !itemUrl.pathname.startsWith(routePrefix)) failures.push(`${locale} RSS yanlış locale/origin item linki (${link})`);
    if (guid !== link) failures.push(`${locale} RSS GUID canonical item linkiyle eşleşmiyor (${guid})`);
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`i18n audit passed: ${htmlFiles.length} HTML, localized canonical/lang, self/reciprocal hreflang, navigation ve iki RSS doğrulandı.`);
