// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const fallbackSite = 'https://example.com';
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

export default defineConfig({
	site: env.SITE_URL || fallbackSite,
	output: 'static',
	integrations: [sitemap()],
	vite: { plugins: [tailwindcss()] },
});
