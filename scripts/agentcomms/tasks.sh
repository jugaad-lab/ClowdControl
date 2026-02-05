#!/usr/bin/env bash
# List tasks assigned to me or all pending
# Usage: ./tasks.sh [--all|--pending|--mine]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-env.sh"
validate_env

FILTER="${1:---mine}"

case "$FILTER" in
  --all)
    QUERY="order=created_at.desc&limit=20"
    echo "📋 All recent tasks:"
    ;;
  --pending)
    QUERY="status=eq.pending&order=created_at.desc"
    echo "📋 Pending tasks (unclaimed):"
    ;;
  --mine|*)
    QUERY="to_agent=eq.${AGENT_ID}&status=neq.completed&order=created_at.desc"
    echo "📋 Tasks for ${AGENT_ID}:"
    ;;
esac

echo ""
curl -sS "${MC_SUPABASE_URL}/rest/v1/task_handoffs?${QUERY}" \
  -H "apikey: ${MC_SERVICE_KEY}" \
  -H "Authorization: Bearer ${MC_SERVICE_KEY}" | jq -r '.[] | "[\(.status)] \(.id[:8])... | \(.title // .task // "no title") | from: \(.from_agent)"'
