#!/bin/bash
# budget-status.sh — Check project budget consumption
# Usage: ./budget-status.sh [project_id]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env.agentcomms" 2>/dev/null || source ~/workspace/.env.agentcomms

PROJECT_ID="${1:-}"

if [ -n "$PROJECT_ID" ]; then
    # Single project
    FILTER="id=eq.$PROJECT_ID"
else
    # All active projects
    FILTER="status=eq.active"
fi

# Query project budget status
curl -s "$MC_SUPABASE_URL/rest/v1/projects?$FILTER&select=id,name,budget_tokens,tokens_consumed,budget_alert_threshold,current_pm_id" \
    -H "apikey: $MC_SERVICE_KEY" \
    -H "Authorization: Bearer $MC_SERVICE_KEY" | jq -r '
    .[] | 
    if .budget_tokens == 0 then
        "[\(.name)] Budget: unlimited | Consumed: \(.tokens_consumed) tokens"
    else
        . as $p |
        (($p.tokens_consumed / $p.budget_tokens) * 100) | floor | . as $pct |
        if $pct >= 100 then
            "🚨 [\($p.name)] EXCEEDED: \($pct)% (\($p.tokens_consumed)/\($p.budget_tokens)) — PM: \($p.current_pm_id)"
        elif ($pct / 100) >= $p.budget_alert_threshold then
            "⚠️  [\($p.name)] WARNING: \($pct)% (\($p.tokens_consumed)/\($p.budget_tokens)) — PM: \($p.current_pm_id)"
        else
            "✅ [\($p.name)] OK: \($pct)% (\($p.tokens_consumed)/\($p.budget_tokens))"
        end
    end
'
