# Janiv Score App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Norwegian-language PWA for tracking Janiv card game scores with group management, round-by-round scoring, special elimination rules, and win statistics.

**Architecture:** Three-page React SPA (Hjemside, Spillside, Statistikkside) using React Router v6. All data persisted in localStorage as two JSON arrays (`janiv_groups`, `janiv_games`). Score rules encapsulated in a pure calculation function tested with Vitest.

**Tech Stack:** React 18, TypeScript, Vite, React Router v6, vite-plugin-pwa, Vitest, React Testing Library, @testing-library/jest-dom

---

## Task 1: Scaffold project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test-setup.ts`

**Step 1: Scaffold with Vite**

Run in `/Users/fredrikalmas/Fredrik/JanivScoreApp`:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted about non-empty directory, select "Ignore files and continue".

**Step 2: Install dependencies**

```bash
npm install react-router-dom
npm install -D vite-plugin-pwa vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 3: Update `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Janiv Score',
        short_name: 'Janiv',
        description: 'Poengsporing for Janiv',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  }
})
```

**Step 4: Create `src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

**Step 5: Update `package.json` scripts section**

Add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 6: Update `tsconfig.json` — add types for vitest globals**

In `compilerOptions`, add:
```json
"types": ["vitest/globals"]
```

**Step 7: Clear out boilerplate**

Replace `src/App.tsx` with a minimal shell:
```tsx
export default function App() {
  return <div>Janiv Score</div>
}
```

Delete `src/App.css`, `src/index.css`, `src/assets/react.svg`, `public/vite.svg`.

Replace `index.html` title with `Janiv Score`.

**Step 8: Verify dev server starts**

```bash
npm run dev
```
Expected: server starts, browser shows "Janiv Score".

**Step 9: Verify tests run**

```bash
npm run test:run
```
Expected: "No test files found" — that's fine at this stage.

**Step 10: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold React + Vite + PWA + Vitest"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/types.ts`

**Step 1: Write `src/types.ts`**

```typescript
export type GameMode = 'normal' | 'short'
export type GameStatus = 'active' | 'finished'

export interface Group {
  id: string
  name: string
  players: string[]
}

export interface Round {
  scores: Record<string, number>  // playerName -> raw points entered
}

export interface Game {
  id: string
  groupId: string
  date: string               // ISO date string
  players: string[]          // snapshot of players at game start
  mode: GameMode
  rounds: Round[]
  status: GameStatus
  finalPlacements: string[]  // index 0 = 1st place winner
  eliminationOrder: string[] // first eliminated = last place
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript types"
```

---

## Task 3: localStorage utilities

**Files:**
- Create: `src/storage.ts`
- Create: `src/storage.test.ts`

**Step 1: Write the failing tests in `src/storage.test.ts`**

```typescript
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
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run
```
Expected: FAIL — "Cannot find module './storage'"

**Step 3: Write `src/storage.ts`**

```typescript
import type { Group, Game } from './types'

const GROUPS_KEY = 'janiv_groups'
const GAMES_KEY = 'janiv_games'

export function getGroups(): Group[] {
  const raw = localStorage.getItem(GROUPS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveGroups(groups: Group[]): void {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function getGames(): Game[] {
  const raw = localStorage.getItem(GAMES_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveGames(games: Game[]): void {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games))
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run
```
Expected: PASS — 6 tests

**Step 5: Commit**

```bash
git add src/storage.ts src/storage.test.ts
git commit -m "feat: add localStorage utilities"
```

---

## Task 4: Score calculation logic

**Files:**
- Create: `src/scoreLogic.ts`
- Create: `src/scoreLogic.test.ts`

**Step 1: Write the failing tests in `src/scoreLogic.test.ts`**

```typescript
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
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run
```
Expected: FAIL — "Cannot find module './scoreLogic'"

**Step 3: Write `src/scoreLogic.ts`**

```typescript
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
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run
```
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/scoreLogic.ts src/scoreLogic.test.ts
git commit -m "feat: add score calculation logic with tests"
```

---

## Task 5: Router shell + global CSS

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/GamePage.tsx`
- Create: `src/pages/StatsPage.tsx`

**Step 1: Create page stubs**

`src/pages/HomePage.tsx`:
```tsx
export default function HomePage() {
  return <main><h1>Janiv Score</h1></main>
}
```

