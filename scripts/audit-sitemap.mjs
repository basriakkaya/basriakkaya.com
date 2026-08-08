import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://www.basriakkaya.com';
const isPreviewBuild = process.env.VERCEL_ENV === 'preview';
const sitemapIndexPath = path.join(dist, 'sitemap-index.xml');
const robotsPath = path.join(dist, 'robots.txt');
const failures = [];

const exists = async (file) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

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

const normalizePath = (pathname) => {
  let normalized = pathname.replace(/\/index\.html$/u, '').replace(/\.html$/u, '');
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (normalized.length > 1) normalized = normalized.replace(/\/+$/u, '');
  return normalized || '/';
};

const routeForHtml = (file) => {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  return normalizePath(relative === 'index.html' ? '/' : `/${relative}`);
};

const extractLocs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1].trim());
const duplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

async function readRequired(file, minimumBytes) {
  if (!await exists(file)) {
    failures.push(`${path.relative(root, file)}: dosya bulunamadı`);
    return '';
  }
  const info = await stat(file);
  if (info.size < minimumBytes) failures.push(`${path.relative(root, file)}: dosya çok küçük (${info.size} byte, en az ${minimumBytes} bekleniyor)`);
  return readFile(file, 'utf8');
}

const indexXml = await readRequired(sitemapIndexPath, 100);
const robots = await readRequired(robotsPath, 40);
const allFiles = await walk(dist).catch(() => []);
const sitemapFiles = allFiles
  .filter((file) => /^sitemap-\d+\.xml$/u.test(path.basename(file)))
  .sort((a, b) => a.localeCompare(b, 'en'));

if (!/^<\?xml\s+version=["']1\.0["']/u.test(indexXml.trimStart())) failures.push('dist/sitemap-index.xml: XML declaration eksik');
if (!/<sitemapindex(?:\s|>)/u.test(indexXml)) failures.push('dist/sitemap-index.xml: <sitemapindex> root elementi eksik');
if (!/<\/sitemapindex>/u.test(indexXml)) failures.push('dist/sitemap-index.xml: </sitemapindex> kapanışı eksik');
if (!/<sitemap(?:\s|>)/u.test(indexXml)) failures.push('dist/sitemap-index.xml: sitemap kaydı eksik');

const indexLocs = extractLocs(indexXml);
if (!indexLocs.length) failures.push('dist/sitemap-index.xml: <loc> kaydı eksik');
if (!indexLocs.includes(`${origin}/sitemap-0.xml`)) failures.push(`dist/sitemap-index.xml: beklenen ${origin}/sitemap-0.xml bağlantısı eksik`);
for (const duplicate of duplicates(indexLocs)) failures.push(`dist/sitemap-index.xml: duplicate <loc> (${duplicate})`);
for (const url of indexLocs) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    failures.push(`dist/sitemap-index.xml: geçersiz URL (${url})`);
    continue;
  }
  if (parsed.origin !== origin || parsed.protocol !== 'https:') failures.push(`dist/sitemap-index.xml: production dışı sitemap URL (${url})`);
  const referencedFile = path.join(dist, path.basename(parsed.pathname));
  if (!await exists(referencedFile)) failures.push(`dist/sitemap-index.xml: referans verilen dosya yok (${path.basename(referencedFile)})`);
}
if (/localhost|127\.0\.0\.1|\.vercel\.app|http:\/\/www\.basriakkaya\.com/iu.test(indexXml)) failures.push('dist/sitemap-index.xml: yasaklı host veya protokol bulundu');

if (!sitemapFiles.length) failures.push('dist: numaralandırılmış sitemap dosyası bulunamadı');

const sitemapUrls = [];
for (const file of sitemapFiles) {
  const label = path.relative(root, file);
  const xml = await readRequired(file, 200);
  if (!/^<\?xml\s+version=["']1\.0["']/u.test(xml.trimStart())) failures.push(`${label}: XML declaration eksik`);
  if (!/<urlset(?:\s|>)/u.test(xml)) failures.push(`${label}: <urlset> root elementi eksik`);
  if (!/<\/urlset>/u.test(xml)) failures.push(`${label}: </urlset> kapanışı eksik`);
  if (!/<url(?:\s|>)/u.test(xml)) failures.push(`${label}: <url> kaydı eksik`);
  const locs = extractLocs(xml);
  if (!locs.length) failures.push(`${label}: <loc> kaydı eksik`);
  sitemapUrls.push(...locs);
}

const forbiddenPathPatterns = [
  /^\/404(?:\/|$)/u,
  /^\/offline(?:\.html)?(?:\/|$)/u,
  /(?:^|\/)test(?:-|\/|$)/iu,
  /(?:^|\/)admin(?:\/|$)/iu,
  /(?:^|\/)private(?:\/|$)/iu,
  /linux-terminalinde-her-gun-kullandigim-temel-komutlar/iu,
  /\/yazilar\/test/iu,
  /\/sitemap(?:-index|-\d+)?\.xml$/iu,
  /\/(?:robots\.txt|rss\.xml|site\.webmanifest)$/iu,
];

const sitemapPaths = new Map();
for (const url of sitemapUrls) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    failures.push(`Sitemap: geçersiz mutlak URL (${url})`);
    continue;
  }
  if (parsed.origin !== origin || parsed.protocol !== 'https:') failures.push(`Sitemap: production dışı origin (${url})`);
  if (parsed.search) failures.push(`Sitemap: query string içeriyor (${url})`);
  if (parsed.hash) failures.push(`Sitemap: fragment içeriyor (${url})`);
  if (/localhost|127\.0\.0\.1|\.vercel\.app/iu.test(url)) failures.push(`Sitemap: yasaklı host içeriyor (${url})`);
  const normalized = normalizePath(parsed.pathname);
  for (const pattern of forbiddenPathPatterns) if (pattern.test(normalized)) failures.push(`Sitemap: yasaklı route içeriyor (${url})`);
  if (sitemapPaths.has(normalized)) failures.push(`Sitemap: duplicate route (${url}; ilk kayıt ${sitemapPaths.get(normalized)})`);
  else sitemapPaths.set(normalized, url);
}
for (const duplicate of duplicates(sitemapUrls)) failures.push(`Sitemap: duplicate URL (${duplicate})`);

