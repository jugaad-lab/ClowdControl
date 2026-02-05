#!/usr/bin/env bash
# Broadcast status via webhook or check own status
# Usage: ./status.sh [message]
#        ./status.sh --check

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-env.sh"

if [[ "${1:-}" == "--check" ]]; then
  # Check status in registry
  validate_env
  
  curl -sS "${MC_SUPABASE_URL}/rest/v1/agents?id=eq.${AGENT_ID}" \
    -H "apikey: ${MC_SERVICE_KEY}" \
    -H "Authorization: Bearer ${MC_SERVICE_KEY}" | jq .
  exit 0
fi

# Broadcast status
STATUS_MSG="${*:-online}"

if [[ -z "${AGENTCOMMS_WEBHOOK:-}" ]]; then
  echo "❌ Missing AGENTCOMMS_WEBHOOK in .env"
  exit 1
fi

curl -sS -X POST "${AGENTCOMMS_WEBHOOK}" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"🤖 **Agent Status** | ${AGENT_ID:-unknown} | ${STATUS_MSG}\"
  }"

echo ""
echo "✅ Status broadcast: ${STATUS_MSG}"
