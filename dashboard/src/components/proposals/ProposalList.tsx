'use client';

import { Proposal, Agent } from '@/lib/supabase';
import { ProposalCard } from './ProposalCard';
import { FileQuestion } from 'lucide-react';

interface ProposalListProps {
  proposals: Proposal[];
  agents: Agent[];
  onProposalClick?: (proposal: Proposal) => void;
}

export function ProposalList({ proposals, agents, onProposalClick }: ProposalListProps) {
  const agentMap = agents.reduce((acc, agent) => {
    acc[agent.id] = agent;
    return acc;
  }, {} as Record<string, Agent>);

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <FileQuestion className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
          No proposals yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          Create a new proposal to start the consensus process between PM agents.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          proposer={proposal.proposed_by ? agentMap[proposal.proposed_by] : undefined}
          onClick={onProposalClick ? () => onProposalClick(proposal) : undefined}
        />
      ))}
    </div>
  );
}
