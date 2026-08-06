import { cn } from '@/lib/utils';

type Status = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-surface-container-low', text: 'text-on-surface-variant' },
  PENDING_REVIEW: { label: 'Pending', bg: 'bg-status-pending', text: 'text-tertiary' },
  ACTIVE: { label: 'Active', bg: 'bg-status-active-listing', text: 'text-primary' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-sold-out', text: 'text-on-surface-variant' },
};

export function StatusBadge({ status, className }: { status: Status | string; className?: string }) {
  const config = statusConfig[status as Status] || statusConfig.DRAFT;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-display font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
