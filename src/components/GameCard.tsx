import { Card } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameCardProps {
  card: Card;
  isActive?: boolean;
  showDetails?: boolean;
}

export function GameCard({ card, isActive = false, showDetails = true }: GameCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300',
        'min-w-[80px] min-h-[100px]',
        card.is_start_card
          ? 'bg-secondary border-2 border-dashed border-border'
          : 'glass glow-sm',
        isActive && 'ring-2 ring-primary animate-pulse-glow'
      )}
    >
      <span className="text-2xl font-bold text-primary font-mono">
        {card.release_year}
      </span>
      
      {showDetails && !card.is_start_card && (
        <div className="mt-2 text-center">
          <p className="text-xs text-foreground font-medium truncate max-w-[100px]">
            {card.song_name}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[100px]">
            {card.artist_name}
          </p>
        </div>
      )}
      
      {card.is_start_card && (
        <span className="text-xs text-muted-foreground mt-1">Start</span>
      )}
    </div>
  );
}