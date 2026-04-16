#!/usr/bin/env bash
# shellcheck shell=bash
# =============================================================================
# OpenClaw E2E Validation Script
# Tests every API step for every host target (16 targets × 9 steps).
#
# Usage:
#   ./scripts/e2e-validate.sh [OPTIONS]
#
# Options:
#   --host <target|all>      Host target(s) to test (default: all)
#   --step <step|all>        Step(s) to test (default: all)
#   --api-url <url>          API base URL (default: http://localhost:5000)
#   --passphrase <pass>      Owner passphrase for authenticated endpoints
#   --verbose                Print full curl response bodies on failure
#   --json-output            Also write JSON report to /tmp/e2e-report-<ts>.json
#   --timeout <seconds>      Per-request timeout in seconds (default: 10)
#   --help                   Show this help and exit
#
# Exit codes:
#   0  All tests passed
#   1  One or more tests failed
# =============================================================================
set -euo pipefail

# ── Constants ────────────────────────────────────────────────────────────────
readonly ALL_HOSTS=(
  macos
  digitalocean
  aws-ec2
  google-cloud
  azure-vm
  generic-vps
  railway
  render
  fly-io
  hetzner
  oracle-cloud
  ovhcloud
  tencent
  alibaba
  vultr
  kamatera
)

readonly ALL_STEPS=(
  prerequisites
  preflight
  install
  rollback
  hardening
  health
  state
  deploy-smoke
  audit-chain
)

# ── Colour codes (suppressed if not a tty) ───────────────────────────────────
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BOLD=''
  CYAN=''
  RESET=''
fi

# ── Defaults ─────────────────────────────────────────────────────────────────
API_URL="http://localhost:5000"
PASSPHRASE=""
VERBOSE=false
JSON_OUTPUT=false
REQUEST_TIMEOUT=10
SELECTED_HOSTS=("${ALL_HOSTS[@]}")
SELECTED_STEPS=("${ALL_STEPS[@]}")

# ── Result tracking ───────────────────────────────────────────────────────────
declare -A RESULTS          # RESULTS[host:step] = pass|warn|fail
declare -A RESULT_MESSAGES  # RESULT_MESSAGES[host:step] = detail message
TOTAL_PASS=0
TOTAL_WARN=0
TOTAL_FAIL=0

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REPORT_PATH="/tmp/e2e-report-${TIMESTAMP}.json"

# ── Helpers ───────────────────────────────────────────────────────────────────

log_info() {
  echo -e "${CYAN}[INFO]${RESET} $*"
}

log_pass() {
  echo -e "  ${GREEN}[PASS]${RESET} $*"
}

log_warn() {
  echo -e "  ${YELLOW}[WARN]${RESET} $*"
}

log_fail() {
  echo -e "  ${RED}[FAIL]${RESET} $*"
}

usage() {
  grep '^#' "$0" | grep -v '^#!/' | sed 's/^# \{0,1\}//'
  exit 0
}

# Safely check if a value exists in an array
array_contains() {
  local needle="$1"
  shift
  local elem
  for elem in "$@"; do
    if [[ "$elem" == "$needle" ]]; then
      return 0
    fi
  done
  return 1
}

# ── curl wrapper ──────────────────────────────────────────────────────────────
# Runs a curl request; outputs HTTP status code on stdout and body to a tmpfile.
# Returns the HTTP status code in CURL_STATUS, body in CURL_BODY.
CURL_STATUS=""
CURL_BODY=""

do_curl() {
  # Usage: do_curl <method> <url> [extra curl args...]
  local method="$1"
  local url="$2"
  shift 2

  local tmpfile
  tmpfile="$(mktemp)"

  local http_code
  # shellcheck disable=SC2086
  http_code="$(
    curl \
      --silent \
      --max-time "${REQUEST_TIMEOUT}" \
      --write-out '%{http_code}' \
      --output "${tmpfile}" \
      --request "${method}" \
      "$@" \
      "${url}" 2>/dev/null
  )" || http_code="000"

  CURL_STATUS="${http_code}"
  CURL_BODY="$(cat "${tmpfile}")"
  rm -f "${tmpfile}"
}

