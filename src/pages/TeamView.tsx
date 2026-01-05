import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalGame } from '@/hooks/useLocalGame';
import { Timeline } from '@/components/Timeline';
import { Clock, SkipForward, Music } from 'lucide-react';
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
    continueGame,
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

  const handleTimelinePositionSelect = (beforeYear: number | null, afterYear: number | null) => {
    if (!myTeam) return;

    // Find the card IDs based on years
    const beforeCard = beforeYear ? myTeam.cards.find(c => c.releaseYear === beforeYear) : null;
    const afterCard = afterYear ? myTeam.cards.find(c => c.releaseYear === afterYear) : null;

    if (!beforeCard && !afterCard) {
      // Position before first card
      const firstCard = [...myTeam.cards].sort((a, b) => a.releaseYear - b.releaseYear)[0];
      if (firstCard) {
        setSelectedPosition({ type: 'before', referenceId: firstCard.id });
      }
    } else if (beforeCard && !afterCard) {
      // Position after last card
      setSelectedPosition({ type: 'after', referenceId: beforeCard.id });
    } else if (beforeCard && afterCard) {
      // Position between two cards
      setSelectedPosition({ type: 'between', referenceId: beforeCard.id, secondId: afterCard.id });
    }
  };

  const handlePass = () => {
    requestPass();
    toast({
      title: 'Passade',
      description: 'Nästa lag får gissa',
    });
  };

  const handleContinue = () => {
    setSelectedPosition(null);
    continueGame();
    toast({
      title: 'Fortsätter',
      description: 'Ny låt på väg!',
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

  // Check if we just got points (revealed song that's now in our cards as unlocked)
  const hasGottenPoints = isMyTurn && currentRound && isRevealed && myTeam &&
    myTeam.cards.some(card =>
      card.songName === currentRound.song.name &&
      card.artistName === currentRound.song.artist &&
      !card.isLocked
    );

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
                is_locked: c.isLocked,
                team_id: myTeam.id,
                created_at: '',
              }))}
              isInteractive={isMyTurn && !isRevealed}
              selectedPosition={selectedPosition ? (() => {
                // Map internal position format to Timeline's expected format
                if (selectedPosition.type === 'before') {
                  // Position before first card: before=null, after=firstCard
                  const card = myTeam.cards.find(c => c.id === selectedPosition.referenceId);
                  return { before: null, after: card?.releaseYear || null };
                } else if (selectedPosition.type === 'after') {
                  // Position after last card: before=lastCard, after=null
                  const card = myTeam.cards.find(c => c.id === selectedPosition.referenceId);
                  return { before: card?.releaseYear || null, after: null };
                } else if (selectedPosition.type === 'between') {
                  // Position between two cards: before=card1, after=card2
                  const beforeCard = myTeam.cards.find(c => c.id === selectedPosition.referenceId);
                  const afterCard = myTeam.cards.find(c => c.id === selectedPosition.secondId);
                  return {
                    before: beforeCard?.releaseYear || null,
                    after: afterCard?.releaseYear || null
                  };
                }
                return null;
              })() : null}
              onSelectPosition={handleTimelinePositionSelect}
            />
          </CardContent>
        </Card>

        {/* Current Round Info */}
        {currentRound && (
          <Card className={`glass ${isRevealed ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="py-6">
              {!isRevealed && isMyTurn ? (
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto text-primary mb-4 animate-pulse" />
                  <p className="text-lg font-semibold">Lyssna på låten</p>
                  <p className="text-muted-foreground mt-2">
                    Placera den i din tidslinje
                  </p>

                  {selectedPosition && myTeam && (
                    <div className="mt-4 p-3 bg-primary/20 rounded-lg">
                      <p className="text-sm text-primary">
                        {(() => {
                          const refCard = myTeam.cards.find(c => c.id === selectedPosition.referenceId);
                          const secondCard = selectedPosition.secondId
                            ? myTeam.cards.find(c => c.id === selectedPosition.secondId)
                            : null;

                          if (selectedPosition.type === 'before') {
                            return `Valt: före ${refCard?.releaseYear || '?'}`;
                          } else if (selectedPosition.type === 'after') {
                            return `Valt: efter ${refCard?.releaseYear || '?'}`;
                          } else {
                            return `Valt: mellan ${refCard?.releaseYear || '?'} och ${secondCard?.releaseYear || '?'}`;
                          }
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              ) : !isRevealed && !isMyTurn ? (
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">{currentTeam?.name} gissar</p>
                  <p className="text-muted-foreground mt-2">
                    Vänta på din tur...
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-bold">{currentRound.song.name}</p>
                  <p className="text-muted-foreground">{currentRound.song.artist}</p>
                  <p className="text-3xl font-mono font-bold text-primary mt-4">
                    {currentRound.song.year}
                  </p>

                  {hasGottenPoints ? (
                    <div className="mt-6 space-y-3">
                      <p className="text-sm text-green-600 font-semibold">
                        Rätt! Du fick kortet
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={handlePass}
                          className="w-full"
                        >
                          <SkipForward className="w-4 h-4 mr-2" />
                          Passa
                        </Button>
                        <Button
                          onClick={handleContinue}
                          className="w-full bg-gradient-primary hover:opacity-90"
                        >
                          <Music className="w-4 h-4 mr-2" />
                          Fortsätt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-4">
                      {isMyTurn ? 'Värden bedömer ditt svar...' : `${currentTeam?.name} gissar...`}
                    </p>
                  )}
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
