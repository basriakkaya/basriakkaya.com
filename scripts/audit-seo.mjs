import { readFile, readdir, stat, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://www.basriakkaya.com';
const isPreviewBuild = process.env.VERCEL_ENV === 'preview';
const failures = [];

async function walk(directory) {
  const result = [];
  for (const name of await readdir(directory)) {
    const item = path.join(directory, name);
    const info = await stat(item);
    if (info.isDirectory()) result.push(...await walk(item)); else result.push(item);
  }
  return result;
}
const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
const attr = (html, expression) => html.match(expression)?.[1] ?? '';

if (!await exists(dist)) failures.push('dist bulunamadı; önce build çalıştırılmalı.');
const files = await walk(dist).catch(() => []);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const routeFor = (file) => {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  if (relative === '404.html') return '/404';
  return `/${relative.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`;
};
const routeFiles = new Set(htmlFiles.map(routeFor));
const seenTitles = new Map();
const seenDescriptions = new Map();

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = routeFor(file);
  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  const robots = attr(html, /<meta name="robots" content="([^"]+)"/);
  const title = attr(html, /<title>([^<]+)<\/title>/);
  const description = attr(html, /<meta name="description" content="([^"]+)"/);
  const ogUrl = attr(html, /<meta property="og:url" content="([^"]+)"/);
  const ogLocale = attr(html, /<meta property="og:locale" content="([^"]+)"/);
  const rssDiscovery = attr(html, /<link rel="alternate" type="application\/rss\+xml"[^>]+href="([^"]+)"/);
  if (route === '/offline' && robots.toLowerCase().includes('noindex')) continue;
  const required = [
    [/<title>[^<]+<\/title>/, 'title'], [/<meta name="description" content="[^"]+"/, 'description'],
    [/<meta property="og:title" content="[^"]+"/, 'og:title'], [/<meta property="og:description" content="[^"]+"/, 'og:description'],
    [/<meta property="og:url" content="[^"]+"/, 'og:url'], [/<meta property="og:image" content="https:\/\/[^" ]+"/, 'og:image'],
    [/<meta property="og:site_name" content="[^"]+"/, 'og:site_name'], [/<meta name="twitter:card" content="[^"]+"/, 'twitter:card'],
    [/<meta name="twitter:title" content="[^"]+"/, 'twitter:title'], [/<meta name="twitter:description" content="[^"]+"/, 'twitter:description'], [/<meta name="twitter:image" content="https:\/\/[^" ]+"/, 'twitter:image'],
  ];
  for (const [pattern, label] of required) if (!pattern.test(html)) failures.push(`${route}: ${label} eksik`);
  for (const [pattern, label] of [[/<title>/g, 'title'], [/<meta name="description"/g, 'description'], [/<link rel="canonical"/g, 'canonical'], [/<meta property="og:url"/g, 'og:url']]) {
    const count = (html.match(pattern) ?? []).length;
    if (count !== 1) failures.push(`${route}: ${label} sayısı ${count}, beklenen 1`);
  }
  if (!canonical.startsWith(origin) || canonical.includes('localhost') || canonical.includes('.vercel.app')) failures.push(`${route}: canonical production domaininde değil (${canonical})`);
  if (ogUrl !== canonical) failures.push(`${route}: og:url canonical ile eşleşmiyor (${ogUrl})`);
  const expectedEnglish = route === '/en' || route.startsWith('/en/');
  if (ogLocale !== (expectedEnglish ? 'en_US' : 'tr_TR')) failures.push(`${route}: og:locale yanlış (${ogLocale})`);
  if (rssDiscovery !== `${origin}${expectedEnglish ? '/en/rss.xml' : '/rss.xml'}`) failures.push(`${route}: RSS discovery locale ile uyumsuz (${rssDiscovery})`);
  if (route !== '/404') {
    const canonicalPath = new URL(canonical).pathname.replace(/\/$/, '') || '/';
    if (canonicalPath !== route) failures.push(`${route}: canonical kendisini göstermiyor (${canonical})`);
    if (seenTitles.has(title)) failures.push(`${route}: duplicate title (${seenTitles.get(title)})`); else seenTitles.set(title, route);
    if (seenDescriptions.has(description)) failures.push(`${route}: duplicate description (${seenDescriptions.get(description)})`); else seenDescriptions.set(description, route);
  }
  const shouldNoindex = route === '/404' || isPreviewBuild;
  if (shouldNoindex ? !robots.includes('noindex') : !robots.includes('index')) failures.push(`${route}: robots meta yanlış (${robots})`);
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) failures.push(`${route}: H1 sayısı ${h1Count}`);
  for (const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(match[1]);
      const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      for (const entity of graph) {
        if (entity['@type'] === 'BlogPosting') {
          if (entity.url !== canonical || entity.mainEntityOfPage?.['@id'] !== canonical) failures.push(`${route}: BlogPosting URL canonical ile eşleşmiyor`);
          if (entity.inLanguage !== (expectedEnglish ? 'en-US' : 'tr-TR')) failures.push(`${route}: BlogPosting inLanguage yanlış (${entity.inLanguage})`);
          if (!entity.headline || !entity.description || !entity.datePublished || !entity.dateModified || !entity.image) failures.push(`${route}: BlogPosting zorunlu proje alanları eksik`);
        }
        if (entity.inLanguage && entity.inLanguage !== (expectedEnglish ? 'en-US' : 'tr-TR')) failures.push(`${route}: JSON-LD inLanguage yanlış (${entity.inLanguage})`);
      }
    } catch { failures.push(`${route}: geçersiz JSON-LD`); }
  }
  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = match[1].split(/[?#]/)[0];
    if (!href || href === '/' || href.startsWith('/_astro/') || /\.(?:xml|txt|svg|ico|png|webp|jpg|jpeg|webmanifest)$/i.test(href)) continue;
    const normalized = href.endsWith('/') ? href.slice(0, -1) : href;
    if (!routeFiles.has(normalized)) failures.push(`${route}: bozuk internal link ${href}`);
  }
}

