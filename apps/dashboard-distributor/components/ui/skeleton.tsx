import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-outline-variant bg-surface-container-lowest p-4', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-lg bg-surface-container animate-pulse" />
        <div className="h-5 w-16 rounded-full bg-surface-container animate-pulse" />
      </div>
      <div className="h-3 w-24 rounded bg-surface-container animate-pulse mb-2" />
      <div className="h-7 w-20 rounded bg-surface-container animate-pulse" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-surface-container-low animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded bg-surface-container animate-pulse',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}
