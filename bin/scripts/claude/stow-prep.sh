#!/usr/bin/env zsh
# Pre-stage helper for the `claude` stow package.
#
# Claude Code writes to several paths under ~/.claude/ at first run (CLAUDE.md,
# settings.json, memory/, projects/<sanitized-path>/memory/). On a machine that
# already has Claude Code installed, these paths exist as regular files/dirs and
# will conflict when `stow claude` tries to lay down symlinks. This script:
#
#   1. Backs up any pre-existing real top-level managed paths (CLAUDE.md,
#      settings.json, ~/.claude/memory) that conflict with stow.
#   2. Promotes each real ~/.claude/projects/<project>/memory/ directory into
#      the dotfiles tree at ~/.dotfiles/claude/.claude/projects/<project>/memory/
#      so the next `stow --restow claude` lands a symlink in its place. Project
#      session transcripts (UUID dirs + .jsonl files) stay untouched — only the
#      memory/ subdir is moved.
#
# Backups land in ~/.claude/.dotfiles-backup-YYYYMMDD-HHMMSS/ for manual merge.
#
# Invoked by bin/scripts/install.sh before stow_dotfiles runs. Idempotent:
# re-runs skip already-managed symlinks and absent paths.

set -euo pipefail

CLAUDE_HOME="${HOME}/.claude"
DOTFILES_CLAUDE_ROOT="${HOME}/.dotfiles/claude/.claude"
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

# Promote per-project memory directories into the dotfiles tree. For each
# ~/.claude/projects/<project>/memory/ that's a real dir (not a symlink), move
# it under the dotfiles tree so stow can restore it as a symlink. Projects
# without a memory/ subdir are skipped (Claude Code creates it lazily on first
# memory write).
promoted=0
if [ -d "${CLAUDE_HOME}/projects" ]; then
    for proj_dir in "${CLAUDE_HOME}/projects"/*/; do
        [ -d "$proj_dir" ] || continue
        proj_name=$(basename "$proj_dir")
        mem_src="${proj_dir}memory"
        mem_dst_parent="${DOTFILES_CLAUDE_ROOT}/projects/${proj_name}"
        mem_dst="${mem_dst_parent}/memory"

        # Already a symlink (previously promoted)? Skip.
        if [ -L "$mem_src" ]; then
            continue
        fi
        # No memory dir yet? Skip — Claude will create one on next memory write.
        if [ ! -d "$mem_src" ]; then
            continue
        fi
        # Already promoted to dotfiles but symlink missing on this machine?
        # Skip the move (don't clobber the dotfiles version); stow will create
        # the symlink. If the user wants to merge, they can do it manually.
        if [ -d "$mem_dst" ]; then
            printf '  [..] Memory already in dotfiles for %s — leaving local copy at %s for manual merge\n' \
                "$proj_name" "$mem_src.local-${TS}"
            mv "$mem_src" "${mem_src}.local-${TS}"
            promoted=1
            continue
        fi

        mkdir -p "$mem_dst_parent"
        mv "$mem_src" "$mem_dst"
        printf '  [..] Promoted %s → %s\n' "$mem_src" "$mem_dst"
        promoted=1
    done
fi

if [ "$backed_up" -eq 1 ]; then
    printf '  [OK] claude stow-prep: pre-existing top-level conflicts moved to %s\n' "$BACKUP"
fi
if [ "$promoted" -eq 1 ]; then
    printf '  [OK] claude stow-prep: per-project memory dirs promoted into dotfiles\n'
fi
if [ "$backed_up" -eq 0 ] && [ "$promoted" -eq 0 ]; then
    printf '  [OK] claude stow-prep: no conflicts; stow can proceed cleanly\n'
fi
