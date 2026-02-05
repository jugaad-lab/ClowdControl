# Mission Control + Claude Code Mastery Integration

**Version:** 1.0  
**Date:** February 3, 2025  
**Authors:** Wong (research specialist)

---

## Executive Summary

This document outlines how to integrate claude-code-mastery sub-agents into Mission Control's worker dispatch system. Currently, Mission Control dispatches tasks to Claude Code as a monolithic worker. With this integration, Claude Code sessions will internally delegate to specialized mastery agents based on task complexity, creating a multi-tier delegation chain:

**MC PM** → **friday-dev (Claude Code session)** → **senior-dev/junior-dev/etc (CC internal agents)**

---

## Current State Analysis

### Mission Control PM Dispatch (Today)

1. **PM receives task** (webhook/cron/direct)
2. **Queries agent roster** from database
3. **Matches task type** to agent capabilities
4. **Dispatches via invocation method**:
   - `sessions_spawn`: Generic agent spawning
   - `claude_code`: Developer tasks via Claude Code CLI
5. **Creates monitoring cron** to track progress
6. **Updates task status** when complete

### Current Developer Agent Profile

```json
{
  "id": "friday-dev",
  "display_name": "Friday", 
  "role": "Developer",
  "capabilities": ["coding", "debugging", "architecture"],
  "invocation_method": "claude_code",
  "invocation_config": {
    "model": "anthropic/claude-sonnet-4-5",
    "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"]
  }
}
```

**Limitation**: Claude Code is treated as a single, monolithic worker. Internal delegation to mastery sub-agents is not leveraged.

### Claude Code Mastery System (Available)

- **10 specialized agents** installed in `~/.claude/agents/`:
  - **Starter Pack (3)**: `senior-dev`, `junior-dev`, `project-manager`
  - **Full Team (7 more)**: `frontend-dev`, `backend-dev`, `ai-engineer`, `ml-engineer`, `data-scientist`, `data-engineer`, `product-manager`

- **Invocation methods**:
  - Interactive: `/agent senior-dev` or natural language
  - CLI: `claude --agent senior-dev -p "prompt"`

- **Current gap**: No automatic delegation based on task complexity

---

## Proposed Integration Architecture

### Multi-Tier Delegation Chain

```
Mission Control PM
│
├─ Task Analysis & Agent Matching
│
└─ friday-dev (Claude Code Worker)
   │
   ├─ Internal Task Complexity Analysis  
   │
   └─ Mastery Agent Delegation
      ├─ senior-dev (complex architecture, code review)
      ├─ junior-dev (simple fixes, documentation)
      ├─ frontend-dev (React, UI components)
      ├─ backend-dev (APIs, databases)
      ├─ project-manager (task breakdown)
      └─ [other specialists as needed]
```

### Integration Touch Points

1. **Mission Control PM**: Enhanced agent profiles with mastery integration
2. **Claude Code Worker**: Task analysis and delegation logic
3. **Mastery Agents**: Task execution and reporting
4. **Monitoring System**: Multi-tier progress tracking

---

## Detailed Integration Design

### 1. Enhanced Agent Profiles

Update Mission Control's agent database to include mastery-awareness:

```json
{
  "id": "friday-dev-mastery",
  "display_name": "Friday (Mastery-Enabled)",
  "role": "Developer",
  "capabilities": ["coding", "debugging", "architecture", "mastery-delegation"],
  "invocation_method": "claude_code",
  "invocation_config": {
    "model": "anthropic/claude-sonnet-4-5",
    "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"],
    "mastery_enabled": true,
    "delegation_strategy": "complexity_based"
  }
}
```

### 2. Enhanced Task File Format

Extend the current task template to include delegation hints:

