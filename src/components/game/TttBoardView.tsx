'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TttBoard, TttSymbol } from '@/lib/api/ttt.api'

const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function getWinningLine(board: TttBoard): number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line
    }
  }
  return null
}

export function TttBoardView({
  board,
  mySymbol,
  currentTurn,
  disabled,
  onMove,
}: {
  board: TttBoard
  mySymbol: TttSymbol | null
  currentTurn: TttSymbol
  disabled?: boolean
  onMove: (position: number) => void
}) {
  const winningLine = getWinningLine(board)
  const myTurn = mySymbol !== null && currentTurn === mySymbol

  return (
    <div
      className="grid grid-cols-3 gap-2 sm:gap-3"
      role="grid"
      aria-label="Tic-Tac-Toe board"
    >
      {board.map((cell, i) => {
        const isWinning = winningLine?.includes(i) ?? false
        const occupied = cell !== null
        const clickable = !disabled && !occupied && myTurn

        return (
          <Button
            key={i}
            type="button"
            variant="outline"
            aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ', empty'}`}
            disabled={!clickable}
            onClick={() => clickable && onMove(i)}
            className={cn(
              'aspect-square h-full w-full rounded-lg border-2 text-4xl sm:text-5xl font-bold transition-all',
              'flex items-center justify-center',
              !occupied && clickable && 'hover:border-primary hover:bg-accent cursor-pointer',
              !occupied && !clickable && 'cursor-not-allowed opacity-60',
              cell === 'X' && 'text-emerald-600',
              cell === 'O' && 'text-rose-600',
              isWinning && 'border-primary bg-primary/10',
              !isWinning && occupied && 'bg-muted/40'
            )}
          >
            {cell ?? ''}
          </Button>
        )
      })}
    </div>
  )
}
