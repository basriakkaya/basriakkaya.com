// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const productionOrigin = 'https://www.basriakkaya.com';
const excludedSitemapPaths = new Set(['/404']);

export default defineConfig({
	site: productionOrigin,
	output: 'static',
	integrations: [
		sitemap({
			filter(page) {
				const url = new URL(page);
				const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '/';
				return url.origin === productionOrigin && !excludedSitemapPaths.has(pathname);
			},
		}),
	],
	vite: { plugins: [tailwindcss()] },
});
