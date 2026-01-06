# Spotify Web Playback Setup Guide

This guide explains how to set up Spotify Premium Web Playback for in-browser music playback.

## Overview

Tune Time Traveler supports two playback modes:

1. **Spotify App (Default)**: Opens songs in the Spotify mobile/desktop app
2. **Web Playback (Premium Only)**: Plays music directly in the browser using Spotify Web Playback SDK

## Requirements

- Spotify Premium account
- Spotify Developer App credentials

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

1. Click **"Edit Settings"**
2. Under **"Redirect URIs"**, add:
   - Production: `https://ketels.github.io/tune-time-traveler/callback`
   - Local dev: `http://127.0.0.1:8080/callback` (Note: Use 127.0.0.1, not localhost)
3. Click **"Add"** and **"Save"**

**Important**: Spotify does not support `localhost` URLs. Always use `127.0.0.1` for local development.

### 3. Get Your Client ID

1. In your Spotify App dashboard, copy the **Client ID**
2. Add it to your `.env` file:

```env
VITE_SPOTIFY_CLIENT_ID="your-client-id-here"
```

### 4. Update GitHub Actions (for deployment)

If deploying to GitHub Pages, add the Spotify Client ID to your repository secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository variable"**
4. Name: `VITE_SPOTIFY_CLIENT_ID`
5. Value: Your Spotify Client ID
6. Click **"Add variable"**

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

### OAuth Flow

1. User clicks "Logga in med Spotify Premium" in CreateGame
2. Redirected to Spotify OAuth (Implicit Grant Flow)
3. User authorizes the app
4. Redirected back to `/callback` with access token
5. Token stored in localStorage (expires after 1 hour)
6. Premium status checked via Spotify API

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
- For local dev: `http://127.0.0.1:8080/callback` (NOT `localhost`)
- Spotify does not support `localhost` URLs - always use `127.0.0.1` instead

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
- [Implicit Grant Flow](https://developer.spotify.com/documentation/web-api/tutorials/implicit-flow)
