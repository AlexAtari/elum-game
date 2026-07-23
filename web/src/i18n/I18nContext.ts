import { createContext, useContext } from 'react'
import type {
  Language,
  TranslationParams,
} from './core'
import type { TranslationKey } from './messages/de'

export type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (
    key: TranslationKey,
    params?: TranslationParams,
  ) => string
  number: (value: number) => string
}

export const I18nContext =
  createContext<I18nContextValue | null>(null)

export function useI18n(): I18nContextValue {
  const contextValue = useContext(I18nContext)

  if (!contextValue) {
    throw new Error(
      'useI18n must be used inside an I18nProvider.',
    )
  }

  return contextValue
}
