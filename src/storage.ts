import type { Group, Game } from './types'

const GROUPS_KEY = 'janiv_groups'
const GAMES_KEY = 'janiv_games'

export function getGroups(): Group[] {
  const raw = localStorage.getItem(GROUPS_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export function saveGroups(groups: Group[]): void {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function getGames(): Game[] {
  const raw = localStorage.getItem(GAMES_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export function saveGames(games: Game[]): void {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games))
}
