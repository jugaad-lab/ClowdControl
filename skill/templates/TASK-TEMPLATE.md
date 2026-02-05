# Task: {Task Title}

## Task ID
`{uuid}`

## Agent
- **Target:** {agent-id} (e.g., friday-dev, antman, wong)
- **Profile:** `agents/{agent-name}.md`
- **Model:** {model from agent profile}

## Project
- **Project:** {project name}
- **Project ID:** {uuid}
- **Sprint:** {sprint name or "none"}

## Objective
{Clear, specific goal — 1-2 sentences describing what needs to be accomplished}

## Context
{Background information, related code, dependencies, why this task matters}

## Requirements
1. {Specific requirement 1}
2. {Specific requirement 2}
3. {Specific requirement 3}

## Acceptance Criteria
- [ ] {Testable criterion 1}
- [ ] {Testable criterion 2}
- [ ] {Testable criterion 3}

## Inputs
{Agent-specific inputs as defined in their profile's PM Input Requirements}

## Files/Paths
- `{path/to/file}` — {description of what this file contains}
- `{path/to/directory/}` — {description of directory purpose}

## Out of Scope
- {What NOT to do}
- {What to leave unchanged}

## Output Expected
{What the agent should deliver — refer to agent profile's Output Format}

## Notes
{Any additional context, gotchas, tips, or special considerations}

---

## Template Usage

### For Development Tasks
```markdown
## Requirements
1. Implement authentication middleware
2. Add JWT token generation/validation
3. Create login/logout/signup endpoints
4. Write unit tests for auth functions

## Acceptance Criteria
- [ ] User can sign up with email/password
- [ ] User can log in and receive JWT token
- [ ] Protected routes validate JWT tokens
- [ ] All tests pass
```

### For Documentation Tasks
```markdown
## Requirements
1. Document all API endpoints
2. Include request/response examples
3. Add authentication flow diagram
4. Generate PDF reference guide

## Acceptance Criteria
- [ ] All endpoints documented with examples
- [ ] Authentication section complete
- [ ] PDF generated in docs/ directory
```

### For Design Tasks  
```markdown
## Requirements
1. Create wireframes for user dashboard
2. Design mobile-responsive layout
3. Include dark mode variants
4. Export assets for development

## Acceptance Criteria
- [ ] Desktop and mobile wireframes complete
- [ ] Dark/light themes designed
- [ ] Assets exported in proper formats
```

### For Research Tasks
```markdown
## Requirements
1. Research competitor authentication flows
2. Interview 5 potential users about preferences
3. Analyze current user feedback
4. Recommend best approach

## Acceptance Criteria
- [ ] Competitor analysis complete (3+ apps)
- [ ] User interviews conducted and documented
- [ ] Recommendation with rationale provided
```