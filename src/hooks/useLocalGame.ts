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
  
  // Store gameState in ref so message handlers can access latest value
  const gameStateRef = useRef<LocalGameState | null>(null);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Store broadcast ref for use in handleMessage
  const broadcastRef = useRef<ReturnType<typeof useBroadcast> | null>(null);

  // Handle incoming broadcast messages - stable callback using refs
  const handleMessage = useCallback((message: BroadcastMessage) => {
    const currentGameState = gameStateRef.current;
    const currentBroadcast = broadcastRef.current;

    // CLIENT: Handle team_joined confirmation
    if (!isHost && message.type === 'team_joined') {
      const { teamId, senderId, teamName, teamColor } = message.payload;
      const myDeviceId = localStorage.getItem('hitster_device_id');
      
      if (senderId === myDeviceId) {
        console.log('[Client] Join confirmed, my team ID:', teamId);
        setMyTeamId(teamId);
        localStorage.setItem('teamId', teamId);
        
        // Resolve pending join with team data from message (not from state)
        if (pendingJoinRef.current) {
          const team: LocalTeam = {
            id: teamId,
            name: teamName || pendingJoinRef.current.teamName,
            color: teamColor || '#8B5CF6',
            cards: [],
          };
          pendingJoinRef.current.resolve(team);
          pendingJoinRef.current = null;
        }
      }
      return;
    }

    // HOST only: handle join requests and other actions
    if (!isHost) return;

    // Host handles team join requests
    if (message.type === 'team_join' && currentGameState && currentBroadcast) {
      const { teamName, requestState } = message.payload;
      
      // If this is just a state request (from presence join), broadcast current state
      if (requestState) {
        console.log('[Host] New client requesting state, broadcasting...');
        currentBroadcast.broadcastGameState(currentGameState);
        return;
      }
      
      console.log('[Host] Team join request:', teamName);
      
      const newState = addTeamToGame(currentGameState, teamName);
      const newTeam = newState.teams[newState.teams.length - 1];
      
      setGameState(newState);
      saveGameState(newState);
      
      // Broadcast updated state with team confirmation
      currentBroadcast.broadcastGameState(newState);
      currentBroadcast.sendMessage('team_joined', { 
        teamId: newTeam.id, 
        teamName: newTeam.name,
        teamColor: newTeam.color,
        senderId: message.senderId 
      });
    }

    // Host handles guess submissions
    if (message.type === 'guess' && currentGameState?.currentRound) {
      console.log('[Host] Received guess:', message.payload);
      // Guess handling is done through explicit function calls from PlayerView
    }

    // Host handles pass requests
    if (message.type === 'pass' && currentGameState && currentBroadcast) {
      console.log('[Host] Team passed');
      const newState = passTurnState(currentGameState);
      setGameState(newState);
      saveGameState(newState);
      currentBroadcast.broadcastGameState(newState);
    }
  }, [isHost]); // Only depends on isHost

  // Handle game state updates for non-hosts
  const handleGameStateUpdate = useCallback((state: LocalGameState) => {
    console.log('[Client] Received game state update:', state.status);
    setGameState(state);
    setLoading(false);
  }, []);

  const broadcast = useBroadcast({
    gameCode: gameCode || gameState?.code || '',
    isHost,
    onMessage: handleMessage,
    onGameState: handleGameStateUpdate,
  });
  
  // Store broadcast in ref for message handlers
  useEffect(() => {
    broadcastRef.current = broadcast;
  }, [broadcast]);

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
