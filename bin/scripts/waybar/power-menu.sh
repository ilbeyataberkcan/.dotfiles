#!/usr/bin/env sh

set -eu

OPTIONS="lock\nlogout\nsuspend\nreboot\nshutdown"

select_action() {
    if command -v wofi >/dev/null 2>&1; then
        printf '%b\n' "$OPTIONS" | wofi --dmenu --prompt "Power"
        return
    fi

    if command -v fuzzel >/dev/null 2>&1; then
        printf '%b\n' "$OPTIONS" | fuzzel --dmenu --prompt "Power"
        return
    fi

    if command -v rofi >/dev/null 2>&1; then
        printf '%b\n' "$OPTIONS" | rofi -dmenu -p "Power"
        return
    fi

    printf '%s\n' ""
}

ACTION="$(select_action || true)"

case "$ACTION" in
    lock)
        loginctl lock-session
        ;;
    logout)
        hyprctl dispatch exit
        ;;
    suspend)
        systemctl suspend
        ;;
    reboot)
        systemctl reboot
        ;;
    shutdown)
        systemctl poweroff
        ;;
    *)
        ;;
esac
