#!/usr/bin/env sh

set -eu

METRIC="${1:-}"
RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp}/waybar-multi"
GRAPH_DIR="$RUNTIME_DIR/graphs"
STATE_DIR="$RUNTIME_DIR/state"

mkdir -p "$GRAPH_DIR" "$STATE_DIR"

clamp() {
    VALUE="$1"
    if [ "$VALUE" -lt 0 ]; then
        printf '%s\n' "0"
    elif [ "$VALUE" -gt 100 ]; then
        printf '%s\n' "100"
    else
        printf '%s\n' "$VALUE"
    fi
}

cpu_value() {
    STATE_FILE="$STATE_DIR/cpu.prev"
    PREV_TOTAL=0
    PREV_IDLE=0

    if [ -f "$STATE_FILE" ]; then
        PREV_TOTAL="$(awk '{print $1}' "$STATE_FILE" 2>/dev/null || printf '0')"
        PREV_IDLE="$(awk '{print $2}' "$STATE_FILE" 2>/dev/null || printf '0')"
    fi

    CPU_LINE="$(awk '/^cpu /{print $2,$3,$4,$5,$6,$7,$8,$9,$10}' /proc/stat)"
    TOTAL="$(printf '%s\n' "$CPU_LINE" | awk '{s=0; for(i=1;i<=NF;i++) s+=$i; print s}')"
    IDLE="$(printf '%s\n' "$CPU_LINE" | awk '{print $4+$5}')"

    printf '%s %s\n' "$TOTAL" "$IDLE" > "$STATE_FILE"

    if [ "$PREV_TOTAL" -eq 0 ] || [ "$TOTAL" -le "$PREV_TOTAL" ]; then
        printf '%s\n' "0"
        return
    fi

    DELTA_TOTAL=$((TOTAL - PREV_TOTAL))
    DELTA_IDLE=$((IDLE - PREV_IDLE))
    USED=$((100 * (DELTA_TOTAL - DELTA_IDLE) / DELTA_TOTAL))
    clamp "$USED"
}

memory_value() {
    awk '
        /^MemTotal:/ {t=$2}
        /^MemAvailable:/ {a=$2}
        END {
            if (t <= 0) { print 0; exit }
            used = int(((t-a)/t)*100)
            if (used < 0) used = 0
            if (used > 100) used = 100
            print used
        }
    ' /proc/meminfo
}

temp_value() {
    if [ -r /sys/class/thermal/thermal_zone0/temp ]; then
        VALUE="$(awk '{print int($1/1000)}' /sys/class/thermal/thermal_zone0/temp)"
        clamp "$VALUE"
        return
    fi
    printf '%s\n' "0"
}

battery_value() {
    BAT_PATH="$(ls /sys/class/power_supply/BAT*/capacity 2>/dev/null | awk 'NR==1 {print $1}')"
    if [ -n "$BAT_PATH" ] && [ -r "$BAT_PATH" ]; then
        VALUE="$(awk '{print int($1)}' "$BAT_PATH")"
        clamp "$VALUE"
        return
    fi
    printf '%s\n' "0"
}

label_for() {
    case "$1" in
        cpu) printf '%s\n' "CPU" ;;
        memory) printf '%s\n' "RAM" ;;
        temp) printf '%s\n' "TMP" ;;
        battery) printf '%s\n' "BAT" ;;
        *) printf '%s\n' "MET" ;;
    esac
}

value_for() {
    case "$1" in
        cpu) cpu_value ;;
        memory) memory_value ;;
        temp) temp_value ;;
        battery) battery_value ;;
        *) printf '%s\n' "0" ;;
    esac
}

sparkline() {
    awk '
        BEGIN {
            split("▁ ▂ ▃ ▄ ▅ ▆ ▇ █", b, " ")
        }
        {
            v = $1 + 0
            if (v < 0) v = 0
            if (v > 100) v = 100
            idx = int((v * 7) / 100) + 1
            if (idx < 1) idx = 1
            if (idx > 8) idx = 8
            printf "%s", b[idx]
        }
        END { printf "" }
    '
}

VALUE="$(value_for "$METRIC")"
GRAPH_FILE="$GRAPH_DIR/$METRIC.values"

{
    if [ -f "$GRAPH_FILE" ]; then
        awk 'NR>1 {print prev} {prev=$0} END {if (NR>0) print prev}' "$GRAPH_FILE" | awk 'NR<=15 {print}'
    fi
    printf '%s\n' "$VALUE"
} > "$GRAPH_FILE.tmp"

mv "$GRAPH_FILE.tmp" "$GRAPH_FILE"

GRAPH="$(awk '{print}' "$GRAPH_FILE" | sparkline)"
LABEL="$(label_for "$METRIC")"

GRAPH_PADDED="$(printf '%-16s' "$GRAPH" | sed 's/ /▁/g')"

python3 -c 'import json,sys
label = sys.argv[1]
graph = sys.argv[2]
value = sys.argv[3]
text = f"{label}\n[{graph}] {value}%"
tooltip = f"{label}: {value}%"
print(json.dumps({"text": text, "tooltip": tooltip, "class": ["metric-card", label.lower()]}))
' "$LABEL" "$GRAPH_PADDED" "$VALUE"
