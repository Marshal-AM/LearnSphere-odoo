'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating);
        const halfFilled = !filled && i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={cn(
              'transition-all duration-200',
              interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : halfFilled
                  ? 'fill-amber-200 text-amber-400'
                  : 'fill-gray-200 text-gray-200'
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold text-gray-700 tabular-nums">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
