import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createGame, createTeam } from '@/lib/gameActions';
import { DECADES, GENRES } from '@/types/game';
import { Music, Users, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateGame() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hostTeamName, setHostTeamName] = useState('');
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const toggleDecade = (decade: string) => {
    setSelectedDecades(prev => 
      prev.includes(decade) 
        ? prev.filter(d => d !== decade)
        : [...prev, decade]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleCreate = async () => {
    if (!hostTeamName.trim()) {
      toast({
        title: 'Fel',
        description: 'Ange ett lagnamn',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const game = await createGame({
        decades: selectedDecades,
        genres: selectedGenres,
      });

      const team = await createTeam(game.id, hostTeamName.trim(), true);

      // Store team ID in localStorage
      localStorage.setItem('teamId', team.id);
      localStorage.setItem('gameId', game.id);

      navigate(`/host/${game.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte skapa spelet',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Skapa nytt spel</h1>
          <p className="text-muted-foreground">Konfigurera ditt musikspel</p>
        </div>

        {/* Team Name */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Ditt lag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="teamName">Lagnamn</Label>
            <Input
              id="teamName"
              placeholder="Ange ditt lagnamn..."
              value={hostTeamName}
              onChange={(e) => setHostTeamName(e.target.value)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Decades */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Music className="w-5 h-5 text-primary" />
              Decennier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Välj vilka decennier låtarna ska komma från (lämna tomt för alla)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {DECADES.map((decade) => (
                <label
                  key={decade.value}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={selectedDecades.includes(decade.value)}
                    onCheckedChange={() => toggleDecade(decade.value)}
                  />
                  <span className="text-sm font-medium">{decade.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Genres */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Genrer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Välj genrer (lämna tomt för alla)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {GENRES.map((genre) => (
                <label
                  key={genre.value}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={selectedGenres.includes(genre.value)}
                    onCheckedChange={() => toggleGenre(genre.value)}
                  />
                  <span className="text-sm font-medium">{genre.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create Button */}
        <Button
          size="lg"
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <Play className="w-5 h-5 mr-2" />
          {isCreating ? 'Skapar spel...' : 'Skapa spel'}
        </Button>
      </div>
    </div>
  );
}