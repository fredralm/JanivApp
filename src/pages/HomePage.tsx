import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGroups, saveGroups, getGames, saveGames } from '../storage'
import { GROUP_COLORS, DEFAULT_GROUP_COLOR, randomGroupColor } from '../colors'
import type { Group, Game, GameMode } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>(getGroups)
  const [showForm, setShowForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupColor, setGroupColor] = useState<string>(randomGroupColor)
  const [players, setPlayers] = useState<string[]>([])
  const [playerInput, setPlayerInput] = useState('')
  const [modeModal, setModeModal] = useState<Group | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Group | null>(null)
  const [exportModal, setExportModal] = useState(false)
  const [exportSelected, setExportSelected] = useState<Set<string>>(new Set())
  const [exportCopied, setExportCopied] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

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
      color: groupColor,
    }
    const updated = [...groups, newGroup]
    saveGroups(updated)
    setGroups(updated)
    setGroupName('')
    setPlayers([])
    setGroupColor(randomGroupColor())
    setShowForm(false)
  }

  function deleteGroup(group: Group) {
    const updatedGroups = groups.filter(g => g.id !== group.id)
    const updatedGames = getGames().filter(g => g.groupId !== group.id)
    saveGroups(updatedGroups)
    saveGames(updatedGames)
    setGroups(updatedGroups)
    setDeleteConfirm(null)
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

  function openExportModal() {
    setExportSelected(new Set(groups.map(g => g.id)))
    setExportModal(true)
  }

  function toggleExportGroup(id: string) {
    setExportSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function buildExportJson() {
    const selectedGroups = getGroups().filter(g => exportSelected.has(g.id))
    const selectedIds = new Set(selectedGroups.map(g => g.id))
    const selectedGames = getGames().filter(g => selectedIds.has(g.groupId))
    return JSON.stringify({ groups: selectedGroups, games: selectedGames }, null, 2)
  }

  async function copyExport() {
    const json = buildExportJson()
    await navigator.clipboard.writeText(json)
    setExportCopied(true)
    setTimeout(() => setExportCopied(false), 2000)
  }

  async function shareExport() {
    const json = buildExportJson()
    const date = new Date().toISOString().slice(0, 10)
    if (navigator.share) {
      await navigator.share({ title: `Janiv eksport ${date}`, text: json })
    } else {
      await navigator.clipboard.writeText(json)
      setExportCopied(true)
      setTimeout(() => setExportCopied(false), 2000)
    }
  }

  function doImport() {
    setImportError('')
    try {
      const imported = JSON.parse(importText)
      if (!Array.isArray(imported.groups) || !Array.isArray(imported.games)) {
        setImportError('Ugyldig format — mangler groups/games')
        return
      }
      const existingGroups = getGroups()
      const existingGames = getGames()
      const mergedGroups = [
        ...existingGroups,
        ...(imported.groups as Group[]).filter(g => !existingGroups.find(eg => eg.id === g.id))
      ]
      const mergedGames = [
        ...existingGames,
        ...(imported.games as Game[]).filter(g => !existingGames.find(eg => eg.id === g.id))
      ]
      saveGroups(mergedGroups)
      saveGames(mergedGames)
      setGroups(mergedGroups)
      setImportModal(false)
      setImportText('')
    } catch {
      setImportError('Ugyldig JSON — sjekk at du kopierte hele teksten')
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    zIndex: 100,
  }

  return (
    <main>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>Janiv Score</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 }}>Kortspill-poengsporing</p>
      </div>

      {/* Groups */}
      {groups.length > 0 && <p className="section-label">Grupper</p>}

      {groups.length === 0 && !showForm && (
        <div className="card" style={{ marginBottom: 16, textAlign: 'center', padding: '28px 16px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Ingen grupper ennå</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Opprett en gruppe for å starte!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {groups.map(group => {
          const activeGame = getActiveGame(group.id)
          const color = group.color ?? DEFAULT_GROUP_COLOR
          return (
            <div
              key={group.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/statistikk?gruppe=${group.id}`)}
            >
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'center' }}>
                {/* Colored avatar */}
                <div style={{
                  width: 46, height: 46, borderRadius: '50%', background: color, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 20,
                }}>
                  {group.name[0]?.toUpperCase() ?? '?'}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 17 }}>{group.name}</strong>
                    {activeGame && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: `${color}22`, color: color,
                      }}>
                        ● Pågående
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.players.join(', ')}
                  </p>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{
                    flex: 1, background: color, color: 'white', borderRadius: 10,
                    padding: '9px 14px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}
                  onClick={e => { e.stopPropagation(); activeGame ? navigate(`/spill/${activeGame.id}`) : setModeModal(group) }}
                >
                  {activeGame ? 'Fortsett spill' : 'Start spill'}
                </button>
                <button
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--danger)',
                    fontSize: 14, fontWeight: 600, padding: '9px 10px', cursor: 'pointer', borderRadius: 10,
                  }}
                  onClick={e => { e.stopPropagation(); setDeleteConfirm(group) }}
                >
                  Slett
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* New group form or button */}
      {showForm ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginBottom: 16 }}>Ny gruppe</h2>

          {/* Avatar preview + name input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: groupColor, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 22,
            }}>
              {(groupName[0] || '?').toUpperCase()}
            </div>
            <input
              placeholder="Gruppenavn"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Gruppefarge</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {GROUP_COLORS.map(color => (
                <button
                  key={color}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', background: color, padding: 0,
                    border: groupColor === color ? '3px solid var(--text)' : '3px solid transparent',
                    outline: groupColor === color ? '2px solid white' : 'none',
                    outlineOffset: -5,
                  }}
                  onClick={() => setGroupColor(color)}
                />
              ))}
              <button
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: 'var(--surface2)',
                  border: '1.5px dashed var(--text-muted)', fontSize: 15, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={() => setGroupColor(randomGroupColor())}
                title="Tilfeldig farge"
              >
                🎲
              </button>
            </div>
          </div>

          {/* Players */}
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
            <button className="btn-primary" onClick={createGroup} style={{ flex: 1 }}>
              Opprett gruppe
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button
          style={{
            width: '100%', background: 'var(--surface)', border: '1.5px dashed rgba(0,0,0,0.15)',
            borderRadius: 'var(--radius)', padding: 14, fontSize: 16, fontWeight: 600,
            color: 'var(--accent)', cursor: 'pointer', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow)',
          }}
          onClick={() => { setShowForm(true); setGroupColor(randomGroupColor()) }}
        >
          + Ny gruppe
        </button>
      )}

      {/* Export / Import */}
      <p className="section-label">Data</p>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <button
          style={{
            width: '100%', background: 'transparent', border: 'none', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            borderBottom: '1px solid var(--border)',
          }}
          onClick={openExportModal}
        >
          <span style={{
            width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.15)',
            color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>↑</span>
          <span style={{ flex: 1, fontSize: 16, color: 'var(--text)', fontWeight: 500, textAlign: 'left' }}>Eksporter data</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>›</span>
        </button>
        <button
          style={{
            width: '100%', background: 'transparent', border: 'none', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}
          onClick={() => { setImportText(''); setImportError(''); setImportModal(true) }}
        >
          <span style={{
            width: 32, height: 32, borderRadius: 8, background: 'rgba(2,132,199,0.15)',
            color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>↓</span>
          <span style={{ flex: 1, fontSize: 16, color: 'var(--text)', fontWeight: 500, textAlign: 'left' }}>Importer data</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>›</span>
        </button>
      </div>

      {/* Export modal */}
      {exportModal && (
        <div style={overlayStyle}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 4 }}>Eksporter grupper</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Velg hvilke grupper som skal eksporteres
            </p>
            {groups.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Ingen grupper å eksportere.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {groups.map(group => {
                  const color = group.color ?? DEFAULT_GROUP_COLOR
                  return (
                    <label key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={exportSelected.has(group.id)}
                        onChange={() => toggleExportGroup(group.id)}
                        style={{ width: 18, height: 18, accentColor: color, cursor: 'pointer' }}
                      />
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {group.name[0]?.toUpperCase()}
                      </div>
                      <span>
                        <strong>{group.name}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>
                          {group.players.join(', ')}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  onClick={copyExport}
                  disabled={exportSelected.size === 0}
                  style={{ flex: 1, opacity: exportSelected.size === 0 ? 0.5 : 1 }}
                >
                  {exportCopied ? 'Kopiert!' : 'Kopier JSON'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={shareExport}
                  disabled={exportSelected.size === 0}
                  style={{ flex: 1, opacity: exportSelected.size === 0 ? 0.5 : 1 }}
                >
                  Del...
                </button>
              </div>
              <button className="btn-ghost" onClick={() => setExportModal(false)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {importModal && (
        <div style={overlayStyle}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 4 }}>Importer data</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Lim inn eksportert JSON-tekst nedenfor
            </p>
            <textarea
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError('') }}
              placeholder='{"groups": [...], "games": [...]}'
              rows={8}
              style={{
                width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: 12,
                background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 10, resize: 'vertical', marginBottom: 8,
              }}
            />
            {importError && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{importError}</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                onClick={doImport}
                disabled={!importText.trim()}
                style={{ flex: 1, opacity: importText.trim() ? 1 : 0.5 }}
              >
                Importer
              </button>
              <button className="btn-ghost" onClick={() => setImportModal(false)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div style={overlayStyle}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 8 }}>Slett gruppe</h2>
            <p style={{ marginBottom: 8 }}>
              Er du sikker på at du vil slette <strong>{deleteConfirm.name}</strong>?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Dette vil slette gruppen og all spillhistorikk tilknyttet den. Kan ikke angres.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  flex: 1, background: 'var(--danger)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius)', padding: 13, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
                onClick={() => deleteGroup(deleteConfirm)}
              >
                Ja, slett
              </button>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}

      {/* Game mode modal */}
      {modeModal && (
        <div style={overlayStyle}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 16 }}>Velg spillmodus</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                style={{
                  background: modeModal.color ?? DEFAULT_GROUP_COLOR, color: 'white', border: 'none',
                  borderRadius: 'var(--radius)', padding: 14, fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', textAlign: 'left',
                }}
                onClick={() => { startGame(modeModal, 'normal'); setModeModal(null) }}
              >
                Normalt spill
                <span style={{ display: 'block', fontSize: 13, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
                  Spill opp til 200 poeng
                </span>
              </button>
              <button
                className="btn-secondary"
                style={{ padding: 14, textAlign: 'left' }}
                onClick={() => { startGame(modeModal, 'short'); setModeModal(null) }}
              >
                Kort spill
                <span style={{ display: 'block', fontSize: 13, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>
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
