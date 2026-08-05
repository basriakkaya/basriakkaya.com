import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];
const metrics = {
  htmlFiles: 0,
  links: 0,
  missingTitles: 0,
  meaninglessTexts: 0,
  nestedAnchors: 0,
  brokenInternalRoutes: 0,
  externalRelErrors: 0,
};

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

const decodeHtml = (value) => value
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&apos;', "'")
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');

const getAttributes = (source) => {
  const attributes = new Map();
  for (const match of source.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu)) {
    const name = match[1].toLowerCase();
    if (!attributes.has(name)) attributes.set(name, decodeHtml(match[2] ?? match[3] ?? match[4] ?? ''));
  }
  return attributes;
};

const visibleText = (html) => decodeHtml(html)
  .replace(/<span[^>]+class="sr-only"[^>]*>[\s\S]*?<\/span>/giu, ' ')
  .replace(/<[^>]+>/gu, ' ')
  .replace(/[→←↗›~/·]/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim();

const normalizeRoute = (pathname) => {
  let route = pathname.replace(/\/index\.html$/u, '').replace(/\.html$/u, '');
  if (!route.startsWith('/')) route = `/${route}`;
  if (route.length > 1) route = route.replace(/\/+$/u, '');
  return route || '/';
};

const routeForHtml = (file) => {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  return normalizeRoute(relative === 'index.html' ? '/' : `/${relative}`);
};

const requiresDescriptiveTitle = (pathname) => pathname === '/'
  || pathname === '/yazilar'
  || pathname === '/ben-kimim'
  || pathname.startsWith('/yazilar/kategori/')
  || pathname.startsWith('/yazilar/seri/')
  || (pathname.startsWith('/yazilar/') && pathname.split('/').filter(Boolean).length === 2);

if (!await exists(dist)) {
  console.error('Link audit failed\n- dist bulunamadı; önce npm run build çalıştırılmalı');
  process.exit(1);
}

const files = await walk(dist);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
metrics.htmlFiles = htmlFiles.length;
const htmlRoutes = new Set(htmlFiles.map(routeForHtml));
const publicFiles = new Set(files.map((file) => `/${path.relative(dist, file).replaceAll(path.sep, '/')}`));
const requiredTargets = [
  '/yazilar',
  '/ben-kimim',
  '/yazilar/kategori/ag-ve-linux',
  '/yazilar/kategori/web-guvenligi',
  '/yazilar/seri/network-ogrenme-gunlugu',
  '/yazilar/network-ogrenme-gunlugu-gun-3',
  '/yazilar/network-ogrenme-gunlugu-gun-2',
  '/yazilar/owasp-top-10-2025-mantik-rehberi',
];
const observedTargets = new Set();
const meaninglessValues = new Set(['link', 'tıkla', 'buraya tıklayın', 'devam', 'oku', 'aç', 'git']);

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const sourceRoute = routeForHtml(file);
  let anchorDepth = 0;
  for (const token of html.matchAll(/<a\b[^>]*>|<\/a>/giu)) {
    if (token[0].toLowerCase() === '</a>') {
      anchorDepth = Math.max(0, anchorDepth - 1);
    } else {
      if (anchorDepth > 0) {
        metrics.nestedAnchors += 1;
        failures.push(`${sourceRoute}: nested <a> elementi bulundu`);
      }
      anchorDepth += 1;
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/giu)) {
    metrics.links += 1;
    const rawAttributes = match[1];
    const attributes = getAttributes(rawAttributes);
    const href = attributes.get('href')?.trim() ?? '';
    const title = attributes.get('title')?.trim() ?? '';
    const ariaLabel = attributes.get('aria-label')?.trim() ?? '';
    const text = visibleText(match[2]);
    const titleCount = [...rawAttributes.matchAll(/(?:^|\s)title\s*=/giu)].length;

    if (!href) failures.push(`${sourceRoute}: boş href içeren bağlantı`);
    if (href === '#') failures.push(`${sourceRoute}: href="#" kullanılıyor`);
    if (/^javascript:/iu.test(href)) failures.push(`${sourceRoute}: JavaScript URL kullanılıyor`);
    if (titleCount > 1) failures.push(`${sourceRoute}: aynı linkte duplicate title attribute (${href})`);
    if (!text && !ariaLabel) failures.push(`${sourceRoute}: erişilebilir adı olmayan bağlantı (${href || 'boş href'})`);
    if (meaninglessValues.has((text || ariaLabel).toLocaleLowerCase('tr-TR'))) {
      metrics.meaninglessTexts += 1;
      failures.push(`${sourceRoute}: anlamsız bağlantı metni (${text || ariaLabel}, ${href})`);
    }
    if (title && meaninglessValues.has(title.toLocaleLowerCase('tr-TR'))) failures.push(`${sourceRoute}: anlamsız title (${title}, ${href})`);
    if (title && title === href) failures.push(`${sourceRoute}: title URL ile aynı (${href})`);

    const isInternal = href.startsWith('/') && !href.startsWith('//');
    if (isInternal) {
      if (attributes.get('target') === '_blank') failures.push(`${sourceRoute}: internal link target="_blank" kullanıyor (${href})`);
      const parsed = new URL(href, 'https://www.basriakkaya.com');
      const targetRoute = normalizeRoute(parsed.pathname);
      observedTargets.add(targetRoute);
      if (requiresDescriptiveTitle(targetRoute) && !title) {
        metrics.missingTitles += 1;
        failures.push(`${sourceRoute}: önemli internal link title eksik (${href})`);
      }
      const resourceExists = htmlRoutes.has(targetRoute)
        || publicFiles.has(parsed.pathname)
        || publicFiles.has(`${parsed.pathname.replace(/\/$/u, '')}/index.html`);
      if (!resourceExists) {
        metrics.brokenInternalRoutes += 1;
        failures.push(`${sourceRoute}: kırık internal route (${href})`);
      }
    } else if (/^https?:\/\//iu.test(href) && attributes.get('target') === '_blank') {
      const rel = new Set((attributes.get('rel') ?? '').split(/\s+/u).filter(Boolean));
      if (!rel.has('noopener') || !rel.has('noreferrer')) {
        metrics.externalRelErrors += 1;
        failures.push(`${sourceRoute}: dış target="_blank" linkinde rel="noopener noreferrer" eksik (${href})`);
      }
    }
  }
}

for (const target of requiredTargets) {
  if (!htmlRoutes.has(target)) continue;
  if (!observedTargets.has(target)) failures.push(`Mevcut önemli route için internal bağlantı bulunamadı (${target})`);
}

if (failures.length) {
  console.error('Link audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Özet: ${metrics.htmlFiles} HTML, ${metrics.links} link, ${metrics.missingTitles} title eksik, ${metrics.meaninglessTexts} anlamsız metin, ${metrics.nestedAnchors} nested anchor, ${metrics.brokenInternalRoutes} kırık route, ${metrics.externalRelErrors} external rel hatası`);
  process.exit(1);
}

console.log('Link audit passed');
console.log(`- HTML files: ${metrics.htmlFiles}`);
console.log(`- Links: ${metrics.links}`);
console.log('- Missing descriptive titles: 0');
console.log('- Meaningless link texts: 0');
console.log('- Nested anchors: 0');
console.log('- Broken internal routes: 0');
console.log('- External rel errors: 0');