# Check if CURL_BODY is valid JSON
is_json() {
  echo "${CURL_BODY}" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null
}

# Extract a JSON field value (top-level only)
json_field() {
  local field="$1"
  echo "${CURL_BODY}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    v = d.get('${field}', '')
    print(v if isinstance(v, str) else json.dumps(v))
except Exception:
    print('')
" 2>/dev/null || true
}

# ── Record a result ───────────────────────────────────────────────────────────
record() {
  local host="$1"
  local step="$2"
  local status="$3"   # pass | warn | fail
  local message="$4"

  RESULTS["${host}:${step}"]="${status}"
  RESULT_MESSAGES["${host}:${step}"]="${message}"

  case "${status}" in
    pass) TOTAL_PASS=$((TOTAL_PASS + 1)); log_pass "${step}: ${message}" ;;
    warn) TOTAL_WARN=$((TOTAL_WARN + 1)); log_warn "${step}: ${message}" ;;
    fail) TOTAL_FAIL=$((TOTAL_FAIL + 1)); log_fail "${step}: ${message}" ;;
  esac

  if [[ "${VERBOSE}" == "true" && "${status}" != "pass" ]]; then
    echo -e "         Response body: ${CURL_BODY}"
  fi
}

# ── Individual step validators ────────────────────────────────────────────────

validate_prerequisites() {
  local host="$1"
  do_curl GET "${API_URL}/api/hosts"

  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" prerequisites fail "GET /api/hosts returned HTTP ${CURL_STATUS}"
    return
  fi
  if ! is_json; then
    record "${host}" prerequisites fail "GET /api/hosts returned non-JSON body"
    return
  fi
  # Verify the host appears in the array
  local found
  found="$(echo "${CURL_BODY}" | python3 -c "
import sys, json
try:
    hosts = json.load(sys.stdin)
    ids = [h.get('id','') for h in hosts if isinstance(h, dict)]
    print('yes' if '${host}' in ids else 'no')
except Exception:
    print('no')
" 2>/dev/null || echo "no")"

  if [[ "${found}" == "yes" ]]; then
    record "${host}" prerequisites pass "Host config present in /api/hosts"
  else
    record "${host}" prerequisites warn "Host config for '${host}' not found in /api/hosts (may not be registered yet)"
  fi
}

validate_preflight() {
  local host="$1"
  do_curl GET "${API_URL}/api/scripts/preflight/${host}"

  if [[ "${CURL_STATUS}" == "400" ]]; then
    record "${host}" preflight warn "Host target not yet registered server-side (HTTP 400)"
    return
  fi
  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" preflight fail "GET /api/scripts/preflight/${host} returned HTTP ${CURL_STATUS}"
    return
  fi
  if ! is_json; then
    record "${host}" preflight fail "Response is not valid JSON"
    return
  fi
  local script
  script="$(json_field script)"
  if [[ -z "${script}" ]]; then
    record "${host}" preflight fail "JSON response missing 'script' field"
    return
  fi
  if [[ "${#script}" -lt 20 ]]; then
    record "${host}" preflight warn "Script content suspiciously short (${#script} chars)"
    return
  fi
  record "${host}" preflight pass "Valid preflight script returned (${#script} chars)"
}

