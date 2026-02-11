#!/usr/bin/env sh

set -eu

BAT_DIR="$(ls -d /sys/class/power_supply/BAT* 2>/dev/null | head -n1)"

if [ -z "$BAT_DIR" ]; then
    notify-send "Battery" "No battery detected" 2>/dev/null || true
    exit 0
fi

CAPACITY="$(cat "$BAT_DIR/capacity" 2>/dev/null || printf 'unknown')"
STATUS="$(cat "$BAT_DIR/status" 2>/dev/null || printf 'unknown')"

POWER=""
if [ -r "$BAT_DIR/power_now" ]; then
    POWER_UW="$(cat "$BAT_DIR/power_now")"
    POWER="$(awk "BEGIN {printf \"%.1f\", $POWER_UW / 1000000}")W"
elif [ -r "$BAT_DIR/current_now" ] && [ -r "$BAT_DIR/voltage_now" ]; then
    CURRENT="$(cat "$BAT_DIR/current_now")"
    VOLTAGE="$(cat "$BAT_DIR/voltage_now")"
    POWER="$(awk "BEGIN {printf \"%.1f\", ($CURRENT * $VOLTAGE) / 1000000000000}")W"
fi

ENERGY_NOW=""
ENERGY_FULL=""
if [ -r "$BAT_DIR/energy_now" ] && [ -r "$BAT_DIR/energy_full" ]; then
    ENERGY_NOW="$(cat "$BAT_DIR/energy_now")"
    ENERGY_FULL="$(cat "$BAT_DIR/energy_full")"
fi

TIME_LEFT=""
if [ -n "$ENERGY_NOW" ] && [ -n "$POWER" ] && [ "$POWER" != "0.0W" ]; then
    POWER_UW_VAL="${POWER_UW:-0}"
    if [ "$POWER_UW_VAL" -gt 0 ]; then
        case "$STATUS" in
            Discharging)
                MINS="$(awk "BEGIN {printf \"%d\", ($ENERGY_NOW / $POWER_UW_VAL) * 60}")"
                HOURS="$((MINS / 60))"
                REMAINING_MINS="$((MINS % 60))"
                TIME_LEFT="${HOURS}h ${REMAINING_MINS}m remaining"
                ;;
            Charging)
                ENERGY_DIFF="$((ENERGY_FULL - ENERGY_NOW))"
                MINS="$(awk "BEGIN {printf \"%d\", ($ENERGY_DIFF / $POWER_UW_VAL) * 60}")"
                HOURS="$((MINS / 60))"
                REMAINING_MINS="$((MINS % 60))"
                TIME_LEFT="${HOURS}h ${REMAINING_MINS}m to full"
                ;;
        esac
    fi
fi

MSG="${CAPACITY}%  ·  ${STATUS}"
if [ -n "$POWER" ]; then
    MSG="${MSG}  ·  ${POWER}"
fi
if [ -n "$TIME_LEFT" ]; then
    MSG="${MSG}\n${TIME_LEFT}"
fi

notify-send "Battery" "$MSG" 2>/dev/null || true
