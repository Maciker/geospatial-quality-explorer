#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "This directory is not a git repository. Run 'git init' first, then retry pnpm setup:hooks." >&2
  exit 1
fi

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push

echo "Git hooks installed from .githooks"
