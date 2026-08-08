export const seriesRegistry = {
  'network-ogrenme-gunlugu': {
    title: 'Network Öğrenme Günlüğü',
    shortTitle: 'Network Günlüğü',
    description: 'Bilgisayar ağlarını temelden başlayarak öğrendiğim, uyguladığım ve kendi cümlelerimle kaydettiğim teknik yazı serisi.',
    status: 'ongoing',
  },
} as const;

export type SeriesSlug = keyof typeof seriesRegistry;
export const seriesEntries = Object.entries(seriesRegistry) as Array<[SeriesSlug, (typeof seriesRegistry)[SeriesSlug]]>;
export const getSeries = (slug?: string) => slug ? seriesRegistry[slug as SeriesSlug] : undefined;
export const seriesStatusLabel = { ongoing: 'Devam Ediyor', completed: 'Tamamlandı' } as const;

export const seriesTranslations: Record<SeriesSlug, { title: string; shortTitle: string; description: string; slug: string }> = {
  'network-ogrenme-gunlugu': { title: 'Networking Learning Journal', shortTitle: 'Networking Journal', description: 'A technical series documenting how I learn and practice computer networking from the fundamentals.', slug: 'networking-learning-journal' },
};

export const getLocalizedSeries = (key: string, locale: 'tr' | 'en') => locale === 'tr' ? { ...getSeries(key)!, slug: key } : seriesTranslations[key as SeriesSlug];
