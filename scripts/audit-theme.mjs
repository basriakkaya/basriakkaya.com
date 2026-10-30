import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
async function files(root) {
  const out = [];
  for (const e of await readdir(root, { withFileTypes: true })) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) out.push(...(await files(p)));
    else out.push(p);
  }
  return out;
}
const errors = [];
let pages = 0;
for (const file of (await files('dist')).filter(
  (x) => x.endsWith('.html') && !x.includes(`${path.sep}admin${path.sep}`),
)) {
  const s = await readFile(file, 'utf8');
  pages++;
  if (/Bu yazı sende ne bıraktı|basri:post-reaction|real0kage@protonmail/.test(s))
    errors.push(`${file}: retired content`);
  for (const m of s.matchAll(/href=["']mailto:([^?"'<>\s]+)/g))
    if (m[1] !== 'basriakkaya@pm.me') errors.push(`${file}: unexpected contact ${m[1]}`);
  for (const m of s.matchAll(/#[a-fA-F0-9]{6}\b/g)) {
    const c = m[0],
      r = parseInt(c.slice(1, 3), 16),
      g = parseInt(c.slice(3, 5), 16),
      b = parseInt(c.slice(5, 7), 16);
    if (b > r + 15 || g > r + 15) errors.push(`${file}: legacy inline palette ${c}`);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Theme audit passed: ${pages} public pages, approved contact, no reaction widget, no legacy inline cool palette.`,
);
