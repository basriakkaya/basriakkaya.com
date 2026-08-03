import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, postSlug } from '../lib/posts';
import { siteConfig } from '../config/site';
import { getCategory } from '../config/categories';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${siteConfig.name} — Yazılar`, description: siteConfig.description, site: context.site ?? siteConfig.siteUrl,
    items: posts.map((post) => ({ title: post.data.title, description: post.data.description, pubDate: post.data.publishedAt, link: `/yazilar/${postSlug(post)}/`, categories: [getCategory(post.data.category).name, ...post.data.tags] })),
    customData: '<language>tr-TR</language>',
  });
}
