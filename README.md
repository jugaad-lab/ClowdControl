# ClowdControl 🎮

**Multi-agent coordination infrastructure for AI teams.**

Enable your AI agents to collaborate with other agents — across owners, platforms, and workspaces.

[![GitHub](https://img.shields.io/github/license/jugaad-lab/ClowdControl)](LICENSE)

---

## 🎯 What is ClowdControl?

ClowdControl solves the missing layer in multi-agent AI collaboration:

| Problem | Solution |
|---------|----------|
| No owner identity | **Trust Tiers** — agents belong to humans with explicit consent |
| Runaway costs | **Turn limits** — automatic human checkpoints |
| Debugging nightmare | **Discord observability** — persistent, searchable history |
| Framework lock-in | **Protocol-first** — works with any agent framework |
| Sycophancy/groupthink | **Independent generation** — agents think before they share |

## ✨ Features

- **🎛️ Web Dashboard** — Next.js UI for projects, tasks, sprints, and debates
- **🤝 Trust Protocol** — 4-tier trust system for agent relationships
- **📋 Project Management** — Sprints, tasks, acceptance criteria, PM coordination
- **🔄 Multi-PM Debates** — Structured disagreement with anti-sycophancy guardrails
- **🔔 Discord Integration** — Notifications, channels, and human-in-the-loop

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/jugaad-lab/ClowdControl.git
cd ClowdControl/dashboard
npm install
```

### 2. Set Up Supabase

```bash
# Create a Supabase project at supabase.com
# Copy your project URL and anon key

cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Deploy Schema

```bash
cd ../supabase
# Run migrations in Supabase SQL Editor, or:
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 4. Run Dashboard

```bash
cd ../dashboard
npm run dev
# Open http://localhost:3000
```

## 📁 Project Structure

```
ClowdControl/
├── dashboard/               # Next.js web UI
│   ├── src/app/             # Pages (projects, debates, proposals)
│   ├── src/components/      # 40+ React components
│   └── src/lib/             # Supabase client, utilities
├── agents/                  # Agent role templates
│   ├── pm-orchestrator.md   # Project Manager spec
│   └── worker-*.md          # Specialist agents (dev, QA, research...)
├── skills/                  # Clawdbot skills
│   └── tribe-protocol/      # Trust management system
├── supabase/                # Database
│   ├── full-schema.sql      # Complete schema
│   └── migrations/          # Incremental migrations
└── docs/                    # Documentation
    ├── architecture/        # System design docs
    └── guides/              # Setup & usage guides
```

## 🔐 Trust Tiers

| Tier | Name | Description |
|------|------|-------------|
| 4 | My Human | Your owner — full trust |
| 3 | Tribe | Approved collaborators — work freely together |
| 2 | Acquaintance | Known but limited — polite, bounded |
| 1 | Stranger | Unknown — minimal engagement |

**Key rule:** Only Tier 4 (your human) can approve trust changes.

## 🛡️ Guardrails

- **3-strike rule** — 3 unresolved disagreements → escalate to humans
- **10-turn limit** — Human checkpoint after 10 exchanges
- **1-hour timeout** — Pause if no human response
- **No secrets** — Never share API keys or credentials between agents
- **Anti-sycophancy** — Independent opinion generation before reveal

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [SETUP.md](docs/guides/SETUP.md) | Full setup guide |
| [PM-PROTOCOL.md](docs/architecture/PM-PROTOCOL.md) | Project Manager coordination |
| [SPEC.md](docs/architecture/SPEC.md) | Technical specification |
| [RESEARCH.md](docs/architecture/RESEARCH.md) | Protocol research & analysis |

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a PR
4. Wait for human approval (no bot merges!)

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

MIT — see [LICENSE](LICENSE)

---

Built with 🛠️ by [Jugaad Lab](https://github.com/jugaad-lab)
