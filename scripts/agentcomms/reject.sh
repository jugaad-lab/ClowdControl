#!/usr/bin/env bash
# Reject a task assigned to you
# Usage: ./reject.sh <task_id> [reason]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-env.sh"
validate_env

TASK_ID="${1:?Usage: $0 <task_id> [reason]}"
REASON="${2:-No reason provided}"

AGENT_ID="${AGENT_ID:-unknown}"

# Build result JSON with rejection reason
RESULT_JSON=$(jq -n \
  --arg reason "$REASON" \
  --arg rejected_by "$AGENT_ID" \
  --arg rejected_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{
    rejection_reason: $reason,
    rejected_by: $rejected_by,
    rejected_at: $rejected_at
  }')

RESULT=$(curl -sS -X PATCH "${MC_SUPABASE_URL}/rest/v1/task_handoffs?id=eq.${TASK_ID}" \
  -H "apikey: ${MC_SERVICE_KEY}" \
  -H "Authorization: Bearer ${MC_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"status\": \"rejected\",
    \"result\": ${RESULT_JSON}
  }")

echo "❌ Task rejected: ${TASK_ID}"
echo "   Reason: ${REASON}"
echo "$RESULT" | jq .
