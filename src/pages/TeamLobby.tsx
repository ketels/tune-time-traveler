import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalGame } from '@/hooks/useLocalGame';
import { Users, Clock } from 'lucide-react';

export default function TeamLobby() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  
  const { gameState, loading, myTeam, isConnected } = useLocalGame({ 
    gameCode, 
    isHost: false 
  });

  // Redirect when game starts
  useEffect(() => {
    if (gameState?.status === 'playing') {
      navigate(`/team/${gameCode}`);
    }
  }, [gameState?.status, gameCode, navigate]);

  if (loading || !isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Ansluter till spel...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Väntar på speldata...</p>
        </div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Ditt lag hittades inte</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Ansluten!</h1>
          <p className="text-muted-foreground">Väntar på att spelet ska starta</p>
        </div>

        {/* My Team */}
        <Card className="glass ring-2 ring-primary">
          <CardContent className="py-6 text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4"
              style={{ backgroundColor: myTeam.color }}
            />
            <h2 className="text-2xl font-bold">{myTeam.name}</h2>
            <p className="text-muted-foreground mt-1">Ditt lag</p>
          </CardContent>
        </Card>

        {/* Waiting Animation */}
        <div className="flex items-center justify-center gap-3 py-8">
          <Clock className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-muted-foreground">Väntar på värden...</span>
        </div>

        {/* Other Teams */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Alla lag ({gameState.teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gameState.teams.map((team) => (
                <div
                  key={team.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    team.id === myTeam.id ? 'bg-primary/20' : 'bg-secondary/50'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-medium">{team.name}</span>
                  {team.id === myTeam.id && (
                    <span className="ml-auto text-xs text-primary">Du</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