```markdown
# Task: {Title}

## Task ID
`{uuid}`

## Agent
- **Target:** friday-dev-mastery
- **Model:** anthropic/claude-sonnet-4-5

## Complexity Analysis
- **Estimated Complexity:** {low|medium|high}
- **Primary Domain:** {frontend|backend|fullstack|architecture|testing}
- **Suggested Mastery Agent:** {agent-recommendation}

## Objective
{Clear, specific goal}

## Requirements
1. {Requirement 1}
2. {Requirement 2}

## Delegation Instructions
Based on complexity and domain, consider delegating to:
- **Low complexity** → junior-dev (fast, cost-effective)
- **High complexity** → senior-dev (architecture, complex logic)
- **Frontend focus** → frontend-dev (React, UI expertise)
- **Backend focus** → backend-dev (API, database expertise)
- **Multi-component** → project-manager (task breakdown)

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}

## Files to Modify
- `{path}` — {what changes}

## Project Location
`{absolute path to project}`
```

### 3. Claude Code Delegation Logic

Implement delegation decision logic within Claude Code sessions:

#### 3.1 Task Complexity Analysis

```markdown
# Claude Code Internal Prompt Template

You are friday-dev, a Claude Code worker handling: {task_title}

## Delegation Decision Framework

Before starting work, analyze this task:

1. **Complexity Assessment**:
   - Lines of code to modify: < 50 (low), 50-200 (medium), > 200 (high)  
   - Architecture changes needed: None (low), Minor (medium), Major (high)
   - Testing complexity: Simple (low), Integration tests (medium), Complex scenarios (high)

2. **Domain Specialization**:
   - Pure frontend (React/UI) → frontend-dev
   - Pure backend (API/DB) → backend-dev  
   - AI/ML components → ai-engineer
   - Data processing → data-scientist/data-engineer
   - Multi-component → project-manager for breakdown

3. **Delegation Rules**:
   - **Auto-delegate if**: High complexity OR specialized domain
   - **Handle directly if**: Low complexity AND general full-stack
   - **Break down if**: Multiple domains OR unclear scope

## Available Mastery Agents

{list available agents from ~/.claude/agents/}

## Task Details

{task content from TASK.md}

## Instructions

1. Read the task details carefully
2. Apply the delegation framework above
3. If delegating: Use `claude --agent {chosen-agent} -p "prompt"`
4. If handling directly: Proceed with implementation
5. Report your decision and reasoning

Remember: You can delegate to multiple agents for different parts of a complex task.
```

#### 3.2 Delegation Commands

```bash
# Example delegation patterns

# Complex architecture task → senior-dev
claude --agent senior-dev -p "Design authentication system architecture. See TASK.md for requirements."

# Simple bug fix → junior-dev  
claude --agent junior-dev -p "Fix the typo in user profile component. Details in TASK.md."

# Frontend-heavy task → frontend-dev
claude --agent frontend-dev -p "Implement responsive dashboard UI. Requirements in TASK.md."

# Multi-component task → project-manager first
claude --agent project-manager -p "Break down this e-commerce feature into subtasks. See TASK.md."
```

### 4. Monitoring Integration

Extend Mission Control's monitoring to track multi-tier delegation:

#### 4.1 Enhanced Task Status Schema

```sql
-- Add delegation tracking to tasks table
ALTER TABLE tasks ADD COLUMN delegated_to TEXT;
ALTER TABLE tasks ADD COLUMN delegation_level INTEGER DEFAULT 0; -- 0=PM, 1=Claude Code, 2=Mastery Agent
ALTER TABLE tasks ADD COLUMN delegation_chain TEXT[]; -- Track full chain

-- Example status progression:
-- assigned_to='friday-dev-mastery', delegation_level=1
-- delegated_to='senior-dev', delegation_level=2  
-- delegation_chain=['mission-control-pm', 'friday-dev-mastery', 'senior-dev']
```

#### 4.2 Enhanced Monitoring Cron

