'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, HelpCircle, Loader2 } from 'lucide-react';
import { Proposal, tagDebateOutcome } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OutcomeTagProps {
  proposal: Proposal;
  onUpdate?: (proposal: Proposal) => void;
  compact?: boolean;
}

export function OutcomeTag({ proposal, onUpdate, compact = false }: OutcomeTagProps) {
  const [loading, setLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<'worked' | 'didnt_work' | null>(null);

  const handleTag = async (worked: boolean) => {
    setLoading(true);
    try {
      const updatedProposal = await tagDebateOutcome(
        proposal.id,
        worked,
        'human' // In a real app, this would be the current user
      );
      onUpdate?.(updatedProposal);
    } catch (error) {
      console.error('Error tagging outcome:', error);
    } finally {
      setLoading(false);
    }
  };

  // If already tagged
  if (proposal.outcome_worked !== null) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border px-3 py-2',
          proposal.outcome_worked
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        )}
      >
        {proposal.outcome_worked ? (
          <>
            <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="font-medium text-green-700 dark:text-green-300">
                This Worked
              </div>
              {proposal.outcome_tagged_at && !compact && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  Tagged {new Date(proposal.outcome_tagged_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <div className="font-medium text-red-700 dark:text-red-300">
                Didn&apos;t Work
              </div>
              {proposal.outcome_tagged_at && !compact && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Tagged {new Date(proposal.outcome_tagged_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </>
        )}

        {/* Allow re-tagging */}
        {!compact && (
          <button
            onClick={() => handleTag(!proposal.outcome_worked)}
            className="ml-2 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            disabled={loading}
          >
            Change
          </button>
        )}
      </div>
    );
  }

  // Not yet tagged - show tagging buttons
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={() => handleTag(true)}
          disabled={loading}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => handleTag(false)}
          disabled={loading}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
      <div className="flex items-center gap-2 mb-3 text-zinc-700 dark:text-zinc-300">
        <HelpCircle className="h-5 w-5" />
        <span className="font-medium">How did this decision turn out?</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleTag(true)}
          onMouseEnter={() => setHoveredButton('worked')}
          onMouseLeave={() => setHoveredButton(null)}
          disabled={loading}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all',
            'font-medium text-sm',
            hoveredButton === 'worked'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300',
            'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 dark:hover:border-green-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ThumbsUp className="h-5 w-5" />
              <span>This Worked</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleTag(false)}
          onMouseEnter={() => setHoveredButton('didnt_work')}
          onMouseLeave={() => setHoveredButton(null)}
          disabled={loading}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all',
            'font-medium text-sm',
            hoveredButton === 'didnt_work'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300',
            'hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ThumbsDown className="h-5 w-5" />
              <span>Didn&apos;t Work</span>
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
        Tagging outcomes helps improve future decision-making
      </p>
    </div>
  );
}
