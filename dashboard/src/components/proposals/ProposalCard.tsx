'use client';

import { Proposal, Agent } from '@/lib/supabase';
import { MessageSquare, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface ProposalCardProps {
  proposal: Proposal;
  proposer?: Agent;
  onClick?: () => void;
}

const statusConfig: Record<Proposal['status'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open: {
    label: 'Open',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  debating: {
    label: 'Debating',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  consensus: {
    label: 'Consensus',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  escalated: {
    label: 'Escalated',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
};

const typeLabels: Record<Proposal['proposal_type'], string> = {
  task_creation: 'Task',
  sprint_plan: 'Sprint',
  architecture_decision: 'Architecture',
  resource_allocation: 'Resource',
  priority_change: 'Priority',
  other: 'Other',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProposalCard({ proposal, proposer, onClick }: ProposalCardProps) {
  const status = statusConfig[proposal.status];

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white dark:bg-zinc-900 rounded-xl border-2 p-5 transition-all duration-200
        border-zinc-200 dark:border-zinc-800
        ${onClick ? 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md' : ''}
      `}
    >
      {/* Status indicator stripe */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
          proposal.status === 'open'
            ? 'bg-gradient-to-r from-blue-400 to-blue-500'
            : proposal.status === 'debating'
            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
            : proposal.status === 'consensus' || proposal.status === 'approved'
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : proposal.status === 'escalated'
            ? 'bg-gradient-to-r from-red-400 to-red-500'
            : 'bg-zinc-300 dark:bg-zinc-700'
        }`}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {typeLabels[proposal.proposal_type]}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white truncate">
            {proposal.title}
          </h3>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        {proposer && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{proposer.display_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{formatDate(proposal.proposed_at)}</span>
        </div>
      </div>
    </div>
  );
}
