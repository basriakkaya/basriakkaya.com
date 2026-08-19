import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];
const sourcePaths = [
  'src/pages/admin.astro',
  'src/layouts/OperationsConsoleLayout.astro',
  'src/components/operations/OperationsConsole.astro',
  'src/scripts/operations-console.ts',
  'src/styles/operations-console.css',
  'api/admin-alert.js',
  'api/visitor-ip.js',
];
const read = (relative) => readFile(path.join(root, relative), 'utf8').catch(() => '');
const sources = new Map(await Promise.all(sourcePaths.map(async (relative) => [relative, await read(relative)])));
for (const [relative, text] of sources) if (!text) failures.push(`${relative} eksik veya boş`);

const adminHtml = await read('dist/admin/index.html');
const component = sources.get('src/components/operations/OperationsConsole.astro') ?? '';
const client = sources.get('src/scripts/operations-console.ts') ?? '';
const css = sources.get('src/styles/operations-console.css') ?? '';
const endpoint = sources.get('api/visitor-ip.js') ?? '';
const alertEndpoint = sources.get('api/admin-alert.js') ?? '';
const publicSource = `${component}\n${client}\n${css}`;

if (!adminHtml) failures.push('dist/admin/index.html eksik');
if ((adminHtml.match(/<title>/gu) ?? []).length !== 1 || !adminHtml.includes('<title>Admin Login</title>')) failures.push('/admin title yanlış veya duplicate');
if (!adminHtml.includes('<html lang="en"')) failures.push('/admin html lang en değil');
if ((adminHtml.match(/<h1(?:\s|>)/gu) ?? []).length !== 1) failures.push('/admin tek H1 içermeli');
if (!adminHtml.includes('content="noindex, nofollow, noarchive, nosnippet, noimageindex"')) failures.push('/admin robots meta eksik');
if (/<link\b[^>]+rel=["'](?:canonical|alternate|sitemap)["']|application\/ld\+json|<meta\b[^>]+(?:property=["']og:|name=["']twitter:|name=["']description["'])/iu.test(adminHtml)) failures.push('/admin public SEO metadata içermemeli');
if (/site\.webmanifest|virtual:pwa-register|vercel\/analytics|speed-insights/iu.test(adminHtml)) failures.push('/admin PWA veya telemetry içermemeli');

