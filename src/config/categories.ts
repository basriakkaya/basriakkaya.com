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
