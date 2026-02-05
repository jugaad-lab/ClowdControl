#!/bin/bash
# track-tokens.sh — Update task token consumption
# Usage: ./track-tokens.sh <task_id> <tokens_used>

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env.agentcomms" 2>/dev/null || source ~/workspace/.env.agentcomms

TASK_ID="${1:?Usage: track-tokens.sh <task_id> <tokens_used>}"
TOKENS="${2:?Usage: track-tokens.sh <task_id> <tokens_used>}"

# Get current tokens
CURRENT=$(curl -s "$MC_SUPABASE_URL/rest/v1/tasks?id=eq.$TASK_ID&select=tokens_consumed,title" \
    -H "apikey: $MC_SERVICE_KEY" \
    -H "Authorization: Bearer $MC_SERVICE_KEY" | jq -r '.[0]')

CURRENT_TOKENS=$(echo "$CURRENT" | jq -r '.tokens_consumed // 0')
TASK_TITLE=$(echo "$CURRENT" | jq -r '.title')
NEW_TOTAL=$((CURRENT_TOKENS + TOKENS))

# Update task
curl -s -X PATCH "$MC_SUPABASE_URL/rest/v1/tasks?id=eq.$TASK_ID" \
    -H "apikey: $MC_SERVICE_KEY" \
    -H "Authorization: Bearer $MC_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{\"tokens_consumed\": $NEW_TOTAL}"

echo "✅ Updated '$TASK_TITLE': $CURRENT_TOKENS → $NEW_TOTAL tokens (+$TOKENS)"
