import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
const logo=(await readFile(new URL('../public/images/editorial/basrick.png',import.meta.url))).toString('base64');
for(const kind of ['main','links']) {
 const link=kind==='links';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <defs><pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#f8cc48" stroke-opacity=".065"/></pattern><radialGradient id="glow"><stop stop-color="#f8cc48" stop-opacity=".13"/><stop offset="1" stop-color="#f8cc48" stop-opacity="0"/></radialGradient><clipPath id="disc"><circle cx="946" cy="301" r="175"/></clipPath></defs>
 <rect width="1200" height="630" fill="#090b0b"/><rect width="1200" height="630" fill="url(#grid)"/><ellipse cx="950" cy="300" rx="420" ry="360" fill="url(#glow)"/>
 <path d="M32 92V32H92M1108 32H1168V92M32 538V598H92M1108 598H1168V538" stroke="#f8cc48" stroke-width="2" fill="none"/>
 <path d="M64 115H697L727 145H1136M64 517H697L727 487H1136" stroke="#81713e" stroke-opacity=".6" fill="none"/>
 <text x="66" y="85" font-family="Consolas,monospace" font-size="17" letter-spacing="3" fill="#f8cc48">${link?'LINKS / BASRI AKKAYA':'SECURITY RESEARCH / BASRI AKKAYA'}</text>
 <text x="62" y="250" font-family="Georgia,serif" font-weight="bold" font-size="80" fill="#f3efe0">Basri <tspan fill="#f8cc48">Akkaya.</tspan></text>
 <text x="66" y="319" font-family="Georgia,serif" font-size="30" fill="#f3efe0">${link?'Bütün bağlantılarım. Tek adres.':'Merak et. Araştır. Güvende kal.'}</text>
 <text x="66" y="376" font-family="Consolas,monospace" font-size="18" fill="#bab9ae">${link?'VİDEOLAR / PROJELER / İLETİŞİM':'SİBER GÜVENLİK / BUG BOUNTY / CVE'}</text>
 <rect x="66" y="417" width="245" height="37" fill="#f8cc48"/><text x="80" y="442" font-family="Consolas,monospace" font-weight="bold" font-size="16" fill="#090b0b">${link?'KEŞFET. BAĞLANTI KUR.':'ARAŞTIRMA · VİDEO · BLOG'}</text>
 <circle cx="946" cy="301" r="196" fill="none" stroke="#f8cc48" stroke-opacity=".28"/><circle cx="946" cy="301" r="205" fill="none" stroke="#f8cc48" stroke-dasharray="130 185 40 290" stroke-width="2"/>
 <image href="data:image/png;base64,${logo}" x="771" y="126" width="350" height="350" clip-path="url(#disc)"/>
 <path d="M724 301H750M1142 301H1168M946 78V99M946 503V524" stroke="#f8cc48" stroke-width="2"/>
 <circle cx="734" cy="165" r="4" fill="#f8cc48"/><path d="M730 165H700L675 140H620M1120 444H1139L1160 465" stroke="#f8cc48" stroke-opacity=".5" fill="none"/>
 <text x="66" y="565" font-family="Consolas,monospace" font-size="22" fill="#f8cc48">${link?'links.basriakkaya.com':'basriakkaya.com'}</text>
 <text x="1136" y="565" text-anchor="end" font-family="Consolas,monospace" font-size="15" fill="#aaa99e">ETHICAL HACKING</text></svg>`;
 const path=new URL(`../public/images/editorial/share-${kind}-20261030.jpg`,import.meta.url);
 await sharp(Buffer.from(svg)).jpeg({quality:93,mozjpeg:true}).toFile(fileURLToPath(path));
 await writeFile(new URL(`../public/images/editorial/share-${kind}-20261030.svg`,import.meta.url),svg);
 console.log(`${kind}: 1200x630 social card`);
}
