'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, LogIn, Copy, Check, Trophy, Gamepad2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { tttApi } from '@/lib/api/ttt.api'

export default function TttLobbyPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinId, setJoinId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [createdRoom, setCreatedRoom] = useState<{
    roomId: string
    token: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await tttApi.createRoom()
      setCreatedRoom({ roomId: res.roomId, token: res.token })
      toast.success('Room created', {
        description: 'Share the Room ID with a friend to play.',
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not create the room. Please try again.'
      setError(message)
    } finally {
      setCreating(false)
    }
  }

  const handleEnterCreated = () => {
    if (!createdRoom) return
    router.push(`/ttt/${createdRoom.roomId}?token=${createdRoom.token}`)
  }

  const handleCopy = async () => {
    if (!createdRoom) return
    try {
      await navigator.clipboard.writeText(createdRoom.roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinId.trim()) return
    setJoining(true)
    setError(null)
    try {
      const res = await tttApi.joinRoom(joinId.trim())
      router.push(`/ttt/${res.roomId}?token=${res.token}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not join that room. Please check the ID and try again.'
      setError(message)
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground mb-3">
            <Gamepad2 className="h-3.5 w-3.5" />
            Tic-Tac-Toe · Ranked
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Play Tic-Tac-Toe
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create a room and share the ID, or join an existing room to start a
            ranked match.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Create room */}
          <Card>
            <CardHeader>
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3">Create a room</CardTitle>
              <CardDescription>
                Start a new match. You&apos;ll play as <strong>X</strong> (move
                first).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {createdRoom ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Room ID</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={createdRoom.roomId}
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleCopy}
                        title="Copy"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this ID with your opponent. They can join from the
                    &ldquo;Join a room&rdquo; card.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click below to spin up a new room.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              {createdRoom ? (
                <>
                  <Button onClick={handleEnterCreated} className="flex-1">
                    Enter room
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCreatedRoom(null)}
                  >
                    Discard
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create room
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Join room */}
          <Card>
            <CardHeader>
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <LogIn className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3">Join a room</CardTitle>
              <CardDescription>
                Enter a Room ID you received. You&apos;ll play as{' '}
                <strong>O</strong>.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleJoin}>
              <CardContent>
                <div className="space-y-2 mb-2">
                  <Label htmlFor="roomId">Room ID</Label>
                  <Input
                    id="roomId"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={joining || !joinId.trim()}
                  className="w-full"
                >
                  {joining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Join room
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Leaderboard teaser */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Climb the leaderboard</CardTitle>
                <CardDescription>
                  Every ranked match updates your ELO. Top players are listed
                  on the global leaderboard.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild>
              <a href="/leaderboard">View leaderboard</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
