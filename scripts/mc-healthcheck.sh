#!/bin/bash
# MC Health Check - Validates Mission Control setup
# Usage: ./mc-healthcheck.sh [--verbose] [--json]
#
# Exit codes:
#   0 = All checks passed
#   1 = Some checks failed (see output)
#   2 = Critical error (cannot run checks)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Parse args
VERBOSE=false
JSON_OUTPUT=false
for arg in "$@"; do
  case $arg in
    --verbose|-v) VERBOSE=true ;;
    --json|-j) JSON_OUTPUT=true ;;
  esac
done

# Results tracking
declare -a PASSED=()
declare -a FAILED=()
declare -a WARNINGS=()

log_pass() {
  PASSED+=("$1")
  $JSON_OUTPUT || echo -e "${GREEN}✓${NC} $1"
}

log_fail() {
  FAILED+=("$1")
  $JSON_OUTPUT || echo -e "${RED}✗${NC} $1"
}

log_warn() {
  WARNINGS+=("$1")
  $JSON_OUTPUT || echo -e "${YELLOW}⚠${NC} $1"
}

log_info() {
  $JSON_OUTPUT || echo -e "  $1"
}

log_header() {
  $JSON_OUTPUT || echo -e "\n${BOLD}$1${NC}"
}

# Load environment
ENV_FILE="${ENV_FILE:-$HOME/workspace/.env.agentcomms}"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
  log_pass "Environment loaded from $ENV_FILE"
else
  log_fail "Environment file not found: $ENV_FILE"
  echo "Please set MC_SUPABASE_URL and MC_SERVICE_KEY"
  exit 2
fi

# Validate required env vars
if [ -z "${MC_SUPABASE_URL:-}" ]; then
  log_fail "MC_SUPABASE_URL not set"
  exit 2
fi

if [ -z "${MC_SERVICE_KEY:-}" ]; then
  log_fail "MC_SERVICE_KEY not set"
  exit 2
fi

log_pass "Required env vars present"

# Helper to query Supabase
supabase_query() {
  local endpoint="$1"
  curl -s "${MC_SUPABASE_URL}/rest/v1/${endpoint}" \
    -H "apikey: ${MC_SERVICE_KEY}" \
    -H "Authorization: Bearer ${MC_SERVICE_KEY}"
}

# ============================================
# 1. Check Core Tables Exist
# ============================================
log_header "📊 Core Tables"

CORE_TABLES=(
  "projects"
  "sprints"
  "tasks"
  "agents"
  "agent_messages"
  "profiles"
  "project_members"
)

for table in "${CORE_TABLES[@]}"; do
  result=$(supabase_query "${table}?select=count&limit=0" 2>/dev/null)
  if echo "$result" | grep -q '"code"'; then
    log_fail "Table '$table' not accessible"
    $VERBOSE && log_info "Error: $result"
  else
    log_pass "Table '$table' exists"
  fi
done

# ============================================
# 2. Check Schema (sample columns)
# ============================================
log_header "🔧 Schema Validation"

# Check projects has required columns
projects_cols=$(supabase_query "projects?select=id,name,settings,current_pm_id,visibility&limit=1" 2>/dev/null)
if echo "$projects_cols" | grep -q '"code"'; then
  log_fail "Projects table missing required columns"
  $VERBOSE && log_info "Error: $projects_cols"
else
  log_pass "Projects schema OK"
fi

# Check agents has required columns
agents_cols=$(supabase_query "agents?select=id,display_name,role,is_active,capabilities&limit=1" 2>/dev/null)
if echo "$agents_cols" | grep -q '"code"'; then
  log_fail "Agents table missing required columns"
  $VERBOSE && log_info "Error: $agents_cols"
else
  log_pass "Agents schema OK"
fi

# Check tasks has required columns
tasks_cols=$(supabase_query "tasks?select=id,title,status,assigned_to,project_id,sprint_id&limit=1" 2>/dev/null)
if echo "$tasks_cols" | grep -q '"code"'; then
  log_fail "Tasks table missing required columns"
  $VERBOSE && log_info "Error: $tasks_cols"
else
  log_pass "Tasks schema OK"
fi

# Check agent_messages has required columns
msgs_cols=$(supabase_query "agent_messages?select=id,from_agent,to_agent,message_type,content,read&limit=1" 2>/dev/null)
if echo "$msgs_cols" | grep -q '"code"'; then
  log_fail "Agent_messages table missing required columns"
  $VERBOSE && log_info "Error: $msgs_cols"
else
  log_pass "Agent_messages schema OK"
fi

# ============================================
# 3. Check Data Integrity
# ============================================
log_header "📈 Data Integrity"

