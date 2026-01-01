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
  // Build search query based on filters
  let query = '';
  
  if (decade) {
    const startYear = parseInt(decade);
    const endYear = startYear + 9;
    query += `year:${startYear}-${endYear} `;
  }
  
  if (genres.length > 0) {
    query += `genre:${genres[Math.floor(Math.random() * genres.length)]} `;
  }

  // Add some randomness to get different results
  const randomOffset = Math.floor(Math.random() * 50);
  const randomChars = 'abcdefghijklmnopqrstuvwxyz';
  const randomChar = randomChars[Math.floor(Math.random() * randomChars.length)];
  
  if (!query) {
    query = randomChar;
  }

  console.log('Searching with query:', query);

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50&offset=${randomOffset}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  
  if (!data.tracks?.items?.length) {
    console.log('No tracks found, trying fallback search');
    // Fallback to a simpler search
    const fallbackResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${randomChar}&type=track&limit=50&offset=${randomOffset}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    const fallbackData = await fallbackResponse.json();
    return filterAndSelectTrack(fallbackData.tracks?.items || [], excludeYears);
  }

  return filterAndSelectTrack(data.tracks.items, excludeYears);
}

function filterAndSelectTrack(tracks: any[], excludeYears: number[]): any {
  // Filter out tracks from years we already have
  const validTracks = tracks.filter((track: any) => {
    const releaseYear = new Date(track.album.release_date).getFullYear();
    return !excludeYears.includes(releaseYear) && track.preview_url;
  });

  if (validTracks.length === 0) {
    // If no valid tracks with preview, just filter by year
    const yearFilteredTracks = tracks.filter((track: any) => {
      const releaseYear = new Date(track.album.release_date).getFullYear();
      return !excludeYears.includes(releaseYear);
    });
    
    if (yearFilteredTracks.length > 0) {
      return yearFilteredTracks[Math.floor(Math.random() * yearFilteredTracks.length)];
    }
    return tracks[Math.floor(Math.random() * tracks.length)];
  }

  return validTracks[Math.floor(Math.random() * validTracks.length)];
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