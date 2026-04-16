#!/usr/bin/env bash
# OpenClaw Canary Token System — AiGovOps Foundation
#
# Generates and verifies SHA-256 checksums of critical project files.
# Modes:
#   --init    Generate a fresh baseline manifest (.canary-manifest.json)
#   --verify  Compare current checksums against the baseline manifest
#   --update  Show diffs of changed files then update the manifest
#
# Usage:
#   ./scripts/canary-check.sh --init
#   ./scripts/canary-check.sh --verify
#   ./scripts/canary-check.sh --update
#
# License: CC BY-NC 4.0 — AiGovOps Foundation
# Co-founders: Ken Johnston & Bob Rapp

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MANIFEST_FILE="${REPO_ROOT}/.canary-manifest.json"

# Critical files to monitor (relative to repo root)
CRITICAL_FILES=(
  "LICENSE"
  "NOTICE"
  "GOVERNANCE.md"
  "CODEOWNERS"
  ".github/workflows/backup.yml"
  ".github/workflows/ci.yml"
  ".github/workflows/codeql.yml"
  ".github/workflows/critical-file-monitor.yml"
  ".github/workflows/dependency-review.yml"
  ".github/workflows/deploy-hetzner.yml"
  ".github/workflows/deploy-pages.yml"
  ".github/workflows/deploy-validate.yml"
  ".github/workflows/deploy-vultr.yml"
  ".github/workflows/e2e-validate.yml"
  ".github/workflows/preflight.yml"
  ".github/workflows/release-signing.yml"
  ".github/workflows/release.yml"
  "package.json"
  "server/routes.ts"
  "shared/schema.ts"
)

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()    { printf "${CYAN}[INFO]${RESET}  %s\n" "$1"; }
warn()    { printf "${YELLOW}[WARN]${RESET}  %s\n" "$1"; }
success() { printf "${GREEN}[OK]${RESET}    %s\n" "$1"; }
error()   { printf "${RED}[ERROR]${RESET} %s\n" "$1" >&2; }

# Compute SHA-256 of a file, output only the hash
sha256_of() {
  local filepath="$1"
  if command -v sha256sum &>/dev/null; then
    sha256sum "${filepath}" | awk '{print $1}'
  elif command -v shasum &>/dev/null; then
    shasum -a 256 "${filepath}" | awk '{print $1}'
  else
    error "No sha256sum or shasum found — cannot compute checksums."
    exit 1
  fi
}

# Escape a string for JSON (basic: backslash and double-quote only)
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  printf '%s' "${s}"
}

