#!/usr/bin/env bash
# Screenshot a page of the Fermat dev server: shot.sh <path-and-query> <width> <height> <out.png>
# e.g. shot.sh "/plan?preview=voting" 390 2400 /tmp/voting-mobile.png
set -euo pipefail
HS=$(ls -d ~/.cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell | head -1)
timeout 120 "$HS" --no-sandbox --disable-gpu --hide-scrollbars --window-size="$2,$3" --virtual-time-budget=15000 --screenshot="$4" "http://127.0.0.1:3005$1" 2>&1 | grep -v '^\[' | tail -1