`src/pages/GamePage.tsx`:
```tsx
export default function GamePage() {
  return <main><h1>Spill</h1></main>
}
```

`src/pages/StatsPage.tsx`:
```tsx
export default function StatsPage() {
  return <main><h1>Statistikk</h1></main>
}
```

**Step 2: Update `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

**Step 3: Update `src/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import StatsPage from './pages/StatsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/spill/:gameId" element={<GamePage />} />
      <Route path="/statistikk" element={<StatsPage />} />
    </Routes>
  )
}
```

**Step 4: Create `src/index.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #1a1a2e;
  --surface: #16213e;
  --surface2: #0f3460;
  --accent: #e94560;
  --text: #eaeaea;
  --text-muted: #888;
  --radius: 10px;
  --gap: 16px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  min-height: 100dvh;
}

main {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--gap);
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  padding: 10px 18px;
  font-size: 15px;
  font-weight: 600;
}

.btn-primary {
  background: var(--accent);
  color: white;
  width: 100%;
  padding: 14px;
}

.btn-secondary {
  background: var(--surface2);
  color: var(--text);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  text-decoration: underline;
}

input {
  background: var(--surface2);
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text);
  font-size: 16px;
  padding: 10px 14px;
  width: 100%;
}

input:focus {
  outline: none;
  border-color: var(--accent);
}

