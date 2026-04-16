#!/usr/bin/env bash
# OpenClaw Canary Token System — AiGovOps Foundation
#
# Runs canary verification and sends an alert via webhook or local log
# if tampering is detected.
#
# Suitable for cron use:
#   */30 * * * * /path/to/scripts/canary-webhook.sh
#
# Environment variables:
#   CANARY_WEBHOOK_URL   — If set, POST alert JSON to this URL (Slack, Teams,
#                          generic HTTP endpoint, etc.)
#   CANARY_MANIFEST_PATH — Override path to .canary-manifest.json
#   CANARY_LOG_DIR       — Override log directory (default: <repo>/logs)
#
# License: CC BY-NC 4.0 — AiGovOps Foundation
# Co-founders: Ken Johnston & Bob Rapp

set -euo pipefail

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CANARY_CHECK="${SCRIPT_DIR}/canary-check.sh"
LOG_DIR="${CANARY_LOG_DIR:-"${REPO_ROOT}/logs"}"
ALERT_LOG="${LOG_DIR}/canary-alerts.log"

# ---------------------------------------------------------------------------
# Sanity checks
# ---------------------------------------------------------------------------
if [[ ! -x "${CANARY_CHECK}" ]]; then
  printf '[ERROR] canary-check.sh not found or not executable: %s\n' "${CANARY_CHECK}" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Run verification, capture output and tampered files
# ---------------------------------------------------------------------------
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
HOSTNAME_VAL="$(hostname)"

VERIFY_OUTPUT=""
TAMPERED_FILES=()
VERIFY_EXIT=0

# Capture verify output line by line
while IFS= read -r line; do
  VERIFY_OUTPUT+="${line}"$'\n'
  # Collect tampered/missing file names
  if [[ "${line}" =~ \[TAMPERED\][[:space:]](.+)$ ]] || \
     [[ "${line}" =~ \[MISSING\][[:space:]](.+)$ ]]; then
    TAMPERED_FILES+=("${BASH_REMATCH[1]}")
  fi
done < <("${CANARY_CHECK}" --verify 2>&1 || true)

# Re-run to capture the real exit code
if ! "${CANARY_CHECK}" --verify &>/dev/null; then
  VERIFY_EXIT=1
fi

# ---------------------------------------------------------------------------
# If clean — exit quietly (cron-friendly)
# ---------------------------------------------------------------------------
if [[ "${VERIFY_EXIT}" -eq 0 ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
json_escape_str() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  printf '%s' "${s}"
}

build_tampered_json_array() {
  local arr=()
  local f
  for f in "${TAMPERED_FILES[@]}"; do
    arr+=("\"$(json_escape_str "${f}")\"")
  done
  local joined
  joined="$(IFS=','; echo "${arr[*]}")"
  printf '[%s]' "${joined}"
}

# ---------------------------------------------------------------------------
# Build alert payload
# ---------------------------------------------------------------------------
TAMPERED_COUNT="${#TAMPERED_FILES[@]}"
TAMPERED_ARRAY="$(build_tampered_json_array)"
ESCAPED_OUTPUT="$(json_escape_str "${VERIFY_OUTPUT}")"

ALERT_JSON="$(printf '{
  "alert": "CANARY_TAMPER_DETECTED",
  "timestamp": "%s",
  "hostname": "%s",
  "repo": "openclaw-installer",
  "project": "AiGovOps Foundation — OpenClaw Guided Install",
  "tampered_count": %d,
  "tampered_files": %s,
  "verify_output": "%s"
}' \
  "${TIMESTAMP}" \
  "${HOSTNAME_VAL}" \
  "${TAMPERED_COUNT}" \
  "${TAMPERED_ARRAY}" \
  "${ESCAPED_OUTPUT}")"

# ---------------------------------------------------------------------------
# Delivery: webhook or local log
# ---------------------------------------------------------------------------
WEBHOOK_URL="${CANARY_WEBHOOK_URL:-}"

if [[ -n "${WEBHOOK_URL}" ]]; then
  # Send to configured webhook
  if command -v curl &>/dev/null; then
    HTTP_STATUS="$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      --data "${ALERT_JSON}" \
      --max-time 15 \
      "${WEBHOOK_URL}" || echo "000")"

    if [[ "${HTTP_STATUS}" =~ ^2 ]]; then
      printf '[%s] Canary alert sent via webhook (HTTP %s). Tampered: %d file(s)\n' \
        "${TIMESTAMP}" "${HTTP_STATUS}" "${TAMPERED_COUNT}"
    else
      printf '[%s] Webhook delivery failed (HTTP %s). Falling back to local log.\n' \
        "${TIMESTAMP}" "${HTTP_STATUS}" >&2
      # Fall through to local log
      WEBHOOK_URL=""
    fi
  else
    printf '[%s] curl not available. Falling back to local log.\n' "${TIMESTAMP}" >&2
    WEBHOOK_URL=""
  fi
fi

if [[ -z "${WEBHOOK_URL}" ]]; then
  # Write to local alert log
  mkdir -p "${LOG_DIR}"
  {
    printf '=%.0s' {1..72}
    printf '\n'
    printf 'CANARY ALERT — %s\n' "${TIMESTAMP}"
    printf 'Host:         %s\n' "${HOSTNAME_VAL}"
    printf 'Repo:         openclaw-installer\n'
    printf 'Tampered:     %d file(s)\n' "${TAMPERED_COUNT}"
    local_f
    for local_f in "${TAMPERED_FILES[@]}"; do
      printf '  - %s\n' "${local_f}"
    done
    printf '\nFull verify output:\n'
    printf '%s\n' "${VERIFY_OUTPUT}"
    printf '=%.0s' {1..72}
    printf '\n'
  } >> "${ALERT_LOG}"

  printf '[%s] Canary alert written to: %s\n' "${TIMESTAMP}" "${ALERT_LOG}" >&2
fi

# Always exit 1 when tampering detected so cron can detect failures
exit 1
