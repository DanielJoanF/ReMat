import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'grade-a' | 'grade-b' | 'grade-c';
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-surface-container-low text-on-surface-variant',
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-white',
  success: 'bg-status-active-listing text-primary',
  warning: 'bg-status-pending text-tertiary',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-tertiary text-white',
  outline: 'border border-outline-variant text-on-surface-variant',
  'grade-a': 'bg-primary text-white',
  'grade-b': 'bg-secondary text-white',
  'grade-c': 'bg-outline text-white',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-display font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
