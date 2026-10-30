#!/usr/bin/env bash
# Spike S3: starts a Linux build of Yohaku on a virtual X display, waits, takes a
# screenshot and reports, as GitHub annotations, whether a Yohaku window came up
# and stayed up. Needs Xvfb, ImageMagick and x11-utils.
#
#   bash scripts/yohaku/smoke-linux.sh <command> [args...]
#
# Writes screenshot.png, windows.txt and app.log to $SMOKE_OUT (default: smoke).
set -uo pipefail

out=${SMOKE_OUT:-smoke}
wait_seconds=${SMOKE_WAIT:-45}
label=${SMOKE_LABEL:-Linux smoke test}
mkdir -p "$out"

Xvfb :99 -screen 0 1280x800x24 -nolisten tcp > "$out/xvfb.log" 2>&1 &
xvfb_pid=$!
export DISPLAY=:99
sleep 2

# A session of its own, so the browser processes CEF starts go down with it.
setsid "$@" > "$out/app.log" 2>&1 &
app_pid=$!

status=running
for _ in $(seq "$wait_seconds"); do
  sleep 1
  if ! kill -0 "$app_pid" 2>/dev/null; then
    status=exited
    break
  fi
done

xwininfo -root -tree > "$out/windows.txt" 2>&1 || true
import -window root "$out/screenshot.png" 2>> "$out/xvfb.log" || true
spread=$(convert "$out/screenshot.png" -colorspace gray -format '%[fx:standard_deviation]' info: \
  2> /dev/null || echo 0)

kill -- "-$app_pid" 2> /dev/null
sleep 2
kill -9 -- "-$app_pid" 2> /dev/null
kill "$xvfb_pid" 2> /dev/null

tail_of_log() {
  tail -n 40 "$out/app.log" | perl -pe 's/\e\[[0-9;?]*[A-Za-z]//g; s/%/%25/g; s/\r/%0D/g; s/\n/%0A/g'
}

if [ "$status" = exited ]; then
  wait "$app_pid"
  echo "::error title=$label::Yohaku exited within ${wait_seconds}s (code $?). Last lines:%0A$(tail_of_log)"
  exit 1
fi
if ! grep -q '"Yohaku"' "$out/windows.txt"; then
  echo "::error title=$label::Yohaku kept running but no window named Yohaku appeared. Last lines:%0A$(tail_of_log)"
  exit 1
fi
if awk -v s="$spread" 'BEGIN { exit !(s < 0.01) }'; then
  echo "::warning title=$label::A Yohaku window is up after ${wait_seconds}s, but the screenshot is blank"
  exit 0
fi
echo "::notice title=$label::A Yohaku window is up and painted after ${wait_seconds}s (screenshot contrast $spread)"
