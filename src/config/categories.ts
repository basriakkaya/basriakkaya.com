export const categories = {
  'web-guvenligi': { name: 'Web Güvenliği', description: 'Web uygulaması güvenliği, zafiyet sınıfları, yetkilendirme kontrolleri ve sorumlu zafiyet bildirimi üzerine teknik içerikler.', variant: 'blue' },
  'ag-ve-linux': { name: 'Ağ ve Linux', description: 'Ağ temelleri, protokoller, Linux sistemleri, servis analizi ve terminal pratikleri üzerine teknik içerikler.', variant: 'green' },
  'guvenlik-arastirmalari': { name: 'Güvenlik Araştırmaları', description: 'CVE araştırmaları, zafiyet analizi, teknik raporlama ve koordineli açıklama süreçleri üzerine çalışmalar.', variant: 'purple' },
  'arac-gelistirme': { name: 'Araç Geliştirme', description: 'Güvenlik araçları, otomasyon, Python, Rust, JavaScript ve ürün geliştirme süreçleri üzerine teknik notlar.', variant: 'blue' },
  'kisisel-notlar': { name: 'Kişisel Notlar', description: 'Öğrenme süreci, kariyer, üretim ve siber güvenlik yolculuğuna dair kişisel notlar.', variant: 'purple' },
} as const;

export type CategorySlug = keyof typeof categories;
export const categoryEntries = Object.entries(categories) as Array<[CategorySlug, (typeof categories)[CategorySlug]]>;
export const getCategory = (slug: string) => categories[slug as CategorySlug];

export const categoryTranslations: Record<CategorySlug, { name: string; description: string; slug: string }> = {
  'web-guvenligi': { name: 'Web Security', description: 'Technical articles on web application security, vulnerability classes, authorization controls, and responsible disclosure.', slug: 'web-security' },
  'ag-ve-linux': { name: 'Networking and Linux', description: 'Technical articles on networking fundamentals, protocols, Linux systems, service analysis, and terminal practices.', slug: 'networking-and-linux' },
  'guvenlik-arastirmalari': { name: 'Security Research', description: 'Research on CVEs, vulnerability analysis, technical reporting, and coordinated disclosure.', slug: 'security-research' },
  'arac-gelistirme': { name: 'Tool Development', description: 'Technical notes on security tools, automation, Python, Rust, JavaScript, and product development.', slug: 'tool-development' },
  'kisisel-notlar': { name: 'Personal Notes', description: 'Personal notes on learning, career, making things, and the cybersecurity journey.', slug: 'personal-notes' },
};

export const getLocalizedCategory = (key: string, locale: 'tr' | 'en') => locale === 'tr' ? { ...getCategory(key), slug: key } : categoryTranslations[key as CategorySlug];
export const categoryKeyFromSlug = (slug: string, locale: 'tr' | 'en') => locale === 'tr' ? (slug as CategorySlug) : categoryEntries.find(([key]) => categoryTranslations[key].slug === slug)?.[0];
