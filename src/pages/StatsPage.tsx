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
            {totalGames} spill spilt
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
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                      {player.totalWins} seire
                    </div>
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
