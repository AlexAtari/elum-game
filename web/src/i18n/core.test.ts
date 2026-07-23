import { describe, expect, it } from 'vitest'
import {
  fallbackLanguage,
  formatNumber,
  resolveLanguage,
  translate,
} from './core'

describe('Internationalisierung', () => {
  it('verwendet Deutsch als Rückfallsprache', () => {
    expect(resolveLanguage(undefined)).toBe(fallbackLanguage)
    expect(resolveLanguage('fr-FR')).toBe(fallbackLanguage)
  })

  it('erkennt unterstützte Sprachvarianten', () => {
    expect(resolveLanguage('de-DE')).toBe('de')
    expect(resolveLanguage('EN-us')).toBe('en')
  })

  it('setzt benannte Platzhalter ein', () => {
    expect(
      translate('en', 'app.round', { round: 4 }),
    ).toBe('Round 4')
  })

  it('formatiert Zahlen passend zur Sprache', () => {
    expect(formatNumber('de', 12345)).toBe('12.345')
    expect(formatNumber('en', 12345)).toBe('12,345')
  })
})
