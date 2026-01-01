import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Game, Team, Card, CurrentRound } from '@/types/game';

export function useGame(gameId: string | null) {
  const [game, setGame] = useState<Game | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching game:', error);
      return;
    }
    
    if (data) {
      setGame(data as Game);
    }
  }, [gameId]);

  const fetchTeams = useCallback(async () => {
    if (!gameId) return;
    
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching teams:', error);
      return;
    }
    
    setTeams((data || []) as Team[]);
  }, [gameId]);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGame(), fetchTeams()]);
      setLoading(false);
    };

    loadData();

    // Subscribe to realtime updates
    const gameChannel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          console.log('Game update:', payload);
          if (payload.eventType === 'UPDATE') {
            setGame(payload.new as Game);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `game_id=eq.${gameId}` },
        (payload) => {
          console.log('Teams update:', payload);
          fetchTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [gameId, fetchGame, fetchTeams]);

  return { game, teams, loading, refetchGame: fetchGame, refetchTeams: fetchTeams };
}

export function useTeamCards(teamId: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!teamId) return;
    
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('team_id', teamId)
      .order('release_year', { ascending: true });
    
    if (error) {
      console.error('Error fetching cards:', error);
      return;
    }
    
    setCards((data || []) as Card[]);
  }, [teamId]);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await fetchCards();
      setLoading(false);
    };

    loadData();

    // Subscribe to realtime updates
    const cardsChannel = supabase
      .channel(`cards-${teamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `team_id=eq.${teamId}` },
        () => {
          fetchCards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cardsChannel);
    };
  }, [teamId, fetchCards]);

  return { cards, loading, refetchCards: fetchCards };
}

export function useCurrentRound(gameId: string | null) {
  const [currentRound, setCurrentRound] = useState<CurrentRound | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentRound = useCallback(async () => {
    if (!gameId) return;
    
    const { data, error } = await supabase
      .from('current_round')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching current round:', error);
      return;
    }
    
    setCurrentRound(data as CurrentRound | null);
  }, [gameId]);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await fetchCurrentRound();
      setLoading(false);
    };

    loadData();

    // Subscribe to realtime updates
    const roundChannel = supabase
      .channel(`round-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'current_round', filter: `game_id=eq.${gameId}` },
        () => {
          fetchCurrentRound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundChannel);
    };
  }, [gameId, fetchCurrentRound]);

  return { currentRound, loading, refetchCurrentRound: fetchCurrentRound };
}