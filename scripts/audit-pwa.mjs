import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];
const read = async (file, encoding = 'utf8') => readFile(path.join(root, file), encoding).catch(() => null);
const occurrences = (text, pattern) => text?.match(pattern)?.length ?? 0;

async function walk(directory) {
  const files = [];
  for (const name of await readdir(directory)) {
    const item = path.join(directory, name);
    const info = await stat(item);
    if (info.isDirectory()) files.push(...await walk(item));
    else files.push(item);
  }
  return files;
}

function pngDimensions(buffer) {
  if (!buffer || buffer.length < 24 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const manifestText = await read('dist/site.webmanifest');
let manifest;
try {
  manifest = JSON.parse(manifestText ?? '');
} catch {
  failures.push('dist/site.webmanifest geçerli JSON değil');
}

if (manifest) {
  for (const [key, expected] of Object.entries({ id: '/', start_url: '/', scope: '/', display: 'standalone', lang: 'tr' })) {
    if (manifest[key] !== expected) failures.push(`Manifest ${key} değeri ${JSON.stringify(expected)} olmalı`);
  }
  for (const key of ['name', 'short_name', 'theme_color', 'background_color']) if (!manifest[key]) failures.push(`Manifest ${key} alanı eksik`);
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const expectedIcons = [
    ['/pwa-192x192.png', 192, 'any'],
    ['/pwa-512x512.png', 512, 'any'],
    ['/pwa-maskable-512x512.png', 512, 'maskable'],
  ];
  for (const [src, size, purpose] of expectedIcons) {
    const icon = icons.find((item) => item.src === src && item.sizes === `${size}x${size}` && item.purpose === purpose);
    if (!icon) failures.push(`Manifest icon kaydı eksik veya hatalı: ${src}`);
    const buffer = await read(`dist${src}`, null);
    const dimensions = pngDimensions(buffer);
    if (dimensions?.width !== size || dimensions?.height !== size) failures.push(`${src} gerçek ölçüsü ${size}x${size} değil`);
  }
  const iconSources = icons.map((icon) => icon.src);
  if (new Set(iconSources).size !== iconSources.length) failures.push('Manifest duplicate icon kaydı içeriyor');
  if (iconSources.some((src) => /^(?:https?:)?\/\//iu.test(src) || /vercel\.app/iu.test(src))) failures.push('Manifest harici veya preview icon URL içeriyor');
}

const sw = await read('dist/sw.js');
if (!sw) failures.push('dist/sw.js eksik veya boş');
else {
  if (/(?:unpkg|jsdelivr|cdnjs|googleapis|gstatic)\.com/iu.test(sw)) failures.push('Service Worker harici CDN URL içeriyor');
  if (/localhost|127\.0\.0\.1|\.vercel\.app/iu.test(sw)) failures.push('Service Worker development/preview origin içeriyor');
  if (/unsafe-eval|BEGIN (?:RSA|OPENSSH)|PRIVATE_KEY|SERVICE_ROLE|API_KEY[=:]|TOKEN[=:]|PASSWORD[=:]|SECRET[=:]/iu.test(sw)) failures.push('Service Worker yasaklı güvenlik ifadesi içeriyor');
  if (/importScripts\s*\(\s*["']https?:/iu.test(sw)) failures.push('Service Worker harici importScripts kullanıyor');
  if (!sw.includes('offline.html')) failures.push('offline.html Service Worker precache manifestinde yok');
  if (sw.includes('"url":"/.well-known/security.txt"')) failures.push('security.txt Service Worker precache manifestinde olmamalı');
  const adminPrecacheEntries = [...sw.matchAll(/"url":"([^"]+)"/gu)]
    .map((match) => match[1])
    .filter((url) => /^\/?admin(?:\/(?:index\.html)?)?$/u.test(url));
  if (adminPrecacheEntries.length) failures.push('admin HTML Service Worker precache manifestinde olmamalı');
}

const offline = await read('dist/offline.html');
if (!offline) failures.push('dist/offline.html eksik');
else {
  if (!/<meta name="robots" content="noindex, nofollow">/iu.test(offline)) failures.push('offline.html noindex, nofollow içermiyor');
  if (!/<a href="\/" title="Basri Akkaya ana sayfasına dön">/u.test(offline)) failures.push('offline.html ana sayfa linki veya title değeri hatalı');
}

const sitemapFiles = (await readdir(dist).catch(() => [])).filter((name) => /^sitemap(?:-index|-\d+)?\.xml$/u.test(name));
for (const file of sitemapFiles) {
  const xml = await read(`dist/${file}`);
  if (xml?.includes('/offline.html')) failures.push(`${file} offline.html içeriyor`);
  if (/\/(?:site\.webmanifest|sw\.js|pwa-(?:192x192|512x512|maskable-512x512)\.png)/u.test(xml ?? '')) failures.push(`${file} PWA sistem dosyası içeriyor`);
}

const htmlFiles = (await walk(dist).catch(() => [])).filter((file) => file.endsWith('.html') && path.basename(file) !== 'offline.html' && path.relative(dist, file).replaceAll(path.sep, '/') !== 'admin/index.html');
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const label = path.relative(root, file);
  if (occurrences(html, /<link rel="manifest" href="\/site\.webmanifest"\s*\/?\s*>/gu) !== 1) failures.push(`${label}: manifest link sayısı 1 değil`);
  if (occurrences(html, /<meta name="theme-color" content="[^"]+"\s*\/?\s*>/gu) !== 1) failures.push(`${label}: theme-color sayısı 1 değil`);
  if (occurrences(html, /<link rel="apple-touch-icon"[^>]*>/gu) !== 1) failures.push(`${label}: apple-touch-icon sayısı 1 değil`);
  if (occurrences(html, /<link rel="canonical" href="[^"]+"\s*\/?\s*>/gu) !== 1) failures.push(`${label}: canonical sayısı 1 değil`);
}

const config = await read('astro.config.mjs');
const client = await read('src/scripts/pwa-client.ts');
const layout = await read('src/layouts/BaseLayout.astro');
const serviceWorkerSource = await read('src/sw.ts');
const sourceFiles = (await walk(path.join(root, 'src'))).filter((file) => /\.(?:astro|ts|js)$/u.test(file));
const sourceText = (await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))).join('\n');
if (occurrences(config, /VitePWA\s*\(/gu) !== 1) failures.push('VitePWA yapılandırması tam olarak bir kez bulunmalı');
if (!/injectRegister:\s*null/u.test(config ?? '') || !/manifest:\s*false/u.test(config ?? '')) failures.push('Plugin injectRegister:null veya manifest:false ayarı eksik');
if (occurrences(client, /from ['"]virtual:pwa-register['"]/gu) !== 1) failures.push('virtual:pwa-register merkezi kullanım sayısı 1 değil');
if (occurrences(sourceText, /navigator\.serviceWorker\.register\s*\(/gu) !== 0) failures.push('Manuel duplicate Service Worker registration bulundu');
if (occurrences(layout, /scripts\/pwa-client\.ts/gu) !== 1) failures.push('PWA client BaseLayout içinde tam bir kez yüklenmeli');
if (/new\s+CacheFirst[\s\S]{0,500}request\.mode\s*===?\s*['"]navigate/u.test(serviceWorkerSource ?? '')) failures.push('HTML navigation için CacheFirst kullanılıyor');
if (!/new\s+NetworkFirst/u.test(serviceWorkerSource ?? '')) failures.push('HTML NetworkFirst stratejisi bulunamadı');
if (!serviceWorkerSource?.includes('\\.well-known\\/security\\.txt')) failures.push('security.txt Service Worker sistem URL/NetworkOnly listesinde değil');
for (const route of ['/admin', '/admin/', '/admin/index.html']) {
  if (!serviceWorkerSource?.includes(`'${route}'`)) failures.push(`${route} Service Worker sistem URL/NetworkOnly listesinde değil`);
}
if (occurrences(serviceWorkerSource, /isSystemPath\(url\.pathname\)/gu) !== 2) failures.push('/admin NetworkOnly ve navigation exclusion aynı sistem yolu kontrolünü kullanmalı');
if (/googleAnalytics|analytics\.js|collect\?/iu.test(serviceWorkerSource ?? '')) failures.push('Service Worker Analytics cache kuralı içeriyor');

const adminHtml = await read('dist/admin/index.html');
if (!adminHtml) failures.push('dist/admin/index.html eksik');
else {
  if (/<link rel="manifest"|site\.webmanifest/iu.test(adminHtml)) failures.push('/admin manifest yüklememeli');
  if (/pwa-client|virtual:pwa-register|navigator\.serviceWorker\.register/iu.test(adminHtml)) failures.push('/admin Service Worker registration yüklememeli');
  if (/<link rel="canonical"/iu.test(adminHtml)) failures.push('/admin canonical yüklememeli');
}

if (failures.length) {
  console.error('PWA audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const precacheEntries = [...(sw?.matchAll(/\{"revision":(?:"[^"]+"|null),"url":"([^"]+)"\}/gu) ?? [])].map((match) => match[1]);
const precacheBytes = (await Promise.all(precacheEntries.map(async (url) => stat(path.join(dist, url)).then((info) => info.size).catch(() => 0)))).reduce((sum, size) => sum + size, 0);
console.log('PWA audit passed');
console.log(`- Normal HTML files: ${htmlFiles.length}`);
console.log(`- Precache entries: ${precacheEntries.length || 'generated manifest verified'}`);
console.log(`- Precache bytes: ${precacheBytes}`);
console.log('- Manifest links per page: 1');
console.log('- Duplicate registrations: 0');
console.log('- PWA files in sitemap: 0');
