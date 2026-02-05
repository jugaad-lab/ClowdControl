# Agent Profile Template

Use this template when creating new agent profiles for the Mission Control PM system.

---

```markdown
# {Agent Name} — {Role}

## Identity
- **Codename:** {Codename}
- **Type:** pm | specialist
- **Model:** {model alias or full path}
- **Skill Level:** junior | mid | senior | lead
- **Token Budget:** {default per-task budget}

## Capabilities
- {capability 1}
- {capability 2}
- {capability 3}
- ...

## Skills
Clawdbot skills this agent uses:

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| {skill-name} | {what it does} | {trigger condition} |

## Tool Rules
Constraints and preferences for tool usage:

- **{tool}**: {rule or preference}
- **{tool}**: {rule or preference}

## Workflows
Predefined sequences for common tasks:

### {workflow-name}
**Trigger:** {when to use this workflow}
**Steps:**
1. {action 1}
2. {action 2}
3. {action 3}
**Outputs:** {what gets produced}

## Immutable Behaviors
These behaviors are hard-coded and cannot be changed by PM instructions:

1. **{Behavior Name}:** {description}
2. **{Behavior Name}:** {description}
...

## PM Input Requirements
What the PM MUST provide when assigning work:

| Input | Required | Format | Example |
|-------|----------|--------|---------|
| {input name} | Yes/No | {format} | {example} |

### Input Templates

#### {Input Type 1}
```markdown
{template content}
```

## Constraints
What this agent CANNOT do:

- ❌ {constraint 1}
- ❌ {constraint 2}
...

## Invocation
- **Method:** sessions_spawn | claude_code | custom
- **Config:**
```json
{
  "model": "{model-name}",
  "allowedTools": ["{tool1}", "{tool2}"],
  "thinking": "low|high",
  "timeout": "{minutes}"
}
```

## Output Format
How this agent reports back:

```markdown
{output template}
```

## Notes
{Any additional context, best practices, or gotchas}
```

---

## Database Schema

When adding this agent to the roster database:

```sql
INSERT INTO agents (
  id, display_name, role, capabilities, 
  invocation_method, invocation_config, 
  is_active, agent_type
) VALUES (
  '{agent-id}',
  '{Agent Name}',
  '{Role}',
  ARRAY['{cap1}', '{cap2}', '{cap3}'],
  '{method}',
  '{json_config}',
  true,
  'specialist'
);
```

## Example Capabilities

**Developers:**
- coding, debugging, architecture, git-operations, code-review, testing

**Researchers:** 
- market-research, user-interviews, competitive-analysis, data-analysis

**Designers:**
- ui-design, ux-design, prototyping, visual-design, user-testing

**QA Engineers:**
- manual-testing, automated-testing, regression-testing, performance-testing

**Documentation:**
- technical-writing, api-documentation, user-guides, tutorial-creation

**Marketing:**
- social-media, email-marketing, content-creation, campaign-management

**Business:**
- product-management, requirements-gathering, stakeholder-communication