const structured = {
  '/': ['Person', 'WebSite'], '/ben-kimim': ['ProfilePage', 'Person', 'BreadcrumbList'],
  '/yazilar': ['CollectionPage', 'ItemList', 'BreadcrumbList'], '/yazilar/neden-bu-blogu-actim': ['BlogPosting', 'BreadcrumbList'],
  '/yazilar/kategori/ag-ve-linux': ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  '/yazilar/kategori/kisisel-notlar': ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  '/yazilar/seri/network-ogrenme-gunlugu': ['CollectionPage', 'ItemList', 'BreadcrumbList'],
};
for (const [route, types] of Object.entries(structured)) {
  const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
  const html = await readFile(file, 'utf8').catch(() => '');
  for (const type of types) if (!html.includes(`"@type":"${type}"`)) failures.push(`${route}: ${type} structured data eksik`);
}

for (const required of ['rss.xml', 'robots.txt', 'sitemap-index.xml', 'sitemap-0.xml', '404.html']) if (!files.some((file) => file.endsWith(required))) failures.push(`${required} eksik`);
for (const draft of ['linux-terminalinde-her-gun-kullandigim-temel-komutlar', '/yazilar/test']) if (routeFiles.has(`/yazilar/${draft}`) || routeFiles.has(draft)) failures.push(`Draft route üretildi: ${draft}`);
const sitemap = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8').catch(() => '');
if (/localhost|\.vercel\.app|\/404|\/rss\.xml|\/robots\.txt|linux-terminalinde|\/yazilar\/test/.test(sitemap)) failures.push('Sitemap yasaklı veya draft URL içeriyor');
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) if (!match[1].startsWith(origin)) failures.push(`Sitemap production dışı URL: ${match[1]}`);

const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8').catch(() => '');
const expectedRobotsLines = isPreviewBuild
  ? ['User-agent: *', 'Disallow: /', `Sitemap: ${origin}/sitemap-index.xml`]
  : ['User-agent: OAI-SearchBot', 'Allow: /', 'User-agent: GPTBot', 'Disallow: /', `Sitemap: ${origin}/sitemap-index.xml`];
for (const line of expectedRobotsLines) if (!robots.includes(line)) failures.push(`robots.txt eksik: ${line}`);

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`SEO audit başarılı: ${htmlFiles.length} HTML, canonical, robots, H1, JSON-LD, internal link, sitemap ve RSS doğrulandı.`);
