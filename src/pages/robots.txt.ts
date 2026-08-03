import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';

export const GET: APIRoute = () => {
  const policy = siteConfig.indexable
    ? `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(`${policy}\nSitemap: ${new URL('/sitemap-index.xml', siteConfig.siteUrl)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
