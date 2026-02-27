import type { GameMode } from './types'

export function getThreshold(mode: GameMode): number {
  return mode === 'normal' ? 200 : 100
}

export function applyRoundScore(
  currentTotal: number,
  roundScore: number,
  mode: GameMode
): number {
  const newTotal = currentTotal + roundScore
  if (newTotal === 100) return 50
  if (mode === 'normal' && newTotal === 200) return 150
  return newTotal
}

export function isEliminated(score: number, mode: GameMode): boolean {
  return score > getThreshold(mode)
}
