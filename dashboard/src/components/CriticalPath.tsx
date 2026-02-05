'use client';

import { useMemo } from 'react';
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { Task, TaskDependency } from '@/lib/supabase';
import { calculateCriticalPath } from '@/lib/dependencies';
import { cn } from '@/lib/utils';

interface CriticalPathProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: Task) => void;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  cancelled: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400',
};

export function CriticalPath({
  tasks,
  dependencies,
  onTaskClick,
}: CriticalPathProps) {
  const criticalPath = useMemo(() => {
    return calculateCriticalPath(tasks, dependencies);
  }, [tasks, dependencies]);

  const stats = useMemo(() => {
    const incompleteTasks = criticalPath.filter((t) => t.status !== 'done');
    const blockedTasks = criticalPath.filter((t) => t.status === 'blocked');
    const completedTasks = criticalPath.filter((t) => t.status === 'done');

    return {
      total: criticalPath.length,
      completed: completedTasks.length,
      incomplete: incompleteTasks.length,
      blocked: blockedTasks.length,
      progress: criticalPath.length
        ? Math.round((completedTasks.length / criticalPath.length) * 100)
        : 0,
    };
  }, [criticalPath]);

  if (criticalPath.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <Clock className="h-5 w-5" />
          <span>No critical path detected. Add task dependencies to identify the critical path.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Critical Path
            </h3>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              ({stats.total} tasks)
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400">
              {stats.completed} done
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              {stats.incomplete} remaining
            </span>
            {stats.blocked > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {stats.blocked} blocked
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Critical path progress</span>
            <span>{stats.progress}%</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Path visualization */}
      <div className="p-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {criticalPath.map((task, index) => (
            <div key={task.id} className="flex items-center">
              {/* Task card */}
              <div
                onClick={() => onTaskClick?.(task)}
                className={cn(
                  'relative px-3 py-2 rounded-lg border-2 border-orange-200 dark:border-orange-800 cursor-pointer transition-all hover:shadow-md',
                  task.status === 'done'
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : task.status === 'blocked'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-orange-50 dark:bg-orange-900/20'
                )}
              >
                {/* Step number */}
                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>

                <div className="min-w-[120px] max-w-[180px]">
                  <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                    {task.title}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-xs',
                        STATUS_COLORS[task.status]
                      )}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow to next task */}
              {index < criticalPath.length - 1 && (
                <ArrowRight className="h-5 w-5 text-orange-400 mx-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Warning if blocked */}
      {stats.blocked > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Critical path is blocked! {stats.blocked} task(s) need attention.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the IDs of critical path tasks for highlighting
export function getCriticalPathIds(
  tasks: Task[],
  dependencies: TaskDependency[]
): string[] {
  return calculateCriticalPath(tasks, dependencies).map((t) => t.id);
}
