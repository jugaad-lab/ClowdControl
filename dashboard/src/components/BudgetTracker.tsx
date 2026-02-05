'use client';

import { useMemo } from 'react';
import { Coins, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { formatTokens, getBudgetPercentage, getBudgetStatusColor } from '@/lib/agents';
import { cn } from '@/lib/utils';
import { Project, Task, Sprint } from '@/lib/supabase';

interface BudgetTrackerProps {
  project: Project;
  tasks: Task[];
  sprints: Sprint[];
}

// Blended cost per 1M tokens (input+output average)
const MODEL_BLENDED_COSTS: Record<string, number> = {
  'claude-sonnet-4': 9,
  'claude-haiku-3.5': 2.4,
  'claude-opus-4.5': 45,
};

const DEFAULT_BLENDED_COST = 9; // default to sonnet pricing

function estimateCostDollars(tokens: number, blendedCostPer1M: number = DEFAULT_BLENDED_COST): number {
  return (tokens / 1_000_000) * blendedCostPer1M;
}

function formatCost(dollars: number): string {
  if (dollars < 0.01) return '<$0.01';
  if (dollars < 1) return `$${dollars.toFixed(2)}`;
  if (dollars < 100) return `$${dollars.toFixed(2)}`;
  return `$${dollars.toFixed(0)}`;
}

const STATUS_COLORS = {
  green: {
    bar: 'bg-green-500 dark:bg-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  yellow: {
    bar: 'bg-yellow-500 dark:bg-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  orange: {
    bar: 'bg-orange-500 dark:bg-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  red: {
    bar: 'bg-red-500 dark:bg-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
};

export function BudgetTracker({ project, tasks, sprints }: BudgetTrackerProps) {
  const budget = project.token_budget ?? 0;
  const used = project.tokens_used ?? 0;
  const remaining = Math.max(0, budget - used);
  const percentage = getBudgetPercentage(used, budget);
  const statusColor = getBudgetStatusColor(percentage);
  const colors = STATUS_COLORS[statusColor as keyof typeof STATUS_COLORS];

  // Calculate burn rate: tokens consumed per day based on completed tasks
  const burnRate = useMemo(() => {
    const completedTasks = tasks.filter(
      (t) => t.status === 'done' && t.tokens_consumed > 0 && t.completed_at
    );

    if (completedTasks.length === 0) return null;

    const dates = completedTasks.map((t) => new Date(t.completed_at!).getTime());
    const earliest = Math.min(...dates);
    const latest = Math.max(...dates);
    const daySpan = Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24));
    const totalTokens = completedTasks.reduce((sum, t) => sum + t.tokens_consumed, 0);

    return {
      tokensPerDay: totalTokens / daySpan,
      daysRemaining: remaining > 0 ? remaining / (totalTokens / daySpan) : 0,
    };
  }, [tasks, remaining]);

  // Per-sprint breakdown
  const sprintBreakdown = useMemo(() => {
    return sprints
      .map((sprint) => {
        const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id);
        const tokensUsed = sprintTasks.reduce((sum, t) => sum + (t.tokens_consumed ?? 0), 0);
        const taskCount = sprintTasks.length;
        const completedCount = sprintTasks.filter((t) => t.status === 'done').length;

        return {
          id: sprint.id,
          name: sprint.name,
          status: sprint.status,
          tokensUsed,
          taskCount,
          completedCount,
        };
      })
      .filter((s) => s.tokensUsed > 0 || s.status === 'active');
  }, [sprints, tasks]);

  // Cost estimates
  const costUsed = estimateCostDollars(used);
  const costBudget = estimateCostDollars(budget);
  const costRemaining = estimateCostDollars(remaining);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        <h3 className="font-semibold text-zinc-900 dark:text-white">Budget Tracker</h3>
      </div>

      {/* Main budget bar */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Token Usage</span>
          <span className={cn('font-medium tabular-nums', colors.text)}>
            {formatTokens(used)} / {formatTokens(budget)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colors.bar,
              used > budget && 'animate-pulse'
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{percentage.toFixed(1)}% used</span>
          <span>{formatTokens(remaining)} remaining</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Cost Estimate */}
        <div className="rounded-md border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Est. Cost</span>
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
            {formatCost(costUsed)}
          </p>
          <p className="text-xs text-zinc-400 tabular-nums">
            of {formatCost(costBudget)}
          </p>
        </div>

        {/* Burn Rate */}
        <div className="rounded-md border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Burn Rate</span>
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
            {burnRate ? `${formatTokens(Math.round(burnRate.tokensPerDay))}/day` : '-'}
          </p>
          <p className="text-xs text-zinc-400 tabular-nums">
            {burnRate ? formatCost(estimateCostDollars(burnRate.tokensPerDay)) + '/day' : 'No data'}
          </p>
        </div>

        {/* Projected */}
        <div className="rounded-md border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Runway</span>
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
            {burnRate && burnRate.daysRemaining > 0
              ? `${Math.round(burnRate.daysRemaining)}d`
              : '-'}
          </p>
          <p className="text-xs text-zinc-400">
            {burnRate && burnRate.daysRemaining > 0
              ? formatCost(costRemaining) + ' left'
              : 'No data'}
          </p>
        </div>
      </div>

      {/* Sprint breakdown */}
      {sprintBreakdown.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Per-Sprint Breakdown
          </h4>
          <div className="space-y-2">
            {sprintBreakdown.map((sprint) => (
              <div
                key={sprint.id}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-700 dark:text-zinc-300">{sprint.name}</span>
                  {sprint.status === 'active' && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {sprint.completedCount}/{sprint.taskCount} tasks
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {formatTokens(sprint.tokensUsed)}
                  </span>
                  <span className="text-zinc-400">
                    {formatCost(estimateCostDollars(sprint.tokensUsed))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
