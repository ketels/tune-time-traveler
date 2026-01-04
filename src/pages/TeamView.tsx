import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalGame } from '@/hooks/useLocalGame';
import { Timeline } from '@/components/Timeline';
import { Clock, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TeamView() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    gameState, 
    loading, 
    myTeam,
    isMyTurn,
    currentTeam,
    requestPass,
  } = useLocalGame({ gameCode, isHost: false });

  const [selectedPosition, setSelectedPosition] = useState<{
    type: 'before' | 'after' | 'between';
    referenceId: string;
    secondId?: string;
  } | null>(null);

  // Redirect based on game status
  useEffect(() => {
    if (gameState?.status === 'lobby') {
      navigate(`/lobby/${gameCode}`);
    } else if (gameState?.status === 'finished') {
      navigate(`/results/${gameCode}`);
    }
  }, [gameState?.status, gameCode, navigate]);

  // Reset selection when round changes
  useEffect(() => {
    setSelectedPosition(null);
  }, [gameState?.currentRound?.id]);

  const handlePositionSelect = (position: {
    type: 'before' | 'after' | 'between';
    referenceId: string;
    secondId?: string;
  }) => {
    setSelectedPosition(position);
  };

  const handlePass = () => {
    requestPass();
    toast({
      title: 'Passade',
      description: 'Nästa lag får gissa',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Ansluter till spel...</p>
        </div>
      </div>
    );
  }

  if (!gameState || !myTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Spelet hittades inte</p>
          <Button onClick={() => navigate('/')}>Tillbaka till start</Button>
        </div>
      </div>
    );
  }

  const currentRound = gameState.currentRound;
  const isRevealed = currentRound?.isRevealed || false;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
        {/* Team Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: myTeam.color }}
            />
            <h1 className="text-2xl font-bold">{myTeam.name}</h1>
          </div>
          
          {isMyTurn ? (
            <p className="text-primary font-semibold">Din tur att gissa!</p>
          ) : currentTeam ? (
            <p className="text-muted-foreground">
              Väntar på {currentTeam.name}...
            </p>
          ) : (
            <p className="text-muted-foreground">Väntar på nästa runda...</p>
          )}
        </div>

        {/* Timeline */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Din tidslinje</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline 
              cards={myTeam.cards.map(c => ({
                id: c.id,
                song_name: c.songName,
                artist_name: c.artistName,
                release_year: c.releaseYear,
                spotify_uri: c.spotifyUri,
                is_start_card: c.isStartCard,
                team_id: myTeam.id,
                created_at: '',
              }))}
              isInteractive={isMyTurn && !isRevealed}
              selectedPosition={selectedPosition ? {
                before: null,
                after: null,
              } : null}
              onSelectPosition={() => {}}
            />
          </CardContent>
        </Card>

        {/* Current Round Info */}
        {isMyTurn && currentRound && (
          <Card className={`glass ${isRevealed ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="py-6">
              {!isRevealed ? (
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto text-primary mb-4 animate-pulse" />
                  <p className="text-lg font-semibold">Lyssna på låten</p>
                  <p className="text-muted-foreground mt-2">
                    Placera den i din tidslinje
                  </p>
                  
                  {selectedPosition && (
                    <div className="mt-4 p-3 bg-primary/20 rounded-lg">
                      <p className="text-sm text-primary">
                        Vald position: {
                          selectedPosition.type === 'before' ? 'Före' :
                          selectedPosition.type === 'after' ? 'Efter' :
                          'Mellan'
                        }
                      </p>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handlePass}
                    className="mt-4"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Passa
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-bold">{currentRound.song.name}</p>
                  <p className="text-muted-foreground">{currentRound.song.artist}</p>
                  <p className="text-3xl font-mono font-bold text-primary mt-4">
                    {currentRound.song.year}
                  </p>
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    Värden bedömer ditt svar...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Score */}
        <div className="text-center">
          <p className="text-muted-foreground">Dina kort</p>
          <p className="text-4xl font-mono font-bold text-primary">
            {myTeam.cards.filter(c => !c.isStartCard).length}
          </p>
        </div>
      </div>
    </div>
  );
}