.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: var(--gap);
}
```

**Step 5: Verify dev server still works**

```bash
npm run dev
```
Expected: home page shows "Janiv Score", no console errors.

**Step 6: Commit**

```bash
git add src/
git commit -m "feat: add router shell and page stubs"
```

---

## Task 6: Home page — group list and create group

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Create: `src/pages/HomePage.test.tsx`

**Step 1: Write failing tests in `src/pages/HomePage.test.tsx`**

```tsx
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
    fireEvent.click(screen.getByText('Opprett gruppe'))

    expect(storage.saveGroups).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Vennegjengen', players: ['Fredrik'] })
      ])
    )
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run
```
Expected: FAIL

**Step 3: Implement `src/pages/HomePage.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGroups, saveGroups, getGames, saveGames } from '../storage'
import type { Group, Game, GameMode } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>(getGroups)
  const [games] = useState<Game[]>(getGames)
  const [showForm, setShowForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [playerInput, setPlayerInput] = useState('')
  const [modeModal, setModeModal] = useState<Group | null>(null)

  function addPlayer() {
    const name = playerInput.trim()
    if (name && !players.includes(name)) {
      setPlayers([...players, name])
      setPlayerInput('')
    }
  }

  function createGroup() {
    if (!groupName.trim() || players.length < 2) return
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: groupName.trim(),
      players,
    }
    const updated = [...groups, newGroup]
    saveGroups(updated)
    setGroups(updated)
    setGroupName('')
    setPlayers([])
    setShowForm(false)
  }

  function startGame(group: Group, mode: GameMode) {
    const newGame: Game = {
      id: crypto.randomUUID(),
      groupId: group.id,
      date: new Date().toISOString(),
      players: [...group.players],
      mode,
      rounds: [],
      status: 'active',
      finalPlacements: [],
      eliminationOrder: [],
    }
    const allGames = getGames()
    saveGames([...allGames, newGame])
    navigate(`/spill/${newGame.id}`)
  }

  function getActiveGame(groupId: string) {
    return games.find(g => g.groupId === groupId && g.status === 'active')
  }

  return (
    <main>
      <h1 style={{ marginBottom: 24, fontSize: 28 }}>Janiv Score</h1>

      {groups.length === 0 && !showForm && (
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          Ingen grupper ennå. Opprett en for å starte!
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {groups.map(group => {
          const activeGame = getActiveGame(group.id)
          return (
            <div key={group.id} className="card">
              <strong style={{ fontSize: 18 }}>{group.name}</strong>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 12px' }}>
                {group.players.join(', ')}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {activeGame ? (
                  <button
                    className="btn-primary"
                    onClick={() => navigate(`/spill/${activeGame.id}`)}
                  >
                    Fortsett spill
                  </button>
                ) : (
                  <button className="btn-primary" onClick={() => setModeModal(group)}>
                    Start spill
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/statistikk?gruppe=${group.id}`)}
                >
                  Statistikk
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showForm ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginBottom: 12 }}>Ny gruppe</h2>
          <input
            placeholder="Gruppenavn"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              placeholder="Legg til spiller"
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
            />
            <button className="btn-secondary" onClick={addPlayer} style={{ whiteSpace: 'nowrap' }}>
              Legg til
            </button>
          </div>
          {players.length > 0 && (
            <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
              {players.map(p => <li key={p}>{p}</li>)}
            </ul>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={createGroup}>
              Opprett gruppe
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Ny gruppe
        </button>
      )}

      {/* Export/Import */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
        <button className="btn-secondary" onClick={() => {
          const data = { groups: getGroups(), games: getGames() }
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `janiv-eksport-${new Date().toISOString().slice(0, 10)}.json`
          a.click()
          URL.revokeObjectURL(url)
        }}>
          Eksporter data
        </button>
        <label className="btn-secondary" style={{ cursor: 'pointer' }}>
          Importer data
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = ev => {
              try {
                const imported = JSON.parse(ev.target?.result as string)
                const existingGroups = getGroups()
                const existingGames = getGames()
                const mergedGroups = [
                  ...existingGroups,
                  ...(imported.groups || []).filter(
                    (g: Group) => !existingGroups.find(eg => eg.id === g.id)
                  )
                ]
                const mergedGames = [
                  ...existingGames,
                  ...(imported.games || []).filter(
                    (g: Game) => !existingGames.find(eg => eg.id === g.id)
                  )
                ]
                saveGroups(mergedGroups)
                saveGames(mergedGames)
                setGroups(mergedGroups)
                alert('Import vellykket!')
              } catch {
                alert('Ugyldig fil')
              }
            }
            reader.readAsText(file)
          }} />
        </label>
      </div>

      {/* Game mode modal */}
      {modeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 16 }}>Velg spillmodus</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn-primary" onClick={() => { startGame(modeModal, 'normal'); setModeModal(null) }}>
                Normalt spill
                <span style={{ display: 'block', fontSize: 13, fontWeight: 400, opacity: 0.8 }}>
                  Ute ved over 200 poeng
                </span>
              </button>
              <button className="btn-secondary" onClick={() => { startGame(modeModal, 'short'); setModeModal(null) }}
                style={{ padding: 14 }}>
                Kort spill
                <span style={{ display: 'block', fontSize: 13, fontWeight: 400, opacity: 0.8 }}>
                  Ute ved over 100 poeng
                </span>
              </button>
              <button className="btn-ghost" onClick={() => setModeModal(null)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
```

**Step 4: Run tests**

```bash
npm run test:run
```
Expected: PASS — all HomePage tests green.

**Step 5: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.test.tsx
git commit -m "feat: home page with group management, export/import, game mode modal"
```

---

## Task 7: Game page — score display and round entry

**Files:**
- Modify: `src/pages/GamePage.tsx`
- Create: `src/pages/GamePage.test.tsx`
- Create: `src/gameEngine.ts`
- Create: `src/gameEngine.test.ts`

**Step 1: Write `src/gameEngine.test.ts`**

```typescript
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
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run
```
Expected: FAIL

**Step 3: Write `src/gameEngine.ts`**

```typescript
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
```

**Step 4: Run tests**

```bash
npm run test:run
```
Expected: PASS — all gameEngine tests green.

**Step 5: Write `src/pages/GamePage.test.tsx`**

```tsx
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
```

**Step 6: Write `src/pages/GamePage.tsx`**

```tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGames, saveGames, getGroups } from '../storage'
import { computeScores, processRound } from '../gameEngine'
import type { Game } from '../types'

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(() =>
    getGames().find(g => g.id === gameId) ?? null
  )
  const groups = getGroups()
  const [showRoundEntry, setShowRoundEntry] = useState(false)
  const [roundInputs, setRoundInputs] = useState<Record<string, string>>({})

  if (!game) return <main><p>Spill ikke funnet.</p></main>

  const group = groups.find(g => g.id === game.groupId)
  const scores = computeScores(game)
  const eliminated = new Set(game.eliminationOrder)
  const activePlayers = game.players.filter(p => !eliminated.has(p))
  const roundNumber = game.rounds.length + 1

  function saveGame(updated: Game) {
    const all = getGames()
    saveGames(all.map(g => g.id === updated.id ? updated : g))
    setGame(updated)
  }

  function submitRound() {
    const roundScores: Record<string, number> = {}
    for (const player of activePlayers) {
      roundScores[player] = parseInt(roundInputs[player] || '0', 10) || 0
    }
    const updated = processRound(game, roundScores)
    saveGame(updated)
    setRoundInputs({})
    setShowRoundEntry(false)
  }

  function endGameEarly() {
    if (!confirm('Avslutt spillet uten vinner?')) return
    const updated: Game = { ...game, status: 'finished' }
    saveGame(updated)
  }

  // Sort players: active first (by score asc), then eliminated (by placement)
  const sortedActive = [...activePlayers].sort((a, b) => scores[a] - scores[b])
  const elimReversed = [...game.eliminationOrder].reverse()
  const allSorted = [...sortedActive, ...elimReversed]

  const placementLabel = (player: string) => {
    if (!eliminated.has(player)) return null
    const place = game.eliminationOrder.length - game.eliminationOrder.indexOf(player)
    const placeLabels: Record<number, string> = { 1: '1.', 2: '2.', 3: '3.', 4: '4.', 5: '5.', 6: '6.' }
    return placeLabels[place] ?? `${place}.`
  }

  return (
    <main>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Hjem</button>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '4px 10px', borderRadius: 20 }}>
          {game.mode === 'normal' ? 'Normalt spill' : 'Kort spill'}
        </span>
      </div>

      <h1 style={{ marginBottom: 4 }}>{group?.name ?? 'Spill'}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        {game.status === 'active' ? `Runde ${roundNumber}` : 'Spillet er ferdig'}
      </p>

      {/* Final placements */}
      {game.status === 'finished' && game.finalPlacements.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--accent)' }}>
          <h2 style={{ marginBottom: 12 }}>Sluttresultat</h2>
          {game.finalPlacements.map((player, i) => (
            <div key={player} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>{i + 1}. {player}</span>
              <span style={{ color: 'var(--text-muted)' }}>{scores[player]} poeng</span>
            </div>
          ))}
        </div>
      )}

      {/* Player list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {allSorted.map(player => {
          const isOut = eliminated.has(player)
          const place = placementLabel(player)
          return (
            <div key={player} className="card" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              opacity: isOut ? 0.5 : 1
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>{player}</span>
                {isOut && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--accent)' }}>ute – {place} plass</span>}
              </div>
              <span style={{ fontSize: 22, fontWeight: 700 }}>{scores[player]}</span>
            </div>
          )
        })}
      </div>

      {game.status === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-primary" onClick={() => setShowRoundEntry(true)}>
            Legg til runde
          </button>
          <button className="btn-ghost" onClick={endGameEarly}>
            Avslutt spill
          </button>
        </div>
      )}

      {/* Round entry panel */}
      {showRoundEntry && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, borderRadius: '20px 20px 0 0', padding: 24 }}>
            <h2 style={{ marginBottom: 16 }}>Runde {roundNumber}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {activePlayers.map(player => (
                <div key={player} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <label style={{ flex: 1 }}>{player}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    style={{ width: 90, textAlign: 'right' }}
                    value={roundInputs[player] ?? ''}
                    onChange={e => setRoundInputs(prev => ({ ...prev, [player]: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={submitRound}>Bekreft runde</button>
              <button className="btn-ghost" onClick={() => setShowRoundEntry(false)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
```

**Step 7: Run tests**

```bash
npm run test:run
```
Expected: PASS — all tests green.

**Step 8: Commit**

```bash
git add src/gameEngine.ts src/gameEngine.test.ts src/pages/GamePage.tsx src/pages/GamePage.test.tsx
git commit -m "feat: game page with round entry, score calculation, and elimination"
```

---

## Task 8: Stats page

**Files:**
- Modify: `src/pages/StatsPage.tsx`
- Create: `src/pages/StatsPage.test.tsx`

**Step 1: Write `src/pages/StatsPage.test.tsx`**

```tsx
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
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run
```
Expected: FAIL

**Step 3: Implement `src/pages/StatsPage.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getGroups, getGames } from '../storage'
import type { Group } from '../types'

interface PlayerStats {
  name: string
  totalWins: number
  normalWins: number
  shortWins: number
}

function computeStats(groupId: string): PlayerStats[] {
  const games = getGames().filter(g => g.groupId === groupId && g.status === 'finished')
  const groups = getGroups()
  const group = groups.find(g => g.id === groupId)
  if (!group) return []

  const statsMap: Record<string, PlayerStats> = {}
  for (const player of group.players) {
    statsMap[player] = { name: player, totalWins: 0, normalWins: 0, shortWins: 0 }
  }

  for (const game of games) {
    const winner = game.finalPlacements[0]
    if (winner && statsMap[winner]) {
      statsMap[winner].totalWins++
      if (game.mode === 'normal') statsMap[winner].normalWins++
      else statsMap[winner].shortWins++
    }
  }

  return Object.values(statsMap).sort((a, b) => b.totalWins - a.totalWins)
}

export default function StatsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialGroup = searchParams.get('gruppe') ?? ''
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroup)

  const groups = getGroups()
  const selectedGroup = groups.find(g => g.id === selectedGroupId) as Group | undefined
  const stats = selectedGroupId ? computeStats(selectedGroupId) : []
  const games = getGames().filter(g => g.groupId === selectedGroupId && g.status === 'finished')
  const totalGames = games.length

  return (
    <main>
      <div style={{ marginBottom: 16 }}>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Hjem</button>
      </div>
      <h1 style={{ marginBottom: 20 }}>Statistikk</h1>

      {/* Group selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {groups.map(group => (
          <button
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            style={{
              background: selectedGroupId === group.id ? 'var(--accent)' : 'var(--surface)',
              color: 'var(--text)',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {group.name}
          </button>
        ))}
      </div>

      {selectedGroup && (
        <>
          <h2 style={{ marginBottom: 4 }}>{selectedGroup.name}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            {totalGames} {totalGames === 1 ? 'spill' : 'spill'} spilt
          </p>

          {stats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Ingen fullførte spill ennå.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.map((player, i) => (
                <div key={player.name} className="card" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {i + 1}. {player.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      {player.normalWins > 0 && `${player.normalWins} normale`}
                      {player.normalWins > 0 && player.shortWins > 0 && ' · '}
                      {player.shortWins > 0 && `${player.shortWins} korte`}
                      {player.totalWins === 0 && '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                      {player.totalWins}
                    </span>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>seire</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
```

**Step 4: Run tests**

```bash
npm run test:run
```
Expected: PASS — all tests green.

**Step 5: Commit**

```bash
git add src/pages/StatsPage.tsx src/pages/StatsPage.test.tsx
git commit -m "feat: stats page with win breakdown by game mode"
```

---

## Task 9: PWA assets and final polish

**Files:**
- Create: `public/icon-192.png`, `public/icon-512.png`
- Create: `public/manifest.webmanifest` (auto-generated by vite-plugin-pwa, no manual file needed)

**Step 1: Generate placeholder icons**

The simplest approach — create a minimal SVG and export as PNG, or use any 192×192 and 512×512 PNG images. For development, copy any placeholder PNG and rename it. For production, create a proper icon with the letter "J" on a dark background.

A quick way using a script:
```bash
# If you have ImageMagick installed:
convert -size 192x192 xc:#1a1a2e -fill white -font Helvetica-Bold -pointsize 100 -gravity center -annotate 0 "J" public/icon-192.png
convert -size 512x512 xc:#1a1a2e -fill white -font Helvetica-Bold -pointsize 260 -gravity center -annotate 0 "J" public/icon-512.png
```

If ImageMagick is not available, manually place any 192×192 and 512×512 PNG files in `/public` named `icon-192.png` and `icon-512.png`.

**Step 2: Run full test suite**

```bash
npm run test:run
```
Expected: All tests PASS.

**Step 3: Build and verify PWA**

```bash
npm run build
npm run preview
```
Open in browser, check DevTools → Application → Manifest — confirm app is installable.

**Step 4: Final commit**

```bash
git add public/
git commit -m "feat: add PWA icons and finalize app"
```

---

## Summary

| Task | What it builds |
|------|----------------|
| 1 | Project scaffold + tooling |
| 2 | TypeScript types |
| 3 | localStorage utilities (tested) |
| 4 | Score calculation logic (tested) |
| 5 | Router shell + CSS |
| 6 | Home page: groups, mode modal, export/import |
| 7 | Game engine (tested) + Game page |
| 8 | Stats page (tested) |
| 9 | PWA assets + final build verification |
