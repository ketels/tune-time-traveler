import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalGame } from '@/hooks/useLocalGame';
import { QRCode } from '@/components/QRCode';
import { Users, Play, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HostLobby() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { gameState, loading, isConnected, startGame } = useLocalGame({ 
    gameCode, 
    isHost: true 
  });

  // Redirect to player view when game starts
  useEffect(() => {
    if (gameState?.status === 'playing') {
      navigate(`/player/${gameCode}`);
    }
  }, [gameState?.status, gameCode, navigate]);

  const joinUrl = `${window.location.origin}${import.meta.env.BASE_URL}join?code=${gameCode}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode || '');
      setCopied(true);
      toast({
        title: 'Kopierat!',
        description: 'Spelkoden har kopierats',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte kopiera',
        variant: 'destructive',
      });
    }
  };

  const handleStartGame = () => {
    if (!gameState || gameState.teams.length === 0) {
      toast({
        title: 'Vänta på lag',
        description: 'Minst ett lag måste ansluta innan spelet kan starta',
        variant: 'destructive',
      });
      return;
    }
    startGame();
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto space-y-4 md:space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">Väntar på lag</h1>
          <p className="text-muted-foreground">
            {isConnected ? 'Ansluten till broadcast' : 'Ansluter...'}
          </p>
        </div>

        {/* QR Code */}
        <Card className="glass">
          <CardContent className="py-6 flex flex-col items-center">
            <div className="w-[200px] md:w-[240px] lg:w-[280px]">
              <QRCode value={joinUrl} size={280} />
            </div>
            <p className="text-sm md:text-base text-muted-foreground mt-4">
              Skanna för att ansluta
            </p>
          </CardContent>
        </Card>

        {/* Game Code */}
        <Card className="glass">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Spelkod</p>
                <p className="text-4xl md:text-5xl lg:text-6xl font-mono font-bold tracking-widest text-primary">
                  {gameCode}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? (
                  <Check className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connected Teams */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              Anslutna lag ({gameState.teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gameState.teams.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Inga lag har anslutit ännu...
              </p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {gameState.teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div
                      className="w-4 h-4 md:w-5 md:h-5 rounded-full"
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
          disabled={gameState.teams.length === 0}
          className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Starta spelet
        </Button>

        {gameState.teams.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Väntar på att minst ett lag ska ansluta...
          </p>
        )}
      </div>
    </div>
  );
}
