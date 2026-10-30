#!/usr/bin/env bash
# Runs a command and, when it fails, repeats the last lines of its output as a
# GitHub Actions error annotation. Annotations can be read without signing in
# to GitHub, unlike the raw job logs.
#
#   bash scripts/yohaku/run-logged.sh <command> [args...]
set -o pipefail

log=$(mktemp)
"$@" 2>&1 | tee "$log"
status=${PIPESTATUS[0]}

if [ "$status" -ne 0 ]; then
  # Strip colour codes, keep the tail, and escape it for a workflow command.
  tail=$(tail -n 80 "$log" | perl -pe 's/\e\[[0-9;?]*[A-Za-z]//g' | tail -c 7000)
  tail=${tail//'%'/'%25'}
  tail=${tail//$'\r'/'%0D'}
  tail=${tail//$'\n'/'%0A'}
  echo "::error title=Command failed (last lines of output)::$tail"
fi
exit "$status"
