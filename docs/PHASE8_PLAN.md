# Phase 8: Dashboard Polish & v1 Launch Readiness

**Goal:** Finalize Mission Control v1 — no new features, only polish, fixes, and integration.

**Time Target:** ~1 hour (12:45 PM - 1:45 PM)

---

## 📋 Checklist

### 8A: Real-time Updates (Priority: HIGH)
The dashboard should update live when data changes.

- [ ] **Home page** (`page.tsx`): Subscribe to tasks/projects changes
- [ ] **Project detail**: Real-time task updates within Kanban
- [ ] **Activity feed**: Live activity log display
- [ ] **Review queue**: Real-time review updates

**Implementation:**
- Use Supabase realtime subscriptions (already in hooks.ts)
- Add subscription cleanup on unmount
- Test: Change task status via CLI → dashboard updates

### 8B: Activity Feed Component (Priority: HIGH)
Show recent activity on the dashboard.

- [ ] Create `ActivityFeed.tsx` component
- [ ] Query `activity_log` table (last 20 entries)
- [ ] Format entries nicely (agent avatar, action, time ago)
- [ ] Add to home page sidebar or section
- [ ] Real-time subscription for new activity

### 8C: UI Polish (Priority: MEDIUM)
Fix visual issues and improve UX.

- [ ] Loading states for all data fetches
- [ ] Empty states for lists (no tasks, no proposals, etc.)
- [ ] Error boundaries / error states
- [ ] Remove console.log statements (11 found)
- [ ] Fix the CommandPalette TODO (create task action)
- [ ] Verify dark mode works everywhere
- [ ] Check mobile responsiveness (basic)

### 8D: Integration Testing (Priority: HIGH)
Make sure skill ↔ dashboard integration works.

- [ ] Test: `mc update <task> done` → dashboard shows done
- [ ] Test: `mc heartbeat` outputs valid Discord message
- [ ] Test: `mc spawn <task>` produces usable prompt
- [ ] Test: Dashboard → Supabase → CLI roundtrip

### 8E: Documentation & README (Priority: MEDIUM)
Prepare for v1 release.

- [ ] Update dashboard README with setup instructions
- [ ] Document environment variables needed
- [ ] Add "Getting Started" section to skill SKILL.md
- [ ] Screenshot of dashboard for docs

---

## 🏗️ Implementation Order

1. **8B: Activity Feed** — New component, high value
2. **8A: Real-time Updates** — Critical for "live" feel
3. **8D: Integration Testing** — Verify everything works
4. **8C: UI Polish** — Clean up before launch
5. **8E: Documentation** — Final touches

---

## 📁 Files to Create/Modify

### New Files
- `components/ActivityFeed.tsx` — Activity log display

### Modify
- `app/page.tsx` — Add activity feed, real-time
- `app/projects/[id]/page.tsx` — Real-time task updates
- `lib/hooks.ts` — Add activity subscription hook
- `SKILL.md` (mission-control skill) — Getting started docs
- `dashboard/README.md` — Setup instructions

---

## ✅ Done Criteria

**v1 is ready when:**
1. Dashboard shows live updates when tasks change
2. Activity feed shows recent agent actions
3. All pages have loading/empty/error states
4. CLI and dashboard data is in sync
5. No console.log clutter
6. Basic docs exist

---

## 🚫 NOT in v1 (Defer to v1.1)

- Mobile-first responsive design (basic only)
- Advanced filtering/search
- Export to CSV/PDF
- Notifications
- User authentication
- Deployment to Vercel

---

## 📊 Current State

**Dashboard:** Running at localhost:3000 ✅
**Database:** Supabase connected ✅
**Skill:** 20+ CLI commands working ✅
**Components:** 30+ React components built ✅

**Known Issues:**
- 1 TODO in CommandPalette (create task action)
- 11 console.log statements to remove
- Sprint acceptance_criteria renders as [object Object] in prompts
