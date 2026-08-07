import type { Locale } from "../lib/catalog";

export const localeConfig = {
  en: { alternate: "es", ogLocale: "en_US" },
  es: { alternate: "en", ogLocale: "es_CL" },
} as const satisfies Record<Locale, { alternate: Locale; ogLocale: string }>;

export function getLocaleConfig(locale: Locale) {
  return localeConfig[locale];
}