validate_install() {
  local host="$1"
  do_curl GET "${API_URL}/api/scripts/install/${host}"

  if [[ "${CURL_STATUS}" == "400" ]]; then
    record "${host}" install warn "Host target not yet registered server-side (HTTP 400)"
    return
  fi
  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" install fail "GET /api/scripts/install/${host} returned HTTP ${CURL_STATUS}"
    return
  fi
  if ! is_json; then
    record "${host}" install fail "Response is not valid JSON"
    return
  fi
  local script
  script="$(json_field script)"
  if [[ -z "${script}" ]]; then
    record "${host}" install fail "JSON response missing 'script' field"
    return
  fi
  if [[ "${#script}" -lt 20 ]]; then
    record "${host}" install warn "Script content suspiciously short (${#script} chars)"
    return
  fi
  record "${host}" install pass "Valid install script returned (${#script} chars)"
}

validate_rollback() {
  local host="$1"
  do_curl GET "${API_URL}/api/scripts/rollback/${host}"

  if [[ "${CURL_STATUS}" == "400" ]]; then
    record "${host}" rollback warn "Host target not yet registered server-side (HTTP 400)"
    return
  fi
  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" rollback fail "GET /api/scripts/rollback/${host} returned HTTP ${CURL_STATUS}"
    return
  fi
  if ! is_json; then
    record "${host}" rollback fail "Response is not valid JSON"
    return
  fi
  local script
  script="$(json_field script)"
  if [[ -z "${script}" ]]; then
    record "${host}" rollback fail "JSON response missing 'script' field"
    return
  fi
  if [[ "${#script}" -lt 20 ]]; then
    record "${host}" rollback warn "Script content suspiciously short (${#script} chars)"
    return
  fi
  record "${host}" rollback pass "Valid rollback script returned (${#script} chars)"
}

validate_hardening() {
  local host="$1"
  do_curl GET "${API_URL}/api/hardening/${host}"

  if [[ "${CURL_STATUS}" == "400" ]]; then
    record "${host}" hardening warn "Host target not yet registered server-side (HTTP 400)"
    return
  fi
  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" hardening fail "GET /api/hardening/${host} returned HTTP ${CURL_STATUS}"
    return
  fi
  if ! is_json; then
    record "${host}" hardening fail "Response is not valid JSON"
    return
  fi
  local count
  count="$(echo "${CURL_BODY}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(len(d) if isinstance(d, list) else -1)
except Exception:
    print(-1)
" 2>/dev/null || echo "-1")"

  if [[ "${count}" == "-1" ]]; then
    record "${host}" hardening fail "Response is not a JSON array"
    return
  fi
  if [[ "${count}" -eq 0 ]]; then
    record "${host}" hardening warn "Hardening checks array is empty"
    return
  fi
  record "${host}" hardening pass "${count} hardening check(s) returned"
}

validate_health() {
  local host="$1"
  do_curl GET "${API_URL}/health"

  if [[ "${CURL_STATUS}" == "000" ]]; then
    record "${host}" health fail "Server unreachable (connection refused or timeout)"
    return
  fi
  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" health fail "GET /health returned HTTP ${CURL_STATUS}"
    return
  fi
  if ! is_json; then
    record "${host}" health fail "Response is not valid JSON"
    return
  fi
  local status_val
  status_val="$(json_field status)"
  if [[ "${status_val}" != "ok" ]]; then
    record "${host}" health warn "Health status is '${status_val}' (expected 'ok')"
    return
  fi
  record "${host}" health pass "Health check OK"
}

validate_state() {
  local host="$1"
  do_curl GET "${API_URL}/api/state"

  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" state fail "GET /api/state returned HTTP ${CURL_STATUS}"
    return
  fi
  if ! is_json; then
    record "${host}" state fail "Response is not valid JSON"
    return
  fi
  # State should be an object (dict) — check for basic fields
  local has_id
  has_id="$(echo "${CURL_BODY}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('yes' if isinstance(d, dict) and 'id' in d else 'no')
except Exception:
    print('no')
" 2>/dev/null || echo "no")"

  if [[ "${has_id}" != "yes" ]]; then
    record "${host}" state warn "State response is valid JSON but missing expected 'id' field"
    return
  fi
  record "${host}" state pass "State object returned with 'id' field"
}

