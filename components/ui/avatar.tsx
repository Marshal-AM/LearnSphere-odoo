import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const colorPalette = [
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-blue-500 to-cyan-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-pink-500 to-fuchsia-600',
  'bg-gradient-to-br from-indigo-500 to-violet-600',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

export function Avatar({ src, firstName, lastName, size = 'md', className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const bgColor = getColor(`${firstName}${lastName}`);

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={cn('rounded-full object-cover ring-2 ring-white shadow-sm', sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white shadow-sm',
        sizeMap[size],
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
}
