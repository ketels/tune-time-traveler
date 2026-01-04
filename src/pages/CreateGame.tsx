import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalGame } from '@/hooks/useLocalGame';
import { Music, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DECADES = ['1960', '1970', '1980', '1990', '2000', '2010', '2020'];
const GENRES = ['pop', 'rock', 'hip-hop', 'r&b', 'electronic', 'country', 'jazz', 'classical'];

export default function CreateGame() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const { createGame } = useLocalGame({ isHost: true });

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
    setIsCreating(true);

    try {
      const gameState = createGame({
        decades: selectedDecades,
        genres: selectedGenres,
      });

      // Store game code in localStorage (host has no team)
      localStorage.removeItem('teamId');
      localStorage.setItem('gameCode', gameState.code);

      navigate(`/host/${gameState.code}`);
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
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Skapa nytt spel</h1>
          <p className="text-muted-foreground">Välj musikfilter för spelet</p>
        </div>

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
              Lämna tomt för alla decennier
            </p>
            <div className="grid grid-cols-4 gap-2">
              {DECADES.map((decade) => (
                <label
                  key={decade}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedDecades.includes(decade)}
                    onCheckedChange={() => toggleDecade(decade)}
                  />
                  <span className="text-sm">{decade}s</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Genres */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Music className="w-5 h-5 text-primary" />
              Genrer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Lämna tomt för alla genrer
            </p>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((genre) => (
                <label
                  key={genre}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors capitalize"
                >
                  <Checkbox
                    checked={selectedGenres.includes(genre)}
                    onCheckedChange={() => toggleGenre(genre)}
                  />
                  <span className="text-sm">{genre}</span>
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
          {isCreating ? 'Skapar...' : 'Skapa spel'}
        </Button>

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
