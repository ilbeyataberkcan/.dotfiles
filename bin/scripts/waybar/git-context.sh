#!/usr/bin/env sh

set -eu

if ! command -v hyprctl >/dev/null 2>&1; then
    printf '%s\n' "Repo: unavailable"
    exit 0
fi

ACTIVE_PID="$(hyprctl -j activewindow 2>/dev/null | python3 -c 'import json,sys
try:
    data = json.load(sys.stdin)
    print(data.get("pid", ""))
except Exception:
    print("")')"

WORK_DIR=""
if [ -n "$ACTIVE_PID" ] && [ -d "/proc/$ACTIVE_PID" ]; then
    WORK_DIR="$(readlink -f "/proc/$ACTIVE_PID/cwd" 2>/dev/null || true)"
fi

if [ -z "$WORK_DIR" ] || [ ! -d "$WORK_DIR" ]; then
    WORK_DIR="$PWD"
fi

REPO_ROOT="$(git -C "$WORK_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ]; then
    printf '%s\n' "Repo: none"
    exit 0
fi

BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
ROOT_NAME="$(basename "$REPO_ROOT")"

if [ -n "$BRANCH" ]; then
    printf '%s\n' "Repo: $ROOT_NAME ($BRANCH)"
else
    printf '%s\n' "Repo: $ROOT_NAME"
fi
