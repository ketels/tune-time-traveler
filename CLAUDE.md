# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tune Time Traveler** is a multiplayer music timeline game inspired by Hitster. Players join teams via QR codes or game codes, listen to songs, and guess where they fit chronologically on their team's timeline. Built with React, Vite, TypeScript, and Supabase.

## Common Commands

```bash
# Development
npm run dev              # Start dev server on port 8080
npm run build           # Production build
npm run build:dev       # Development build
npm run preview         # Preview production build
npm run lint            # Run ESLint

# Supabase (if using local development)
npx supabase start      # Start local Supabase
npx supabase stop       # Stop local Supabase

# Supabase Edge Functions
npx supabase functions deploy spotify-token  # Deploy Spotify token exchange function
npx supabase secrets set KEY="value"         # Set edge function secrets
```

## CI/CD

### Deployments

**Production (main branch):**
- Automatically deployed to `https://ketels.github.io/tune-time-traveler/`
- Triggered on push to `main`
- Uses `.github/workflows/deploy.yml`

**PR Previews:**
- Automatically deployed for every pull request
- URL: `https://ketels.github.io/tune-time-traveler/pr-{NUMBER}/`
- Cleaned up when PR is closed
- Uses `.github/workflows/preview.yml`
- See `PREVIEW_DEPLOYMENTS.md` for details

### Testing Spotify OAuth in PRs
When testing Spotify login in a PR preview, add the preview redirect URI to Spotify:
```
https://ketels.github.io/tune-time-traveler/pr-{NUMBER}/callback
```

## Architecture

### State Management: Local-First with Broadcast Sync

The game uses a **local-first architecture** with Supabase Realtime Broadcast for multi-device synchronization:

- **Host** maintains authoritative game state in `useLocalGame` hook
- **Clients** receive state updates via Supabase Realtime broadcast channel
- State persists in localStorage (`hitster_game_state`) on the host device
- No Supabase database tables are used for game state - everything is in-memory/localStorage

**Key Files:**
- `src/lib/localGameState.ts` - Pure state functions (createGame, addTeam, handleGuess, etc.)
- `src/hooks/useLocalGame.ts` - Host state management with broadcast integration
- `src/hooks/useBroadcast.ts` - Supabase Realtime channel wrapper for message passing

**Message Flow:**
1. Client sends action (e.g., `team_join`, `guess`) via broadcast
2. Host receives message, updates local state, broadcasts new state
3. All clients receive `game_state` message and update UI

### Device Identification

Each device gets a persistent `hitster_device_id` UUID stored in localStorage. This is used for:
- Identifying which broadcast messages are for this device
- Presence tracking in Supabase Realtime

### Game Flow

1. **Lobby** (`/create`, `/join`, `/host/:gameCode`, `/lobby/:gameCode`)
   - Host creates game with music filters (decades, genres)
   - Teams join by scanning QR code or entering game code
   - Each team gets a random start card with a year

2. **Playing** (`/player/:gameCode`, `/team/:gameCode`)
   - Host fetches songs from Spotify via edge function
   - Current team guesses where song fits on their timeline
   - Correct: card added, can continue or pass
   - Wrong: if consecutive correct > 0, remove last card and pass to next team

3. **Results** (`/results/:gameCode`)
   - Teams sorted by card count (excluding start cards)

### Spotify Integration

Supabase Edge Function at `supabase/functions/spotify/index.ts`:
- Uses Spotify API with client credentials flow
- Searches tracks filtered by decade/genre/market (Sweden)
- Returns: name, artist, year, URI, preview URL, album image
- Excludes years already on current team's timeline

**Environment Variables Required:**
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

### Page Responsibilities

- **Index.tsx** - Landing page with create/join options
- **CreateGame.tsx** - Host selects music filters and creates game
- **JoinGame.tsx** - Teams enter game code to join
- **HostLobby.tsx** - Host waits for teams to join, can start game
- **TeamLobby.tsx** - Team waits for host to start
- **PlayerView.tsx** - Individual player view during active round (shows song, timeline)
- **TeamView.tsx** - Team captain/host view during gameplay
- **Results.tsx** - Final scores and leaderboard

### UI Components

Built with **shadcn/ui** (Radix UI primitives + Tailwind):
- All UI components in `src/components/ui/`
- Custom components: `AudioPlayer`, `Timeline`, `GameCard`, `QRCode`
- Uses CSS custom properties for theming (see `src/index.css`)

### Key Hooks

- `useLocalGame({ gameCode, isHost })` - Main game state hook
- `useBroadcast({ gameCode, isHost, onMessage, onGameState })` - Realtime sync
- `use-toast.ts` - Toast notifications (from shadcn)

### Routing

All routes defined in `src/App.tsx`:
```
/ -> Index
/create -> CreateGame (host)
/join -> JoinGame (team)
/host/:gameCode -> HostLobby
/lobby/:gameCode -> TeamLobby
/player/:gameCode -> PlayerView
/team/:gameCode -> TeamView
/results/:gameCode -> Results
```

## Important Notes

- **Language**: UI text is in Swedish (e.g., "Skapa nytt spel", "Gå med i spel")
- **TypeScript**: Loose config (`noImplicitAny: false`, `strictNullChecks: false`)
- **Path Alias**: `@/*` maps to `src/*`
- **Device Persistence**: Game codes and team IDs stored in localStorage
- **No Database**: Game state is not persisted to Supabase tables, only synced via broadcast

## Common Pitfalls

1. **Broadcast Message Handling**: Use refs for callbacks in `useBroadcast` to avoid re-subscription loops
2. **Team Join Timeout**: Default timeout is 10 seconds (see `useLocalGame.ts:186`)
3. **State Sync**: Always broadcast state after host makes changes
4. **Consecutive Correct**: Penalty mechanism - wrong guess after streak removes last card
5. **Start Cards**: Always filter out `isStartCard: true` when calculating scores
