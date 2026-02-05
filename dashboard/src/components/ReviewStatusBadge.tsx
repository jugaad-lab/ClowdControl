'use client';

import { CheckCircle2, XCircle, Clock, MinusCircle } from 'lucide-react';
import { ReviewStatus } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  size?: 'sm' | 'md';
}

const REVIEW_CONFIG: Record<
  ReviewStatus,
  { label: string; icon: React.ReactNode; className: string; show: boolean }
> = {
  not_required: {
    label: '',
    icon: <MinusCircle className="h-3.5 w-3.5" />,
    className: '',
    show: false,
  },
  pending: {
    label: 'Pending Review',
    icon: <Clock className="h-3.5 w-3.5" />,
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    show: true,
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    show: true,
  },
  changes_requested: {
    label: 'Changes Requested',
    icon: <XCircle className="h-3.5 w-3.5" />,
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    show: true,
  },
};

export function ReviewStatusBadge({ status, size = 'md' }: ReviewStatusBadgeProps) {
  const config = REVIEW_CONFIG[status];

  if (!config.show) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}

export function getReviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case 'not_required':
      return 'No Review Required';
    case 'pending':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    case 'changes_requested':
      return 'Changes Requested';
    default:
      return 'Unknown';
  }
}
