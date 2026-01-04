import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalGame } from '@/hooks/useLocalGame';
import { getSortedTeamsByScore, LocalTeam } from '@/lib/localGameState';
import { Trophy, Home } from 'lucide-react';

export default function Results() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  
  const { gameState, loading, clearGame } = useLocalGame({ 
    gameCode, 
    isHost: false 
  });

  const handleNewGame = () => {
    clearGame();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar resultat...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Inga resultat hittades</p>
          <Button onClick={() => navigate('/')}>Tillbaka till start</Button>
        </div>
      </div>
    );
  }

  const sortedTeams = getSortedTeamsByScore(gameState);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-gradient mb-2">Spelet är slut!</h1>
          <p className="text-muted-foreground">Här är resultatet</p>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {sortedTeams.map((team, index) => (
            <TeamResult key={team.id} team={team} rank={index + 1} />
          ))}
        </div>

        {/* Back to Home */}
        <Button
          size="lg"
          onClick={handleNewGame}
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <Home className="w-5 h-5 mr-2" />
          Nytt spel
        </Button>
      </div>
    </div>
  );
}

function TeamResult({ team, rank }: { team: LocalTeam; rank: number }) {
  const cardCount = team.cards.filter(c => !c.isStartCard).length;

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const medal = getMedalEmoji(rank);

  return (
    <Card className={`glass ${rank === 1 ? 'ring-2 ring-primary glow-primary' : ''}`}>
      <CardContent className="py-6">
        <div className="flex items-center gap-4">
          <div className="text-3xl">
            {medal || <span className="text-muted-foreground">#{rank}</span>}
          </div>
          
          <div
            className="w-10 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: team.color }}
          />
          
          <div className="flex-1">
            <h3 className="font-bold text-lg">{team.name}</h3>
          </div>
          
          <div className="text-right">
            <span className="text-3xl font-mono font-bold text-primary">
              {cardCount}
            </span>
            <p className="text-xs text-muted-foreground">kort</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
