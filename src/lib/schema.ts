import { absoluteUrl, siteConfig } from '../config/site';
import type { Locale } from '../i18n/config';
import type { PublishedCve } from './security-research';
import { capecUrl, cweUrl } from './security-research';

export const personSchema = {
  '@type': 'Person',
  '@id': `${absoluteUrl('/')}#person`,
  name: siteConfig.name,
  alternateName: ['realkage'],
  jobTitle: 'Security Researcher',
  description: 'Computer Engineering student and cybersecurity researcher focused on web security, network security and responsible disclosure.',
  url: absoluteUrl('/'),
  image: absoluteUrl(siteConfig.defaultImage),
  affiliation: { '@type': 'CollegeOrUniversity', name: 'Goce Delčev University – Štip' },
  award: [
    'University of Oslo / UiO-CERT — 2026 Letter of Recognition for Security Vulnerability Disclosures',
    'NASA Vulnerability Disclosure Program — 2026 Bugcrowd Hall of Fame',
    'U.S. Department of Homeland Security Vulnerability Disclosure Program — 2026 Bugcrowd Hall of Fame',
    'University of Twente — 2026 Responsible Disclosure Hall of Fame',
    'Arçelik Türkiye — 2026 Vulnerability Disclosure Hall of Fame',
    'Goce Delcev University — Hall of Fame',
    'Rahim Usta Anatolian High School — Hall of Fame',
    'KomşuKomşu — 2026 Vulnerability Disclosure Hall of Fame',
  ],
  knowsAbout: ['Web application security', 'Application security', 'Authentication', 'Access control', 'Responsible disclosure', 'CVE research'],
  sameAs: [siteConfig.github, siteConfig.linkedin, siteConfig.youtube, siteConfig.tryHackMe, siteConfig.bugcrowd],
  subjectOf: [...siteConfig.cves.filter((cve) => cve.status === 'published').map((cve) => ({
    '@type': 'TechArticle', name: cve.id, url: cve.url, identifier: cve.id,
    description: cve.description,
  })), ...siteConfig.achievements.filter((item) => !item.title.includes('CTF')).map((item) => ({
    '@type': 'WebPage', name: item.titleEn, url: item.url, description: item.descriptionEn,
    ...('evidence' in item ? { associatedMedia: { '@type': 'ImageObject', contentUrl: absoluteUrl(item.evidence), caption: item.evidenceAltEn } } : {}),
  }))],
};

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
    })),
  };
}

export function cveResearchSchema(cve: PublishedCve, locale: Locale, path: string) {
  const isEnglish = locale === 'en';
  const pageUrl = absoluteUrl(path);
  return {
    '@type': 'TechArticle',
    '@id': `${pageUrl}#research`,
    headline: isEnglish ? cve.title : cve.titleTr,
    name: `${cve.id} — ${isEnglish ? cve.title : cve.titleTr}`,
    description: isEnglish ? cve.description : cve.descriptionTr,
    url: pageUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    inLanguage: isEnglish ? 'en-US' : 'tr-TR',
    datePublished: cve.published,
    dateModified: cve.published,
    author: { '@id': `${absoluteUrl('/')}#person` },
    contributor: { '@id': `${absoluteUrl('/')}#person` },
    publisher: { '@id': `${absoluteUrl('/')}#person` },
    identifier: { '@type': 'PropertyValue', propertyID: 'CVE', value: cve.id, url: cve.url },
    about: [
      { '@type': 'SoftwareApplication', name: cve.product, creator: { '@type': 'Organization', name: cve.vendor } },
      { '@type': 'DefinedTerm', name: `${cve.cwe} — ${cve.cweName}`, termCode: cve.cwe, url: cweUrl(cve.cwe) },
      { '@type': 'DefinedTerm', name: `${cve.capec} — ${cve.capecName}`, termCode: cve.capec, url: capecUrl(cve.capec) },
    ],
    citation: [
      { '@type': 'CreativeWork', name: `${cve.id} official CVE record`, url: cve.url },
      { '@type': 'CreativeWork', name: `${cve.id} TR-CERT advisory`, url: cve.advisoryUrl },
    ],
    isBasedOn: [cve.url, cve.advisoryUrl],
  };
}

export function schemaGraph(items: Array<Record<string, unknown>>) {
  return { '@context': 'https://schema.org', '@graph': items };
}
