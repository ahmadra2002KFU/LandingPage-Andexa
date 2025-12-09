// ========================================
// ANDEXA - Internationalization Utilities
// ========================================

import en from './locales/en.json';
import ar from './locales/ar.json';

export type Locale = 'en' | 'ar';
export type TranslationKey = string;

const translations: Record<Locale, typeof en> = { en, ar };

/**
 * Get a translation by key path (e.g., 'hero.headline')
 */
export function t(key: TranslationKey, locale: Locale = 'en'): string {
  const keys = key.split('.');
  let value: unknown = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English if key not found in current locale
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = (value as Record<string, unknown>)[fallbackKey];
        } else {
          return key; // Return key if not found in any locale
        }
      }
      break;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Get a nested translation object (e.g., 'benefits.items')
 */
export function tObject<T = unknown>(key: TranslationKey, locale: Locale = 'en'): T | null {
  const keys = key.split('.');
  let value: unknown = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return null;
    }
  }

  return value as T;
}

/**
 * Get a translation array (e.g., 'faq.items')
 */
export function tArray<T = unknown>(key: TranslationKey, locale: Locale = 'en'): T[] {
  const result = tObject<T[]>(key, locale);
  return Array.isArray(result) ? result : [];
}

/**
 * Get locale from URL pathname
 */
export function getLocaleFromUrl(url: URL | string): Locale {
  const pathname = typeof url === 'string' ? url : url.pathname;
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] === 'ar') {
    return 'ar';
  }

  return 'en';
}

/**
 * Get the opposite locale for language switching
 */
export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ar' : 'en';
}

/**
 * Get the path for a different locale
 */
export function getLocalizedPath(path: string, targetLocale: Locale): string {
  // Remove existing locale prefix
  const cleanPath = path.replace(/^\/(ar|en)/, '').replace(/^\/+/, '/') || '/';

  if (targetLocale === 'ar') {
    return `/ar${cleanPath === '/' ? '' : cleanPath}`;
  }

  return cleanPath;
}

/**
 * Check if locale reads right-to-left
 */
export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

/**
 * Get text direction for locale
 */
export function getDir(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get all available locales
 */
export function getLocales(): Locale[] {
  return ['en', 'ar'];
}

/**
 * Get display name for locale
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: 'English',
    ar: 'العربية',
  };
  return names[locale];
}
