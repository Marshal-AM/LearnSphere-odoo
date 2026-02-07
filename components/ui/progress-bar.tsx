import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function ProgressBar({ value, className, showLabel = false, size = 'md', color }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightMap = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-gray-200 rounded-full overflow-hidden', heightMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', !color && 'bg-primary')}
          style={{ width: `${clampedValue}%`, ...(color ? { backgroundColor: color } : {}) }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-right">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
