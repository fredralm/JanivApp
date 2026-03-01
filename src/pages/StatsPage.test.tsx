import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import StatsPage from './StatsPage'
import type { Group, Game } from '../types'

const groups: Group[] = [
  { id: 'g1', name: 'Vennegjengen', players: ['Anna', 'Bo', 'Carl'] }
]

const games: Game[] = [
  {
    id: 'gm1', groupId: 'g1', date: '2026-01-01', players: ['Anna', 'Bo', 'Carl'],
    mode: 'normal', rounds: [], status: 'finished',
    finalPlacements: ['Anna', 'Bo', 'Carl'], eliminationOrder: ['Carl', 'Bo']
  },
  {
    id: 'gm2', groupId: 'g1', date: '2026-01-02', players: ['Anna', 'Bo', 'Carl'],
    mode: 'short', rounds: [], status: 'finished',
    finalPlacements: ['Bo', 'Anna', 'Carl'], eliminationOrder: ['Carl', 'Anna']
  },
  {
    id: 'gm3', groupId: 'g1', date: '2026-01-03', players: ['Anna', 'Bo', 'Carl'],
    mode: 'normal', rounds: [], status: 'finished',
    finalPlacements: ['Anna', 'Carl', 'Bo'], eliminationOrder: ['Bo', 'Carl']
  },
]

vi.mock('../storage', () => ({
  getGroups: vi.fn(() => groups),
  getGames: vi.fn(() => games),
}))

function renderStats(groupId?: string) {
  const path = groupId ? `/statistikk?gruppe=${groupId}` : '/statistikk'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/statistikk" element={<StatsPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('StatsPage', () => {
  it('shows group list', () => {
    renderStats()
    expect(screen.getByText('Vennegjengen')).toBeInTheDocument()
  })

  it('shows player wins after selecting group', () => {
    renderStats('g1')
    // Anna: 2 wins (gm1 normal, gm3 normal), Bo: 1 win (gm2 short)
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('2 seire')).toBeInTheDocument()
  })

  it('shows breakdown of normal vs short wins', () => {
    renderStats('g1')
    expect(screen.getByText(/2 normale/i)).toBeInTheDocument()
    expect(screen.getByText(/1 kort/i)).toBeInTheDocument()
  })
})
