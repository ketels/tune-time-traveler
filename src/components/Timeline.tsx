import { Card } from '@/types/game';
import { GameCard } from './GameCard';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeftRight } from 'lucide-react';

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
    console.log('Timeline position clicked:', index, 'isInteractive:', isInteractive);
    if (!onSelectPosition || !isInteractive) return;

    const beforeCard = sortedCards[index - 1];
    const afterCard = sortedCards[index];

    console.log('Calling onSelectPosition with:', beforeCard?.release_year, afterCard?.release_year);
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
    <div className="flex items-center gap-2 md:gap-3 lg:gap-4 overflow-x-auto py-4 md:py-6 px-2 md:px-4 timeline-scroll">
      {/* Position before first card */}
      {isInteractive && (
        <button
          onClick={() => handlePositionClick(0)}
          className={cn(
            'flex-shrink-0 w-12 h-24 md:w-20 md:h-32 lg:w-24 lg:h-36 rounded-lg border-2 border-dashed transition-all flex items-center justify-center cursor-pointer touch-manipulation',
            isPositionSelected(0)
              ? 'border-primary bg-primary/20'
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
          )}
          style={{ minWidth: '48px', minHeight: '96px' }}
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-muted-foreground" />
        </button>
      )}

      {sortedCards.map((card, index) => (
        <div key={card.id} className="flex items-center gap-2 md:gap-3 lg:gap-4">
          <GameCard card={card} showDetails={true} />
          
          {/* Position after each card */}
          {isInteractive && index < sortedCards.length - 1 && (
            <button
              onClick={() => handlePositionClick(index + 1)}
              className={cn(
                'flex-shrink-0 w-12 h-24 md:w-20 md:h-32 lg:w-24 lg:h-36 rounded-lg border-2 border-dashed transition-all flex items-center justify-center cursor-pointer touch-manipulation',
                isPositionSelected(index + 1)
                  ? 'border-primary bg-primary/20'
                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
              )}
              style={{ minWidth: '48px', minHeight: '96px' }}
            >
              <ChevronsLeftRight className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}

      {/* Position after last card */}
      {isInteractive && sortedCards.length > 0 && (
        <button
          onClick={() => handlePositionClick(sortedCards.length)}
          className={cn(
            'flex-shrink-0 w-12 h-24 md:w-20 md:h-32 lg:w-24 lg:h-36 rounded-lg border-2 border-dashed transition-all flex items-center justify-center cursor-pointer touch-manipulation',
            isPositionSelected(sortedCards.length)
              ? 'border-primary bg-primary/20'
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
          )}
          style={{ minWidth: '48px', minHeight: '96px' }}
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}