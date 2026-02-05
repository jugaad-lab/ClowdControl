#!/bin/bash
# set-budget.sh — Set project token budget
# Usage: ./set-budget.sh <project_id> <budget_tokens> [alert_threshold]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env.agentcomms" 2>/dev/null || source ~/workspace/.env.agentcomms

PROJECT_ID="${1:?Usage: set-budget.sh <project_id> <budget_tokens> [alert_threshold]}"
BUDGET="${2:?Usage: set-budget.sh <project_id> <budget_tokens> [alert_threshold]}"
THRESHOLD="${3:-0.80}"

# Update project budget
curl -s -X PATCH "$MC_SUPABASE_URL/rest/v1/projects?id=eq.$PROJECT_ID" \
    -H "apikey: $MC_SERVICE_KEY" \
    -H "Authorization: Bearer $MC_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{\"budget_tokens\": $BUDGET, \"budget_alert_threshold\": $THRESHOLD}" | jq -r '.[0] | "✅ Set budget for \(.name): \(.budget_tokens) tokens (alert at \(.budget_alert_threshold * 100)%)"'
