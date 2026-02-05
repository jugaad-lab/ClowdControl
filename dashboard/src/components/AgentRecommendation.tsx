'use client';

import { Users, Check, Info } from 'lucide-react';
import { Agent, TaskComplexity } from '@/lib/supabase';
import { getRecommendedAgents, getModelDisplayName, sortAgentsBySkillLevel } from '@/lib/agents';
import { SkillLevelBadge } from './SkillLevelBadge';
import { cn } from '@/lib/utils';

interface AgentRecommendationProps {
  agents: Agent[];
  complexity: TaskComplexity;
  selectedAgentId?: string | null;
  onSelect?: (agentId: string) => void;
  showAll?: boolean;
}

const COMPLEXITY_REQUIREMENTS: Record<TaskComplexity, string> = {
  simple: 'Any skill level can handle this task',
  medium: 'Requires mid-level or higher',
  complex: 'Requires senior or lead level',
  critical: 'Lead-level agents only',
};

export function AgentRecommendation({
  agents,
  complexity,
  selectedAgentId,
  onSelect,
  showAll = false,
}: AgentRecommendationProps) {
  const recommended = getRecommendedAgents(agents, complexity);
  const sortedRecommended = sortAgentsBySkillLevel(recommended);
  const displayAgents = showAll ? sortAgentsBySkillLevel(agents) : sortedRecommended;

  const isRecommended = (agent: Agent) =>
    recommended.some((r) => r.id === agent.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>{COMPLEXITY_REQUIREMENTS[complexity]}</span>
      </div>

      {sortedRecommended.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-center text-sm text-muted-foreground">
          <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No agents available for this complexity level</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {displayAgents.map((agent) => {
            const recommended = isRecommended(agent);
            const isSelected = selectedAgentId === agent.id;

            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSelect?.(agent.id)}
                disabled={!onSelect || (!recommended && !showAll)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : recommended
                    ? 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    : 'border-zinc-200 dark:border-zinc-700 opacity-50 cursor-not-allowed',
                  !onSelect && 'cursor-default'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {agent.display_name}
                    </span>
                    <SkillLevelBadge level={agent.skill_level} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {agent.role}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {getModelDisplayName(agent.model)}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!showAll && agents.length > sortedRecommended.length && (
        <p className="text-xs text-muted-foreground text-center">
          {agents.length - sortedRecommended.length} agent(s) hidden due to skill level requirements
        </p>
      )}
    </div>
  );
}
