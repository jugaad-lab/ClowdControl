'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Task, Agent } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface FilterState {
  status: Task['status'][];
  assignee: string[];
  type: Task['task_type'][];
}

interface TaskFiltersProps {
  agents: Agent[];
  tasks: Task[];
}

const statusOptions: { value: Task['status']; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'waiting_human', label: '🙋 Needs Human' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

const typeOptions: { value: Task['task_type']; label: string }[] = [
  { value: 'development', label: 'Development' },
  { value: 'bug', label: '🐛 Bug' },
  { value: 'research', label: 'Research' },
  { value: 'design', label: 'Design' },
  { value: 'testing', label: 'Testing' },
  { value: 'documentation', label: 'Docs' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

export function useTaskFilters(): FilterState {
  const searchParams = useSearchParams();

  return {
    status: (searchParams.get('status')?.split(',').filter(Boolean) || []) as Task['status'][],
    assignee: searchParams.get('assignee')?.split(',').filter(Boolean) || [],
    type: (searchParams.get('type')?.split(',').filter(Boolean) || []) as Task['task_type'][],
  };
}

export function filterTasks(tasks: Task[], filters: FilterState): Task[] {
  return tasks.filter((task) => {
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }
    if (filters.assignee.length > 0) {
      const assignee = task.assigned_to || 'unassigned';
      if (!filters.assignee.includes(assignee)) {
        return false;
      }
    }
    if (filters.type.length > 0 && !filters.type.includes(task.task_type)) {
      return false;
    }
    return true;
  });
}

export function TaskFilters({ agents, tasks }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useTaskFilters();

  const updateFilters = useCallback(
    (key: keyof FilterState, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(','));
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const toggleFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      const current = filters[key] as string[];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateFilters(key, newValues);
    },
    [filters, updateFilters]
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters = filters.status.length > 0 || filters.assignee.length > 0 || filters.type.length > 0;

  // Get unique assignees from tasks
  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...agents
      .filter((agent) => tasks.some((task) => task.assigned_to === agent.id))
      .map((agent) => ({ value: agent.id, label: agent.display_name })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-6 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Status Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Status
        </span>
        <div className="flex flex-wrap gap-1.5">
          {statusOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={filters.status.includes(option.value)}
              onClick={() => toggleFilter('status', option.value)}
            />
          ))}
        </div>
      </div>

      {/* Assignee Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Assignee
        </span>
        <div className="flex flex-wrap gap-1.5">
          {assigneeOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={filters.assignee.includes(option.value)}
              onClick={() => toggleFilter('assignee', option.value)}
            />
          ))}
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Type
        </span>
        <div className="flex flex-wrap gap-1.5">
          {typeOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={filters.type.includes(option.value)}
              onClick={() => toggleFilter('type', option.value)}
            />
          ))}
        </div>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="ml-auto text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear all
        </Button>
      )}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <Badge
      variant={active ? 'default' : 'outline'}
      className={`cursor-pointer select-none transition-all ${
        active
          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'
          : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
      }`}
      onClick={onClick}
    >
      {label}
    </Badge>
  );
}
