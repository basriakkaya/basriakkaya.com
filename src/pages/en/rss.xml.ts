import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, postSlug } from '../../lib/posts';
import { siteConfig } from '../../config/site';
import { getLocalizedCategory } from '../../config/categories';
export async function GET(context: APIContext) {
  const posts = await getPublishedPosts('en');
  return rss({ title: `${siteConfig.name} — Articles`, description: 'English articles on cybersecurity, networking, Linux, and responsible disclosure.', site: new URL('/en/', context.site ?? siteConfig.siteUrl), items: posts.map((post) => ({ title: post.data.title, description: post.data.description, pubDate: post.data.publishedAt, link: `/en/articles/${postSlug(post)}/`, categories: [getLocalizedCategory(post.data.category, 'en').name, ...post.data.tags] })), customData: '<language>en-US</language>' });
}
