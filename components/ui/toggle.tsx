'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={cn('flex items-center gap-3', disabled ? 'opacity-50' : 'cursor-pointer')}>
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 cursor-pointer',
          checked ? 'bg-primary' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white transition-transform duration-300 shadow-sm',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      {(label || description) && (
        <div>
          {label && <span className="text-sm font-medium text-gray-900">{label}</span>}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )}
    </label>
  );
}
