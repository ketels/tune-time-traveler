import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';

interface AudioPlayerProps {
  previewUrl: string | null;
  albumImage: string | null;
  isRevealed: boolean;
  songName?: string;
  artistName?: string;
  spotifyUri?: string | null;
}

export function AudioPlayer({ 
  previewUrl, 
  albumImage, 
  isRevealed,
  songName,
  artistName,
  spotifyUri
}: AudioPlayerProps) {
  const spotifyUrl = spotifyUri ? `https://open.spotify.com/track/${spotifyUri.split(':')[2]}` : null;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const percentage = (audio.currentTime / audio.duration) * 100;
      setProgress(percentage || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (previewUrl && audioRef.current) {
      audioRef.current.src = previewUrl;
      audioRef.current.load();
    }
  }, [previewUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="glass rounded-2xl p-6 w-full max-w-md mx-auto">
      <audio ref={audioRef} />
      
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
        </div>
      )}

      {/* Progress Bar */}
      <Progress value={progress} className="h-2 mb-4" />

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-muted-foreground hover:text-foreground"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </Button>

        <Button
          size="lg"
          onClick={togglePlay}
          disabled={!previewUrl}
          className="w-16 h-16 rounded-full bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </Button>

        <div className="w-10" /> {/* Spacer for symmetry */}
      </div>

      {/* Spotify Link */}
      {spotifyUrl && isRevealed && (
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-primary hover:underline"
        >
          <ExternalLink size={16} />
          Öppna i Spotify
        </a>
      )}

      {!previewUrl && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Ingen förhandslyssning tillgänglig.
          {spotifyUrl && isRevealed ? ' Använd länken ovan för att lyssna i Spotify.' : ' Avslöja låten för att öppna i Spotify.'}
        </p>
      )}
    </div>
  );
}