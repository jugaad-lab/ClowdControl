#!/usr/bin/env bash
# Broadcast a task for any capable agent to claim
# Usage: ./broadcast.sh <task_description> [priority] [payload_json]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-env.sh"
validate_env

TASK="${1:?Usage: $0 <task_description> [priority] [payload_json]}"
PRIORITY="${2:-medium}"
PAYLOAD="${3:-null}"

FROM_AGENT="${AGENT_ID:-unknown}"

# Build JSON payload
JSON_PAYLOAD=$(jq -n \
  --arg from "$FROM_AGENT" \
  --arg title "$TASK" \
  --arg priority "$PRIORITY" \
  --argjson payload "$PAYLOAD" \
  '{
    from_agent: $from,
    to_agent: null,
    title: $title,
    status: "pending",
    priority: $priority,
    payload: $payload
  }')

RESULT=$(curl -sS -X POST "${MC_SUPABASE_URL}/rest/v1/task_handoffs" \
  -H "apikey: ${MC_SERVICE_KEY}" \
  -H "Authorization: Bearer ${MC_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$JSON_PAYLOAD")

TASK_ID=$(echo "$RESULT" | jq -r '.[0].id // .id // "unknown"')
echo "📢 Task broadcast: ${TASK_ID}"
echo "   Anyone can claim this task"
echo "$RESULT" | jq .
