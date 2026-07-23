import { de, type TranslationKey } from './messages/de'
import { en } from './messages/en'

export const supportedLanguages = ['de', 'en'] as const

export type Language = (typeof supportedLanguages)[number]
export type TranslationParams = Record<
  string,
  string | number
>

const catalogs: Record<
  Language,
  Record<TranslationKey, string>
> = {
  de,
  en,
}

export const fallbackLanguage: Language = 'de'

export function resolveLanguage(
  language: string | null | undefined,
): Language {
  const normalizedLanguage = language
    ?.trim()
    .toLowerCase()
    .split('-')[0]

  return supportedLanguages.includes(
    normalizedLanguage as Language,
  )
    ? (normalizedLanguage as Language)
    : fallbackLanguage
}

export function translate(
  language: Language,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  const template =
    catalogs[language][key] ?? catalogs[fallbackLanguage][key]

  return template.replace(
    /\{\{(\w+)\}\}/g,
    (placeholder, parameterName: string) => {
      const value = params[parameterName]

      return value === undefined ? placeholder : String(value)
    },
  )
}

export function formatNumber(
  language: Language,
  value: number,
): string {
  return new Intl.NumberFormat(language).format(value)
}
