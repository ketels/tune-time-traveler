import { supabase } from '@/integrations/supabase/client';
import { TEAM_COLORS } from '@/types/game';

function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getRandomStartYear(): number {
  const decades = [1960, 1970, 1980, 1990, 2000, 2010, 2020];
  const decade = decades[Math.floor(Math.random() * decades.length)];
  return decade + Math.floor(Math.random() * 10);
}

export async function createGame(musicFilter: { decades: string[]; genres: string[] }) {
  const code = generateGameCode();
  
  const { data: game, error } = await supabase
    .from('games')
    .insert({
      code,
      status: 'lobby',
      music_filter: { ...musicFilter, playlists: [] },
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating game:', error);
    throw error;
  }

  return game;
}

export async function joinGame(gameCode: string) {
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('code', gameCode.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error('Error finding game:', error);
    throw error;
  }

  if (!game) {
    throw new Error('Spelet hittades inte');
  }

  if (game.status !== 'lobby') {
    throw new Error('Spelet har redan startat');
  }

  return game;
}

export async function createTeam(gameId: string, name: string, isHost: boolean = false) {
  // Get existing teams to determine color
  const { data: existingTeams } = await supabase
    .from('teams')
    .select('color')
    .eq('game_id', gameId);

  const usedColors = (existingTeams || []).map(t => t.color);
  const availableColor = TEAM_COLORS.find(c => !usedColors.includes(c)) || TEAM_COLORS[0];

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      game_id: gameId,
      name,
      color: availableColor,
      is_host: isHost,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating team:', error);
    throw error;
  }

  // Create start card for the team
  const startYear = getRandomStartYear();
  await supabase
    .from('cards')
    .insert({
      team_id: team.id,
      song_name: 'Startår',
      artist_name: '',
      release_year: startYear,
      is_start_card: true,
    });

  return team;
}

export async function startGame(gameId: string, firstTeamId: string) {
  const { error } = await supabase
    .from('games')
    .update({
      status: 'playing',
      current_team_id: firstTeamId,
    })
    .eq('id', gameId);

  if (error) {
    console.error('Error starting game:', error);
    throw error;
  }
}

export async function fetchNewSong(decade: string | null, genres: string[], excludeYears: number[]) {
  const { data, error } = await supabase.functions.invoke('spotify', {
    body: {
      action: 'search',
      decade,
      genres,
      excludeYears,
    },
  });

  if (error) {
    console.error('Error fetching song:', error);
    throw error;
  }

  return data;
}

export async function createRound(
  gameId: string,
  teamId: string,
  song: { name: string; artist: string; year: number; uri: string; previewUrl?: string | null; albumImage?: string | null }
) {
  // Delete any existing rounds for this game
  await supabase
    .from('current_round')
    .delete()
    .eq('game_id', gameId);

  const { data, error } = await supabase
    .from('current_round')
    .insert({
      game_id: gameId,
      team_id: teamId,
      song_name: song.name,
      artist_name: song.artist,
      release_year: song.year,
      spotify_uri: song.uri,
      preview_url: song.previewUrl || null,
      album_image: song.albumImage || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating round:', error);
    throw error;
  }

  return data;
}

export async function revealSong(roundId: string) {
  const { error } = await supabase
    .from('current_round')
    .update({ is_revealed: true })
    .eq('id', roundId);

  if (error) {
    console.error('Error revealing song:', error);
    throw error;
  }
}

export async function handleCorrectGuess(
  roundId: string,
  teamId: string,
  song: { name: string; artist: string; year: number; uri: string },
  consecutiveCorrect: number
) {
  // Add the card to the team
  await supabase
    .from('cards')
    .insert({
      team_id: teamId,
      song_name: song.name,
      artist_name: song.artist,
      release_year: song.year,
      spotify_uri: song.uri,
    });

  // Update consecutive correct count
  await supabase
    .from('current_round')
    .update({ consecutive_correct: consecutiveCorrect + 1 })
    .eq('id', roundId);
}

export async function handleWrongGuess(
  gameId: string,
  teamId: string,
  consecutiveCorrect: number,
  nextTeamId: string
) {
  // If they had consecutive correct guesses and chose to continue, remove the first card
  if (consecutiveCorrect > 0) {
    const { data: cards } = await supabase
      .from('cards')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_start_card', false)
      .order('created_at', { ascending: false })
      .limit(consecutiveCorrect);

    if (cards && cards.length > 0) {
      // Remove the most recently won card
      await supabase
        .from('cards')
        .delete()
        .eq('id', cards[0].id);
    }
  }

  // Switch to next team
  await supabase
    .from('games')
    .update({ current_team_id: nextTeamId })
    .eq('id', gameId);

  // Clear current round
  await supabase
    .from('current_round')
    .delete()
    .eq('game_id', gameId);
}

export async function passTurn(gameId: string, nextTeamId: string) {
  await supabase
    .from('games')
    .update({ current_team_id: nextTeamId })
    .eq('id', gameId);

  await supabase
    .from('current_round')
    .delete()
    .eq('game_id', gameId);
}

export async function endGame(gameId: string) {
  await supabase
    .from('games')
    .update({ status: 'finished' })
    .eq('id', gameId);
}