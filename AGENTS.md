# AGENTS.md
## Scope
- This guide is for autonomous coding agents working in `/home/ilbey/.dotfiles`.
- Apply these rules to all subdirectories unless a deeper `AGENTS.md` overrides them.
- Prefer minimal, targeted edits; avoid broad refactors in personal config files.

## Repository Map
- `nvim/.config/nvim/` -> Neovim config (Lua, lazy.nvim, plugin specs, keymaps).
- `waybar/.config/waybar/` -> Waybar JSONC configs and CSS styles.
- `bin/scripts/` -> setup and Waybar helper scripts (POSIX shell and zsh).
- `hypr/.config/hypr/` -> Hyprland and Hyprlock configs.
- `tmux/.config/tmux/` -> tmux config.
- `zsh/.zshrc` -> shell profile.
- `ghostty/.config/ghostty/config` -> terminal config.
- `opencode/.config/opencode/` -> OpenCode agent/tooling config.

## Command Reference (Repo Root)
- Run commands from the repo root: `cd /home/ilbey/.dotfiles`.
- There is no monorepo build system; use targeted checks per area.

### Build / Sync
```bash
# Bootstrap packages + stow (system-level, can modify machine state)
zsh bin/scripts/install.sh
# Validate Neovim starts with this config
nvim --headless "+qa"
# Sync/update Neovim plugins and run plugin build hooks
nvim --headless "+Lazy! sync" +qa
# Launch Waybar managed popups/tools
sh bin/scripts/waybar/launch.sh
```

### Lint / Static Checks
```bash
# Lint all repo shell scripts for syntax
for f in bin/scripts/install.sh bin/scripts/waybar/*.sh; do sh -n "$f"; done
# Lint one shell script (single-target check)
sh -n bin/scripts/waybar/control.sh
# Lua syntax check for all Neovim config files
for f in nvim/.config/nvim/init.lua nvim/.config/nvim/lua/v0/*.lua nvim/.config/nvim/lua/v0/plugins/*.lua nvim/.config/nvim/after/plugin/*.lua; do luac -p "$f"; done
# Lua syntax check for one file (single-target check)
luac -p nvim/.config/nvim/lua/v0/plugins/lsp.lua
```

### Tests / Smoke Checks
- There is no formal unit-test suite in this repository right now.
- Treat syntax checks + focused smoke runs as the required validation.
```bash
# Smoke test one script (safe even if optional dependencies are missing)
sh bin/scripts/waybar/pia-status.sh
# Smoke test another script with graceful fallback behavior
sh bin/scripts/waybar/git-context.sh
# Headless Neovim smoke test
nvim --headless "+qa"
```

### Single-Test Guidance
- Shell: `sh -n path/to/script.sh` for one syntax check, or `sh path/to/script.sh` for one runtime smoke test.
- Lua: `luac -p path/to/file.lua` for one syntax check.
- Neovim startup regression: `nvim --headless "+qa"` is the fastest repo-level sanity test.

### Optional Tools (if installed)
```bash
# Better shell lint (not currently guaranteed in environment)
shellcheck bin/scripts/install.sh bin/scripts/waybar/*.sh
# Shell formatting
shfmt -w bin/scripts/install.sh bin/scripts/waybar/*.sh
# Lua formatting
stylua nvim/.config/nvim
```

## Code Style Rules
## General
- Keep edits small and local to the affected subsystem.
- Preserve existing file format/comments unless they are wrong or misleading.
- Do not rewrite large sections just to normalize style.
- Never hardcode secrets, tokens, hostnames, or private keys.
- Respect `.gitignore`: avoid committing `*.local`, `*.private`, or `/secrets/`.
- Keep user-specific absolute paths untouched unless the task explicitly asks to change them.

## Lua (Neovim)
### File Placement
- Core startup/options/keymaps: `nvim/.config/nvim/lua/v0/`.
- Plugin specs (lazy.nvim): `nvim/.config/nvim/lua/v0/plugins/*.lua`.
- Post-load runtime config: `nvim/.config/nvim/after/plugin/*.lua`.

### Imports and Module Usage
- Put `local ... = require("...")` at the top of each Lua file.
- Use locals for required modules; avoid creating globals.
- Prefer one responsibility per file (spec vs runtime config separation).
- Use `pcall(require, "module")` only for truly optional dependencies.

### Formatting and Structure
- Keep indentation consistent per file; prefer 4 spaces in new/reworked blocks.
- Keep multiline tables trailing-comma friendly.
- Use one blank line between logical blocks; avoid vertical noise.
- Group keymaps/options by feature area.

### Types and API Contracts
- Lua is dynamic here; annotate only non-obvious table shapes/expectations.
- Prefer explicit names over short ambiguous locals.
- Keep plugin `opts`/`config` keys aligned with upstream plugin docs.

### Naming
- Lua modules/files: lowercase and follow existing layout (`v0`, `plugins`, `after/plugin`).
- Variables/functions: `snake_case`.
- Constants: `UPPER_SNAKE_CASE` when truly constant.

### Error Handling
- Fail fast for required dependencies.
- Gracefully degrade optional features with guards and early returns.
- For user-facing failures, use `vim.notify(...)` or clear error messages.

## Shell Scripts (`bin/scripts`)
### Interpreter and Safety
- Waybar helper scripts stay POSIX `sh` (`#!/usr/bin/env sh`).
- Keep `set -eu` at the top unless there is a strong reason not to.
- Use `#!/usr/bin/env zsh` only when zsh features are required (`install.sh`).

### Formatting
- Use 4-space indentation in shell files.
- Prefer `printf` over `echo` for predictable output.
- Quote variable expansions: `"$VAR"`.
- Keep functions focused and favor early exits.

### Naming
- Function names: `snake_case`.
- Environment/config variables: `UPPER_SNAKE_CASE`.
- Script filenames: `kebab-case.sh`.

### Error Handling
- Check optional binaries with `command -v ... >/dev/null 2>&1`.
- Use `|| true` for non-critical side effects (notifications, best-effort cleanup).
- Print actionable stderr messages for invalid args and fatal failures.

## JSONC / CSS / Desktop Configs
- Waybar JSONC uses 4-space indentation and may include trailing commas/comments.
- Keep module keys and names stable unless behavior intentionally changes.
- Preserve icon glyphs, spacing tokens, and command strings exactly.
- In CSS, prefer existing `@define-color` tokens over introducing random hardcoded colors.
- In Hypr/tmux/ghostty configs, match current declarative style and spacing.

## Cursor / Copilot Rule Files
- Checked repository for agent rule files:
  - `.cursor/rules/` -> not present
  - `.cursorrules` -> not present
  - `.github/copilot-instructions.md` -> not present
- If these files are added later, treat them as higher-priority instructions.

## Change Validation Checklist
- Run syntax/lint checks for only the files you touched.
- Run at least one smoke command relevant to your changes.
- Keep paths, script names, and keybindings consistent with existing config references.
- Do not remove user customizations unless explicitly requested.
- Summarize what changed and how you validated it.
