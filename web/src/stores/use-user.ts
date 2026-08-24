import { create } from 'zustand'
import { fetcher } from '@/api/fetchers'
import type { LoggedUser } from '@/types/auth'

type UserStore = {
  user?: LoggedUser
  isLoading: boolean
  setUser: (user: LoggedUser) => void
  clearUser: () => void
  loadUser: () => Promise<void>
}

export const useUser = create<UserStore>((set) => ({
  user: undefined,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: undefined, isLoading: false }),
  loadUser: async () => {
    try {
      const user = await fetcher<LoggedUser>({ url: '/auth/me' })
      set({ user })
    } catch {
      set({ user: undefined })
    } finally {
      set({ isLoading: false })
    }
  },
}))
