// Local game state hook with broadcast sync
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  LocalGameState, 
  LocalTeam,
  createInitialGameState,
  addTeamToGame,
  startGame as startGameState,
  setCurrentRound,
  revealSong as revealSongState,
  handleCorrectGuess as handleCorrectGuessState,
  handleWrongGuess as handleWrongGuessState,
  passTurn as passTurnState,
  endGame as endGameState,
  saveGameState,
  loadGameState,
  clearGameState,
} from '@/lib/localGameState';
import { useBroadcast, BroadcastMessage } from './useBroadcast';

interface UseLocalGameOptions {
  gameCode?: string;
  isHost: boolean;
}

export function useLocalGame({ gameCode, isHost }: UseLocalGameOptions) {
  const [gameState, setGameState] = useState<LocalGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const pendingJoinRef = useRef<{ teamName: string; resolve: (team: LocalTeam) => void } | null>(null);

  // Handle incoming broadcast messages
  const handleMessage = useCallback((message: BroadcastMessage) => {
    if (!isHost) return;

    // Host handles team join requests
    if (message.type === 'team_join' && gameState) {
      const { teamName } = message.payload;
      console.log('[Host] Team join request:', teamName);
      
      const newState = addTeamToGame(gameState, teamName);
      const newTeam = newState.teams[newState.teams.length - 1];
      
      setGameState(newState);
      saveGameState(newState);
      
      // Broadcast updated state with team confirmation
      broadcast.broadcastGameState(newState);
      broadcast.sendMessage('team_joined', { 
        teamId: newTeam.id, 
        senderId: message.senderId 
      });
    }

    // Host handles guess submissions
    if (message.type === 'guess' && gameState?.currentRound) {
      console.log('[Host] Received guess:', message.payload);
      // Guess handling is done through explicit function calls from PlayerView
    }

    // Host handles pass requests
    if (message.type === 'pass' && gameState) {
      console.log('[Host] Team passed');
      const newState = passTurnState(gameState);
      setGameState(newState);
      saveGameState(newState);
      broadcast.broadcastGameState(newState);
    }
  }, [isHost, gameState]);

  // Handle game state updates for non-hosts
  const handleGameStateUpdate = useCallback((state: LocalGameState) => {
    console.log('[Client] Received game state update:', state.status);
    setGameState(state);
    setLoading(false);

    // Check if our pending join was confirmed
    if (pendingJoinRef.current) {
      const myDeviceId = localStorage.getItem('hitster_device_id');
      // Find the team that was just added (we'll match by checking team_joined message)
    }
  }, []);

  const broadcast = useBroadcast({
    gameCode: gameCode || gameState?.code || '',
    isHost,
    onMessage: handleMessage,
    onGameState: handleGameStateUpdate,
  });

  // Handle team_joined confirmation for clients
  useEffect(() => {
    if (isHost) return;

    const handleJoinConfirmation = (message: BroadcastMessage) => {
      if (message.type === 'team_joined') {
        const { teamId, senderId } = message.payload;
        const myDeviceId = localStorage.getItem('hitster_device_id');
        
        if (senderId === myDeviceId) {
          console.log('[Client] Join confirmed, my team ID:', teamId);
          setMyTeamId(teamId);
          localStorage.setItem('teamId', teamId);
          
          if (pendingJoinRef.current && gameState) {
            const team = gameState.teams.find(t => t.id === teamId);
            if (team) {
              pendingJoinRef.current.resolve(team);
              pendingJoinRef.current = null;
            }
          }
        }
      }
    };

    // This is handled in the main message handler, but we need to track team_joined
  }, [isHost, gameState]);

  // Initialize game state
  useEffect(() => {
    if (isHost) {
      // Try to load existing state or wait for creation
      const stored = loadGameState();
      if (stored && stored.code === gameCode) {
        setGameState(stored);
      }
      setLoading(false);
    } else {
      // Non-host: wait for state from broadcast
      setLoading(true);
      // Load stored team ID if we have one
      const storedTeamId = localStorage.getItem('teamId');
      if (storedTeamId) {
        setMyTeamId(storedTeamId);
      }
    }
  }, [isHost, gameCode]);

  // Broadcast state changes when host updates
  useEffect(() => {
    if (isHost && gameState && broadcast.isConnected) {
      broadcast.broadcastGameState(gameState);
    }
  }, [isHost, gameState, broadcast.isConnected]);

  // Host: Create a new game
  const createGame = useCallback((musicFilter: { decades: string[]; genres: string[] }) => {
    const newState = createInitialGameState(musicFilter);
    setGameState(newState);
    saveGameState(newState);
    return newState;
  }, []);

  // Client: Join a game
  const joinGame = useCallback(async (teamName: string): Promise<LocalTeam> => {
    return new Promise((resolve, reject) => {
      if (!broadcast.isConnected) {
        reject(new Error('Not connected to game'));
        return;
      }

      pendingJoinRef.current = { teamName, resolve };
      broadcast.requestJoin(teamName);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (pendingJoinRef.current) {
          pendingJoinRef.current = null;
          reject(new Error('Join request timed out'));
        }
      }, 10000);
    });
  }, [broadcast]);

  // Host: Start the game
  const startGame = useCallback(() => {
    if (!gameState) return;
    const newState = startGameState(gameState);
    setGameState(newState);
    saveGameState(newState);
    broadcast.broadcastGameState(newState);
  }, [gameState, broadcast]);

  // Host: Fetch and set a new song for the current round
  const fetchNewSong = useCallback(async () => {
    if (!gameState) return null;

    const { decades, genres } = gameState.musicFilter;
    const decade = decades.length > 0 ? decades[Math.floor(Math.random() * decades.length)] : null;
    
    // Get years to exclude (already on current team's timeline)
    const currentTeam = gameState.teams.find(t => t.id === gameState.currentTeamId);
    const excludeYears = currentTeam?.cards.map(c => c.releaseYear) || [];

    try {
      const { data, error } = await supabase.functions.invoke('spotify', {
        body: { action: 'search', decade, genres, excludeYears },
      });

      if (error) throw error;

      const song = {
        name: data.name,
        artist: data.artist,
        year: data.year,
        uri: data.uri,
        previewUrl: data.previewUrl || null,
        albumImage: data.albumImage || null,
      };

      const newState = setCurrentRound(gameState, song);
      setGameState(newState);
      saveGameState(newState);
      broadcast.broadcastGameState(newState);

      return song;
    } catch (error) {
      console.error('Failed to fetch song:', error);
      throw error;
    }
  }, [gameState, broadcast]);

  // Host: Reveal the current song
  const revealSong = useCallback(() => {
    if (!gameState) return;
    const newState = revealSongState(gameState);
    setGameState(newState);
    saveGameState(newState);
    broadcast.broadcastGameState(newState);
  }, [gameState, broadcast]);

  // Host: Handle correct guess
  const handleCorrectGuess = useCallback(() => {
    if (!gameState) return;
    const newState = handleCorrectGuessState(gameState);
    setGameState(newState);
    saveGameState(newState);
    broadcast.broadcastGameState(newState);
  }, [gameState, broadcast]);

  // Host: Handle wrong guess
  const handleWrongGuess = useCallback(() => {
    if (!gameState) return;
    const newState = handleWrongGuessState(gameState);
    setGameState(newState);
    saveGameState(newState);
    broadcast.broadcastGameState(newState);
  }, [gameState, broadcast]);

  // Host: Pass turn
  const passTurn = useCallback(() => {
    if (!gameState) return;
    const newState = passTurnState(gameState);
    setGameState(newState);
    saveGameState(newState);
    broadcast.broadcastGameState(newState);
  }, [gameState, broadcast]);

  // Host: End game
  const endGame = useCallback(() => {
    if (!gameState) return;
    const newState = endGameState(gameState);
    setGameState(newState);
    saveGameState(newState);
    broadcast.broadcastGameState(newState);
  }, [gameState, broadcast]);

  // Clear local state
  const clearGame = useCallback(() => {
    clearGameState();
    setGameState(null);
    setMyTeamId(null);
    localStorage.removeItem('teamId');
    localStorage.removeItem('gameId');
  }, []);

  // Get my team data
  const myTeam = gameState?.teams.find(t => t.id === myTeamId) || null;
  const currentTeam = gameState?.teams.find(t => t.id === gameState.currentTeamId) || null;
  const isMyTurn = myTeamId === gameState?.currentTeamId;

  return {
    gameState,
    loading,
    isConnected: broadcast.isConnected,
    myTeam,
    myTeamId,
    currentTeam,
    isMyTurn,
    
    // Host actions
    createGame,
    startGame,
    fetchNewSong,
    revealSong,
    handleCorrectGuess,
    handleWrongGuess,
    passTurn,
    endGame,
    clearGame,
    
    // Client actions
    joinGame,
    submitGuess: broadcast.submitGuess,
    requestPass: broadcast.passTurn,
    continueGame: broadcast.continueGame,
  };
}
