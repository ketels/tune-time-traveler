import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame, useTeamCards, useCurrentRound } from '@/hooks/useGame';
import { Timeline } from '@/components/Timeline';
import { 
  revealSong, 
  handleCorrectGuess, 
  handleWrongGuess, 
  passTurn 
} from '@/lib/gameActions';
import { Check, X, ArrowRight, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TeamView() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { game, teams, loading } = useGame(gameId || null);
  const { currentRound } = useCurrentRound(gameId || null);
  
  // Filter out host teams - only playing teams
  const playingTeams = teams.filter(t => !t.is_host);
  
  const storedTeamId = localStorage.getItem('teamId');
  const myTeam = playingTeams.find(t => t.id === storedTeamId);
  const { cards } = useTeamCards(storedTeamId);
  
  const [selectedPosition, setSelectedPosition] = useState<{ before: number | null; after: number | null } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const isMyTurn = game?.current_team_id === storedTeamId;
  const currentTeam = playingTeams.find(t => t.id === game?.current_team_id);

  useEffect(() => {
    if (game?.status === 'lobby') {
      navigate(`/lobby/${gameId}`);
    } else if (game?.status === 'finished') {
      navigate(`/results/${gameId}`);
    }
  }, [game?.status, gameId, navigate]);

  useEffect(() => {
    // Reset state when round changes
    setSelectedPosition(null);
    setShowResult(false);
  }, [currentRound?.id]);

  const handleGuess = async () => {
    if (!currentRound || !selectedPosition || !gameId || !storedTeamId) return;

    const songYear = currentRound.release_year;
    const { before, after } = selectedPosition;

    // Check if the guess is correct
    let correct = false;
    if (before === null && after !== null) {
      // Placed at the start - song should be older than the first card
      correct = songYear < after;
    } else if (after === null && before !== null) {
      // Placed at the end - song should be newer than the last card
      correct = songYear > before;
    } else if (before !== null && after !== null) {
      // Placed in the middle - song should be between the two cards
      correct = songYear > before && songYear < after;
    }

    setIsCorrect(correct);
    setShowResult(true);

    // Reveal the song
    await revealSong(currentRound.id);

    if (correct) {
      await handleCorrectGuess(
        currentRound.id,
        storedTeamId,
        {
          name: currentRound.song_name,
          artist: currentRound.artist_name,
          year: currentRound.release_year,
          uri: currentRound.spotify_uri || '',
        },
        currentRound.consecutive_correct
      );

      toast({
        title: 'Rätt! 🎉',
        description: `${currentRound.song_name} släpptes ${currentRound.release_year}`,
      });
    } else {
      const currentTeamIndex = playingTeams.findIndex(t => t.id === storedTeamId);
      const nextTeam = playingTeams[(currentTeamIndex + 1) % playingTeams.length];

      await handleWrongGuess(
        gameId,
        storedTeamId,
        currentRound.consecutive_correct,
        nextTeam.id
      );

      toast({
        title: 'Fel 😔',
        description: `${currentRound.song_name} släpptes ${currentRound.release_year}`,
        variant: 'destructive',
      });
    }
  };

  const handleContinue = async () => {
    // Reset for next round
    setSelectedPosition(null);
    setShowResult(false);
    // The player view will fetch a new song
  };

  const handlePass = async () => {
    if (!gameId) return;

    const currentTeamIndex = playingTeams.findIndex(t => t.id === storedTeamId);
    const nextTeam = playingTeams[(currentTeamIndex + 1) % playingTeams.length];

    await passTurn(gameId, nextTeam.id);
    setSelectedPosition(null);
    setShowResult(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!game || !myTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Spelet hittades inte</p>
          <Button onClick={() => navigate('/')}>Tillbaka till start</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Team Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: myTeam.color }}
            />
            <span className="font-bold text-lg">{myTeam.name}</span>
          </div>
          <span className="text-muted-foreground font-mono">
            {cards.filter(c => !c.is_start_card).length} kort
          </span>
        </div>

        {/* Turn Indicator */}
        <Card className={`glass ${isMyTurn ? 'ring-2 ring-primary animate-pulse-glow' : ''}`}>
          <CardContent className="py-4 text-center">
            {isMyTurn ? (
              <span className="text-lg font-bold text-primary">Det är er tur!</span>
            ) : (
              <span className="text-muted-foreground">
                Väntar på {currentTeam?.name}...
              </span>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Er tidslinje</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline
              cards={cards}
              isInteractive={isMyTurn && !!currentRound && !showResult}
              selectedPosition={selectedPosition}
              onSelectPosition={(before, after) => setSelectedPosition({ before, after })}
            />
          </CardContent>
        </Card>

        {/* Guess Controls */}
        {isMyTurn && currentRound && !showResult && (
          <div className="space-y-4 animate-slide-up">
            {selectedPosition && (
              <div className="text-center text-sm text-muted-foreground">
                {selectedPosition.before === null && selectedPosition.after !== null && (
                  <span>Äldre än {selectedPosition.after}</span>
                )}
                {selectedPosition.after === null && selectedPosition.before !== null && (
                  <span>Nyare än {selectedPosition.before}</span>
                )}
                {selectedPosition.before !== null && selectedPosition.after !== null && (
                  <span>Mellan {selectedPosition.before} och {selectedPosition.after}</span>
                )}
              </div>
            )}

            <Button
              size="lg"
              onClick={handleGuess}
              disabled={!selectedPosition}
              className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              Gissa!
            </Button>
          </div>
        )}

        {/* Result */}
        {showResult && currentRound && (
          <Card className={`glass ${isCorrect ? 'ring-2 ring-primary' : 'ring-2 ring-destructive'}`}>
            <CardContent className="py-6 text-center space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                isCorrect ? 'bg-primary/20' : 'bg-destructive/20'
              }`}>
                {isCorrect ? (
                  <Check className="w-8 h-8 text-primary" />
                ) : (
                  <X className="w-8 h-8 text-destructive" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  {isCorrect ? 'Rätt!' : 'Fel!'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {currentRound.song_name} av {currentRound.artist_name}
                </p>
                <p className="text-2xl font-mono font-bold text-primary mt-2">
                  {currentRound.release_year}
                </p>
              </div>

              {isCorrect && (
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    onClick={handlePass}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Lämna över
                  </Button>
                  <Button
                    onClick={handleContinue}
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                  >
                    Fortsätt
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}