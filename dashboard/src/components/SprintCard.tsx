'use client';

import { Sprint, Task } from '@/lib/supabase';
import { CalendarDays, CheckCircle2, Circle, Clock, Layers } from 'lucide-react';

interface SprintCardProps {
  sprint: Sprint;
  tasks: Task[];
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDropTarget?: boolean;
}

const statusConfig: Record<Sprint['status'], { label: string; color: string; bg: string }> = {
  planned: {
    label: 'Planned',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
  },
  active: {
    label: 'Active',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  review: {
    label: 'In Review',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
  },
  completed: {
    label: 'Completed',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getDaysRemaining(endDate: string | null): string | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Ends today';
  if (diff === 1) return '1 day left';
  return `${diff} days left`;
}

export function SprintCard({
  sprint,
  tasks,
  onDragOver,
  onDrop,
  isDropTarget,
}: SprintCardProps) {
  const status = statusConfig[sprint.status];
  const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id);
  const completedTasks = sprintTasks.filter((t) => t.status === 'done');
  const progress = sprintTasks.length > 0 ? (completedTasks.length / sprintTasks.length) * 100 : 0;
  const daysRemaining = sprint.status === 'active' ? getDaysRemaining(sprint.planned_end) : null;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        relative bg-white dark:bg-zinc-900 rounded-xl border-2 transition-all duration-200
        ${isDropTarget
          ? 'border-blue-400 dark:border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/50 scale-[1.02]'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        }
      `}
    >
      {/* Status indicator stripe */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
          sprint.status === 'active'
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : sprint.status === 'completed'
            ? 'bg-gradient-to-r from-blue-400 to-blue-500'
            : sprint.status === 'review'
            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
            : 'bg-zinc-200 dark:bg-zinc-700'
        }`}
      />

      <div className="p-5 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                Sprint {sprint.number}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}>
                {status.label}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {sprint.name}
            </h3>
          </div>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          <CalendarDays className="w-4 h-4" />
          <span>
            {formatDate(sprint.planned_start)} — {formatDate(sprint.planned_end)}
          </span>
          {daysRemaining && (
            <span
              className={`ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                daysRemaining === 'Overdue'
                  ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50'
                  : daysRemaining === 'Ends today'
                  ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50'
                  : 'text-zinc-600 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800'
              }`}
            >
              <Clock className="w-3 h-3" />
              {daysRemaining}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-400 to-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <Layers className="w-4 h-4" />
            <span>{sprintTasks.length} tasks</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completedTasks.length} done</span>
          </div>
          {sprintTasks.length - completedTasks.length > 0 && (
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-500">
              <Circle className="w-4 h-4" />
              <span>{sprintTasks.length - completedTasks.length} remaining</span>
            </div>
          )}
        </div>

        {/* Acceptance criteria preview */}
        {sprint.acceptance_criteria.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Acceptance Criteria
            </div>
            <div className="space-y-1">
              {sprint.acceptance_criteria.slice(0, 3).map((criteria) => (
                <div
                  key={criteria.id}
                  className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                >
                  {criteria.verified ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span className={criteria.verified ? 'line-through opacity-60' : ''}>
                    {criteria.description.length > 50
                      ? `${criteria.description.slice(0, 50)}...`
                      : criteria.description}
                  </span>
                </div>
              ))}
              {sprint.acceptance_criteria.length > 3 && (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 pl-5">
                  +{sprint.acceptance_criteria.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
