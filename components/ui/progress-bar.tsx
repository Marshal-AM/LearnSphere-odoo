'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('flex-1 bg-gray-100 rounded-full overflow-hidden', heightMap[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', !color && 'bg-primary')}
          style={color ? { backgroundColor: color } : undefined}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-right tabular-nums">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