```json
{
  "name": "task-monitor-mastery-{task-slug}",
  "description": "Monitor multi-tier delegation for task {task_id}",
  "schedule": {"kind": "cron", "expr": "*/5 * * * *"},
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat", 
  "payload": {
    "kind": "agentTurn",
    "message": "🔄 MASTERY MONITOR — Task {task_id}: Check delegation chain status, detect internal delegation, update database accordingly.",
    "deliver": true,
    "channel": "discord",
    "to": "channel:{your-channel-id}"
  }
}
```

---

## Implementation Steps

### Phase 1: Foundation Setup (Week 1)

1. **Verify mastery agents installed**:
   ```bash
   ls ~/.claude/agents/
   # Should show: senior-dev.md, junior-dev.md, project-manager.md, etc.
   ```

2. **Update Mission Control database**:
   ```sql
   -- Add new mastery-enabled agent profile
   INSERT INTO agents (id, display_name, role, capabilities, invocation_method, invocation_config) 
   VALUES ('friday-dev-mastery', 'Friday (Mastery)', 'Developer',
           ARRAY['coding', 'debugging', 'architecture', 'mastery-delegation'],
           'claude_code', 
           '{"model": "anthropic/claude-sonnet-4-5", "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"], "mastery_enabled": true}');
   
   -- Add delegation tracking columns
   ALTER TABLE tasks ADD COLUMN delegated_to TEXT;
   ALTER TABLE tasks ADD COLUMN delegation_level INTEGER DEFAULT 0;
   ALTER TABLE tasks ADD COLUMN delegation_chain TEXT[];
   ```

3. **Create enhanced task template**:
   ```bash
   cp templates/TASK-TEMPLATE.md templates/TASK-MASTERY-TEMPLATE.md
   # Edit to include complexity analysis and delegation instructions
   ```

### Phase 2: Delegation Logic (Week 2)

1. **Create delegation prompt template**:
   ```bash
   # Add to claude-code-mastery skill
   echo "delegation-prompt-template.md" >> ~/.claude/agents/
   ```

2. **Test basic delegation**:
   ```bash
   cd /test/project
   echo "Test task for mastery delegation" > TASK.md
   claude "Follow TASK.md. First, decide if you should delegate this to a mastery agent based on complexity and domain."
   ```

3. **Implement complexity analysis logic**:
   - Add decision framework to Claude Code sessions
   - Test with simple vs complex tasks
   - Verify delegation commands work

### Phase 3: Monitoring Integration (Week 3)

1. **Enhance monitoring cron**:
   - Detect when Claude Code delegates internally
   - Update delegation_chain in database
   - Track mastery agent progress

2. **Update PM dispatch logic**:
   - Use friday-dev-mastery for development tasks
   - Include delegation hints in task files
   - Test full chain: PM → CC → Mastery Agent

3. **Test execution modes**:
   - Manual mode with mastery delegation
   - Full Speed mode with chained delegation
   - Background mode with internal delegation

### Phase 4: Testing & Validation (Week 4)

1. **End-to-end testing**:
   ```bash
   # Test scenario: Complex authentication feature
   # Expected: PM → friday-dev-mastery → senior-dev (architecture) + frontend-dev (UI)
   
   # Test scenario: Simple bug fix
   # Expected: PM → friday-dev-mastery → junior-dev
   
   # Test scenario: Multi-component feature
   # Expected: PM → friday-dev-mastery → project-manager (breakdown) → multiple specialists
   ```

2. **Performance validation**:
   - Compare task completion times with/without mastery delegation
   - Measure cost impact (Haiku for junior-dev vs Sonnet for direct)
   - Validate quality improvement for complex tasks

3. **Documentation update**:
   - Update PM-PROTOCOL.md with mastery integration steps
   - Add troubleshooting guide for delegation issues
   - Create mastery delegation best practices

---

## Configuration Changes Needed

### 1. Mission Control PM

**File**: `skill/PM-PROTOCOL.md`

