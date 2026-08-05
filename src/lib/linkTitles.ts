export const getArticleLinkTitle = (title: string) => `“${title}” yazısını oku`;
export const getCategoryLinkTitle = (categoryName: string) => `${categoryName} kategorisindeki teknik yazıları görüntüle`;
export const getSeriesLinkTitle = (seriesTitle: string) => `${seriesTitle} serisini ve yayımlanmış tüm bölümleri görüntüle`;
export const getSeriesAllChaptersLinkTitle = (seriesTitle: string) => `${seriesTitle} serisinin tüm bölümlerini görüntüle`;
export const getPreviousArticleLinkTitle = (title: string) => `Önceki bölüm: ${title}`;
export const getNextArticleLinkTitle = (title: string) => `Sonraki bölüm: ${title}`;

const navigationTitles = {
  home: 'Basri Akkaya ana sayfasına git',
  homeReturn: 'Basri Akkaya ana sayfasına dön',
  articles: 'Siber güvenlik yazılarını görüntüle',
  allArticles: 'Siber güvenlik, Linux ve güvenlik araştırmaları üzerine tüm yazıları görüntüle',
  about: 'Basri Akkaya hakkında bilgi edin',
  aboutDetails: "Basri Akkaya'nın eğitimi, güvenlik araştırmaları ve projeleri hakkında bilgi edin",
} as const;

export type NavigationLinkType = keyof typeof navigationTitles;
export const getNavigationLinkTitle = (type: NavigationLinkType) => navigationTitles[type];

export function getBreadcrumbLinkTitle(name: string, href: string) {
  if (href === '/') return 'Basri Akkaya ana sayfasına dön';
  if (href === '/yazilar') return 'Tüm siber güvenlik yazılarını görüntüle';
  if (href.includes('/kategori/')) return `${name} kategorisindeki yazıları görüntüle`;
  if (href.includes('/seri/')) return `${name} serisinin tüm bölümlerini görüntüle`;
  return `${name} sayfasını görüntüle`;
}

export const getExternalProfileLinkTitle = (platform: string) => `Basri Akkaya'nın ${platform} profilini yeni sekmede aç`;
