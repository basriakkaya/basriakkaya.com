import { readFile, readdir, stat, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const removedPattern = /PostReactions|post_reactions|PUBLIC_SUPABASE|PUBLIC_REACTIONS|REACTION_HASH_SECRET|ba_visitor_id/i;
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

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Security audit başarılı: secret, Git ignore, kaldırılmış backend, dış bağlantı, HTML sink, source map, canonical ve Vercel header/CSP kontrolleri temiz.');
