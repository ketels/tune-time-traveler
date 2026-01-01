-- Create enum for game status
CREATE TYPE public.game_status AS ENUM ('lobby', 'playing', 'finished');

-- Create games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  status game_status NOT NULL DEFAULT 'lobby',
  music_filter JSONB DEFAULT '{"decades": [], "genres": [], "playlists": []}',
  win_condition INTEGER, -- null means unlimited/host decides
  current_team_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  is_host BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cards table (songs that teams have collected)
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  spotify_uri TEXT,
  is_start_card BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create current_round table (tracks the current song being guessed)
CREATE TABLE public.current_round (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  spotify_uri TEXT,
  is_revealed BOOLEAN NOT NULL DEFAULT false,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for current_team_id
ALTER TABLE public.games ADD CONSTRAINT fk_current_team FOREIGN KEY (current_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_round ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (this is a party game, no auth needed)
CREATE POLICY "Games are publicly accessible" ON public.games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Teams are publicly accessible" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cards are publicly accessible" ON public.cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Current round is publicly accessible" ON public.current_round FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.current_round;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for games updated_at
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();