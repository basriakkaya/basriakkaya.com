export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'tr';

export const localeConfig = {
  tr: { languageTag: 'tr-TR', ogLocale: 'tr_TR', name: 'Türkçe', direction: 'ltr' },
  en: { languageTag: 'en-US', ogLocale: 'en_US', name: 'English', direction: 'ltr' },
} as const satisfies Record<Locale, { languageTag: string; ogLocale: string; name: string; direction: 'ltr' }>;

export const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale);
