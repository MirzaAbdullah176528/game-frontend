'use client'

import { Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export interface Game {
  name: string
  description: string
  total_games_played: number
  image: string
  link: string
}

interface GameCardProps {
  game: Game
  onPlay?: (game: Game) => void
}

export function GameCard({ game, onPlay }: GameCardProps) {
  return (
    <Card className="w-full max-w-sm overflow-hidden">
      <img
        src={game.image ? game.image : '/chess.jpg'}
        alt={game.name}
        className="h-48 w-full object-cover"
      />

      <CardHeader>
        <CardTitle>{game.name}</CardTitle>
        <CardDescription className="line-clamp-3">
          {game.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          {game.total_games_played.toLocaleString()} games played
        </p>
      </CardContent>

      <CardFooter>
        <Link
        href={game.link}>
          
        <Button className="w-full" >
          <Play className="mr-2 h-4 w-4" />
          Play Now
        </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}