'use client';

import { IndependentOpinion, Agent, VoteType } from '@/lib/supabase';
import { ThumbsUp, ThumbsDown, Minus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface OpinionRevealProps {
  opinions: IndependentOpinion[];
  agents: Agent[];
}

const voteConfig: Record<VoteType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  approve: {
    icon: <ThumbsUp className="w-4 h-4" />,
    label: 'Approve',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/50 border-emerald-800',
  },
  reject: {
    icon: <ThumbsDown className="w-4 h-4" />,
    label: 'Reject',
    color: 'text-red-400',
    bg: 'bg-red-950/50 border-red-800',
  },
  abstain: {
    icon: <Minus className="w-4 h-4" />,
    label: 'Abstain',
    color: 'text-zinc-400',
    bg: 'bg-zinc-800 border-zinc-700',
  },
};

function analyzeConsensus(opinions: IndependentOpinion[]): {
  hasConsensus: boolean;
  majorityVote: VoteType | null;
  agreementLevel: 'full' | 'majority' | 'split';
} {
  const votes = opinions.map((o) => o.opinion.vote);
  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote] = (acc[vote] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = votes.length;
  const maxVote = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
  
  if (!maxVote) {
    return { hasConsensus: false, majorityVote: null, agreementLevel: 'split' };
  }

  const [vote, count] = maxVote;
  
  if (count === total) {
    return { hasConsensus: true, majorityVote: vote as VoteType, agreementLevel: 'full' };
  } else if (count > total / 2) {
    return { hasConsensus: true, majorityVote: vote as VoteType, agreementLevel: 'majority' };
  } else {
    return { hasConsensus: false, majorityVote: null, agreementLevel: 'split' };
  }
}

export function OpinionReveal({ opinions, agents }: OpinionRevealProps) {
  const agentMap = agents.reduce((acc, agent) => {
    acc[agent.id] = agent;
    return acc;
  }, {} as Record<string, Agent>);

  const consensus = analyzeConsensus(opinions);

  if (opinions.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-center">
        <p className="text-zinc-400">No opinions submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Consensus Summary */}
      <div
        className={`
          p-4 rounded-xl border flex items-center gap-3
          ${
            consensus.agreementLevel === 'full'
              ? 'bg-emerald-950/30 border-emerald-800'
              : consensus.agreementLevel === 'majority'
              ? 'bg-amber-950/30 border-amber-800'
              : 'bg-red-950/30 border-red-800'
          }
        `}
      >
        {consensus.agreementLevel === 'full' ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        ) : consensus.agreementLevel === 'majority' ? (
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        ) : (
          <XCircle className="w-6 h-6 text-red-400" />
        )}
        <div>
          <p
            className={`font-semibold ${
              consensus.agreementLevel === 'full'
                ? 'text-emerald-400'
                : consensus.agreementLevel === 'majority'
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {consensus.agreementLevel === 'full'
              ? 'Full Consensus'
              : consensus.agreementLevel === 'majority'
              ? 'Majority Agreement'
              : 'Opinions Split'}
          </p>
          <p className="text-sm text-zinc-400">
            {consensus.majorityVote
              ? `${opinions.filter((o) => o.opinion.vote === consensus.majorityVote).length}/${opinions.length} voted to ${consensus.majorityVote}`
              : 'No clear majority — further debate required'}
          </p>
        </div>
      </div>

      {/* Side-by-side opinions */}
      <div className="grid gap-4 md:grid-cols-2">
        {opinions.map((opinion) => {
          const agent = agentMap[opinion.agent_id];
          const vote = voteConfig[opinion.opinion.vote];
          const isInMajority = opinion.opinion.vote === consensus.majorityVote;

          return (
            <div
              key={opinion.id}
              className={`
                bg-zinc-900 border-2 rounded-xl p-5 transition-all
                ${
                  isInMajority
                    ? 'border-emerald-700/50'
                    : consensus.hasConsensus
                    ? 'border-red-700/50'
                    : 'border-zinc-700'
                }
              `}
            >
              {/* Agent Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-white">
                    {agent?.display_name || 'Unknown Agent'}
                  </h4>
                  {agent?.display_name && (
                    <p className="text-xs text-zinc-500 font-mono uppercase">
                      {agent.display_name}
                    </p>
                  )}
                </div>
                <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${vote.bg} ${vote.color}`}>
                  {vote.icon}
                  <span className="text-sm font-medium">{vote.label}</span>
                </div>
              </div>

              {/* Confidence */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(opinion.confidence * 100)}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${opinion.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-4">
                <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Reasoning
                </h5>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {opinion.opinion.reasoning}
                </p>
              </div>

              {/* Concerns */}
              <div>
                <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Concerns ({opinion.opinion.concerns.length})
                </h5>
                <ul className="space-y-1.5">
                  {opinion.opinion.concerns.map((concern, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-zinc-400 flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">•</span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
