import { apiClient } from './client'
import { API_BASE_URL } from './client'

export type CreateRoomResponse = {
  roomId: string
  token: string
}

export type JoinRoomResponse = {
  roomId: string
  token: string
}

export type LeaderboardEntry = {
  rank: number
  username: string
  elo: number
  wins: number
  losses: number
  draws: number
  games: number
  win_rate: string 
}

export type LeaderboardQuery = {
  limit?: number
  offset?: number
}

export const tttApi = {
  createRoom: () =>
    apiClient.post<CreateRoomResponse>('/ttt/rooms', undefined),

  joinRoom: (roomId: string) =>
    apiClient.post<JoinRoomResponse>(`/ttt/rooms/${roomId}/join`, undefined),

  reconnect: (roomId: string) =>
    apiClient.post<JoinRoomResponse>(
      `/ttt/rooms/${roomId}/reconnect`,
      undefined
    ),

  leaderboard: (query: LeaderboardQuery = {}) => {
    const params = new URLSearchParams()
    if (query.limit != null) params.set('limit', String(query.limit))
    if (query.offset != null) params.set('offset', String(query.offset))
    const qs = params.toString()
    return apiClient.get<LeaderboardEntry[]>(
      `/ttt/leaderboard${qs ? `?${qs}` : ''}`
    )
  },

  wsUrl: (roomId: string, token: string): string => {
    const base = API_BASE_URL.replace(/^http/, 'ws')
    return `${base}/ttt/rooms/${roomId}/ws?token=${encodeURIComponent(token)}`
  },
}

// ---- WebSocket message types (mirrors Games-backend/src/ttt/game_room.ts) ----

export type TttSymbol = 'X' | 'O'
export type TttStatus = 'waiting' | 'active' | 'finished'
export type TttWinner = TttSymbol | 'draw' | null

export type TttPlayer = {
  username: string
  elo: number
} | null

export type TttBoard = (TttSymbol | null)[]

export type TttWsMessage =
  | { type: 'waiting' }
  | {
      type: 'start'
      board: TttBoard
      currentTurn: TttSymbol
      players: { X: TttPlayer; O: TttPlayer }
    }
  | {
      type: 'update'
      board: TttBoard
      currentTurn: TttSymbol
      lastMove: number
    }
  | {
      type: 'reconnected'
      board: TttBoard
      currentTurn: TttSymbol
      status: TttStatus
      players: { X: TttPlayer; O: TttPlayer }
    }
  | { type: 'opponent_disconnected'; timeoutIn: number }
  | { type: 'rematch_vote'; from: TttSymbol }
  | {
      type: 'end'
      result: TttWinner
      winner: TttSymbol | null
      board: TttBoard
      eloChanges: { X: number; O: number }
      reason: 'normal' | 'disconnect'
    }
  | { type: 'error'; message: string }

export type TttWsOutgoing =
  | { type: 'move'; position: number }
  | { type: 'rematch' }
