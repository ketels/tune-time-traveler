import { Card } from '@/types/game';
import { GameCard } from './GameCard';
import { cn } from '@/lib/utils';

interface TimelineProps {
  cards: Card[];
  onSelectPosition?: (beforeYear: number | null, afterYear: number | null) => void;
  isInteractive?: boolean;
  selectedPosition?: { before: number | null; after: number | null } | null;
}

export function Timeline({ 
  cards, 
  onSelectPosition, 
  isInteractive = false,
  selectedPosition 
}: TimelineProps) {
  const sortedCards = [...cards].sort((a, b) => a.release_year - b.release_year);

  const handlePositionClick = (index: number) => {
    if (!onSelectPosition || !isInteractive) return;

    const beforeCard = sortedCards[index - 1];
    const afterCard = sortedCards[index];

    onSelectPosition(
      beforeCard ? beforeCard.release_year : null,
      afterCard ? afterCard.release_year : null
    );
  };

  const isPositionSelected = (index: number) => {
    if (!selectedPosition) return false;
    
    const beforeCard = sortedCards[index - 1];
    const afterCard = sortedCards[index];
    
    return (
      (beforeCard?.release_year ?? null) === selectedPosition.before &&
      (afterCard?.release_year ?? null) === selectedPosition.after
    );
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-4 px-2">
      {/* Position before first card */}
      {isInteractive && (
        <button
          onClick={() => handlePositionClick(0)}
          className={cn(
            'flex-shrink-0 w-12 h-24 rounded-lg border-2 border-dashed transition-all',
            isPositionSelected(0)
              ? 'border-primary bg-primary/20'
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
          )}
        >
          <span className="text-xs text-muted-foreground">←</span>
        </button>
      )}

      {sortedCards.map((card, index) => (
        <div key={card.id} className="flex items-center gap-2">
          <GameCard card={card} showDetails={true} />
          
          {/* Position after each card */}
          {isInteractive && index < sortedCards.length - 1 && (
            <button
              onClick={() => handlePositionClick(index + 1)}
              className={cn(
                'flex-shrink-0 w-12 h-24 rounded-lg border-2 border-dashed transition-all',
                isPositionSelected(index + 1)
                  ? 'border-primary bg-primary/20'
                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
              )}
            >
              <span className="text-xs text-muted-foreground">↔</span>
            </button>
          )}
        </div>
      ))}

      {/* Position after last card */}
      {isInteractive && sortedCards.length > 0 && (
        <button
          onClick={() => handlePositionClick(sortedCards.length)}
          className={cn(
            'flex-shrink-0 w-12 h-24 rounded-lg border-2 border-dashed transition-all',
            isPositionSelected(sortedCards.length)
              ? 'border-primary bg-primary/20'
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
          )}
        >
          <span className="text-xs text-muted-foreground">→</span>
        </button>
      )}
    </div>
  );
}