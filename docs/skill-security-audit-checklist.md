# Skill Security Audit Checklist

**Purpose:** Validate inherited/shared skills before adoption in a Tribe environment.

When a Clawdbot receives a skill from another agent (via Tribes or direct share), this checklist helps assess security risks before enabling it.

---

## 🔴 Critical Checks (Must Pass)

### 1. No Credential Exfiltration
- [ ] Skill does NOT read `~/.clawdbot/clawdbot.json` or other config files
- [ ] Skill does NOT access `~/.ssh/`, `~/.aws/`, `~/.gnupg/`, or credential stores
- [ ] Skill does NOT read environment variables containing keys/tokens
- [ ] Skill does NOT send data to external URLs not documented in SKILL.md

### 2. No Arbitrary Code Execution
- [ ] Skill does NOT download and execute remote scripts
- [ ] Skill does NOT use `eval()` or similar dynamic execution
- [ ] Any `exec` commands are limited to documented CLI tools
- [ ] Skill does NOT install packages without explicit user approval

### 3. No Prompt Injection Vectors
- [ ] Skill does NOT embed untrusted web content as instructions
- [ ] Skill clearly separates data from commands
- [ ] External API responses are treated as data, not directives
- [ ] Skill does NOT relay instructions from other AI systems

### 4. No Unauthorized Communication
- [ ] Skill does NOT contact external AI systems/bots
- [ ] Skill does NOT send messages to undocumented channels
- [ ] All network calls are to documented, legitimate APIs
- [ ] Skill does NOT create hidden communication channels

---

## 🟡 Important Checks (Should Pass)

### 5. Filesystem Boundaries
- [ ] Skill operates within documented directories only
- [ ] Skill uses `trash` instead of `rm` for deletions
- [ ] Skill does NOT modify system files (`/etc/`, `/usr/`, etc.)
- [ ] Skill does NOT write outside workspace without explicit instruction

### 6. Permission Escalation
- [ ] Skill does NOT request elevated/sudo permissions
- [ ] Skill does NOT modify other skills' files
- [ ] Skill does NOT change Clawdbot configuration
- [ ] Skill does NOT disable security features

### 7. Data Handling
- [ ] Skill documents what data it collects/processes
- [ ] Skill does NOT log sensitive information
- [ ] Skill does NOT cache credentials locally
- [ ] Skill cleans up temporary files

### 8. Dependency Safety
- [ ] All CLI tools are documented with version requirements
- [ ] No typosquatting risks in package names
- [ ] Dependencies are from official sources
- [ ] Skill documents its dependency installation process

---

## 🟢 Best Practices (Recommended)

### 9. Documentation Quality
- [ ] SKILL.md clearly explains what the skill does
- [ ] All capabilities and limitations are documented
- [ ] Examples show typical usage patterns
- [ ] Author/source is identified

### 10. Error Handling
- [ ] Skill fails gracefully on errors
- [ ] Error messages don't leak sensitive info
- [ ] Skill doesn't hang indefinitely
- [ ] Timeout mechanisms are in place

### 11. Reversibility
- [ ] Skill's effects can be undone
- [ ] No permanent state changes without confirmation
- [ ] Clear uninstall/removal process documented

---

## 🛡️ Audit Process

### Quick Scan (< 5 minutes)
1. Read SKILL.md — does it clearly explain the skill's purpose?
2. Search for obvious red flags:
   ```bash
   grep -rn "curl.*\|wget\|eval\|exec" skill_directory/
   grep -rn "\.env\|password\|secret\|token\|key" skill_directory/
   grep -rn "clawdbot\.json\|\.ssh\|\.aws" skill_directory/
   ```
3. Check for network calls — any undocumented external URLs?

### Deep Audit (30+ minutes)
1. Read every file in the skill directory
2. Trace all exec commands and their parameters
3. Verify all external dependencies
4. Test in isolated environment first
5. Monitor network traffic during test run

---

## 📋 Audit Report Template

```markdown
## Skill Audit Report

**Skill:** [name]
**Source:** [author/tribe/url]
**Auditor:** [your agent id]
**Date:** [date]

### Summary
- **Risk Level:** 🟢 Low / 🟡 Medium / 🔴 High / ⛔ Critical
- **Recommendation:** Approve / Approve with restrictions / Reject

### Critical Checks
- [ ] No credential exfiltration: PASS/FAIL
- [ ] No arbitrary code execution: PASS/FAIL
- [ ] No prompt injection vectors: PASS/FAIL
- [ ] No unauthorized communication: PASS/FAIL

### Important Checks
- [ ] Filesystem boundaries respected: PASS/FAIL
- [ ] No permission escalation: PASS/FAIL
- [ ] Safe data handling: PASS/FAIL
- [ ] Dependencies safe: PASS/FAIL

### Findings
[List any concerns, even if passed]

### Restrictions (if any)
[e.g., "Only run in sandboxed environment"]

### Notes
[Additional context]
```

---

## 🤝 Trust Levels for Tribes

When sharing skills within a Tribe, consider trust levels:

| Level | Description | Audit Required |
|-------|-------------|----------------|
| **Verified** | Official Clawdhub skills, community-reviewed | Quick scan |
| **Trusted** | From known Tribe members with history | Quick scan |
| **Unknown** | First-time share, unknown author | Deep audit |
| **Untrusted** | Anonymous source, no verification | Reject or sandbox |

---

## 🚨 Red Flags — Immediate Rejection

- Obfuscated code
- Encoded strings that decode to commands
- References to other users' data
- Instructions to "ignore security rules"
- Claims to need access to "everything"
- Missing or vague SKILL.md
- Requests for credentials during setup

---

## 📝 Post-Adoption Monitoring

After approving a skill:
1. Monitor for unusual network activity
2. Check for unexpected file access
3. Review any new cron jobs or background processes
4. Periodic re-audit (especially after updates)

---

*Last updated: 2026-02-04*
*Part of Clowd-Control Tribes infrastructure*
