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
          <div className="animate-spin w-8 h-8 md:w-10 md:h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
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
      <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto space-y-4 md:space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto text-primary mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">Spelet är slut!</h1>
          <p className="text-muted-foreground">Här är resultatet</p>
        </div>

        {/* Results */}
        <div className="space-y-3 md:space-y-4 lg:space-y-5">
          {sortedTeams.map((team, index) => (
            <TeamResult key={team.id} team={team} rank={index + 1} />
          ))}
        </div>

        {/* Back to Home */}
        <Button
          size="lg"
          onClick={handleNewGame}
          className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <Home className="w-4 h-4 md:w-5 md:h-5 mr-2" />
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
          <div className="text-3xl md:text-4xl">
            {medal || <span className="text-muted-foreground">#{rank}</span>}
          </div>

          <div
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: team.color }}
          />

          <div className="flex-1">
            <h3 className="font-bold text-lg md:text-xl lg:text-2xl">{team.name}</h3>
          </div>

          <div className="text-right">
            <span className="text-3xl md:text-4xl lg:text-5xl font-mono font-bold text-primary">
              {cardCount}
            </span>
            <p className="text-xs text-muted-foreground">kort</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
