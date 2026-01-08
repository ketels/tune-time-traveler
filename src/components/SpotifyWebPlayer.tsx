import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// Extend Window interface for Spotify SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify;
  }
}

// Spotify SDK types
namespace Spotify {
  export interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (data: any) => void): boolean;
    removeListener(event: string): boolean;
    getCurrentState(): Promise<PlaybackState | null>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
  }

  export interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  export interface PlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: Track;
    };
  }

  export interface Track {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
  }

  export interface Device {
    device_id: string;
  }
}

interface SpotifyWebPlayerProps {
  trackUri: string;
  accessToken: string;
  autoPlay?: boolean;
  onError?: (error: Error) => void;
}

export function SpotifyWebPlayer({
  trackUri,
  accessToken,
  autoPlay = true,
  onError,
}: SpotifyWebPlayerProps) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const scriptLoaded = useRef(false);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (scriptLoaded.current) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize Spotify Player
  useEffect(() => {
    if (!accessToken) return;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Tune Time Traveler',
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: volume,
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('[Spotify Player] Initialization error:', message);
        onError?.(new Error(message));
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('[Spotify Player] Authentication error:', message);
        onError?.(new Error(message));
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('[Spotify Player] Account error (Premium required?):', message);
        onError?.(new Error('Spotify Premium required for web playback'));
      });

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('[Spotify Player] Playback error:', message);
        onError?.(new Error(message));
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: Spotify.Device) => {
        console.log('[Spotify Player] Ready with Device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      // Player state changed
      spotifyPlayer.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
        if (!state) {
          setIsPlaying(false);
          return;
        }
        setIsPlaying(!state.paused);
      });

      // Connect to the player
      spotifyPlayer.connect();

      setPlayer(spotifyPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken, volume, onError]);

  // Play track when device is ready
  useEffect(() => {
    if (!deviceId || !trackUri || !accessToken || !isReady) return;
    if (!autoPlay) return;

    const playTrack = async () => {
      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [trackUri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          console.log('[Spotify Player] Playing track:', trackUri);
          setIsPlaying(true);
        } else {
          const errorText = await response.text();
          console.error('[Spotify Player] Failed to play track:', errorText);
          onError?.(new Error('Failed to play track'));
        }
      } catch (error) {
        console.error('[Spotify Player] Failed to play track:', error);
        onError?.(error as Error);
      }
    };

    playTrack();
  }, [deviceId, trackUri, accessToken, autoPlay, isReady, onError]);

  // Handle volume change
  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    if (player) {
      await player.setVolume(newVolume);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = async () => {
    if (isMuted) {
      await handleVolumeChange(0.5);
      setIsMuted(false);
    } else {
      await handleVolumeChange(0);
      setIsMuted(true);
    }
  };

  // Handle play/pause toggle
  const handlePlayPause = async () => {
    if (!player) return;

    try {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.resume();
      }
    } catch (error) {
      console.error('[Spotify Player] Play/pause error:', error);
    }
  };

  if (!isReady) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Ansluter till Spotify...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Playback controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="lg"
          onClick={handlePlayPause}
          className="w-16 h-16 rounded-full"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMuteToggle}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Spelar via Spotify Web Player
      </p>
    </div>
  );
}
