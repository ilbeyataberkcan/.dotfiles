#!/usr/bin/env zsh
# Pre-stage helper for the `claude` stow package.
#
# Claude Code writes to several paths under ~/.claude/ at first run (CLAUDE.md,
# settings.json, memory/). On a machine that already has Claude Code installed,
# these paths exist as regular files/dirs and will conflict when `stow claude`
# tries to lay down symlinks. This script backs up any pre-existing real files
# at the managed paths so stow can proceed cleanly. Existing symlinks (already
# stow-managed) and absent paths are left alone.
#
# Backups land in ~/.claude/.dotfiles-backup-YYYYMMDD-HHMMSS/ for manual merge.
#
# Invoked by bin/scripts/install.sh before stow_dotfiles runs.

set -euo pipefail

CLAUDE_HOME="${HOME}/.claude"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="${CLAUDE_HOME}/.dotfiles-backup-${TS}"

managed=(
    "${CLAUDE_HOME}/CLAUDE.md"
    "${CLAUDE_HOME}/settings.json"
    "${CLAUDE_HOME}/memory"
)

# Ensure ~/.claude/ exists so stow has a target parent. Claude Code creates this
# on first run; pre-creating it here lets the dotfiles installer work even on a
# machine where Claude Code has never been launched.
mkdir -p "$CLAUDE_HOME"

backed_up=0
for p in "${managed[@]}"; do
    if [ -L "$p" ]; then
        continue
    fi
    if [ ! -e "$p" ]; then
        continue
    fi
    if [ "$backed_up" -eq 0 ]; then
        mkdir -p "$BACKUP"
    fi
    rel=$(basename "$p")
    mv "$p" "$BACKUP/$rel"
    printf '  [..] Backed up existing %s → %s/%s\n' "$p" "$BACKUP" "$rel"
    backed_up=1
done

if [ "$backed_up" -eq 1 ]; then
    printf '  [OK] claude stow-prep: pre-existing conflicts moved to %s\n' "$BACKUP"
else
    printf '  [OK] claude stow-prep: no conflicts; stow can proceed cleanly\n'
fi
