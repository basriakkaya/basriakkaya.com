import { readFile, readdir, stat, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://www.basriakkaya.com';
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

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = routeFor(file);
  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  const robots = attr(html, /<meta name="robots" content="([^"]+)"/);
  const required = [
    [/<title>[^<]+<\/title>/, 'title'], [/<meta name="description" content="[^"]+"/, 'description'],
    [/<meta property="og:title" content="[^"]+"/, 'og:title'], [/<meta property="og:description" content="[^"]+"/, 'og:description'],
    [/<meta property="og:url" content="[^"]+"/, 'og:url'], [/<meta property="og:image" content="https:\/\/[^" ]+"/, 'og:image'],
    [/<meta name="twitter:card" content="[^"]+"/, 'twitter:card'],
  ];
  for (const [pattern, label] of required) if (!pattern.test(html)) failures.push(`${route}: ${label} eksik`);
  if (!canonical.startsWith(origin) || canonical.includes('localhost') || canonical.includes('.vercel.app')) failures.push(`${route}: canonical production domaininde değil (${canonical})`);
  if (route === '/404' ? !robots.includes('noindex') : !robots.includes('index')) failures.push(`${route}: robots meta yanlış (${robots})`);
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) failures.push(`${route}: H1 sayısı ${h1Count}`);
  for (const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { failures.push(`${route}: geçersiz JSON-LD`); }
  }
  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = match[1].split(/[?#]/)[0];
    if (!href || href === '/' || href.startsWith('/_astro/') || /\.(?:xml|txt|svg|ico|png|webp|jpg|jpeg)$/i.test(href)) continue;
    const normalized = href.endsWith('/') ? href.slice(0, -1) : href;
    if (!routeFiles.has(normalized)) failures.push(`${route}: bozuk internal link ${href}`);
  }
}

const structured = {
  '/': ['Person', 'WebSite'], '/ben-kimim': ['ProfilePage', 'Person', 'BreadcrumbList'],
  '/yazilar': ['Blog', 'BreadcrumbList'], '/yazilar/neden-bu-blogu-actim': ['BlogPosting', 'BreadcrumbList'],
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
for (const line of ['User-agent: OAI-SearchBot', 'Allow: /', 'User-agent: GPTBot', 'Disallow: /', `Sitemap: ${origin}/sitemap-index.xml`]) if (!robots.includes(line)) failures.push(`robots.txt eksik: ${line}`);

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`SEO audit başarılı: ${htmlFiles.length} HTML, canonical, robots, H1, JSON-LD, internal link, sitemap ve RSS doğrulandı.`);
