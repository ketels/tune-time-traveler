import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state when a new preview loads
    audio.pause();
    setIsPlaying(false);
    setProgress(0);

    if (previewUrl) {
      audio.src = previewUrl;
    } else {
      audio.removeAttribute('src');
    }

    audio.load();
  }, [previewUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!previewUrl) {
      toast({
        title: 'Ingen förhandslyssning',
        description: 'Den här låten saknar 30-sekunders preview. Använd Spotify-länken istället.',
      });
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.error('Audio playback failed:', e);
      setIsPlaying(false);
      toast({
        title: 'Kunde inte spela upp',
        description: 'Förhandslyssningen blockerades eller kunde inte laddas. Prova igen eller öppna i Spotify.',
        variant: 'destructive',
      });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !isMuted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <div className="glass rounded-2xl p-6 w-full max-w-md mx-auto">
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
      
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

      {/* Spotify Link - always show if available */}
      {spotifyUrl && (
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-primary hover:underline"
        >
          <ExternalLink size={16} />
          Lyssna i Spotify
        </a>
      )}

      {!previewUrl && !spotifyUrl && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Ingen förhandslyssning tillgänglig.
        </p>
      )}
    </div>
  );
}