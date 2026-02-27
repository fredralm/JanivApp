import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'

// Mock storage
vi.mock('../storage', () => ({
  getGroups: vi.fn(() => []),
  saveGroups: vi.fn(),
  getGames: vi.fn(() => []),
  saveGames: vi.fn(),
}))

import * as storage from '../storage'

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.mocked(storage.getGroups).mockReturnValue([])
  vi.mocked(storage.getGames).mockReturnValue([])
})

describe('HomePage', () => {
  it('shows app title', () => {
    renderHome()
    expect(screen.getByText('Janiv Score')).toBeInTheDocument()
  })

  it('shows "Ny gruppe" button', () => {
    renderHome()
    expect(screen.getByText('Ny gruppe')).toBeInTheDocument()
  })

  it('shows empty state when no groups', () => {
    renderHome()
    expect(screen.getByText(/ingen grupper/i)).toBeInTheDocument()
  })

  it('shows existing groups from storage', () => {
    vi.mocked(storage.getGroups).mockReturnValue([
      { id: '1', name: 'Familien', players: ['Anna', 'Bo'] }
    ])
    renderHome()
    expect(screen.getByText('Familien')).toBeInTheDocument()
    expect(screen.getByText(/Anna/)).toBeInTheDocument()
  })

  it('shows create group form after clicking "Ny gruppe"', () => {
    renderHome()
    fireEvent.click(screen.getByText('Ny gruppe'))
    expect(screen.getByPlaceholderText(/gruppenavn/i)).toBeInTheDocument()
  })

  it('can create a group with players', () => {
    renderHome()
    fireEvent.click(screen.getByText('Ny gruppe'))

    fireEvent.change(screen.getByPlaceholderText(/gruppenavn/i), {
      target: { value: 'Vennegjengen' }
    })
    fireEvent.change(screen.getByPlaceholderText(/legg til spiller/i), {
      target: { value: 'Fredrik' }
    })
    fireEvent.click(screen.getByText('Legg til'))

    fireEvent.change(screen.getByPlaceholderText(/legg til spiller/i), {
      target: { value: 'Kari' }
    })
    fireEvent.click(screen.getByText('Legg til'))

    fireEvent.click(screen.getByText('Opprett gruppe'))

    expect(storage.saveGroups).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Vennegjengen', players: ['Fredrik', 'Kari'] })
      ])
    )
  })
})
