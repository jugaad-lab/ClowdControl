# Agent Profiles

This directory contains detailed profiles for all Clowd-Control workers. Each profile defines:

1. **Identity** — Model, skill level, token budget
2. **Capabilities** — What the worker can do
3. **Immutable Behaviors** — Hard-coded behaviors that can't be overridden
4. **PM Input Requirements** — What the PM must provide when assigning work
5. **Constraints** — What the worker cannot do
6. **Invocation** — How to spawn the worker
7. **Output Format** — How the worker reports back

## Worker Roster

### Project Managers
| Profile | Display Name | Model | Role |
|---------|-------------|-------|------|
| [pm-orchestrator.md](pm-orchestrator.md) | PM Orchestrator | sonnet4/opus | Project Manager |

### Development
| Profile | Display Name | Model | Skill | Role |
|---------|-------------|-------|-------|------|
| [worker-dev.md](worker-dev.md) | Developer | sonnet-4.5 | Senior | Developer |

### Quality Assurance
| Profile | Display Name | Model | Skill | Role |
|---------|-------------|-------|-------|------|
| [worker-ui-qa.md](worker-ui-qa.md) | UI QA Engineer | sonnet-4 | Mid | UI QA Engineer |
| [worker-qa.md](worker-qa.md) | QA Engineer | sonnet-4 | Mid | QA Engineer |
| [worker-analyst.md](worker-analyst.md) | Product Analyst | sonnet-4 | Senior | Product Analyst |

### Research & Analysis
| Profile | Display Name | Model | Skill | Role |
|---------|-------------|-------|-------|------|
| [worker-customer.md](worker-customer.md) | Customer Researcher | sonnet-4 | Senior | Customer Research |
| [worker-seo.md](worker-seo.md) | SEO Analyst | sonnet-3.5 | Lead | SEO & Analytics |

### Content & Marketing
| Profile | Display Name | Model | Skill | Role |
|---------|-------------|-------|-------|------|
| [worker-content.md](worker-content.md) | Content Writer | sonnet-3.5 | Junior | Content Writer |
| [worker-social.md](worker-social.md) | Social Media Manager | sonnet-3.5 | Mid | Social Media |
| [worker-marketing.md](worker-marketing.md) | Email Marketing | sonnet-3.5 | Mid | Email Marketing |

### Design & Documentation
| Profile | Display Name | Model | Skill | Role |
|---------|-------------|-------|-------|------|
| [worker-design.md](worker-design.md) | Designer | haiku-3.5 | Mid | UI/UX Designer |
| [worker-research.md](worker-research.md) | Researcher | haiku-3.5 | Mid | Documentation |

## How to Use

### For PMs
1. Before assigning work, **read the worker's profile**
2. Check the **PM Input Requirements** table
3. Prepare all **required inputs** using the templates
4. Create the task in Clowd-Control
5. Spawn the worker with proper context
6. Monitor and verify output

### For Humans
1. Review profiles to understand worker capabilities
2. Edit profiles via Clowd-Control UI (Agents → Edit Profile)
3. Update behaviors/constraints as needed
4. Profiles sync to database on save

## Editing Profiles

Profiles can be edited:
1. **Directly** — Edit markdown files in this directory
2. **Via UI** — Clowd-Control → Agents → Click worker → Edit Profile

Changes to profiles affect how PMs assign work to workers.

## Creating New Workers

1. Copy `AGENT-PROFILE-TEMPLATE.md`
2. Fill in all sections
3. Add to agent registry in Supabase
4. Update this README

## File Structure

```
agents/
├── README.md                    # This file
├── AGENT-PROFILE-TEMPLATE.md    # Template for new workers
├── pm-orchestrator.md           # PM profile
├── worker-dev.md                # Developer
├── worker-ui-qa.md              # UI QA
├── worker-qa.md                 # QA Engineer
├── worker-analyst.md            # Product Analyst
├── worker-customer.md           # Customer Research
├── worker-seo.md                # SEO Analyst
├── worker-content.md            # Content Writer
├── worker-social.md             # Social Media
├── worker-design.md             # Designer
├── worker-research.md           # Documentation
└── worker-marketing.md          # Email Marketing
```
