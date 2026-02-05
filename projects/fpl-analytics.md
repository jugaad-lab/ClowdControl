# Project: FPL Analytics Pipeline

## Overview

**Status:** Active
**Discord Channel:** #fpl
**Repository:** ~/workspace/fpl-data/
**Deadline:** Ongoing (season 2025-26)

### Description

AI-powered Fantasy Premier League analysis system with multi-gameweek projections, team optimization, and automated recommendations. Goal: match or beat paid services like FPL Review.

---

## Team

### Owners (Humans)

| Name | Role | Discord ID |
|------|------|------------|
| Yajat | Lead | 526417006908538881 |

### Agents

| Agent | Role | Responsibilities |
|-------|------|------------------|
| Chhotu | PM + Developer | Build features, coordinate sprints, daily briefings |

---

## Current State

### Completed ✅

- [x] FPL API integration (players, teams, fixtures)
- [x] FPL Core Insights integration (GitHub dataset)
- [x] Query CLI (search, team, fixtures, top)
- [x] Multi-GW projection engine (xPTS for 6 GWs)
- [x] Per-90 stats (xGI, xGC, DC/90, CS/90)
- [x] Player comparison feature
- [x] Position rankings with FDR multipliers
- [x] Daily cron (6 AM PST → Discord #fpl)
- [x] Skill file for natural language queries

### In Progress 🚧

- [ ] Team import via FPL Team ID
- [ ] OpenFPL API integration (ML predictions)

### Planned ⏳

- [ ] MILP squad optimizer
- [ ] Transfer planner with rolling horizon
- [ ] Chip timing recommendations
- [ ] Accuracy tracking + model improvement

---

## Sprints

### Sprint 0: Foundation ✅

**Goal:** Core data pipeline + projections
**Status:** Completed
**Dates:** 2026-01-29 to 2026-02-04

#### Acceptance Criteria

- [x] Fetch live data from FPL API
- [x] Query players by name, team, position, price
- [x] Project xPTS for next 6 gameweeks
- [x] Compare multiple players head-to-head
- [x] Automate daily refresh + Discord delivery

---

### Sprint 1: Team Import + ML Predictions

**Goal:** Import user team, integrate OpenFPL predictions
**Status:** Active
**Dates:** 2026-02-04 to 2026-02-11

#### Acceptance Criteria

- [ ] Fetch user squad via FPL Team ID
- [ ] Parse 15-man squad + bench order
- [ ] Track bank balance and free transfers
- [ ] Integrate OpenFPL API for ML predictions
- [ ] Fall back to local projections if rate limited
- [ ] Command: `fpl status` shows current team

#### Tasks

| Task | Type | Assigned | Status | Priority |
|------|------|----------|--------|----------|
| Build team import script | feature | Chhotu | todo | high |
| Get Yajat's FPL Team ID | task | Yajat | todo | high |
| Set up RapidAPI for OpenFPL | task | Yajat | todo | medium |
| Test team fetch + display | task | Chhotu | todo | medium |
| Update skill with team commands | task | Chhotu | todo | low |

---

### Sprint 2: Squad Optimizer

**Goal:** MILP solver for optimal squad selection
**Status:** Planned
**Dates:** 2026-02-11 to 2026-02-18

#### Acceptance Criteria

- [ ] Budget constraint (£100m)
- [ ] Squad rules (3 per team, 2 GK, 5 DEF, 5 MID, 3 FWD)
- [ ] Maximize projected points over N gameweeks
- [ ] Suggest optimal transfers (considering FTs and hits)
- [ ] Command: `fpl best transfers`

---

### Sprint 3: Polish + Commands

**Goal:** Natural language interface, alerts, cleanup
**Status:** Planned
**Dates:** 2026-02-18 to 2026-02-21

#### Acceptance Criteria

- [ ] NL commands: `fpl captain`, `fpl transfers`, `fpl wildcard`
- [ ] Price rise/fall alerts
- [ ] Deadline reminders (24h, 1h)
- [ ] Post-GW summary with actual vs predicted

---

## Transfer Notes

| Date | Note |
|------|------|
| 2026-02-04 | Consider João Pedro → Ekitiké before GW28 (Pedro hits ARS away, Ekitiké has WHU home). Reminder set for Feb 18. |

---

## Decisions Log

| Date | Decision | Made By | Context |
|------|----------|---------|---------|
| 2026-01-29 | Use official FPL API as primary data source | Yajat + Chhotu | Undocumented but stable, entire community uses it |
| 2026-02-04 | Add multi-GW projections like FFScout | Yajat | Saw FFScout's xPTS NEXT 6 display |
| 2026-02-04 | Plan hybrid approach: OpenFPL API + local optimizer | Yajat + Chhotu | Use their ML, add our own optimization layer |

---

## Resources

- **Code:** `~/workspace/fpl-data/`
- **README:** `~/workspace/fpl-data/README.md`
- **ROADMAP:** `~/workspace/fpl-data/ROADMAP.md`
- **Skill:** `~/workspace/skills/fpl/SKILL.md`

### External

- OpenFPL Paper: https://arxiv.org/html/2508.09992v1
- OpenFPL-Scout-AI: https://github.com/elcaiseri/OpenFPL-Scout-AI
- FPL Core Insights: https://github.com/olbauday/FPL-Core-Insights
- Open FPL Solver: https://github.com/solioanalytics/open-fpl-solver

---

## Notes

- FPL Team ID needed from Yajat to enable team import
- OpenFPL RapidAPI has 10 req/hr free tier — may need caching
- xPTS projections are estimates — use alongside eye test
- Cron delivers daily briefing to #fpl at 6 AM PST