# Count records
project_count=$(supabase_query "projects?select=count" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
if [ -n "$project_count" ] && [ "$project_count" -gt 0 ]; then
  log_pass "Found $project_count project(s)"
else
  log_warn "No projects found (empty database?)"
fi

agent_count=$(supabase_query "agents?select=count" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
if [ -n "$agent_count" ] && [ "$agent_count" -gt 0 ]; then
  log_pass "Found $agent_count agent(s)"
else
  log_warn "No agents registered"
fi

# ============================================
# 4. Check Agent Self (if AGENT_ID set)
# ============================================
log_header "🤖 Agent Identity"

if [ -n "${AGENT_ID:-}" ]; then
  agent_data=$(supabase_query "agents?id=eq.${AGENT_ID}&select=id,display_name,is_active" 2>/dev/null)
  if echo "$agent_data" | grep -q "\"id\":\"${AGENT_ID}\""; then
    is_active=$(echo "$agent_data" | grep -o '"is_active":[^,}]*' | cut -d: -f2)
    if [ "$is_active" = "true" ]; then
      log_pass "Agent '${AGENT_ID}' registered and active"
    else
      log_warn "Agent '${AGENT_ID}' registered but inactive"
    fi
  else
    log_fail "Agent '${AGENT_ID}' not found in registry"
  fi
else
  log_warn "AGENT_ID not set - cannot verify agent registration"
fi

# ============================================
# 5. Check API Connectivity
# ============================================
log_header "🌐 API Connectivity"

# Test REST API
rest_test=$(curl -s -o /dev/null -w "%{http_code}" "${MC_SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${MC_SERVICE_KEY}" 2>/dev/null)
if [ "$rest_test" = "200" ]; then
  log_pass "REST API accessible"
else
  log_fail "REST API returned HTTP $rest_test"
fi

# Test Auth API (optional check)
auth_test=$(curl -s -o /dev/null -w "%{http_code}" "${MC_SUPABASE_URL}/auth/v1/settings" 2>/dev/null)
if [ "$auth_test" = "200" ]; then
  log_pass "Auth API accessible"
else
  log_warn "Auth API returned HTTP $auth_test (may be expected)"
fi

# ============================================
# 6. Check Message Flow (optional - needs agent)
# ============================================
log_header "📬 Message Flow"

if [ -n "${AGENT_ID:-}" ]; then
  # Check for unread messages
  unread_msgs=$(supabase_query "agent_messages?to_agent=eq.${AGENT_ID}&read=eq.false&select=count" 2>/dev/null)
  unread_count=$(echo "$unread_msgs" | grep -o '"count":[0-9]*' | cut -d: -f2 2>/dev/null || echo "0")
  if [ -n "$unread_count" ]; then
    log_pass "Message inbox accessible ($unread_count unread)"
  else
    log_warn "Could not check message inbox"
  fi
else
  log_warn "Skipping message flow check (AGENT_ID not set)"
fi

# ============================================
# 7. Check notify_channel (Discord notifications)
# ============================================
log_header "🔔 Notifications"

# Get first project's notify_channel
notify_check=$(supabase_query "projects?select=settings->notify_channel&limit=1" 2>/dev/null)
if echo "$notify_check" | grep -q '"notify_channel"'; then
  log_pass "notify_channel field accessible in project settings"
else
  log_warn "Could not verify notify_channel (may be null)"
fi

# ============================================
# Summary
# ============================================
$JSON_OUTPUT || echo -e "\n${BOLD}═══════════════════════════════${NC}"

TOTAL=$((${#PASSED[@]} + ${#FAILED[@]}))
PASS_COUNT=${#PASSED[@]}
FAIL_COUNT=${#FAILED[@]}
WARN_COUNT=${#WARNINGS[@]}

if $JSON_OUTPUT; then
  # Helper to format array as JSON
  format_json_array() {
    local arr=("$@")
    if [ ${#arr[@]} -eq 0 ]; then
      echo "[]"
    else
      printf '['
      for i in "${!arr[@]}"; do
        [ $i -gt 0 ] && printf ','
        printf '"%s"' "${arr[$i]}"
      done
      printf ']'
    fi
  }
  
  echo "{"
  echo "  \"passed\": $PASS_COUNT,"
  echo "  \"failed\": $FAIL_COUNT,"
  echo "  \"warnings\": $WARN_COUNT,"
  echo "  \"total\": $TOTAL,"
  echo "  \"status\": \"$([ $FAIL_COUNT -eq 0 ] && echo 'healthy' || echo 'degraded')\","
  echo "  \"checks\": {"
  echo "    \"passed\": $(format_json_array "${PASSED[@]}"),"
  echo -n '    "failed": '; [ ${#FAILED[@]} -gt 0 ] && format_json_array "${FAILED[@]}" || echo -n '[]'; echo ','
  echo -n '    "warnings": '; [ ${#WARNINGS[@]} -gt 0 ] && format_json_array "${WARNINGS[@]}" || echo -n '[]'; echo ''
  echo "  }"
  echo "}"
else
  echo -e "${BOLD}Summary:${NC}"
  echo -e "  ${GREEN}✓ Passed:${NC}   $PASS_COUNT"
  echo -e "  ${RED}✗ Failed:${NC}   $FAIL_COUNT"
  echo -e "  ${YELLOW}⚠ Warnings:${NC} $WARN_COUNT"
  echo ""
  
  if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ Mission Control is healthy!${NC}"
    exit 0
  else
    echo -e "${RED}${BOLD}✗ Mission Control has issues${NC}"
    echo -e "Run with --verbose for details"
    exit 1
  fi
fi
