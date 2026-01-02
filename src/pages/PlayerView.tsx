import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame, useTeamCards, useCurrentRound } from '@/hooks/useGame';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, Music } from 'lucide-react';
import { 
  fetchNewSong, 
  createRound, 
  endGame 
} from '@/lib/gameActions';
import { useToast } from '@/hooks/use-toast';

export default function PlayerView() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { game, teams, loading } = useGame(gameId || null);
  const { currentRound } = useCurrentRound(gameId || null);

  const currentTeam = teams.find(t => t.id === game?.current_team_id);

  useEffect(() => {
    if (game?.status === 'finished') {
      navigate(`/results/${gameId}`);
    }
  }, [game?.status, gameId, navigate]);

  const handleFetchSong = async () => {
    if (!gameId || !game?.current_team_id) return;

    try {
      // Get current team's cards to exclude their years
      const currentTeamCards = teams.find(t => t.id === game.current_team_id);
      
      const song = await fetchNewSong(
        null,
        (game.music_filter as any)?.genres || [],
        [] // We'll handle year exclusion in the edge function
      );

      await createRound(gameId, game.current_team_id, {
        name: song.name,
        artist: song.artist,
        year: song.year,
        uri: song.uri,
        previewUrl: song.previewUrl,
        albumImage: song.albumImage,
      });

      toast({
        title: 'Ny låt!',
        description: 'Låten spelas nu',
      });
    } catch (error) {
      console.error('Error fetching song:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta låt',
        variant: 'destructive',
      });
    }
  };

  const handleEndGame = async () => {
    if (!gameId) return;

    try {
      await endGame(gameId);
      navigate(`/results/${gameId}`);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar spel...</p>
        </div>
      </div>
    );
  }

  if (!game) {
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
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gradient mb-2">Musikspelaren</h1>
          {currentTeam && (
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: currentTeam.color }}
              />
              <span className="text-muted-foreground">
                {currentTeam.name}s tur
              </span>
            </div>
          )}
        </div>

        {/* Audio Player */}
        {currentRound ? (
          <AudioPlayer
            previewUrl={(currentRound as any).preview_url}
            albumImage={(currentRound as any).album_image}
            isRevealed={currentRound.is_revealed}
            songName={currentRound.is_revealed ? currentRound.song_name : undefined}
            artistName={currentRound.is_revealed ? currentRound.artist_name : undefined}
            spotifyUri={currentRound.spotify_uri}
          />
        ) : (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Ingen låt spelas</p>
              <Button
                onClick={handleFetchSong}
                className="bg-gradient-primary hover:opacity-90"
              >
                Hämta ny låt
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Score Board */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-primary" />
              Poängställning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teams
                .sort((a, b) => {
                  // Sort by card count (we'd need to fetch this)
                  return 0;
                })
                .map((team, index) => (
                  <TeamScoreRow
                    key={team.id}
                    team={team}
                    rank={index + 1}
                    isActive={team.id === game.current_team_id}
                  />
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={handleFetchSong}
            className="flex-1"
          >
            Ny låt
          </Button>
          <Button
            variant="destructive"
            onClick={handleEndGame}
            className="flex-1"
          >
            Avsluta spel
          </Button>
        </div>
      </div>
    </div>
  );
}

function TeamScoreRow({ 
  team, 
  rank, 
  isActive 
}: { 
  team: any; 
  rank: number; 
  isActive: boolean;
}) {
  const { cards } = useTeamCards(team.id);
  const cardCount = cards.filter(c => !c.is_start_card).length;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
        isActive ? 'bg-primary/20 ring-1 ring-primary' : 'bg-secondary/50'
      }`}
    >
      <span className="text-lg font-bold text-muted-foreground w-6">
        #{rank}
      </span>
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: team.color }}
      />
      <span className="font-medium flex-1">{team.name}</span>
      <span className="text-lg font-mono font-bold text-primary">
        {cardCount}
      </span>
    </div>
  );
}