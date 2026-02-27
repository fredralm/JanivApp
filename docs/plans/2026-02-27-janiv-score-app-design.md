# Janiv Score App — Design Document

**Date:** 2026-02-27

## Overview

A lightweight PWA for tracking scores in the card game Janiv. One player acts as scorekeeper during a session. All UI text is in Norwegian. Data is stored locally on-device with export/import support for sharing between players.

---

## Tech Stack

- **Framework:** React + Vite
- **Routing:** React Router v6
- **Storage:** localStorage
- **PWA:** vite-plugin-pwa
- **Language:** TypeScript

---

## Data Model

```typescript
interface Group {
  id: string;
  name: string;
  players: string[];          // player display names
}

interface Round {
  scores: Record<string, number>;  // playerName -> raw points entered this round
}

interface Game {
  id: string;
  groupId: string;
  date: string;               // ISO date string
  players: string[];          // snapshot of players at game start
  mode: 'normal' | 'short';  // normalt spill or kort spill
  rounds: Round[];
  status: 'active' | 'finished';
  finalPlacements: string[];  // playerName[], index 0 = 1st place
  eliminationOrder: string[]; // players in order of elimination, first eliminated = last place
}
```

Storage keys in localStorage:
- `janiv_groups` — `Group[]`
- `janiv_games` — `Game[]`

---

## Score Calculation Rules

Applied after each round for each active player:

1. Add round score to running total
2. **Normalt spill:**
   - Exactly `100` → set to `50`
   - Exactly `200` → set to `150` (not eliminated)
   - `> 200` → player eliminated, assigned current last remaining placement
3. **Kort spill:**
   - Exactly `100` → set to `50` (not eliminated)
   - `> 100` → player eliminated, assigned current last remaining placement

Eliminations within the same round are resolved in input order. The last remaining active player wins (1st place).

---

## Pages

### `/` — Hjemside

- Lists all saved groups, each showing group name and player names
- **Ny gruppe** button → inline form to name the group and add players
- Each group card has:
  - **Start spill** → shows game mode selection (Normalt spill / Kort spill), then starts a new game
  - **Fortsett spill** → shown instead if an active game exists for this group
  - **Se statistikk** → navigates to stats filtered to this group
- **Eksporter data** → downloads `janiv-eksport-YYYY-MM-DD.json`
- **Importer data** → file picker, merges imported data into localStorage

### `/spill/:gameId` — Spillside

- Header: group name + current round number + game mode badge
- Player list showing: name, current score, status (aktiv / eliminated with placement)
- **Legg til runde** button → opens a panel listing all active players with number inputs for round scores
- After confirming:
  - Scores updated with rules applied
  - Eliminations assigned placements in reverse order
  - Game ends automatically when 1 player remains (they receive 1st place)
  - Final standings displayed
- **Avslutt spill** button for manually ending a game early (no winner recorded)

### `/statistikk` — Statistikkside

- List of all groups to select from
- Once selected: shows each player ranked by **total 1st place finishes** (normale + korte spill combined)
- Each player entry shows:
  - Total wins
  - Breakdown: `X normale spill · Y korte spill`
- Sorted descending by total wins

---

## Export / Import

- **Export:** serialises `{ groups: Group[], games: Game[] }` to a `.json` file download
- **Import:** parses uploaded `.json`, merges by `id` (no duplicates), adds new entries

---

## Game Modes (presented after "Start spill")

| Mode | Label | Elimination threshold | Special rules |
|------|-------|-----------------------|---------------|
| `normal` | Normalt spill | > 200 pts | Exactly 100 → 50, exactly 200 → 150 |
| `short` | Kort spill | > 100 pts | Exactly 100 → 50 |
