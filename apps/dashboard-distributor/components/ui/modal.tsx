'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ open, isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const isVisible = open ?? isOpen ?? false;
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl p-stack-lg animate-slide-in w-full mx-4',
          sizeStyles[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-stack-md">
            <h2 className="text-headline-md font-semibold text-on-surface">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-surface-container-low text-on-surface-variant">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
