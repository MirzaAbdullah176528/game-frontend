'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Loader2,
  Users,
  Trophy,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  WifiOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTttGame } from '@/components/game/useTttGame'
import { TttBoardView } from '@/components/game/TttBoardView'
import { useAuthStore } from '@/store/auth.store'
import { getRank, RANK_COLORS } from '@/lib/auth'
import { cn } from '@/lib/utils'

function PlayerCard({
  symbol,
  username,
  elo,
  isMe,
  isTurn,
  connected,
}: {
  symbol: 'X' | 'O'
  username: string | null
  elo: number | null
  isMe: boolean
  isTurn: boolean
  connected?: boolean
}) {
  const rank = elo != null ? getRank(elo) : null
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        isTurn ? 'border-primary bg-primary/5' : 'bg-card'
      )}
    >
      <div
        className={cn(
          'grid h-10 w-10 place-items-center rounded-md font-bold text-lg',
          symbol === 'X'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-rose-100 text-rose-700'
        )}
      >
        {symbol}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {username ?? 'Waiting…'}
          </span>
          {isMe && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
          {connected === false && username && (
            <Badge variant="outline" className="text-xs text-amber-600">
              <WifiOff className="mr-1 h-3 w-3" />
              disconnected
            </Badge>
          )}
        </div>
        {elo != null && rank ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ELO {elo}</span>
            <span>·</span>
            <span className={cn('font-medium', RANK_COLORS[rank])}>{rank}</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Awaiting player</div>
        )}
      </div>
      {isTurn && (
        <Badge className="bg-primary text-primary-foreground">Turn</Badge>
      )}
    </div>
  )
}