validate_deploy_smoke() {
  local host="$1"
  if [[ -z "${PASSPHRASE}" ]]; then
    record "${host}" deploy-smoke warn "Skipped — no --passphrase provided (required for POST /api/deploy/execute)"
    return
  fi

  # POST with a smoke payload; we read SSE until [DONE] or error
  local tmpfile
  tmpfile="$(mktemp)"

  local http_code
  http_code="$(
    curl \
      --silent \
      --max-time 30 \
      --write-out '%{http_code}' \
      --output "${tmpfile}" \
      --request POST \
      --header "Content-Type: application/json" \
      --header "x-owner-passphrase: ${PASSPHRASE}" \
      --data '{"bundleId":"smoke-test","hostTarget":"'"${host}"'","inputs":{},"confirm":false}' \
      "${API_URL}/api/deploy/execute" 2>/dev/null
  )" || http_code="000"

  CURL_STATUS="${http_code}"
  CURL_BODY="$(cat "${tmpfile}")"
  rm -f "${tmpfile}"

  if [[ "${CURL_STATUS}" == "401" ]]; then
    record "${host}" deploy-smoke warn "Unauthorized — passphrase may be incorrect"
    return
  fi
  if [[ "${CURL_STATUS}" == "400" ]]; then
    record "${host}" deploy-smoke warn "Bad request — host target '${host}' may not be registered server-side"
    return
  fi
  if [[ "${CURL_STATUS}" == "000" ]]; then
    record "${host}" deploy-smoke fail "Server unreachable or request timed out"
    return
  fi
  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" deploy-smoke fail "POST /api/deploy/execute returned HTTP ${CURL_STATUS}"
    return
  fi

  # SSE body: look for at least one "data:" line and a final [DONE]
  if echo "${CURL_BODY}" | grep -q '"stage"'; then
    if echo "${CURL_BODY}" | grep -q '\[DONE\]'; then
      record "${host}" deploy-smoke pass "Deploy smoke pipeline completed (SSE stream received [DONE])"
    else
      record "${host}" deploy-smoke warn "SSE stream started but [DONE] sentinel not received"
    fi
  else
    record "${host}" deploy-smoke fail "No SSE stage events found in response body"
  fi
}

validate_audit_chain() {
  local host="$1"
  if [[ -z "${PASSPHRASE}" ]]; then
    record "${host}" audit-chain warn "Skipped — no --passphrase provided (required for GET /api/audit/verify)"
    return
  fi

  do_curl GET "${API_URL}/api/audit/verify" \
    --header "x-owner-passphrase: ${PASSPHRASE}"

  if [[ "${CURL_STATUS}" == "401" ]]; then
    record "${host}" audit-chain warn "Unauthorized — passphrase may be incorrect"
    return
  fi
  if [[ "${CURL_STATUS}" != "200" ]]; then
    record "${host}" audit-chain fail "GET /api/audit/verify returned HTTP ${CURL_STATUS}"
    return
  fi
  if ! is_json; then
    record "${host}" audit-chain fail "Response is not valid JSON"
    return
  fi

  # Expect { valid: bool, ... }
  local valid_val
  valid_val="$(echo "${CURL_BODY}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('true' if d.get('valid') is True else 'false')
except Exception:
    print('unknown')
" 2>/dev/null || echo "unknown")"

  if [[ "${valid_val}" == "true" ]]; then
    record "${host}" audit-chain pass "Audit hash chain verified (valid=true)"
  elif [[ "${valid_val}" == "false" ]]; then
    record "${host}" audit-chain fail "Audit chain integrity check FAILED (valid=false)"
  else
    record "${host}" audit-chain warn "Could not determine chain validity from response"
  fi
}

