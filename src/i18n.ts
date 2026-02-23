import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en', 'ne'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ne: 'नेपाली',
};

export default getRequestConfig(async ({ requestLocale }) => {
  // Await the requestLocale Promise (next-intl v4 API)
  let locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
