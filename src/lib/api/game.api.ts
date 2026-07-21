import { apiClient } from './client'

export type GamesResponse = {
  name: string
  description: string
  releaseDate: string
  total_games_played: number
}

export const gameInfoApi = {
  getGames: () =>
    apiClient.get<GamesResponse>('/game/info', undefined)
}

