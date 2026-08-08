import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { categories } from '../src/config/categories.ts';
import { seriesRegistry } from '../src/config/series.ts';

const root = process.cwd();
const blogDir = path.join(root, 'src/content/blog');
const files = (await readdir(blogDir)).filter((name) => /\.mdx?$/.test(name));
const errors = [];
const warnings = [];
const posts = [];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

for (const file of files) {
  const text = await readFile(path.join(blogDir, file), 'utf8');
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) { errors.push(`${file}: frontmatter okunamadı`); continue; }
  const data = parse(match[1]);
  const body = match[2];
  const prose = body.replace(/```[\s\S]*?```/g, '');
  const slug = file.replace(/\.mdx?$/, '');
  posts.push({ file, slug, data, body });
  const lang = data.lang ?? 'tr';
  if (!['tr', 'en'].includes(lang)) errors.push(`${file}: desteklenmeyen lang '${lang}'`);
  if (data.translationKey && !slugPattern.test(data.translationKey)) errors.push(`${file}: translationKey lowercase ASCII ve tireli olmalı`);
  if (!data.draft && !data.category) errors.push(`${file}: yayınlanmış yazıda category zorunlu`);
  if (data.category && !categories[data.category]) errors.push(`${file}: geçersiz category '${data.category}'`);
  if (data.category && !slugPattern.test(data.category)) errors.push(`${file}: category slug lowercase ASCII ve tireli olmalı`);
  if (!String(data.description ?? '').trim()) errors.push(`${file}: description boş olamaz`);
  if (!Array.isArray(data.tags)) errors.push(`${file}: tags array olmalı`);
  else {
    const normalized = data.tags.map((tag) => String(tag).trim().toLocaleLowerCase('tr-TR'));
    if (normalized.some((tag) => !tag)) errors.push(`${file}: boş tag kullanılamaz`);
    if (new Set(normalized).size !== normalized.length) errors.push(`${file}: duplicate tag var`);
    if (normalized.length > 8) errors.push(`${file}: en fazla 8 tag kullanılabilir`);
  }
  if (data.series && !data.seriesOrder) errors.push(`${file}: series varsa seriesOrder zorunlu`);
  if (data.seriesOrder && !data.series) errors.push(`${file}: seriesOrder varsa series zorunlu`);
  if (data.series && !seriesRegistry[data.series]) errors.push(`${file}: seri metadata kaydı bulunamadı`);
  if (data.seriesOrder && (!Number.isInteger(data.seriesOrder) || data.seriesOrder < 1)) errors.push(`${file}: seriesOrder pozitif tam sayı olmalı`);
  if (/^#\s+/m.test(prose)) errors.push(`${file}: Markdown gövdesinde H1 kullanılamaz`);
  if (/^###\s+/m.test(prose) && !/^##\s+/m.test(prose)) warnings.push(`${file}: H3 öncesinde H2 bulunmuyor`);
  if (String(data.title ?? '').length < 12 || String(data.title ?? '').length > 75) warnings.push(`${file}: title SEO uzunluğu kontrol edilmeli`);
  if (String(data.description ?? '').length < 70 || String(data.description ?? '').length > 180) warnings.push(`${file}: description SEO uzunluğu kontrol edilmeli`);
  if (!slugPattern.test(slug)) errors.push(`${file}: yazı slug biçimi geçersiz`);
}

for (const post of posts) {
  if (posts.some((other) => other.file !== post.file && other.data.description === post.data.description)) errors.push(`${post.file}: description başka yazıyla aynı`);
  if (post.data.series && posts.some((other) => other.file !== post.file && !other.data.draft && other.data.series === post.data.series && other.data.seriesOrder === post.data.seriesOrder)) errors.push(`${post.file}: aynı seride duplicate seriesOrder`);
}
for (const post of posts) {
  if (!post.data.translationKey) continue;
  const lang = post.data.lang ?? 'tr';
  if (posts.some((other) => other.file !== post.file && !other.data.draft && (other.data.lang ?? 'tr') === lang && other.data.translationKey === post.data.translationKey)) errors.push(`${post.file}: aynı locale içinde duplicate translationKey`);
}
const categorySlugs = Object.keys(categories);
const seriesSlugs = Object.keys(seriesRegistry);
for (const slug of categorySlugs) if (seriesSlugs.includes(slug)) errors.push(`Kategori/seri route slug çakışması: ${slug}`);

warnings.forEach((warning) => console.warn(`UYARI: ${warning}`));
if (errors.length) { errors.forEach((error) => console.error(`HATA: ${error}`)); process.exit(1); }
console.log(`Content audit başarılı: ${posts.length} yazı, ${categorySlugs.length} kategori ve ${seriesSlugs.length} seri doğrulandı; ${warnings.length} uyarı.`);
