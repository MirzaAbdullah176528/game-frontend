import { tttApi, type LeaderboardEntry } from './ttt.api'
import { getStoredUser } from '../auth'

export type UserProfile = LeaderboardEntry & {
  id: number
  email: string
}

export const userApi = {
  
  getMe(): { id: number; name: string; email: string } | null {
    const u = getStoredUser()
    if (!u) return null
    return { id: u.id, name: u.sub, email: u.email }
  },

  
  async getMyStats(): Promise<UserProfile | null> {
    const me = this.getMe()
    if (!me) return null
    const entries = await tttApi.leaderboard({ limit: 100, offset: 0 })
    const found = entries.find((e) => e.username === me.name)
    if (!found) {
      return {
        id: me.id,
        email: me.email,
        rank: 0,
        username: me.name,
        elo: 1000,
        wins: 0,
        losses: 0,
        draws: 0,
        games: 0,
        win_rate: '0%',
      }
    }
    return { ...found, id: me.id, email: me.email }
  },

  async getUserByName(name: string): Promise<UserProfile | null> {
    const entries = await tttApi.leaderboard({ limit: 100, offset: 0 })
    const found = entries.find((e) => e.username === name)
    if (!found) return null
    return {
      ...found,
      id: 0,
      email: '',
    }
  },
}
