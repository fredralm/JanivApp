import { describe, it, expect } from 'vitest'
import { applyRoundScore, isEliminated, getThreshold } from './scoreLogic'
import type { GameMode } from './types'

describe('getThreshold', () => {
  it('returns 200 for normal mode', () => {
    expect(getThreshold('normal')).toBe(200)
  })
  it('returns 100 for short mode', () => {
    expect(getThreshold('short')).toBe(100)
  })
})

describe('applyRoundScore — normal mode', () => {
  const mode: GameMode = 'normal'

  it('adds score normally', () => {
    expect(applyRoundScore(50, 30, mode)).toBe(80)
  })

  it('hitting exactly 100 reduces to 50', () => {
    expect(applyRoundScore(70, 30, mode)).toBe(50)
  })

  it('hitting exactly 200 reduces to 150', () => {
    expect(applyRoundScore(170, 30, mode)).toBe(150)
  })

  it('going over 200 returns raw total (player is eliminated)', () => {
    expect(applyRoundScore(180, 30, mode)).toBe(210)
  })

  it('does not reduce to 50 when total is 100 but came from going over then reducing (edge: 99+1=100)', () => {
    expect(applyRoundScore(99, 1, mode)).toBe(50)
  })
})

describe('applyRoundScore — short mode', () => {
  const mode: GameMode = 'short'

  it('adds score normally', () => {
    expect(applyRoundScore(30, 20, mode)).toBe(50)
  })

  it('hitting exactly 100 reduces to 50', () => {
    expect(applyRoundScore(70, 30, mode)).toBe(50)
  })

  it('going over 100 returns raw total (player is eliminated)', () => {
    expect(applyRoundScore(80, 30, mode)).toBe(110)
  })

  it('does NOT apply the 200→150 rule', () => {
    // In short mode, 200 is never reachable without elimination at 100+
    // but ensure there is no accidental 200→150 reduction
    expect(applyRoundScore(190, 10, mode)).toBe(200) // 200 > 100, eliminated, no reduction
  })
})

describe('isEliminated', () => {
  it('normal mode: eliminated when score > 200', () => {
    expect(isEliminated(201, 'normal')).toBe(true)
    expect(isEliminated(200, 'normal')).toBe(false)
  })

  it('short mode: eliminated when score > 100', () => {
    expect(isEliminated(101, 'short')).toBe(true)
    expect(isEliminated(100, 'short')).toBe(false)
  })
})