# ---------------------------------------------------------------------------
# Build a manifest JSON string from current files
# ---------------------------------------------------------------------------
build_manifest() {
  local timestamp
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  local hostname
  hostname="$(hostname)"

  local entries=()
  local rel_path abs_path hash

  for rel_path in "${CRITICAL_FILES[@]}"; do
    abs_path="${REPO_ROOT}/${rel_path}"
    if [[ -f "${abs_path}" ]]; then
      hash="$(sha256_of "${abs_path}")"
      entries+=("  \"$(json_escape "${rel_path}")\": \"${hash}\"")
    else
      warn "File not found (skipped): ${rel_path}"
    fi
  done

  # Expand glob for any workflow files not listed above
  local wf_dir="${REPO_ROOT}/.github/workflows"
  if [[ -d "${wf_dir}" ]]; then
    while IFS= read -r -d '' wf_file; do
      rel_path="${wf_file#"${REPO_ROOT}/"}"
      # skip if already in CRITICAL_FILES
      local already=false
      for listed in "${CRITICAL_FILES[@]}"; do
        if [[ "${listed}" == "${rel_path}" ]]; then
          already=true
          break
        fi
      done
      if [[ "${already}" == false ]]; then
        hash="$(sha256_of "${wf_file}")"
        entries+=("  \"$(json_escape "${rel_path}")\": \"${hash}\"")
      fi
    done < <(find "${wf_dir}" -maxdepth 1 -name "*.yml" -print0 | sort -z)
  fi

  # Build JSON — join entries with comma+newline
  local body=""
  local i
  for (( i = 0; i < ${#entries[@]}; i++ )); do
    if (( i < ${#entries[@]} - 1 )); then
      body+="${entries[$i]},"$'\n'
    else
      body+="${entries[$i]}"$'\n'
    fi
  done

  printf '{\n  "_meta": {\n    "generated": "%s",\n    "host": "%s",\n    "tool": "openclaw-canary-check"\n  },\n  "checksums": {\n%s  }\n}\n' \
    "${timestamp}" "${hostname}" "${body}"
}

# ---------------------------------------------------------------------------
# --init mode
# ---------------------------------------------------------------------------
mode_init() {
  info "Generating canary baseline manifest..."
  local manifest
  manifest="$(build_manifest)"
  printf '%s\n' "${manifest}" > "${MANIFEST_FILE}"
  success "Manifest written to: ${MANIFEST_FILE}"
  info "Add '.canary-manifest.json' to .gitignore (or commit it for CI use)."
}

# ---------------------------------------------------------------------------
# --verify mode
# ---------------------------------------------------------------------------
mode_verify() {
  if [[ ! -f "${MANIFEST_FILE}" ]]; then
    error "No manifest found at ${MANIFEST_FILE}. Run --init first."
    exit 1
  fi

  info "Verifying canary checksums against manifest..."

  local tampered=0
  local ok=0
  local missing=0
  local rel_path abs_path stored_hash current_hash

  # Parse JSON manifest using only bash + grep/sed (no jq dependency)
  # Extract lines of the form: "key": "value"
  while IFS= read -r line; do
    # Match lines like:  "path/to/file": "hexhash"
    if [[ "${line}" =~ ^[[:space:]]*\"([^\"]+)\":[[:space:]]*\"([a-f0-9]{64})\"[[:space:]]*,?$ ]]; then
      rel_path="${BASH_REMATCH[1]}"
      stored_hash="${BASH_REMATCH[2]}"

      abs_path="${REPO_ROOT}/${rel_path}"

      if [[ ! -f "${abs_path}" ]]; then
        printf "${RED}[MISSING]${RESET} %s\n" "${rel_path}"
        (( missing++ )) || true
        (( tampered++ )) || true
        continue
      fi

      current_hash="$(sha256_of "${abs_path}")"

      if [[ "${current_hash}" == "${stored_hash}" ]]; then
        printf "${GREEN}[OK]${RESET}      %s\n" "${rel_path}"
        (( ok++ )) || true
      else
        printf "${RED}[TAMPERED]${RESET} %s\n" "${rel_path}"
        printf "           stored:  %s\n" "${stored_hash}"
        printf "           current: %s\n" "${current_hash}"
        (( tampered++ )) || true
      fi
    fi
  done < "${MANIFEST_FILE}"

  printf '\n'
  info "Results: ${ok} OK, ${tampered} TAMPERED/MISSING"

  if [[ "${tampered}" -gt 0 ]]; then
    printf "${RED}${BOLD}CANARY ALERT: %d file(s) tampered or missing.${RESET}\n" "${tampered}"
    return 1
  else
    printf "${GREEN}${BOLD}All monitored files match the baseline manifest.${RESET}\n"
    return 0
  fi
}

# ---------------------------------------------------------------------------
# --update mode
# ---------------------------------------------------------------------------
mode_update() {
  if [[ ! -f "${MANIFEST_FILE}" ]]; then
    warn "No existing manifest found. Running --init instead."
    mode_init
    return 0
  fi

  info "Checking for changes before updating manifest..."

  local changed=0
  local rel_path abs_path stored_hash current_hash

  while IFS= read -r line; do
    if [[ "${line}" =~ ^[[:space:]]*\"([^\"]+)\":[[:space:]]*\"([a-f0-9]{64})\"[[:space:]]*,?$ ]]; then
      rel_path="${BASH_REMATCH[1]}"
      stored_hash="${BASH_REMATCH[2]}"
      abs_path="${REPO_ROOT}/${rel_path}"

      if [[ ! -f "${abs_path}" ]]; then
        printf "${YELLOW}[REMOVED]${RESET} %s (no longer exists)\n" "${rel_path}"
        (( changed++ )) || true
        continue
      fi

      current_hash="$(sha256_of "${abs_path}")"
      if [[ "${current_hash}" != "${stored_hash}" ]]; then
        printf "${YELLOW}[CHANGED]${RESET} %s\n" "${rel_path}"
        if command -v diff &>/dev/null; then
          # Show a unified diff if possible (files may be binary, handle gracefully)
          diff <(echo "${stored_hash}  ${rel_path}") \
               <(echo "${current_hash}  ${rel_path}") || true
        fi
        (( changed++ )) || true
      fi
    fi
  done < "${MANIFEST_FILE}"

  if [[ "${changed}" -eq 0 ]]; then
    info "No changes detected. Manifest is already current."
    return 0
  fi

  printf '\n'
  warn "${changed} file(s) changed. Updating manifest..."
  mode_init
  success "Manifest updated."
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
usage() {
  cat <<EOF
Usage: ${0##*/} [--init | --verify | --update]

  --init    Generate a fresh baseline manifest (.canary-manifest.json)
  --verify  Compare current checksums against the baseline manifest
  --update  Show changed files, then update the manifest

Environment:
  REPO_ROOT override: set REPO_ROOT before calling this script.
EOF
}

main() {
  local mode="${1:-}"

  case "${mode}" in
    --init)   mode_init ;;
    --verify) mode_verify ;;
    --update) mode_update ;;
    --help|-h) usage ;;
    *)
      error "Unknown mode: '${mode}'"
      usage
      exit 1
      ;;
  esac
}

main "$@"
