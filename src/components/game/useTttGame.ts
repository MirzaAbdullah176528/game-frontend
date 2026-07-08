'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  tttApi,
  type TttBoard,
  type TttSymbol,
  type TttStatus,
  type TttWsMessage,
  type TttWsOutgoing,
  type TttPlayer,
} from '@/lib/api/ttt.api'

export type GamePhase =
  | 'connecting' // acquiring token
  | 'waiting' // waiting for opponent
  | 'active'
  | 'finished'
  | 'error'

export type GameError = {
  message: string
  fatal: boolean
}

export type GameState = {
  phase: GamePhase
  board: TttBoard
  currentTurn: TttSymbol
  mySymbol: TttSymbol | null
  players: { X: TttPlayer; O: TttPlayer }
  winner: TttSymbol | 'draw' | null
  eloChanges: { X: number; O: number } | null
  endReason: 'normal' | 'disconnect' | null
  opponentDisconnectedIn: number | null
  rematchVotes: TttSymbol[]
  error: GameError | null
}

const EMPTY_BOARD: TttBoard = Array(9).fill(null)

export function useTttGame(roomId: string, initialToken?: string) {
  const [state, setState] = useState<GameState>({
    phase: 'connecting',
    board: EMPTY_BOARD,
    currentTurn: 'X',
    mySymbol: null,
    players: { X: null, O: null },
    winner: null,
    eloChanges: null,
    endReason: null,
    opponentDisconnectedIn: null,
    rematchVotes: [],
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const tokenRef = useRef<string | null>(initialToken ?? null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sendMessage = useCallback((msg: TttWsOutgoing) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify(msg))
  }, [])

  const connect = useCallback(
    (token: string) => {
      // Close any existing socket
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {}
        wsRef.current = null
      }

      const url = tttApi.wsUrl(roomId, token)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onmessage = (ev) => {
        let data: TttWsMessage
        try {
          data = JSON.parse(ev.data as string) as TttWsMessage
        } catch {
          return
        }

        switch (data.type) {
          case 'waiting':
            setState((s) => ({ ...s, phase: 'waiting' }))
            break
          case 'start':
            setState((s) => ({
              ...s,
              phase: 'active',
              board: data.board,
              currentTurn: data.currentTurn,
              players: data.players,
              winner: null,
              eloChanges: null,
              endReason: null,
              opponentDisconnectedIn: null,
              rematchVotes: [],
            }))
            break
          case 'update':
            setState((s) => ({
              ...s,
              phase: 'active',
              board: data.board,
              currentTurn: data.currentTurn,
            }))
            break
          case 'reconnected':
            setState((s) => ({
              ...s,
              phase: data.status === 'finished' ? 'finished' : 'active',
              board: data.board,
              currentTurn: data.currentTurn,
              players: data.players,
            }))
            break
          case 'opponent_disconnected':
            setState((s) => ({
              ...s,
              opponentDisconnectedIn: data.timeoutIn,
            }))
            break
          case 'rematch_vote':
            setState((s) => ({
              ...s,
              rematchVotes: Array.from(
                new Set([...s.rematchVotes, data.from])
              ),
            }))
            break
          case 'end':
            setState((s) => ({
              ...s,
              phase: 'finished',
              board: data.board,
              winner: data.winner ?? 'draw',
              eloChanges: data.eloChanges,
              endReason: data.reason,
              rematchVotes: [],
            }))
            break
          case 'error':
            // Non-fatal error from server — surface briefly
            setState((s) => ({
              ...s,
              error: { message: data.message, fatal: false },
            }))
            break
        }
      }

      ws.onopen = () => {
        setState((s) => ({
          ...s,
          phase: s.phase === 'connecting' ? 'waiting' : s.phase,
          error: null,
        }))
      }

      ws.onerror = () => {
        setState((s) => ({
          ...s,
          error: { message: 'Connection error', fatal: false },
        }))
      }

      ws.onclose = () => {
        wsRef.current = null
      }
    },
    [roomId]
  )

  // Acquire a token (use provided, else try reconnect endpoint) and connect
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (tokenRef.current) {
        if (!cancelled) connect(tokenRef.current)
        return
      }
      try {
        const res = await tttApi.reconnect(roomId)
        if (cancelled) return
        tokenRef.current = res.token
        connect(res.token)
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Could not enter this room. It may no longer exist.'
        setState((s) => ({
          ...s,
          phase: 'error',
          error: { message, fatal: true },
        }))
      }
    }

    init()

    return () => {
      cancelled = true
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {}
        wsRef.current = null
      }
    }
  }, [roomId, connect])

  const makeMove = useCallback(
    (position: number) => {
      sendMessage({ type: 'move', position })
    },
    [sendMessage]
  )

  const requestRematch = useCallback(() => {
    sendMessage({ type: 'rematch' })
  }, [sendMessage])

  return { state, makeMove, requestRematch }
}
