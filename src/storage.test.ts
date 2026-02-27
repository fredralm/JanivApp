import { describe, it, expect, beforeEach } from 'vitest'
import { getGroups, saveGroups, getGames, saveGames } from './storage'
import type { Group, Game } from './types'

const mockGroup: Group = {
  id: '1',
  name: 'Testgruppe',
  players: ['Anna', 'Bo'],
}

const mockGame: Game = {
  id: 'g1',
  groupId: '1',
  date: '2026-02-27',
  players: ['Anna', 'Bo'],
  mode: 'normal',
  rounds: [],
  status: 'active',
  finalPlacements: [],
  eliminationOrder: [],
}

beforeEach(() => {
  localStorage.clear()
})

describe('getGroups', () => {
  it('returns empty array when nothing stored', () => {
    expect(getGroups()).toEqual([])
  })

  it('returns stored groups', () => {
    localStorage.setItem('janiv_groups', JSON.stringify([mockGroup]))
    expect(getGroups()).toEqual([mockGroup])
  })
})

describe('saveGroups', () => {
  it('persists groups to localStorage', () => {
    saveGroups([mockGroup])
    expect(JSON.parse(localStorage.getItem('janiv_groups')!)).toEqual([mockGroup])
  })
})

describe('getGames', () => {
  it('returns empty array when nothing stored', () => {
    expect(getGames()).toEqual([])
  })

  it('returns stored games', () => {
    localStorage.setItem('janiv_games', JSON.stringify([mockGame]))
    expect(getGames()).toEqual([mockGame])
  })
})

describe('saveGames', () => {
  it('persists games to localStorage', () => {
    saveGames([mockGame])
    expect(JSON.parse(localStorage.getItem('janiv_games')!)).toEqual([mockGame])
  })
})
