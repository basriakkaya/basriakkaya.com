import { localeConfig, type Locale } from './config';
import { siteConfig } from '../config/site';

export const formatDate = (date: Date, locale: Locale, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat(localeConfig[locale].languageTag, options).format(date);

export const localizedAbsoluteUrl = (path: string) => new URL(path, siteConfig.siteUrl).toString();

export interface AlternateLink { locale: Locale | 'x-default'; path: string }
export const alternateLinks = (trPath: string, enPath: string): AlternateLink[] => [
  { locale: 'tr', path: trPath }, { locale: 'en', path: enPath }, { locale: 'x-default', path: trPath },
];
