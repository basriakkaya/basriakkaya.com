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
