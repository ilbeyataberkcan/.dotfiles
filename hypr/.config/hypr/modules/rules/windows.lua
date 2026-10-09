-- Ignore maximize requests from apps.
hl.window_rule({
    name  = "suppress-maximize",
    match = { class = ".*" },

    suppress_event = "maximize",
})

-- Prevent Hyprland from managing/centering Unreal Engine popups.
hl.window_rule({
    name  = "fix-unreal-popups",
    match = { class = "^(UnrealEditor)$", title = "^\\w*$" },

    no_initial_focus = true,
    no_anim          = true,
})
