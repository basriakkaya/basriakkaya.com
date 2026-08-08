import { readFile, readdir, stat, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://www.basriakkaya.com';
const failures = [];
const removedPattern = /post_reactions|PUBLIC_SUPABASE|PUBLIC_REACTIONS|REACTION_HASH_SECRET|ba_visitor_id/i;
const secretPattern = /SERVICE_ROLE|(?:API|PRIVATE)[_-]?KEY\s*[=:]\s*["'][^"']+|PASSWORD\s*[=:]\s*["'][^"']+|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i;

async function filesUnder(relative) {
  const absolute = path.join(root, relative);
  try { await access(absolute); } catch { return []; }
  const result = [];
  async function walk(current) {
    for (const name of await readdir(current)) {
      const item = path.join(current, name); const info = await stat(item);
      if (info.isDirectory()) await walk(item); else result.push(item);
    }
  }
  await walk(absolute); return result;
}

const sourceFiles = [...await filesUnder('src'), ...await filesUnder('public'), path.join(root, 'README.md'), path.join(root, '.env.example')];
for (const file of sourceFiles) {
  const text = await readFile(file, 'utf8').catch(() => '');
  if (removedPattern.test(text)) failures.push(`Kaldırılmış backend referansı: ${path.relative(root, file)}`);
  if (/javascript\s*:/i.test(text)) failures.push(`javascript: URL: ${path.relative(root, file)}`);
  if (/\b(?:eval|Function)\s*\(/.test(text)) failures.push(`Dinamik kod çalıştırma: ${path.relative(root, file)}`);
  if (/\.innerHTML\s*=/.test(text)) failures.push(`innerHTML ataması: ${path.relative(root, file)}`);
  if (/<iframe\b/i.test(text)) failures.push(`Beklenmeyen iframe: ${path.relative(root, file)}`);
}

for (const file of sourceFiles.filter((file) => file.endsWith('.astro'))) {
  const text = await readFile(file, 'utf8');
  for (const tag of text.match(/<a\b[^>]*target="_blank"[^>]*>/gs) ?? []) if (!/rel="[^"]*noopener[^"]*noreferrer[^"]*"/.test(tag)) failures.push(`Güvensiz dış bağlantı: ${path.relative(root, file)}`);
  if (text.includes('set:html') && !file.endsWith(`${path.sep}SEO.astro`)) failures.push(`Kontrol dışı set:html: ${path.relative(root, file)}`);
  for (const mailto of text.match(/href=\{`mailto:\$\{([^}]+)\}`\}/g) ?? []) if (!mailto.includes('siteConfig.email')) failures.push(`Merkezi config dışı mailto: ${path.relative(root, file)}`);
}

const gitignore = await readFile(path.join(root, '.gitignore'), 'utf8').catch(() => '');
for (const rule of ['.env', '.env.*', '!.env.example', 'node_modules/', 'dist/', '.astro/', '.vercel/']) if (!gitignore.includes(rule)) failures.push(`.gitignore kuralı eksik: ${rule}`);
try { execFileSync('git', ['ls-files', '--error-unmatch', '.env'], { cwd: root, stdio: 'ignore' }); failures.push('.env Git tarafından takip ediliyor'); } catch { /* beklenen */ }

for (const file of await filesUnder('dist')) {
  const text = await readFile(file, 'utf8').catch(() => '');
  if (secretPattern.test(text)) failures.push(`Build çıktısında secret paterni: ${path.relative(root, file)}`);
  if (file.endsWith('.map')) failures.push(`Production source map: ${path.relative(root, file)}`);
  const metadataTags = text.match(/<(?:link|meta)\b[^>]*(?:rel="canonical"|property="og:url")[^>]*>/gi) ?? [];
  if (metadataTags.some((tag) => /localhost|\.vercel\.app/i.test(tag))) failures.push(`Build metadata içinde geçici origin: ${path.relative(root, file)}`);
}

try { await access(path.join(root, 'supabase')); failures.push('Supabase klasörü mevcut'); } catch { /* beklenen */ }
const vercel = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
const headers = new Map(vercel.headers?.[0]?.headers?.map(({ key, value }) => [key.toLowerCase(), value]) ?? []);
for (const key of ['strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'content-security-policy', 'x-frame-options']) if (!headers.has(key)) failures.push(`Güvenlik header eksik: ${key}`);
const csp = headers.get('content-security-policy') ?? '';
for (const directive of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "frame-src 'none'", "connect-src 'self'"]) if (!csp.includes(directive)) failures.push(`CSP directive eksik: ${directive}`);
if (/supabase/i.test(csp)) failures.push('CSP gereksiz Supabase origin içeriyor');

const securityHeader = vercel.headers?.find(({ source }) => source === '/.well-known/security.txt')?.headers ?? [];
const securityHeaders = new Map(securityHeader.map(({ key, value }) => [key.toLowerCase(), value.toLowerCase()]));
if (securityHeaders.get('content-type') !== 'text/plain; charset=utf-8') failures.push('security.txt Vercel Content-Type text/plain; charset=utf-8 değil');

const siteSource = await readFile(path.join(root, 'src/config/site.ts'), 'utf8');
const publicEmail = siteSource.match(/email:\s*'([^']+)'/u)?.[1] ?? '';
if (!publicEmail) failures.push('siteConfig public e-posta değeri bulunamadı');
const securityPath = path.join(dist, '.well-known', 'security.txt');
const securityBuffer = await readFile(securityPath).catch(() => null);
let securityText = '';
if (!securityBuffer) failures.push('dist/.well-known/security.txt eksik');
else {
  try { securityText = new TextDecoder('utf-8', { fatal: true }).decode(securityBuffer); } catch { failures.push('security.txt geçerli UTF-8 değil'); }
}
const securityLines = securityText.split(/\r?\n/u).filter(Boolean);
const fields = new Map();
for (const line of securityLines) {
  const match = line.match(/^([A-Za-z][A-Za-z-]*): (\S(?:.*\S)?)$/u);
  if (!match) { failures.push(`security.txt geçersiz field satırı: ${line}`); continue; }
  const values = fields.get(match[1]) ?? [];
  values.push(match[2]); fields.set(match[1], values);
}
const expectedSecurityUrl = `${origin}/.well-known/security.txt`;
if ((fields.get('Contact') ?? []).length < 1) failures.push('security.txt Contact eksik');
if ((fields.get('Expires') ?? []).length !== 1) failures.push('security.txt tam olarak bir Expires içermeli');
if ((fields.get('Canonical') ?? []).length !== 1 || fields.get('Canonical')?.[0] !== expectedSecurityUrl) failures.push('security.txt Canonical production retrieval URL ile eşleşmiyor');
if ((fields.get('Contact') ?? [])[0] !== `mailto:${publicEmail}`) failures.push('security.txt Contact siteConfig e-postasıyla eşleşmiyor');
if ((fields.get('Preferred-Languages') ?? []).length !== 1 || fields.get('Preferred-Languages')?.[0] !== 'tr, en') failures.push('security.txt Preferred-Languages tr, en değil');
const expectedPolicies = [`${origin}/guvenlik`, `${origin}/en/security`];
if (JSON.stringify(fields.get('Policy') ?? []) !== JSON.stringify(expectedPolicies)) failures.push('security.txt Türkçe/İngilizce Policy URL’leri yanlış');
for (const forbidden of ['Encryption', 'Acknowledgments', 'Hiring']) if (fields.has(forbidden)) failures.push(`security.txt gerçekte olmayan ${forbidden} alanını içeriyor`);
if (/localhost|127\.0\.0\.1|\.vercel\.app|<html|<!doctype/iu.test(securityText)) failures.push('security.txt geçici origin veya HTML içeriyor');
const expires = new Date(fields.get('Expires')?.[0] ?? 'invalid');
const remainingDays = (expires.getTime() - Date.now()) / 86_400_000;
if (!Number.isFinite(expires.getTime())) failures.push('security.txt Expires RFC 3339 tarihi geçersiz');
else if (remainingDays <= 60) failures.push(`security.txt Expires yenilenmeli (${Math.floor(remainingDays)} gün kaldı; en az 60 gün gerekli)`);
else if (remainingDays >= 365) failures.push(`security.txt Expires bir yıldan kısa olmalı (${Math.ceil(remainingDays)} gün)`);

const policyPages = [
  { route: '/guvenlik', file: path.join(dist, 'guvenlik', 'index.html'), lang: 'tr', counterpart: '/en/security', title: 'Güvenlik Bildirimi ve Sorumlu Açıklama | Basri Akkaya' },
  { route: '/en/security', file: path.join(dist, 'en', 'security', 'index.html'), lang: 'en', counterpart: '/guvenlik', title: 'Security Disclosure and Responsible Reporting | Basri Akkaya' },
];
const sitemap = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8').catch(() => '');
if (sitemap.includes('/.well-known/security.txt')) failures.push('security.txt sitemap içinde olmamalı');
for (const page of policyPages) {
  const html = await readFile(page.file, 'utf8').catch(() => '');
  if (!html) { failures.push(`${page.route} build çıktısı eksik`); continue; }
  const count = (pattern) => html.match(pattern)?.length ?? 0;
  if (!new RegExp(`<html lang="${page.lang}"`, 'u').test(html)) failures.push(`${page.route} html lang yanlış`);
  if (count(/<title>/gu) !== 1 || !html.includes(`<title>${page.title}</title>`)) failures.push(`${page.route} title yanlış veya duplicate`);
  for (const [pattern, label] of [[/<meta name="description"/gu, 'description'], [/<link rel="canonical"/gu, 'canonical'], [/<h1(?:\s|>)/gu, 'H1']]) if (count(pattern) !== 1) failures.push(`${page.route} ${label} sayısı 1 değil`);
  const canonical = `${origin}${page.route}`;
  if (!html.includes(`<link rel="canonical" href="${canonical}">`) || !html.includes(`<meta property="og:url" content="${canonical}">`)) failures.push(`${page.route} canonical/og:url yanlış`);
  for (const [lang, href] of [['tr', `${origin}/guvenlik`], ['en', `${origin}/en/security`], ['x-default', `${origin}/guvenlik`]]) if (!html.includes(`hreflang="${lang}" href="${href}"`)) failures.push(`${page.route} hreflang ${lang} yanlış`);
  if (!html.includes(`href="${page.counterpart}" hreflang=`)) failures.push(`${page.route} dil seçici eş sayfaya gitmiyor`);
  if (!html.includes(`href="mailto:${publicEmail}"`) || !html.includes('href="/.well-known/security.txt"')) failures.push(`${page.route} mailto veya security.txt bağlantısı eksik`);
  const jsonBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)];
  let webPage;
  for (const block of jsonBlocks) { try { webPage = JSON.parse(block[1])['@graph']?.find((item) => item['@type'] === 'WebPage') ?? webPage; } catch { failures.push(`${page.route} JSON-LD parse edilemiyor`); } }
  if (!webPage || webPage.url !== canonical || webPage.inLanguage !== (page.lang === 'tr' ? 'tr-TR' : 'en-US')) failures.push(`${page.route} WebPage JSON-LD canonical/locale uyumsuz`);
  if ((sitemap.match(new RegExp(`<loc>${canonical}/?</loc>`, 'gu')) ?? []).length !== 1) failures.push(`${page.route} sitemap içinde tam bir kez bulunmalı`);
}

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Security audit başarılı: uygulama kontrolleri, RFC 9116 security.txt, iki dilli politika sayfaları, sitemap ve Vercel header/CSP sözleşmeleri temiz.');
