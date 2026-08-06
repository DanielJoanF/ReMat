'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  value: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-outline-variant">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-label-md font-display font-medium transition-colors border-b-2 -mb-px',
            value === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
