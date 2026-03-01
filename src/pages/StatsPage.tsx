import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getGroups, saveGroups, getGames, saveGames } from '../storage'
import { DEFAULT_GROUP_COLOR } from '../colors'
import type { Group, Game } from '../types'

interface PlayerStats {
  name: string
  totalWins: number
  normalWins: number
  shortWins: number
}

function computeStats(groupId: string, groups: Group[]): PlayerStats[] {
  const games = getGames().filter(g => g.groupId === groupId && g.status === 'finished')
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

/** Rename a player string across all game records for a given group. */
function renamePlayerInGames(games: Game[], groupId: string, oldName: string, newName: string): Game[] {
  return games.map(game => {
    if (game.groupId !== groupId) return game
    return {
      ...game,
      players: game.players.map(p => p === oldName ? newName : p),
      rounds: game.rounds.map(round => {
        const newScores: Record<string, number> = {}
        for (const [k, v] of Object.entries(round.scores)) {
          newScores[k === oldName ? newName : k] = v
        }
        return { ...round, scores: newScores }
      }),
      eliminationOrder: game.eliminationOrder.map(p => p === oldName ? newName : p),
      finalPlacements: game.finalPlacements.map(p => p === oldName ? newName : p),
    }
  })
}

export default function StatsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialGroup = searchParams.get('gruppe') ?? ''
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroup)
  const [groups, setGroups] = useState<Group[]>(getGroups)

  // Edit modal state
  const [editModal, setEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPlayers, setEditPlayers] = useState<string[]>([])

  const selectedGroup = groups.find(g => g.id === selectedGroupId) as Group | undefined
  const selectedColor = selectedGroup?.color ?? DEFAULT_GROUP_COLOR
  const stats = selectedGroupId ? computeStats(selectedGroupId, groups) : []
  const games = getGames().filter(g => g.groupId === selectedGroupId && g.status === 'finished')
  const totalGames = games.length

  function openEdit() {
    if (!selectedGroup) return
    setEditName(selectedGroup.name)
    setEditPlayers([...selectedGroup.players])
    setEditModal(true)
  }

  function saveEdit() {
    if (!selectedGroup) return
    const trimmedName = editName.trim()
    if (!trimmedName) return
    const trimmedPlayers = editPlayers.map(p => p.trim()).filter(Boolean)
    if (trimmedPlayers.length < 2) return

    // Build rename map for players whose names changed
    const renames: Array<[string, string]> = []
    for (let i = 0; i < selectedGroup.players.length; i++) {
      const oldName = selectedGroup.players[i]
      const newName = trimmedPlayers[i] ?? oldName
      if (newName !== oldName) renames.push([oldName, newName])
    }

    // Update games with renames
    let updatedGames = getGames()
    for (const [oldName, newName] of renames) {
      updatedGames = renamePlayerInGames(updatedGames, selectedGroup.id, oldName, newName)
    }
    saveGames(updatedGames)

    // Update group
    const updatedGroup: Group = {
      ...selectedGroup,
      name: trimmedName,
      players: trimmedPlayers,
    }
    const updatedGroups = groups.map(g => g.id === selectedGroup.id ? updatedGroup : g)
    saveGroups(updatedGroups)
    setGroups(updatedGroups)
    setEditModal(false)
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    zIndex: 100,
  }

  return (
    <main>
      <div style={{ marginBottom: 16 }}>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Hjem</button>
      </div>
      <h1 style={{ marginBottom: 20 }}>Statistikk</h1>

      {/* Group selector */}
      {groups.length > 0 && <p className="section-label">Velg gruppe</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {groups.map(group => {
          const color = group.color ?? DEFAULT_GROUP_COLOR
          const isSelected = selectedGroupId === group.id
          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              style={{
                background: isSelected ? color : 'var(--surface)',
                color: isSelected ? 'white' : 'var(--text)',
                border: isSelected ? 'none' : '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: isSelected ? `0 2px 8px ${color}44` : 'var(--shadow)',
              }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: '50%',
                background: isSelected ? 'rgba(255,255,255,0.25)' : color,
                color: 'white', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {group.name[0]?.toUpperCase()}
              </span>
              {group.name}
            </button>
          )
        })}
      </div>

      {selectedGroup && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: selectedColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 16,
            }}>
              {selectedGroup.name[0]?.toUpperCase()}
            </div>
            <h2 style={{ flex: 1 }}>{selectedGroup.name}</h2>
            <button
              className="btn-secondary"
              style={{ fontSize: 13, padding: '6px 14px', borderRadius: 10 }}
              onClick={openEdit}
            >
              Rediger
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16, paddingLeft: 46 }}>
            {totalGames} spill spilt
          </p>

          {stats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Ingen fullførte spill ennå.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.map((player, i) => (
                <div key={player.name} className="card" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderLeft: i === 0 && player.totalWins > 0 ? `3px solid ${selectedColor}` : undefined,
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>{i + 1}.</span>
                      <span>{player.name}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      {player.normalWins > 0 && `${player.normalWins} normale`}
                      {player.normalWins > 0 && player.shortWins > 0 && ' · '}
                      {player.shortWins > 0 && `${player.shortWins} korte`}
                      {player.totalWins === 0 && '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: selectedColor }}>
                      {player.totalWins} seire
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {editModal && selectedGroup && (
        <div style={overlayStyle}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 16 }}>Rediger gruppe</h2>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Gruppenavn</p>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              style={{ marginBottom: 20 }}
            />

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Spillere</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {editPlayers.map((player, i) => (
                <input
                  key={i}
                  value={player}
                  onChange={e => {
                    const updated = [...editPlayers]
                    updated[i] = e.target.value
                    setEditPlayers(updated)
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveEdit}
                disabled={!editName.trim() || editPlayers.filter(p => p.trim()).length < 2}
              >
                Lagre
              </button>
              <button className="btn-ghost" onClick={() => setEditModal(false)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
