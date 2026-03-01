import type { Game, Round } from './types'
import { applyRoundScore, isEliminated } from './scoreLogic'

/**
 * Compute current scores for all players by replaying all rounds.
 * Eliminated players are excluded after their elimination round.
 */
export function computeScores(game: Game): Record<string, number> {
  const scores: Record<string, number> = {}
  const eliminated = new Set<string>()

  for (const player of game.players) scores[player] = 0

  for (const round of game.rounds) {
    for (const player of game.players) {
      if (eliminated.has(player)) continue
      const roundScore = round.scores[player] ?? 0
      const newScore = applyRoundScore(scores[player], roundScore, game.mode)
      if (isEliminated(newScore, game.mode)) {
        eliminated.add(player)
      }
      scores[player] = newScore
    }
  }

  return scores
}

/**
 * Apply a new round to the game, handling eliminations and game-end detection.
 */
export function processRound(game: Game, roundScores: Record<string, number>): Game {
  const eliminated = new Set(game.eliminationOrder)
  const activePlayers = game.players.filter(p => !eliminated.has(p))

  const currentScores = computeScores(game)
  const newRound: Round = { scores: roundScores }
  const updatedGame = { ...game, rounds: [...game.rounds, newRound] }

  const newEliminations: string[] = []

  for (const player of activePlayers) {
    const roundScore = roundScores[player] ?? 0
    const newScore = applyRoundScore(currentScores[player], roundScore, game.mode)
    if (isEliminated(newScore, game.mode)) {
      newEliminations.push(player)
    }
  }

  // Among players eliminated in the same round, the one who scored the most
  // gets the worst placement (goes first in eliminationOrder = last place).
  newEliminations.sort((a, b) => (roundScores[b] ?? 0) - (roundScores[a] ?? 0))

  const updatedEliminationOrder = [...game.eliminationOrder, ...newEliminations]
  const stillActive = activePlayers.filter(p => !newEliminations.includes(p))

  if (stillActive.length === 1) {
    // Last player standing wins
    const winner = stillActive[0]
    const placements = [winner, ...updatedEliminationOrder.slice().reverse()]
    return {
      ...updatedGame,
      eliminationOrder: updatedEliminationOrder,
      finalPlacements: placements,
      status: 'finished',
    }
  }

  if (stillActive.length === 0 && newEliminations.length > 0) {
    // Everyone eliminated in same round — all get last places
    const placements = updatedEliminationOrder.slice().reverse()
    return {
      ...updatedGame,
      eliminationOrder: updatedEliminationOrder,
      finalPlacements: placements,
      status: 'finished',
    }
  }

  return { ...updatedGame, eliminationOrder: updatedEliminationOrder }
}
