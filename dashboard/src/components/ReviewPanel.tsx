'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, User, Calendar, FileText } from 'lucide-react';
import { Task, Agent, ReviewStatus, supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ReviewStatusBadge } from './ReviewStatusBadge';
import { ComplexityBadge } from './ComplexitySelector';
import { ShadowingBadge } from './ShadowingBadge';

interface ReviewPanelProps {
  task: Task;
  agents: Agent[];
  onTaskUpdate?: (task: Task) => void;
  onClose?: () => void;
}

export function ReviewPanel({
  task,
  agents,
  onTaskUpdate,
  onClose,
}: ReviewPanelProps) {
  const [reviewNotes, setReviewNotes] = useState(task.review_notes || '');
  const [selectedReviewer, setSelectedReviewer] = useState(task.reviewer_id || '');
  const [saving, setSaving] = useState(false);

  const getAgentName = (id: string | null) => {
    if (!id) return 'Unassigned';
    const agent = agents.find((a) => a.id === id);
    return agent?.display_name || 'Unknown';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAction = async (action: 'approve' | 'request_changes') => {
    setSaving(true);
    try {
      const newStatus: ReviewStatus =
        action === 'approve' ? 'approved' : 'changes_requested';

      const { data, error } = await supabase
        .from('tasks')
        .update({
          review_status: newStatus,
          review_notes: reviewNotes || null,
          reviewer_id: selectedReviewer || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      onTaskUpdate?.(data as Task);
    } catch (error) {
      console.error('Error updating review:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedReviewer) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          reviewer_id: selectedReviewer,
          requires_review: true,
          review_status: task.review_status === 'not_required' ? 'pending' : task.review_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      onTaskUpdate?.(data as Task);
    } catch (error) {
      console.error('Error assigning reviewer:', error);
    } finally {
      setSaving(false);
    }
  };

  const reviewers = agents.filter(
    (a) => a.agent_type === 'pm' || a.skill_level === 'lead' || a.skill_level === 'senior'
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <ReviewStatusBadge status={task.review_status} />
              <ComplexityBadge complexity={task.complexity} />
              <ShadowingBadge mode={task.shadowing} />
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Task details */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
        {task.description && (
          <div>
            <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Description
            </h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {task.acceptance_criteria && task.acceptance_criteria.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Acceptance Criteria
            </h4>
            <ul className="space-y-1">
              {task.acceptance_criteria.map((criteria, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-400">{i + 1}.</span>
                  {criteria}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <User className="h-4 w-4" />
            <span>Assigned: {getAgentName(task.assigned_to)}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Calendar className="h-4 w-4" />
            <span>Updated: {formatDate(task.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Reviewer assignment */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Reviewer
        </h4>
        <div className="flex items-center gap-2">
          <select
            value={selectedReviewer}
            onChange={(e) => setSelectedReviewer(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md"
          >
            <option value="">Select reviewer...</option>
            {reviewers.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.display_name} ({agent.skill_level})
              </option>
            ))}
          </select>
          {selectedReviewer !== task.reviewer_id && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAssignReviewer}
              disabled={saving || !selectedReviewer}
            >
              Assign
            </Button>
          )}
        </div>
      </div>

      {/* Review notes */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Review Notes
        </h4>
        <textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Add feedback, suggestions, or concerns..."
          rows={4}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md resize-none"
        />
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center gap-3">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleAction('approve')}
          disabled={saving}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          onClick={() => handleAction('request_changes')}
          disabled={saving}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Request Changes
        </Button>
      </div>

      {/* Previous review notes */}
      {task.review_notes && task.review_notes !== reviewNotes && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <h5 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Previous Review Notes
            </h5>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {task.review_notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
