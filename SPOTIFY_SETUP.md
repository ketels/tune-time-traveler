# Spotify Web Playback Setup Guide

This guide explains how to set up Spotify Premium Web Playback for in-browser music playback.

## Overview

Tune Time Traveler supports two playback modes:

1. **Spotify App (Default)**: Opens songs in the Spotify mobile/desktop app
2. **Web Playback (Premium Only)**: Plays music directly in the browser using Spotify Web Playback SDK

## Requirements

- Spotify Premium account
- Spotify Developer App credentials (Client ID and Client Secret)
- Supabase project (for token exchange edge function)

## Important: OAuth Migration (November 2025)

⚠️ **Spotify removed support for Implicit Grant flow on November 27, 2025.**

This app now uses **Authorization Code with PKCE**, which requires:
- HTTPS redirect URIs (HTTP only works for 127.0.0.1 in local dev)
- A backend endpoint to exchange authorization code for access token
- Client Secret stored securely on the backend

## Setup Steps

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create app"**
4. Fill in the app details:
   - **App name**: Tune Time Traveler (or any name)
   - **App description**: Music timeline guessing game
   - **Redirect URI**: `https://ketels.github.io/tune-time-traveler/callback`
     - For local development, also add: `http://127.0.0.1:8080/callback` (Note: Spotify requires 127.0.0.1, not localhost)
   - **API used**: Select "Web Playback SDK"
5. Click **"Save"**

### 2. Configure Redirect URIs

In your Spotify App settings:

1. Click **"Settings"** (or **"Edit Settings"** depending on UI)
2. Under **"Redirect URIs"**, add:
   - Production: `https://ketels.github.io/tune-time-traveler/callback`
   - Local dev: `http://127.0.0.1:8081/tune-time-traveler/callback`
   - PR Previews: `https://ketels.github.io/tune-time-traveler/pr-*/callback` (use wildcard pattern)
3. Click **"Add"** and **"Save"**

**Important Notes:**
- For production, HTTPS is required (GitHub Pages works)
- For local dev, use `127.0.0.1` (NOT `localhost`)
- Include the full path with base URL: `/tune-time-traveler/callback`
- Port 8081 is used in dev (Vite default when 8080 is busy)
- For PR previews, you can either:
  - Add a wildcard pattern (if Spotify supports it)
  - Add specific PR preview URLs manually when testing (e.g., `/pr-123/callback`)

### 3. Get Client Credentials

1. In your Spotify App dashboard, copy:
   - **Client ID**
   - **Client Secret** (click "Show Client Secret")

2. Add to `.env` file:

```env
VITE_SPOTIFY_CLIENT_ID="your-client-id-here"
```

3. Add to Supabase Edge Function secrets:

```bash
# Set Supabase secrets for edge function
npx supabase secrets set SPOTIFY_CLIENT_ID="your-client-id"
npx supabase secrets set SPOTIFY_CLIENT_SECRET="your-client-secret"
```

### 4. Deploy Supabase Edge Function

The app uses a Supabase Edge Function to exchange authorization codes for tokens:

```bash
# Deploy the spotify-token edge function
npx supabase functions deploy spotify-token
```

### 5. Update GitHub Actions (for deployment)

Add Spotify Client ID to your repository variables:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository variable"**
4. Name: `VITE_SPOTIFY_CLIENT_ID`
5. Value: Your Spotify Client ID
6. Click **"Add variable"**

**Note:** Client Secret stays in Supabase, NOT in GitHub.

## Usage

### For Game Hosts

1. Go to **Create Game** page
2. Optional: Click **"Logga in med Spotify Premium"**
3. Log in to Spotify and authorize the app
4. If you have Premium, you'll see "Inloggad med Premium"
5. Create your game as usual
6. Music will play directly in the browser during gameplay

### For Players Without Premium

- The game works perfectly without Spotify Premium
- Songs will open in the Spotify app instead of playing in-browser
- All game functionality remains the same

## Technical Details

### OAuth Flow (Authorization Code with PKCE)

1. User clicks "Logga in med Spotify Premium" in CreateGame
2. Client generates PKCE code_verifier and code_challenge
3. Redirected to Spotify OAuth with code_challenge
4. User authorizes the app
5. Redirected back to `/callback` with authorization code
6. Client sends code + code_verifier to Supabase Edge Function
7. Edge Function exchanges code for access token using Client Secret
8. Access token returned to client and stored in localStorage
9. Premium status checked via Spotify API

**Why PKCE?**
- More secure than Implicit Grant (no token in URL)
- Protects against authorization code interception
- Required by Spotify as of November 2025

### Required Scopes

- `streaming` - Play music in the browser
- `user-read-playback-state` - Read playback state
- `user-modify-playback-state` - Control playback
- `user-read-email` - Read user email
- `user-read-private` - Check Premium status

### Hybrid Playback Logic

```typescript
// In AudioPlayer.tsx
const useWebPlayback = spotifyAuth && spotifyAuth.isPremium && Date.now() < spotifyAuth.expiresAt;

if (useWebPlayback) {
  // Use SpotifyWebPlayer component
} else {
  // Fallback to "Open in Spotify" button
}
```

## Troubleshooting

### "Invalid Redirect URI" Error

- Make sure the redirect URI in your Spotify App settings **exactly** matches your app URL
- For GitHub Pages: `https://[username].github.io/[repo-name]/callback`
- For local dev: `http://127.0.0.1:8081/tune-time-traveler/callback`
- Must include full path with base URL
- Use `127.0.0.1` instead of `localhost`

### "unsupported_response_type" Error

- This means Implicit Grant is disabled (as of Nov 2025)
- Ensure you're using the updated code with PKCE
- Check that spotify-token edge function is deployed

### "Premium Required" Message

- Only Spotify Premium users can use Web Playback SDK
- Free users will automatically fall back to "Open in Spotify" button

### Token Expired

- Access tokens expire after 1 hour
- Users will need to log in again
- The app automatically detects expired tokens

### No Sound Playing

1. Check browser console for errors
2. Ensure Spotify Premium is active
3. Try opening Spotify app and closing any active sessions
4. Refresh the page and try again

## Security Notes

- **Client ID is public**: It's safe to expose in client-side code
- **Never commit tokens**: Access tokens should never be committed to Git
- **State validation**: OAuth flow uses state parameter to prevent CSRF attacks
- **Token expiration**: Tokens expire after 1 hour for security

## References

- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [Spotify OAuth 2.0](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [Authorization Code with PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [Migration from Implicit Grant](https://developer.spotify.com/documentation/web-api/tutorials/migration-implicit-auth-code)
- [OAuth Migration Announcement](https://developer.spotify.com/blog/2025-10-14-reminder-oauth-migration-27-nov-2025)
