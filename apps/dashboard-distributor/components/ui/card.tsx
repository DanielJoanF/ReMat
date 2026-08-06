import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('px-stack-md pt-stack-md', className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn('text-body-md font-semibold text-on-surface', className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('p-stack-md', className)}>{children}</div>;
}
