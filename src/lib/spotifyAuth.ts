// Spotify Web Playback SDK Authentication
// For Premium users who want to play music in the browser

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}callback`;

export interface SpotifyAuthState {
  accessToken: string;
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
 * Initiates Spotify OAuth flow (Implicit Grant)
 * Redirects user to Spotify login
 */
export function loginWithSpotify(): void {
  const state = generateRandomString(16);
  localStorage.setItem('spotify_auth_state', state);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'token',
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: SCOPES.join(' '),
    show_dialog: 'true', // Force user to see authorization dialog
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Handles OAuth callback after Spotify login
 * Extracts access token from URL hash
 */
export function handleSpotifyCallback(): SpotifyAuthState | null {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const accessToken = params.get('access_token');
  const state = params.get('state');
  const expiresIn = params.get('expires_in');
  const storedState = localStorage.getItem('spotify_auth_state');

  // Validate state to prevent CSRF
  if (!accessToken || state !== storedState) {
    console.error('[SpotifyAuth] Invalid callback state');
    return null;
  }

  // Clean up
  localStorage.removeItem('spotify_auth_state');
  window.history.replaceState({}, document.title, window.location.pathname);

  const expiresAt = Date.now() + (parseInt(expiresIn || '3600') * 1000);

  // We'll check Premium status separately
  return {
    accessToken,
    expiresAt,
    isPremium: false, // Will be updated after profile check
    userId: '',
  };
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
