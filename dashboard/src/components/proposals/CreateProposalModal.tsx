'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { ProposalType, createProposal } from '@/lib/supabase';

interface CreateProposalModalProps {
  projectId: string;
  proposerId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const proposalTypes: { value: ProposalType; label: string; description: string }[] = [
  { value: 'task_creation', label: 'Task Creation', description: 'Propose a new task for the project' },
  { value: 'sprint_plan', label: 'Sprint Plan', description: 'Plan or modify a sprint' },
  { value: 'architecture_decision', label: 'Architecture Decision', description: 'Technical architecture choice' },
  { value: 'resource_allocation', label: 'Resource Allocation', description: 'Assign or reallocate resources' },
  { value: 'priority_change', label: 'Priority Change', description: 'Change task or feature priority' },
  { value: 'other', label: 'Other', description: 'General proposal' },
];

export function CreateProposalModal({
  projectId,
  proposerId,
  isOpen,
  onClose,
  onCreated,
}: CreateProposalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposalType, setProposalType] = useState<ProposalType>('other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createProposal({
        project_id: projectId,
        proposal_type: proposalType,
        title: title.trim(),
        content: { description: description.trim() },
        proposed_by: proposerId ?? null,
      });
      
      setTitle('');
      setDescription('');
      setProposalType('other');
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            Create Proposal
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Proposal Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Type
            </label>
            <select
              value={proposalType}
              onChange={(e) => setProposalType(e.target.value as ProposalType)}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {proposalTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">
              {proposalTypes.find((t) => t.value === proposalType)?.description}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief, descriptive title"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, rationale, and details..."
              rows={4}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
