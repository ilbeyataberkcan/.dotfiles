#!/usr/bin/env sh

set -eu

if ! command -v nmcli >/dev/null 2>&1; then
    exit 0
fi

WIFI_STATE="$(nmcli radio wifi 2>/dev/null || printf 'unknown')"

if [ "$WIFI_STATE" = "disabled" ]; then
    CHOICES="Enable WiFi"
else
    NETWORKS="$(nmcli -t -f SSID,SIGNAL,SECURITY device wifi list 2>/dev/null | awk -F: '
        $1 != "" && !seen[$1]++ {
            sec = ($3 != "") ? " " : ""
            printf "%s  %s%%%s\n", $1, $2, sec
        }
    ')"

    ACTIVE="$(nmcli -t -f NAME,TYPE connection show --active 2>/dev/null | awk -F: '$2 == "802-11-wireless" {print $1; exit}')"
    CONNECTED=""
    if [ -n "$ACTIVE" ]; then
        CONNECTED="Disconnect ($ACTIVE)"
    fi

    CHOICES=""
    if [ -n "$CONNECTED" ]; then
        CHOICES="$CONNECTED"
    fi
    if [ -n "$NETWORKS" ]; then
        if [ -n "$CHOICES" ]; then
            CHOICES="$(printf '%s\n%s' "$CHOICES" "$NETWORKS")"
        else
            CHOICES="$NETWORKS"
        fi
    fi
    CHOICES="$(printf '%s\nDisable WiFi' "$CHOICES")"
fi

pick() {
    if command -v wofi >/dev/null 2>&1; then
        printf '%s\n' "$CHOICES" | wofi --dmenu --prompt "Network"
    elif command -v fuzzel >/dev/null 2>&1; then
        printf '%s\n' "$CHOICES" | fuzzel --dmenu --prompt "Network"
    elif command -v rofi >/dev/null 2>&1; then
        printf '%s\n' "$CHOICES" | rofi -dmenu -p "Network"
    else
        exit 0
    fi
}

SELECTED="$(pick || true)"

if [ -z "$SELECTED" ]; then
    exit 0
fi

case "$SELECTED" in
    "Enable WiFi")
        nmcli radio wifi on >/dev/null 2>&1
        notify-send "Network" "WiFi enabled" 2>/dev/null || true
        ;;
    "Disable WiFi")
        nmcli radio wifi off >/dev/null 2>&1
        notify-send "Network" "WiFi disabled" 2>/dev/null || true
        ;;
    Disconnect\ \(*)
        nmcli connection down "$ACTIVE" >/dev/null 2>&1 || true
        notify-send "Network" "Disconnected from $ACTIVE" 2>/dev/null || true
        ;;
    *)
        SSID="$(printf '%s' "$SELECTED" | sed 's/  [0-9]*%.*$//')"
        if [ -z "$SSID" ]; then
            exit 0
        fi

        KNOWN="$(nmcli -t -f NAME connection show 2>/dev/null | grep -Fx "$SSID" || true)"
        if [ -n "$KNOWN" ]; then
            nmcli connection up "$SSID" >/dev/null 2>&1 || true
        else
            nmcli device wifi connect "$SSID" >/dev/null 2>&1 || {
                notify-send "Network" "Failed to connect to $SSID — may need password" 2>/dev/null || true
                exit 0
            }
        fi
        notify-send "Network" "Connecting to $SSID" 2>/dev/null || true
        ;;
esac
