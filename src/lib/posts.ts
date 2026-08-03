import { getCollection, type CollectionEntry } from 'astro:content';
import { getCategory } from '../config/categories';
import { getSeries } from '../config/series';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts
    .filter(({ data }) => import.meta.env.DEV || !data.draft)
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export function postSlug(post: BlogPost): string {
  return post.id.replace(/\.(md|mdx)$/u, '');
}

export const getPostsByCategory = async (category: string) => (await getPublishedPosts()).filter((post) => post.data.category === category);
export const getPostsBySeries = async (series: string) => (await getPublishedPosts()).filter((post) => post.data.series === series).sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
export const categoryForPost = (post: BlogPost) => getCategory(post.data.category);
export const seriesForPost = (post: BlogPost) => getSeries(post.data.series);

export async function getSeriesContext(post: BlogPost) {
  if (!post.data.series) return undefined;
  const posts = await getPostsBySeries(post.data.series);
  const index = posts.findIndex((candidate) => candidate.id === post.id);
  if (index < 0) return undefined;
  return { metadata: getSeries(post.data.series), posts, index, previous: posts[index - 1], next: posts[index + 1] };
}

export async function getRelatedPosts(post: BlogPost, excluded: BlogPost[] = []) {
  const excludedIds = new Set([post.id, ...excluded.map(({ id }) => id)]);
  const tags = new Set(post.data.tags.map((tag) => tag.toLocaleLowerCase('tr-TR')));
  return (await getPublishedPosts())
    .filter(({ id }) => !excludedIds.has(id))
    .map((candidate) => ({ candidate, score: (candidate.data.category === post.data.category ? 10 : 0) + candidate.data.tags.filter((tag) => tags.has(tag.toLocaleLowerCase('tr-TR'))).length * 2 }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.data.publishedAt.valueOf() - a.candidate.data.publishedAt.valueOf())
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}
