# Task: {Task Title}

## Task ID
`{uuid}`

## Agent
- **Target:** {agent_id}
- **Model:** {model_name}

## Complexity Analysis
- **Estimated Complexity:** {low|medium|high}
- **Primary Domain:** {frontend|backend|fullstack|architecture|testing|documentation}
- **Lines of Code Estimate:** {<50|50-200|>200}
- **Architecture Impact:** {none|minor|major}
- **Testing Complexity:** {simple|integration|complex}
- **Suggested Mastery Agent:** {junior-dev|senior-dev|frontend-dev|backend-dev|project-manager}

## Objective
{Clear, specific goal statement}

## Context
{Background information, related code, dependencies, existing patterns}

## Requirements
1. {Functional requirement 1}
2. {Functional requirement 2}
3. {Technical requirement 3}

## Delegation Instructions
**For mastery-enabled agents**: Based on the complexity analysis above, consider delegating to:

- **Low complexity** (< 50 LOC, simple logic):
  - → **junior-dev** (Haiku model, fast and cost-effective)
  - Examples: Bug fixes, documentation updates, simple UI tweaks

- **High complexity** (> 200 LOC, architecture changes):
  - → **senior-dev** (Advanced patterns, complex logic, code review)
  - Examples: System architecture, complex algorithms, major refactoring

- **Frontend-focused** (UI/UX, client-side):
  - → **frontend-dev** (React expertise, responsive design, user interactions)
  - Examples: Component libraries, dashboard UIs, mobile responsiveness

- **Backend-focused** (APIs, databases, server-side):
  - → **backend-dev** (Database design, API architecture, authentication)
  - Examples: REST APIs, database schemas, middleware

- **Multi-component** (spans multiple domains):
  - → **project-manager** (Task breakdown, dependency mapping)
  - Examples: Full-stack features, integration projects

**Delegation command examples:**
```bash
claude --agent senior-dev -p "Design authentication system architecture. See TASK.md for requirements."
claude --agent junior-dev -p "Fix the typo in user profile component. Details in TASK.md."
claude --agent frontend-dev -p "Implement responsive dashboard UI. Requirements in TASK.md."
```

## Acceptance Criteria
- [ ] {Testable criterion 1}
- [ ] {Testable criterion 2}
- [ ] {Quality criterion (tests, documentation)}
- [ ] {Performance/security criterion if applicable}

## Files to Modify
- `{path/to/file1.ts}` — {specific changes needed}
- `{path/to/file2.py}` — {what functionality to add}
- `{path/to/test.spec.js}` — {test coverage required}

## Out of Scope
- {What explicitly NOT to change}
- {Future enhancements to defer}
- {Related but separate concerns}

## Technical Notes
- {Architecture decisions or constraints}
- {Performance considerations}
- {Security requirements}
- {Dependencies or integration points}

## Project Location
`{absolute path to project root}`

---

*This template supports both direct execution and mastery agent delegation. The complexity analysis guides the delegation decision for optimal resource utilization.*