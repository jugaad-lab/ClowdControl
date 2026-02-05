'use client';

import { useState } from 'react';
import { Check, X, Link2 } from 'lucide-react';
import { Task, TaskDependency } from '@/lib/supabase';
import { wouldCreateCycle } from '@/lib/dependencies';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface DependencySelectorProps {
  currentTaskId?: string;
  selectedDependencies: string[];
  availableTasks: Task[];
  existingDependencies: TaskDependency[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  assigned: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
  blocked: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  review: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
  done: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  cancelled: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-500',
};

export function DependencySelector({
  currentTaskId,
  selectedDependencies,
  availableTasks,
  existingDependencies,
  onChange,
  disabled,
}: DependencySelectorProps) {
  const [search, setSearch] = useState('');

  // Filter out current task and already selected tasks
  const filteredTasks = availableTasks.filter((task) => {
    if (task.id === currentTaskId) return false;

    // Check if adding this dependency would create a cycle
    if (currentTaskId) {
      const wouldCycle = wouldCreateCycle(
        currentTaskId,
        task.id,
        existingDependencies
      );
      if (wouldCycle) return false;
    }

    // Apply search filter
    if (search) {
      return task.title.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleToggle = (taskId: string) => {
    if (selectedDependencies.includes(taskId)) {
      onChange(selectedDependencies.filter((id) => id !== taskId));
    } else {
      onChange([...selectedDependencies, taskId]);
    }
  };

  const handleRemove = (taskId: string) => {
    onChange(selectedDependencies.filter((id) => id !== taskId));
  };

  const selectedTasks = availableTasks.filter((t) =>
    selectedDependencies.includes(t.id)
  );

  return (
    <div className={cn('space-y-3', disabled && 'opacity-50 pointer-events-none')}>
      {/* Selected Dependencies */}
      {selectedTasks.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Blocked By ({selectedTasks.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedTasks.map((task) => (
              <div
                key={task.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-sm"
              >
                <Link2 className="h-3 w-3 text-zinc-400" />
                <span className="max-w-[150px] truncate">{task.title}</span>
                <span
                  className={cn(
                    'px-1 py-0.5 rounded text-xs',
                    STATUS_COLORS[task.status]
                  )}
                >
                  {task.status}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(task.id)}
                  className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Search/Select */}
      <Command className="border border-zinc-200 dark:border-zinc-800 rounded-md">
        <CommandInput
          placeholder="Search tasks to add as dependency..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-48">
          <CommandEmpty>No tasks found.</CommandEmpty>
          <CommandGroup>
            {filteredTasks.slice(0, 10).map((task) => {
              const isSelected = selectedDependencies.includes(task.id);
              return (
                <CommandItem
                  key={task.id}
                  value={task.title}
                  onSelect={() => handleToggle(task.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span className="flex-1 truncate">{task.title}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs',
                      STATUS_COLORS[task.status]
                    )}
                  >
                    {task.status}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>

      {filteredTasks.length > 10 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing 10 of {filteredTasks.length} tasks. Type to filter.
        </p>
      )}
    </div>
  );
}

// Compact badge display for showing dependencies in lists
export function DependencyBadges({
  dependencies,
  tasks,
  maxShow = 2,
}: {
  dependencies: string[];
  tasks: Task[];
  maxShow?: number;
}) {
  if (dependencies.length === 0) return null;

  const depTasks = tasks.filter((t) => dependencies.includes(t.id));
  const shown = depTasks.slice(0, maxShow);
  const remaining = depTasks.length - maxShow;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Link2 className="h-3 w-3 text-zinc-400" />
      {shown.map((task) => (
        <span
          key={task.id}
          className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded max-w-[80px] truncate"
          title={task.title}
        >
          {task.title}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
