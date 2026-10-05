export type Theme = 'dark' | 'light' | 'system'

export class ThemePreference {
  static parse(value: string | null, fallback: Theme = 'system'): Theme {
    if (value === 'dark' || value === 'light' || value === 'system') {
      return value
    }

    return fallback
  }

  static save(storage: Pick<Storage, 'setItem'>, key: string, theme: Theme): boolean {
    try {
      storage.setItem(key, theme)
      return true
    } catch {
      return false
    }
  }
}
