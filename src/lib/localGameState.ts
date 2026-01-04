// Local-first game state management with Supabase Broadcast sync

export interface LocalCard {
  id: string;
  songName: string;
  artistName: string;
  releaseYear: number;
  spotifyUri: string | null;
  isStartCard: boolean;
}

export interface LocalTeam {
  id: string;
  name: string;
  color: string;
  cards: LocalCard[];
}

export interface LocalCurrentRound {
  id: string;
  teamId: string;
  song: {
    name: string;
    artist: string;
    year: number;
    uri: string;
    previewUrl: string | null;
    albumImage: string | null;
  };
  isRevealed: boolean;
  consecutiveCorrect: number;
}

export interface LocalGameState {
  code: string;
  status: 'lobby' | 'playing' | 'finished';
  currentTeamId: string | null;
  musicFilter: {
    decades: string[];
    genres: string[];
  };
  teams: LocalTeam[];
  currentRound: LocalCurrentRound | null;
}

// Team colors
export const TEAM_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

// Generate a random game code
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Generate a random start year for initial card
export function getRandomStartYear(): number {
  const decades = [1960, 1970, 1980, 1990, 2000, 2010, 2020];
  const decade = decades[Math.floor(Math.random() * decades.length)];
  return decade + Math.floor(Math.random() * 10);
}

// Create initial game state
export function createInitialGameState(musicFilter: { decades: string[]; genres: string[] }): LocalGameState {
  return {
    code: generateGameCode(),
    status: 'lobby',
    currentTeamId: null,
    musicFilter,
    teams: [],
    currentRound: null,
  };
}

// Add a team to the game
export function addTeamToGame(state: LocalGameState, teamName: string): LocalGameState {
  const usedColors = state.teams.map(t => t.color);
  const availableColor = TEAM_COLORS.find(c => !usedColors.includes(c)) || TEAM_COLORS[0];
  
  const startYear = getRandomStartYear();
  const newTeam: LocalTeam = {
    id: crypto.randomUUID(),
    name: teamName,
    color: availableColor,
    cards: [{
      id: crypto.randomUUID(),
      songName: 'Startkort',
      artistName: '',
      releaseYear: startYear,
      spotifyUri: null,
      isStartCard: true,
    }],
  };

  return {
    ...state,
    teams: [...state.teams, newTeam],
  };
}

// Start the game
export function startGame(state: LocalGameState): LocalGameState {
  if (state.teams.length === 0) return state;
  
  return {
    ...state,
    status: 'playing',
    currentTeamId: state.teams[0].id,
  };
}

// Set current round with new song
export function setCurrentRound(
  state: LocalGameState, 
  song: { name: string; artist: string; year: number; uri: string; previewUrl: string | null; albumImage: string | null }
): LocalGameState {
  if (!state.currentTeamId) return state;
  
  return {
    ...state,
    currentRound: {
      id: crypto.randomUUID(),
      teamId: state.currentTeamId,
      song,
      isRevealed: false,
      consecutiveCorrect: state.currentRound?.consecutiveCorrect || 0,
    },
  };
}

// Reveal the current song
export function revealSong(state: LocalGameState): LocalGameState {
  if (!state.currentRound) return state;
  
  return {
    ...state,
    currentRound: {
      ...state.currentRound,
      isRevealed: true,
    },
  };
}

// Handle correct guess - add card to team
export function handleCorrectGuess(state: LocalGameState): LocalGameState {
  if (!state.currentRound || !state.currentTeamId) return state;
  
  const newCard: LocalCard = {
    id: crypto.randomUUID(),
    songName: state.currentRound.song.name,
    artistName: state.currentRound.song.artist,
    releaseYear: state.currentRound.song.year,
    spotifyUri: state.currentRound.song.uri,
    isStartCard: false,
  };

  const consecutiveCorrect = (state.currentRound.consecutiveCorrect || 0) + 1;

  return {
    ...state,
    teams: state.teams.map(team => 
      team.id === state.currentTeamId 
        ? { ...team, cards: [...team.cards, newCard] }
        : team
    ),
    currentRound: {
      ...state.currentRound,
      consecutiveCorrect,
    },
  };
}

// Handle wrong guess - possibly remove last won card and switch team
export function handleWrongGuess(state: LocalGameState): LocalGameState {
  if (!state.currentRound || !state.currentTeamId) return state;
  
  const consecutiveCorrect = state.currentRound.consecutiveCorrect || 0;
  
  // Remove last won card if they had consecutive correct guesses
  let updatedTeams = state.teams;
  if (consecutiveCorrect > 0) {
    updatedTeams = state.teams.map(team => {
      if (team.id === state.currentTeamId) {
        const nonStartCards = team.cards.filter(c => !c.isStartCard);
        if (nonStartCards.length > 0) {
          // Remove the last non-start card
          const lastCardId = nonStartCards[nonStartCards.length - 1].id;
          return { ...team, cards: team.cards.filter(c => c.id !== lastCardId) };
        }
      }
      return team;
    });
  }

  // Switch to next team
  const currentIndex = state.teams.findIndex(t => t.id === state.currentTeamId);
  const nextIndex = (currentIndex + 1) % state.teams.length;
  const nextTeamId = state.teams[nextIndex].id;

  return {
    ...state,
    teams: updatedTeams,
    currentTeamId: nextTeamId,
    currentRound: null,
  };
}

// Pass turn to next team
export function passTurn(state: LocalGameState): LocalGameState {
  if (!state.currentTeamId) return state;
  
  const currentIndex = state.teams.findIndex(t => t.id === state.currentTeamId);
  const nextIndex = (currentIndex + 1) % state.teams.length;
  const nextTeamId = state.teams[nextIndex].id;

  return {
    ...state,
    currentTeamId: nextTeamId,
    currentRound: null,
  };
}

// End the game
export function endGame(state: LocalGameState): LocalGameState {
  return {
    ...state,
    status: 'finished',
    currentRound: null,
  };
}

// Get sorted teams by score (card count)
export function getSortedTeamsByScore(state: LocalGameState): LocalTeam[] {
  return [...state.teams].sort((a, b) => {
    const aScore = a.cards.filter(c => !c.isStartCard).length;
    const bScore = b.cards.filter(c => !c.isStartCard).length;
    return bScore - aScore;
  });
}

// Local storage helpers
const GAME_STATE_KEY = 'hitster_game_state';

export function saveGameState(state: LocalGameState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(): LocalGameState | null {
  try {
    const stored = localStorage.getItem(GAME_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load game state:', error);
  }
  return null;
}

export function clearGameState(): void {
  localStorage.removeItem(GAME_STATE_KEY);
}
