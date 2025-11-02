#!/usr/bin/env bash
set -euo pipefail

# Simple evidence capture script
# Usage: bash scripts/capture-evidence.sh

ROOT_DIR=$(pwd)
EVIDENCE_DIR="$ROOT_DIR/evidence"

mkdir -p "$EVIDENCE_DIR"

echo "[1/5] Installing Playwright browsers..."
npx playwright install

echo "[2/5] Running Playwright tests (HTML report)..."
npx playwright test --reporter=html || true

if [ -d playwright-report ]; then
  echo "[3/5] Copying Playwright HTML report to evidence/playwright-report/"
  rm -rf "$EVIDENCE_DIR/playwright-report" || true
  cp -r playwright-report "$EVIDENCE_DIR/playwright-report"
else
  echo "No playwright-report found"
fi

echo "[4/5] Running unit tests (Vitest) and saving logs..."
# Use pnpm if available, otherwise fallback to npm
if command -v pnpm >/dev/null 2>&1; then
  pnpm test -- --reporter=dot 2>&1 | tee "$EVIDENCE_DIR/vitest.log" || true
else
  npm run test --silent 2>&1 | tee "$EVIDENCE_DIR/vitest.log" || true
fi

echo "[5/5] Capturing a basic HTTP timing for / (curl)..."
if command -v curl >/dev/null 2>&1; then
  curl -s -w 'time_total:%{time_total}\n' -o /dev/null http://localhost:3000 > "$EVIDENCE_DIR/perf-curl.txt" || echo "curl failed" > "$EVIDENCE_DIR/perf-curl.txt"
else
  echo "curl not available" > "$EVIDENCE_DIR/perf-curl.txt"
fi

echo "Evidence capture completed. See the 'evidence/' directory."
