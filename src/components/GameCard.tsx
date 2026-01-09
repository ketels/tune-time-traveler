import { Card } from '@/types/game';
import { cn } from '@/lib/utils';
import { Lock, Unlock } from 'lucide-react';

interface GameCardProps {
  card: Card;
  isActive?: boolean;
  showDetails?: boolean;
}

export function GameCard({ card, isActive = false, showDetails = true }: GameCardProps) {
  const isUnlocked = card.is_locked === false;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-3 md:p-4 lg:p-5 rounded-xl transition-all duration-300',
        'min-w-[80px] md:min-w-[120px] lg:min-w-[140px] min-h-[100px] md:min-h-[140px] lg:min-h-[160px]',
        card.is_start_card || (!isUnlocked && !card.is_start_card)
          ? 'bg-secondary border-2 border-dashed border-border'
          : isUnlocked
          ? 'glass glow-sm border-2 border-amber-500 opacity-80 shadow-lg shadow-amber-500/50'
          : 'glass glow-sm opacity-80',
        !card.is_start_card && isUnlocked && 'hover:opacity-100',
        isActive && 'ring-2 ring-primary opacity-100'
      )}
    >
      {/* Lock/Unlock indicator */}
      {!card.is_start_card && (
        <div className="absolute top-1 right-1">
          {isUnlocked ? (
            <Unlock className="w-3 h-3 md:w-4 md:h-4 text-amber-500" />
          ) : (
            <Lock className="w-3 h-3 md:w-4 md:h-4 text-green-500 opacity-50" />
          )}
        </div>
      )}

      <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary font-mono">
        {card.release_year}
      </span>

      {showDetails && !card.is_start_card && (
        <div className="mt-2 text-center">
          <p className="text-xs md:text-sm text-foreground font-medium truncate max-w-[100px] md:max-w-[140px] lg:max-w-[160px]">
            {card.song_name}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground truncate max-w-[100px] md:max-w-[140px] lg:max-w-[160px]">
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