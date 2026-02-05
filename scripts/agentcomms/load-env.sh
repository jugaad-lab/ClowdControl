#!/usr/bin/env bash
# Load AgentComms credentials from standard locations
# Sourced by all AgentComms scripts

# Priority order:
# 1. ~/workspace/.env.agentcomms (documented standard location)
# 2. ./scripts/.env (in repo, for convenience)
# 3. Environment variables already set

if [ -f ~/workspace/.env.agentcomms ]; then
  source ~/workspace/.env.agentcomms
elif [ -f "${SCRIPT_DIR}/.env" ]; then
  source "${SCRIPT_DIR}/.env"
elif [ -f "${SCRIPT_DIR}/../.env" ]; then
  source "${SCRIPT_DIR}/../.env"
fi

# Validate required vars
validate_env() {
  if [[ -z "${MC_SUPABASE_URL:-}" || -z "${MC_SERVICE_KEY:-}" ]]; then
    echo "❌ Missing MC_SUPABASE_URL or MC_SERVICE_KEY"
    echo ""
    echo "Create ~/workspace/.env.agentcomms with:"
    echo "  MC_SUPABASE_URL=https://xxx.supabase.co"
    echo "  MC_SERVICE_KEY=your-service-key"
    echo "  AGENT_ID=your-agent-id"
    exit 1
  fi
}
