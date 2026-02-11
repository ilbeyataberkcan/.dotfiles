#!/usr/bin/env sh

set -eu

if command -v bw >/dev/null 2>&1; then
    if bw lock >/dev/null 2>&1; then
        if command -v notify-send >/dev/null 2>&1; then
            notify-send "Waybar" "Bitwarden vault locked"
        fi
        exit 0
    fi
fi

if command -v notify-send >/dev/null 2>&1; then
    notify-send "Waybar" "Bitwarden lock requires an active bw CLI session"
fi
