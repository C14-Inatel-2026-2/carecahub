import { describe, expect, it } from 'vitest'
import { loadMockUser, loginMockUser, logoutMockUser } from '../src/mocks/auth.ts'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('mock authentication', () => {
  it('authenticates every mock account with its expected role', () => {
    const accounts = [
      ['admin@carecahub.com', 'admin'],
      ['professor@carecahub.com', 'teacher'],
      ['monitor@carecahub.com', 'mentor'],
      ['aluno@carecahub.com', 'student'],
    ] as const

    for (const [username, role] of accounts) {
      const storage = new MemoryStorage()
      const user = loginMockUser(storage, {
        username,
        password: 'Careca!123',
      })

      expect(user.email).toBe(username)
      expect(user.role).toBe(role)
    }
  })

  it('rejects an unknown account or an invalid password', () => {
    const storage = new MemoryStorage()

    expect(
      () =>
        loginMockUser(storage, {
          username: 'desconhecido@carecahub.com',
          password: 'Careca!123',
        })
    ).toThrow(/E-mail ou senha inválidos/)
    expect(
      () =>
        loginMockUser(storage, {
          username: 'admin@carecahub.com',
          password: 'senha-incorreta',
        })
    ).toThrow(/E-mail ou senha inválidos/)
  })

  it('restores and clears the authenticated mock session', () => {
    const storage = new MemoryStorage()
    const authenticatedUser = loginMockUser(storage, {
      username: 'monitor@carecahub.com',
      password: 'Careca!123',
    })

    expect(loadMockUser(storage)).toEqual(authenticatedUser)

    logoutMockUser(storage)

    expect(loadMockUser(storage)).toBeUndefined()
  })

  it('ignores an invalid persisted session', () => {
    const storage = new MemoryStorage()
    storage.setItem('carecahub:mock-user', '{"id":"unknown"}')

    expect(loadMockUser(storage)).toBeUndefined()
  })
})
