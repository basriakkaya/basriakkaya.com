import { siteConfig } from '../config/site';

export type CveRecord = (typeof siteConfig.cves)[number];
export type PublishedCve = Extract<CveRecord, { status: 'published' }>;

export const publishedCves = siteConfig.cves.filter(
  (cve): cve is PublishedCve => cve.status === 'published',
);

export const pendingCves = siteConfig.cves.filter((cve) => cve.status === 'publication-pending');

export const cweUrl = (cwe: string) => `https://cwe.mitre.org/data/definitions/${cwe.replace('CWE-', '')}.html`;
export const capecUrl = (capec: string) => `https://capec.mitre.org/data/definitions/${capec.replace('CAPEC-', '')}.html`;