# ── Run a single step for a single host ──────────────────────────────────────
run_step() {
  local host="$1"
  local step="$2"

  case "${step}" in
    prerequisites) validate_prerequisites "${host}" ;;
    preflight)     validate_preflight     "${host}" ;;
    install)       validate_install       "${host}" ;;
    rollback)      validate_rollback      "${host}" ;;
    hardening)     validate_hardening     "${host}" ;;
    health)        validate_health        "${host}" ;;
    state)         validate_state         "${host}" ;;
    deploy-smoke)  validate_deploy_smoke  "${host}" ;;
    audit-chain)   validate_audit_chain   "${host}" ;;
    *)
      log_fail "Unknown step: ${step}"
      ;;
  esac
}

# ── JSON report generator ─────────────────────────────────────────────────────
# Writes results to a JSON file using only bash string manipulation.
write_json_report() {
  local path="$1"

  # Build hosts object: { "host": { "step": "status", ... }, ... }
  # Collect unique hosts from RESULTS keys
  local hosts_json="{"
  local first_host=true
  for host in "${SELECTED_HOSTS[@]}"; do
    local steps_json="{"
    local first_step=true
    for step in "${SELECTED_STEPS[@]}"; do
      local key="${host}:${step}"
      local status="${RESULTS[${key}]:-skip}"
      local msg="${RESULT_MESSAGES[${key}]:-}"
      # Escape backslashes then double-quotes in message
      msg="${msg//\\/\\\\}"
      msg="${msg//"/\\"}"
      if [[ "${first_step}" == "true" ]]; then
        first_step=false
      else
        steps_json+=","
      fi
      steps_json+="\"${step}\":{\"status\":\"${status}\",\"message\":\"${msg}\"}"
    done
    steps_json+="}"
    if [[ "${first_host}" == "true" ]]; then
      first_host=false
    else
      hosts_json+=","
    fi
    hosts_json+="\"${host}\":${steps_json}"
  done
  hosts_json+="}"

  local overall="pass"
  if [[ "${TOTAL_FAIL}" -gt 0 ]]; then
    overall="fail"
  elif [[ "${TOTAL_WARN}" -gt 0 ]]; then
    overall="warn"
  fi

  cat > "${path}" <<JSONEOF
{
  "generated_at": "${TIMESTAMP}",
  "api_url": "${API_URL}",
  "summary": {
    "total_pass": ${TOTAL_PASS},
    "total_warn": ${TOTAL_WARN},
    "total_fail": ${TOTAL_FAIL},
    "overall": "${overall}"
  },
  "results": ${hosts_json}
}
JSONEOF
  echo "Report written to ${path}"
}

# ── Argument parsing ─────────────────────────────────────────────────────────
parse_args() {
  local host_arg=""
  local step_arg=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --host)
        host_arg="${2:-}"
        shift 2
        ;;
      --step)
        step_arg="${2:-}"
        shift 2
        ;;
      --api-url)
        API_URL="${2:-}"
        shift 2
        ;;
      --passphrase)
        PASSPHRASE="${2:-}"
        shift 2
        ;;
      --timeout)
        REQUEST_TIMEOUT="${2:-10}"
        shift 2
        ;;
      --verbose)
        VERBOSE=true
        shift
        ;;
      --json-output)
        JSON_OUTPUT=true
        shift
        ;;
      --help|-h)
        usage
        ;;
      *)
        echo "Unknown argument: $1" >&2
        exit 1
        ;;
    esac
  done

  # Resolve host selection
  if [[ -n "${host_arg}" && "${host_arg}" != "all" ]]; then
    if ! array_contains "${host_arg}" "${ALL_HOSTS[@]}"; then
      echo "ERROR: Unknown host target '${host_arg}'." >&2
      echo "Valid targets: ${ALL_HOSTS[*]}" >&2
      exit 1
    fi
    SELECTED_HOSTS=("${host_arg}")
  fi

  # Resolve step selection
  if [[ -n "${step_arg}" && "${step_arg}" != "all" ]]; then
    if ! array_contains "${step_arg}" "${ALL_STEPS[@]}"; then
      echo "ERROR: Unknown step '${step_arg}'." >&2
      echo "Valid steps: ${ALL_STEPS[*]}" >&2
      exit 1
    fi
    SELECTED_STEPS=("${step_arg}")
  fi
}

