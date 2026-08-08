import type { Locale } from './config';

const tr = {
  skip: 'İçeriğe geç', navLabel: 'Ana navigasyon', footerNavLabel: 'Alt bilgi navigasyonu', home: 'Ana Sayfa', articles: 'Yazılar', about: 'Ben Kimim', pages: 'Sayfalar', links: 'Bağlantılar',
  footerCopy: 'Güvenlik araştırmaları, Linux ve uygulama güvenliği üzerine notlar.', builtWith: 'Astro ile geliştirildi', menu: 'Menüyü aç veya kapat', newTab: ' (yeni sekmede açılır)', email: 'E-posta', security: 'Güvenlik Bildirimi',
  updateReady: 'Yeni sürüm hazır.', updateNow: 'Şimdi Güncelle', updateLater: 'Daha Sonra', install: 'Uygulamayı Yükle',
  languageSwitch: 'Dil seçimi', switchTo: 'English version',
  defaultTitle: 'Basri Akkaya | Siber Güvenlik Araştırmacısı', description: 'Web güvenliği, ağ güvenliği, Linux, etik hacking, CVE araştırmaları ve sorumlu zafiyet bildirimi üzerine teknik yazılar, projeler ve notlar.', socialAlt: 'Basri Akkaya — güvenlik araştırmaları',
} as const;

type Dictionary = { [K in keyof typeof tr]: string };

const en: Dictionary = {
  skip: 'Skip to content', navLabel: 'Main navigation', footerNavLabel: 'Footer navigation', home: 'Home', articles: 'Articles', about: 'About', pages: 'Pages', links: 'Links',
  footerCopy: 'Notes on security research, Linux, and application security.', builtWith: 'Built with Astro', menu: 'Open or close menu', newTab: ' (opens in a new tab)', email: 'Email', security: 'Security Disclosure',
  updateReady: 'A new version is ready.', updateNow: 'Update now', updateLater: 'Later', install: 'Install app',
  languageSwitch: 'Language selection', switchTo: 'Türkçe sürüm',
  defaultTitle: 'Basri Akkaya | Cybersecurity Researcher', description: 'Technical articles, projects, and notes on web security, network security, Linux, ethical hacking, CVE research, and responsible disclosure.', socialAlt: 'Basri Akkaya — security research',
};

export const translations = { tr, en } as const satisfies Record<Locale, Dictionary>;
export const t = (locale: Locale) => translations[locale];
