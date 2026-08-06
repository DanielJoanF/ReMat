import type { ReactNode, ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: ElementType | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode | {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-surface-container p-4">
          {typeof Icon === 'function' ? <Icon className="h-8 w-8 text-outline" /> : Icon}
        </div>
      )}
      <h3 className="text-body-md font-semibold text-on-surface mb-1">{title}</h3>
      {description && <p className="text-body-md text-on-surface-variant mb-4">{description}</p>}
      {action && (
        typeof action === 'object' && 'label' in action && 'onClick' in action ? (
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : (
          action
        )
      )}
    </div>
  );
}
