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
];
const read = (relative) => readFile(path.join(root, relative), 'utf8').catch(() => '');
const sources = new Map(await Promise.all(sourcePaths.map(async (relative) => [relative, await read(relative)])));
for (const [relative, text] of sources) if (!text) failures.push(`${relative} eksik veya boş`);

const sourceText = [...sources.values()].join('\n');
const componentSource = sources.get('src/components/operations/OperationsConsole.astro') ?? '';
const routeCss = sources.get('src/styles/operations-console.css') ?? '';
const adminPath = path.join(dist, 'admin', 'index.html');
const adminHtml = await read('dist/admin/index.html');
if (!adminHtml) failures.push('dist/admin/index.html eksik');

const resourcePaths = { scripts: new Set(), styles: new Set() };
const attrPattern = /\s([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gu;
for (const tagMatch of adminHtml.matchAll(/<([a-z][\w:-]*)\b[^>]*>/giu)) {
  const tag = tagMatch[1].toLowerCase();
  const attributes = new Map([...tagMatch[0].matchAll(attrPattern)].map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
  for (const name of ['srcset', 'imagesrcset', 'poster', 'data', 'action', 'formaction']) {
    if (attributes.has(name)) failures.push(`/admin ${tag} üzerinde ağ isteği üretebilen ${name} niteliği içeriyor`);
  }
  for (const name of ['src', 'href']) {
    const value = attributes.get(name);
    if (!value) continue;
    const isSkipLink = tag === 'a' && name === 'href' && value === '#ops-main';
    const isFavicon = tag === 'link' && name === 'href' && value === '/favicon.svg' && attributes.get('rel')?.toLowerCase() === 'icon';
    const isStyle = tag === 'link' && name === 'href' && /^\/_astro\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.css$/u.test(value) && attributes.get('rel')?.toLowerCase() === 'stylesheet';
    const isScript = tag === 'script' && name === 'src' && /^\/_astro\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.js$/u.test(value);
    if (!(isSkipLink || isFavicon || isStyle || isScript)) failures.push(`/admin izin verilmeyen ${tag} ${name} kaynağı içeriyor (${value})`);
    if (isStyle) resourcePaths.styles.add(value);
    if (isScript) resourcePaths.scripts.add(value);
  }
}
if (/<base(?:\s|>)|<meta[^>]+http-equiv=["']?refresh|\son[a-z]+\s*=|<iframe(?:\s|>)|<object(?:\s|>)|<embed(?:\s|>)/iu.test(adminHtml)) failures.push('/admin dinamik yönlendirme, inline handler veya gömülü belge içermemeli');

async function readBuiltResources(paths, label) {
  const contents = [];
  for (const resourcePath of paths) {
    const content = await read(`dist${resourcePath}`);
    if (!content) failures.push(`${label} kaynağı eksik (${resourcePath})`);
    contents.push(content);
  }
  return contents;
}

const linkedScripts = await readBuiltResources(resourcePaths.scripts, 'JavaScript');
const linkedStyles = await readBuiltResources(resourcePaths.styles, 'CSS');
const inlineScripts = [...adminHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)]
  .filter((match) => !/\ssrc\s*=/iu.test(match[0]))
  .map((match) => match[1]);
const inlineStyles = [...adminHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu)].map((match) => match[1]);
const executableText = `${sourceText}\n${inlineScripts.join('\n')}\n${linkedScripts.join('\n')}`;
const runtimeText = `${adminHtml}\n${linkedScripts.join('\n')}\n${linkedStyles.join('\n')}`;
const cssText = `${routeCss}\n${inlineStyles.join('\n')}\n${linkedStyles.join('\n')}`;
const executableCssText = cssText.replace(/\/\*[\s\S]*?\*\//gu, '');

const prohibitedBehavior = [
  [/\bfetch\s*\(/u, 'fetch'], [/\bXMLHttpRequest\b/u, 'XMLHttpRequest'], [/\bWebSocket\b/u, 'WebSocket'],
  [/\bEventSource\b/u, 'EventSource'], [/\bsendBeacon\s*\(/u, 'sendBeacon'], [/\bimport\s*\(/u, 'dynamic import'],
  [/navigator\s*\.\s*serviceWorker/u, 'Service Worker'], [/\b(?:localStorage|sessionStorage|indexedDB)\b/u, 'browser storage'],
  [/\bcaches\s*(?:\.|\[|\()/u, 'Cache API'], [/document\s*\.\s*cookie/u, 'cookie'], [/navigator\s*\.\s*clipboard/u, 'clipboard'],
  [/navigator\s*\.\s*(?:credentials|usb|bluetooth|permissions|geolocation|mediaDevices)\b/u, 'credential/device API'],
  [/\bPublicKeyCredential\b|\bCredentialManagement\b/u, 'credential API'], [/\b(?:AudioContext|OfflineAudioContext|OffscreenCanvas)\b|\.getContext\s*\(/u, 'fingerprinting surface'],
  [/navigator\s*\.\s*(?:userAgent|userAgentData|deviceMemory|hardwareConcurrency)\b|\bscreen\s*\.\s*(?:width|height|availWidth|availHeight|colorDepth|pixelDepth)\b/u, 'fingerprinting data'],
  [/(?:\bhistory|window\s*\.\s*history)\s*\.\s*(?:pushState|replaceState|go|back|forward)\s*\(/u, 'History API'],
  [/(?:\blocation|window\s*\.\s*location)\s*\.\s*(?:search|hash|assign|replace|reload)\b/u, 'URL/navigation API'],
  [/\bnew\s+Image\b|\bdocument\s*\.\s*createElement\s*\(\s*["'](?:script|img|iframe|link|source)["']/u, 'dynamic resource element'],
  [/\.setAttribute\s*\(\s*["'](?:src|href|srcset|poster|action)["']|\.(?:src|href|srcset|poster|action)\s*=/u, 'dynamic resource assignment'],
  [/\bwindow\s*\.\s*open\s*\(|\bdocument\s*\.\s*write\s*\(/u, 'dynamic navigation/content'],
  [/\beval\s*\(|\bnew\s+Function\b/u, 'dynamic code'], [/\b(?:prompt|showOpenFilePicker|showSaveFilePicker)\s*\(/u, 'interactive data collection'],
];
for (const [pattern, label] of prohibitedBehavior) if (pattern.test(executableText)) failures.push(`/admin davranışında ${label} bulundu`);

for (const [pattern, label] of [
  [/<form(?:\s|>)/iu, 'form'], [/<input(?:\s|>)/iu, 'input'], [/<textarea(?:\s|>)/iu, 'textarea'], [/<select(?:\s|>)/iu, 'select'],
  [/contenteditable/iu, 'contenteditable'], [/type=["']?password/iu, 'password alanı'], [/type=["']?hidden/iu, 'hidden alan'], [/\sautocomplete\s*=/iu, 'autocomplete alanı'],
]) if (pattern.test(sourceText) || pattern.test(adminHtml)) failures.push(`/admin ${label} içermemeli`);

if (/@import\b|url\s*\(/iu.test(executableCssText) || /style=["'][^"']*(?:url\s*\(|@import)/iu.test(adminHtml)) failures.push('/admin CSS ağ kaynağı veya import içermemeli');
if (/(?:https?:)?\/\/|data\s*:\s*text\/html/iu.test(executableCssText)) failures.push('/admin CSS harici origin veya belge payloadı içermemeli');
if (/vercel\/analytics|speed-insights|_vercel\/(?:insights|speed-insights)|va\.vercel-scripts/iu.test(runtimeText)) failures.push('/admin telemetry içermemeli');
if (/site\.webmanifest|virtual:pwa-register|pwa-client/iu.test(runtimeText)) failures.push('/admin manifest veya PWA client içermemeli');

const normalizedPublicSource = `${sourceText}\n${runtimeText}`
  .replace(/([a-z\d])([A-Z])/gu, '$1 $2')
  .replace(/[_-]+/gu, ' ')
  .toLowerCase();
for (const term of ['honeypot', 'decoy', 'fake', 'dummy', 'easter egg', 'trap', 'prank', 'simulation', 'mock', 'demo']) {
  if (new RegExp(`\\b${term.replace(' ', '\\s+')}\\b`, 'u').test(normalizedPublicSource)) failures.push(`/admin public kaynaklarında kısıtlı ürün terimi bulundu (${term})`);
}

if (/<link\b[^>]+rel=["'](?:canonical|alternate|sitemap)["']|application\/ld\+json|<meta\b[^>]+(?:property=["']og:|name=["']twitter:|name=["']description["'])/iu.test(adminHtml)) failures.push('/admin public SEO metadata içermemeli');
if ((adminHtml.match(/<title>/gu) ?? []).length !== 1 || !adminHtml.includes('<title>Restricted Operations Console</title>')) failures.push('/admin title yanlış veya duplicate');
const robotsTags = adminHtml.match(/<meta\b[^>]+name="robots"[^>]*>/gu) ?? [];
if (robotsTags.length !== 1 || !robotsTags[0].includes('content="noindex, nofollow, noarchive, nosnippet, noimageindex"')) failures.push('/admin robots meta yanlış veya duplicate');
if ((adminHtml.match(/<h1(?:\s|>)/gu) ?? []).length !== 1) failures.push('/admin tek H1 içermeli');
if (!adminHtml.includes('<html lang="en"')) failures.push('/admin html lang en değil');

const viewTag = (name) => adminHtml.match(new RegExp(`<section[^>]+data-ops-view="${name}"[^>]*>`, 'u'))?.[0] ?? '';
if (!viewTag('overview') || /\shidden(?:\s|=|>)/u.test(viewTag('overview'))) failures.push('/admin JavaScript kapalıyken Overview görünür değil');
for (const name of ['access', 'systems']) if (!viewTag(name) || !/\shidden(?:\s|=|>)/u.test(viewTag(name))) failures.push(`/admin ${name} başlangıçta güvenle saklanmıyor`);
for (const [name, pressed] of [['overview', 'true'], ['access', 'false'], ['systems', 'false']]) {
  const button = adminHtml.match(new RegExp(`<button[^>]+data-ops-target="${name}"[^>]*>`, 'u'))?.[0] ?? '';
  if (!button || !button.includes('type="button"') || !button.includes(`aria-pressed="${pressed}"`) || !button.includes(`aria-controls="ops-${name}"`)) failures.push(`/admin ${name} bölüm button sözleşmesi yanlış`);
}
if (!adminHtml.includes('aria-label="Operations console sections"') || /tabindex="[1-9]/u.test(adminHtml)) failures.push('/admin erişilebilir navigation veya tab order sözleşmesi yanlış');
if ((adminHtml.match(/<table(?:\s|>)/gu) ?? []).length !== 2 || (adminHtml.match(/<th scope="col">/gu) ?? []).length !== 8 || (adminHtml.match(/<th scope="row">/gu) ?? []).length !== 9) failures.push('/admin access ve systems matrixleri semantik table olmalı');

if (!/\.ops-body\s*\{[\s\S]*?font-size:\s*16px/u.test(routeCss)) failures.push('/admin route font tabanı 16px olmalı');
for (const match of routeCss.matchAll(/font-size:\s*(\d*\.?\d+)(px|rem)\b/gu)) {
  const pixels = match[2] === 'rem' ? Number(match[1]) * 16 : Number(match[1]);
  if (pixels < 11) failures.push(`/admin CSS 11px altı metin içeriyor (${match[0]})`);
}

const expectedDataValues = [
  'ACTIVE NODES', '07', 'ALL RESPONDING', 'ok', 'FAILED AUTH', '143', '+19 LAST HOUR', 'deny', 'UPTIME', '99.97%', '43D 08H 11M', 'info', 'DATA EGRESS', '0 B', 'UPLINK DISABLED', 'ok',
  '04:13:05', 'OK', 'policy checksum verified: sha256:9f2a…c871', '04:12:48', 'DENY', '/internal/vault · principal: unknown', '04:12:41', 'WARN', 'rate threshold exceeded · edge-03',
  '04:12:19', 'OK', 'canary token rotation complete', '04:11:57', 'DENY', 'privilege escalation blocked', '04:11:22', 'OK', 'snapshot integrity: clean',
  '04:10:58', 'WARN', 'unknown client signature discarded', '04:10:31', 'DENY', 'operator session expired',
  'AUTH-GATE', 'policy enforcement', '10.7.0.4', 'VAULT-01', 'sealed storage', '10.7.0.8', 'EDGE-03', 'rate anomaly', '10.7.1.3', 'TRACE-SINK', 'volatile memory', '10.7.2.9',
  'root', 'vault/*', 'SEALED', '04:00 UTC', 'operator', 'audit/read', 'ACTIVE', '03:30 UTC', 'service.edge', 'network/read', 'ACTIVE', '02:45 UTC', 'unknown', 'internal/*', 'DENIED', '—',
  'NODE-7F', 'CONTROL PLANE', 'HEALTHY', '12 ms', 'AUTH-GATE', 'POLICY ENGINE', 'HEALTHY', '18 ms', 'VAULT-01', 'SEALED STORAGE', 'HEALTHY', '21 ms',
  'EDGE-03', 'EDGE FILTER', 'DEGRADED', '47 ms', 'TRACE-SINK', 'VOLATILE AUDIT', 'HEALTHY', '24 ms',
];
const frontmatter = componentSource.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1] ?? '';
const actualDataValues = [...frontmatter.matchAll(/'([^']*)'/gu)].map((match) => match[1]);
const multiset = (values) => values.reduce((counts, value) => counts.set(value, (counts.get(value) ?? 0) + 1), new Map());
const expectedCounts = multiset(expectedDataValues);
const actualCounts = multiset(actualDataValues);
for (const value of new Set([...expectedCounts.keys(), ...actualCounts.keys()])) if (expectedCounts.get(value) !== actualCounts.get(value)) failures.push(`/admin sabit veri allowlist sapması (${value})`);

const allowedIpv4 = ['10.7.0.4', '10.7.0.8', '10.7.1.3', '10.7.2.9'];
const ipv4Values = [...adminHtml.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/gu)].map((match) => match[0]);
if ([...new Set(ipv4Values)].sort().join('|') !== [...allowedIpv4].sort().join('|')) failures.push('/admin IPv4 değerleri sabit RFC 1918 allowlist ile eşleşmiyor');
for (const value of ipv4Values) {
  const octets = value.split('.').map(Number);
  const privateAddress = octets.every((part) => part >= 0 && part <= 255)
    && (octets[0] === 10 || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168));
  if (!privateAddress) failures.push(`/admin RFC 1918 dışı IPv4 içeriyor (${value})`);
}

const visibleText = adminHtml.replace(/<script\b[\s\S]*?<\/script>/giu, ' ').replace(/<style\b[\s\S]*?<\/style>/giu, ' ').replace(/<[^>]+>/gu, ' ');
const allowedSystemIds = new Set(['NODE-7F', 'AUTH-GATE', 'VAULT-01', 'EDGE-03', 'TRACE-SINK', 'AIR-GAPPED']);
for (const value of visibleText.match(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/gu) ?? []) if (!allowedSystemIds.has(value)) failures.push(`/admin allowlist dışı system kimliği içeriyor (${value})`);
for (const value of visibleText.match(/\b[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+\b/giu) ?? []) if (value !== 'service.edge') failures.push(`/admin allowlist dışı hostname/principal içeriyor (${value})`);
for (const value of visibleText.match(/\b[\w.]+@[\w.-]+\b/gu) ?? []) if (value !== 'root@blacksite') failures.push(`/admin allowlist dışı operator kimliği içeriyor (${value})`);
const rowHeaders = [...adminHtml.matchAll(/<th scope="row">([^<]+)<\/th>/gu)].map((match) => match[1]);
const allowedRowHeaders = new Set(['root', 'operator', 'service.edge', 'unknown', 'NODE-7F', 'AUTH-GATE', 'VAULT-01', 'EDGE-03', 'TRACE-SINK']);
for (const value of rowHeaders) if (!allowedRowHeaders.has(value)) failures.push(`/admin table allowlist dışı principal/node içeriyor (${value})`);
if (/basriakkaya\.com|real0kage|localhost|CVE-\d|package\.json|node_modules|BEGIN (?:RSA|OPENSSH)|(?:API[_ -]?KEY|PASSWORD|SECRET|TOKEN)\s*[=:]/iu.test(adminHtml)) failures.push('/admin gerçek site, proje veya credential verisi içeriyor');
const requiredValues = [
  'BLACKSITE // CONTROL', '[RESTRICTED]', 'root@blacksite', 'dc33-r7', 'AIR-GAPPED', 'UPLINK DISABLED',
  '$ system_overview --live', 'THREAT LEVEL:', '$ access_matrix --verify', 'LOCKDOWN', 'ACCESS POLICY SEALED',
  '$ node_health --all', '7 / 7 NODES RESPONDING', 'RUN INTEGRITY CHECK', 'RUN NODE CHECK',
];
for (const value of requiredValues) if (!adminHtml.includes(value)) failures.push(`/admin zorunlu sabit değer eksik (${value})`);

const isAdminReference = (value) => {
  try { return /^\/admin(?:\/|$)/u.test(new URL(value.replaceAll('&amp;', '&'), 'https://audit.invalid').pathname); }
  catch { return /^\/?admin(?:\/|$)/u.test(value); }
};
const sitemap = await read('dist/sitemap-0.xml');
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)) if (isAdminReference(match[1])) failures.push('/admin sitemap içinde bulunmamalı');
const robots = await read('dist/robots.txt');
for (const line of robots.split(/\r?\n/gu)) if (/^(?:Allow|Disallow|Sitemap):/iu.test(line.trim()) && isAdminReference(line.split(':').slice(1).join(':').trim())) failures.push('/admin robots.txt içinde ilan edilmemeli');
for (const feedPath of ['dist/rss.xml', 'dist/en/rss.xml']) {
  const feed = await read(feedPath);
  const routeValues = [
    ...[...feed.matchAll(/<(?:link|guid)\b[^>]*>([^<]+)<\/(?:link|guid)>/giu)].map((match) => match[1]),
    ...[...feed.matchAll(/\bhref="([^"]+)"/gu)].map((match) => match[1]),
  ];
  if (routeValues.some(isAdminReference)) failures.push(`/admin ${feedPath} içinde route olarak bulunmamalı`);
}

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
const precacheUrls = [...sw.matchAll(/"url":"([^"]+)"/gu)].map((match) => match[1]);
if (precacheUrls.some(isAdminReference)) failures.push('/admin Service Worker precache içinde');
const swSource = await read('src/sw.ts');
for (const route of ['/admin', '/admin/', '/admin/index.html']) if (!swSource.includes(`'${route}'`)) failures.push(`${route} NetworkOnly system path allowlist içinde değil`);
if (!/registerRoute\([\s\S]{0,500}isSystemPath\(url\.pathname\)[\s\S]{0,250}new NetworkOnly\(\)/u.test(swSource)) failures.push('/admin Service Worker NetworkOnly matcher içinde değil');
if ((swSource.match(/isSystemPath\(url\.pathname\)/gu) ?? []).length !== 2 || !/request\.mode === 'navigate'[\s\S]{0,300}!isSystemPath\(url\.pathname\)/u.test(swSource)) failures.push('/admin navigation runtime cache exclusion eksik');

let vercel;
try { vercel = JSON.parse(await read('vercel.json')); } catch { failures.push('vercel.json geçerli JSON değil'); }
for (const source of ['/admin', '/admin/(.*)']) {
  const adminRule = vercel?.headers?.find((rule) => rule.source === source);
  const adminHeaders = new Map((adminRule?.headers ?? []).map(({ key, value }) => [key.toLowerCase(), value.toLowerCase()]));
  if (adminHeaders.get('cache-control') !== 'private, no-store, max-age=0, must-revalidate') failures.push(`${source} için Vercel no-store header eksik`);
}

if (failures.length) {
  console.error('Operations console audit failed');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Operations console audit passed: ${sourcePaths.length} source, ${resourcePaths.scripts.size} client bundle, ${resourcePaths.styles.size} stylesheet, ${allowedIpv4.length} private IPv4, zero-egress/storage ve route exclusion doğrulandı.`);