if ((component.match(/<form(?:\s|>)/gu) ?? []).length !== 1) failures.push('/admin tek form içermeli');
if ((component.match(/<input(?:\s|>)/gu) ?? []).length !== 2) failures.push('/admin tam iki input içermeli');
if (!component.includes('>Admin Login</h1>') || !component.includes('>Username</label>') || !component.includes('>Password</label>') || !component.includes('>Sign in</button>')) failures.push('/admin sade login metin sözleşmesine uymuyor');
if (/SECURE ACCESS GATEWAY|AUTHORIZATION REQUIRED|ZERO TRUST EDGE|SESSION UNVERIFIED|edge-auth-01/iu.test(component)) failures.push('/admin eski dekoratif metinleri içeriyor');
if (!component.includes('type="password"') || !component.includes('autocomplete="new-password"')) failures.push('/admin access key alanı güvenli autocomplete sözleşmesine uymuyor');
if (/\s(?:action|formaction)\s*=/iu.test(component) || /method=["']?post/iu.test(component)) failures.push('/admin form ağ hedefi veya POST içermemeli');
if (!client.includes("fetch('/api/visitor-ip'") || !client.includes("cache: 'no-store'") || !client.includes("credentials: 'omit'")) failures.push('/admin IP isteği birinci taraf no-store/omit sözleşmesine uymuyor');
if (!client.includes('event.preventDefault()') || !client.includes("operatorId.value = ''") || !client.includes("accessKey.value = ''")) failures.push('/admin submit engelleme veya credential temizleme eksik');
if (!client.includes("fetch('/api/admin-alert'") || !client.includes("method: 'POST'") || !client.includes('keepalive: true')) failures.push('/admin Discord uyarı çağrısı eksik');
if (!client.includes('alertRequest.status === 403') || !client.includes('alertRequest.status === 429') || !client.includes('submitButton.disabled = true')) failures.push('/admin rate-limit istemci kilidi eksik');
if (/fetch\('\/api\/admin-alert'[\s\S]{0,300}\bbody\s*:/u.test(client)) failures.push('/admin uyarı isteği form gövdesi içermemeli');
for (const [pattern, label] of [
  [/\b(?:localStorage|sessionStorage|indexedDB)\b/u, 'browser storage'],
  [/document\s*\.\s*cookie/u, 'cookie'],
  [/sendBeacon\s*\(/u, 'sendBeacon'],
  [/\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b/u, 'ek ağ API'],
  [/navigator\s*\.\s*(?:credentials|geolocation|mediaDevices|clipboard)\b/u, 'hassas browser API'],
]) if (pattern.test(client)) failures.push(`/admin istemcisinde ${label} bulundu`);

for (const term of ['honeypot', 'decoy', 'fake', 'dummy', 'easter egg', 'trap', 'prank', 'simulation', 'mock', 'demo']) {
  if (new RegExp(`\\b${term.replace(' ', '\\s+')}\\b`, 'iu').test(publicSource)) failures.push(`/admin public kaynaklarında kısıtlı ürün terimi bulundu (${term})`);
}
if (/https?:\/\//iu.test(publicSource)) failures.push('/admin public kaynakları harici origin içermemeli');
if (!/\.admin-body\s*\{[\s\S]*?font:\s*16px/u.test(css)) failures.push('/admin font tabanı 16px olmalı');
for (const match of css.matchAll(/font-size:\s*(\d*\.?\d+)(px|rem)\b/gu)) {
  const pixels = match[2] === 'rem' ? Number(match[1]) * 16 : Number(match[1]);
  if (pixels < 11) failures.push(`/admin CSS 11px altı metin içeriyor (${match[0]})`);
}

if (!endpoint.includes("request.headers.get('x-vercel-forwarded-for')") || !endpoint.includes("'Cache-Control': 'private, no-store, max-age=0, must-revalidate'")) failures.push('visitor-ip güvenilir Vercel header veya no-store içermiyor');
if (!endpoint.includes("request.method !== 'GET'") || !endpoint.includes('method_not_allowed')) failures.push('visitor-ip yalnızca GET sözleşmesi eksik');
if (!endpoint.includes('value.length <= 64') || !endpoint.includes("/^[0-9a-f:.]+$/iu")) failures.push('visitor-ip çıktı doğrulaması eksik');
if (/console\.|waitUntil|\bawait\s+fetch\b|\bglobalThis\.fetch\b|(?:localStorage|sessionStorage|indexedDB)/u.test(endpoint)) failures.push('visitor-ip loglama, depolama veya egress içermemeli');

if (!alertEndpoint.includes('process.env.ADMIN_ALERT_WEBHOOK_URL')) failures.push('admin-alert webhook secret environment üzerinden okunmuyor');
if (!alertEndpoint.includes("url.hostname === 'discord.com'") || !alertEndpoint.includes("url.protocol === 'https:'")) failures.push('admin-alert Discord webhook allowlist eksik');
if (!alertEndpoint.includes("fetchSite !== 'same-origin'") || !alertEndpoint.includes("request.method !== 'POST'")) failures.push('admin-alert method veya same-origin kontrolü eksik');
if (!alertEndpoint.includes('allowed_mentions: { parse: [] }')) failures.push('admin-alert mention engeli eksik');
if (!alertEndpoint.includes('No username or password was collected.')) failures.push('admin-alert veri minimizasyon bildirimi eksik');
if (/request\.(?:json|text|formData)\s*\(|\boperator\b|access-key/iu.test(alertEndpoint)) failures.push('admin-alert form gövdesi veya credential alanı okumamalı');
if (/console\.|waitUntil|(?:localStorage|sessionStorage|indexedDB)/u.test(alertEndpoint)) failures.push('admin-alert loglama veya depolama içermemeli');

const isAdminReference = (value) => {
  try { return /^\/admin(?:\/|$)/u.test(new URL(value.replaceAll('&amp;', '&'), 'https://audit.invalid').pathname); }
  catch { return /^\/?admin(?:\/|$)/u.test(value); }
};
const sitemap = await read('dist/sitemap-0.xml');
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)) if (isAdminReference(match[1])) failures.push('/admin sitemap içinde bulunmamalı');
const robots = await read('dist/robots.txt');
for (const line of robots.split(/\r?\n/gu)) if (/^(?:Allow|Disallow|Sitemap):/iu.test(line.trim()) && isAdminReference(line.split(':').slice(1).join(':').trim())) failures.push('/admin robots.txt içinde ilan edilmemeli');
for (const feedPath of ['dist/rss.xml', 'dist/en/rss.xml']) if (isAdminReference(await read(feedPath))) failures.push(`/admin ${feedPath} içinde bulunmamalı`);

const adminPath = path.join(dist, 'admin', 'index.html');
const htmlFiles = [];
async function walk(directory) {
  for (const name of await readdir(directory)) {
    const item = path.join(directory, name);
    const info = await stat(item);
    if (info.isDirectory()) await walk(item);
    else if (item.endsWith('.html') && item !== adminPath) htmlFiles.push(item);
  }
}
await walk(dist).catch(() => {});
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/<a\b[^>]+href="([^"]+)"/giu)) if (isAdminReference(match[1])) failures.push(`${path.relative(root, file)} public /admin bağlantısı içeriyor`);
}

const sw = await read('dist/sw.js');
if ([...sw.matchAll(/"url":"([^"]+)"/gu)].some((match) => isAdminReference(match[1]))) failures.push('/admin Service Worker precache içinde');
const swSource = await read('src/sw.ts');
for (const route of ['/admin', '/admin/', '/admin/index.html']) if (!swSource.includes(`'${route}'`)) failures.push(`${route} NetworkOnly allowlist içinde değil`);
if (!swSource.includes('api\\/(?:admin-alert|visitor-ip)')) failures.push('/api admin-alert ve visitor-ip Service Worker NetworkOnly listesinde değil');

let vercel;
try { vercel = JSON.parse(await read('vercel.json')); } catch { failures.push('vercel.json geçerli JSON değil'); }
for (const source of ['/admin', '/admin/(.*)']) {
  const rule = vercel?.headers?.find((item) => item.source === source);
  const headers = new Map((rule?.headers ?? []).map(({ key, value }) => [key.toLowerCase(), value.toLowerCase()]));
  if (headers.get('cache-control') !== 'private, no-store, max-age=0, must-revalidate') failures.push(`${source} Vercel no-store header eksik`);
}

if (failures.length) {
  console.error('Admin gateway audit failed');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Admin gateway audit passed: minimal login UI, first-party IP reflection, blocked-state handling, zero credential egress/storage, noindex and route exclusions verified.');
