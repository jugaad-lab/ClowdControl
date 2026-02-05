'use client';

import { Eye } from 'lucide-react';
import { ShadowingMode } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ShadowingBadgeProps {
  mode: ShadowingMode;
  size?: 'sm' | 'md';
}

const SHADOWING_CONFIG: Record<
  ShadowingMode,
  { label: string; className: string; show: boolean }
> = {
  none: {
    label: '',
    className: '',
    show: false,
  },
  recommended: {
    label: 'Shadow Recommended',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    show: true,
  },
  required: {
    label: 'Shadow Required',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    show: true,
  },
};

export function ShadowingBadge({ mode, size = 'md' }: ShadowingBadgeProps) {
  const config = SHADOWING_CONFIG[mode];

  if (!config.show) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <Eye className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}

export function getShadowingLabel(mode: ShadowingMode): string {
  switch (mode) {
    case 'none':
      return 'No Shadowing';
    case 'recommended':
      return 'Shadowing Recommended';
    case 'required':
      return 'Shadowing Required';
    default:
      return 'Unknown';
  }
}
