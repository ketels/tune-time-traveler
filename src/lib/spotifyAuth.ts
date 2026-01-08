// Spotify Web Playback SDK Authentication with PKCE
// For Premium users who want to play music in the browser
// Uses Authorization Code with PKCE (required as of Nov 2025)

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
// Spotify requires 127.0.0.1 instead of localhost for local dev
const origin = window.location.origin.replace('localhost', '127.0.0.1');
const REDIRECT_URI = `${origin}${import.meta.env.BASE_URL}callback`;

export interface SpotifyAuthState {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  isPremium: boolean;
  userId: string;
}

// Scopes needed for Web Playback SDK
const SCOPES = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-email',
  'user-read-private', // To check Premium status
];

/**
 * Generate PKCE code verifier (random string 43-128 chars)
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generate PKCE code challenge from verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Base64 URL encode (without padding)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Initiates Spotify OAuth flow with PKCE
 * Redirects user to Spotify login
 */
export async function loginWithSpotify(): Promise<void> {
  const state = generateRandomString(16);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store state and verifier for callback validation
  localStorage.setItem('spotify_auth_state', state);
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'true',
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Handles OAuth callback after Spotify login with PKCE
 * Extracts authorization code and exchanges it for access token
 */
export async function handleSpotifyCallback(): Promise<SpotifyAuthState | null> {
  const params = new URLSearchParams(window.location.search);

  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');
  const storedState = localStorage.getItem('spotify_auth_state');
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  // Check for errors
  if (error) {
    console.error('[SpotifyAuth] Authorization error:', error);
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
    return null;
  }

  // Validate state to prevent CSRF
  if (!code || !codeVerifier || state !== storedState) {
    console.error('[SpotifyAuth] Invalid callback state');
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
    return null;
  }

  // Clean up state
  localStorage.removeItem('spotify_auth_state');
  localStorage.removeItem('spotify_code_verifier');

  // Exchange authorization code for access token via edge function
  try {
    const tokens = await exchangeCodeForToken(code, codeVerifier);

    if (!tokens) {
      return null;
    }

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      isPremium: false, // Will be updated after profile check
      userId: '',
    };
  } catch (error) {
    console.error('[SpotifyAuth] Token exchange failed:', error);
    return null;
  }
}

/**
 * Exchange authorization code for access token using Supabase Edge Function
 */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spotify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SpotifyAuth] Token exchange error:', errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[SpotifyAuth] Token exchange request failed:', error);
    return null;
  }
}

/**
 * Check if user has Spotify Premium and get user info
 */
export async function checkSpotifyPremium(accessToken: string): Promise<{ isPremium: boolean; userId: string }> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Spotify profile');
    }

    const data = await response.json();

    return {
      isPremium: data.product === 'premium',
      userId: data.id,
    };
  } catch (error) {
    console.error('[SpotifyAuth] Failed to check Premium status:', error);
    return { isPremium: false, userId: '' };
  }
}

/**
 * Save auth state to localStorage
 */
export function saveSpotifyAuth(auth: SpotifyAuthState): void {
  localStorage.setItem('spotify_auth', JSON.stringify(auth));
}

/**
 * Load auth state from localStorage
 */
export function loadSpotifyAuth(): SpotifyAuthState | null {
  try {
    const stored = localStorage.getItem('spotify_auth');
    if (!stored) return null;

    const auth = JSON.parse(stored) as SpotifyAuthState;

    // Check if token is expired
    if (Date.now() >= auth.expiresAt) {
      clearSpotifyAuth();
      return null;
    }

    return auth;
  } catch (error) {
    console.error('[SpotifyAuth] Failed to load auth:', error);
    return null;
  }
}

/**
 * Clear auth state from localStorage
 */
export function clearSpotifyAuth(): void {
  localStorage.removeItem('spotify_auth');
}

/**
 * Check if user is authenticated and has valid token
 */
export function isSpotifyAuthenticated(): boolean {
  const auth = loadSpotifyAuth();
  return auth !== null && Date.now() < auth.expiresAt;
}

/**
 * Generate random string for state parameter
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
