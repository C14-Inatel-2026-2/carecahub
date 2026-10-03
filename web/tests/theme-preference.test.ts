import { describe, expect, it, vi } from 'vitest'
import { ThemePreference } from '../src/lib/theme-preference'

describe('ThemePreference.parse — without mocks', () => {
  it('returns valid stored themes instead of the fallback', () => {
    expect(ThemePreference.parse('dark', 'light')).toBe('dark')
    expect(ThemePreference.parse('light', 'dark')).toBe('light')
    expect(ThemePreference.parse('system', 'dark')).toBe('system')
  })

  it('uses the fallback when the stored preference is invalid', () => {
    expect(ThemePreference.parse('banana')).toBe('system')
    expect(ThemePreference.parse('banana', 'light')).toBe('light')
  })
})

describe('ThemePreference.save — with mocks', () => {
  it('persists the theme using the provided storage key', () => {
    const storage = { setItem: vi.fn() }

    const result = ThemePreference.save(storage, 'theme', 'dark')

    expect(result).toBe(true)
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith('theme', 'dark')
  })

  it('returns false instead of throwing when storage refuses the write', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error('Storage unavailable')
      }),
    }

    const result = ThemePreference.save(storage, 'theme', 'light')

    expect(result).toBe(false)
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith('theme', 'light')
  })
})
