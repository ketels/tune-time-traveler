import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { SpotifyWebPlayer } from '@/components/SpotifyWebPlayer';
import { SpotifyAuth } from '@/lib/localGameState';

interface AudioPlayerProps {
  albumImage: string | null;
  isRevealed: boolean;
  songName?: string;
  artistName?: string;
  year?: number;
  spotifyUri?: string | null;
  isHost?: boolean;
  spotifyAuth?: SpotifyAuth | null;
}

export function AudioPlayer({
  albumImage,
  isRevealed,
  songName,
  artistName,
  year,
  spotifyUri,
  isHost = false,
  spotifyAuth = null,
}: AudioPlayerProps) {
  // Use direct Spotify URI to open in app
  const spotifyUrl = spotifyUri || null;

  // Check if we should use web playback (Premium + auth available)
  const useWebPlayback = spotifyAuth && spotifyAuth.isPremium && Date.now() < spotifyAuth.expiresAt;

  return (
    <div className="glass rounded-2xl p-6 w-full max-w-md mx-auto">
      {/* Album Art */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-6 bg-secondary">
        {albumImage ? (
          <img
            src={albumImage}
            alt="Album cover"
            className={`w-full h-full object-cover transition-all duration-500 ${
              isRevealed ? '' : 'blur-xl scale-110'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl">🎵</div>
          </div>
        )}

        {!isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <span className="text-4xl">❓</span>
          </div>
        )}
      </div>

      {/* Song Info (only when revealed) */}
      {isRevealed && songName && (
        <div className="text-center mb-4 animate-fade-in">
          <h3 className="text-xl font-bold text-foreground">{songName}</h3>
          <p className="text-muted-foreground">{artistName}</p>
          {year && (
            <p className="text-3xl font-mono font-bold text-primary mt-2">
              {year}
            </p>
          )}
        </div>
      )}

      {/* Playback Controls */}
      {useWebPlayback && spotifyUrl && spotifyAuth ? (
        // Premium: Use Web Playback SDK
        <div className="space-y-3">
          <SpotifyWebPlayer
            trackUri={spotifyUrl}
            accessToken={spotifyAuth.accessToken}
            autoPlay={true}
          />
          <p className="text-xs text-center text-muted-foreground">
            Spelar med Spotify Premium
          </p>
        </div>
      ) : spotifyUrl ? (
        // Non-Premium or no auth: Fallback to "Open in Spotify" button
        <>
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              size="lg"
              className="w-full h-14 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Öppna i Spotify
            </Button>
          </a>
          {!useWebPlayback && isHost && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Tips: Logga in med Spotify Premium för att spela i browsern
            </p>
          )}
        </>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Ingen Spotify-länk tillgänglig
        </p>
      )}
    </div>
  );
}