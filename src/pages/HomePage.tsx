import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGroups, saveGroups, getGames, saveGames } from '../storage'
import type { Group, Game, GameMode } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>(getGroups)
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
    return getGames().find(g => g.groupId === groupId && g.status === 'active')
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
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }}>
          Eksporter data
        </button>
        <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          Importer data
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = ev => {
              try {
                const imported = JSON.parse(ev.target?.result as string)
                if (!Array.isArray(imported.groups) || !Array.isArray(imported.games)) {
                  alert('Ugyldig fil — mangler groups/games')
                  return
                }
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
                  Spill opp til 200 poeng
                </span>
              </button>
              <button className="btn-secondary" onClick={() => { startGame(modeModal, 'short'); setModeModal(null) }}
                style={{ padding: 14 }}>
                Kort spill
                <span style={{ display: 'block', fontSize: 13, fontWeight: 400, opacity: 0.8 }}>
                  Spill opp til 100 poeng
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
