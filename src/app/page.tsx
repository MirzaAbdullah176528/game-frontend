'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Gamepad2, Trophy, Zap, Shield, ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'

const features = [
  {
    icon: Zap,
    title: 'Real-time matches',
    description:
      'WebSocket-backed rooms via Cloudflare Durable Objects — sub-100ms move sync between two players, with automatic reconnect on disconnect.',
  },
  {
    icon: Trophy,
    title: 'ELO ranking',
    description:
      'Climb from Bronze to Master. Wins, losses, and draws all count, with K-factor 32 ELO updates persisted after every game.',
  },
  {
    icon: Shield,
    title: 'Verified accounts',
    description:
      'Email-OTP verification on signup, JWT access tokens, and httpOnly refresh cookies. No plaintext passwords ever stored.',
  },
  {
    icon: Gamepad2,
    title: 'More games coming',
    description:
      'Tic-Tac-Toe is live today. The schema already has chess_games and bingo_games tables — Bingo and Chess are next.',
  },
]

export default function Home() {
  const { user, hydrated, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"
        />
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live · powered by Cloudflare Durable Objects
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              Tic-Tac-Toe, <span className="text-primary">ranked.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Real-time multiplayer Tic-Tac-Toe with ELO matchmaking,
              leaderboard, and verified accounts. Create a room, share the code,
              and play.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {hydrated && user ? (
                <>
                  <Button size="lg" asChild>
                    <Link href="/ttt">
                      <Play className="mr-2 h-4 w-4" />
                      Play now
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/leaderboard">
                      <Trophy className="mr-2 h-4 w-4" />
                      Leaderboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/signup">
                      Get started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">I already have an account</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Why Arena
          </h2>
          <p className="mt-3 text-muted-foreground">
            A small but complete multiplayer gaming platform — built on a
            serverless Cloudflare Workers backend.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <Card key={f.title} className="h-full">
                <CardHeader>
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3">{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to climb the ladder?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sign up, verify your email, and play your first ranked match in
              under a minute.
            </p>
            <div className="mt-6">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Create an account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