Add mastery delegation section:
```markdown
### Claude Code Mastery Integration

When dispatching to claude_code agents with `mastery_enabled: true`:

1. Include complexity analysis in task file
2. Add delegation instructions based on task domain
3. Monitor for internal delegation via session logs
4. Update delegation_chain when sub-delegation detected
```

**File**: Agent database
```sql
-- Replace existing friday-dev with mastery-enabled version
UPDATE agents SET 
  id = 'friday-dev-mastery',
  capabilities = ARRAY['coding', 'debugging', 'architecture', 'mastery-delegation'],
  invocation_config = '{"model": "anthropic/claude-sonnet-4-5", "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"], "mastery_enabled": true}'
WHERE id = 'friday-dev';
```

### 2. Claude Code Worker Profile

**File**: `examples/example-agent-friday.md`

Update with mastery delegation capabilities:
```markdown
## Capabilities
- Coding (JavaScript, Python, TypeScript)
- Debugging and troubleshooting  
- Software architecture
- **Mastery delegation** (routes tasks to specialized sub-agents)

## Invocation
```bash
claude --allowedTools "Bash(*)" "Edit(*)" "Write(*)" "Read(*)" "Fetch(*)" \
  "Analyze task complexity and delegate to appropriate mastery agent. Follow TASK.md for details."
```

## Delegation Strategy
1. **Complexity Analysis**: Assess lines of code, architecture changes, testing needs
2. **Domain Matching**: Route to specialized agents (frontend-dev, backend-dev, etc.)
3. **Multi-Agent Coordination**: Use project-manager for complex multi-component tasks
```

### 3. Task Templates

**File**: `templates/TASK-MASTERY-TEMPLATE.md`

Enhanced template with delegation hints (see Detailed Design section above).

---

## Testing Plan

### Unit Testing

1. **Delegation Decision Logic**:
   - Simple task → junior-dev selection
   - Complex task → senior-dev selection  
   - Frontend task → frontend-dev selection
   - Multi-domain task → project-manager breakdown

2. **Invocation Methods**:
   - `claude --agent senior-dev -p "prompt"` execution
   - Task file reading within Claude Code
   - Agent availability checking

### Integration Testing

1. **Full Chain Testing**:
   ```bash
   # Test case 1: Simple bug fix
   MC PM receives task → friday-dev-mastery → junior-dev → fix committed
   
   # Test case 2: Complex feature  
   MC PM receives task → friday-dev-mastery → senior-dev → architecture + code
   
   # Test case 3: Full-stack feature
   MC PM receives task → friday-dev-mastery → project-manager → breakdown to frontend-dev + backend-dev
   ```

2. **Execution Mode Testing**:
   - Manual mode with mastery delegation
   - Full Speed mode chaining through delegated tasks
   - Background mode processing with internal delegation

### Performance Testing

1. **Metrics to Track**:
   - Task completion time (with vs without mastery delegation)
   - Cost per task (Haiku junior-dev vs Sonnet direct)
   - Success rate (passes acceptance criteria first time)
   - Code quality (complexity, test coverage)

2. **Expected Improvements**:
   - **Simple tasks**: 2-3x faster + 60% cheaper (junior-dev uses Haiku)
   - **Complex tasks**: 20-30% higher success rate (senior-dev expertise)
   - **Multi-component tasks**: 40% fewer iterations (proper breakdown)

### Error Handling Testing

1. **Agent Unavailability**: Claude Code handles gracefully, falls back to direct execution
2. **Delegation Failure**: Monitoring cron detects stuck delegation, escalates to PM
3. **Chain Interruption**: Partial work preserved, continuation possible

---

## Success Metrics

### Quantitative

1. **Task Completion**:
   - Success rate: Target 90%+ first-time completion
   - Time to completion: 20% average improvement
   - Cost efficiency: 30% reduction for simple tasks

2. **Agent Utilization**:
   - Delegation rate: 70% of development tasks use mastery agents
   - Agent specialization: 80% of tasks routed to most appropriate agent
   - Multi-tier efficiency: 50% reduction in PM direct intervention

