import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GamePage from './GamePage'
import type { Game } from '../types'

const mockGame: Game = {
  id: 'g1',
  groupId: 'grp1',
  date: '2026-02-27',
  players: ['Anna', 'Bo'],
  mode: 'normal',
  rounds: [],
  status: 'active',
  finalPlacements: [],
  eliminationOrder: [],
}

vi.mock('../storage', () => ({
  getGames: vi.fn(() => [mockGame]),
  saveGames: vi.fn(),
  getGroups: vi.fn(() => [{ id: 'grp1', name: 'Testgruppe', players: ['Anna', 'Bo'] }]),
}))

function renderGame(gameId = 'g1') {
  return render(
    <MemoryRouter initialEntries={[`/spill/${gameId}`]}>
      <Routes>
        <Route path="/spill/:gameId" element={<GamePage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('GamePage', () => {
  it('shows player names', () => {
    renderGame()
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('Bo')).toBeInTheDocument()
  })

  it('shows initial scores as 0', () => {
    renderGame()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
  })

  it('shows "Legg til runde" button', () => {
    renderGame()
    expect(screen.getByText('Legg til runde')).toBeInTheDocument()
  })

  it('shows round entry panel when clicking "Legg til runde"', () => {
    renderGame()
    fireEvent.click(screen.getByText('Legg til runde'))
    expect(screen.getByText('Bekreft runde')).toBeInTheDocument()
  })
})
