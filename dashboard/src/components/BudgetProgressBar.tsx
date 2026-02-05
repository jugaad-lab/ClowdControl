'use client';

import { Coins, AlertTriangle } from 'lucide-react';
import { formatTokens, getBudgetPercentage, getBudgetStatusColor } from '@/lib/agents';
import { cn } from '@/lib/utils';

interface BudgetProgressBarProps {
  used: number;
  budget: number;
  showWarning?: boolean;
  compact?: boolean;
}

const STATUS_COLORS = {
  green: {
    bar: 'bg-green-500 dark:bg-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  yellow: {
    bar: 'bg-yellow-500 dark:bg-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  orange: {
    bar: 'bg-orange-500 dark:bg-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  red: {
    bar: 'bg-red-500 dark:bg-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
};

export function BudgetProgressBar({
  used,
  budget,
  showWarning = true,
  compact = false,
}: BudgetProgressBarProps) {
  const percentage = getBudgetPercentage(used, budget);
  const statusColor = getBudgetStatusColor(percentage);
  const colors = STATUS_COLORS[statusColor as keyof typeof STATUS_COLORS];
  const isOverBudget = used > budget;
  const showWarningBanner = showWarning && percentage >= 80;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', colors.bar)}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <span className={cn('text-xs font-medium tabular-nums', colors.text)}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Token Budget</span>
        </div>
        <div className={cn('text-sm font-medium tabular-nums', colors.text)}>
          {formatTokens(used)} / {formatTokens(budget)}
        </div>
      </div>

      <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colors.bar,
            isOverBudget && 'animate-pulse'
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{percentage.toFixed(1)}% used</span>
        <span>{formatTokens(Math.max(0, budget - used))} remaining</span>
      </div>

      {showWarningBanner && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
            colors.bg,
            colors.text
          )}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            {isOverBudget
              ? `Over budget by ${formatTokens(used - budget)} tokens`
              : percentage >= 95
              ? 'Budget nearly exhausted'
              : 'Approaching budget limit'}
          </span>
        </div>
      )}
    </div>
  );
}

// Mini variant for inline displays
export function BudgetMini({ used, budget }: { used: number; budget: number }) {
  const percentage = getBudgetPercentage(used, budget);
  const statusColor = getBudgetStatusColor(percentage);
  const colors = STATUS_COLORS[statusColor as keyof typeof STATUS_COLORS];

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div
          className={cn('h-full rounded-full', colors.bar)}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <span className={cn('text-xs tabular-nums', colors.text)}>{formatTokens(used)}</span>
    </div>
  );
}