# ── Print summary table ───────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${RESET}"
  echo -e "${BOLD}  E2E Validation Summary — ${TIMESTAMP}${RESET}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${RESET}"
  printf "  ${BOLD}%-20s${RESET}" "HOST"
  for step in "${SELECTED_STEPS[@]}"; do
    printf " %-12s" "${step}"
  done
  echo ""
  echo "  ────────────────────────────────────────────────────────────"

  for host in "${SELECTED_HOSTS[@]}"; do
    printf "  %-20s" "${host}"
    for step in "${SELECTED_STEPS[@]}"; do
      local key="${host}:${step}"
      local status="${RESULTS[${key}]:-skip}"
      case "${status}" in
        pass) printf " ${GREEN}%-12s${RESET}" "PASS" ;;
        warn) printf " ${YELLOW}%-12s${RESET}" "WARN" ;;
        fail) printf " ${RED}%-12s${RESET}" "FAIL" ;;
        skip) printf " %-12s" "----" ;;
      esac
    done
    echo ""
  done

  echo "  ────────────────────────────────────────────────────────────"
  echo -e "  ${GREEN}PASS: ${TOTAL_PASS}${RESET}  ${YELLOW}WARN: ${TOTAL_WARN}${RESET}  ${RED}FAIL: ${TOTAL_FAIL}${RESET}"
  echo ""

  if [[ "${TOTAL_FAIL}" -gt 0 ]]; then
    echo -e "  ${RED}${BOLD}RESULT: FAILED${RESET}"
  elif [[ "${TOTAL_WARN}" -gt 0 ]]; then
    echo -e "  ${YELLOW}${BOLD}RESULT: PASSED WITH WARNINGS${RESET}"
  else
    echo -e "  ${GREEN}${BOLD}RESULT: ALL PASSED${RESET}"
  fi
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${RESET}"
  echo ""
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  parse_args "$@"

  echo ""
  echo -e "${BOLD}OpenClaw E2E Validation${RESET}"
  echo -e "API URL : ${CYAN}${API_URL}${RESET}"
  echo -e "Hosts   : ${#SELECTED_HOSTS[@]} target(s)"
  echo -e "Steps   : ${#SELECTED_STEPS[@]} step(s)"
  echo -e "Timeout : ${REQUEST_TIMEOUT}s per request"
  if [[ -n "${PASSPHRASE}" ]]; then
    echo -e "Auth    : passphrase provided"
  else
    echo -e "Auth    : ${YELLOW}no passphrase — authenticated steps will be skipped${RESET}"
  fi
  echo ""

  # Verify server is reachable before running full suite
  log_info "Checking server reachability..."
  do_curl GET "${API_URL}/health" || true
  if [[ "${CURL_STATUS}" == "000" ]]; then
    echo -e "${RED}ERROR: Cannot reach API at ${API_URL} — is the server running?${RESET}" >&2
    exit 1
  fi
  log_info "Server is reachable (HTTP ${CURL_STATUS})"
  echo ""

  for host in "${SELECTED_HOSTS[@]}"; do
    echo -e "${BOLD}── ${CYAN}${host}${RESET}${BOLD} ────────────────────────────────────────────${RESET}"
    for step in "${SELECTED_STEPS[@]}"; do
      run_step "${host}" "${step}"
    done
    echo ""
  done

  print_summary

  if [[ "${JSON_OUTPUT}" == "true" ]]; then
    write_json_report "${REPORT_PATH}"
    echo -e "JSON report: ${CYAN}${REPORT_PATH}${RESET}"
    echo ""
  fi

  if [[ "${TOTAL_FAIL}" -gt 0 ]]; then
    exit 1
  fi
  exit 0
}

main "$@"
