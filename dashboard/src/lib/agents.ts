import { Agent, SkillLevel, TaskComplexity } from './supabase';

// Minimum skill levels required for each complexity
const MIN_SKILL_LEVELS: Record<TaskComplexity, SkillLevel[]> = {
  simple: ['junior', 'mid', 'senior', 'lead'],
  medium: ['mid', 'senior', 'lead'],
  complex: ['senior', 'lead'],
  critical: ['lead'],
};

// Get recommended agents for a complexity level
export function getRecommendedAgents(
  agents: Agent[],
  complexity: TaskComplexity
): Agent[] {
  const allowedLevels = MIN_SKILL_LEVELS[complexity];
  return agents.filter((a) => allowedLevels.includes(a.skill_level));
}

// Model costs per 1M tokens (input)
const MODEL_COSTS: Record<string, number> = {
  'anthropic/claude-haiku-3-5': 0.80,
  'anthropic/claude-sonnet-4-5': 3,
  'anthropic/claude-opus-4-5': 15,
};

// Get model cost per 1M tokens
export function getModelCost(model: string): number {
  return MODEL_COSTS[model] || 3;
}

// Get model display name
export function getModelDisplayName(model: string): string {
  const names: Record<string, string> = {
    'anthropic/claude-haiku-3-5': 'Haiku 3.5',
    'anthropic/claude-sonnet-4-5': 'Sonnet 4.5',
    'anthropic/claude-opus-4-5': 'Opus 4.5',
  };
  return names[model] || model.split('/').pop() || model;
}

// Format token count for display
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`;
  return tokens.toString();
}

// Calculate budget percentage
export function getBudgetPercentage(used: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(100, (used / budget) * 100);
}

// Get budget status color class
export function getBudgetStatusColor(percentage: number): string {
  if (percentage >= 95) return 'red';
  if (percentage >= 80) return 'orange';
  if (percentage >= 60) return 'yellow';
  return 'green';
}

// Skill level ordering for sorting
const SKILL_LEVEL_ORDER: Record<SkillLevel, number> = {
  lead: 0,
  senior: 1,
  mid: 2,
  junior: 3,
};

// Sort agents by skill level (lead first)
export function sortAgentsBySkillLevel(agents: Agent[]): Agent[] {
  return [...agents].sort(
    (a, b) => SKILL_LEVEL_ORDER[a.skill_level] - SKILL_LEVEL_ORDER[b.skill_level]
  );
}

// Get complexity label
export function getComplexityLabel(complexity: TaskComplexity): string {
  const labels: Record<TaskComplexity, string> = {
    simple: 'Simple',
    medium: 'Medium',
    complex: 'Complex',
    critical: 'Critical',
  };
  return labels[complexity];
}

// Get skill level label
export function getSkillLevelLabel(level: SkillLevel): string {
  const labels: Record<SkillLevel, string> = {
    junior: 'Junior',
    mid: 'Mid-Level',
    senior: 'Senior',
    lead: 'Lead',
  };
  return labels[level];
}
