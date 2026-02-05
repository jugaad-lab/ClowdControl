# Changelog

All notable changes to Clowd-Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial Clowd-Control skill with multi-agent coordination
- AgentComms system for inter-agent communication via Supabase
- PM Protocol for project management workflows
- Next.js dashboard with real-time task monitoring
- Sprint management with automatic task ordering
- Task dependency tracking and blocking detection
- Agent onboarding and handoff scripts
- Supabase schema with RLS policies
- Production hygiene files (SECURITY.md, CHANGELOG.md, templates)

### Infrastructure
- Supabase backend with realtime subscriptions
- Row-level security for multi-tenant safety
- Dashboard with Tailwind CSS and shadcn/ui components

## [0.1.0] - 2026-02-05

### Added
- 🎉 Initial release of Clowd-Control
- Core AgentComms messaging system
- Task and project management schema
- PM workflow documentation
- Basic dashboard for task visualization
- Shell scripts for agent operations:
  - `tasks.sh` - Query and filter tasks
  - `claim.sh` - Claim tasks for an agent
  - `complete.sh` - Mark tasks as done
  - `handoff.sh` - Transfer tasks between agents
  - `broadcast.sh` - Send messages to all agents
- Agent templates and onboarding guides
- Comprehensive SKILL.md documentation

### Security
- Supabase RLS policies for all tables
- Agent-scoped data access
- Secure API key handling

---

## Version History

- **0.1.0** (2026-02-05): Initial public release with core coordination features
