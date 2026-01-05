import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface AudioPlayerProps {
  albumImage: string | null;
  isRevealed: boolean;
  songName?: string;
  artistName?: string;
  year?: number;
  spotifyUri?: string | null;
  isHost?: boolean;
}

export function AudioPlayer({
  albumImage,
  isRevealed,
  songName,
  artistName,
  year,
  spotifyUri,
  isHost = false
}: AudioPlayerProps) {
  // Use direct Spotify URI to open in app
  const spotifyUrl = spotifyUri || null;

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

      {/* Open in Spotify Button */}
      {spotifyUrl ? (
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
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Ingen Spotify-länk tillgänglig
        </p>
      )}
    </div>
  );
}