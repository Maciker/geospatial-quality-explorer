#!/usr/bin/env bash

set +e

mkdir -p _diagnostics
LOG="_diagnostics/guardrails-check-$(date +%Y%m%d-%H%M%S).log"

RUN_INSTALL="${RUN_INSTALL:-1}"
RUN_FULL="${RUN_FULL:-1}"
RUN_HOOKS="${RUN_HOOKS:-1}"
RUN_QA_STRICT="${RUN_QA_STRICT:-0}"

run() {
  echo "" | tee -a "$LOG"
  echo "### $*" | tee -a "$LOG"
  bash -lc "$*" 2>&1 | tee -a "$LOG"
  local code=${PIPESTATUS[0]}
  echo "EXIT_CODE=$code" | tee -a "$LOG"
}

section() {
  echo "" | tee -a "$LOG"
  echo "==============================" | tee -a "$LOG"
  echo "$1" | tee -a "$LOG"
  echo "==============================" | tee -a "$LOG"
}

has_script() {
  node -e "
    const fs = require('node:fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    process.exit(packageJson.scripts && packageJson.scripts['$1'] ? 0 : 1);
  " >/dev/null 2>&1
}

run_script() {
  local script="$1"
  shift

  if has_script "$script"; then
    run "pnpm $script $*"
  else
    echo "" | tee -a "$LOG"
    echo "### pnpm $script $*" | tee -a "$LOG"
    echo "SKIPPED: package.json has no script named '$script'" | tee -a "$LOG"
    echo "EXIT_CODE=0" | tee -a "$LOG"
  fi
}

echo "Guardrails diagnostic run" | tee "$LOG"
echo "Started at: $(date)" | tee -a "$LOG"
echo "Working directory: $(pwd)" | tee -a "$LOG"

section "ENVIRONMENT"
run "node --version"
run "pnpm --version"
run "git --version"
run "pwd"
run "ls -la"

section "INSTALL"
if [ "$RUN_INSTALL" = "1" ]; then
  run "pnpm install"
else
  echo "Skipping pnpm install because RUN_INSTALL=$RUN_INSTALL" | tee -a "$LOG"
fi

section "VENDOR / CODEX / DOGFOOD"
run_script "ai:sync"
run_script "vendors:check"
run_script "codex:check"
run_script "codex:skills:budget"
run_script "dogfood:check"
run_script "doctor"
run_script "quality:vendor"
run_script "quality:codex"
run_script "quality:stabilization"

section "TYPESCRIPT BASIC CHECKS"
run_script "build"
run_script "typecheck"
run_script "lint"
run_script "test"
run_script "coverage"

section "ARCHITECTURE / QUALITY TOOLS"
run_script "arch"
run_script "deadcode"
run_script "dup"
run_script "lint:json"
run_script "arch:json"

section "QUALITY RUNNER / RATCHET"
run_script "quality:collect"
run_script "quality:status"
run_script "quality:ratchet"

section "QUALITY GATES"
run_script "quality:fast"

if [ "$RUN_FULL" = "1" ]; then
  run_script "quality:full"
  run_script "quality:ci"
  run_script "validate"
else
  echo "Skipping full quality gates because RUN_FULL=$RUN_FULL" | tee -a "$LOG"
fi

section "QA CROSS-MODEL"
run_script "qa:prepare" "-- --base origin/main --head HEAD"
run_script "qa:gate" "-- --optional"

if [ "$RUN_QA_STRICT" = "1" ]; then
  if [ -f ".ai/workspace/qa/outputs/qa-review.json" ]; then
    run_script "qa:validate"
    run_script "qa:parse"
    run_script "qa:gate"
  else
    echo "Skipping strict QA because .ai/workspace/qa/outputs/qa-review.json does not exist." | tee -a "$LOG"
  fi
else
  echo "Skipping strict QA because RUN_QA_STRICT=$RUN_QA_STRICT" | tee -a "$LOG"
fi

section "HOOKS"
if [ "$RUN_HOOKS" = "1" ]; then
  if [ -d ".git" ]; then
    run_script "setup:hooks"
    run "git config core.hooksPath"
    run "ls -la .githooks"
  else
    echo "Skipping pnpm setup:hooks because this directory is not a git repository." | tee -a "$LOG"
    echo "Run 'git init' first if you want to test hooks." | tee -a "$LOG"
  fi
else
  echo "Skipping hooks because RUN_HOOKS=$RUN_HOOKS" | tee -a "$LOG"
fi

section "SUMMARY"
echo "Commands with non-zero exit code:" | tee -a "$LOG"

awk '
  /^### / {
    command=$0
  }
  /^EXIT_CODE=/ {
    if ($0 != "EXIT_CODE=0") {
      print command
      print $0
      print ""
    }
  }
' "$LOG" | tee -a "$LOG"

echo "" | tee -a "$LOG"
echo "Finished at: $(date)" | tee -a "$LOG"
echo "Log generated at: $LOG" | tee -a "$LOG"
