import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/hooks/useGame';
import { startGame } from '@/lib/gameActions';
import { QRCode } from '@/components/QRCode';
import { Users, Play, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HostLobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { game, teams, loading } = useGame(gameId || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (game?.status === 'playing') {
      navigate(`/player/${gameId}`);
    }
  }, [game?.status, gameId, navigate]);

  const joinUrl = `${window.location.origin}/join?code=${game?.code || ''}`;

  const copyCode = async () => {
    if (!game?.code) return;
    
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Kopierat!',
        description: 'Spelkoden har kopierats',
      });
    } catch {
      toast({
        title: 'Fel',
        description: 'Kunde inte kopiera koden',
        variant: 'destructive',
      });
    }
  };

  // Filter out host teams - only playing teams should be in the game
  const playingTeams = teams.filter(t => !t.is_host);

  const handleStartGame = async () => {
    if (!gameId || playingTeams.length < 1) return;

    try {
      await startGame(gameId, playingTeams[0].id);
      navigate(`/player/${gameId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte starta spelet',
        variant: 'destructive',
      });
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
      <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Väntar på spelare</h1>
          <p className="text-muted-foreground">Dela koden med de andra lagen</p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center">
          <QRCode value={joinUrl} size={180} />
          
          <div className="mt-4 flex items-center gap-2">
            <span className="text-4xl font-mono font-bold text-primary tracking-widest">
              {game.code}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCode}
              className="text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Scanna QR-koden eller ange koden
          </p>
        </div>

        {/* Teams */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Lag ({playingTeams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playingTeams.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Väntar på lag...
              </p>
            ) : (
              <div className="space-y-2">
                {playingTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-medium">{team.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          size="lg"
          onClick={handleStartGame}
          disabled={playingTeams.length < 1}
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <Play className="w-5 h-5 mr-2" />
          Starta spelet
        </Button>

        {playingTeams.length < 2 && (
          <p className="text-center text-sm text-muted-foreground">
            {playingTeams.length === 0 
              ? 'Väntar på att lag ska ansluta...'
              : 'Du kan starta med ett lag, men det är roligare med flera!'}
          </p>
        )}
      </div>
    </div>
  );
}