export interface Game {
  id: string;
  code: string;
  status: 'lobby' | 'playing' | 'finished';
  music_filter: {
    decades: string[];
    genres: string[];
    playlists: string[];
  };
  win_condition: number | null;
  current_team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  game_id: string;
  name: string;
  color: string;
  is_host: boolean;
  created_at: string;
}

export interface Card {
  id: string;
  team_id: string;
  song_name: string;
  artist_name: string;
  release_year: number;
  spotify_uri: string | null;
  is_start_card: boolean;
  created_at: string;
}

export interface CurrentRound {
  id: string;
  game_id: string;
  team_id: string;
  song_name: string;
  artist_name: string;
  release_year: number;
  spotify_uri: string | null;
  is_revealed: boolean;
  consecutive_correct: number;
  created_at: string;
}

export interface SpotifyTrack {
  name: string;
  artist: string;
  year: number;
  uri: string;
  previewUrl: string | null;
  albumImage: string | null;
}

export const TEAM_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export const DECADES = [
  { value: '1960', label: '60-tal' },
  { value: '1970', label: '70-tal' },
  { value: '1980', label: '80-tal' },
  { value: '1990', label: '90-tal' },
  { value: '2000', label: '00-tal' },
  { value: '2010', label: '10-tal' },
  { value: '2020', label: '20-tal' },
];

export const GENRES = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'r&b', label: 'R&B' },
  { value: 'electronic', label: 'Elektronisk' },
  { value: 'country', label: 'Country' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Klassisk' },
  { value: 'metal', label: 'Metal' },
  { value: 'indie', label: 'Indie' },
];