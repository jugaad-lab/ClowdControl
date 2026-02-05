# Phase 4: Agent Intelligence & Cost Control

## Overview
Add agent skill levels, model routing, task complexity, and token budgeting to Mission Control.

## Project Location
- Dashboard: `~/workspace/projects/mission-control/dashboard`
- Supabase URL: `https://emsivxzsrkovjrrpquki.supabase.co`
- Environment: `.env.local` has all credentials

## Part A: Database Schema Updates

### 1. Update agents table
```sql
-- Add skill_level enum
CREATE TYPE skill_level AS ENUM ('junior', 'mid', 'senior', 'lead');

-- Add columns to agents
ALTER TABLE agents ADD COLUMN skill_level skill_level DEFAULT 'mid';
ALTER TABLE agents ADD COLUMN model TEXT DEFAULT 'anthropic/claude-sonnet-4';

-- Update existing agents with their levels
UPDATE agents SET skill_level = 'lead', model = 'anthropic/claude-opus-4' WHERE codename = 'Chhotu';
UPDATE agents SET skill_level = 'senior', model = 'anthropic/claude-opus-4' WHERE codename = 'Cheenu';
UPDATE agents SET skill_level = 'lead', model = 'anthropic/claude-opus-4' WHERE codename = 'Vision';
UPDATE agents SET skill_level = 'senior', model = 'anthropic/claude-sonnet-4' WHERE codename = 'Friday';
UPDATE agents SET skill_level = 'senior', model = 'anthropic/claude-sonnet-4' WHERE codename = 'Shuri';
UPDATE agents SET skill_level = 'senior', model = 'anthropic/claude-opus-4' WHERE codename = 'Fury';
UPDATE agents SET skill_level = 'mid', model = 'anthropic/claude-sonnet-4' WHERE codename = 'Wong';
UPDATE agents SET skill_level = 'mid', model = 'anthropic/claude-sonnet-4' WHERE codename = 'Pepper';
UPDATE agents SET skill_level = 'mid', model = 'anthropic/claude-sonnet-4' WHERE codename = 'Wanda';
UPDATE agents SET skill_level = 'mid', model = 'anthropic/claude-sonnet-4' WHERE codename = 'Quill';
UPDATE agents SET skill_level = 'junior', model = 'anthropic/claude-haiku-3' WHERE codename = 'Loki';
```

### 2. Update tasks table
```sql
-- Add complexity enum
CREATE TYPE task_complexity AS ENUM ('simple', 'medium', 'complex', 'critical');

-- Add complexity column
ALTER TABLE tasks ADD COLUMN complexity task_complexity DEFAULT 'medium';
```

### 3. Update projects table for budgeting
```sql
-- Add budget columns
ALTER TABLE projects ADD COLUMN token_budget INTEGER DEFAULT 1000000;  -- 1M tokens default
ALTER TABLE projects ADD COLUMN tokens_used INTEGER DEFAULT 0;

-- Add per-task tracking
ALTER TABLE tasks ADD COLUMN tokens_consumed INTEGER DEFAULT 0;
```

**Run these via Supabase SQL Editor or use the existing supabase client.**

## Part B: TypeScript Types

Update `src/lib/supabase.ts` with new types:

```typescript
export type SkillLevel = 'junior' | 'mid' | 'senior' | 'lead';
export type TaskComplexity = 'simple' | 'medium' | 'complex' | 'critical';

export interface Agent {
  id: string;
  codename: string;
  role: string;
  skill_level: SkillLevel;
  model: string;
  avatar_url?: string;
  created_at: string;
}

export interface Task {
  // ... existing fields
  complexity: TaskComplexity;
  tokens_consumed: number;
}

export interface Project {
  // ... existing fields
  token_budget: number;
  tokens_used: number;
}
```

## Part C: UI Components

### 1. SkillLevelBadge Component
Location: `src/components/SkillLevelBadge.tsx`

```tsx
// Shows colored badge for skill level
// junior = gray, mid = blue, senior = purple, lead = gold
// Include icon (star levels or similar)
```

### 2. ComplexitySelector Component
Location: `src/components/ComplexitySelector.tsx`

```tsx
// Dropdown/radio for selecting task complexity
// simple = green, medium = yellow, complex = orange, critical = red
// Used in task create/edit forms
```

### 3. AgentRecommendation Component
Location: `src/components/AgentRecommendation.tsx`

```tsx
// Given a task complexity, show recommended agents
// Filter agents by appropriate skill level
// simple → any, medium → mid+, complex → senior+, critical → lead only
```

### 4. BudgetProgressBar Component
Location: `src/components/BudgetProgressBar.tsx`

```tsx
// Shows token budget usage with color coding
// < 60% = green, 60-80% = yellow, 80-95% = orange, > 95% = red
// Include numeric display: "450K / 1M tokens"
```

### 5. TokenUsageChart Component
Location: `src/components/TokenUsageChart.tsx`

```tsx
// Line or bar chart showing token usage over time
// Can be added to velocity view
// Use recharts (already installed)
```

## Part D: Page Updates

### 1. Agents List Page
- Add skill level badge next to each agent
- Add model display (subtle, maybe tooltip)
- Sort by skill level (lead first)

### 2. Agent Detail Page (if exists, or create)
- Show full agent info with skill level
- Show model with cost info
- Show tasks assigned to this agent

### 3. Task Create/Edit
- Add complexity selector
- Show recommended agents based on complexity

### 4. Project Page
- Add BudgetProgressBar in header/summary area
- Show warning if approaching budget limit

### 5. Velocity View
- Add TokenUsageChart alongside existing charts

## Part E: Helper Functions

Location: `src/lib/agents.ts`

```typescript
// Get recommended agents for a complexity level
export function getRecommendedAgents(
  agents: Agent[], 
  complexity: TaskComplexity
): Agent[] {
  const minLevel: Record<TaskComplexity, SkillLevel[]> = {
    simple: ['junior', 'mid', 'senior', 'lead'],
    medium: ['mid', 'senior', 'lead'],
    complex: ['senior', 'lead'],
    critical: ['lead']
  };
  return agents.filter(a => minLevel[complexity].includes(a.skill_level));
}

// Get model cost per 1M tokens (input)
export function getModelCost(model: string): number {
  const costs: Record<string, number> = {
    'anthropic/claude-haiku-3': 0.25,
    'anthropic/claude-sonnet-4': 3,
    'anthropic/claude-opus-4': 15,
  };
  return costs[model] || 3;
}

// Format token count
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return tokens.toString();
}
```

## Acceptance Criteria

- [ ] Database has skill_level and model columns on agents
- [ ] Database has complexity column on tasks
- [ ] Database has token_budget and tokens_used on projects
- [ ] All 11 agents have correct skill levels assigned
- [ ] SkillLevelBadge renders with appropriate colors
- [ ] ComplexitySelector works in task forms
- [ ] AgentRecommendation shows filtered agents
- [ ] BudgetProgressBar shows on project pages
- [ ] TokenUsageChart shows in velocity view
- [ ] Build passes with no TypeScript errors
- [ ] App runs without runtime errors

## Commands

```bash
cd ~/workspace/projects/mission-control/dashboard
npm run dev  # Start dev server on port 3000
npm run build  # Verify build passes
```

## Notes

- The Supabase client is already configured in `src/lib/supabase.ts`
- Use existing component patterns from the codebase
- Follow the established Tailwind styling
- Dark mode must work (use appropriate Tailwind dark: classes)
