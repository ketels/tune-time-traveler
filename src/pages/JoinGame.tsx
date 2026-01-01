import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { joinGame, createTeam } from '@/lib/gameActions';
import { Users, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function JoinGame() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameCode, setGameCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

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

    try {
      const game = await joinGame(gameCode.trim());
      const team = await createTeam(game.id, teamName.trim(), false);

      // Store team ID in localStorage
      localStorage.setItem('teamId', team.id);
      localStorage.setItem('gameId', game.id);

      navigate(`/team/${game.id}`);
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: 'Fel',
        description: error instanceof Error ? error.message : 'Kunde inte gå med i spelet',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Gå med i spel</h1>
          <p className="text-muted-foreground">Ange spelkoden för att gå med</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
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
                className="mt-2 text-center text-2xl font-mono tracking-widest"
                maxLength={6}
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
              />
            </div>

            <Button
              size="lg"
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-5 h-5 mr-2" />
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