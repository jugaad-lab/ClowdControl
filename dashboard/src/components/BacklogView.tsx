'use client';

import { useState, useMemo } from 'react';
import { Task } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowDownAZ,
  ArrowUpDown,
  ChevronDown,
  Filter,
  GripVertical,
  Inbox,
  Layers,
  X,
} from 'lucide-react';

interface BacklogViewProps {
  tasks: Task[];
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDropTarget?: boolean;
}

type SortOption = 'priority-desc' | 'priority-asc' | 'created-desc' | 'created-asc' | 'title-asc';
type TaskType = Task['task_type'] | 'all';

const taskTypeConfig: Record<Task['task_type'], { label: string; color: string; bg: string }> = {
  development: {
    label: 'Development',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-950',
  },
  research: {
    label: 'Research',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-950',
  },
  design: {
    label: 'Design',
    color: 'text-pink-700 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-950',
  },
  testing: {
    label: 'Testing',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
  },
  bug: {
    label: 'Bug',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-950',
  },
  documentation: {
    label: 'Docs',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950',
  },
  business: {
    label: 'Business',
    color: 'text-cyan-700 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-950',
  },
  marketing: {
    label: 'Marketing',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-950',
  },
  other: {
    label: 'Other',
    color: 'text-zinc-700 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-700',
  },
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'priority-desc', label: 'Priority (High → Low)' },
  { value: 'priority-asc', label: 'Priority (Low → High)' },
  { value: 'created-desc', label: 'Newest First' },
  { value: 'created-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title (A → Z)' },
];

function getPriorityStyle(priority: number): { color: string; bg: string } {
  if (priority >= 8) {
    return {
      color: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-950',
    };
  }
  if (priority >= 5) {
    return {
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950',
    };
  }
  return {
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-700',
  };
}

export function BacklogView({
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
  isDropTarget,
}: BacklogViewProps) {
  const [sortBy, setSortBy] = useState<SortOption>('priority-desc');
  const [filterType, setFilterType] = useState<TaskType>('all');
  const [filterAssignee, setFilterAssignee] = useState<string | 'all'>('all');

  // Get backlog tasks (sprint_id = null)
  const backlogTasks = useMemo(() => {
    return tasks.filter((t) => t.sprint_id === null);
  }, [tasks]);

  // Get unique assignees from backlog tasks
  const assignees = useMemo(() => {
    const assigneeSet = new Set<string>();
    backlogTasks.forEach((t) => {
      if (t.assigned_to) {
        assigneeSet.add(t.assigned_to);
      }
    });
    return Array.from(assigneeSet);
  }, [backlogTasks]);

  // Get unique task types from backlog
  const availableTypes = useMemo(() => {
    const typeSet = new Set<Task['task_type']>();
    backlogTasks.forEach((t) => {
      typeSet.add(t.task_type);
    });
    return Array.from(typeSet);
  }, [backlogTasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...backlogTasks];

    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter((t) => t.task_type === filterType);
    }

    // Apply assignee filter
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        result = result.filter((t) => !t.assigned_to);
      } else {
        result = result.filter((t) => t.assigned_to === filterAssignee);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'priority-desc':
          return b.priority - a.priority;
        case 'priority-asc':
          return a.priority - b.priority;
        case 'created-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [backlogTasks, filterType, filterAssignee, sortBy]);

  const hasActiveFilters = filterType !== 'all' || filterAssignee !== 'all';

  const clearFilters = () => {
    setFilterType('all');
    setFilterAssignee('all');
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        rounded-xl border-2 transition-all duration-200 min-h-[500px] flex flex-col
        ${
          isDropTarget
            ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-4 ring-blue-100 dark:ring-blue-900/50'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
        }
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Backlog</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            ({filteredAndSortedTasks.length}
            {hasActiveFilters && ` of ${backlogTasks.length}`})
          </span>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={sortBy === option.value ? 'bg-accent' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filterType !== 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <Filter className="w-3.5 h-3.5" />
                Type
                {filterType !== 'all' && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                    {taskTypeConfig[filterType]?.label || filterType}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-accent' : ''}
              >
                All Types
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {availableTypes.map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={filterType === type ? 'bg-accent' : ''}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${taskTypeConfig[type].bg} mr-2`}
                  />
                  {taskTypeConfig[type].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assignee Filter */}
          {assignees.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={filterAssignee !== 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Assignee
                  {filterAssignee !== 'all' && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                      {filterAssignee === 'unassigned' ? 'None' : filterAssignee.slice(0, 8)}
                    </Badge>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by assignee</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setFilterAssignee('all')}
                  className={filterAssignee === 'all' ? 'bg-accent' : ''}
                >
                  All Assignees
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterAssignee('unassigned')}
                  className={filterAssignee === 'unassigned' ? 'bg-accent' : ''}
                >
                  Unassigned
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {assignees.map((assignee) => (
                  <DropdownMenuItem
                    key={assignee}
                    onClick={() => setFilterAssignee(assignee)}
                    className={filterAssignee === assignee ? 'bg-accent' : ''}
                  >
                    {assignee.length > 20 ? `${assignee.slice(0, 20)}...` : assignee}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              onClick={clearFilters}
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Drag tasks to a sprint to assign them
      </p>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredAndSortedTasks.map((task) => {
            const typeConfig = taskTypeConfig[task.task_type];
            const priorityStyle = getPriorityStyle(task.priority);

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
                className="group bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 cursor-grab active:cursor-grabbing hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-zinc-900 dark:text-white mb-1.5 truncate">
                      {task.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${typeConfig.color} ${typeConfig.bg}`}
                      >
                        {typeConfig.label}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityStyle.color} ${priorityStyle.bg}`}
                      >
                        P{task.priority}
                      </span>
                      {task.assigned_to && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]">
                          @{task.assigned_to.split('@')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAndSortedTasks.length === 0 && (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {hasActiveFilters ? (
                <>
                  <p className="text-sm">No tasks match filters</p>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 mt-1"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <p className="text-sm">No tasks in backlog</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      {backlogTasks.length > 0 && (
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center justify-between">
            <span>
              {backlogTasks.filter((t) => t.priority >= 8).length} high priority
            </span>
            <span>
              {backlogTasks.filter((t) => !t.assigned_to).length} unassigned
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