function GameContent({ roomId }: { roomId: string }) {
  const params = useSearchParams()
  const tokenParam = params.get('token') ?? undefined
  const { user } = useAuthStore()
  const { state, makeMove, requestRematch } = useTttGame(roomId, tokenParam)
  const [rematchRequested, setRematchRequested] = useState(false)


  const mySymbol: 'X' | 'O' | null =
    state.players.X?.username === user?.name
      ? 'X'
      : state.players.O?.username === user?.name
        ? 'O'
        : null

  useEffect(() => {
    if (state.error?.message) {
      // toast.error(state.error.message)
    }
  }, [state.error?.message])

  const winnerSymbol = state.winner
  const isDraw = state.winner === 'draw'
  const iWon = winnerSymbol && winnerSymbol !== 'draw' && winnerSymbol === mySymbol
  const iLost = winnerSymbol && winnerSymbol !== 'draw' && winnerSymbol !== mySymbol

  const myEloChange =
    state.eloChanges && mySymbol ? state.eloChanges[mySymbol] : null

  const handleRematch = () => {
    requestRematch()
    setRematchRequested(true)
  }
  useEffect(() => {
  if (state.phase !== 'finished') {
    setRematchRequested(false)
  }
}, [state.phase])

  return (
    <div className="flex-1 container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/ttt">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Leave room
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Room</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              {roomId.slice(0, 8)}…
            </code>
          </div>
        </div>

        {/* Fatal error */}
        {state.phase === 'error' && state.error?.fatal && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Could not enter room</CardTitle>
                  <CardDescription>{state.error.message}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/ttt">Back to lobby</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state.phase !== 'error' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Board area */}
            <div className="space-y-4">
              {/* Status banner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {state.phase === 'connecting' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Connecting…
                      </span>
                    </>
                  )}
                  {state.phase === 'waiting' && (
                    <>
                      <Users className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        Waiting for opponent to join…
                      </span>
                    </>
                  )}
                  {state.phase === 'active' && (
                    <span className="text-sm font-medium">
                      {mySymbol === state.currentTurn
                        ? 'Your turn'
                        : `${state.currentTurn === 'X' ? state.players.X?.username : state.players.O?.username}'s turn`}
                    </span>
                  )}
                  {state.phase === 'finished' && (
                    <span className="text-sm font-medium">
                      {isDraw
                        ? "It's a draw"
                        : iWon
                          ? 'You won!'
                          : iLost
                            ? 'You lost'
                            : 'Match finished'}
                    </span>
                  )}
                </div>
                {state.opponentDisconnectedIn !== null && (
                  <Badge variant="outline" className="text-amber-600">
                    Opponent away · {state.opponentDisconnectedIn}s
                  </Badge>
                )}
              </div>

              {/* The board */}
              <div className="rounded-xl border bg-card p-4 sm:p-6">
                <TttBoardView
                  board={state.board}
                  mySymbol={mySymbol}
                  currentTurn={state.currentTurn}
                  disabled={state.phase !== 'active'}
                  onMove={makeMove}
                />
              </div>

              {/* End-of-game panel */}
              {state.phase === 'finished' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy
                        className={cn(
                          'h-5 w-5',
                          iWon
                            ? 'text-yellow-500'
                            : iLost
                              ? 'text-muted-foreground'
                              : 'text-blue-500'
                        )}
                      />
                      {isDraw
                        ? 'Draw'
                        : iWon
                          ? 'Victory'
                          : iLost
                            ? 'Defeat'
                            : 'Match over'}
                    </CardTitle>
                    <CardDescription>
                      {state.endReason === 'disconnect'
                        ? 'Opponent disconnected and did not return in time.'
                        : 'The game has ended.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {state.eloChanges && (
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="rounded-lg border p-3">
                          <div className="text-xs text-muted-foreground">
                            X · {state.players.X?.username ?? '—'}
                          </div>
                          <div
                            className={cn(
                              'text-lg font-bold',
                              state.eloChanges.X > 0
                                ? 'text-emerald-600'
                                : state.eloChanges.X < 0
                                  ? 'text-rose-600'
                                  : ''
                            )}
                          >
                            {state.eloChanges.X > 0 ? '+' : ''}
                            {state.eloChanges.X} ELO
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-xs text-muted-foreground">
                            O · {state.players.O?.username ?? '—'}
                          </div>
                          <div
                            className={cn(
                              'text-lg font-bold',
                              state.eloChanges.O > 0
                                ? 'text-emerald-600'
                                : state.eloChanges.O < 0
                                  ? 'text-rose-600'
                                  : ''
                            )}
                          >
                            {state.eloChanges.O > 0 ? '+' : ''}
                            {state.eloChanges.O} ELO
                          </div>
                        </div>
                      </div>
                    )}

                    {myEloChange !== null && (
                      <Alert>
                        <AlertDescription>
                          Your ELO {myEloChange >= 0 ? 'increased' : 'decreased'}{' '}
                          by {Math.abs(myEloChange)}.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleRematch}
                        
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {rematchRequested && state.rematchVotes.length < 2
                          ? 'Waiting for opponent…'
                          : 'Request rematch'}
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/ttt">New room</Link>
                      </Button>
                      <Button variant="ghost" asChild>
                        <Link href="/leaderboard">Leaderboard</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Side: players */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Players</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <PlayerCard
                    symbol="X"
                    username={state.players.X?.username ?? null}
                    elo={state.players.X?.elo ?? null}
                    isMe={mySymbol === 'X'}
                    isTurn={
                      state.phase === 'active' && state.currentTurn === 'X'
                    }
                  />
                  <PlayerCard
                    symbol="O"
                    username={state.players.O?.username ?? null}
                    elo={state.players.O?.elo ?? null}
                    isMe={mySymbol === 'O'}
                    isTurn={
                      state.phase === 'active' && state.currentTurn === 'O'
                    }
                  />
                </CardContent>
              </Card>

              {state.rematchVotes.length > 0 && state.phase === 'finished' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rematch votes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {state.rematchVotes.length === 2
                        ? 'Both players want a rematch — starting…'
                        : `${state.rematchVotes.length}/2 votes received.`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TttRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const [roomId, setRoomId] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setRoomId(p.id))
  }, [params])

  if (!roomId) {
    return (
      <div className="flex-1 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex-1 grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GameContent roomId={roomId} />
    </Suspense>
  )
}
