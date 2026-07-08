import { tokenStore } from './api/client'

export type JwtPayload = {
  sub: string
  email: string
  id: number
  exp: number
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Base64url → base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json =
      typeof atob === 'function'
        ? atob(b64)
        : Buffer.from(b64, 'base64').toString('utf-8')
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getStoredUser(): JwtPayload | null {
  const token = tokenStore.get()
  if (!token) return null
  return decodeJwt(token)
}

export function isTokenExpired(token: string): boolean {
  const p = decodeJwt(token)
  if (!p?.exp) return true
  return Math.floor(Date.now() / 1000) >= p.exp
}

/** ELO rank ladder — mirrored from Games-backend/src/lib/elo_cal.ts */
export function getRank(elo: number): string {
  if (elo >= 2000) return 'Master'
  if (elo >= 1600) return 'Diamond'
  if (elo >= 1400) return 'Platinum'
  if (elo >= 1200) return 'Gold'
  if (elo >= 1000) return 'Silver'
  return 'Bronze'
}

export const RANK_COLORS: Record<string, string> = {
  Master: 'text-fuchsia-600',
  Diamond: 'text-cyan-600',
  Platinum: 'text-emerald-600',
  Gold: 'text-yellow-600',
  Silver: 'text-slate-500',
  Bronze: 'text-orange-700',
}
