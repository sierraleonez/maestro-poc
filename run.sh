#!/bin/bash
set -euo pipefail

TAGS="${1:-}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/evidence/${TIMESTAMP}"
REPORT_DIR="${SCRIPT_DIR}/report"
MAESTRO_ROOT="$SCRIPT_DIR"
mkdir -p "$OUTPUT_DIR" "$REPORT_DIR"

if [ -n "$TAGS" ]; then
  maestro test "$SCRIPT_DIR" -e ROOT_DIR="$MAESTRO_ROOT" --include-tags="$TAGS" --test-output-dir "$OUTPUT_DIR" --format html-detailed --output "$REPORT_DIR/report.html"
else
  maestro test "$SCRIPT_DIR" -e ROOT_DIR="$MAESTRO_ROOT" --test-output-dir "$OUTPUT_DIR" --format html-detailed --output "$REPORT_DIR/report.html"
fi
