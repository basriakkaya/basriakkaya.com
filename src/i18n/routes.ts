import type { Locale } from './config';

const routeSegments = {
  tr: { home: '', articles: 'yazilar', category: 'kategori', series: 'seri', about: 'ben-kimim', rss: 'rss.xml' },
  en: { home: 'en', articles: 'articles', category: 'category', series: 'series', about: 'about', rss: 'rss.xml' },
} as const;

export type RouteName = 'home' | 'articles' | 'about' | 'rss';

export function route(locale: Locale, name: RouteName): string {
  const segment = routeSegments[locale][name];
  if (name === 'rss' && locale === 'en') return '/en/rss.xml';
  if (locale === 'en') return name === 'home' ? '/en' : `/en/${segment}`;
  return segment ? `/${segment}` : '/';
}

export const articleRoute = (locale: Locale, slug: string) => `${route(locale, 'articles')}/${slug}`;
export const categoryRoute = (locale: Locale, slug: string) => `${route(locale, 'articles')}/${routeSegments[locale].category}/${slug}`;
export const seriesRoute = (locale: Locale, slug: string) => `${route(locale, 'articles')}/${routeSegments[locale].series}/${slug}`;
