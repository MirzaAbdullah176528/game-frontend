'use client'

import { create } from 'zustand'
import { authApi } from '@/lib/api/auth.api'
import { tokenStore } from '@/lib/api/client'
import { getStoredUser } from '@/lib/auth'

type AuthState = {
  
  user: { id: number; name: string; email: string } | null
  hydrated: boolean
  
  hydrate: () => void
  
  setToken: (token: string) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  hydrate: () => {
    const u = getStoredUser()
    if (u) {
      set({
        user: { id: u.id, name: u.sub, email: u.email },
        hydrated: true,
      })
    } else {
      set({ user: null, hydrated: true })
    }
  },

  setToken: (token) => {
    tokenStore.set(token)
    const u = getStoredUser()
    set({
      user: u ? { id: u.id, name: u.sub, email: u.email } : null,
      hydrated: true,
    })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
    }
    tokenStore.clear()
    set({ user: null })
  },
}))
