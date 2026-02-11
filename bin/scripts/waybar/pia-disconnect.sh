#!/usr/bin/env sh

set -eu

if command -v piactl >/dev/null 2>&1; then
    piactl disconnect >/dev/null 2>&1 || true
fi

if command -v notify-send >/dev/null 2>&1; then
    notify-send "Waybar" "PIA disconnect requested"
fi
