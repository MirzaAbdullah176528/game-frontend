'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { GameCard, type Game } from "@/components/ui/game_card"
import { gameInfoApi } from "@/lib/api/game.api"
import { toast } from 'sonner'
import { GamesResponse } from "@/lib/api/game.api"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

type GameInfo = {
  name: string
  total_games_played: number
  description: string
  release_date: string
}

type GameInfoWithMedia = GameInfo & {
  link: string
  image: string
}

const gamesLinkImg: Record<string, { image: string; link: string }> = {
  "Tic Tac Toe": { image: "ttt.jpg", link: "/ttt" },
  "Chess": { image: "chess.jpg", link: "/chess" },
  "Bingo": { image: "bingo.jpg", link: "/bingo" },
  "Checkers": { image: "checkers.jpg", link: "/checkers" }
}

export default function GamesPage() {
  const [games, setGames] = useState<GameInfoWithMedia[]>([])

  const fetchGames = async () => {
    try {
      const response: GamesResponse = await gameInfoApi.getGames()
      const gamesArray = (response as any)?.game ?? (response as any)?.games ?? (response as any)?.data ?? []
      const gamesData = (gamesArray || []).map((game: any) => ({
        name: game.name,
        description: game.description,
        release_date: game.release_date,
        total_games_played: game.total_games_played,
        link: gamesLinkImg[game.name]?.link || "",
        image: gamesLinkImg[game.name]?.image || ""
      }))

      setGames(gamesData)
      
    console.log("Games fetched:", gamesData)
    } catch (error) {
      toast.error("Failed to fetch games. Please try again later.")
    }
  }

  useEffect(() => {
    fetchGames()
  }, [])

  return (
    <main className="w-full min-h-screen px-4 py-12 md:px-8 lg:py-24 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Game Lobby
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Select a game to start playing in real-time.
        </p>
      </div>

      <motion.div 
        className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {games.map((game) => {
          const cardGame: Game = {
            name: game.name,
            description: game.description,
            image: game.image,
            total_games_played: game.total_games_played,
            link: game.link
          }

          return (
            <motion.div key={game.name} variants={itemVariants} className="h-full">
              <GameCard game={cardGame} />
            </motion.div>
          )
        })}
      </motion.div>
    </main>
  )
}