import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fallbackLanguage,
  formatNumber,
  resolveLanguage,
  translate,
  type Language,
} from './core'
import {
  I18nContext,
  type I18nContextValue,
} from './I18nContext'

const languageStorageKey = 'elum.language'

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return fallbackLanguage
  }

  return resolveLanguage(
    window.localStorage.getItem(languageStorageKey),
  )
}

type I18nProviderProps = {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguage] =
    useState<Language>(getInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language)
    document.documentElement.lang = language
  }, [language])

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) => translate(language, key, params),
      number: (value) => formatNumber(language, value),
    }),
    [language],
  )

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}
