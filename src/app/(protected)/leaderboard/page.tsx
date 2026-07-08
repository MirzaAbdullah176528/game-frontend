'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Trophy, Loader2, Crown, Medal, Award } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { tttApi, type LeaderboardEntry } from '@/lib/api/ttt.api'
import { useAuthStore } from '@/store/auth.store'
import { getRank, RANK_COLORS } from '@/lib/auth'
import { cn } from '@/lib/utils'

const PODIUM_ICONS = [Crown, Medal, Award]
const PODIUM_STYLES = [
  'bg-yellow-100 text-yellow-700 border-yellow-300',
  'bg-slate-100 text-slate-700 border-slate-300',
  'bg-orange-100 text-orange-700 border-orange-300',
]

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await tttApi.leaderboard({ limit: 100, offset: 0 })
        if (!cancelled) setEntries(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not load the leaderboard. Please try again.'
        if (!cancelled) {
          setError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="flex-1 container mx-auto px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground mb-3">
            <Trophy className="h-3.5 w-3.5" />
            Tic-Tac-Toe · Global
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Leaderboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Top 100 players ranked by ELO. Play ranked matches to climb.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No ranked games yet</CardTitle>
              <CardDescription>
                Be the first to play a ranked match and claim the #1 spot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/ttt">Play now</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-3 mb-8">
                {podium.map((p, i) => {
                  const Icon = PODIUM_ICONS[i] ?? Trophy
                  const rank = getRank(p.elo)
                  const isMe = p.username === user?.name
                  return (
                    <Card
                      key={p.username}
                      className={cn(
                        'relative overflow-hidden',
                        i === 0 && 'sm:order-2 sm:scale-105',
                        i === 1 && 'sm:order-1',
                        i === 2 && 'sm:order-3'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute inset-x-0 top-0 h-1',
                          i === 0
                            ? 'bg-yellow-400'
                            : i === 1
                              ? 'bg-slate-400'
                              : 'bg-orange-400'
                        )}
                      />
                      <CardHeader>
                        <div
                          className={cn(
                            'grid h-12 w-12 place-items-center rounded-full border-2',
                            PODIUM_STYLES[i]
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          #{p.rank} · {p.username}
                          {isMe && (
                            <Badge variant="secondary" className="text-xs">
                              You
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          <span
                            className={cn(
                              'font-medium',
                              RANK_COLORS[rank]
                            )}
                          >
                            {rank}
                          </span>{' '}
                          · {p.elo} ELO
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <div className="font-bold text-emerald-600">
                              {p.wins}
                            </div>
                            <div className="text-muted-foreground">Wins</div>
                          </div>
                          <div>
                            <div className="font-bold text-rose-600">
                              {p.losses}
                            </div>
                            <div className="text-muted-foreground">Losses</div>
                          </div>
                          <div>
                            <div className="font-bold text-blue-600">
                              {p.draws}
                            </div>
                            <div className="text-muted-foreground">Draws</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Rest of the table */}
            {rest.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Full ranking</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">ELO</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          W
                        </TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          L
                        </TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          D
                        </TableHead>
                        <TableHead className="text-right hidden md:table-cell">
                          Win rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rest.map((p) => {
                        const rank = getRank(p.elo)
                        const isMe = p.username === user?.name
                        return (
                          <TableRow
                            key={p.username}
                            className={cn(isMe && 'bg-primary/5')}
                          >
                            <TableCell className="font-mono">
                              {p.rank}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {p.username}
                                {isMe && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    You
                                  </Badge>
                                )}
                              </div>
                              <span
                                className={cn(
                                  'text-xs',
                                  RANK_COLORS[rank]
                                )}
                              >
                                {rank}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {p.elo}
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell text-emerald-600">
                              {p.wins}
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell text-rose-600">
                              {p.losses}
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell text-blue-600">
                              {p.draws}
                            </TableCell>
                            <TableCell className="text-right hidden md:table-cell">
                              {p.win_rate}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
