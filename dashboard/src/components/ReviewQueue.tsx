'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, User, Filter } from 'lucide-react';
import { Task, Agent, ReviewStatus, supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ReviewStatusBadge } from './ReviewStatusBadge';
import { ComplexityBadge } from './ComplexitySelector';

interface ReviewQueueProps {
  tasks: Task[];
  agents: Agent[];
  currentReviewerId?: string;
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (task: Task) => void;
}

export function ReviewQueue({
  tasks,
  agents,
  currentReviewerId,
  onTaskClick,
  onTaskUpdate,
}: ReviewQueueProps) {
  const [filterReviewer, setFilterReviewer] = useState<string | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter tasks that need review
  const reviewTasks = tasks.filter((t) => t.requires_review);

  // Apply reviewer filter
  const filteredTasks =
    filterReviewer === 'all'
      ? reviewTasks
      : reviewTasks.filter((t) => t.reviewer_id === filterReviewer);

  // Group by status
  const pendingTasks = filteredTasks.filter((t) => t.review_status === 'pending');
  const changesRequestedTasks = filteredTasks.filter(
    (t) => t.review_status === 'changes_requested'
  );
  const approvedTasks = filteredTasks.filter((t) => t.review_status === 'approved');

  const getAgentName = (id: string | null) => {
    if (!id) return 'Unassigned';
    const agent = agents.find((a) => a.id === id);
    return agent?.display_name || 'Unknown';
  };

  const handleQuickAction = async (
    taskId: string,
    action: 'approve' | 'request_changes'
  ) => {
    setActionLoading(taskId);
    try {
      const newStatus: ReviewStatus =
        action === 'approve' ? 'approved' : 'changes_requested';

      const { data, error } = await supabase
        .from('tasks')
        .update({
          review_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      onTaskUpdate?.(data as Task);
    } catch (error) {
      console.error('Error updating review status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const TaskRow = ({ task }: { task: Task }) => (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800',
        'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer'
      )}
      onClick={() => onTaskClick?.(task)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-white truncate">
            {task.title}
          </span>
          <ComplexityBadge complexity={task.complexity} />
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {getAgentName(task.assigned_to)}
          </span>
          <span>Updated {formatDate(task.updated_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ReviewStatusBadge status={task.review_status} size="sm" />

        {task.review_status === 'pending' && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={() => handleQuickAction(task.id, 'approve')}
              disabled={actionLoading === task.id}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleQuickAction(task.id, 'request_changes')}
              disabled={actionLoading === task.id}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Filter className="h-4 w-4" />
          <span>Reviewer:</span>
        </div>
        <select
          value={filterReviewer}
          onChange={(e) => setFilterReviewer(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md"
        >
          <option value="all">All Reviewers</option>
          {agents
            .filter((a) => a.agent_type === 'pm' || a.skill_level === 'lead')
            .map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.display_name}
              </option>
            ))}
        </select>

        {currentReviewerId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterReviewer(currentReviewerId)}
          >
            My Reviews
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Pending</span>
          </div>
          <div className="text-2xl font-bold text-amber-800 dark:text-amber-200 mt-1">
            {pendingTasks.length}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Changes Requested</span>
          </div>
          <div className="text-2xl font-bold text-red-800 dark:text-red-200 mt-1">
            {changesRequestedTasks.length}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Approved</span>
          </div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">
            {approvedTasks.length}
          </div>
        </div>
      </div>

      {/* Pending section */}
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Review ({pendingTasks.length})
          </h3>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Changes Requested section */}
      {changesRequestedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            Changes Requested ({changesRequestedTasks.length})
          </h3>
          <div className="space-y-2">
            {changesRequestedTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm">No tasks require review at the moment.</p>
        </div>
      )}
    </div>
  );
}
