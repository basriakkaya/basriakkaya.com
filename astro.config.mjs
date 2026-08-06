// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const productionOrigin = 'https://www.basriakkaya.com';
const excludedSitemapPaths = new Set(['/404']);
const pwaPlugins = VitePWA({
	strategies: 'injectManifest',
	srcDir: 'src',
	filename: 'sw.ts',
	injectRegister: null,
	manifest: false,
	registerType: 'prompt',
	injectManifest: {
		globPatterns: ['offline.html', '_astro/**/*.{js,css,woff,woff2}'],
		rollupFormat: 'iife',
		minify: true,
	},
});
const pwaApi = pwaPlugins.find((plugin) => plugin.name === 'vite-plugin-pwa')?.api;

const directPwaBuild = {
	name: 'direct-vite-pwa-build',
	hooks: {
		'astro:build:done': async () => {
			if (!pwaApi || pwaApi.disabled) throw new Error('vite-plugin-pwa build API kullanılamıyor.');
			await pwaApi.generateSW();
		},
	},
};

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
		directPwaBuild,
	],
	vite: {
		plugins: [
			tailwindcss(),
			...pwaPlugins,
		],
	},
});
