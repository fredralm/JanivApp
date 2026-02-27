import { describe, it, expect } from 'vitest'
import { computeScores, processRound } from './gameEngine'
import type { Game } from './types'

const baseGame: Game = {
  id: 'g1',
  groupId: 'grp1',
  date: '2026-02-27',
  players: ['Anna', 'Bo', 'Carl'],
  mode: 'normal',
  rounds: [],
  status: 'active',
  finalPlacements: [],
  eliminationOrder: [],
}

describe('computeScores', () => {
  it('returns 0 for all players with no rounds', () => {
    expect(computeScores(baseGame)).toEqual({ Anna: 0, Bo: 0, Carl: 0 })
  })

  it('accumulates scores across rounds', () => {
    const game = {
      ...baseGame,
      rounds: [
        { scores: { Anna: 10, Bo: 20, Carl: 5 } },
        { scores: { Anna: 15, Bo: 10, Carl: 5 } },
      ]
    }
    expect(computeScores(game)).toEqual({ Anna: 25, Bo: 30, Carl: 10 })
  })

  it('applies exactly-100 rule', () => {
    const game = {
      ...baseGame,
      rounds: [{ scores: { Anna: 100, Bo: 0, Carl: 0 } }]
    }
    expect(computeScores(game).Anna).toBe(50)
  })

  it('applies exactly-200 rule in normal mode', () => {
    const game = {
      ...baseGame,
      rounds: [
        { scores: { Anna: 150, Bo: 0, Carl: 0 } },
        { scores: { Anna: 50, Bo: 0, Carl: 0 } },
      ]
    }
    expect(computeScores(game).Anna).toBe(150)
  })
})

describe('processRound', () => {
  it('adds a round and updates game correctly', () => {
    const roundScores = { Anna: 50, Bo: 60, Carl: 30 }
    const updated = processRound(baseGame, roundScores)
    expect(updated.rounds).toHaveLength(1)
    expect(updated.status).toBe('active')
  })

  it('eliminates player going over 200 in normal mode', () => {
    const game = {
      ...baseGame,
      rounds: [{ scores: { Anna: 180, Bo: 10, Carl: 10 } }]
    }
    const updated = processRound(game, { Anna: 30, Bo: 5, Carl: 5 })
    expect(updated.eliminationOrder).toContain('Anna')
  })

  it('ends game when only 1 player remains', () => {
    const game: Game = {
      ...baseGame,
      players: ['Anna', 'Bo'],
      rounds: [{ scores: { Anna: 10, Bo: 180 } }],
      eliminationOrder: [],
    }
    const updated = processRound(game, { Anna: 5, Bo: 30 })
    // Bo goes over 200, Anna wins
    expect(updated.status).toBe('finished')
    expect(updated.finalPlacements[0]).toBe('Anna')
  })

  it('eliminates player going over 100 in short mode', () => {
    const game: Game = { ...baseGame, mode: 'short' }
    const updated = processRound(game, { Anna: 110, Bo: 10, Carl: 10 })
    expect(updated.eliminationOrder).toContain('Anna')
  })
})
