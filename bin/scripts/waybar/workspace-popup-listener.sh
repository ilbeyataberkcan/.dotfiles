#!/usr/bin/env sh

set -eu

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
CONTROL_SCRIPT="$SCRIPT_DIR/control.sh"
RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp}/waybar-multi"
TIMER_PID_FILE="$RUNTIME_DIR/workspace-popup-timer.pid"
POPUP_MS="${WAYBAR_POPUP_MS:-900}"

case "$POPUP_MS" in
    ''|*[!0-9]*) POPUP_MS=900 ;;
esac

mkdir -p "$RUNTIME_DIR"

restart_hide_timer() {
    if [ -f "$TIMER_PID_FILE" ]; then
        OLD_PID="$(cat "$TIMER_PID_FILE")"
        if kill -0 "$OLD_PID" 2>/dev/null; then
            kill "$OLD_PID" 2>/dev/null || true
        fi
        rm -f "$TIMER_PID_FILE"
    fi

    (
        sleep "$(python3 -c 'import sys; print(int(sys.argv[1]) / 1000)' "$POPUP_MS")"
        "$CONTROL_SCRIPT" workspace-popup hide >/dev/null 2>&1 || true
    ) &

    printf '%s\n' "$!" > "$TIMER_PID_FILE"
}

get_workspace_id() {
    if ! command -v hyprctl >/dev/null 2>&1; then
        printf '%s\n' ""
        return
    fi

    JSON_OUTPUT="$(hyprctl -j activeworkspace 2>/dev/null || true)"
    if [ -z "$JSON_OUTPUT" ]; then
        printf '%s\n' ""
        return
    fi

    python3 -c 'import json,sys
try:
    data = json.loads(sys.argv[1])
    print(data.get("id", ""))
except Exception:
    print("")' "$JSON_OUTPUT"
}

LAST_WORKSPACE_ID=""

while :; do
    CURRENT_WORKSPACE_ID="$(get_workspace_id)"

    if [ -n "$CURRENT_WORKSPACE_ID" ] && [ "$CURRENT_WORKSPACE_ID" != "$LAST_WORKSPACE_ID" ]; then
        "$CONTROL_SCRIPT" workspace-popup show >/dev/null 2>&1 || true
        restart_hide_timer
        LAST_WORKSPACE_ID="$CURRENT_WORKSPACE_ID"
    fi

    sleep 0.15
done
