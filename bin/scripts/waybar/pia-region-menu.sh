#!/usr/bin/env sh

set -eu

if ! command -v piactl >/dev/null 2>&1; then
    exit 0
fi

REGIONS="$(piactl get regions 2>/dev/null || true)"
if [ -z "$REGIONS" ]; then
    exit 0
fi

pick_with_wofi() {
    printf '%s\n' "$REGIONS" | wofi --dmenu --prompt "PIA Region"
}

pick_with_fuzzel() {
    printf '%s\n' "$REGIONS" | fuzzel --dmenu --prompt "PIA Region"
}

pick_with_rofi() {
    printf '%s\n' "$REGIONS" | rofi -dmenu -p "PIA Region"
}

SELECTED=""
if command -v wofi >/dev/null 2>&1; then
    SELECTED="$(pick_with_wofi || true)"
elif command -v fuzzel >/dev/null 2>&1; then
    SELECTED="$(pick_with_fuzzel || true)"
elif command -v rofi >/dev/null 2>&1; then
    SELECTED="$(pick_with_rofi || true)"
else
    exit 0
fi

if [ -z "$SELECTED" ]; then
    exit 0
fi

piactl set region "$SELECTED" >/dev/null 2>&1 || exit 0
piactl connect >/dev/null 2>&1 || true
