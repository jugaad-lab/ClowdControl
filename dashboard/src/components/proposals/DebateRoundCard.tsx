'use client';

import { DebateRound, Agent } from '@/lib/supabase';
import { MessageSquare, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface DebateRoundCardProps {
  roundNumber: number;
  rounds: DebateRound[];
  agents: Agent[];
  isLatestRound: boolean;
  canStartNewRound: boolean;
  onStartNewRound?: () => void;
}

function getPositionIcon(position: string) {
  const lower = position.toLowerCase();
  if (lower.includes('approve') || lower.includes('support') || lower.includes('agree')) {
    return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  }
  if (lower.includes('reject') || lower.includes('oppose') || lower.includes('disagree')) {
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  }
  return <Minus className="w-4 h-4 text-zinc-400" />;
}

function getPositionColor(position: string) {
  const lower = position.toLowerCase();
  if (lower.includes('approve') || lower.includes('support') || lower.includes('agree')) {
    return 'bg-emerald-950/30 border-emerald-800/50';
  }
  if (lower.includes('reject') || lower.includes('oppose') || lower.includes('disagree')) {
    return 'bg-red-950/30 border-red-800/50';
  }
  return 'bg-zinc-800/50 border-zinc-700';
}

export function DebateRoundCard({
  roundNumber,
  rounds,
  agents,
  isLatestRound,
  canStartNewRound,
  onStartNewRound,
}: DebateRoundCardProps) {
  const agentMap = agents.reduce((acc, agent) => {
    acc[agent.id] = agent;
    return acc;
  }, {} as Record<string, Agent>);

  const roundRounds = rounds.filter((r) => r.round_number === roundNumber);

  if (roundRounds.length === 0) {
    return null;
  }

  // Check if positions are converging
  const positions = roundRounds.map((r) => r.position.toLowerCase());
  const allSame = positions.every((p) => p === positions[0]);
  const avgConfidence =
    roundRounds.reduce((acc, r) => acc + r.confidence, 0) / roundRounds.length;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-950/50 border border-blue-800/50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Round {roundNumber}</h3>
            <p className="text-xs text-zinc-500">
              {roundRounds.length} opinion{roundRounds.length > 1 ? 's' : ''} •{' '}
              Avg confidence: {Math.round(avgConfidence * 100)}%
            </p>
          </div>
        </div>
        {allSame && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400">
            Consensus forming
          </span>
        )}
      </div>

      {/* Opinions */}
      <div className="p-5 space-y-4">
        {roundRounds.map((round) => {
          const agent = agentMap[round.agent_id];
          return (
            <div
              key={round.id}
              className={`rounded-lg border p-4 ${getPositionColor(round.position)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <span className="text-sm text-zinc-300 font-medium">
                      {agent?.display_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {agent?.display_name || 'Unknown Agent'}
                    </p>
                    {agent?.display_name && (
                      <p className="text-xs text-zinc-500 font-mono uppercase">
                        {agent.display_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getPositionIcon(round.position)}
                  <span className="text-sm font-medium text-zinc-300 capitalize">
                    {round.position}
                  </span>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                {round.reasoning}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Confidence: {Math.round(round.confidence * 100)}%
                </span>
                <span className="text-zinc-600">
                  {new Date(round.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Round Button */}
      {isLatestRound && canStartNewRound && onStartNewRound && (
        <div className="px-5 pb-5">
          <button
            onClick={onStartNewRound}
            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Start Round {roundNumber + 1}
          </button>
          <p className="text-xs text-zinc-500 text-center mt-2">
            No consensus yet • {3 - roundNumber} round{3 - roundNumber > 1 ? 's' : ''} remaining
          </p>
        </div>
      )}
    </div>
  );
}