### Qualitative

1. **Code Quality**: Higher complexity handling, better architecture decisions
2. **Process Clarity**: Clear delegation chain visibility in monitoring
3. **Resource Optimization**: Appropriate skill level matched to task complexity

---

## Risks & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| Delegation adds latency | Medium | High | Cache delegation decisions, optimize prompts |
| Claude Code session fails | High | Medium | Fallback to direct execution, monitoring alerts |
| Mastery agents not installed | High | Low | Verification step in deployment, auto-installation |
| Database schema conflicts | Medium | Low | Migration scripts, backward compatibility |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| Over-delegation complexity | Medium | Medium | Start simple, expand gradually |
| Monitoring overhead | Low | High | Efficient cron design, selective monitoring |
| User confusion | Low | Medium | Clear documentation, training materials |

### Rollback Strategy

1. **Phase rollback**: Revert to previous friday-dev agent profile
2. **Database rollback**: Remove delegation columns, restore original schema
3. **Monitoring rollback**: Disable mastery monitoring, use simple task monitoring
4. **Full rollback**: Uninstall mastery integration, return to current state

---

## Future Enhancements

### Phase 2 (Q2 2025)

1. **Smart Delegation**:
   - Machine learning model for delegation decisions
   - Historical task success rate by agent
   - Dynamic complexity assessment

2. **Agent Collaboration**:
   - Multiple agents working on same task
   - Handoff protocols between agents
   - Conflict resolution mechanisms

### Phase 3 (Q3 2025)

1. **Custom Agent Creation**:
   - Project-specific agent training
   - Domain-specific skill installation
   - Agent personality customization

2. **Advanced Monitoring**:
   - Real-time progress tracking
   - Predictive failure detection
   - Automatic optimization suggestions

---

## Appendix A: Agent Capabilities Matrix

| Agent | Model | Strengths | Use Cases | Expected Cost |
|-------|-------|-----------|-----------|--------------|
| `senior-dev` | Sonnet | Architecture, complex logic, code review | Large features, refactoring, architecture decisions | High |
| `junior-dev` | Haiku | Simple fixes, documentation, testing | Bug fixes, docs, unit tests, simple features | Low |
| `project-manager` | Sonnet | Task breakdown, dependencies, planning | Multi-component features, sprint planning | Medium |
| `frontend-dev` | Sonnet | React, UI/UX, CSS, client-side | UI components, responsive design, user interactions | Medium |
| `backend-dev` | Sonnet | APIs, databases, server-side | REST APIs, database design, server logic | Medium |
| `ai-engineer` | Sonnet | LLM integration, ML pipelines | AI features, prompt engineering, RAG systems | High |

## Appendix B: Sample Delegation Scenarios

### Scenario 1: E-commerce Checkout Feature

**Task**: Implement complete checkout flow with payment processing

**Expected Delegation Chain**:
1. MC PM → friday-dev-mastery
2. friday-dev-mastery → project-manager (complexity: high, multi-component)
3. project-manager breaks down into:
   - Frontend checkout UI → frontend-dev
   - Payment API integration → backend-dev
   - Order processing logic → senior-dev
   - Testing suite → junior-dev

### Scenario 2: Simple Button Bug Fix

**Task**: Fix button alignment in user profile page

**Expected Delegation Chain**:
1. MC PM → friday-dev-mastery
2. friday-dev-mastery → junior-dev (complexity: low, frontend-only)
3. junior-dev fixes CSS and commits

### Scenario 3: AI-Powered Search Feature

**Task**: Add intelligent search with semantic matching

**Expected Delegation Chain**:
1. MC PM → friday-dev-mastery
2. friday-dev-mastery → ai-engineer (complexity: high, AI-specific)
3. ai-engineer implements vector search and embedding pipeline

---

*This integration design creates a powerful multi-tier delegation system that maximizes the strengths of both Mission Control's orchestration and Claude Code Mastery's specialization.*