import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalGame } from '@/hooks/useLocalGame';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Music, Trophy, SkipForward, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadSpotifyAuth, SpotifyAuthState } from '@/lib/spotifyAuth';

export default function PlayerView() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [canPass, setCanPass] = useState(false);
  const [spotifyAuth, setSpotifyAuth] = useState<SpotifyAuthState | null>(null);

  const {
    gameState,
    loading,
    currentTeam,
    fetchNewSong,
    revealSong,
    handleCorrectGuess,
    handleWrongGuess,
    passTurn,
    endGame,
  } = useLocalGame({ gameCode, isHost: true });

  // Load Spotify auth on mount
  useEffect(() => {
    const auth = loadSpotifyAuth();
    setSpotifyAuth(auth);
  }, []);

  // Redirect to results when game ends
  useEffect(() => {
    if (gameState?.status === 'finished') {
      navigate(`/results/${gameCode}`);
    }
  }, [gameState?.status, gameCode, navigate]);

  const handleFetchSong = async () => {
    try {
      await fetchNewSong();
      setCanPass(false); // Cannot pass after fetching new song
      toast({
        title: 'Ny låt!',
        description: 'Spela upp och låt laget gissa',
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta låt',
        variant: 'destructive',
      });
    }
  };

  const handleReveal = () => {
    revealSong();
  };

  const handleCorrect = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    handleCorrectGuess();
    setCanPass(true); // Can pass after getting points
    toast({
      title: 'Rätt!',
      description: `${currentTeam?.name} får kortet`,
    });
    // Reset after a short delay to allow state to update
    setTimeout(() => setIsProcessing(false), 500);
  };

  const handleWrong = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    handleWrongGuess();
    setCanPass(false); // Reset after wrong guess
    toast({
      title: 'Fel!',
      description: 'Nästa lag får gissa',
    });
    setTimeout(() => setIsProcessing(false), 500);
  };

  const handlePass = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    passTurn();
    setCanPass(false); // Reset after passing
    toast({
      title: 'Passade',
      description: 'Nästa lag får gissa',
    });
    setTimeout(() => setIsProcessing(false), 500);
  };

  const handleEndGame = () => {
    endGame();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 md:w-10 md:h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg md:max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6 animate-slide-up">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-2">Musikspelet</h1>
          {currentTeam && (
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-4 h-4 md:w-5 md:h-5 rounded-full"
                style={{ backgroundColor: currentTeam.color }}
              />
              <span className="text-muted-foreground">
                {currentTeam.name}s tur
              </span>
            </div>
          )}
        </div>

        {/* Audio Player & Game Controls - Side by Side on Large Screens */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Audio Player / Fetch Song */}
          <div className="w-full lg:flex-1">
            {currentRound ? (
              <AudioPlayer
                albumImage={currentRound.song.albumImage}
                isRevealed={currentRound.isRevealed}
                songName={currentRound.song.name}
                artistName={currentRound.song.artist}
                year={currentRound.song.year}
                spotifyUri={currentRound.song.uri}
                isHost={true}
                spotifyAuth={spotifyAuth}
              />
            ) : (
              <Card className="glass">
                <CardContent className="py-12 text-center">
                  <Music className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-6">Hämta en ny låt för att börja</p>
                  <Button
                    size="lg"
                    onClick={handleFetchSong}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Music className="w-5 h-5 mr-2" />
                    Hämta låt
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Game Controls */}
          {currentRound && (
            <div className="w-full lg:w-[32rem]">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Kontroller</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!currentRound.isRevealed ? (
                    <Button
                      size="lg"
                      onClick={handleReveal}
                      className="w-full"
                      variant="outline"
                    >
                      Visa låtinfo
                    </Button>
                  ) : (
                    <>
                      <div className="text-center py-4">
                        <p className="text-lg md:text-xl font-bold">{currentRound.song.name}</p>
                        <p className="text-muted-foreground">{currentRound.song.artist}</p>
                        <p className="text-2xl md:text-3xl lg:text-4xl font-mono font-bold text-primary mt-2">
                          {currentRound.song.year}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <Button
                          size="lg"
                          onClick={handleCorrect}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Rätt
                        </Button>
                        <Button
                          size="lg"
                          onClick={handleWrong}
                          disabled={isProcessing}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <X className="w-5 h-5 mr-2" />
                          Fel
                        </Button>
                      </div>
                    </>
                  )}

                  {canPass ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={handlePass}
                      >
                        <SkipForward className="w-4 h-4 mr-2" />
                        Passa
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleFetchSong}
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Fortsätt
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Scoreboard */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              Ställning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              {gameState.teams.map((team) => {
                const cardCount = team.cards.filter(c => !c.isStartCard).length;
                const isActive = team.id === gameState.currentTeamId;

                return (
                  <div
                    key={team.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isActive ? 'bg-primary/20 ring-1 ring-primary' : 'bg-secondary/50'
                    }`}
                  >
                    <div
                      className="w-4 h-4 md:w-5 md:h-5 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-medium flex-1">{team.name}</span>
                    <span className="text-lg md:text-xl font-mono font-bold">{cardCount}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* End Game */}
        <Button
          variant="outline"
          onClick={handleEndGame}
          className="w-full"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Avsluta spel
        </Button>
      </div>
    </div>
  );
}
