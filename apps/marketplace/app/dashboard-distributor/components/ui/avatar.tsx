import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-10 w-10 text-base',
};

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const initials = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-[#065F46] text-white font-bold flex-shrink-0',
        sizeStyles[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
