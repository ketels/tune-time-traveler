-- Add preview_url and album_image columns to current_round
ALTER TABLE public.current_round 
ADD COLUMN preview_url TEXT,
ADD COLUMN album_image TEXT;