import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  handleSpotifyCallback,
  checkSpotifyPremium,
  saveSpotifyAuth,
  SpotifyAuthState
} from '@/lib/spotifyAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'not-premium'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract auth from URL and exchange code for token
        const authState = await handleSpotifyCallback();

        if (!authState) {
          setStatus('error');
          setErrorMessage('Ogiltig autentisering från Spotify');
          return;
        }

        // Check if user has Premium
        const { isPremium, userId } = await checkSpotifyPremium(authState.accessToken);

        const completeAuth: SpotifyAuthState = {
          ...authState,
          isPremium,
          userId,
        };

        // Save auth
        saveSpotifyAuth(completeAuth);

        if (!isPremium) {
          setStatus('not-premium');
          return;
        }

        setStatus('success');

        // Redirect to create game after 2 seconds
        setTimeout(() => {
          navigate('/create');
        }, 2000);

      } catch (error) {
        console.error('[SpotifyCallback] Error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Ett okänt fel uppstod');
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="glass max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Spotify Premium</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Verifierar ditt Spotify-konto...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center animate-slide-up">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Inloggad!</h2>
              <p className="text-muted-foreground mb-4">
                Du kan nu spela musik direkt i browsern med Spotify Premium
              </p>
              <p className="text-sm text-muted-foreground">
                Omdirigerar...
              </p>
            </div>
          )}

          {status === 'not-premium' && (
            <div className="text-center animate-slide-up">
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Spotify Premium krävs</h2>
              <p className="text-muted-foreground mb-4">
                Web playback är endast tillgängligt för Spotify Premium-användare.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Du kan fortfarande spela genom att öppna låtar i Spotify-appen!
              </p>
              <Button onClick={() => navigate('/create')} className="w-full">
                Fortsätt utan Premium
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center animate-slide-up">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Något gick fel</h2>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <Button onClick={() => navigate('/create')} variant="outline" className="w-full">
                Tillbaka
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
