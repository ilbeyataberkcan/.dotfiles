# Project Bootstrap Guide (Brand + Tokens + Preflight)

Use this when starting a new project so visual checks have clear local constraints.

## Quick bootstrap command
Run from your target project root:

```bash
mkdir -p .opencode && cp \
  ~/.config/opencode/templates/brand-guidelines.template.jsonc \
  ~/.config/opencode/templates/design-token-contract.template.jsonc \
  ~/.config/opencode/templates/visual-preflight-policy.template.jsonc \
  .opencode/
```

## What to edit first
1. `.opencode/brand-guidelines.template.jsonc`
   - Set brand name, personality, forbidden traits, and shape language constraints.
2. `.opencode/design-token-contract.template.jsonc`
   - Replace placeholders with real project tokens.
3. `.opencode/visual-preflight-policy.template.jsonc`
   - Confirm WCAG/APCA policy and required output artifacts.

## Recommended rename (optional)
You may rename templates after editing:

```bash
mv .opencode/brand-guidelines.template.jsonc .opencode/brand-guidelines.jsonc
mv .opencode/design-token-contract.template.jsonc .opencode/design-token-contract.jsonc
mv .opencode/visual-preflight-policy.template.jsonc .opencode/visual-preflight-policy.jsonc
```

## Team workflow tip
- Commit these `.opencode` files with the project so all collaborators use the same visual constraints.
