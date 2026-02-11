#!/usr/bin/env sh

set -eu

if ! command -v piactl >/dev/null 2>&1; then
    printf '%s\n' "VPN N/A"
    exit 0
fi

STATE="$(piactl get connectionstate 2>/dev/null || true)"
REGION="$(piactl get region 2>/dev/null || true)"

if [ -z "$STATE" ]; then
    printf '%s\n' "VPN unknown"
    exit 0
fi

if [ "$STATE" = "Connected" ]; then
    printf '%s\n' "VPN ${STATE} ${REGION}"
else
    printf '%s\n' "VPN ${STATE}"
fi
