'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Agent, supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortField = 'title' | 'status' | 'assigned_to' | 'priority' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface TaskListViewProps {
  tasks: Task[];
  agents: Agent[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (task: Task) => void;
}

const statusConfig: Record<Task['status'], { label: string; className: string }> = {
  backlog: { label: 'Backlog', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  in_progress: { label: 'In Progress', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  blocked: { label: 'Blocked', className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
  waiting_human: { label: 'Needs Human', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  review: { label: 'Review', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  done: { label: 'Done', className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  cancelled: { label: 'Cancelled', className: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400' },
};

const priorityConfig: Record<number, { label: string; className: string }> = {
  0: { label: 'Low', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  1: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  2: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  3: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
};

const statusOrder: Task['status'][] = ['backlog', 'assigned', 'in_progress', 'blocked', 'review', 'done', 'cancelled'];

export function TaskListView({ tasks, agents, onTaskClick, onTaskUpdate }: TaskListViewProps) {
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Inline editing state
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [saving, setSaving] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing title
  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitleId]);

  // Auto-save task field
  const saveTaskField = async (taskId: string, field: string, value: string | null) => {
    setSaving(taskId);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      onTaskUpdate?.(data as Task);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setSaving(null);
    }
  };

  // Handle title click to start editing
  const handleTitleClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setEditingTitleId(task.id);
    setEditingTitleValue(task.title);
  };

  // Handle title blur to save
  const handleTitleBlur = (taskId: string) => {
    if (editingTitleValue.trim()) {
      const task = tasks.find(t => t.id === taskId);
      if (task && editingTitleValue.trim() !== task.title) {
        saveTaskField(taskId, 'title', editingTitleValue.trim());
      }
    }
    setEditingTitleId(null);
  };

  // Handle title keydown
  const handleTitleKeyDown = (e: React.KeyboardEvent, taskId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur(taskId);
    } else if (e.key === 'Escape') {
      setEditingTitleId(null);
    }
  };

  // Handle status change
  const handleStatusChange = (e: React.MouseEvent, taskId: string, newStatus: Task['status']) => {
    e.stopPropagation();
    saveTaskField(taskId, 'status', newStatus);
  };

  // Handle assignee change
  const handleAssigneeChange = (e: React.MouseEvent, taskId: string, agentId: string | null) => {
    e.stopPropagation();
    saveTaskField(taskId, 'assigned_to', agentId);
  };

  const getAgentName = (agentId: string | null): string => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find((a) => a.id === agentId);
    return agent?.display_name || agentId;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'priority' ? 'desc' : 'asc');
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          break;
        case 'assigned_to':
          const nameA = getAgentName(a.assigned_to);
          const nameB = getAgentName(b.assigned_to);
          comparison = nameA.localeCompare(nameB);
          break;
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection, agents]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-zinc-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-zinc-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
        <svg className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="text-xs mt-1">Tasks will appear here once created</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
            <SortableHeader field="title">Title</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <SortableHeader field="assigned_to">Assignee</SortableHeader>
            <SortableHeader field="priority">Priority</SortableHeader>
            <SortableHeader field="created_at">Created</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => onTaskClick?.(task)}
            >
              <TableCell className="font-medium text-zinc-900 dark:text-white max-w-[300px]">
                <div className="flex items-center gap-2">
                  {editingTitleId === task.id ? (
                    <Input
                      ref={titleInputRef}
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onBlur={() => handleTitleBlur(task.id)}
                      onKeyDown={(e) => handleTitleKeyDown(e, task.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 text-sm font-medium"
                    />
                  ) : (
                    <span
                      className="truncate cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800 px-1.5 py-0.5 -mx-1.5 rounded transition-colors"
                      onClick={(e) => handleTitleClick(e, task)}
                    >
                      {task.title}
                      {saving === task.id && (
                        <span className="ml-2 text-xs text-zinc-400">Saving...</span>
                      )}
                    </span>
                  )}
                  {task.task_type && editingTitleId !== task.id && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0">
                      {task.task_type}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none">
                      <Badge
                        className={`${statusConfig[task.status].className} cursor-pointer hover:opacity-80 transition-opacity`}
                        variant="secondary"
                      >
                        {statusConfig[task.status].label}
                      </Badge>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {statusOrder.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={(e) => handleStatusChange(e, task.id, status)}
                        className={task.status === status ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                      >
                        <Badge className={`${statusConfig[status].className} mr-2`} variant="secondary">
                          {statusConfig[status].label}
                        </Badge>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell className="text-zinc-600 dark:text-zinc-400" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer px-1.5 py-0.5 -mx-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      {getAgentName(task.assigned_to)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={(e) => handleAssigneeChange(e, task.id, null)}
                      className={!task.assigned_to ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                    >
                      Unassigned
                    </DropdownMenuItem>
                    {agents.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={(e) => handleAssigneeChange(e, task.id, agent.id)}
                        className={task.assigned_to === agent.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                      >
                        {agent.display_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell>
                <Badge className={priorityConfig[task.priority]?.className || priorityConfig[0].className} variant="secondary">
                  {priorityConfig[task.priority]?.label || 'Low'}
                </Badge>
              </TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">
                {formatDate(task.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
