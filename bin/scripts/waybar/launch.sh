#!/usr/bin/env sh

set -eu

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/waybar"
RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp}/waybar-multi"
POPUP_EDGE="${POPUP_EDGE:-top}"
SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
LISTENER_SCRIPT="$SCRIPT_DIR/workspace-popup-listener.sh"

mkdir -p "$RUNTIME_DIR"

stop_managed_bar() {
    BAR_NAME="$1"
    PID_FILE="$RUNTIME_DIR/${BAR_NAME}.pid"

    if [ -f "$PID_FILE" ]; then
        PID="$(cat "$PID_FILE")"
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
        fi
        rm -f "$PID_FILE"
    fi
}

start_bar() {
    BAR_NAME="$1"
    CONFIG_FILE="$2"
    STYLE_FILE="$3"

    stop_managed_bar "$BAR_NAME"
    waybar -c "$CONFIG_FILE" -s "$STYLE_FILE" >/dev/null 2>&1 &
    PID="$!"

    printf '%s\n' "$PID" > "$RUNTIME_DIR/${BAR_NAME}.pid"
    printf '%s\n' "hidden" > "$RUNTIME_DIR/${BAR_NAME}.state"
}

POPUP_CONFIG="$CONFIG_DIR/config-workspace-popup.jsonc"
POPUP_STYLE="$CONFIG_DIR/popup-top.css"
if [ "$POPUP_EDGE" = "bottom" ]; then
    POPUP_CONFIG="$CONFIG_DIR/config-workspace-popup-bottom.jsonc"
    POPUP_STYLE="$CONFIG_DIR/popup-bottom.css"
fi

start_bar "workspace-popup" "$POPUP_CONFIG" "$POPUP_STYLE"
start_bar "system-resources" "$CONFIG_DIR/config-system-resources.jsonc" "$CONFIG_DIR/style.css"
start_bar "tray-actions" "$CONFIG_DIR/config-tray-actions.jsonc" "$CONFIG_DIR/style.css"
start_bar "datetime-quick" "$CONFIG_DIR/config-datetime-quick.jsonc" "$CONFIG_DIR/style.css"

pkill -f "workspace-popup-listener.sh" 2>/dev/null || true
nohup "$LISTENER_SCRIPT" >/tmp/waybar-workspace-listener.log 2>&1 &
