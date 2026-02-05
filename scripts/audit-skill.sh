#!/bin/bash
# audit-skill.sh — Quick security scan for skills before adoption
# Usage: ./audit-skill.sh /path/to/skill

set -euo pipefail

SKILL_DIR="${1:-}"
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR" ]; then
    echo "Usage: $0 /path/to/skill"
    exit 1
fi

echo "🔍 Auditing skill: $SKILL_DIR"
echo "================================"
ISSUES=0

# Check for SKILL.md
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
    echo -e "${RED}❌ CRITICAL: No SKILL.md found${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}✓ SKILL.md present${NC}"
fi

# Check for credential access patterns
echo ""
echo "🔐 Checking for credential access..."
if grep -rn --include="*.md" --include="*.sh" --include="*.py" --include="*.js" \
    "clawdbot\.json\|\.ssh/\|\.aws/\|\.gnupg/\|\.env\b" "$SKILL_DIR" 2>/dev/null; then
    echo -e "${RED}⚠️  WARN: Potential credential access patterns found${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}✓ No credential access patterns${NC}"
fi

# Check for code execution patterns
echo ""
echo "🔓 Checking for code execution patterns..."
if grep -rn --include="*.md" --include="*.sh" --include="*.py" --include="*.js" \
    "eval(\|exec(\|subprocess\|os\.system\|child_process" "$SKILL_DIR" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  NOTE: Code execution found (review carefully)${NC}"
fi

# Check for network calls
echo ""
echo "🌐 Checking for network activity..."
if grep -rn --include="*.md" --include="*.sh" --include="*.py" --include="*.js" \
    "curl\|wget\|fetch\|requests\.\|http://\|https://" "$SKILL_DIR" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  NOTE: Network calls found (verify destinations)${NC}"
fi

# Check for suspicious patterns
echo ""
echo "🚨 Checking for red flags..."
REDFLAGS=$(grep -rn --include="*.md" --include="*.sh" --include="*.py" --include="*.js" \
    "ignore.*security\|ignore.*rules\|base64.*decode\|atob\|btoa" "$SKILL_DIR" 2>/dev/null || true)
if [ -n "$REDFLAGS" ]; then
    echo -e "${RED}❌ CRITICAL: Suspicious patterns found:${NC}"
    echo "$REDFLAGS"
    ((ISSUES++))
else
    echo -e "${GREEN}✓ No obvious red flags${NC}"
fi

# Summary
echo ""
echo "================================"
if [ $ISSUES -gt 0 ]; then
    echo -e "${RED}⚠️  Audit found $ISSUES issue(s) — review required${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Quick scan passed — consider deep audit for unknown sources${NC}"
    exit 0
fi
