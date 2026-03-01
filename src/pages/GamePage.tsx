import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGames, saveGames, getGroups } from '../storage'
import { computeScores, processRound } from '../gameEngine'
import { DEFAULT_GROUP_COLOR } from '../colors'
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
  const groupColor = group?.color ?? DEFAULT_GROUP_COLOR
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
    if (!game) return
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
    if (!game) return
    if (!confirm('Avslutt spillet uten vinner?')) return
    const updated: Game = { ...game, status: 'finished' }
    saveGame(updated)
  }

  const sortedActive = [...activePlayers].sort((a, b) => scores[a] - scores[b])
  const elimReversed = [...game.eliminationOrder].reverse()
  const allSorted = [...sortedActive, ...elimReversed]

  const placementLabel = (player: string): string | null => {
    if (!eliminated.has(player)) return null
    const place = game.players.length - game.eliminationOrder.indexOf(player)
    return `${place}.`
  }

  return (
    <main>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Hjem</button>
        <span style={{
          fontSize: 13, color: groupColor, background: `${groupColor}18`,
          padding: '4px 12px', borderRadius: 20, fontWeight: 600,
        }}>
          {game.mode === 'normal' ? 'Normalt spill' : 'Kort spill'}
        </span>
      </div>

      <h1 style={{ marginBottom: 4 }}>{group?.name ?? 'Spill'}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        {game.status === 'active' ? `Runde ${roundNumber}` : 'Spillet er ferdig'}
      </p>

      {/* Final placements */}
      {game.status === 'finished' && game.finalPlacements.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderLeft: `4px solid ${groupColor}` }}>
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
              opacity: isOut ? 0.5 : 1,
              borderLeft: !isOut ? `3px solid ${groupColor}` : undefined,
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>{player}</span>
                {isOut && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--danger)' }}>
                    ute – {place} plass
                  </span>
                )}
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, color: isOut ? 'var(--text-muted)' : groupColor }}>
                {scores[player]}
              </span>
            </div>
          )
        })}
      </div>

      {game.status === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            style={{
              background: groupColor, color: 'white', border: 'none', borderRadius: 'var(--radius)',
              padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%',
            }}
            onClick={() => setShowRoundEntry(true)}
          >
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
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
              <button
                style={{
                  flex: 1, background: groupColor, color: 'white', border: 'none',
                  borderRadius: 'var(--radius)', padding: 13, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
                onClick={submitRound}
              >
                Bekreft runde
              </button>
              <button className="btn-ghost" onClick={() => setShowRoundEntry(false)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
