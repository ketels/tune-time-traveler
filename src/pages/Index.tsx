import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if there's a game code in URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      navigate(`/join?code=${code}`);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-slide-up space-y-6 max-w-md md:max-w-lg">
          {/* Logo/Icon */}
          <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
            <Music className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-primary-foreground" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient mb-3">
              Musik Timeline
            </h1>
            <p className="text-muted-foreground text-base md:text-lg lg:text-xl">
              Gissa när låten släpptes och bygg din tidslinje!
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3 md:space-y-4">
            <Button
              size="lg"
              onClick={() => navigate('/create')}
              className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              Skapa nytt spel
            </Button>

            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/join')}
              className="w-full h-12 md:h-14 text-base md:text-lg font-semibold"
            >
              Gå med i spel
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-xs md:text-sm text-muted-foreground">
        <p>Inspirerat av Hitster</p>
      </footer>
    </div>
  );
};

export default Index;