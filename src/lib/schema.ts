import { absoluteUrl, siteConfig } from '../config/site';

export const personSchema = {
  '@type': 'Person',
  '@id': `${absoluteUrl('/')}#person`,
  name: siteConfig.name,
  jobTitle: siteConfig.role,
  email: `mailto:${siteConfig.email}`,
  url: absoluteUrl('/'),
  image: absoluteUrl(siteConfig.defaultImage),
  sameAs: [siteConfig.linkedin, siteConfig.youtube],
};

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
    })),
  };
}

export function schemaGraph(items: Array<Record<string, unknown>>) {
  return { '@context': 'https://schema.org', '@graph': items };
}
