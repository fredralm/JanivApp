export type GameMode = 'normal' | 'short'
export type GameStatus = 'active' | 'finished'

export interface Group {
  id: string
  name: string
  players: string[]
  color?: string
}

export interface Round {
  scores: Record<string, number>  // playerName -> raw points entered
}

export interface Game {
  id: string
  groupId: string
  date: string               // ISO date string
  players: string[]
  color?: string          // snapshot of players at game start
  mode: GameMode
  rounds: Round[]
  status: GameStatus
  finalPlacements: string[]  // index 0 = 1st place winner
  eliminationOrder: string[] // first eliminated = last place
}
