import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  color?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  outline: 'border border-gray-200 text-gray-600 bg-white',
};

export function Badge({ children, variant = 'default', className, color }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-medium transition-colors',
        !color && variantStyles[variant],
        className
      )}
      style={color ? { backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30` } : undefined}
    >
      {children}
    </span>
  );
}
