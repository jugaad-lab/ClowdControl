'use client';

import { useState } from 'react';
import { Plus, X, Loader2, AlertCircle, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { VoteType, submitOpinion } from '@/lib/supabase';

interface OpinionFormProps {
  proposalId: string;
  agentId: string;
  onSubmitted?: () => void;
}

const voteOptions: { value: VoteType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'approve',
    label: 'Approve',
    icon: <ThumbsUp className="w-4 h-4" />,
    color: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500',
  },
  {
    value: 'reject',
    label: 'Reject',
    icon: <ThumbsDown className="w-4 h-4" />,
    color: 'bg-red-600 hover:bg-red-500 border-red-500',
  },
  {
    value: 'abstain',
    label: 'Abstain',
    icon: <Minus className="w-4 h-4" />,
    color: 'bg-zinc-600 hover:bg-zinc-500 border-zinc-500',
  },
];

const MIN_CONCERNS = 2;

export function OpinionForm({ proposalId, agentId, onSubmitted }: OpinionFormProps) {
  const [vote, setVote] = useState<VoteType | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [concerns, setConcerns] = useState<string[]>(['', '']);
  const [newConcern, setNewConcern] = useState('');
  const [confidence, setConfidence] = useState(70);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Count non-empty concerns
  const filledConcerns = concerns.filter((c) => c.trim().length > 0);
  const hasMinConcerns = filledConcerns.length >= MIN_CONCERNS;
  const canSubmit = vote !== null && reasoning.trim().length > 0 && hasMinConcerns && !isSubmitting;

  const handleConcernChange = (index: number, value: string) => {
    const updated = [...concerns];
    updated[index] = value;
    setConcerns(updated);
  };

  const addConcern = () => {
    if (newConcern.trim()) {
      setConcerns([...concerns, newConcern.trim()]);
      setNewConcern('');
    } else {
      setConcerns([...concerns, '']);
    }
  };

  const removeConcern = (index: number) => {
    if (concerns.length > MIN_CONCERNS) {
      setConcerns(concerns.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !vote) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitOpinion({
        proposal_id: proposalId,
        agent_id: agentId,
        opinion: {
          vote,
          reasoning: reasoning.trim(),
          concerns: filledConcerns,
        },
        confidence: confidence / 100,
      });
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit opinion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Submit Your Opinion</h3>
        <p className="text-sm text-zinc-400">
          Your opinion will be hidden until all PMs have submitted.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Vote Selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Vote <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-3">
          {voteOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVote(option.value)}
              className={`
                flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2
                ${
                  vote === option.value
                    ? `${option.color} text-white`
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                }
              `}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Reasoning <span className="text-red-400">*</span>
        </label>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          placeholder="Explain your position in detail..."
          rows={4}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Concerns - CRITICAL: Must have 2+ */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Concerns <span className="text-red-400">*</span>
          <span className="ml-2 text-xs text-zinc-500">
            (minimum {MIN_CONCERNS} required, even if approving)
          </span>
        </label>
        <div className="space-y-3">
          {concerns.map((concern, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={concern}
                onChange={(e) => handleConcernChange(index, e.target.value)}
                placeholder={`Concern ${index + 1}${index < MIN_CONCERNS ? ' (required)' : ''}`}
                className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {concerns.length > MIN_CONCERNS && (
                <button
                  type="button"
                  onClick={() => removeConcern(index)}
                  className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addConcern}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another concern
          </button>
        </div>
        {!hasMinConcerns && (
          <p className="mt-2 text-sm text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Please enter at least {MIN_CONCERNS} concerns to prevent groupthink
          </p>
        )}
      </div>

      {/* Confidence */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Confidence: {confidence}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>Uncertain</span>
          <span>Very confident</span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full px-5 py-3 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Opinion
      </button>

      {!canSubmit && !isSubmitting && (
        <p className="text-xs text-zinc-500 text-center">
          {!vote && 'Select a vote'} {!vote && (!reasoning.trim() || !hasMinConcerns) && ' • '}
          {!reasoning.trim() && 'Add reasoning'} {!reasoning.trim() && !hasMinConcerns && ' • '}
          {!hasMinConcerns && `Add ${MIN_CONCERNS - filledConcerns.length} more concern(s)`}
        </p>
      )}
    </form>
  );
}
