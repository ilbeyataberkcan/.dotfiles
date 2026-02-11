#!/usr/bin/env sh

set -eu

if command -v hyprctl >/dev/null 2>&1; then
    hyprctl dispatch focuswindow 'class:^(bitwarden|Bitwarden)$' >/dev/null 2>&1 || true
fi

if ! pgrep -x bitwarden >/dev/null 2>&1 && command -v bitwarden >/dev/null 2>&1; then
    bitwarden >/dev/null 2>&1 &
fi

if command -v notify-send >/dev/null 2>&1; then
    notify-send "Waybar" "Bitwarden opened/focused"
fi