const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
const indexableRoutes = new Map();
for (const file of htmlFiles) {
  const route = routeForHtml(file);
  const html = await readFile(file, 'utf8');
  const robotsContent = html.match(/<meta name="robots" content="([^"]+)"/u)?.[1] ?? '';
  const canonicalValue = html.match(/<link rel="canonical" href="([^"]+)"/u)?.[1] ?? '';
  const excluded = route === '/404' || route === '/admin' || route === '/offline' || /(?:^|\/)test(?:-|\/|$)/iu.test(route) || (!isPreviewBuild && robotsContent.toLowerCase().includes('noindex'));
  if (excluded) continue;

  let canonical;
  try {
    canonical = new URL(canonicalValue);
  } catch {
    failures.push(`${path.relative(root, file)}: canonical geçersiz veya eksik (${canonicalValue || 'boş'})`);
    continue;
  }
  if (canonical.origin !== origin || canonical.protocol !== 'https:') failures.push(`${path.relative(root, file)}: canonical production origin kullanmıyor (${canonicalValue})`);
  if (canonical.search || canonical.hash) failures.push(`${path.relative(root, file)}: canonical query veya fragment içeriyor (${canonicalValue})`);
  if (normalizePath(canonical.pathname) !== route) failures.push(`${path.relative(root, file)}: canonical route ile eşleşmiyor (${canonicalValue})`);
  indexableRoutes.set(route, file);
}

for (const required of ['/', '/yazilar', '/ben-kimim']) {
  if (!sitemapPaths.has(required)) failures.push(`Sitemap: temel route eksik (${origin}${required})`);
}
for (const [route, file] of indexableRoutes) {
  if (!sitemapPaths.has(route)) failures.push(`Sitemap: indexlenebilir HTML route eksik (${route}, ${path.relative(root, file)})`);
}
for (const [route, url] of sitemapPaths) {
  if (!indexableRoutes.has(route)) failures.push(`Sitemap: build çıktısında indexlenebilir HTML karşılığı olmayan route (${url})`);
}

const sitemapDeclaration = `Sitemap: ${origin}/sitemap-index.xml`;
const sitemapLines = robots.split(/\r?\n/u).filter((line) => /^Sitemap:/iu.test(line.trim()));
if (sitemapLines.length !== 1) failures.push(`dist/robots.txt: sitemap declaration sayısı ${sitemapLines.length}, beklenen 1`);
if (sitemapLines[0]?.trim() !== sitemapDeclaration) failures.push(`dist/robots.txt: sitemap declaration yanlış (${sitemapLines[0]?.trim() || 'eksik'})`);
if (isPreviewBuild) {
  if (!robots.includes('User-agent: *') || !robots.includes('Disallow: /')) failures.push('dist/robots.txt: preview ortamı crawler engeli eksik');
} else {
  if (!robots.includes('User-agent: OAI-SearchBot') || !robots.includes('Allow: /')) failures.push('dist/robots.txt: OAI-SearchBot kuralı kayıp');
  if (!robots.includes('User-agent: GPTBot') || !robots.includes('Disallow: /')) failures.push('dist/robots.txt: GPTBot kuralı kayıp');
}
if (/Sitemap:\s*.*(?:localhost|127\.0\.0\.1|\.vercel\.app)/iu.test(robots)) failures.push('dist/robots.txt: production dışı sitemap declaration bulundu');

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const robotsContent = html.match(/<meta name="robots" content="([^"]+)"/u)?.[1] ?? '';
  if (robotsContent.toLowerCase().includes('noindex')) continue;
  const count = (html.match(/<link rel="sitemap" type="application\/xml" href="\/sitemap-index\.xml"\s*\/?\s*>/gu) ?? []).length;
  if (count !== 1) failures.push(`${path.relative(root, file)}: rel=sitemap sayısı ${count}, beklenen 1`);
}

if (failures.length) {
  console.error('Sitemap audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Sitemap audit passed');
console.log('- Sitemap index: valid');
console.log(`- Sitemap files: ${sitemapFiles.length}`);
console.log(`- Sitemap URLs: ${sitemapPaths.size}`);
console.log(`- Indexable HTML routes: ${indexableRoutes.size}`);
console.log('- Duplicate URLs: 0');
console.log('- Invalid origins: 0');
console.log('- Missing routes: 0');
console.log('- Extra routes: 0');
console.log(`- robots.txt sitemap declarations: ${sitemapLines.length}`);
