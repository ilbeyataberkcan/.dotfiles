#!/usr/bin/env sh

set -eu

BAR_NAME="${1:-}"
ACTION="${2:-toggle}"

if [ -z "$BAR_NAME" ]; then
    printf '%s\n' "Usage: $0 <bar-name> [show|hide|toggle|peek]" >&2
    exit 1
fi

case "$BAR_NAME" in
    workspace-popup|system-resources|tray-actions|datetime-quick) ;;
    *)
        printf '%s\n' "Unknown bar: $BAR_NAME" >&2
        exit 1
        ;;
esac

RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp}/waybar-multi"
PID_FILE="$RUNTIME_DIR/${BAR_NAME}.pid"
STATE_FILE="$RUNTIME_DIR/${BAR_NAME}.state"
MANAGED_BARS="workspace-popup system-resources tray-actions datetime-quick"

if [ ! -f "$PID_FILE" ]; then
    printf '%s\n' "Bar PID file not found: $PID_FILE" >&2
    exit 1
fi

PID="$(cat "$PID_FILE")"
if ! kill -0 "$PID" 2>/dev/null; then
    printf '%s\n' "Bar process is not running: $BAR_NAME" >&2
    exit 1
fi

show_bar() {
    kill -USR1 "$PID"
    printf '%s\n' "visible" > "$STATE_FILE"
}

hide_bar() {
    kill -USR2 "$PID"
    printf '%s\n' "hidden" > "$STATE_FILE"
}

hide_other_bars() {
    for OTHER_BAR in $MANAGED_BARS; do
        if [ "$OTHER_BAR" = "$BAR_NAME" ]; then
            continue
        fi

        if [ "$BAR_NAME" = "workspace-popup" ] && [ "$OTHER_BAR" = "system-resources" ]; then
            continue
        fi

        OTHER_PID_FILE="$RUNTIME_DIR/${OTHER_BAR}.pid"
        OTHER_STATE_FILE="$RUNTIME_DIR/${OTHER_BAR}.state"

        if [ -f "$OTHER_PID_FILE" ]; then
            OTHER_PID="$(cat "$OTHER_PID_FILE")"
            if kill -0 "$OTHER_PID" 2>/dev/null; then
                kill -USR2 "$OTHER_PID" 2>/dev/null || true
                printf '%s\n' "hidden" > "$OTHER_STATE_FILE"
            fi
        fi
    done
}

peek_bar() {
    DURATION_MS="${WAYBAR_POPUP_MS:-900}"
    case "$DURATION_MS" in
        ''|*[!0-9]*) DURATION_MS=900 ;;
    esac

    show_bar
    (
        sleep "$(python3 -c 'import sys; print(int(sys.argv[1]) / 1000)' "$DURATION_MS")"
        hide_bar
    ) &
}

case "$ACTION" in
    show)
        hide_other_bars
        show_bar
        ;;
    hide)
        hide_bar
        ;;
    toggle)
        CURRENT="hidden"
        if [ -f "$STATE_FILE" ]; then
            CURRENT="$(cat "$STATE_FILE")"
        fi
        if [ "$CURRENT" = "visible" ]; then
            hide_bar
        else
            hide_other_bars
            show_bar
        fi
        ;;
    peek)
        hide_other_bars
        peek_bar
        ;;
    *)
        printf '%s\n' "Unknown action: $ACTION" >&2
        exit 1
        ;;
esac
