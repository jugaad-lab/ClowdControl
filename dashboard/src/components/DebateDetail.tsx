'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  Proposal,
  Agent,
  IndependentOpinion,
  DebateRound,
  SycophancyFlag,
  getProposalOpinions,
  getDebateRounds,
  getSycophancyFlags,
} from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { OutcomeTag } from './OutcomeTag';

interface DebateDetailProps {
  proposal: Proposal;
  agents: Agent[];
  onBack?: () => void;
  onProposalUpdate?: (proposal: Proposal) => void;
}

const VOTE_ICONS: Record<string, React.ReactNode> = {
  approve: <CheckCircle className="h-4 w-4 text-green-500" />,
  reject: <XCircle className="h-4 w-4 text-red-500" />,
  abstain: <AlertTriangle className="h-4 w-4 text-amber-500" />,
};

export function DebateDetail({
  proposal,
  agents,
  onBack,
  onProposalUpdate,
}: DebateDetailProps) {
  const [opinions, setOpinions] = useState<IndependentOpinion[]>([]);
  const [debateRounds, setDebateRounds] = useState<DebateRound[]>([]);
  const [sycophancyFlags, setSycophancyFlags] = useState<SycophancyFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [opinionsData, roundsData, flagsData] = await Promise.all([
          getProposalOpinions(proposal.id),
          getDebateRounds(proposal.id),
          getSycophancyFlags(proposal.id),
        ]);
        setOpinions(opinionsData);
        setDebateRounds(roundsData);
        setSycophancyFlags(flagsData);
      } catch (error) {
        console.error('Error fetching debate data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [proposal.id]);

  const getAgentName = (id: string | null) => {
    if (!id) return 'Unknown';
    const agent = agents.find((a) => a.id === id);
    return agent?.display_name || 'Unknown';
  };

  const getAgentCodename = (id: string | null) => {
    if (!id) return '';
    const agent = agents.find((a) => a.id === id);
    return agent?.display_name || '';
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

  // Group debate rounds by round number
  const roundsByNumber = debateRounds.reduce((acc, round) => {
    if (!acc[round.round_number]) {
      acc[round.round_number] = [];
    }
    acc[round.round_number].push(round);
    return acc;
  }, {} as Record<number, DebateRound[]>);

  // Calculate PM track record
  const pmStats = opinions.reduce((acc, opinion) => {
    const agentId = opinion.agent_id;
    if (!acc[agentId]) {
      acc[agentId] = { approved: 0, rejected: 0, abstained: 0 };
    }
    if (opinion.opinion.vote === 'approve') acc[agentId].approved++;
    else if (opinion.opinion.vote === 'reject') acc[agentId].rejected++;
    else acc[agentId].abstained++;
    return acc;
  }, {} as Record<string, { approved: number; rejected: number; abstained: number }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500 dark:text-zinc-400">Loading debate details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {proposal.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {getAgentName(proposal.proposed_by)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(proposal.proposed_at)}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  proposal.status === 'consensus'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : proposal.status === 'approved'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : proposal.status === 'rejected'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                )}
              >
                {proposal.status}
              </span>
            </div>
          </div>

          {/* Outcome tag */}
          <OutcomeTag proposal={proposal} onUpdate={onProposalUpdate} />
        </div>

        {/* Resolution notes */}
        {proposal.resolution_notes && (
          <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Resolution Notes
            </h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {proposal.resolution_notes}
            </p>
          </div>
        )}
      </div>

      {/* Sycophancy flags */}
      {sycophancyFlags.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
          <h3 className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5" />
            Sycophancy Flags Detected
          </h3>
          <div className="space-y-2">
            {sycophancyFlags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
              >
                <span className="font-medium">{flag.indicator_type.replace(/_/g, ' ')}:</span>
                {flag.was_false_positive === true && (
                  <span className="text-green-600 dark:text-green-400">(False positive)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Independent Opinions */}
      {opinions.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Independent Opinions ({opinions.length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {opinions.map((opinion) => (
              <div key={opinion.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {VOTE_ICONS[opinion.opinion.vote]}
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {getAgentName(opinion.agent_id)}
                    </span>
                    {getAgentCodename(opinion.agent_id) && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        ({getAgentCodename(opinion.agent_id)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>Confidence: {opinion.confidence}%</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                  {opinion.opinion.reasoning}
                </p>
                {opinion.opinion.concerns.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Concerns:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {opinion.opinion.concerns.map((concern, i) => (
                        <li
                          key={i}
                          className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1"
                        >
                          <span className="text-amber-500">!</span>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debate Rounds */}
      {Object.keys(roundsByNumber).length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Debate Rounds ({Object.keys(roundsByNumber).length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {Object.entries(roundsByNumber).map(([roundNum, rounds]) => (
              <div key={roundNum} className="p-4">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                  Round {roundNum}
                </h4>
                <div className="space-y-4">
                  {rounds.map((round) => (
                    <div key={round.id} className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {getAgentName(round.agent_id)}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Confidence: {round.confidence}%
                        </span>
                      </div>
                      <div className="text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                        <strong>Position:</strong> {round.position}
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {round.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PM Track Record */}
      {Object.keys(pmStats).length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
            PM Voting Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(pmStats).map(([agentId, stats]) => (
              <div
                key={agentId}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
              >
                <div className="font-medium text-zinc-900 dark:text-white mb-2">
                  {getAgentName(agentId)}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <ThumbsUp className="h-3 w-3" />
                    {stats.approved}
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <ThumbsDown className="h-3 w-3" />
                    {stats.rejected}
                  </span>
                  {stats.abstained > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {stats.abstained} abstain
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
