import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

async function getSpotifyToken(): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  console.log('Got Spotify token');
  return data.access_token;
}

async function searchTrack(token: string, decade: string, genres: string[], excludeYears: number[]): Promise<any> {
  const market = 'SE';

  const pickFromTracks = (tracks: any[], requirePreview: boolean) => {
    const yearOk = (track: any) => {
      const releaseYear = new Date(track.album.release_date).getFullYear();
      return !excludeYears.includes(releaseYear);
    };

    const candidates = tracks.filter((t: any) => yearOk(t) && (!requirePreview || !!t.preview_url));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const doSearch = async (q: string, offset: number) => {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=50&offset=${offset}&market=${market}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return (data.tracks?.items || []) as any[];
  };

  // Build search query based on filters
  let baseQuery = '';

  if (decade) {
    const startYear = parseInt(decade);
    const endYear = startYear + 9;
    baseQuery += `year:${startYear}-${endYear} `;
  }

  if (genres.length > 0) {
    baseQuery += `genre:${genres[Math.floor(Math.random() * genres.length)]} `;
  }

  const randomChars = 'abcdefghijklmnopqrstuvwxyz';
  const randomChar = randomChars[Math.floor(Math.random() * randomChars.length)];

  if (!baseQuery) baseQuery = randomChar;

  let fallbackTrack: any | null = null;

  // Try a few pages to increase chance of finding a preview_url
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomOffset = Math.floor(Math.random() * 200);
    console.log('Searching with query:', baseQuery, 'offset:', randomOffset, 'market:', market, 'attempt:', attempt + 1);

    const items = await doSearch(baseQuery, randomOffset);
    if (!items.length) continue;

    const withPreview = pickFromTracks(items, true);
    if (withPreview) return withPreview;

    if (!fallbackTrack) {
      fallbackTrack = pickFromTracks(items, false);
    }
  }

  // Broader fallback search (still tries to find preview first)
  for (let attempt = 0; attempt < 3; attempt++) {
    const randomOffset = Math.floor(Math.random() * 200);
    console.log('Fallback search with random char:', randomChar, 'offset:', randomOffset, 'market:', market, 'attempt:', attempt + 1);

    const items = await doSearch(randomChar, randomOffset);
    if (!items.length) continue;

    const withPreview = pickFromTracks(items, true);
    if (withPreview) return withPreview;

    if (!fallbackTrack) {
      fallbackTrack = pickFromTracks(items, false);
    }
  }

  return fallbackTrack;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, decade, genres, excludeYears } = await req.json();

    if (action === 'search') {
      const token = await getSpotifyToken();
      const track = await searchTrack(token, decade, genres || [], excludeYears || []);

      if (!track) {
        return new Response(
          JSON.stringify({ error: 'No track found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const releaseYear = new Date(track.album.release_date).getFullYear();

      return new Response(
        JSON.stringify({
          name: track.name,
          artist: track.artists[0].name,
          year: releaseYear,
          uri: track.uri,
          previewUrl: track.preview_url,
          albumImage: track.album.images[0]?.url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});