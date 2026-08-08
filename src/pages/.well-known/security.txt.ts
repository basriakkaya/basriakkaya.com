import { siteConfig } from '../../config/site';

export const prerender = true;

export const SECURITY_TXT_EXPIRES = '2027-06-30T00:00:00Z';

export function GET() {
  const body = [
    `Contact: mailto:${siteConfig.email}`,
    `Expires: ${SECURITY_TXT_EXPIRES}`,
    'Preferred-Languages: tr, en',
    `Canonical: ${siteConfig.siteUrl}/.well-known/security.txt`,
    `Policy: ${siteConfig.siteUrl}/guvenlik`,
    `Policy: ${siteConfig.siteUrl}/en/security`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
