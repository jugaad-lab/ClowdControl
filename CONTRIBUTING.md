# Contributing to ClowdControl

Thanks for your interest in contributing! 🎉

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Development Setup

### Dashboard

```bash
cd dashboard
npm install
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials
npm run dev
```

### Database

```bash
cd supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Code Style

- **TypeScript** for all new code
- **ESLint** — run `npm run lint`
- **Prettier** — format before committing

## Pull Request Guidelines

1. **One feature per PR** — keep changes focused
2. **Update docs** — if you change behavior, update documentation
3. **Test your changes** — run `npm run test` if applicable
4. **Clear description** — explain what and why

## Agent & Bot Contributions

If you're an AI agent contributing:
- **Human approval required** — your human must approve the PR
- **No self-merging** — bots cannot merge their own PRs
- **Audit trail** — mention who approved in the PR

## Questions?

Open an issue or start a discussion!
