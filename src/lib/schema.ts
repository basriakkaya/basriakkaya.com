import { absoluteUrl, siteConfig } from '../config/site';

export const personSchema = {
  '@type': 'Person',
  '@id': `${absoluteUrl('/')}#person`,
  name: siteConfig.name,
  jobTitle: 'Security Researcher',
  description: 'Computer Engineering student and cybersecurity researcher focused on web security, network security and responsible disclosure.',
  url: absoluteUrl('/'),
  image: absoluteUrl(siteConfig.defaultImage),
  affiliation: { '@type': 'CollegeOrUniversity', name: 'Goce Delčev University – Štip' },
  award: [
    'NASA Vulnerability Disclosure Program — 2026 Bugcrowd Hall of Fame',
    'University of Twente — 2026 Responsible Disclosure Hall of Fame',
    'Arçelik Türkiye — 2026 Vulnerability Disclosure Hall of Fame',
    'Goce Delcev University — Hall of Fame',
    'Rahim Usta Anatolian High School — Hall of Fame',
  ],
  sameAs: [siteConfig.github, siteConfig.linkedin, siteConfig.youtube, siteConfig.tryHackMe],
  subjectOf: siteConfig.cves.map((cve) => ({
    '@type': 'CreativeWork', name: cve.id, url: cve.url,
    description: 'description' in cve ? cve.description : 'Public CVE record credited to Basri Akkaya.',
  })),
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
