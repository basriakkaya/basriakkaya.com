import { readFile, readdir, stat, access } from 'node:fs/promises';
import path from 'node:path';
const dist = path.join(process.cwd(), 'dist');
const origin = 'https://www.basriakkaya.com';
const failures = [];
const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
async function walk(directory) { const files = []; for (const name of await readdir(directory)) { const item = path.join(directory, name); (await stat(item)).isDirectory() ? files.push(...await walk(item)) : files.push(item); } return files; }
if (!await exists(dist)) failures.push('dist bulunamadı; önce build çalıştırılmalı');
const files = await walk(dist).catch(() => []);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const routes = new Set(htmlFiles.map((file) => { const relative = path.relative(dist, file).replaceAll(path.sep, '/'); return relative === 'index.html' ? '/' : relative === '404.html' ? '/404' : `/${relative.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`; }));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  const route = relative === 'index.html' ? '/' : relative === '404.html' ? '/404' : `/${relative.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`;
  if (route === '/offline') continue;
  const expectedLang = route === '/en' || route.startsWith('/en/') ? 'en' : 'tr';
  if (!html.includes(`<html lang="${expectedLang}"`)) failures.push(`${route}: html lang ${expectedLang} değil`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical?.startsWith(origin) || new URL(canonical).pathname.replace(/\/$/, '') !== (route === '/' ? '' : route)) failures.push(`${route}: self-canonical yanlış (${canonical})`);
  for (const match of html.matchAll(/<link rel="alternate" hreflang="(?:tr|en|x-default)" href="([^"]+)"/g)) { const target = new URL(match[1]); const targetRoute = target.pathname.replace(/\/$/, '') || '/'; if (target.origin !== origin || !routes.has(targetRoute)) failures.push(`${route}: geçersiz hreflang hedefi ${match[1]}`); }
  const primaryNav = html.match(/<nav id="site-menu"[\s\S]*?<\/nav>/)?.[0] ?? '';
  if (expectedLang === 'en' && /href="\/(?:yazilar|ben-kimim)(?:\/|"|#)/.test(primaryNav)) failures.push(`${route}: İngilizce sayfada Türkçe ana navigasyon linki`);
}
for (const required of ['en/index.html', 'en/about/index.html', 'en/articles/index.html', 'en/rss.xml']) if (!files.some((file) => file.endsWith(required))) failures.push(`${required} eksik`);
const trRss = await readFile(path.join(dist, 'rss.xml'), 'utf8').catch(() => '');
const enRss = await readFile(path.join(dist, 'en/rss.xml'), 'utf8').catch(() => '');
if (!trRss.includes('<language>tr-TR</language>') || /\/en\/articles\//.test(trRss)) failures.push('Türkçe RSS dil karışması');
if (!enRss.includes('<language>en-US</language>') || /\/yazilar\//.test(enRss)) failures.push('İngilizce RSS dil karışması');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`i18n audit passed: ${htmlFiles.length} HTML, localized canonical/lang/hreflang/navigation ve iki RSS doğrulandı.`);
