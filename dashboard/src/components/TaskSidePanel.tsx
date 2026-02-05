'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Agent, supabase, TaskComplexity, ShadowingMode, ReviewStatus } from '@/lib/supabase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ComplexityBadge, ComplexitySelector } from '@/components/ComplexitySelector';
import { ShadowingBadge } from '@/components/ShadowingBadge';
import { ShadowingSelector } from '@/components/ShadowingSelector';
import { ReviewStatusBadge } from '@/components/ReviewStatusBadge';
import { formatTokens } from '@/lib/agents';
import { calculateTaskCost, formatCost } from '@/lib/cost-calculator';

// Extended task type that may include estimated_hours from the DB
interface TaskWithEstimate extends Task {
  estimated_hours?: number | null;
}

function estimateTokensFromHours(hours: number): number {
  // Rough heuristic: 1 hour of agent work ~ 200K tokens
  return Math.round(hours * 200_000);
}

function formatCostFromTokens(tokens: number): string {
  const breakdown = calculateTaskCost({ tokens_consumed: tokens });
  return formatCost(breakdown.totalCost);
}

function TokenUsageDisplay({ tokens, estimatedTokens: directEstimate, estimatedHours }: { tokens: number; estimatedTokens?: number | null; estimatedHours?: number | null }) {
  // Prefer direct estimated_tokens, fall back to derived from estimated_hours
  const estimatedTokens = directEstimate ?? (estimatedHours ? estimateTokensFromHours(estimatedHours) : null);
  const ratio = estimatedTokens ? tokens / estimatedTokens : null;
  const accuracy = ratio !== null ? Math.round((1 - Math.abs(1 - ratio)) * 100) : null;

  // Color coding: green (under estimate), yellow (close), red (over estimate)
  let colorClass = 'text-zinc-700 dark:text-zinc-300';
  if (ratio !== null) {
    if (ratio <= 0.8) {
      colorClass = 'text-green-600 dark:text-green-400';
    } else if (ratio <= 1.2) {
      colorClass = 'text-yellow-600 dark:text-yellow-400';
    } else {
      colorClass = 'text-red-600 dark:text-red-400';
    }
  }

  return (
    <div className="space-y-1.5">
      <p className={`text-sm font-medium tabular-nums ${colorClass}`}>
        {formatTokens(tokens)}
        <span className="ml-1.5 text-xs font-normal text-zinc-400">
          (~{formatCostFromTokens(tokens)})
        </span>
      </p>
      {estimatedTokens != null && estimatedTokens > 0 && (
        <>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            Est: {formatTokens(estimatedTokens)}
            <span className="ml-1 text-zinc-400">(~{formatCostFromTokens(estimatedTokens)})</span>
          </p>
          {ratio !== null && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    ratio <= 0.8 ? 'bg-green-500' : ratio <= 1.2 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium tabular-nums ${colorClass}`}>
                {ratio <= 1
                  ? `${((1 - ratio) * 100).toFixed(0)}% under`
                  : `${((ratio - 1) * 100).toFixed(0)}% over`}
              </span>
            </div>
          )}
          {accuracy !== null && (
            <p className="text-xs text-zinc-400 tabular-nums">
              Accuracy: {Math.max(accuracy, 0)}%
            </p>
          )}
        </>
      )}
    </div>
  );
}

interface TaskSidePanelProps {
  task: Task | null;
  agents: Agent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate?: (task: Task) => void;
}

const statusOptions: { value: Task['status']; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'waiting_human', label: 'Needs Human' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

const priorityOptions: { value: number; label: string }[] = [
  { value: 0, label: 'Low' },
  { value: 1, label: 'Medium' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Critical' },
];

const priorityConfig: Record<number, { label: string; className: string }> = {
  0: { label: 'Low', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  1: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  2: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  3: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
};

const taskTypeOptions: { value: Task['task_type']; label: string }[] = [
  { value: 'development', label: 'Development' },
  { value: 'research', label: 'Research' },
  { value: 'design', label: 'Design' },
  { value: 'testing', label: 'Testing' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

export function TaskSidePanel({
  task,
  agents,
  open,
  onOpenChange,
  onTaskUpdate,
}: TaskSidePanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({});

  // Inline editing state for view mode
  const [editingTitle, setEditingTitle] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineSaving, setInlineSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing title
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // Save a single field inline
  const saveInlineField = async (field: string, value: string | number | null) => {
    if (!task) return;
    setInlineSaving(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      onTaskUpdate?.(data as Task);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setInlineSaving(false);
    }
  };

  // Handle inline title editing
  const handleTitleClick = () => {
    if (!editMode && task) {
      setInlineTitle(task.title);
      setEditingTitle(true);
    }
  };

  const handleTitleBlur = () => {
    if (inlineTitle.trim() && task && inlineTitle.trim() !== task.title) {
      saveInlineField('title', inlineTitle.trim());
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setEditingTitle(false);
    }
  };

  // Handle inline status change
  const handleInlineStatusChange = (newStatus: Task['status']) => {
    saveInlineField('status', newStatus);
  };

  // Handle inline assignee change
  const handleInlineAssigneeChange = (agentId: string | null) => {
    saveInlineField('assigned_to', agentId);
  };

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        task_type: task.task_type,
        assigned_to: task.assigned_to,
        notes: task.notes,
        complexity: task.complexity,
        shadowing: task.shadowing,
      });
      setEditMode(false);
    }
  }, [task]);

  // Handle escape key to close panel
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        if (editMode) {
          setEditMode(false);
          if (task) {
            setFormData({
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              task_type: task.task_type,
              assigned_to: task.assigned_to,
              notes: task.notes,
              complexity: task.complexity,
              shadowing: task.shadowing,
            });
          }
        } else {
          onOpenChange(false);
        }
      }
    },
    [open, editMode, task, onOpenChange]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getAgentName = (agentId: string | null): string => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find((a) => a.id === agentId);
    return agent?.display_name || agentId;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSave = async () => {
    if (!task) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;

      onTaskUpdate?.(data as Task);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        task_type: task.task_type,
        assigned_to: task.assigned_to,
        notes: task.notes,
        complexity: task.complexity,
        shadowing: task.shadowing,
      });
    }
    setEditMode(false);
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto"
      >
        <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-4 pr-12">
          <div className="flex items-start justify-between gap-4">
            {/* Edit button in header */}
            {!editMode && (
              <Button 
                onClick={() => setEditMode(true)} 
                variant="outline" 
                size="sm"
                className="absolute top-4 right-12 z-10"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            )}
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={inlineTitle}
                  onChange={(e) => setInlineTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className="text-lg font-semibold h-auto py-1"
                />
              ) : (
                <SheetTitle
                  className="text-lg font-semibold text-zinc-900 dark:text-white truncate cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-1 -mx-2 rounded transition-colors"
                  onClick={handleTitleClick}
                >
                  {task.title}
                  {inlineSaving && <span className="ml-2 text-xs font-normal text-zinc-400">Saving...</span>}
                </SheetTitle>
              )}
              <SheetDescription className="mt-1 flex items-center gap-2 flex-wrap">
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
                    {statusOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => handleInlineStatusChange(opt.value)}
                        className={task.status === opt.value ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                      >
                        <Badge className={`${statusConfig[opt.value].className} mr-2`} variant="secondary">
                          {opt.label}
                        </Badge>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Badge className={priorityConfig[task.priority]?.className || priorityConfig[0].className} variant="secondary">
                  {priorityConfig[task.priority]?.label || 'Low'}
                </Badge>
                <ComplexityBadge complexity={task.complexity ?? 'medium'} />
                <ShadowingBadge mode={task.shadowing ?? 'none'} size="sm" />
                <ReviewStatusBadge status={task.review_status ?? 'not_required'} size="sm" />
                <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {task.task_type}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="pl-4 pr-12 pb-4 space-y-6">
          {/* View Mode */}
          {!editMode && (
            <>
              {/* Description */}
              <div>
                <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Description
                </h4>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {task.description || (
                    <span className="italic text-zinc-500 dark:text-zinc-400">
                      No description provided.
                    </span>
                  )}
                </div>
              </div>

              {/* Acceptance Criteria */}
              {task.acceptance_criteria && task.acceptance_criteria.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    Acceptance Criteria
                  </h4>
                  <ul className="space-y-3">
                    {task.acceptance_criteria.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="mt-0.5 w-5 h-5 rounded border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-xs shrink-0 bg-zinc-50 dark:bg-zinc-800">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {task.notes && (
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    Notes
                  </h4>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {task.notes}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Assignee
                  </h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer px-1.5 py-0.5 -mx-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        {getAgentName(task.assigned_to)}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => handleInlineAssigneeChange(null)}
                        className={!task.assigned_to ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                      >
                        Unassigned
                      </DropdownMenuItem>
                      {agents.map((agent) => (
                        <DropdownMenuItem
                          key={agent.id}
                          onClick={() => handleInlineAssigneeChange(agent.id)}
                          className={task.assigned_to === agent.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                        >
                          {agent.display_name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Created By
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {task.created_by || '-'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Created
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {formatDate(task.created_at)}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Updated
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {formatDate(task.updated_at)}
                  </p>
                </div>
                {task.deadline && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      Deadline
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {formatDate(task.deadline)}
                    </p>
                  </div>
                )}
                {task.completed_at && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      Completed
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {formatDate(task.completed_at)}
                    </p>
                  </div>
                )}
                {(task.tokens_consumed ?? 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      Tokens Used
                    </h4>
                    <TokenUsageDisplay tokens={task.tokens_consumed ?? 0} estimatedTokens={task.estimated_tokens} estimatedHours={(task as TaskWithEstimate).estimated_hours} />
                  </div>
                )}
                </div>
              </div>
            </>
          )}

          {/* Edit Mode */}
          {editMode && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Title
                </label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description"
                  rows={4}
                  className="w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 placeholder:text-muted-foreground"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Status
                </label>
                <select
                  value={formData.status || 'backlog'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Priority
                </label>
                <select
                  value={formData.priority ?? 0}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Complexity */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Complexity
                </label>
                <ComplexitySelector
                  value={formData.complexity ?? 'medium'}
                  onChange={(complexity) => setFormData({ ...formData, complexity })}
                />
              </div>

              {/* Shadowing */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Shadowing
                </label>
                <ShadowingSelector
                  value={formData.shadowing ?? 'none'}
                  onChange={(shadowing) => setFormData({ ...formData, shadowing })}
                />
              </div>

              {/* Task Type */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Type
                </label>
                <select
                  value={formData.task_type || 'other'}
                  onChange={(e) => setFormData({ ...formData, task_type: e.target.value as Task['task_type'] })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                >
                  {taskTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Assignee
                </label>
                <select
                  value={formData.assigned_to || ''}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 placeholder:text-muted-foreground"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button onClick={handleCancel} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
