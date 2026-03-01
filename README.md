# Janiv Score

En progressiv nettapp (PWA) for poengsporing i kortspillet Janiv. Appen er på norsk og fungerer offline etter første besøk.

## Om spillet

Janiv er et kortspill hvor spillere samler poeng over flere runder. Spillere som overstiger poenggrensen ryker ut, og den siste gjenværende spilleren vinner.

### Poenggrenser

| Modus | Eliminasjonsgrense | Spesialtregler |
|---|---|---|
| Normalt spill | > 200 poeng | Nøyaktig 200 → reduseres til 150 |
| Kort spill | > 100 poeng | — |

**Gjelder begge moduser:** Nøyaktig 100 poeng → reduseres til 50.

### Plasseringsrekkefølge

- Første spiller som ryker ut → siste plass
- Siste gjenværende spiller → vinner (1. plass)

## Funksjoner

- **Gruppeadministrasjon** – opprett og administrer grupper med spillere
- **To spillmoduser** – normalt spill (> 200) og kort spill (> 100)
- **Rundesporing** – legg inn poeng per runde med live oppdatering av poengtavle
- **Statistikkside** – spillere rangert etter totale seire, med fordeling på normale og korte spill
- **Eksport / import** – del spilldata som JSON-fil mellom enheter
- **PWA** – installer på telefonen og spill uten internett

## Kom i gang

### Krav

- Node.js 18 eller nyere

### Installasjon

```bash
npm install
```

### Utvikling

```bash
npm run dev
```

Åpne [http://localhost:5173](http://localhost:5173) i nettleseren.

### Bygg for produksjon

```bash
npm run build
```

### Kjør tester

```bash
npm test
```

## Teknologi

| Teknologi | Bruk |
|---|---|
| [React 19](https://react.dev) | UI-rammeverk |
| [TypeScript](https://www.typescriptlang.org) | Typesikkerhet |
| [Vite](https://vite.dev) | Byggverktøy og dev-server |
| [React Router v7](https://reactrouter.com) | Klientside-ruting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | PWA-støtte og service worker |
| [Vitest](https://vitest.dev) | Testrammeverk |
| [React Testing Library](https://testing-library.com) | Komponenttesting |

## Prosjektstruktur

```
src/
├── pages/
│   ├── HomePage.tsx          # Gruppeliste, opprett gruppe, start spill
│   ├── GamePage.tsx          # Poengtavle og runderegistrering
│   └── StatsPage.tsx         # Statistikk og seiersoversikt
├── types.ts                  # TypeScript-typer (Game, Group, Round …)
├── storage.ts                # localStorage-hjelper (getGroups, getGames …)
├── scoreLogic.ts             # Ren poenglogikk (applyRoundScore, isEliminated …)
├── gameEngine.ts             # Spilltilstand (processRound, computeScores)
├── index.css                 # Globale stiler og CSS-variabler (mørkt tema)
├── main.tsx                  # Inngangspunkt med ruter
└── test-setup.ts             # Testoppsett (localStorage-mock for Node v25)
```

## Installer som app

Åpne appen i Chrome eller Safari på mobil og trykk **«Legg til på hjem-skjerm»** (iOS) eller **«Installer app»** (Android/Chrome). Appen fungerer deretter offline og oppdaterer seg automatisk i bakgrunnen når ny versjon er tilgjengelig.
