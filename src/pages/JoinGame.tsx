import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalGame } from '@/hooks/useLocalGame';
import { Users, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRandomTeamName } from '@/lib/teamNames';

export default function JoinGame() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [gameCode, setGameCode] = useState(searchParams.get('code') || '');
  const [teamName, setTeamName] = useState(getRandomTeamName());
  const [isJoining, setIsJoining] = useState(false);
  const [hasTriedJoin, setHasTriedJoin] = useState(false);

  // Connect to broadcast channel when we have a game code
  const { joinGame, isConnected, gameState } = useLocalGame({ 
    gameCode: gameCode.length === 6 ? gameCode : undefined,
    isHost: false 
  });

  // When connected and have game state, try to join (but only once)
  useEffect(() => {
    if (isJoining && gameState && isConnected && !hasTriedJoin && teamName.trim()) {
      setHasTriedJoin(true);
      
      const doJoin = async () => {
        try {
          console.log('[JoinGame] Attempting to join with team:', teamName);
          const team = await joinGame(teamName.trim());
          
          localStorage.setItem('teamId', team.id);
          localStorage.setItem('gameCode', gameCode);

          toast({
            title: 'Ansluten!',
            description: `Välkommen, ${team.name}!`,
          });

          navigate(`/lobby/${gameCode}`);
        } catch (error) {
          console.error('Error joining game:', error);
          toast({
            title: 'Fel',
            description: error instanceof Error ? error.message : 'Kunde inte gå med i spelet',
            variant: 'destructive',
          });
          setHasTriedJoin(false);
        } finally {
          setIsJoining(false);
        }
      };
      
      doJoin();
    }
  }, [isJoining, gameState, isConnected, hasTriedJoin, teamName, joinGame, gameCode, toast, navigate]);

  const handleJoin = async () => {
    if (!gameCode.trim() || !teamName.trim()) {
      toast({
        title: 'Fel',
        description: 'Fyll i spelkod och lagnamn',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    setHasTriedJoin(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md md:max-w-lg space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">Gå med i spel</h1>
          <p className="text-muted-foreground">Ange spelkoden för att gå med</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              Anslut till spel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gameCode">Spelkod</Label>
              <Input
                id="gameCode"
                placeholder="T.ex. ABC123"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="mt-2 text-center text-2xl md:text-3xl font-mono tracking-widest"
                maxLength={6}
                disabled={isJoining}
              />
            </div>

            <div>
              <Label htmlFor="teamName">Lagnamn</Label>
              <Input
                id="teamName"
                placeholder="Ange ert lagnamn..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="mt-2"
                disabled={isJoining}
              />
            </div>

            <Button
              size="lg"
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {isJoining ? 'Ansluter...' : 'Gå med'}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            Tillbaka till start
          </Button>
        </div>
      </div>
    </div>
  );
}
