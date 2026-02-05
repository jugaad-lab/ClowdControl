'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, CheckCircle, XCircle, Filter, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Proposal, Agent, Project } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DebateHistoryListProps {
  proposals: Proposal[];
  agents: Agent[];
  projects: Project[];
  onProposalClick?: (proposal: Proposal) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  consensus: {
    label: 'Consensus',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  escalated: {
    label: 'Escalated',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
};

const TYPE_LABELS: Record<string, string> = {
  task_creation: 'Task Creation',
  sprint_plan: 'Sprint Plan',
  architecture_decision: 'Architecture',
  resource_allocation: 'Resource',
  priority_change: 'Priority',
  other: 'Other',
};

export function DebateHistoryList({
  proposals,
  agents,
  projects,
  onProposalClick,
}: DebateHistoryListProps) {
  const [filterProject, setFilterProject] = useState<string | 'all'>('all');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'worked' | 'didnt_work' | 'untagged'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'outcome'>('date');

  // Filter completed debates
  const completedDebates = proposals.filter((p) =>
    ['consensus', 'approved', 'rejected', 'escalated'].includes(p.status)
  );

  // Apply filters
  const filteredDebates = useMemo(() => {
    let result = completedDebates;

    if (filterProject !== 'all') {
      result = result.filter((p) => p.project_id === filterProject);
    }

    if (filterOutcome === 'worked') {
      result = result.filter((p) => p.outcome_worked === true);
    } else if (filterOutcome === 'didnt_work') {
      result = result.filter((p) => p.outcome_worked === false);
    } else if (filterOutcome === 'untagged') {
      result = result.filter((p) => p.outcome_worked === null);
    }

    // Sort
    if (sortBy === 'date') {
      result = [...result].sort(
        (a, b) =>
          new Date(b.resolved_at || b.proposed_at).getTime() -
          new Date(a.resolved_at || a.proposed_at).getTime()
      );
    } else if (sortBy === 'outcome') {
      result = [...result].sort((a, b) => {
        if (a.outcome_worked === b.outcome_worked) return 0;
        if (a.outcome_worked === true) return -1;
        if (b.outcome_worked === true) return 1;
        if (a.outcome_worked === false) return -1;
        return 1;
      });
    }

    return result;
  }, [completedDebates, filterProject, filterOutcome, sortBy]);

  const getAgentName = (id: string | null) => {
    if (!id) return 'Unknown';
    const agent = agents.find((a) => a.id === id);
    return agent?.display_name || 'Unknown';
  };

  const getProjectName = (id: string) => {
    const project = projects.find((p) => p.id === id);
    return project?.name || 'Unknown Project';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Stats
  const stats = useMemo(() => {
    const tagged = completedDebates.filter((p) => p.outcome_worked !== null);
    const worked = tagged.filter((p) => p.outcome_worked === true);
    const didntWork = tagged.filter((p) => p.outcome_worked === false);

    return {
      total: completedDebates.length,
      tagged: tagged.length,
      worked: worked.length,
      didntWork: didntWork.length,
      successRate: tagged.length ? Math.round((worked.length / tagged.length) * 100) : 0,
    };
  }, [completedDebates]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Debates</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Tagged Outcomes</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.tagged}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-600 dark:text-green-400">Worked</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.worked}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400">Didn&apos;t Work</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.didntWork}</div>
        </div>
      </div>

      {/* Success rate bar */}
      {stats.tagged > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-600 dark:text-zinc-400">Decision Success Rate</span>
            <span className="font-medium text-zinc-900 dark:text-white">{stats.successRate}%</span>
          </div>
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.successRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md"
        >
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={filterOutcome}
          onChange={(e) => setFilterOutcome(e.target.value as typeof filterOutcome)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md"
        >
          <option value="all">All Outcomes</option>
          <option value="worked">Worked</option>
          <option value="didnt_work">Didn&apos;t Work</option>
          <option value="untagged">Untagged</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md"
        >
          <option value="date">Sort by Date</option>
          <option value="outcome">Sort by Outcome</option>
        </select>
      </div>

      {/* Debate list */}
      <div className="space-y-3">
        {filteredDebates.map((proposal) => (
          <div
            key={proposal.id}
            onClick={() => onProposalClick?.(proposal)}
            className={cn(
              'bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4',
              'hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                  <span className="font-medium text-zinc-900 dark:text-white truncate">
                    {proposal.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>{getProjectName(proposal.project_id)}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">|</span>
                  <span>{TYPE_LABELS[proposal.proposal_type] || proposal.proposal_type}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">|</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(proposal.resolved_at)}
                  </span>
                </div>

                {proposal.proposed_by && (
                  <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Proposed by {getAgentName(proposal.proposed_by)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Outcome badge */}
                {proposal.outcome_worked !== null && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      proposal.outcome_worked
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    )}
                  >
                    {proposal.outcome_worked ? (
                      <>
                        <ThumbsUp className="h-3 w-3" />
                        Worked
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-3 w-3" />
                        Didn&apos;t Work
                      </>
                    )}
                  </span>
                )}

                {/* Status badge */}
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    STATUS_CONFIG[proposal.status]?.className || 'bg-zinc-100 text-zinc-700'
                  )}
                >
                  {STATUS_CONFIG[proposal.status]?.label || proposal.status}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredDebates.length === 0 && (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium">No debates found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
